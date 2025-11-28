from fastapi.testclient import TestClient
import json
import nlp_service

client = TestClient(nlp_service.app)
r = client.post('/nlp/parse', json={"text":"Need a physical education assignment on basketball strategies, 6 pages, due next week."})
with open("f:\\homeworking\\python\\parsed_from_service.json","w",encoding="utf-8") as f:
    json.dump(r.json(), f, indent=2)