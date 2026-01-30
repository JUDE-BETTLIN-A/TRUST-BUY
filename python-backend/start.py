#!/usr/bin/env python3
"""
Combined startup script for backend and Telegram bot
Run this to start both services together
"""

import os
import asyncio
import subprocess
import sys
import signal
import time
from pathlib import Path

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['DATABASE_URL']
    optional_vars = ['TELEGRAM_BOT_TOKEN_1', 'NEWS_API_KEY']

    missing_required = []
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)

    if missing_required:
        print("❌ Missing required environment variables:")
        for var in missing_required:
            print(f"  - {var}")
        print("\nPlease set these in your .env file")
        return False

    # Check optional vars
    missing_optional = []
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)

    if missing_optional:
        print("⚠️  Missing optional environment variables:")
        for var in missing_optional:
            print(f"  - {var}")
        print("Some features may not work without these.\n")

    return True

async def start_services():
    """Start both backend and bot services"""
    if not check_environment():
        return

    print("🚀 Starting Price Tracker Services...")

    # Start backend
    print("📡 Starting FastAPI backend...")
    backend_process = subprocess.Popen([
        sys.executable, 'main.py'
    ], cwd=Path(__file__).parent)

    # Wait a bit for backend to start
    await asyncio.sleep(3)

    # Check if backend is running
    try:
        import requests
        response = requests.get('http://localhost:8000/', timeout=5)
        if response.status_code == 200:
            print("✅ Backend started successfully")
        else:
            print("⚠️  Backend may not be responding correctly")
    except:
        print("❌ Backend failed to start")
        backend_process.terminate()
        return

    # Start Telegram bot (optional)
    bot_process = None
    if os.getenv('TELEGRAM_BOT_TOKEN_1'):
        print("🤖 Starting Telegram bot...")
        bot_process = subprocess.Popen([
            sys.executable, 'run_bot.py'
        ], cwd=Path(__file__).parent)

        await asyncio.sleep(2)
        print("✅ Telegram bot started")
    else:
        print("ℹ️  No Telegram bot tokens configured, skipping bot startup")

    print("\n🎉 Services started successfully!")
    print("📊 Frontend: http://localhost:3000")
    print("🔧 Backend API: http://localhost:8000")
    if bot_process:
        print("🤖 Telegram bot: Running")

    print("\nPress Ctrl+C to stop all services")

    # Keep running until interrupted
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")

        # Terminate processes
        if bot_process:
            bot_process.terminate()
            bot_process.wait()
            print("🤖 Telegram bot stopped")

        backend_process.terminate()
        backend_process.wait()
        print("📡 Backend stopped")

        print("👋 All services stopped")

if __name__ == '__main__':
    asyncio.run(start_services())