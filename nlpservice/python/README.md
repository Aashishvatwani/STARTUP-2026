# NLP Service - Local testing guide

This folder contains `nlp_service.py` (FastAPI) and helper files to run quick tests.

Quick test (fast, no large model downloads)

1. Create a virtual environment (PowerShell):

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install the light test dependencies:

```powershell
pip install -r requirements.txt
```

3. Run the pytest test suite (the test fakes the Hugging Face pipeline so no model download):

```powershell
pytest -q
```

Run the real service with HF models (optional, heavy)

- The real service imports `transformers.pipeline` at module import time and will try to download models if not cached.
- To run the service with real models install `transformers` and a backend (e.g., `torch`) and optionally `spacy`:

```powershell
pip install transformers torch spacy
# (optionally) python -m spacy download en_core_web_sm
uvicorn nlp_service:app --reload
```

Notes
- The provided pytest test injects a fake `transformers` module so tests remain fast and deterministic.
- If you want to test the full pipeline (with a real model), expect large downloads and longer startup time.
