import sys
import os

# Add the project root to the Python path so 'backend' package can be found
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=False)
