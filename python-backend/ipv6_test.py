
import sqlalchemy
from sqlalchemy import create_engine, text
import pandas as pd
import sys
import os

# Load from Environment
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

def check_conn():
    print("Testing IPv6 Connection...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            print("IPv6 Connection SUCCESS!")
            return True
    except Exception as e:
        print(f"IPv6 Failed: {e}")
        return False

if __name__ == "__main__":
    check_conn()
