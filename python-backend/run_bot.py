#!/usr/bin/env python3
"""
Telegram Bot Runner
Run this script to start the Telegram bot for price analysis and alerts.
"""

import os
import asyncio
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from telegram_integration.bot import PriceAnalysisBot

async def main():
    """Main function to run the Telegram bot"""
    try:
        print("🤖 Starting Price Analysis Telegram Bot...")

        # Check for required environment variables
        if not os.getenv('TELEGRAM_BOT_TOKEN'):
            print("❌ TELEGRAM_BOT_TOKEN environment variable is required")
            print("Please set your bot token from @BotFather")
            return

        if not os.getenv('DATABASE_URL'):
            print("❌ DATABASE_URL environment variable is required")
            return

        # Create and run bot
        bot = PriceAnalysisBot()
        await bot.run()

    except KeyboardInterrupt:
        print("\n🛑 Bot stopped by user")
    except Exception as e:
        print(f"❌ Bot failed to start: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(main())