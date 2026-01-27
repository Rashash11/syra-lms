#!/bin/bash

# Start the Backend in the background
cd services/api
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Go back to root and start the Frontend
cd ../..
npm run start -- -p 3000

# Cleanup on exit
kill $BACKEND_PID
