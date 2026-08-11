"""
AI Category Classifier — Module B1
Uses sentence-transformers all-MiniLM-L6-v2 to embed complaint text
and compare against labeled exemplar sentences via cosine similarity.
"""
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import Tuple, List

MODEL_NAME = "all-MiniLM-L6-v2"

# Exemplar sentences per category — the richer these are, the more accurate the classifier
CATEGORY_EXEMPLARS = {
    "Wi-Fi": [
        "Internet is not working in the hostel",
        "Wi-Fi is very slow and keeps disconnecting",
        "No network signal in the dormitory",
        "Cannot connect to campus Wi-Fi",
        "WiFi router is down on the third floor",
        "Broadband connection is broken",
        "Internet speed is extremely slow for online classes",
        "Network outage in the academic block",
    ],
    "Classroom": [
        "Projector is not working in the lecture hall",
        "Air conditioner in the classroom is broken",
        "The whiteboard is damaged and needs replacement",
        "Chairs are broken in the seminar hall",
        "Classroom lights are not working",
        "The fan in the room is making loud noise",
        "AC not functioning in the lecture room",
        "Seating arrangement is inadequate in the classroom",
    ],
    "Laboratory": [
        "Computer systems in the lab are not working",
        "Lab equipment is broken and needs repair",
        "Oscilloscope in electronics lab is malfunctioning",
        "Software is not installed in the computer lab",
        "Lab AC is not functioning, very hot",
        "Chemistry lab fume hood is not working",
        "Server in the networking lab has crashed",
        "Printer in the lab is out of order",
    ],
    "Hostel": [
        "Water supply has stopped in the hostel room",
        "The hostel bathroom is clogged and dirty",
        "Hot water is not available in the hostel",
        "Room heater is not working in the hostel",
        "Hostel common room TV is broken",
        "Mess food quality is very poor",
        "Pest infestation in the hostel block",
        "Hostel room door lock is broken",
    ],
    "Transport": [
        "College bus did not arrive on time",
        "Bus route has been changed without notice",
        "The college van has a mechanical issue",
        "Bus driver is reckless and drives dangerously",
        "Transportation not available for late-night library",
        "Bus number 5 is always delayed",
        "College shuttle service is not functioning",
    ],
    "Washroom": [
        "Washroom is dirty and not cleaned regularly",
        "Toilet flush is not working in the bathroom",
        "There is no water in the washroom taps",
        "Washroom door lock is broken",
        "Foul smell coming from the washroom",
        "Soap dispensers in the washroom are empty",
        "Washroom tiles are broken and slippery",
    ],
    "Electrical": [
        "There is a short circuit in the electrical panel",
        "Power outage in the entire building",
        "Sparks coming from the electrical socket",
        "Electric shock hazard near the switchboard",
        "Power fluctuation is damaging equipment",
        "Streetlights on campus are not working at night",
        "Generator is not starting during power cut",
        "Wiring is exposed and dangerous in the corridor",
    ],
    "Other": [
        "General complaint about campus facilities",
        "Request for additional facilities",
        "Miscellaneous issue on campus",
        "Complaint not covered by other categories",
    ],
}

# Keywords for explainability
CATEGORY_KEYWORDS = {
    "Wi-Fi": ["wifi", "internet", "network", "broadband", "router", "connection", "signal", "bandwidth"],
    "Classroom": ["classroom", "lecture hall", "projector", "ac", "fan", "whiteboard", "chair", "bench"],
    "Laboratory": ["lab", "laboratory", "computer", "equipment", "oscilloscope", "server", "printer", "software"],
    "Hostel": ["hostel", "room", "bathroom", "water", "mess", "dormitory", "block", "pest"],
    "Transport": ["bus", "transport", "van", "driver", "route", "shuttle", "vehicle"],
    "Washroom": ["washroom", "toilet", "bathroom", "flush", "soap", "smell", "tiles"],
    "Electrical": ["electricity", "power", "spark", "shock", "circuit", "outage", "socket", "wiring", "generator"],
    "Other": [],
}

_model = None
_exemplar_embeddings = None

def _load_model():
    global _model, _exemplar_embeddings
    if _model is None:
        print("[Classifier] Loading sentence-transformers model...")
        _model = SentenceTransformer(MODEL_NAME)
        print("[Classifier] Computing exemplar embeddings...")
        _exemplar_embeddings = {}
        for category, sentences in CATEGORY_EXEMPLARS.items():
            embs = _model.encode(sentences, convert_to_numpy=True)
            _exemplar_embeddings[category] = embs
        print("[Classifier] Ready.")
    return _model, _exemplar_embeddings


def classify(text: str) -> Tuple[str, float, List[str]]:
    """
    Returns (category, confidence_score 0-1, top_keywords)
    """
    model, exemplar_embeddings = _load_model()
    text_emb = model.encode([text], convert_to_numpy=True)

    scores = {}
    for category, cat_embs in exemplar_embeddings.items():
        sims = cosine_similarity(text_emb, cat_embs)[0]
        scores[category] = float(np.max(sims))

    # Sort by score
    sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_cat, best_score = sorted_cats[0]

    # Extract matching keywords from text for explainability
    text_lower = text.lower()
    found_keywords = [kw for kw in CATEGORY_KEYWORDS.get(best_cat, []) if kw in text_lower]

    # Fall back to Other if confidence too low
    if best_score < 0.25:
        best_cat = "Other"

    return best_cat, round(best_score, 4), found_keywords[:5]


def embed_text(text: str) -> np.ndarray:
    """Return raw embedding vector for a complaint text."""
    model, _ = _load_model()
    return model.encode([text], convert_to_numpy=True)[0]
