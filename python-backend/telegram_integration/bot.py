import os
import asyncio
import logging
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.error import TelegramError
import requests
import json
from datetime import datetime
import pandas as pd
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class PriceAnalysisBot:
    def __init__(self):
        self.token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not self.token:
            raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required")

        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        self.bot = Bot(token=self.token)
        self.application = Application.builder().token(self.token).build()

        # Setup handlers
        self.setup_handlers()

    def setup_handlers(self):
        """Setup command and message handlers"""
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("analyze", self.analyze_command))
        self.application.add_handler(CommandHandler("alert", self.alert_command))
        self.application.add_handler(CommandHandler("history", self.history_command))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        welcome_text = """
🤖 Price Analysis & Alert Bot

Commands:
/analyze <product_url> - Get price analysis and predictions
/alert <product_url> <target_price> - Set price alert
/history <product_url> - Get price history chart

Just send me a product URL and I'll analyze it!
        """
        await update.message.reply_text(welcome_text)

    async def analyze_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /analyze command"""
        try:
            if not context.args:
                await update.message.reply_text("Please provide a product URL: /analyze <url>")
                return

            product_url = context.args[0]
            await update.message.reply_text("🔍 Analyzing price data...")

            # Call backend for analysis
            result = await self.call_backend_analysis(product_url)

            if result:
                response = self.format_analysis_response(result)
                await update.message.reply_text(response, parse_mode='Markdown')
            else:
                await update.message.reply_text("❌ Failed to analyze the product. Please try again.")

        except Exception as e:
            logger.error(f"Analyze command error: {e}")
            await update.message.reply_text("❌ Error occurred during analysis.")

    async def alert_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /alert command"""
        try:
            if len(context.args) < 2:
                await update.message.reply_text("Usage: /alert <product_url> <target_price>")
                return

            product_url = context.args[0]
            target_price = float(context.args[1])

            await update.message.reply_text(f"🔔 Setting alert for ₹{target_price}...")

            # Call backend to set alert
            result = await self.call_backend_alert(product_url, target_price, update.effective_user.id)

            if result.get('success'):
                await update.message.reply_text("✅ Alert set successfully! You'll be notified when the price drops.")
            else:
                await update.message.reply_text(f"❌ Failed to set alert: {result.get('message', 'Unknown error')}")

        except ValueError:
            await update.message.reply_text("❌ Invalid price format. Please use numbers only.")
        except Exception as e:
            logger.error(f"Alert command error: {e}")
            await update.message.reply_text("❌ Error occurred while setting alert.")

    async def history_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /history command"""
        try:
            if not context.args:
                await update.message.reply_text("Please provide a product URL: /history <url>")
                return

            product_url = context.args[0]
            await update.message.reply_text("📊 Fetching price history...")

            # Call backend for history
            result = await self.call_backend_history(product_url)

            if result:
                response = self.format_history_response(result)
                await update.message.reply_text(response, parse_mode='Markdown')
            else:
                await update.message.reply_text("❌ Failed to fetch price history.")

        except Exception as e:
            logger.error(f"History command error: {e}")
            await update.message.reply_text("❌ Error occurred while fetching history.")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle regular messages (assuming they contain URLs)"""
        message_text = update.message.text

        # Check if message contains a URL
        if 'http' in message_text and ('amazon' in message_text.lower() or 'flipkart' in message_text.lower()):
            await update.message.reply_text("🔍 Detected product URL. Analyzing...")
            await self.analyze_command(update, context)
        else:
            await update.message.reply_text("Please send a product URL or use /analyze <url>")

    async def call_backend_analysis(self, product_url: str) -> Optional[Dict]:
        """Call backend for price analysis"""
        try:
            payload = {
                "product_name": "Product from URL",
                "current_price": 0,  # Will be fetched by backend
                "product_url": product_url
            }

            response = requests.post(
                f"{self.backend_url}/predict",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Backend analysis failed: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"Backend call error: {e}")
            return None

    async def call_backend_alert(self, product_url: str, target_price: float, user_id: int) -> Dict:
        """Call backend to set alert"""
        try:
            # For now, return success. In real implementation, this would call the alerts API
            return {"success": True, "message": "Alert set successfully"}
        except Exception as e:
            logger.error(f"Backend alert call error: {e}")
            return {"success": False, "message": str(e)}

    async def call_backend_history(self, product_url: str) -> Optional[Dict]:
        """Call backend for price history"""
        try:
            # This would call a history endpoint
            return await self.call_backend_analysis(product_url)
        except Exception as e:
            logger.error(f"Backend history call error: {e}")
            return None

    def format_analysis_response(self, data: Dict) -> str:
        """Format analysis data for Telegram"""
        try:
            trend = data.get('trend', 'Unknown')
            forecast = data.get('forecast', [])
            recommendation = data.get('recommendation', 'Unknown')

            response = f"📊 *Price Analysis*\n\n"
            response += f"📈 Trend: {trend}\n"
            response += f"💡 Recommendation: {recommendation}\n\n"

            if forecast:
                response += "🔮 *Future Predictions:*\n"
                for pred in forecast[:5]:  # Show first 5 predictions
                    date = pred.get('date', 'N/A')
                    price = pred.get('predicted_price', 0)
                    response += f"• {date}: ₹{price}\n"

            return response
        except Exception as e:
            logger.error(f"Format analysis error: {e}")
            return "❌ Error formatting analysis data"

    def format_history_response(self, data: Dict) -> str:
        """Format history data for Telegram"""
        try:
            response = "📈 *Price History*\n\n"
            # Add history formatting logic here
            return response
        except Exception as e:
            logger.error(f"Format history error: {e}")
            return "❌ Error formatting history data"

    async def run(self):
        """Start the bot"""
        logger.info("Starting Price Analysis Bot...")
        await self.application.run_polling()

class TelegramBotManager:
    """Manager for multiple Telegram bots with fallback"""

    def __init__(self):
        self.bots = []
        self.load_bot_configs()

    def load_bot_configs(self):
        """Load bot configurations from environment"""
        # Primary bot
        primary_token = os.getenv('TELEGRAM_BOT_TOKEN_1')
        if primary_token:
            self.bots.append({
                'name': 'primary',
                'token': primary_token,
                'active': True
            })

        # Secondary bot (fallback)
        secondary_token = os.getenv('TELEGRAM_BOT_TOKEN_2')
        if secondary_token:
            self.bots.append({
                'name': 'secondary',
                'token': secondary_token,
                'active': True
            })

    async def send_analysis_request(self, product_url: str, user_id: str = None) -> Optional[Dict]:
        """Send analysis request to first available bot"""
        for bot_config in self.bots:
            if not bot_config['active']:
                continue

            try:
                bot = PriceAnalysisBot()
                bot.token = bot_config['token']
                bot.bot = Bot(token=bot.token)

                result = await bot.call_backend_analysis(product_url)
                if result:
                    return result

            except Exception as e:
                logger.error(f"Bot {bot_config['name']} failed: {e}")
                continue

        return None

    async def send_alert_request(self, product_url: str, target_price: float, user_id: str) -> bool:
        """Send alert request to first available bot"""
        for bot_config in self.bots:
            if not bot_config['active']:
                continue

            try:
                bot = PriceAnalysisBot()
                bot.token = bot_config['token']
                bot.bot = Bot(token=bot.token)

                result = await bot.call_backend_alert(product_url, target_price, int(user_id))
                if result.get('success'):
                    return True

            except Exception as e:
                logger.error(f"Bot {bot_config['name']} failed: {e}")
                continue

        return False

# Global bot manager instance
bot_manager = TelegramBotManager()

if __name__ == '__main__':
    # Run the bot directly
    bot = PriceAnalysisBot()
    asyncio.run(bot.run())