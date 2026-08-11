"""
Duplicate/Similarity Detection — Module B4
Embeds complaint text and compares via cosine similarity against open complaints.
"""
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Optional, Tuple
from backend.ai.classifier import embed_text

SIMILARITY_THRESHOLD = 0.75


def compute_similarity(text_a: str, text_b_embedding: np.ndarray) -> float:
    """Compute cosine similarity between text_a and a pre-computed embedding."""
    emb_a = embed_text(text_a).reshape(1, -1)
    emb_b = text_b_embedding.reshape(1, -1)
    return float(cosine_similarity(emb_a, emb_b)[0][0])


def find_similar(
    new_text: str,
    candidates: List[dict],   # list of {id, complaint_id, text, embedding, ...}
    top_k: int = 3,
    threshold: float = SIMILARITY_THRESHOLD,
) -> List[dict]:
    """
    Returns top_k most similar complaints above threshold.
    Each candidate dict must have an 'embedding' key with numpy array or comma-separated string.
    """
    if not candidates:
        return []

    new_emb = embed_text(new_text).reshape(1, -1)
    results = []

    for c in candidates:
        # Embedding stored as comma-separated string in DB
        emb = c.get("embedding")
        if emb is None:
            continue
        if isinstance(emb, str):
            try:
                emb_arr = np.array([float(x) for x in emb.split(",")], dtype=np.float32).reshape(1, -1)
            except Exception:
                continue
        else:
            emb_arr = np.array(emb, dtype=np.float32).reshape(1, -1)

        sim = float(cosine_similarity(new_emb, emb_arr)[0][0])
        if sim >= threshold:
            results.append({**c, "similarity": round(sim, 4)})

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]


def embedding_to_str(emb: np.ndarray) -> str:
    """Serialize numpy embedding to comma-separated string for DB storage."""
    return ",".join(f"{v:.6f}" for v in emb.tolist())


def str_to_embedding(s: str) -> np.ndarray:
    """Deserialize comma-separated string to numpy array."""
    return np.array([float(x) for x in s.split(",")], dtype=np.float32)
