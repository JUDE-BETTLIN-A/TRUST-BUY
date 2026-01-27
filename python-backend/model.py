import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine, text

import os

# Load from Environment
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")
engine = create_engine(DATABASE_URL)

class PricePredictor:
    def __init__(self):
        self.model = None

    def get_real_history(self, product_url):
        """Fetch real price history from DB"""
        try:
            query = text("""
                SELECT ph.created_at as ds, ph.price as y 
                FROM price_history ph
                JOIN products p ON p.id = ph.product_id
                WHERE p.url = :url
                ORDER BY ph.created_at ASC
            """)
            with engine.connect() as conn:
                df = pd.read_sql(query, conn, params={"url": product_url})
                return df
        except Exception as e:
            print(f"DB Error: {e}")
            return pd.DataFrame()

    def generate_synthetic_history(self, current_price, days=60):
        """Fallback: Generate realistic mock history based on current price"""
        dates = pd.date_range(end=datetime.now(), periods=days)
        volatility = current_price * 0.05
        trend = np.linspace(0, current_price * 0.02, days)
        prices = [current_price]
        for _ in range(days-1):
            change = np.random.normal(0, volatility * 0.2)
            prices.append(prices[-1] + change)
        prices = np.array(prices) - (prices[-1] - current_price)
        return pd.DataFrame({'ds': dates, 'y': prices})

    def predict(self, current_price, product_url=None, product_name="", days_ahead=30):
        # 1. Try to get Real History from DB
        from history_scraper import fetch_external_history
        from news_sentiment import fetch_market_sentiment
        
        df = pd.DataFrame()
        source = "Synthetic"
        
        if product_url:
            df = self.get_real_history(product_url)
            
            # 2. If DB is empty, Try External Scraper
            if len(df) < 5:
                print("DB empty, attempting to scrape external history...")
                try:
                    ext_df = fetch_external_history(product_url)
                    if not ext_df.empty:
                        print(f"Scraper Success! Found {len(ext_df)} points.")
                        df = ext_df
                        source = "External Scraper (Live)"
                except Exception as e:
                    print(f"Scraper failed: {e}")
        
        # 3. Validation - No Mock
        if len(df) < 3: 
             print("Insufficient data.")
             return { "trend": "Unknown", "forecast": [], "recommendation": "Data Collection Started", "data_source": "Insufficient History", "news_context": None }

        print(f"Training on {len(df)} data points from {source}!!")
        df['ds'] = pd.to_datetime(df['ds']).dt.tz_localize(None)

        # 4. Train Prophet
        try:
            m = Prophet(daily_seasonality=True, yearly_seasonality=False)
            m.fit(df)
            
            future = m.make_future_dataframe(periods=days_ahead)
            forecast = m.predict(future)
            
            # --- NEWS INTEGRATION ---
            news_impact = 0
            news_context = None
            if product_name:
                sentiment = fetch_market_sentiment(product_name)
                news_context = sentiment
                
                # Apply Bias
                # If Score is +2 (Strong Inflation), add gradual 5% increase over 30 days
                # If Score is -2 (Strong Deflation), add gradual 5% decrease
                if sentiment['score'] != 0:
                    impact_factor = 0.02 * sentiment['score'] # 2% per sentiment point
                    # Clamp
                    impact_factor = max(min(impact_factor, 0.10), -0.10) 
                    
                    print(f"Applying News Impact: {impact_factor*100}% based on '{sentiment['signal']}'")
                    
                    # Apply linear drift to future points
                    future_indices = forecast.index[-days_ahead:]
                    for i, idx in enumerate(future_indices):
                        # gradual application (0% at day 0 to 100% of impact at day 30)
                        weight = (i + 1) / days_ahead
                        drift = current_price * impact_factor * weight
                        forecast.at[idx, 'yhat'] += drift
                        forecast.at[idx, 'yhat_lower'] += drift
                        forecast.at[idx, 'yhat_upper'] += drift
            # ------------------------

            future_forecast = forecast.tail(days_ahead)
            
            predictions = []
            for _, row in future_forecast.iterrows():
                predictions.append({
                    "date": row['ds'].strftime('%Y-%m-%d'),
                    "predicted_price": round(row['yhat']),
                    "lower_bound": round(row['yhat_lower']),
                    "upper_bound": round(row['yhat_upper'])
                })
                
            trend = "Stable"
            if len(predictions) > 0:
                final_pred = predictions[-1]['predicted_price']
                if final_pred < current_price * 0.95:
                    trend = "Dropping"
                elif final_pred > current_price * 1.05:
                    trend = "Rising"
                
            return {
                "current_price": current_price,
                "trend": trend,
                "forecast": predictions,
                "recommendation": "Buy Now" if trend == "Rising" or trend == "Stable" else "Wait",
                "data_source": source,
                "news_context": news_context
            }
        except Exception as e:
            print(f"Prophet/News Error: {e}")
            return { "trend": "Error", "forecast": [], "recommendation": "Error", "data_source": "Error" }
