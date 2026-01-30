from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import PricePredictor
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from telegram_integration import telegram_integration, init_telegram_integration, get_price_analysis_sync, set_price_alert_sync

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = PricePredictor()

class PriceRequest(BaseModel):
    product_name: str
    current_price: float
    product_url: str = None # Added for DB lookup

class AlertRequest(BaseModel):
    product_url: str
    target_price: float
    user_id: str

class ScrapePriceRequest(BaseModel):
    product_title: str
    product_url: str = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        await init_telegram_integration()
        print("✅ Telegram integration initialized")
    except Exception as e:
        print(f"⚠️  Telegram integration failed: {e}")

@app.get("/")
def home():
    return {"status": "ML Backend Live", "telegram_bots": len(telegram_integration.active_bots)}

@app.post("/predict")
def predict_price(request: PriceRequest):
    try:
        # Use Telegram integration for price analysis
        print(f"🔍 Requesting price analysis via Telegram for: {request.product_name}")

        result = get_price_analysis_sync(
            request.product_url,
            request.product_name,
            request.current_price
        )

        if result:
            result['product_name'] = request.product_name
            print("✅ Analysis completed via Telegram integration")
            return result
        else:
            print("❌ Telegram analysis failed, falling back to direct model")
            # Fallback to direct model
            result = predictor.predict(request.current_price, request.product_url, request.product_name)
            result['product_name'] = request.product_name
            return result

    except Exception as e:
        print(f"❌ Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/set_alert")
def set_alert(request: AlertRequest):
    try:
        print(f"🔔 Setting price alert via Telegram for: {request.product_url}")

        success = set_price_alert_sync(
            request.product_url,
            request.target_price,
            request.user_id
        )

        if success:
            print("✅ Alert set via Telegram integration")
            return {"success": True, "message": "Alert set successfully"}
        else:
            print("❌ Telegram alert failed")
            return {"success": False, "message": "Failed to set alert"}

    except Exception as e:
        print(f"❌ Alert Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape_price")
def scrape_price(request: ScrapePriceRequest):
    """Scrape current price for a product (used by alert checker)"""
    try:
        from lib.scraper import scrapeProductsReal

        print(f"🔍 Scraping price for: {request.product_title}")

        # Scrape products with the title
        products = scrapeProductsReal(request.product_title, 1)  # Get first page only

        if products and len(products) > 0:
            # Find the best matching product
            best_match = None
            best_score = 0

            for product in products:
                # Simple title matching score
                title_lower = product.title.lower()
                query_lower = request.product_title.lower()

                # Exact match gets highest score
                if query_lower in title_lower:
                    score = len(query_lower) / len(title_lower)
                    if score > best_score:
                        best_score = score
                        best_match = product

            if best_match:
                # Extract price
                price_str = best_match.price
                price_num = float(price_str.replace('₹', '').replace(',', '').strip())

                print(f"✅ Found price: ₹{price_num} for {best_match.title}")
                return {
                    "success": True,
                    "price": price_num,
                    "product_title": best_match.title,
                    "store": best_match.storeName
                }

        print("❌ No matching product found")
        return {"success": False, "message": "Product not found"}

    except Exception as e:
        print(f"❌ Scrape price error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/telegram_status")
def telegram_status():
    """Check Telegram bot status"""
    return {
        "bots_configured": len(telegram_integration.bot_tokens),
        "bots_active": len(telegram_integration.active_bots),
        "backend_url": telegram_integration.backend_url
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
