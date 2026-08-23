from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .models import db, User, InterviewSession
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        identity = get_jwt_identity()
        user = User.query.get(identity)
        if not user or user.role.name != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/api/stats', methods=['GET'])
@jwt_required()
@admin_required
def stats():
    return jsonify({
        'total_users': User.query.count(),
        'total_sessions': InterviewSession.query.count(),
        'completed_sessions': InterviewSession.query.filter(InterviewSession.completed_at.isnot(None)).count(),
        'avg_score': db.session.query(db.func.avg(InterviewSession.final_avg_score)).scalar() or 0
    })

@admin_bp.route('/api/users', methods=['GET'])
@jwt_required()
@admin_required
def users():
    all_users = User.query.all()
    return jsonify([{'id': u.id, 'username': u.username, 'email': u.email, 'role': u.role.name} for u in all_users])