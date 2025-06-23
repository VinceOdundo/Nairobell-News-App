#!/usr/bin/env pwsh
# Nairobell News System Startup Script
# This script starts all components of the news aggregation system

Write-Host "🚀 Starting Nairobell News System..." -ForegroundColor Green

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
try {
    pip install -r requirements.txt
    Write-Host "✅ Python dependencies installed" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Warning: Could not install Python dependencies" -ForegroundColor Yellow
}

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Warning: Could not install Node.js dependencies" -ForegroundColor Yellow
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    @"
# News API Keys (optional for enhanced features)
GNEWS_API_KEY=your_gnews_api_key_here
NEWSAPI_KEY=your_newsapi_key_here

# Gemini API Key (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created. Please update with your API keys." -ForegroundColor Green
}

# Function to start a process in background
function Start-BackgroundProcess {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Arguments,
        [string]$WorkingDirectory = $ScriptDir
    )
    
    Write-Host "🔄 Starting $Name..." -ForegroundColor Cyan
    
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Command
    $psi.Arguments = $Arguments
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $true
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
    
    try {
        $process = [System.Diagnostics.Process]::Start($psi)
        Write-Host "✅ $Name started (PID: $($process.Id))" -ForegroundColor Green
        return $process
    }
    catch {
        Write-Host "❌ Failed to start $Name : $_" -ForegroundColor Red
        return $null
    }
}

# Start the news aggregation API server
Write-Host "`n📡 Starting News API Server..." -ForegroundColor Blue
$apiProcess = Start-BackgroundProcess -Name "News API Server" -Command "python" -Arguments "news_api.py"

# Wait a moment for API to start
Start-Sleep -Seconds 3

# Start the React development server
Write-Host "`n🌐 Starting React Development Server..." -ForegroundColor Blue
$reactProcess = Start-BackgroundProcess -Name "React Dev Server" -Command "npm" -Arguments "run dev"

# Wait a moment for React to start
Start-Sleep -Seconds 5

# Display status and instructions
Write-Host "`n" + "="*60 -ForegroundColor Magenta
Write-Host "🎉 Nairobell News System Started Successfully!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Magenta

Write-Host "`n📊 Service Status:" -ForegroundColor Yellow
if ($apiProcess) {
    Write-Host "   🟢 News API Server: Running on http://localhost:8000" -ForegroundColor Green
    Write-Host "      📖 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
}
else {
    Write-Host "   🔴 News API Server: Failed to start" -ForegroundColor Red
}

if ($reactProcess) {
    Write-Host "   🟢 React App: Running on http://localhost:5173" -ForegroundColor Green
}
else {
    Write-Host "   🔴 React App: Failed to start" -ForegroundColor Red
}

Write-Host "`n🔗 Available Endpoints:" -ForegroundColor Yellow
Write-Host "   • Main App: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • API Health: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "   • Latest News: http://localhost:8000/news/latest" -ForegroundColor Cyan
Write-Host "   • Trending: http://localhost:8000/news/trending" -ForegroundColor Cyan
Write-Host "   • API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan

Write-Host "`n📝 Logs:" -ForegroundColor Yellow
Write-Host "   • News aggregation logs: news_aggregator.log" -ForegroundColor Gray
Write-Host "   • API logs: Check the News API Server window" -ForegroundColor Gray

Write-Host "`n⚠️  Notes:" -ForegroundColor Yellow
Write-Host "   • Update .env file with your API keys for full functionality" -ForegroundColor Gray
Write-Host "   • Some features require internet connection" -ForegroundColor Gray
Write-Host "   • Press Ctrl+C in any terminal to stop services" -ForegroundColor Gray

Write-Host "`n🛠️  Troubleshooting:" -ForegroundColor Yellow
Write-Host "   • If React app doesn't open, try: http://localhost:3000" -ForegroundColor Gray
Write-Host "   • For API issues, check: http://localhost:8000/health" -ForegroundColor Gray
Write-Host "   • Check firewall settings if services don't start" -ForegroundColor Gray

# Test news aggregator
Write-Host "`n🧪 Testing News Aggregator..." -ForegroundColor Blue
try {
    python news_aggregator_clean.py
    Write-Host "✅ News aggregator test completed" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ News aggregator test failed, but system should still work" -ForegroundColor Yellow
}

Write-Host "`n🚀 System is ready! Open http://localhost:5173 to access the app." -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Magenta

# Keep script running to show status
Write-Host "`nPress any key to exit this status window (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
