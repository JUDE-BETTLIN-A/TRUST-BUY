#!/usr/bin/env python3
"""
Daily Price Alert Checker
Runs daily to check product prices and send notifications when prices drop
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file in parent directory
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class PriceAlertChecker:
    def __init__(self):
        self.backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8000')

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get all active price alerts from database"""
        try:
            with SessionLocal() as session:
                query = text("""
                    SELECT
                        a.id,
                        a."userEmail",
                        a."productTitle",
                        a."targetPrice",
                        a."currentPrice",
                        a."productImage",
                        a."productLink",
                        a."createdAt",
                        u.name as user_name
                    FROM "Alert" a
                    JOIN "User" u ON u.email = a."userEmail"
                    WHERE a."isActive" = true
                    ORDER BY a."createdAt" DESC
                """)

                result = session.execute(query)
                alerts = []

                for row in result:
                    alerts.append({
                        'id': row.id,
                        'user_email': row.userEmail,
                        'user_name': row.user_name,
                        'product_title': row.productTitle,
                        'target_price': row.targetPrice,
                        'current_price': row.currentPrice,
                        'product_image': row.productImage,
                        'product_link': row.productLink,
                        'created_at': row.createdAt
                    })

                logger.info(f"Found {len(alerts)} active alerts")
                return alerts

        except Exception as e:
            logger.error(f"Error fetching alerts: {e}")
            return []

    async def check_product_price(self, product_title: str, product_link: str) -> float:
        """Check current price of a product using the scraper"""
        try:
            # For testing: return a mock price that's sometimes lower than target
            # In production, this would use the actual scraper
            import random

            # Mock price logic: FORCE a price drop for testing
            mock_price = 250.0  # Force price below target of ₹277
            logger.info(f"Mock price check for '{product_title}': ₹{mock_price} (FORCED price drop for testing)")
            return mock_price

            # Production code (commented out for testing):
            # response = requests.post(
            #     f"{self.backend_url}/scrape_price",
            #     json={
            #         "product_title": product_title,
            #         "product_url": product_link
            #     },
            #     timeout=30
            # )
            #
            # if response.status_code == 200:
            #     data = response.json()
            #     if data.get('success') and data.get('price'):
            #         return float(data['price'])
            #     else:
            #         logger.warning(f"No price found for {product_title}")
            #         return 0.0
            # else:
            #     logger.error(f"Scrape request failed: {response.status_code}")
            #     return 0.0

        except Exception as e:
            logger.error(f"Error checking price for {product_title}: {e}")
            return 0.0

    def update_alert_price(self, alert_id: str, new_price: float):
        """Update the current price of an alert in database"""
        try:
            with SessionLocal() as session:
                query = text("""
                    UPDATE "Alert"
                    SET "currentPrice" = :new_price, "updatedAt" = NOW()
                    WHERE id = :alert_id
                """)

                session.execute(query, {
                    'alert_id': alert_id,
                    'new_price': new_price
                })
                session.commit()

                logger.info(f"Updated alert {alert_id} with new price: ₹{new_price}")

        except Exception as e:
            logger.error(f"Error updating alert price: {e}")

    def create_notification(self, alert_id: str, user_email: str, product_title: str,
                          old_price: float, new_price: float, product_image: str, product_link: str):
        """Create a notification record for the user"""
        try:
            with SessionLocal() as session:
                # Check if similar notification already exists (avoid spam)
                check_query = text("""
                    SELECT id FROM "Notification"
                    WHERE "userEmail" = :user_email
                    AND "alertId" = :alert_id
                    AND type = 'price_drop'
                    AND "createdAt" > NOW() - INTERVAL '24 hours'
                """)

                existing = session.execute(check_query, {
                    'user_email': user_email,
                    'alert_id': alert_id
                }).fetchone()

                if existing:
                    logger.info(f"Notification already sent recently for alert {alert_id}")
                    return

                # Create notification
                insert_query = text("""
                    INSERT INTO "Notification" (
                        id, "userEmail", "alertId", type, title, message,
                        "productTitle", "oldPrice", "newPrice", "productImage", "productLink",
                        "isRead", "createdAt"
                    ) VALUES (
                        gen_random_uuid(), :user_email, :alert_id, 'price_drop',
                        'Price Drop Alert!', :message, :product_title, :old_price,
                        :new_price, :product_image, :product_link, false, NOW()
                    )
                """)

                message = f"Great news! {product_title} is now ₹{new_price:.0f} (was ₹{old_price:.0f})"

                session.execute(insert_query, {
                    'user_email': user_email,
                    'alert_id': alert_id,
                    'message': message,
                    'product_title': product_title,
                    'old_price': old_price,
                    'new_price': new_price,
                    'product_image': product_image,
                    'product_link': product_link
                })

                session.commit()
                logger.info(f"Created price drop notification for {user_email}: {product_title}")

        except Exception as e:
            logger.error(f"Error creating notification: {e}")

    async def process_alerts(self):
        """Main function to process all active alerts"""
        logger.info("🔔 Starting daily price alert check...")

        alerts = self.get_active_alerts()
        if not alerts:
            logger.info("No active alerts to process")
            return

        processed_count = 0
        price_drops_found = 0

        for alert in alerts:
            try:
                logger.info(f"Checking price for: {alert['product_title']}")

                # Get current price
                current_price = await self.check_product_price(
                    alert['product_title'],
                    alert['product_link']
                )

                if current_price > 0:
                    # Update current price in database
                    self.update_alert_price(alert['id'], current_price)

                    # Check if price dropped below target
                    if current_price < alert['target_price']:
                        logger.info(f"🎉 Price drop detected! {alert['product_title']}: ₹{current_price} < ₹{alert['target_price']}")

                        # Create notification
                        self.create_notification(
                            alert_id=alert['id'],
                            user_email=alert['user_email'],
                            product_title=alert['product_title'],
                            old_price=alert['target_price'],
                            new_price=current_price,
                            product_image=alert['product_image'],
                            product_link=alert['product_link']
                        )

                        price_drops_found += 1

                    processed_count += 1

                # Small delay to avoid overwhelming the scraper
                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"Error processing alert {alert['id']}: {e}")
                continue

        logger.info(f"✅ Completed price check: {processed_count} alerts processed, {price_drops_found} price drops found")

    async def run_daily_check(self):
        """Run the price check (can be called manually or scheduled)"""
        await self.process_alerts()

async def main():
    """Main entry point"""
    checker = PriceAlertChecker()
    await checker.run_daily_check()

if __name__ == '__main__':
    asyncio.run(main())