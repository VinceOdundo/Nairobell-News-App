# PowerShell script to start the news aggregation system
# This script starts both the news aggregator and API server

Write-Host "=== Nairobell News System Startup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if pip is available
try {
    $pipVersion = pip --version 2>&1
    Write-Host "✓ Pip found: $pipVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Pip not found. Please install pip" -ForegroundColor Red
    exit 1
}

# Install dependencies if requirements.txt exists
if (Test-Path "requirements.txt") {
    Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ Some dependencies may have failed to install" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠ requirements.txt not found, skipping dependency installation" -ForegroundColor Yellow
}

Write-Host ""

# Check if news aggregator script exists
if (-not (Test-Path "news_aggregator.py")) {
    Write-Host "✗ news_aggregator.py not found" -ForegroundColor Red
    exit 1
}

# Check if API server script exists
if (-not (Test-Path "api_server.py")) {
    Write-Host "✗ api_server.py not found" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting News Aggregation System..." -ForegroundColor Cyan
Write-Host ""

# Run initial news aggregation
Write-Host "📰 Running initial news aggregation..." -ForegroundColor Yellow
python news_aggregator.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Initial news aggregation completed" -ForegroundColor Green
}
else {
    Write-Host "⚠ News aggregation had some issues, continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Start the API server
Write-Host "🌐 Starting API Server on http://localhost:5000..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Set environment variables
$env:FLASK_ENV = "development"
$env:DEBUG = "true"

# Start the API server (this will run continuously)
python api_server.py
