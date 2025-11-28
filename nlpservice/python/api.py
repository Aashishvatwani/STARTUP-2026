"""
api.py

FastAPI app that loads the saved regressor and a SentenceTransformer embedder.
Exposes POST /predict_refund which expects JSON:
{
  "price": 10000,
  "reason_text": "Late delivery and bugs",
  "delay_days": 3,
  "rating": 2  # optional
}

Returns JSON with refund_percent and computed money split.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import joblib
import numpy as np
from sentence_transformers import SentenceTransformer
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models_refund", "refund_model.joblib")

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
def load_models():
    global MODEL, EMBEDDER
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model not found at {MODEL_PATH}. Run training.py first.")

    data = joblib.load(MODEL_PATH)
    MODEL = data["regressor"]
    embed_name = data.get("embed_model_name", "sentence-transformers/all-MiniLM-L6-v2")
    print("Loading embedder:", embed_name)
    EMBEDDER = SentenceTransformer(embed_name)


@app.post("/predict_refund", response_model=RefundResponse)
def predict_refund(req: RefundRequest):
    try:
        # embed text
        emb = EMBEDDER.encode([req.reason_text], convert_to_numpy=True)
        # numeric features
        delay = float(req.delay_days)
        rating = float(req.rating) if req.rating is not None else 3.0
        X = np.hstack([emb, np.array([[delay, rating]])])

        pred = MODEL.predict(X)[0]
        # clamp
        refund_percent = float(np.clip(pred, 0.0, 100.0))

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
            "refund_percent": round(refund_percent, 2),
            "platform_fee": round(platform_fee, 2),
            "customer_refund": round(customer_refund, 2),
            "solver_amount": round(solver_amount, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# If you want to run with `python api.py` for local development, include the uvicorn runner:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
