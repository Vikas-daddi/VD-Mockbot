from app import create_app
from models import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE interview_sessions ADD COLUMN format VARCHAR(20) DEFAULT 'Open-Ended';"))
        db.session.commit()
        print("Successfully added format column.")
    except Exception as e:
        print("Error (might already exist):", e)
