#!/bin/bash

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Flask if not already included
pip install flask flask-cors schedule

echo "Python dependencies installed successfully!"

# Create a simple script to run the news aggregator
echo "Creating run scripts..."

# Windows batch file to run the aggregator
cat > run_news_aggregator.bat << 'EOF'
@echo off
echo Starting News Aggregator...
python news_aggregator.py
pause
EOF

# Windows batch file to run the API server
cat > run_api_server.bat << 'EOF'
@echo off
echo Starting News API Server...
python api_server.py
pause
EOF

# PowerShell script to run both
cat > start_news_system.ps1 << 'EOF'
# Start the news aggregator in background
Write-Host "Starting News Aggregator..." -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "news_aggregator.py --daemon" -WindowStyle Minimized

# Wait a bit for aggregator to generate initial data
Start-Sleep -Seconds 10

# Start the API server
Write-Host "Starting API Server..." -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "api_server.py"

Write-Host "News system started! API available at http://localhost:5000" -ForegroundColor Yellow
Write-Host "Check latest_news.json for aggregated news data" -ForegroundColor Yellow
EOF

echo "Scripts created successfully!"
echo ""
echo "To start the news system:"
echo "1. Run: ./start_news_system.ps1 (PowerShell)"
echo "2. Or run: python api_server.py (for API only)"
echo "3. Or run: python news_aggregator.py (for aggregation only)"
echo ""
echo "The API will be available at http://localhost:5000"
