import pandas as pd
import requests
import numpy as np
import os
import json
import re
from sklearn.metrics.pairwise import cosine_similarity

LM_STUDIO_URL = "http://localhost:1234/v1/embeddings"
CACHE_FILE = "resume_embeddings_cache.json"

def clean_text(text):
    if text is None:
        return ""
    
    text = str(text)

    # Keep only letters, numbers, and spaces
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)

    # Collapse multiple spaces into one
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ---------- Embedding ----------
def get_embedding(text):
    payload = {
        "model": "local-model",
        "input": text
    }
    response = requests.post(LM_STUDIO_URL, json=payload, timeout=60)
    response.raise_for_status()
    return np.array(response.json()["data"][0]["embedding"])


# ---------- Chunking ----------
def chunk_text(text, chunk_size=400):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


# ---------- Resume Embedding with Chunking ----------
def embed_long_text(text):
    chunks = chunk_text(text)
    embeddings = [get_embedding(chunk) for chunk in chunks]

    # Average all chunk embeddings into one vector
    return np.mean(embeddings, axis=0)


# ---------- Cache Handling ----------
def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
            return {k: np.array(v) for k, v in raw.items()}
    return {}


def save_cache(cache):
    serializable = {k: v.tolist() for k, v in cache.items()}
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(serializable, f)


# ---------- Main Matching ----------
def get_resume_embeddings(resumes_df):
    cache = load_cache()
    embeddings = []

    for _, row in resumes_df.iterrows():
        resume_id = str(row.name)   # use dataframe index as ID
        text = clean_text(row["Resume"])

        if pd.isna(text) or str(text).strip() == "":
            embeddings.append(np.zeros(768))  # or skip it safely
            continue

        text = str(text)

        if resume_id in cache:
            emb = cache[resume_id]
        else:
            print(f"Embedding resume {resume_id}...")
            emb = embed_long_text(text)
            cache[resume_id] = emb

        embeddings.append(emb)

    save_cache(cache)
    return np.array(embeddings)


def match_job_to_resumes(job_text, resumes_df):
    print("Loading resume embeddings...")
    resume_embeddings = get_resume_embeddings(resumes_df)

    print("Embedding job description...")
    job_text = clean_text(job_text)
    job_embedding = embed_long_text(job_text)

    similarities = cosine_similarity(
        [job_embedding],
        resume_embeddings
    )[0]

    resumes_df["match_score"] = similarities
    return resumes_df.sort_values(by="match_score", ascending=False)


# ---------- Run ----------
def main():
    resumes = pd.read_csv("UpdatedResumeDataSet.csv")
    jobs = pd.read_excel("job_title_des.xlsx")

    # Clean empty resumes
    resumes = resumes.dropna(subset=["Resume"])
    resumes = resumes[resumes["Resume"].str.strip() != ""]

    job_index = 0
    job_title = jobs.iloc[job_index]["Job Title"]
    job_text = jobs.iloc[job_index]["Job Description"]

    ranked = match_job_to_resumes(job_text, resumes)

    print("\nJob Title:", job_title)
    print("\nTop 5 Matches:\n")
    print(ranked[["match_score", "Category", "Resume"]].head(5))

if __name__ == "__main__":
    main()
