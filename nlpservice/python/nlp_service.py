# nlp_service.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import re
import datetime
import dateparser
from dateparser.search import search_dates
import random

# HF imports (text classification) - lazy-loaded below to avoid import-time failures
_hf_classifier = None
def get_hf_classifier():
    """Lazily import and return a HF pipeline object or None on failure.

    This prevents import-time crashes when `transformers` or model weights
    aren't installed/downloaded.
    """
    global _hf_classifier
    if _hf_classifier is None:
        try:
            from transformers import pipeline
            # Try to instantiate the pipeline; this will download the model if needed.
            _hf_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        except Exception:
            # If anything goes wrong (missing package, no internet, OOM), return None
            _hf_classifier = None
    return _hf_classifier

# spaCy for NER (if installed): fallback to simple regex if not available
try:
    import spacy
    nlp_spacy = spacy.load("en_core_web_sm")
except Exception as e:
    nlp_spacy = None

app = FastAPI(title="Assignment NLP Service")

# Note: the HF classifier is created lazily via get_hf_classifier().
# This keeps module import cheap and robust in environments without HF deps.

candidate_labels = ["Report", "Diagram", "Code", "Project", "Simulation", "Homework", "Assignment", "Other", "Irrelevant"]
urgency_keywords = {
    "High": ["tonight","urgent","ASAP","immediately","due today","due tonight","now"],
    "Medium": ["tomorrow","by tomorrow","soon","this week","next week"],
    "Low": ["no rush","whenever","whenever possible","flexible"]
}

dark_jokes = [
    "Bhai, your message is so empty, even Shakespeare would call it ‘Much Ado About Nothing – Lite Version’.",
    "Itna vague text? Ghalib bhi hota toh keh deta: ‘Ishara bhi hota toh kuch baat banti’.",
    "Ye message dekhkar meri neural network ne bhi bola: ‘Bruh, yeh kya bhej diya tune?’",
    "Tumhara message itna halkā hai ki gravity bhi usse attract karne se mana kar rahi hai.",
    "Your request is like modern poetry — confusing, pointless, and open to *too many* interpretations.",
    "Itna confusion toh Hamlet ko bhi nahi tha: ‘To understand this… or not to understand this?’",
    "Bhai, ye kya text hai? Na sense, na context — bas existential crisis ka trailer.",
    "Tumhara message toh aisa laga jaise coding class me koi pooch le: ‘Sir, urdu me code hota hai kya ?’",
    "Your text is the literary equivalent of NULL — exists, par kaam ka nahi.",
    "Bhai, ye message dekhke meri AI bhi sochne lagi: ‘Ganje ki quality thodi kharab hai ’"
]


class ParseRequest(BaseModel):
    text: str
    user_id: Optional[str] = None

class ParseResponse(BaseModel):
    type: str
    topic: Optional[str]
    domain: Optional[str]
    pages: Optional[int]
    deadline: Optional[str]
    urgency: str
    skills_required: List[str]
    estimated_price: Optional[float]
    skill_price_breakdown: Dict[str, float]
    raw_text: str
    raw_entities: Dict[str, Any]
    message: Optional[str] = None


def extract_pages(text: str):
    # regex: "4 page", "4-page", "4pages", "4 pages"
    m = re.search(r'(\d{1,3})\s*-?\s*(page|pages)\b', text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    return None


def extract_deadline(text: str):
    print(f"Debug: extract_deadline called with text: '{text}'")
    
    try:
        # 1. Try to find dates within the text
        # search_dates returns a list of tuples: [('tomorrow', datetime_obj), ...]
        found = search_dates(text, settings={'PREFER_DATES_FROM': 'future'})
        
        if found:
            # found is a list of (substring, date_obj)
            print(f"Debug: search_dates found: {found}")
            # Return the date object of the first match
            return found[0][1].isoformat()
            
        print("Debug: search_dates returned None")
        
        # 2. Fallback to strict parse
        dt = dateparser.parse(text, settings={'PREFER_DATES_FROM': 'future'})
        if dt:
            print("Debug: dateparser.parse found", dt)
            return dt.isoformat()
            
    except Exception as e:
        print(f"Debug: extract_deadline error parsing date: {e}")
    return None
    

def extract_urgency(text: str):
    low = high = None
    lowered = text.lower()
    for level, terms in urgency_keywords.items():
        for t in terms:
            if t in lowered:
                return level
    return "Medium"


def extract_skills(text: str):
    # Simple heuristic keywords; you should use a keyword extractor or embedding similarity later.
    skills = []
    skill_keywords = {
        "Machine Learning": ["machine learning","ml","deep learning","deep-learning","cnn","rnn","transformer","transformers","bert","gpt","classification","regression","pytorch","torch","tensorflow","keras","scikit-learn","sklearn"],
        "Natural Language Processing": ["nlp","natural language","natural-language","huggingface","tokenization","named entity","ner","language model","sequence labeling"],
        "Computer Vision": ["computer vision","cv","opencv","object detection","segmentation","yolo","mask r-cnn","image processing","face recognition"],
        "Data Science": ["data science","data analysis","eda","exploratory data analysis","feature engineering","modeling"],
        "Python": ["python","numpy","pandas","scipy","matplotlib","seaborn","jupyter","notebook"],
        "Data Engineering": ["spark","pyspark","hadoop","etl","airflow","data pipeline","beam"],
        "Cloud": ["aws","amazon web services","azure","gcp","google cloud","lambda","ecs","eks","cloud run"],
        "DevOps": ["docker","kubernetes","k8s","ci/cd","jenkins","github actions","gitlab ci"],
        "Databases": ["sql","mysql","postgres","postgresql","mongodb","redis","sqlite","database","nosql"],
        "Web": ["html","css","javascript","js","react","node","express","flask","django","fastapi","rest api","graphql","typescript"],
        "Electronics": ["circuit","arduino","pcb","sensor","electronics","simulation","proteus","multisim"],
        "Embedded": ["embedded","arduino","esp32","raspberry pi","microcontroller","firmware","rtos"],
        "Matlab": ["matlab","simulink"],
        "LaTeX": ["latex","tex","report formatting"],
        "C++": ["c++","cpp","stl","memory management","pointer"],
        "Java": ["java","jvm","spring","spring boot"],
        "R": ["r language","r programming","r-project","r stats","tidyverse","ggplot2","rstudio","statistical analysis"],
        "Excel": ["excel","vba","spreadsheet","pivot table"],
        "Mobile": ["android","ios","flutter","react native","swift","kotlin"],
        "Security": ["security","cybersecurity","penetration testing","vulnerability","oauth","jwt"]
    }
    low = text.lower()
    for skill, keys in skill_keywords.items():
        for k in keys:
            if k in low:
                skills.append(skill)
                break
    return skills


def extract_topic_with_spacy(text: str):
    if not nlp_spacy:
        return None
    doc = nlp_spacy(text)
    # Build a crude topic from noun chunks or named entities
    topics = []
    for nc in doc.noun_chunks:
        # short noun chunks of reasonable size
        if len(nc.text) < 60 and len(nc.text.split()) <= 6:
            topics.append(nc.text.strip())
    return topics[0] if topics else None


def _content_word_count(text: str) -> int:
    # Count words that are likely to carry semantic content (filter out short words & common stopwords/greetings)
    stopwords = {"the","a","an","is","are","of","to","in","on","for","and","or","with","please","plz","thanks","thank","ok","okay","bye","regards","dear","sincerely","yours","truly","best","wishes","looking","forward","hear","from","you","let","us","know","do","not","need","help","me","my","it","that","this","as","at","by","be","was","were","but","if","so","such","all","any","can","will","just","about","what","which","who","whom","when","where","how","also","there","their","them","then","than","too","very","more","most","some","no","nor","only","own","same","other","other's","ours","yourselves","himself","herself","itself"}
    greetings = {"hi","hello","hey","yo","hii","hiii","good","morning","evening","afternoon","night","greetings","salutations","wassup","sup","howdy","welcome","hiya","cheers","peace","shalom","namaste","salut","ciao","hola"}
    words = re.findall(r"\w+", text.lower())
    content = [w for w in words if len(w) > 2 and w not in stopwords and w not in greetings]
    return len(content)


@app.post("/nlp/parse", response_model=ParseResponse)
def parse_text(req: ParseRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    # 1) Type classification (try HF zero-shot; fallback to simple keyword rules)
    hf = get_hf_classifier()
    top_type = "Other"
    hf_top_score = 0.0
    if hf:
        try:
            # First, ask the classifier directly whether this is Irrelevant
            # Use a small binary check so we only act on a confident Irrelevant signal.
            try:
                bin_cls = hf(text, ["Irrelevant", "Relevant"])
            except TypeError:
                # Some HF pipeline versions may expect a hypothesis_template; fall back
                bin_cls = hf(text, ["Irrelevant", "Relevant"], hypothesis_template="This text is {}.")

            bin_labels = bin_cls.get("labels", [])
            bin_scores = bin_cls.get("scores", [])
            ir_score = 0.0
            for l, s in zip(bin_labels, bin_scores):
                if str(l).lower() == "irrelevant":
                    ir_score = s
                    break

            # If HF strongly believes this is Irrelevant, return early with joke and zero price
            if ir_score >= 0.65:
                joke = random.choice(dark_jokes)
                return ParseResponse(
                    type="Irrelevant",
                    topic=None,
                    domain=None,
                    pages=0,
                    deadline=None,
                    urgency="Low",
                    skills_required=[],
                    estimated_price=0.0,
                    skill_price_breakdown={},
                    raw_text=text,
                    raw_entities={"message": joke},
                    message=joke
                )

            # Otherwise continue to compute a more specific type using the original candidate labels
            cls = hf(text, candidate_labels)
            labels = cls.get("labels", [])
            scores = cls.get("scores", [])
            if labels:
                top_type = labels[0]
                hf_top_score = scores[0] if scores else 0.0
        except Exception:
            # If the HF pipeline fails at runtime, fall back to heuristic rules
            top_type = None

    if not hf or top_type is None:
        # Simple keyword-based fallback
        low = text.lower()
        if any(k in low for k in ["report", "essay", "literature review", "paper"]):
            top_type = "Report"
        elif any(k in low for k in ["diagram", "draw", "figure"]):
            top_type = "Diagram"
        elif any(k in low for k in ["code", "implement", "script", "function"]):
            top_type = "Code"
        elif any(k in low for k in ["project", "assignment", "homework"]):
            top_type = "Assignment"
        else :
            top_type = "Irrelevant" if len(text.split()) <= 5 else "Other"

    # 2) Pages, deadline, urgency
    pages = extract_pages(text)
    deadline = extract_deadline(text)
    urgency = extract_urgency(text)

    # 3) Skills extraction
    skills = extract_skills(text)

    # 4) Topic: spacy or fallback: longest noun phrase
    topic = extract_topic_with_spacy(text)
    if not topic:
        # fallback: pick keywords near colon or "about" or final nouns
        m = re.search(r'about\s+([A-Za-z0-9 \-]+)', text, re.IGNORECASE)
        if m:
            topic = m.group(1).strip()
        else:
            # try grab phrase with 'on' or last 5 words
            m2 = re.search(r'(on|about)\s+([A-Za-z0-9 \-\,]+)', text, re.IGNORECASE)
            if m2:
                topic = m2.group(2).strip()
            else:
                topic = "General"

    # 5) Domain heuristic (map topic keywords)
    domain = None
    tlower = text.lower()
    if any(k in tlower for k in ["machine learning","deep learning","neural","classification","regression","cnn","rnn"]):
        domain = "AI/ML"
    elif any(k in tlower for k in ["arduino","circuit","pcb","electronic","simulation"]):
        domain = "Electronics"
    elif any(k in tlower for k in ["essay","report","literature review","paper"]):
        domain = "Writing"
    else:
        domain = "General"

    # 6) Estimated price with per-skill breakdown
    # Pricing based on the *requested work*, not pages. The service will try to detect specific
    # work-items (e.g. "fix ML pipeline", "debug code", "label images", "write report") and
    # price them individually. If nothing obvious is detected, fall back to the skill-based estimate.

    # Minimal flat base fee for any task
    base = 15.0

    # Task -> base price map (kept reasonable)
    task_price_map = {
        "fix ml pipeline": 8000.0,
        "debug code": 4000.0,
        "implement model": 10000.0,
        "train model": 12000.0,
        "data cleaning": 500.0,
        "feature engineering": 600.0,
        "label images": 700.0,
        "annotate data": 600.0,
        "create report": 300.0,
        "write report": 300.0,
        "latex formatting": 200.0,
        "prepare slides": 250.0,
        "deploy to cloud": 7000.0,
        "optimize model": 20000.0,
        "code review": 3500.0,
        "create frontend": 450.0,
        "build mobile app": 2000.0,
        "simulate circuit": 5000.0,
        "design pcb": 600.0,
        "create diagram": 20.0,
        "research literature": 400.0
    }

    # Lowercase text for matching
    low_text = text.lower()

    # Detect tasks by looking for exact keys or common verbs + objects
    detected_tasks: List[str] = []
    for task_key in task_price_map:
        if task_key in low_text:
            detected_tasks.append(task_key)

    # Also attempt to detect common verbs with nouns if no direct matches were found
    if not detected_tasks:
        verb_patterns = {
            "debug code": ["debug", "fix bug", "fix code", "resolve error"],
            "fix ml pipeline": ["pipeline", "fix pipeline", "ml pipeline", "repair pipeline"],
            "implement model": ["implement model", "implement a model", "build model"],
            "train model": ["train model", "training"],
            "data cleaning": ["clean data", "data cleaning", "cleaning dataset"],
            "label images": ["label images", "image labeling", "annotate images"],
            "create report": ["write report", "report on", "prepare report"],
            "latex formatting": ["latex", "tex", "format in latex"],
            "deploy to cloud": ["deploy", "deployment", "deploy to"],
            "optimize model": ["optimize", "tune hyper"],
            "code review": ["code review", "review code"]
        }
        for task_key, patterns in verb_patterns.items():
            for p in patterns:
                if p in low_text:
                    detected_tasks.append(task_key)
                    break

    # Compute task total
    task_total = 0.0
    task_breakdown: Dict[str, float] = {}
    for t in detected_tasks:
        price_t = task_price_map.get(t, 30.0)
        task_breakdown[t] = round(price_t, 2)
        task_total += price_t

    # Skill surcharge (kept reasonable)
    skill_price_map = {
        "Machine Learning": 9000.0,
        "Natural Language Processing": 7500.0,
        "Computer Vision": 7500.0,
        "Data Science": 5000.0,
        "Python": 2000.0,
        "Data Engineering": 4000.0,
        "Cloud": 3500.0,
        "DevOps": 3000.0,
        "Databases": 2500.0,
        "Web": 2000.0,
        "Electronics": 4000.0,
        "Embedded": 4500.0,
        "Matlab": 3000.0,
        "LaTeX": 1000.0,
        "C++": 2500.0,
        "Java": 1500.0,
        "R": 2000.0,
        "Excel": 1000.0,
        "Mobile": 3000.0,
        "Security": 4000.0
    }

    skill_breakdown: Dict[str, float] = {}
    skills_total = 0.0
    for s in skills:
        price_for_skill = skill_price_map.get(s, 15.0)  # default small surcharge for unknown skills
        skill_breakdown[s] = round(price_for_skill, 2)
        skills_total += price_for_skill

    # Heuristic fallback for irrelevance: very short/greeting-like messages with no signals
    def _is_irrelevant_heuristic(txt: str) -> bool:
        # Very few content words and no skills/tasks/pages/deadline
        cw = _content_word_count(txt)
        if cw <= 2 and not skills and not detected_tasks and not pages and not deadline:
            return True
        return False

    # Heuristic override: mark as Irrelevant even if earlier heuristics
    # (e.g. a single word like 'brief' causing Report) classified it otherwise.
    # This ensures short/greeting-like messages with no signals are treated as irrelevant.
    if _is_irrelevant_heuristic(text):
        joke = random.choice(dark_jokes)
        return ParseResponse(
            type="Irrelevant",
            topic=None,
            domain=None,
            pages=0,
            deadline=None,
            urgency="Low",
            skills_required=[],
            estimated_price=0.0,
            skill_price_breakdown={},
            raw_text=text,
            raw_entities={"message": joke},
            message=joke
        )

    # Final price computation rules:
    # New logic per your request:
    # 1) Writing assignments: price by pages + diagrams + handwriting surcharge + small skill surcharge.
    # 2) Coding / ML work: higher baseline; price by detected tasks, implementation languages and skill surcharges.
    # 3) Other detected tasks: handled by task_price_map as before.

    # Detect diagram mentions (count approximate number of diagrams requested)
    # use a robust word-boundary regex and ignore case
    diagram_count = len(re.findall(r'\b(diagram|figure|drawing|drawings)\b', low_text, flags=re.IGNORECASE))

    # Detect handwriting requirement
    handwriting_required = any(w in low_text for w in ['handwritten', 'handwriting', 'written by hand', 'hand written', 'fast handwriting', 'fast writing'])

    # Writing-type detection: if top_type indicates a writing task or keywords present
    writing_keywords = ['report', 'essay', 'literature review', 'paper', 'write', 'writing', 'assignment']
    is_writing = any(k in low_text for k in writing_keywords) or top_type in ['Report', 'Assignment']

    # High-cost domain detection: coding / ml
    coding_keywords = ['code', 'implement', 'script', 'function', 'debug', 'ml', 'machine learning', 'deep learning', 'train model', 'model', 'pipeline']
    is_coding_ml = any(k in low_text for k in coding_keywords) or any(s in ['Machine Learning','Python','C++','Java','Data Science'] for s in skills)

    # Detect implementation languages/platforms for per-language surcharge and platform multiplier
    lang_keywords = {
        "Python": ["python"],
        "C++": ["c++", "cpp"],
        "Java": ["java"],
        "JavaScript": ["javascript", "js", "node", "react"],
        "Mobile": ["android", "ios", "flutter", "react native"],
        "Matlab": ["matlab", "simulink"],
        "LaTeX": ["latex", "tex"]
    }
    impl_langs = set()
    for lang, keys in lang_keywords.items():
        for k in keys:
            if k in low_text:
                impl_langs.add(lang)
                break
    impl_count = len(impl_langs)

    # per-language surcharge (reasonable default)
    per_language_surcharge = 25.0

    # Platform multiplier (web / mobile)
    if any(p in low_text for p in ["android", "ios", "mobile", "react native", "flutter"]):
        platform_multiplier = 1.10
    elif any(p in low_text for p in ["web", "frontend", "react", "angular", "vue"]):
        platform_multiplier = 1.05
    else:
        platform_multiplier = 1.0

    # Prices for writing-specific items
    per_page_fee = 8.0   # modest per-page charge for writing work (kept reasonable)
    per_diagram_fee = 10.0
    handwriting_surcharge = 20.0 if handwriting_required else 0.0

    # Strong defaults for coding/ML work
    coding_ml_surcharge = 1200.0

    # Compute according to branch
    if is_writing and not is_coding_ml:
        # Use pages if available, otherwise fall back to skill-based pricing
        price = base
        if pages:
            price += pages * per_page_fee
        else:
            # no page info: add a conservative default for writing
            price += 2 * per_page_fee
        # add diagrams
        price += diagram_count * per_diagram_fee
        # handwriting surcharge
        price += handwriting_surcharge
        # small skill surcharge for any technical skills referenced
        price += skills_total * 0.1
        # task-specific additions (e.g., latex formatting, create report)
        price += task_total
    elif is_coding_ml:
        # coding / ML pipeline: higher base + detected tasks + per-language surcharge
        price = base + coding_ml_surcharge + task_total
        # include per-language surcharge
        price += impl_count * per_language_surcharge
        # include skills as surcharge
        price += skills_total * 0.25
    else:
        # general case: prefer detected tasks; otherwise skill-based fallback
        if task_total > 0:
            price = base + task_total + (impl_count * per_language_surcharge) + (skills_total * 0.15)
        else:
            # Heuristic irrelevance check (if HF didn't already mark as Irrelevant)
            if _is_irrelevant_heuristic(text):
                joke = random.choice(dark_jokes)
                return ParseResponse(
                    type="Irrelevant",
                    topic=None,
                    domain=None,
                    pages=0,
                    deadline=None,
                    urgency="Low",
                    skills_required=[],
                    estimated_price=0.0,
                    skill_price_breakdown={},
                    raw_text=text,
                    raw_entities={"message": joke},
                    message=joke
                )

            price = base + skills_total + (impl_count * per_language_surcharge)
            if skills_total == 0:
                price += 20.0

    # Apply platform multiplier (web / mobile)
    price *= platform_multiplier

    # Urgency multiplier (slightly reduced to keep prices reasonable)
    if urgency == 'High':
        price *= 1.25
    elif urgency == 'Medium':
        price *= 1.0
    elif urgency == 'Low':
        price *= 0.95

    estimated_price = round(price, 2)

    # Merge task breakdown into skill breakdown info returned to user
    for t, v in task_breakdown.items():
        skill_breakdown[f"task:{t}"] = v

    raw_entities = {
        "PAGES": [str(pages)] if pages else [],
        "DEADLINE": [deadline] if deadline else [],
        "TOPIC": [topic]
    }

    return ParseResponse(
        type=top_type,
        topic=topic,
        domain=domain,
        pages=pages,
        deadline=deadline,
        urgency=urgency,
        skills_required=skills,
        estimated_price=estimated_price,
        skill_price_breakdown=skill_breakdown,
        raw_text=text,
        raw_entities=raw_entities,
        message=None
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("nlp_service:app", host="0.0.0.0", port=8000, reload=True)
