from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, InterviewSession, User
import ollama
import re
from datetime import datetime
from sqlalchemy import func
from cachetools import TTLCache

user_bp = Blueprint('user', __name__)
question_cache = TTLCache(maxsize=100, ttl=3600)

def extract_scores(feedback_text):
    scores = {'relevance': 0, 'clarity': 0, 'correctness': 0}
    rel_match = re.search(r'Relevance\s*(\d+)/5', feedback_text, re.I)
    cla_match = re.search(r'Clarity\s*(\d+)/5', feedback_text, re.I)
    cor_match = re.search(r'Correctness\s*(\d+)/5', feedback_text, re.I)
    if rel_match: scores['relevance'] = int(rel_match.group(1))
    if cla_match: scores['clarity'] = int(cla_match.group(1))
    if cor_match: scores['correctness'] = int(cor_match.group(1))
    return scores

def generate_question(role, difficulty, category):
    model_name = 'tinyllama'
    diff_prompt = {"Easy": "basic", "Medium": "standard", "Hard": "challenging"}.get(difficulty, "standard")
    cat_part = f" Focus on {category}." if category != "General" else ""
    prompt = f"You are a technical interviewer. Ask a {diff_prompt} interview question for {role}.{cat_part} Keep under 30 words. Return only the question."
    try:
        response = ollama.chat(model=model_name, messages=[{'role': 'user', 'content': prompt}])
        return response['message']['content'].strip()
    except:
        response = ollama.chat(model='llama3.2', messages=[{'role': 'user', 'content': prompt}])
        return response['message']['content'].strip()

def evaluate_answer_with_ai(question, answer, difficulty):
    model_name = 'tinyllama'
    prompt = f"Evaluate this {difficulty} answer.\nQ: {question}\nA: {answer}\nGive scores: Relevance/5, Clarity/5, Correctness/5 and 2-3 sentences of feedback."
    try:
        response = ollama.chat(model=model_name, messages=[{'role': 'user', 'content': prompt}])
        return response['message']['content'].strip()
    except:
        response = ollama.chat(model='llama3.2', messages=[{'role': 'user', 'content': prompt}])
        return response['message']['content'].strip()

@user_bp.route('/api/sessions', methods=['GET'])
@jwt_required()
def api_sessions():
    user_id = get_jwt_identity()
    sessions = InterviewSession.query.filter_by(user_id=user_id).order_by(InterviewSession.started_at.desc()).all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'started_at': s.started_at.isoformat(),
        'completed_at': s.completed_at.isoformat() if s.completed_at else None,
        'current_question_index': s.current_question_index,
        'question_count': s.question_count,
        'final_avg_score': s.final_avg_score
    } for s in sessions])

@user_bp.route('/api/start_session', methods=['POST'])
@jwt_required()
def start_session():
    user_id = get_jwt_identity()
    data = request.json
    role = data.get('role', 'Python Developer')
    difficulty = data.get('difficulty', 'Medium')
    category = data.get('category', 'General')
    question_count = int(data.get('question_count', 5))
    new_session = InterviewSession(
        user_id=user_id,
        title=f"{role} - {difficulty} - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        question_count=question_count,
        difficulty=difficulty,
        category=category,
        role=role,
        started_at=datetime.utcnow()
    )
    db.session.add(new_session)
    db.session.commit()
    return jsonify({'session_id': new_session.id})

@user_bp.route('/api/next_question', methods=['GET'])
@jwt_required()
def next_question():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({'error': 'No session id'}), 400
    user_id = get_jwt_identity()
    interview_session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not interview_session:
        return jsonify({'error': 'Session not found'}), 404
    if interview_session.is_complete():
        return jsonify({'completed': True, 'session_id': interview_session.id})
    cache_key = f"{interview_session.role}_{interview_session.difficulty}_{interview_session.category}"
    if cache_key in question_cache:
        question = question_cache[cache_key]
    else:
        question = generate_question(interview_session.role, interview_session.difficulty, interview_session.category)
        question_cache[cache_key] = question
    return jsonify({
        'question': question,
        'current_q': interview_session.current_question_index + 1,
        'total_q': interview_session.question_count,
        'session_id': interview_session.id
    })

@user_bp.route('/api/submit_answer', methods=['POST'])
@jwt_required()
def submit_answer():
    data = request.json
    session_id = data.get('session_id')
    answer = data.get('answer')
    question = data.get('question')
    if not session_id or not answer or not question:
        return jsonify({'error': 'Missing data'}), 400
    user_id = get_jwt_identity()
    interview_session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not interview_session:
        return jsonify({'error': 'Session not found'}), 404
    feedback_text = evaluate_answer_with_ai(question, answer, interview_session.difficulty)
    scores = extract_scores(feedback_text)
    interview_session.add_answer(question, answer, feedback_text, scores)
    if interview_session.is_complete():
        avg_score, final_fb = interview_session.calculate_final_scores()
        interview_session.final_avg_score = avg_score
        interview_session.final_feedback = final_fb
        interview_session.completed_at = datetime.utcnow()
        db.session.commit()
    else:
        db.session.commit()
    return jsonify({
        'feedback': feedback_text,
        'completed': interview_session.is_complete(),
        'session_id': interview_session.id
    })

@user_bp.route('/api/session_data/<int:session_id>', methods=['GET'])
@jwt_required()
def api_session_data(session_id):
    user_id = get_jwt_identity()
    s = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()
    answers = s.get_answers()
    return jsonify({
        'session': {
            'title': s.title,
            'started_at': s.started_at.isoformat(),
            'completed_at': s.completed_at.isoformat() if s.completed_at else None,
            'role': s.role,
            'difficulty': s.difficulty,
            'category': s.category,
            'final_avg_score': s.final_avg_score,
            'final_feedback': s.final_feedback
        },
        'answers': answers
    })

@user_bp.route('/api/leaderboard', methods=['GET'])
@jwt_required()
def leaderboard():
    data = db.session.query(
        User.username,
        func.count(InterviewSession.id).label('session_count'),
        func.avg(InterviewSession.final_avg_score).label('avg_score')
    ).join(InterviewSession, User.id == InterviewSession.user_id)\
     .filter(InterviewSession.completed_at.isnot(None))\
     .filter(User.role_id == 2)\
     .group_by(User.id, User.username)\
     .having(func.count(InterviewSession.id) > 0)\
     .order_by(func.avg(InterviewSession.final_avg_score).desc())\
     .all()
    return jsonify([{
        'username': row.username,
        'avg_score': round(row.avg_score or 0, 2),
        'sessions': row.session_count
    } for row in data])