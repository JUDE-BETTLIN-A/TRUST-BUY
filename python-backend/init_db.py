
import sqlalchemy
from sqlalchemy import create_engine, text
import os

# Connection Config
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

def init_db():
    print("Connecting to Neon Database...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            print("Connection Successful!")
            
            # Create Schema
            print("Creating Tables...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    title TEXT NOT NULL,
                    url TEXT NOT NULL UNIQUE,
                    source TEXT,
                    image_url TEXT,
                    latest_price NUMERIC
                );
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id SERIAL PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    product_id INTEGER REFERENCES products(id),
                    price NUMERIC NOT NULL
                );
            """))
            conn.commit()
            print("Tables 'products' and 'price_history' are ready.")
            
    except Exception as e:
        print(f"Error initializing DB: {e}")

if __name__ == "__main__":
    init_db()
