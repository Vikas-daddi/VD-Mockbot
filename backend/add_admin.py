from app import create_app
from models import db, User, Role
from auth import bcrypt

app = create_app()

with app.app_context():
    admin_role = Role.query.filter_by(name='admin').first()
    if not admin_role:
        admin_role = Role(name='admin')
        db.session.add(admin_role)
        db.session.commit()
        
    hashed = bcrypt.generate_password_hash('admin').decode('utf-8')
    admin_user = User.query.filter_by(email='admin@gmail.com').first()
    
    if admin_user:
        admin_user.password_hash = hashed
        admin_user.role = admin_role
        print("Updated existing admin@gmail.com password to 'admin'")
    else:
        # Check if username 'admin' already exists
        existing_admin = User.query.filter_by(username='admin').first()
        if existing_admin:
            existing_admin.email = 'admin@gmail.com'
            existing_admin.password_hash = hashed
            print("Updated existing 'admin' user to use admin@gmail.com and password 'admin'")
        else:
            admin_user = User(username='admin', email='admin@gmail.com', password_hash=hashed, role=admin_role)
            db.session.add(admin_user)
            print("Created new admin@gmail.com with password 'admin'")
        
    db.session.commit()
