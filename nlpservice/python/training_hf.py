"""
training_hf.py

Train a regression model using a HuggingFace transformer as embedding backbone
and a small MLP regression head that also consumes numeric features (delay_days, rating).

This uses plain PyTorch training loop (no Trainer) for clarity and control.

Usage:
  python training_hf.py

Notes:
- Replace the `build_dummy_data()` with your CSV/JSON loader for real data.
- Saves tokenizer and model state to `models_refund_hf/`.
"""

import os
import math
import random
from dataclasses import dataclass
from typing import List, Optional

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel
import pandas as pd
import numpy as np

MODEL_NAME = "distilbert-base-uncased"  # swap to 'microsoft/deberta-v3-small' if you want
SAVE_DIR = "./models_refund_hf"
os.makedirs(SAVE_DIR, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class RefundDataset(Dataset):
    def __init__(self, texts: List[str], delays: List[float], ratings: List[float], labels: List[float], tokenizer, max_len=128):
        self.texts = texts
        self.delays = delays
        self.ratings = ratings
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        txt = self.texts[idx]
        enc = self.tokenizer(txt, truncation=True, padding='max_length', max_length=self.max_len, return_tensors='pt')
        item = {
            'input_ids': enc['input_ids'].squeeze(0),
            'attention_mask': enc['attention_mask'].squeeze(0),
            'delay': torch.tensor(self.delays[idx], dtype=torch.float),
            'rating': torch.tensor(self.ratings[idx], dtype=torch.float),
            'label': torch.tensor(self.labels[idx], dtype=torch.float),
        }
        return item


class TransformerRegressor(nn.Module):
    def __init__(self, backbone_name: str, embed_size: int = 768, numeric_feat_dim: int = 2, hidden_dim: int = 256):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(backbone_name)
        # get hidden size from backbone config
        config_hidden = self.backbone.config.hidden_size
        self.embed_dim = config_hidden
        self.mlp = nn.Sequential(
            nn.Linear(self.embed_dim + numeric_feat_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1),
        )

    def forward(self, input_ids, attention_mask, delay, rating):
        # backbone returns last_hidden_state; use CLS token (first token) pooled representation
        out = self.backbone(input_ids=input_ids, attention_mask=attention_mask, return_dict=True)
        # DistilBERT / many models: take hidden_state[:,0,:]
        pooled = out.last_hidden_state[:, 0, :]  # (batch, hidden)
        numeric = torch.stack([delay, rating], dim=1)  # (batch, 2)
        x = torch.cat([pooled, numeric], dim=1)
        out = self.mlp(x)
        return out.squeeze(1)


def build_dummy_data():
    data = [
        {"reason_text": "Work delivered 3 days late and half features missing.", "delay_days": 3, "rating": 2, "refund_percent": 80},
        {"reason_text": "Minor UI tweaks missing, delivered on time.", "delay_days": 0, "rating": 4, "refund_percent": 10},
        {"reason_text": "Major functionality broken, not tested.", "delay_days": 5, "rating": 1, "refund_percent": 90},
        {"reason_text": "Good job but a small delay of 1 day.", "delay_days": 1, "rating": 4, "refund_percent": 20},
        {"reason_text": "Never delivered.", "delay_days": 30, "rating": 1, "refund_percent": 100},
        {"reason_text": "Delivered, but quality poor and many bugs.", "delay_days": 7, "rating": 2, "refund_percent": 70},
        {"reason_text": "Excellent work. On time and exactly as requested.", "delay_days": 0, "rating": 5, "refund_percent": 0},
        {"reason_text": "Late by 2 days; missing small feature.", "delay_days": 2, "rating": 3, "refund_percent": 40},
    ]
    return pd.DataFrame(data)


def collate_fn(batch):
    input_ids = torch.stack([b['input_ids'] for b in batch], dim=0)
    attention_mask = torch.stack([b['attention_mask'] for b in batch], dim=0)
    delays = torch.stack([b['delay'] for b in batch], dim=0)
    ratings = torch.stack([b['rating'] for b in batch], dim=0)
    labels = torch.stack([b['label'] for b in batch], dim=0)
    return {
        'input_ids': input_ids,
        'attention_mask': attention_mask,
        'delay': delays,
        'rating': ratings,
        'labels': labels,
    }


def train(model, tokenizer, train_loader, val_loader, epochs=6, lr=2e-5):
    model.to(DEVICE)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        for batch in train_loader:
            optimizer.zero_grad()
            input_ids = batch['input_ids'].to(DEVICE)
            attention_mask = batch['attention_mask'].to(DEVICE)
            delay = batch['delay'].to(DEVICE)
            rating = batch['rating'].to(DEVICE)
            labels = batch['labels'].to(DEVICE)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, delay=delay, rating=rating)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * input_ids.size(0)

        avg_train = total_loss / len(train_loader.dataset)

        # val
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(DEVICE)
                attention_mask = batch['attention_mask'].to(DEVICE)
                delay = batch['delay'].to(DEVICE)
                rating = batch['rating'].to(DEVICE)
                labels = batch['labels'].to(DEVICE)
                outputs = model(input_ids=input_ids, attention_mask=attention_mask, delay=delay, rating=rating)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * input_ids.size(0)
        avg_val = val_loss / len(val_loader.dataset)

        print(f"Epoch {epoch+1}/{epochs} train_loss={avg_train:.4f} val_loss={avg_val:.4f}")

    return model


if __name__ == "__main__":
    df = build_dummy_data()

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    # prepare features
    texts = df['reason_text'].fillna(" ").tolist()
    delays = df['delay_days'].fillna(0).astype(float).tolist()
    ratings = df['rating'].fillna(3).astype(float).tolist()
    labels = df['refund_percent'].astype(float).tolist()

    # train/val split
    idx = list(range(len(texts)))
    random.shuffle(idx)
    split = int(0.8 * len(idx))
    train_idx = idx[:split]
    val_idx = idx[split:]

    train_ds = RefundDataset([texts[i] for i in train_idx], [delays[i] for i in train_idx], [ratings[i] for i in train_idx], [labels[i] for i in train_idx], tokenizer)
    val_ds = RefundDataset([texts[i] for i in val_idx], [delays[i] for i in val_idx], [ratings[i] for i in val_idx], [labels[i] for i in val_idx], tokenizer)

    train_loader = DataLoader(train_ds, batch_size=4, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=4, shuffle=False, collate_fn=collate_fn)

    model = TransformerRegressor(MODEL_NAME)

    model = train(model, tokenizer, train_loader, val_loader, epochs=6, lr=2e-5)

    # save model and tokenizer
    print("Saving model...")
    model_path = os.path.join(SAVE_DIR, 'model.pt')
    torch.save(model.state_dict(), model_path)
    tokenizer.save_pretrained(SAVE_DIR)
    # Also save config metadata
    import json
    with open(os.path.join(SAVE_DIR, 'meta.json'), 'w') as f:
        json.dump({"backbone": MODEL_NAME}, f)

    print("Saved to", SAVE_DIR)
