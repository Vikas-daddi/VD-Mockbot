from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import db, InterviewSession, User
import requests
import os
import re
import json
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

def parse_llm_json(response_text):
    match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass
    return None

def generate_question(role, difficulty, category, fmt):
    diff_prompt = {"Easy": "basic", "Medium": "standard", "Hard": "challenging"}.get(difficulty, "standard")
    cat_part = f" Focus on {category}." if category != "General" else ""
    
    if fmt == "MCQ":
        prompt = (
            f"You are a technical interviewer. Ask a {diff_prompt} multiple-choice interview question for a {role}. "
            f"{cat_part} Output ONLY a raw JSON object with exactly three keys: 'question' (string containing the actual question text), "
            f"'options' (an array of exactly 4 strings for the possible choices, e.g. 'A) ...', 'B) ...'), "
            f"and 'recommendation' (a string containing a brief hint on how to approach the answer)."
        )
    else:
        prompt = (
            f"You are a technical interviewer. Ask a {diff_prompt} interview question for a {role}. "
            f"{cat_part} Keep the question under 30 words. Output ONLY a raw JSON object with exactly two keys: "
            f"'question' (string containing the actual question text) and 'recommendation' (a string containing a brief hint on what type of answer is expected)."
        )
        
    try:
        headers = {
            "Authorization": f"Bearer {os.environ.get('GROQ_API_KEY', 'mock-groq-key')}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=10)
        res_json = response.json()
        result = json.loads(res_json["choices"][0]["message"]["content"])
        
        if "question" in result and "options" in result:
            if "recommendation" not in result:
                result["recommendation"] = "Think carefully about the core concepts."
            return result
        elif "question" in result and fmt != "MCQ":
            return result
    except Exception as e:
        print("Groq API error:", e)

    # Ultimate fallback
    import random
    r = random.randint(100, 999)
    if fmt == "MCQ":
        return {
            "question": f"What is a core concept of {role} (ID: {r})?",
            "options": ["A) Inheritance", "B) Polymorphism", "C) Encapsulation", "D) Abstraction"],
            "recommendation": "Choose the most fundamental OOP concept."
        }
    return {
        "question": f"Explain a core concept of {role} (ID: {r}).",
        "recommendation": "Provide a clear, concise definition."
    }

def evaluate_answer_with_ai(question, answer, difficulty, fmt):
    if fmt == "MCQ":
        prompt = (
            f"Evaluate this {difficulty} multiple-choice answer.\nQ: {question}\nSelected Option: {answer}\n"
            "Did the user pick the right option? Explain briefly why it is correct or incorrect. "
            "IMPORTANT: You MUST end your response exactly with the following format on 3 separate lines:\n"
            "Relevance X/5\nClarity Y/5\nCorrectness Z/5"
        )
    else:
        prompt = (
            f"Evaluate this {difficulty} open-ended answer.\nQ: {question}\nA: {answer}\n"
            "Provide constructive feedback (2-3 sentences). "
            "IMPORTANT: You MUST end your response exactly with the following format on 3 separate lines:\n"
            "Relevance X/5\nClarity Y/5\nCorrectness Z/5"
        )

    try:
        headers = {
            "Authorization": f"Bearer {os.environ.get('GROQ_API_KEY', 'mock-groq-key')}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-70b-versatile",
            "messages": [{"role": "user", "content": prompt}]
        }
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=10)
        res_json = response.json()
        return res_json["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print("Groq evaluate error:", e)

    return "Good attempt, but the AI could not process your answer fully.\n\nRelevance 3/5\nClarity 3/5\nCorrectness 3/5"

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
    fmt = data.get('format', 'Open-Ended')
    question_count = int(data.get('question_count', 5))
    new_session = InterviewSession(
        user_id=user_id,
        title=f"{role} - {difficulty} ({fmt})",
        question_count=question_count,
        difficulty=difficulty,
        category=category,
        role=role,
        format=fmt,
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
        
    cache_key = f"{interview_session.role}_{interview_session.difficulty}_{interview_session.category}_{interview_session.format}_{interview_session.current_question_index}"
    if cache_key in question_cache:
        q_data = question_cache[cache_key]
    else:
        q_data = generate_question(interview_session.role, interview_session.difficulty, interview_session.category, interview_session.format)
        question_cache[cache_key] = q_data
        
    return jsonify({
        'question': q_data.get('question'),
        'options': q_data.get('options', []),
        'recommendation': q_data.get('recommendation', ''),
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
    feedback_text = evaluate_answer_with_ai(question, answer, interview_session.difficulty, getattr(interview_session, 'format', 'Open-Ended'))
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
            'format': getattr(s, 'format', 'Open-Ended'),
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