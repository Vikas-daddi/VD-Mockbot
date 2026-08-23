from app import create_app
from models import db, User, InterviewSession

app = create_app()

with app.app_context():
    # Because User has cascade='all, delete-orphan' on sessions,
    # deleting users will delete their sessions.
    # However, to be safe on some databases, we can explicitly delete sessions.
    InterviewSession.query.delete()
    
    # Delete all users
    User.query.delete()
    db.session.commit()
    print("Deleted all users and their sessions.")
    
    # Let's recreate the admin user as requested before
    from auth import bcrypt
    from models import Role
    admin_role = Role.query.filter_by(name='admin').first()
    hashed = bcrypt.generate_password_hash('admin').decode('utf-8')
    admin = User(username='admin', email='admin@gmail.com', password_hash=hashed, role=admin_role)
    db.session.add(admin)
    db.session.commit()
    print("Recreated admin@gmail.com (username: admin, password: admin)")
