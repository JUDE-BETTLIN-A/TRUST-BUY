#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine, text

# Load environment variables
env_path = Path('../.env')
if env_path.exists():
    load_dotenv(env_path)

DATABASE_URL = os.environ.get('DATABASE_URL')
engine = create_engine(DATABASE_URL)

print("Checking alert data...")
with engine.connect() as conn:
    result = conn.execute(text('SELECT id, "userEmail", "productTitle", "targetPrice", "currentPrice" FROM "Alert" LIMIT 5'))
    for row in result:
        print(f'Alert ID: {row.id}')
        print(f'User: {row.userEmail}')
        print(f'Product: {row.productTitle}')
        print(f'Target Price: ₹{row.targetPrice}')
        print(f'Current Price: ₹{row.currentPrice}')
        print('---')