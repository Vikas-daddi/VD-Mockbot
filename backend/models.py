from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json
from itsdangerous import URLSafeTimedSerializer
from flask import current_app

db = SQLAlchemy()

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    users = db.relationship('User', backref='role', lazy=True)

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), default=2)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    sessions = db.relationship('InterviewSession', backref='user', lazy=True, cascade='all, delete-orphan')

    def get_reset_token(self, expires_sec=3600):
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        return s.dumps(self.email, salt='password-reset-salt')

    @staticmethod
    def verify_reset_token(token, expires_sec=3600):
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        try:
            email = s.loads(token, salt='password-reset-salt', max_age=expires_sec)
        except:
            return None
        return User.query.filter_by(email=email).first()

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), default="Mock Interview")
    question_count = db.Column(db.Integer, default=5)
    current_question_index = db.Column(db.Integer, default=0)
    difficulty = db.Column(db.String(20), default="Medium")
    category = db.Column(db.String(50), default="General")
    role = db.Column(db.String(100), default="Python Developer")
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    answers_data = db.Column(db.Text, default='[]')
    final_avg_score = db.Column(db.Float, default=0.0)
    final_feedback = db.Column(db.Text, default="")

    def add_answer(self, question, answer, feedback, scores_dict):
        data = json.loads(self.answers_data) if self.answers_data else []
        data.append({
            'question': question,
            'answer': answer,
            'feedback': feedback,
            'scores': scores_dict,
            'timestamp': datetime.utcnow().isoformat()
        })
        self.answers_data = json.dumps(data)
        self.current_question_index = len(data)
        db.session.commit()

    def get_answers(self):
        return json.loads(self.answers_data) if self.answers_data else []

    def is_complete(self):
        return self.current_question_index >= self.question_count

    def calculate_final_scores(self):
        answers = self.get_answers()
        if not answers:
            return 0.0, "No answers recorded."
        total_rel = total_cla = total_cor = 0
        for a in answers:
            s = a.get('scores', {})
            total_rel += s.get('relevance', 0)
            total_cla += s.get('clarity', 0)
            total_cor += s.get('correctness', 0)
        n = len(answers)
        avg = (total_rel + total_cla + total_cor) / (3 * n)
        return avg, f"Completed {n} questions. Relevance: {total_rel/n:.1f}, Clarity: {total_cla/n:.1f}, Correctness: {total_cor/n:.1f}."