import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel needs a variable named 'app'
if __name__ == '__main__':
    app.run(debug=False)
