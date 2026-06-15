from flask import render_template, current_app
from flask_mail import Message

def send_reset_email(user):
    token = user.get_reset_token()
    reset_url = f"{current_app.config['BASE_URL']}/auth/reset_password/{token}"
    
    # Create email message
    msg = Message('Password Reset Request',
                  recipients=[user.email])
    msg.html = render_template('email/reset_email.html', user=user, reset_url=reset_url)
    
    # Send the email using Flask-Mail
    try:
        current_app.extensions['mail'].send(msg)
        print(f"Password reset email sent to {user.email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        # Fallback: print link to terminal
        print(f"Reset link: {reset_url}")