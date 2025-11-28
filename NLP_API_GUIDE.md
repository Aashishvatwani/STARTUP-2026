# NLP-Powered Assignment Creation API

## Overview
The frontend can send a simple text message, and the backend will automatically extract all assignment details using AI/NLP.

---

## API Endpoints

### 1 Parse Assignment Text (Preview Only)
**Endpoint:** POST /api/nlp/parse

**Purpose:** Extract assignment details from text without saving to database (for preview/validation)

**Request:**
`json
{
  "text": "I need a 4 page Python machine learning report about CNN due tomorrow ASAP",
  "user_id": "507f1f77bcf86cd799439011"
}
`

**Response:**
`json
{
  "success": true,
  "message": "Assignment details extracted successfully",
  "data": {
    "type": "Report",
    "topic": "CNN machine learning",
    "domain": "AI/ML",
    "pages": 4,
    "deadline": "2025-11-05T23:59:59Z",
    "urgency": "High",
    "skills_required": ["Python", "Machine Learning", "Deep Learning"],
    "estimated_price": 450.00,
    "original_text": "I need a 4 page Python machine learning report about CNN due tomorrow ASAP"
  }
}
`

---

### 2 Create Assignment from Text (Full Creation)
**Endpoint:** POST /api/assignments/create-from-text

**Purpose:** Parse text, create assignment, save to DB, and return top matching solvers

**Request:**
`json
{
  "text": "I need a 4 page Python machine learning report about CNN due tomorrow ASAP",
  "user_id": "507f1f77bcf86cd799439011",
  "title": "ML Report on CNN",
  "price": 500,
  "latitude": 28.6139,
  "longitude": 77.2090
}
`

**Response:**
`json
{
  "success": true,
  "message": "Assignment created successfully from text",
  "assignment": {
    "id": "67890abcdef123456789",
    "title": "ML Report on CNN",
    "description": "I need a 4 page Python machine learning report about CNN due tomorrow ASAP",
    "type": "Report",
    "domain": "AI/ML",
    "skills": ["Python", "Machine Learning", "Deep Learning"],
    "urgency": "High",
    "pages": 4,
    "deadline": "2025-11-05T23:59:59Z",
    "price": 500,
    "status": "posted"
  },
  "top_solvers": [
    {
      "solver": {
        "id": "abc123",
        "name": "John Doe",
        "skills": ["Python", "Machine Learning", "TensorFlow"],
        "avg_rating": 4.8,
        "price_per_job": 400
      },
      "score": 85.5
    }
  ],
  "nlp_analysis": {
    "skills_detected": ["Python", "Machine Learning", "Deep Learning"],
    "estimated_price": 450.00,
    "urgency_detected": "High"
  }
}
`

---

## Frontend Integration Example

### React/Vue/Angular Example:

`javascript
// 1. User types assignment description
const assignmentText = "I need a 4 page Python ML report due tomorrow";

// 2. Call NLP parse to preview (optional)
const previewResponse = await fetch('http://localhost:8080/api/nlp/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: assignmentText,
    user_id: currentUser.id
  })
});

const preview = await previewResponse.json();
console.log('Detected skills:', preview.data.skills_required);
console.log('Estimated price:', preview.data.estimated_price);

// 3. Create assignment directly from text
const createResponse = await fetch('http://localhost:8080/api/assignments/create-from-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: assignmentText,
    user_id: currentUser.id,
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    price: 500  // optional: override estimated price
  })
});

const result = await createResponse.json();
console.log('Assignment created:', result.assignment);
console.log('Top solvers:', result.top_solvers);
`

---

## Environment Setup

### Backend (.env file):
`ash
NLP_SERVICE_URL=http://localhost:8000
MONGO_URI=mongodb+srv://...
PORT=8080
`

### Start NLP Service (Python):
`ash
cd nlpservice/python
pip install -r requirements.txt
python nlp_service.py
`

### Start Backend (Go):
`ash
cd backend
go run main.go
`

---

## Text Format Examples

The NLP service can understand natural language:

 "I need a 4 page Python report due tomorrow"
 "urgent blockchain project with 10 pages"
 "machine learning assignment about CNN ASAP"
 "simple HTML/CSS website no rush"
 "Arduino circuit design due tonight"

---

## Features Extracted Automatically:

-  **Type**: Report, Code, Project, Diagram, etc.
-  **Skills**: Python, ML, React, Blockchain, etc.
-  **Urgency**: High, Medium, Low
-  **Pages**: Extracted from text
-  **Deadline**: Parsed from "tomorrow", "tonight", dates
-  **Price**: Auto-calculated based on complexity
-  **Topic**: Main subject/domain

