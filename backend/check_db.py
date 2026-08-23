import os
from app import app
from models import db, InterviewSession

with app.app_context():
    s = InterviewSession.query.order_by(InterviewSession.id.desc()).first()
    print("Session ID:", s.id)
    print("Answers JSON:")
    print(s.answers)
