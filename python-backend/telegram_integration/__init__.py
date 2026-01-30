import os
import asyncio
import logging
import requests
from typing import Dict, Optional, List
from telegram import Bot
from telegram.error import TelegramError
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class TelegramIntegration:
    """Integration layer for Telegram bots"""

    def __init__(self):
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        self.bot_tokens = self._load_bot_tokens()
        self.active_bots = []

    def _load_bot_tokens(self) -> List[str]:
        """Load bot tokens from environment"""
        tokens = []
        for i in range(1, 5):  # Support up to 4 bots
            token = os.getenv(f'TELEGRAM_BOT_TOKEN_{i}')
            if token:
                tokens.append(token)
        return tokens

    async def initialize_bots(self):
        """Initialize bot connections"""
        for token in self.bot_tokens:
            try:
                bot = Bot(token=token)
                # Test bot connection
                await bot.get_me()
                self.active_bots.append(bot)
                logger.info(f"Bot initialized successfully")
            except TelegramError as e:
                logger.error(f"Failed to initialize bot: {e}")

    async def get_price_analysis(self, product_url: str, product_name: str = "", current_price: float = 0) -> Optional[Dict]:
        """
        Get price analysis from Telegram bots
        Falls back to next bot if one fails
        """
        for i, bot in enumerate(self.active_bots):
            try:
                logger.info(f"Trying bot {i+1} for price analysis")

                # Send analysis request via bot
                analysis_result = await self._request_analysis_from_bot(bot, product_url, product_name, current_price)

                if analysis_result:
                    logger.info(f"Bot {i+1} provided analysis successfully")
                    return analysis_result

            except Exception as e:
                logger.error(f"Bot {i+1} failed: {e}")
                continue

        # All bots failed, fallback to direct backend call
        logger.warning("All Telegram bots failed, falling back to direct backend")
        return await self._fallback_backend_analysis(product_url, product_name, current_price)

    async def set_price_alert(self, product_url: str, target_price: float, user_id: str) -> bool:
        """
        Set price alert via Telegram bots
        Falls back to next bot if one fails
        """
        for i, bot in enumerate(self.active_bots):
            try:
                logger.info(f"Trying bot {i+1} for price alert")

                success = await self._request_alert_from_bot(bot, product_url, target_price, user_id)

                if success:
                    logger.info(f"Bot {i+1} set alert successfully")
                    return True

            except Exception as e:
                logger.error(f"Bot {i+1} alert failed: {e}")
                continue

        # All bots failed, fallback to direct backend
        logger.warning("All Telegram bots failed, falling back to direct backend")
        return await self._fallback_backend_alert(product_url, target_price, user_id)

    async def _request_analysis_from_bot(self, bot: Bot, product_url: str, product_name: str, current_price: float) -> Optional[Dict]:
        """Request analysis from a specific bot"""
        try:
            # For now, we'll simulate bot interaction by calling our backend
            # In a real implementation, this would send a message to the bot and parse the response

            # Simulate sending message to bot
            chat_id = os.getenv('TELEGRAM_CHAT_ID', '@self')  # For testing

            message = f"/analyze {product_url}"
            await bot.send_message(chat_id=chat_id, text=message)

            # Wait for response (in real implementation, you'd need webhook or polling)
            await asyncio.sleep(2)  # Simulate processing time

            # For now, call backend directly as fallback
            return await self._call_backend_predict(product_url, product_name, current_price)

        except Exception as e:
            logger.error(f"Bot analysis request failed: {e}")
            return None

    async def _request_alert_from_bot(self, bot: Bot, product_url: str, target_price: float, user_id: str) -> bool:
        """Request alert setting from a specific bot"""
        try:
            chat_id = os.getenv('TELEGRAM_CHAT_ID', '@self')

            message = f"/alert {product_url} {target_price}"
            await bot.send_message(chat_id=chat_id, text=message)

            # Simulate processing
            await asyncio.sleep(1)

            # For now, return success
            return True

        except Exception as e:
            logger.error(f"Bot alert request failed: {e}")
            return False

    async def _call_backend_predict(self, product_url: str, product_name: str, current_price: float) -> Optional[Dict]:
        """Call backend prediction endpoint"""
        try:
            payload = {
                "product_name": product_name,
                "current_price": current_price,
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
                logger.error(f"Backend predict failed: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Backend predict call error: {e}")
            return None

    async def _fallback_backend_analysis(self, product_url: str, product_name: str, current_price: float) -> Optional[Dict]:
        """Fallback to direct backend analysis"""
        return await self._call_backend_predict(product_url, product_name, current_price)

    async def _fallback_backend_alert(self, product_url: str, target_price: float, user_id: str) -> bool:
        """Fallback to direct backend alert setting"""
        try:
            # This would call the alerts API endpoint
            # For now, just log and return success
            logger.info(f"Setting alert for user {user_id}: {product_url} at ₹{target_price}")
            return True
        except Exception as e:
            logger.error(f"Backend alert fallback failed: {e}")
            return False

# Global instance
telegram_integration = TelegramIntegration()

async def init_telegram_integration():
    """Initialize the Telegram integration"""
    await telegram_integration.initialize_bots()
    logger.info(f"Initialized {len(telegram_integration.active_bots)} Telegram bots")

# Synchronous wrapper for use in FastAPI
def get_price_analysis_sync(product_url: str, product_name: str = "", current_price: float = 0) -> Optional[Dict]:
    """Synchronous wrapper for price analysis"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(telegram_integration.get_price_analysis(product_url, product_name, current_price))
    finally:
        loop.close()

def set_price_alert_sync(product_url: str, target_price: float, user_id: str) -> bool:
    """Synchronous wrapper for setting alerts"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(telegram_integration.set_price_alert(product_url, target_price, user_id))
    finally:
        loop.close()