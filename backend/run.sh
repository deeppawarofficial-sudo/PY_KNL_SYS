#!/bin/bash
echo "=== Starting FastAPI + LangChain Backend Server ==="
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "Launching Uvicorn FastAPI server on http://localhost:8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
