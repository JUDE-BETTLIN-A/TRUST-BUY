import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from pathlib import Path

# Disable matplotlib backend to avoid GUI issues
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

# Load environment variables from .env file in parent directory
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Load from Environment
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL)
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        DATABASE_URL = None
else:
    print("⚠️  No DATABASE_URL found, running without database")
    DATABASE_URL = None

class PricePredictor:
    def __init__(self):
        self.model = None

    def get_real_history(self, product_url):
        """Fetch real price history from DB"""
        if not DATABASE_URL:
            print("❌ No DATABASE_URL configured")
            return pd.DataFrame()

        try:
            print(f"🔍 Querying DB for URL: {product_url}")
            query = text("""
                SELECT ph.created_at as ds, ph.price as y
                FROM price_history ph
                JOIN products p ON p.id = ph.product_id
                WHERE p.url = :url
                ORDER BY ph.created_at ASC
            """)
            with engine.connect() as conn:
                df = pd.read_sql(query, conn, params={"url": product_url})
                print(f"📊 DB Query completed: {len(df)} rows returned")
                if len(df) > 0:
                    # Normalize timestamps to timezone-naive
                    df['ds'] = pd.to_datetime(df['ds']).dt.tz_localize(None)
                    print(f"📅 Date range: {df['ds'].min()} to {df['ds'].max()}")
                    print(f"💰 Price range: ₹{df['y'].min()} to ₹{df['y'].max()}")
                return df
        except Exception as e:
            print(f"❌ DB Error: {e}")
            return pd.DataFrame()

    def predict(self, current_price, product_url=None, product_name="", days_ahead=25):
        # 1. PRIMARY SOURCE: Real Database History (Self-built DB)
        # Always check our own DB first to save time/resources
        df = pd.DataFrame()
        source = "None"

        if product_url:
            df = self.get_real_history(product_url)
            print(f"DB Query Result: Found {len(df)} real data points for URL: {product_url}")

            if len(df) >= 10:
                print(f"✅ Using REAL DB data with Prophet: {len(df)} points")
                source = "Real Database + Prophet"
                return self._predict_with_prophet_from_df(df, current_price, days_ahead)
            elif len(df) >= 1:
                print(f"✅ Using REAL data: {len(df)} points from database")
                source = "Real Database"

        # 2. SECONDARY SOURCE: External Web Scraper (PriceHistoryApp)
        # User requested this as PRIMARY external source
        from history_scraper import fetch_external_history
        
        try:
            print("🔄 Attempting Primary Scraper (PriceHistoryApp)...")
            ext_df = fetch_external_history(product_url, product_name)
            if not ext_df.empty:
                print(f"✅ Scraper Success! Found {len(ext_df)} points.")
                
                # CRITICAL FIX: Normalize all timestamps to timezone-naive
                ext_df['ds'] = pd.to_datetime(ext_df['ds']).dt.tz_localize(None)
                
                # STRICT PRICE SANITY CHECK - Reject if prices don't match current product
                avg_scraped_price = ext_df['y'].mean()
                max_scraped_price = ext_df['y'].max()
                min_scraped_price = ext_df['y'].min()
                
                # Check if current price is within a reasonable range of scraped data
                # If current is ₹82,900 and scraped average is ₹1,00,000+, it's likely wrong product
                price_ratio = current_price / avg_scraped_price if avg_scraped_price > 0 else 0
                
                # STRICT: Price must be within 2x range (not 10x)
                if price_ratio > 2 or price_ratio < 0.5:
                    print(f"⚠️ PRICE MISMATCH DETECTED!")
                    print(f"   Current product price: ₹{current_price:,.0f}")
                    print(f"   Scraped data - Avg: ₹{avg_scraped_price:,.0f}, Min: ₹{min_scraped_price:,.0f}, Max: ₹{max_scraped_price:,.0f}")
                    print(f"   Ratio: {price_ratio:.2f}x - This is WRONG PRODUCT DATA. Rejecting.")
                    # Don't use this data - fall through to other sources
                else:
                    print(f"✅ Price sanity check passed. Ratio: {price_ratio:.2f}x")
                    
                    # Merge with any existing DB data if valid
                    if not df.empty:
                        df['ds'] = pd.to_datetime(df['ds']).dt.tz_localize(None)
                        ext_df = pd.concat([df, ext_df]).drop_duplicates(subset='ds').sort_values('ds')
                    
                    source = "PriceHistoryApp Scraper + Prophet"
                    return self._predict_with_prophet_from_df(ext_df, current_price, days_ahead)
        except Exception as e:
            print(f"⚠️ Primary Scraper failed: {e}")

        # 3. FALLBACK SOURCE: Telegram Bots
        from telegram_integration import telegram_integration
        if telegram_integration:
            try:
                print("🔄 Scraper failed or empty, trying Telegram Bot fallback...")
                import asyncio
                bot_history = asyncio.run(telegram_integration.get_price_history(product_url, product_name))
                if bot_history and len(bot_history) > 10:
                    print(f"✅ Got {len(bot_history)} points from Telegram bots - using Prophet!")
                    return self._predict_with_prophet(bot_history, current_price, days_ahead)
            except Exception as e:
                print(f"⚠️  Bot history fallback failed: {e}")

        # 4. Final: No Data fallback
        if len(df) < 1:
            print("🚨 No real data available from any source.")
            return {
                "current_price": current_price,
                "trend": "Unknown",
                "forecast": [],
                "recommendation": "Neutral",
                "data_source": "No History Data Available",
                "history_unavailable": True
            }

        print(f"🎯 Final: Using {len(df)} data points from {source} with Simple Model")
        return self._predict_with_moving_average(df, current_price, days_ahead, source)

    def _predict_with_prophet(self, bot_history, current_price, days_ahead):
        """AI-powered prediction using advanced algorithms (simulating Prophet)"""
        try:
            # Convert bot history to DataFrame
            df = pd.DataFrame({
                'ds': pd.to_datetime([item['date'] for item in bot_history]),
                'y': [item['price'] for item in bot_history]
            })

            # Add current price as latest data point
            current_row = pd.DataFrame({
                'ds': [pd.Timestamp.now()],
                'y': [current_price]
            })
            df = pd.concat([df, current_row], ignore_index=True)
            df = df.drop_duplicates(subset='ds').sort_values('ds')

            if len(df) < 5:
                print(f"⚠️ Not enough data points ({len(df)}) for Prophet model. Need at least 5.")
                return self._predict_with_moving_average(
                    df, current_price, days_ahead, f"Bot Data (Fallback - {len(df)} points)"
                )

            print(f"🤖 AI Model training on {len(df)} data points from {bot_history[0]['source'] if bot_history else 'Bot'}")

            # Advanced AI prediction algorithm (simulating Prophet behavior)
            predictions = self._advanced_ai_forecast(df, current_price, days_ahead)

            trend = "Stable"
            if len(predictions) > 0:
                final_pred = predictions[-1]['predicted_price']
                if final_pred < current_price * 0.95:
                    trend = "Dropping"
                elif final_pred > current_price * 1.05:
                    trend = "Rising"

            # Convert history to JSON format
            history_data = []
            for _, row in df.iterrows():
                history_data.append({
                    "date": row['ds'].strftime('%Y-%m-%d') if hasattr(row['ds'], 'strftime') else str(row['ds'])[:10],
                    "price": float(row['y'])
                })

            return {
                "current_price": current_price,
                "trend": trend,
                "forecast": predictions,
                "recommendation": "Buy Now" if trend == "Rising" or trend == "Stable" else "Wait",
                "data_source": f"Telegram Bot ({bot_history[0].get('source', 'Bot')} + Prophet)",
                "bot_data_points": len(bot_history),
                "history": history_data
            }

        except Exception as e:
            print(f"❌ AI prediction failed: {e}")
            return self._predict_with_moving_average(
                pd.DataFrame({'ds': [pd.Timestamp.now()], 'y': [current_price]}),
                current_price, days_ahead, "Bot Data (Fallback)"
            )

    def _predict_with_prophet_from_df(self, df, current_price, days_ahead):
        """AI prediction with DataFrame data"""
        try:
            df['ds'] = pd.to_datetime(df['ds']).dt.tz_localize(None)

            print(f"🤖 AI Model training on {len(df)} database data points")

            predictions = self._advanced_ai_forecast(df, current_price, days_ahead)

            trend = "Stable"
            if len(predictions) > 0:
                final_pred = predictions[-1]['predicted_price']
                if final_pred < current_price * 0.95:
                    trend = "Dropping"
                elif final_pred > current_price * 1.05:
                    trend = "Rising"

            # CONVERT HISTORY TO JSON-SERIALIZABLE FORMAT
            history_data = []
            for _, row in df.iterrows():
                history_data.append({
                    "date": row['ds'].strftime('%Y-%m-%d') if hasattr(row['ds'], 'strftime') else str(row['ds'])[:10],
                    "price": float(row['y'])
                })

            return {
                "current_price": current_price,
                "trend": trend,
                "forecast": predictions,
                "recommendation": "Buy Now" if trend == "Rising" or trend == "Stable" else "Wait",
                "data_source": "Database + AI Prophet Model",
                "data_points": len(df),
                "history": history_data  # <-- THIS IS THE FIX: Return the scraped history!
            }

        except Exception as e:
            print(f"❌ AI prediction failed: {e}")
            return self._predict_with_moving_average(df, current_price, days_ahead, "Database (Fallback)")

    def _run_prophet_model(self, df, days_ahead):
        """Run actual Facebook Prophet model on the data"""
        try:
            # Ensure safe data types
            df['ds'] = pd.to_datetime(df['ds']).dt.tz_localize(None)
            df['y'] = pd.to_numeric(df['y'], errors='coerce')
            df = df.dropna()

            if len(df) < 5:
                print("⚠️ Not enough data for Prophet (need at least 5 points)")
                return None

            # Initialize and train Prophet model
            # changepoint_prior_scale: flexibility of the trend (0.05 is default)
            # seasonality_mode: addictive (default) or multiplicative
            m = Prophet(daily_seasonality=True, yearly_seasonality=False, weekly_seasonality=True)
            
            # Suppress Prophet output
            import logging
            logging.getLogger('cmdstanpy').setLevel(logging.WARNING)
            
            m.fit(df)

            # Create future dataframe
            future = m.make_future_dataframe(periods=days_ahead)
            
            # Predict
            forecast = m.predict(future)
            
            # Extract relevant future predictions
            future_forecast = forecast.tail(days_ahead)
            
            predictions = []
            for _, row in future_forecast.iterrows():
                predictions.append({
                    "date": row['ds'].strftime('%Y-%m-%d'),
                    "predicted_price": int(row['yhat']),
                    "lower_bound": int(row['yhat_lower']),
                    "upper_bound": int(row['yhat_upper'])
                })
                
            return predictions
        except Exception as e:
            print(f"❌ Prophet model run failed: {e}")
            return None

    def _advanced_ai_forecast(self, df, current_price, days_ahead):
        """
        Wrapper that tries real Prophet first, falls back to simulation if Prophet fails
        or if there's insufficient data.
        """
        # Try running real Prophet model
        prophet_predictions = self._run_prophet_model(df, days_ahead)
        
        if prophet_predictions:
            print("✅ Successfully generated predictions using Real Facebook Prophet Model")
            return prophet_predictions
            
        print("⚠️ Prophet model unavailable/failed, using advanced heuristic model")
        
        # Fallback to the original heuristic logic if Prophet fails
        prices = df['y'].values
        dates = df['ds'].values

        if len(prices) < 2:
            # Simple trend for minimal data
            predictions = []
            for i in range(days_ahead):
                future_date = (pd.Timestamp.now() + pd.Timedelta(days=i+1)).strftime('%Y-%m-%d')
                predicted_price = int(current_price * (1 + 0.001 * i))
                predictions.append({
                    "date": future_date,
                    "predicted_price": predicted_price,
                    "lower_bound": int(predicted_price * 0.92),
                    "upper_bound": int(predicted_price * 1.08)
                })
            return predictions

        # Advanced AI algorithm components (Heuristic Fallback):

        # 1. Trend Analysis (Linear + Seasonal)
        from scipy import stats
        slope, intercept, _, _, _ = stats.linregress(range(len(prices)), prices)
        trend_component = slope * np.arange(len(prices) + days_ahead) + intercept

        # 2. Seasonal Component (Weekly patterns)
        seasonal_period = 7  # Weekly seasonality
        seasonal_component = np.zeros(len(prices) + days_ahead)

        if len(prices) >= seasonal_period:
            for i in range(seasonal_period):
                indices = np.arange(i, len(prices), seasonal_period)
                if len(indices) > 0:
                    seasonal_component[i::seasonal_period] = np.mean(prices[indices] - trend_component[indices])

        # 3. Volatility-based Confidence Intervals
        price_changes = np.diff(prices)
        
        # Calculate volatility, but enforce a "Minimum Real World Uncertainty"
        # Even stable assets have potential risk. We use 1.5% as a base minimum to avoid "Dead Line" charts.
        calculated_vol = np.std(price_changes) if len(price_changes) > 0 else 0
        min_volatility = current_price * 0.015 
        volatility = max(calculated_vol, min_volatility)
        
        confidence_multiplier = 1.96  # 95% confidence interval standard

        # 4. Generate AI-powered predictions
        predictions = []
        for i in range(days_ahead):
            future_idx = len(prices) + i
            future_date = (pd.Timestamp.now() + pd.Timedelta(days=i+1)).strftime('%Y-%m-%d')

            # Combine trend and seasonal components
            base_prediction = trend_component[future_idx] + seasonal_component[future_idx % seasonal_period]

            # Add some AI "intelligence" - converge towards market average
            market_avg = np.mean(prices[-30:]) if len(prices) > 30 else np.mean(prices)
            convergence_factor = 0.1 * (i + 1) / days_ahead  # Gradual convergence
            ai_adjusted_price = base_prediction * (1 - convergence_factor) + market_avg * convergence_factor

            # Ensure reasonable bounds
            ai_adjusted_price = max(current_price * 0.8, min(current_price * 1.2, ai_adjusted_price))

            # Calculate confidence intervals based on historical volatility
            uncertainty = volatility * confidence_multiplier * (1 + i * 0.1)  # Increasing uncertainty
            lower_bound = max(1, int(ai_adjusted_price - uncertainty))
            upper_bound = int(ai_adjusted_price + uncertainty)

            predictions.append({
                "date": future_date,
                "predicted_price": int(ai_adjusted_price),
                "lower_bound": lower_bound,
                "upper_bound": upper_bound
            })

        return predictions

    def _predict_with_moving_average(self, df, current_price, days_ahead, source):
        """Simple moving average forecasting as fallback"""
        from news_sentiment import fetch_market_sentiment

        try:
            if len(df) < 2:
                print("⚠️  Only 1 data point, using simple trend.")
                predictions = []
                trend = "Stable"
                for i in range(days_ahead):
                    future_date = (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d')
                    predicted_price = int(current_price * (1 + 0.001 * i))
                    predictions.append({
                        "date": future_date,
                        "predicted_price": predicted_price,
                        "lower_bound": int(predicted_price * 0.95),
                        "upper_bound": int(predicted_price * 1.05)
                    })
            else:
                prices = df['y'].values
                avg_change = np.mean(np.diff(prices)) if len(prices) > 1 else 0
                trend_direction = "Rising" if avg_change > 0 else "Dropping" if avg_change < -50 else "Stable"

                predictions = []
                for i in range(days_ahead):
                    future_date = (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d')
                    predicted_price = int(current_price + avg_change * (i + 1))
                    predictions.append({
                        "date": future_date,
                        "predicted_price": max(1, predicted_price),
                        "lower_bound": max(1, int(predicted_price * 0.9)),
                        "upper_bound": int(predicted_price * 1.1)
                    })

                trend = trend_direction

            # News integration
            news_context = None
            try:
                sentiment = fetch_market_sentiment("")
                news_context = sentiment

                if sentiment['score'] != 0:
                    impact_factor = 0.01 * sentiment['score']
                    impact_factor = max(min(impact_factor, 0.05), -0.05)

                    print(f"Applying News Impact: {impact_factor*100}% based on '{sentiment['signal']}'")

                    for pred in predictions:
                        pred['predicted_price'] = int(pred['predicted_price'] * (1 + impact_factor))
                        pred['lower_bound'] = int(pred['lower_bound'] * (1 + impact_factor))
                        pred['upper_bound'] = int(pred['upper_bound'] * (1 + impact_factor))
            except Exception as e:
                print(f"News integration failed: {e}")

            # Convert history to JSON format
            history_data = []
            for _, row in df.iterrows():
                history_data.append({
                    "date": row['ds'].strftime('%Y-%m-%d') if hasattr(row['ds'], 'strftime') else str(row['ds'])[:10],
                    "price": float(row['y'])
                })

            return {
                "current_price": current_price,
                "trend": trend,
                "forecast": predictions,
                "recommendation": "Buy Now" if trend == "Rising" or trend == "Stable" else "Wait",
                "data_source": source,
                "news_context": news_context,
                "history": history_data
            }
        except Exception as e:
            print(f"❌ Moving average prediction failed: {e}")
            return {
                "trend": "Error",
                "forecast": [],
                "recommendation": "Error",
                "data_source": "Error"
            }
