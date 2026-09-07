import os
import sys
import runpy

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Execute the actual backend/app/main.py and expose all its symbols including 'app'
_backend_main = os.path.join(backend_dir, "app", "main.py")
_globals = runpy.run_path(_backend_main, run_name="app.main")
globals().update(_globals)
