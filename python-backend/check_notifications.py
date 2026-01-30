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

print('Checking notifications...')
with engine.connect() as conn:
    result = conn.execute(text('SELECT id, "userEmail", title, message, "productTitle", "newPrice", "createdAt" FROM "Notification" ORDER BY "createdAt" DESC LIMIT 3'))
    for row in result:
        print(f'ID: {row.id}')
        print(f'User: {row.userEmail}')
        print(f'Title: {row.title}')
        print(f'Message: {row.message}')
        print(f'Product: {row.productTitle}')
        print(f'New Price: ₹{row.newPrice}')
        print(f'Created: {row.createdAt}')
        print('---')