from google import genai
from supabase import create_client

from backend.config import GOOGLE_GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
from backend.logger import logger

# ── Clients ───────────────────────────────────────────────────────────────────
if not GOOGLE_GEMINI_API_KEY:
    raise RuntimeError("GOOGLE_GEMINI_API_KEY is required for the backend chat service.")
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required for the backend chat service.")

client = genai.Client(api_key=GOOGLE_GEMINI_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── Config ───────────────────────────────────────────────────────────────────
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIMS = 768
CHAT_MODEL = "gemini-3.5-flash"
MAX_CHUNKS = 5


def embed_query(text: str) -> list[float]:
    try:
        response = client.models.embed_content(
            model=EMBED_MODEL,
            contents=text,
            config={"output_dimensionality": EMBED_DIMS}
        )
        return response.embeddings[0].values
    except Exception as exc:
        logger.exception("Failed to generate embedding")
        raise RuntimeError("Embedding service unavailable") from exc


def search_syllabus(embedding: list[float], semester: int | None, program: str | None) -> list[str]:
    try:
        result = supabase.rpc("match_syllabus_chunks", {
            "query_embedding": embedding,
            "match_count":     MAX_CHUNKS,
            "filter_semester": semester,
            "filter_branch":   program,
        }).execute()
        return [row["text"] for row in result.data] if result.data else []
    except Exception as exc:
        logger.exception("Failed to query syllabus embeddings")
        raise RuntimeError("Search service unavailable") from exc


def build_prompt(question: str, chunks: list[str], program: str | None, semester: int | None) -> str:
    context = "\n\n---\n\n".join(chunks) if chunks else "No syllabus context found."
    return f"""You are an expert academic assistant for IPU (Indraprastha University) students.
Your job is to help students understand their syllabus and prepare for exams.

Program: {program or "Not specified"}
Semester: {semester or "Not specified"}

STRICT RULES:
- Answer ONLY using the syllabus context provided below
- If the answer is not in the context, say: "This topic doesn't appear to be in your syllabus. Please verify with your department."
- Never answer from outside knowledge
- Keep answers clear, structured and exam-focused
- If a topic appears in PYQs, mention it is frequently asked

SYLLABUS CONTEXT:
{context}

STUDENT QUESTION:
{question}

Answer:"""


def build_contents(messages: list, rag_prompt: str) -> list[dict]:
    contents = []
    for msg in messages[:-1]:
        contents.append({
            "role":  "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.content}]
        })
    contents.append({"role": "user", "parts": [{"text": rag_prompt}]})
    return contents


async def stream_chat(messages: list, program: str | None, semester: int | None):
    last_message = messages[-1].content
    embedding    = embed_query(last_message)
    chunks       = search_syllabus(embedding, semester, program)
    rag_prompt   = build_prompt(last_message, chunks, program, semester)
    contents     = build_contents(messages, rag_prompt)

    async for chunk in await client.aio.models.generate_content_stream(
        model=CHAT_MODEL,
        contents=contents,
    ):
        yield chunk.text or ""