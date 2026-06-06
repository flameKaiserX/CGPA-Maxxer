import logging
import os
import re
import pymupdf
from google import genai
from supabase import create_client
from dotenv import load_dotenv

from backend.logger import logger as backend_logger

load_dotenv()
logger = backend_logger.getChild("chunk")

# ── Clients ───────────────────────────────────────────────────────────────────
gemini   = genai.Client(api_key=os.environ["GOOGLE_GEMINI_API_KEY"])
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# ── Config ────────────────────────────────────────────────────────────────────
CHUNK_SIZE    = 300
CHUNK_OVERLAP = 50
SYLLABUS_DIR  = "backend/data/syllabus"
EMBED_MODEL   = "gemini-embedding-001"
EMBED_DIMS    = 768   # truncate from 3072 → 768 using MRL, no quality loss


# ── Step 1: Extract text from PDF ─────────────────────────────────────────────
def extract_text(pdf_path: str) -> str:
    logger.info("Reading PDF: %s", pdf_path)
    doc = pymupdf.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text


# ── Step 2: Clean the text ────────────────────────────────────────────────────
def clean_text(text: str) -> str:
    logger.info("Cleaning extracted text")
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'-\n', '', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


# ── Step 3: Split into overlapping chunks ─────────────────────────────────────
def split_into_chunks(text: str) -> list[str]:
    logger.info("Splitting text into chunks size=%d overlap=%d", CHUNK_SIZE, CHUNK_OVERLAP)
    words  = text.split()
    chunks = []
    start  = 0
    while start < len(words):
        chunk = " ".join(words[start:start + CHUNK_SIZE])
        chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


# ── Step 4: Generate embedding ────────────────────────────────────────────────
def generate_embedding(text: str) -> list[float]:
    response = gemini.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config={"output_dimensionality": EMBED_DIMS}
    )
    return response.embeddings[0].values


# ── Step 5: Store chunk in Supabase ───────────────────────────────────────────
def store_chunk(chunk: str, embedding: list[float], metadata: dict):
    supabase.table("syllabus_chunks").insert({
        "text":         chunk,
        "embedding":    embedding,
        "subject":      metadata.get("subject"),
        "subject_code": metadata.get("subject_code"),
        "semester":     metadata.get("semester"),
        "branch":       metadata.get("branch"),
        "year":         metadata.get("year"),
        "unit":         metadata.get("unit"),
        "source_file":  metadata.get("source_file"),
    }).execute()


# ── Step 6: Process a single PDF ──────────────────────────────────────────────
def process_pdf(pdf_path: str, metadata: dict):
    filename = os.path.basename(pdf_path)
    logger.info("Processing: %s", filename)
    logger.info("Metadata: branch=%s, year=%s, semester=%s", metadata.get('branch'), metadata.get('year'), metadata.get('semester'))

    raw_text = extract_text(pdf_path)
    clean = clean_text(raw_text)
    logger.info("Extracted %d words", len(clean.split()))

    chunks = split_into_chunks(clean)
    logger.info("Split into %d chunks", len(chunks))

    # Test embedding on first chunk before processing all
    logger.info("Testing embedding on chunk 1")
    try:
        test_embedding = generate_embedding(chunks[0])
        logger.info("Embedding works — %d dimensions", len(test_embedding))
    except Exception as e:
        logger.exception("Embedding failed")
        return

    # Test Supabase insert
    logger.info("Testing Supabase insert")
    try:
        store_chunk(chunks[0], test_embedding, {**metadata, "source_file": filename})
        logger.info("Supabase insert works")
    except Exception as e:
        logger.exception("Supabase insert failed")
        return

    # Process remaining chunks
    for i, chunk in enumerate(chunks[1:], start=2):
        logger.info("Processing chunk %d/%d", i, len(chunks))
        try:
            embedding = generate_embedding(chunk)
            store_chunk(chunk, embedding, {**metadata, "source_file": filename})
        except Exception as e:
            logger.exception("Failed on chunk %d", i)
            continue

    logger.info("Done — %d chunks stored in Supabase", len(chunks))


# ── Step 7: Walk the syllabus directory ───────────────────────────────────────
def process_all_syllabus():
    logger.info("Starting syllabus chunking")

    pdf_found = False
    for root, dirs, files in os.walk(SYLLABUS_DIR):
        for file in files:
            if not file.endswith(".pdf"):
                continue

            pdf_found = True
            pdf_path = os.path.join(root, file)
            folder   = root.replace("\\", "/").split("/")[-1]

            if folder.startswith("year"):
                metadata = {
                    "branch":       "Common",
                    "year":         int(folder.replace("year", "")),
                    "semester":     None,
                    "subject":      None,
                    "subject_code": None,
                    "unit":         None,
                }
            else:
                sem_match = re.search(r'sem(\d+)', file, re.IGNORECASE)
                semester  = int(sem_match.group(1)) if sem_match else None
                metadata  = {
                    "branch":       folder,
                    "year":         (1 if semester <= 2 else 2 if semester <= 4 else 3 if semester <= 6 else 4) if semester else None,
                    "semester":     semester,
                    "subject":      None,
                    "subject_code": None,
                    "unit":         None,
                }

            process_pdf(pdf_path, metadata)

    if not pdf_found:
        logger.warning("No PDFs found in %s", SYLLABUS_DIR)
    else:
        logger.info("All PDFs processed successfully")


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    process_all_syllabus()