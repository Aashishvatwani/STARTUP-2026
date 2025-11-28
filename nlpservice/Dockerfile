FROM python:3.11-slim

WORKDIR /app

# Install system deps that some Python packages require (adjust as needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy app sources
COPY . /app

EXPOSE 8000
ENV PYTHONUNBUFFERED=1

# Change working directory to python folder
WORKDIR /app/python

# Run the service
CMD ["uvicorn", "nlp_service:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]