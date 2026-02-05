from fastapi import FastAPI
from model import PricePredictor
import uvicorn

app = FastAPI()
predictor = PricePredictor()

@app.get('/')
def home():
    return {"status": "ML Backend Live"}

@app.post('/predict')
def predict_price(data: dict):
    result = predictor.predict(data.get('current_price', 50000), data.get('product_url'), data.get('product_name', ''))
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8006)