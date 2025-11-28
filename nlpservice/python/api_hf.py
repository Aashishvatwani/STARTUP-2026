"""
api_hf.py

FastAPI app that loads the transformer tokenizer and the PyTorch regressor saved by training_hf.py.
Accepts the same RefundRequest JSON and returns the refund split.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import torch
import os
from transformers import AutoTokenizer
import json

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models_refund_hf')
MODEL_STATE = os.path.join(MODEL_DIR, 'model.pt')

app = FastAPI()

class RefundRequest(BaseModel):
    price: float
    reason_text: str
    delay_days: int
    rating: Optional[int] = None

class RefundResponse(BaseModel):
    refund_percent: float
    platform_fee: float
    customer_refund: float
    solver_amount: float


@app.on_event("startup")
def load():
    global TOKENIZER, MODEL, DEVICE
    if not os.path.exists(MODEL_DIR) or not os.path.exists(MODEL_STATE):
        raise RuntimeError(f"Model artifacts not found in {MODEL_DIR}. Run training_hf.py first.")

    with open(os.path.join(MODEL_DIR, 'meta.json'), 'r') as f:
        meta = json.load(f)
    backbone = meta.get('backbone')
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    TOKENIZER = AutoTokenizer.from_pretrained(MODEL_DIR)

    # Import model class locally (same architecture as training_hf)
    from training_hf import TransformerRegressor
    MODEL = TransformerRegressor(backbone)
    MODEL.load_state_dict(torch.load(MODEL_STATE, map_location=DEVICE))
    MODEL.to(DEVICE)
    MODEL.eval()


@app.post('/predict_refund', response_model=RefundResponse)
def predict(req: RefundRequest):
    try:
        rating = float(req.rating) if req.rating is not None else 3.0
        enc = TOKENIZER(req.reason_text, truncation=True, padding='max_length', max_length=128, return_tensors='pt')
        input_ids = enc['input_ids'].to(DEVICE)
        attention_mask = enc['attention_mask'].to(DEVICE)
        delay = torch.tensor([float(req.delay_days)], dtype=torch.float).to(DEVICE)
        rating_t = torch.tensor([rating], dtype=torch.float).to(DEVICE)

        with torch.no_grad():
                pred = MODEL(input_ids=input_ids, attention_mask=attention_mask, delay=delay, rating=rating_t)
                refund_percent = float(pred.cpu().numpy().squeeze())
                refund_percent = max(0.0, min(100.0, refund_percent))

                # Business rule: do not refund for trivial cases. If predicted refund
                # percent is under 20% we treat it as no refund.
                if refund_percent < 20.0:
                    refund_percent = 0.0

        P = float(req.price)
        platform_fee = 0.10 * P
        remaining = 0.90 * P
        customer_refund = (refund_percent / 100.0) * remaining
        solver_amount = remaining - customer_refund

        return {
            'refund_percent': round(refund_percent, 2),
            'platform_fee': round(platform_fee, 2),
            'customer_refund': round(customer_refund, 2),
            'solver_amount': round(solver_amount, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('api_hf:app', host='0.0.0.0', port=8000, reload=True)
