import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
backend_dir = os.path.abspath(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import app from backend/app/main.py
from app.main import *
