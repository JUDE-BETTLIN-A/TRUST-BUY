#!/usr/bin/env python3
"""
Daily Price Alert Runner
This script runs the price alert checker and can be scheduled to run daily
"""

import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

def run_price_checker():
    """Run the price alert checker"""
    try:
        # Get the directory of this script
        script_dir = Path(__file__).parent

        # Run the price alert checker
        result = subprocess.run([
            sys.executable,
            str(script_dir / "price_alert_checker.py")
        ], capture_output=True, text=True, cwd=script_dir)

        print("=== Price Alert Checker Results ===")
        print("STDOUT:")
        print(result.stdout)
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        print(f"Exit code: {result.returncode}")

        return result.returncode == 0

    except Exception as e:
        print(f"Error running price checker: {e}")
        return False

def main():
    """Main function"""
    print("🔔 Starting Daily Price Alert Check...")

    # Load environment variables from .env file in parent directory
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print("✅ Loaded environment variables from .env file")
    else:
        print("⚠️  .env file not found, using system environment variables")

    # Check if required environment variables are set
    required_vars = ['DATABASE_URL']
    missing = [var for var in required_vars if not os.getenv(var)]

    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        print("Please set these in your .env file")
        return False

    # Run the price checker
    success = run_price_checker()

    if success:
        print("✅ Daily price alert check completed successfully!")
    else:
        print("❌ Daily price alert check failed!")

    return success

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)