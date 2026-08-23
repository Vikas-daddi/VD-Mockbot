import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Use relative imports
from config import Config
from models import db, User, Role
from auth import auth_bp, bcrypt
from user import user_bp
from admin import admin_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    CORS(app, 
         origins=['http://localhost:5173'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    bcrypt.init_app(app)
    jwt = JWTManager(app)
    mail = Mail(app)
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(user_bp, url_prefix='/user')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    with app.app_context():
        db.create_all()
        if not Role.query.first():
            db.session.add(Role(name='admin'))
            db.session.add(Role(name='user'))
            db.session.commit()
        if not User.query.filter_by(username='admin').first():
            admin_role = Role.query.filter_by(name='admin').first()
            hashed = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin = User(username='admin', email='admin@example.com', password_hash=hashed, role=admin_role)
            db.session.add(admin)
            db.session.commit()
            print("Default admin created: admin@example.com / admin123")
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)