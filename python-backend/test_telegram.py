#!/usr/bin/env python3
"""
Test script for Telegram integration
"""

import os
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from telegram_integration import get_price_analysis_sync, set_price_alert_sync

async def test_telegram_integration():
    """Test the Telegram integration functions"""

    print("🧪 Testing Telegram Integration...")

    # Test data
    test_product_url = "https://www.amazon.in/dp/B08N5WRWNW"  # Example Amazon URL
    test_product_name = "Test Product"
    test_current_price = 1000.0
    test_target_price = 900.0
    test_user_id = "test@example.com"

    try:
        # Test price analysis
        print("📊 Testing price analysis...")
        analysis_result = get_price_analysis_sync(
            test_product_url,
            test_product_name,
            test_current_price
        )

        if analysis_result:
            print("✅ Price analysis successful!")
            print(f"Trend: {analysis_result.get('trend', 'N/A')}")
            print(f"Recommendation: {analysis_result.get('recommendation', 'N/A')}")
        else:
            print("❌ Price analysis failed")

        # Test alert setting
        print("🔔 Testing alert setting...")
        alert_success = set_price_alert_sync(
            test_product_url,
            test_target_price,
            test_user_id
        )

        if alert_success:
            print("✅ Alert setting successful!")
        else:
            print("❌ Alert setting failed")

        print("🎉 All tests completed!")

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(test_telegram_integration())