from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import PricePredictor
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os

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

@app.get("/")
def home():
    return {"status": "ML Backend Live"}

@app.post("/predict")
def predict_price(request: PriceRequest):
    try:
        result = predictor.predict(request.current_price, request.product_url, request.product_name)
        result['product_name'] = request.product_name
        return result
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
