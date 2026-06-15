from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Role
from datetime import datetime, timedelta
from email_utils import send_reset_email
import traceback

bcrypt = Bcrypt()
auth_bp = Blueprint('auth', __name__)

# -------------------- JWT API --------------------
@auth_bp.route('/api/register', methods=['POST'])
def api_register():
    print("\n========== REGISTRATION REQUEST ==========")
    data = request.get_json()
    print(f"Data: {data}")
    if not data:
        return jsonify({'msg': 'Missing JSON body'}), 400
    
    username = data.get('username')
    email = data.get('email', '').lower().strip()
    password = data.get('password')
    
    print(f"Username: {username}, Email: {email}, Password length: {len(password) if password else 0}")
    
    if not username or not email or not password:
        return jsonify({'msg': 'Missing required fields'}), 400
    
    if User.query.filter_by(email=email).first():
        print("Email already registered")
        return jsonify({'msg': 'Email already registered'}), 400
    
    role = Role.query.filter_by(name='user').first()
    if not role:
        role = Role(name='user')
        db.session.add(role)
        db.session.commit()
        print("Created 'user' role")
    
    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password_hash=hashed, role=role)
    db.session.add(new_user)
    db.session.commit()
    print(f"User created with id {new_user.id}")
    print("=========================================\n")
    return jsonify({'msg': 'User created successfully'}), 201

@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    print("\n========== LOGIN REQUEST ==========")
    data = request.get_json()
    print(f"Received data: {data}")
    
    if not data:
        print("ERROR: No JSON body")
        return jsonify({'msg': 'Missing JSON body'}), 400
    
    email = data.get('email', '').lower().strip()
    password = data.get('password')
    
    print(f"Email: '{email}', Password length: {len(password) if password else 0}")
    
    if not email or not password:
        print("ERROR: Missing email or password")
        return jsonify({'msg': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=email).first()
    print(f"User found: {user is not None}")
    
    if not user:
        print("ERROR: User not found")
        return jsonify({'msg': 'Invalid credentials'}), 401
    
    print(f"Stored hash: {user.password_hash[:20]}...")
    is_valid = bcrypt.check_password_hash(user.password_hash, password)
    print(f"Password valid: {is_valid}")
    
    if not is_valid:
        print("ERROR: Password mismatch")
        return jsonify({'msg': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user.id), additional_claims={
        'username': user.username,
        'role': user.role.name
    })
    print(f"Login successful for {user.email}")
    print("=========================================\n")
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'role': user.role.name
        }
    })

@auth_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def api_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'username': user.username,
        'role': user.role.name
    })

# -------------------- Password reset (JSON) --------------------
@auth_bp.route('/api/forgot_password', methods=['POST'])
def api_forgot_password():
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    if not email:
        return jsonify({'error': 'Email required'}), 400
    user = User.query.filter_by(email=email).first()
    if user:
        user.reset_token = user.get_reset_token()
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        send_reset_email(user)
    return jsonify({'msg': 'If that email is registered, a reset link has been sent.'}), 200

@auth_bp.route('/api/reset_password/<token>', methods=['POST'])
def api_reset_password(token):
    user = User.verify_reset_token(token)
    if not user or (user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow()):
        return jsonify({'error': 'Invalid or expired token'}), 400
    password = request.json.get('password')
    if not password:
        return jsonify({'error': 'Password required'}), 400
    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    user.password_hash = hashed
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    return jsonify({'msg': 'Password updated successfully'}), 200

# -------------------- HTML views --------------------
@auth_bp.route('/login')
def login_page():
    return render_template('auth/login.html')

@auth_bp.route('/register')
def register_page():
    return render_template('auth/register.html')

@auth_bp.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email'].lower().strip()
        user = User.query.filter_by(email=email).first()
        if user:
            user.reset_token = user.get_reset_token()
            user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
            db.session.commit()
            send_reset_email(user)
            flash('If that email is registered, a reset link has been sent.', 'info')
        else:
            flash('If that email is registered, a reset link has been sent.', 'info')
        return redirect(url_for('auth.login'))
    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    user = User.verify_reset_token(token)
    if not user or (user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow()):
        flash('That reset link is invalid or has expired.', 'danger')
        return redirect(url_for('auth.forgot_password'))
    if request.method == 'POST':
        new_password = request.form['password']
        hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password_hash = hashed
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        flash('Your password has been updated! You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    return render_template('auth/reset_password.html', token=token)