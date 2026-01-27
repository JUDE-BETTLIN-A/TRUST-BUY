
import sqlalchemy
from sqlalchemy import create_engine, text
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")
engine = create_engine(DATABASE_URL)

def seed_history():
    print("Connecting to DB...")
    with engine.connect() as conn:
        # Get products. If none, creates a dummy one for testing.
        products = conn.execute(text("SELECT id, title, latest_price FROM products")).fetchall()
        
        if not products:
            print("No products found. Creating a test product 'Apple iPhone 15'...")
            conn.execute(text("""
                INSERT INTO products (title, url, source, latest_price) 
                VALUES ('Apple iPhone 15 (128 GB) - Black', 'https://amazon.in/test-iphone', 'Amazon', 71000)
            """))
            conn.commit()
            products = conn.execute(text("SELECT id, title, latest_price FROM products")).fetchall()

        print(f"Found {len(products)} products. Seeding history...")

        for p in products:
            pid = p[0]
            title = p[1]
            current_price = float(p[2]) if p[2] else 70000.0
            
            # Check if history exists
            existing = conn.execute(text("SELECT count(*) FROM price_history WHERE product_id = :pid"), {"pid": pid}).scalar()
            if existing > 5:
                print(f"Skipping {title[:20]}... already has {existing} points.")
                continue

            print(f"Generating data for {title[:20]}... around {current_price}")
            
            # Generate 60 days of data
            days = 60
            volatility = current_price * 0.05
            
            # logic: slightly higher in past, drops to current
            start_price = current_price * (1 + random.uniform(0.05, 0.15)) 
            
            points = []
            price = start_price
            
            for i in range(days, 0, -1):
                date = datetime.now() - timedelta(days=i)
                change = np.random.normal(0, volatility * 0.2)
                price += change
                if i < 5:
                    price = price * 0.8 + current_price * 0.2
                final_price = round(max(price, current_price * 0.5))
                
                points.append({
                    "product_id": pid,
                    "price": final_price,
                    "created_at": date.isoformat()
                })
            
            if points:
                conn.execute(text("""
                    INSERT INTO price_history (product_id, price, created_at)
                    VALUES (:product_id, :price, :created_at)
                """), points)
                conn.commit()
                
    print("Seeding Complete! Refresh your page.")

if __name__ == "__main__":
    seed_history()
