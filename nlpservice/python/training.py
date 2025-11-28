"""
training.py

Train a refund-percent regression model.
Approach:
- Use `sentence-transformers` to embed `reason_text` (e.g. `all-MiniLM-L6-v2`).
- Concatenate numeric features (delay_days, rating) to embeddings.
- Train a scikit-learn regressor (RandomForestRegressor) to predict refund_percent (0-100).
- Save the trained regressor and metadata with joblib.

This file includes a minimal dummy dataset for demonstration. Replace the `data` loading block with your CSV/JSON loader.
"""

from sentence_transformers import SentenceTransformer
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
SAVE_DIR = "./models_refund"
os.makedirs(SAVE_DIR, exist_ok=True)


def build_dummy_data():
    # Small illustrative dataset. Replace with your CSV/JSON loader.
    data=pd.read_csv("data/refund_dataset_var5_5000.csv")
    
    return pd.DataFrame(data)


def prepare_features(df, embedder):
    texts = df["reason_text"].fillna("").tolist()
    # embeddings: (N, D)
    embeddings = embedder.encode(texts, show_progress_bar=False, convert_to_numpy=True)

    # numeric features
    delay = df["delay_days"].fillna(0).astype(float).to_numpy().reshape(-1, 1)
    # rating may be optional; fill with median or 3
    rating = df.get("rating")
    if rating is None:
        rating_arr = np.full((len(df), 1), 3.0)
    else:
        rating_arr = df["rating"].fillna(3).astype(float).to_numpy().reshape(-1, 1)

    X = np.hstack([embeddings, delay, rating_arr])
    y = df["refund_percent"].astype(float).to_numpy()
    return X, y


def train_and_save(sample_df=None):
    if sample_df is None:
        df = build_dummy_data()
    else:
        df = sample_df.copy()

    print("Loading embedder:", EMBED_MODEL_NAME)
    embedder = SentenceTransformer(EMBED_MODEL_NAME)

    X, y = prepare_features(df, embedder)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training regressor...")
    reg = RandomForestRegressor(n_estimators=200, random_state=42)
    reg.fit(X_train, y_train)

    preds = reg.predict(X_val)
    mae = mean_absolute_error(y_val, preds)
    print(f"Validation MAE: {mae:.3f}")

    # Save model and metadata
    joblib.dump({
        "regressor": reg,
        "embed_model_name": EMBED_MODEL_NAME,
    }, os.path.join(SAVE_DIR, "refund_model.joblib"))

    print("Saved model to", os.path.join(SAVE_DIR, "refund_model.joblib"))


if __name__ == "__main__":
    train_and_save()
