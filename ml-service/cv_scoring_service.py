from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import requests
import json
import os
import logging
import sys
import hashlib
from typing import Optional, List, Dict, Any
import io
import uvicorn
import numpy as np
import re
import time

# =========================
# CONFIG
# =========================

LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234")
EMBEDDINGS_ENDPOINT = f"{LM_STUDIO_URL}/v1/embeddings"
MODELS_ENDPOINT = f"{LM_STUDIO_URL}/v1/models"

EMBEDDINGS_MODEL = "text-embedding-bge-large-en-v1.5"

MAX_TOKENS = 512
SAFE_TOKENS = 450
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.6"))

# Scoring weights (can be overridden via env)
WEIGHTS = {
    "required": int(os.getenv("WEIGHT_REQUIRED", "75")),
    "preferred": int(os.getenv("WEIGHT_PREFERRED", "0")),
    "experience": int(os.getenv("WEIGHT_EXPERIENCE", "20")),
    "education": int(os.getenv("WEIGHT_EDUCATION", "5"))
}

session = requests.Session()
_embedding_cache = {}

# =========================
# LOGGING
# =========================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)

# =========================
# FASTAPI
# =========================

app = FastAPI(title="CV Scoring Service (Structured Data Only)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# MODELS
# =========================

class JobRequirements(BaseModel):
    job_title: str
    required_skills: List[str]
    preferred_skills: List[str] = []
    min_experience: int = 0
    education_level: str = "Bachelor's"
    industry: Optional[str] = None
    location: Optional[str] = None


# =========================
# UTILITIES
# =========================

def estimate_tokens(text: str) -> int:
    return len(text) // 4 + 1


def truncate_text(text: str, max_tokens: int = SAFE_TOKENS) -> str:
    if estimate_tokens(text) <= max_tokens:
        return text

    ratio = max_tokens / estimate_tokens(text)
    cut = int(len(text) * ratio)
    return text[:cut]


def cosine_similarity(a: List[float], b: List[float]) -> float:
    a = np.array(a)
    b = np.array(b)

    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0

    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def normalize_education_level(edu_text: str) -> str:
    """Normalize education level to a standard format"""
    edu_lower = edu_text.lower()
    if any(term in edu_lower for term in ['phd', 'doctorate', 'doctoral']):
        return "PhD"
    elif any(term in edu_lower for term in ['master', 'mba', 'msc', 'ma']):
        return "Master's"
    elif any(term in edu_lower for term in ['bachelor', 'ba', 'bs', 'bsc']):
        return "Bachelor's"
    elif any(term in edu_lower for term in ['associate', 'aa', 'as']):
        return "Associate's"
    elif any(term in edu_lower for term in ['high school', 'diploma']):
        return "High School"
    return "Unknown"


def education_points(edu_level: str) -> int:
    """Convert education level to points (max 20)"""
    level = normalize_education_level(edu_level)
    points = {
        "PhD": 20,
        "Master's": 18,
        "Bachelor's": 15,
        "Associate's": 10,
        "High School": 5,
        "Unknown": 5
    }
    return points.get(level, 5)

CV_TEMPLATE_DEFAULTS = {
    "education_level": "Bachelor's",
    "experience_years": 0,
    "extracted_skills": [],
    "structured_data": {},
}


def is_default_template_value(value: Any, default: Any) -> bool:
    if isinstance(default, str) and isinstance(value, str):
        return value.strip() == default.strip()
    if isinstance(default, (list, dict)):
        return value == default
    return value == default


def strip_template_defaults(data: dict) -> dict:
    cleaned = {}
    for key, value in data.items():
        if key in CV_TEMPLATE_DEFAULTS and is_default_template_value(value, CV_TEMPLATE_DEFAULTS[key]):
            continue

        if isinstance(value, dict):
            nested = strip_template_defaults(value)
            if nested:
                cleaned[key] = nested
        elif isinstance(value, list):
            items = [item for item in value if item is not None and str(item).strip()]
            if items:
                cleaned[key] = items
        else:
            if value is not None and not (isinstance(value, str) and not value.strip()):
                cleaned[key] = value
    return cleaned


# =========================
# LM STUDIO
# =========================

def check_model_available():
    """Check if LM Studio is available and model is loaded"""
    try:
        r = session.get(MODELS_ENDPOINT, timeout=5)
        if r.status_code != 200:
            raise Exception("LM Studio not reachable")
        
        models = r.json().get("data", [])
        ids = [m["id"] for m in models]

        if EMBEDDINGS_MODEL not in ids:
            raise Exception(f"Model '{EMBEDDINGS_MODEL}' not loaded")
        
        logger.info(f"LM Studio available, model {EMBEDDINGS_MODEL} loaded")
        return True

    except Exception as e:
        logger.error(f"LM Studio error: {e}")
        raise HTTPException(503, f"Scoring service unavailable: {str(e)}")


def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings with caching"""
    check_model_available()

    texts = [truncate_text(t) for t in texts]
    
    # Prepare cache keys
    keys = [hashlib.md5(t.encode()).hexdigest() for t in texts]
    embeddings = []
    texts_to_fetch = []
    indices_to_fetch = []

    for i, key in enumerate(keys):
        if key in _embedding_cache:
            embeddings.append(_embedding_cache[key])
            logger.debug(f"Cache hit for key {key}")
        else:
            embeddings.append(None)
            texts_to_fetch.append(texts[i])
            indices_to_fetch.append(i)

    if texts_to_fetch:
        logger.info(f"Fetching {len(texts_to_fetch)} embeddings from LM Studio")
        payload = {
            "model": EMBEDDINGS_MODEL,
            "input": texts_to_fetch,
            "encoding_format": "float",
        }

        try:
            r = session.post(EMBEDDINGS_ENDPOINT, json=payload, timeout=60)
            if r.status_code != 200:
                raise HTTPException(500, f"Embedding error: {r.text}")

            data = sorted(r.json()["data"], key=lambda x: x["index"])
            
            for j, item in enumerate(data):
                emb = item["embedding"]
                orig_idx = indices_to_fetch[j]
                embeddings[orig_idx] = emb
                _embedding_cache[keys[orig_idx]] = emb
                logger.debug(f"Cached embedding for key {keys[orig_idx]}")
                
        except requests.exceptions.Timeout:
            logger.error("LM Studio timeout")
            raise HTTPException(504, "LM Studio timeout")
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            raise HTTPException(500, f"Failed to get embeddings: {str(e)}")

    return embeddings


# =========================
# CV DATA BUILDERS
# =========================

def build_cv_from_structured(struct: dict) -> dict:
    """Build CV dictionary from Laravel's structured data"""
    struct = strip_template_defaults(struct)

    extracted_skills = struct.get("extracted_skills", [])
    if isinstance(extracted_skills, str):
        extracted_skills = [s.strip() for s in extracted_skills.split(',')]

    education = struct.get("education_level", "")
    if is_default_template_value(education, CV_TEMPLATE_DEFAULTS["education_level"]):
        education = ""

    structured_data = struct.get("structured_data", {})
    if isinstance(structured_data, dict):
        structured_data = strip_template_defaults(structured_data)

    return {
        "skills": ", ".join(extracted_skills) if extracted_skills else "",
        "years_of_experience": struct.get("experience_years", 0),
        "education": education,
        "structured": structured_data if structured_data else {},
        "extracted_skills": extracted_skills,
    }


def build_cv_text(cv: Dict) -> str:
    """Build rich text representation from CV data"""
    parts = []
    
    if cv.get("skills"):
        parts.append("SKILLS: " + cv["skills"])
    
    if cv.get("years_of_experience"):
        parts.append(f"EXPERIENCE: {cv['years_of_experience']} years")
    
    if cv.get("education"):
        parts.append("EDUCATION: " + cv["education"])
    
    # Include useful sections from structured_data if available
    struct = cv.get("structured", {})
    for key, value in struct.items():
        key_lower = key.lower()
        if any(x in key_lower for x in ["work", "employment", "project", "certification", "achievement"]):
            if isinstance(value, str) and len(value) > 10:
                parts.append(f"{key.upper()}: {value[:200]}")  # Truncate long entries
            elif isinstance(value, list):
                items = [str(v)[:100] for v in value if str(v).strip()]
                if items:
                    parts.append(f"{key.upper()}: {', '.join(items)}")
    
    return "\n".join(parts)


def build_job_text(req: JobRequirements) -> str:
    """Build rich text representation from job requirements"""
    parts = [
        f"JOB TITLE: {req.job_title}",
        f"REQUIRED SKILLS: {', '.join(req.required_skills)}",
        f"PREFERRED SKILLS: {', '.join(req.preferred_skills)}",
        f"MIN EXPERIENCE: {req.min_experience} years",
        f"EDUCATION: {req.education_level}"
    ]
    
    if req.industry:
        parts.append(f"INDUSTRY: {req.industry}")
    if req.location:
        parts.append(f"LOCATION: {req.location}")
    
    return "\n".join(parts)


# =========================
# KEYWORD MATCHING
# =========================

def semantic_keyword_match(
    cv_embedding: List[float],
    keywords: List[str],
) -> List[Dict]:
    """Match keywords using semantic similarity"""
    if not keywords:
        return []

    keyword_embeddings = get_embeddings(keywords)

    results = []
    for kw, emb in zip(keywords, keyword_embeddings):
        sim = cosine_similarity(cv_embedding, emb)
        results.append({
            "keyword": kw,
            "similarity": round(sim, 3)
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results


# =========================
# SCORING
# =========================

def calculate_score(cv: Dict, req: JobRequirements):
    """Calculate comprehensive score with breakdown"""
    logger.info("Calculating score with enhanced algorithm")
    
    # 1. Get embeddings for semantic similarity
    cv_text = build_cv_text(cv)
    job_text = build_job_text(req)
    
    cv_emb, job_emb = get_embeddings([cv_text, job_text])
    semantic_score = cosine_similarity(cv_emb, job_emb)
    
    # 2. Match skills using embeddings
    required_matches = semantic_keyword_match(cv_emb, req.required_skills)
    preferred_matches = semantic_keyword_match(cv_emb, req.preferred_skills)
    
    # 3. Calculate component scores
    # Required skills (40%)
    req_count = len(req.required_skills)
    if req_count > 0:
        req_sim_sum = sum(item["similarity"] for item in required_matches)
        required_score = (req_sim_sum / req_count) * WEIGHTS["required"]
    else:
        required_score = WEIGHTS["required"]
    
    # Preferred skills (20%)
    pref_count = len(req.preferred_skills)
    if pref_count > 0:
        pref_sim_sum = sum(item["similarity"] for item in preferred_matches)
        preferred_score = (pref_sim_sum / pref_count) * WEIGHTS["preferred"]
    else:
        preferred_score = WEIGHTS["preferred"]
    
    # Experience score (20%)
    cv_exp = cv.get("years_of_experience", 0)
    req_exp = req.min_experience
    if req_exp > 0:
        exp_ratio = min(cv_exp / req_exp, 1.0)
        exp_score = exp_ratio * WEIGHTS["experience"]
    else:
        exp_score = WEIGHTS["experience"]
    
    # Education score (20%)
    edu_level = cv.get("education", "")
    edu_ratio = education_points(edu_level) / 20  # Normalize to 0-1
    education_score = edu_ratio * WEIGHTS["education"]
    
    # Total score
    total_score = required_score + preferred_score + exp_score + education_score
    
    # 4. Prepare matched/missing lists using threshold
    threshold = SIMILARITY_THRESHOLD
    matched_req = [
        {"skill": item["keyword"], "score": item["similarity"]}
        for item in required_matches if item["similarity"] > threshold
    ]
    missing_req = [
        {"skill": item["keyword"], "score": item["similarity"]}
        for item in required_matches if item["similarity"] <= threshold
    ]
    matched_pref = [
        {"skill": item["keyword"], "score": item["similarity"]}
        for item in preferred_matches if item["similarity"] > threshold
    ]
    
    # 5. Prepare response
    result = {
        "total_score": round(total_score, 2),
        "breakdown": {
            "required_skills": round(required_score, 2),
            "preferred_skills": round(preferred_score, 2),
            "experience": round(exp_score, 2),
            "education": round(education_score, 2),
            "semantic": round(semantic_score, 3)
        },
        "matched_required_skills": [m["skill"] for m in matched_req[:10]],
        "missing_required_skills": [m["skill"] for m in missing_req[:10]],
        "matched_preferred_skills": [m["skill"] for m in matched_pref[:10]],
        "skill_analysis": {
            "required": matched_req[:10],
            "missing": missing_req[:10],
            "preferred": matched_pref[:10]
        },
        "education_analysis": {
            "provided": edu_level,
            "normalized": normalize_education_level(edu_level),
            "points": education_points(edu_level)
        },
        "experience_analysis": {
            "provided": cv_exp,
            "required": req_exp,
            "ratio": round(exp_ratio, 2) if req_exp > 0 else 1.0
        }
    }
    
    logger.info(f"Score calculated: total={result['total_score']}")
    return result


# =========================
# API ENDPOINTS
# =========================

@app.get("/health")
def health():
    """Enhanced health check"""
    try:
        model_available = check_model_available()
        cache_size = len(_embedding_cache)
        
        return {
            "status": "ok",
            "model_available": model_available,
            "model_name": EMBEDDINGS_MODEL,
            "cache_size": cache_size,
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": time.time()
        }


@app.post("/score-cv")
async def score_cv(
    structured_data: Optional[str] = Form(None),
    cv_text: Optional[str] = Form(None),
    requirements: str = Form(...)
):
    """
    Score a CV against job requirements.
    Provide either 'structured_data' (JSON) or 'cv_text' (raw text).
    """
    start_time = time.time()
    
    # Parse requirements
    try:
        req_dict = json.loads(requirements)
        req = JobRequirements(**req_dict)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid requirements JSON")
    except Exception as e:
        raise HTTPException(400, f"Invalid requirements: {str(e)}")
    
    # Determine data source
    if structured_data:
        try:
            struct = json.loads(structured_data)
            cv = build_cv_from_structured(struct)
            source = "structured"
            logger.info(f"Using structured data for CV: {structured_data[:200]}...")
        except json.JSONDecodeError:
            raise HTTPException(400, "Invalid structured_data JSON")
    elif cv_text:
        if len(cv_text) > 50000:
            raise HTTPException(400, "Text too long (max 50000 chars)")
        cv = {
            "skills": cv_text,
            "years_of_experience": 0,
            "education": "",
            "extracted_skills": [],
            "structured": {}
        }
        source = "text"
        logger.info(f"Using raw text ({len(cv_text)} chars)")
    else:
        raise HTTPException(400, "Provide either structured_data or cv_text")
    
    # Calculate score
    try:
        result = calculate_score(cv, req)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scoring error: {e}")
        raise HTTPException(500, f"Scoring failed: {str(e)}")
    
    # Add metadata
    result["metadata"] = {
        "source": source,
        "processing_time": round(time.time() - start_time, 2),
        "model": EMBEDDINGS_MODEL,
        "threshold": SIMILARITY_THRESHOLD
    }
    
    return result


@app.get("/check-models")
def check_models():
    """Check available models in LM Studio"""
    try:
        r = session.get(MODELS_ENDPOINT, timeout=5)
        return {
            "status": r.status_code,
            "data": r.json(),
            "cache_size": len(_embedding_cache)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@app.get("/cache/stats")
def cache_stats():
    """Get cache statistics"""
    return {
        "cache_size": len(_embedding_cache),
        "keys": list(_embedding_cache.keys())[:10]  # First 10 keys for debugging
    }


@app.delete("/cache/clear")
def clear_cache():
    """Clear the embedding cache"""
    _embedding_cache.clear()
    return {"status": "ok", "message": "Cache cleared"}


# =========================
# MAIN
# =========================

if __name__ == "__main__":
    print("\n" + "="*50)
    print("CV Scoring Service (Structured Data Only)")
    print("="*50)
    print(f"LM Studio URL: {LM_STUDIO_URL}")
    print(f"Embedding Model: {EMBEDDINGS_MODEL}")
    print(f"Similarity Threshold: {SIMILARITY_THRESHOLD}")
    print(f"Weights: required={WEIGHTS['required']}, preferred={WEIGHTS['preferred']}, "
          f"experience={WEIGHTS['experience']}, education={WEIGHTS['education']}")
    print("="*50 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8001)