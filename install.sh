#!/bin/bash

echo "Installing LMS Dependencies..."

# 1. Backend Setup
echo "--- Setting up Backend ---"
cd services/api || exit
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing Python requirements..."
pip install -r requirements.txt
cd ../..

# 2. Frontend Setup
echo "--- Setting up Frontend ---"
# Always ensure dependencies are installed/updated
echo "Installing Node dependencies (root)..."
npm install

# Force clean build to ensure artifacts are correct
if [ -d "apps/web/.next" ]; then
    echo "Found existing build. Cleaning..."
    rm -rf apps/web/.next
fi

echo "Building Frontend..."
npm run build

echo "--- Installation Complete ---"
echo "You can now run ./start_server.sh"
