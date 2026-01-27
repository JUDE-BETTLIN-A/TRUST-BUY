
import sqlalchemy
from sqlalchemy import create_engine, text
import pandas as pd
import sys

# Try IPv6 Literal
DATABASE_URL = "postgresql://postgres:Judebettlin%402004@[2406:da1c:f42:ae0b:35:48c1:5a99:b92f]:5432/postgres"

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
