# backend/run.py
import uvicorn
import os
import sys

# Ensure root directory is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting CyberRiskIQ API Server on http://localhost:{port}...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
