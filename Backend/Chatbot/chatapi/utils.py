import time, re
import threading
from django.db import connections
from .embedding import embeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from chatapi.models import KnowledgeBase, ChatMessage
import logging
import os
from google import genai


logger = logging.getLogger(__name__)

CHROMA_DB_DIR = "chroma"
COLLECTION_NAME = "knowledgebase"

# client = genai.Client(
#     api_key=os.getenv("GEMINI_API_KEY")
# )
# MODEL = "models/gemini-2.5-flash"


# # gemini_model = genai.GenerativeModel(
# #      model_name=MODEL


# # )


# Initialize models
llm = OllamaLLM(
    model="mistral",
    model_kwargs={"num_predict": 150},
    num_gpu=1,
    keep_alive='10m',
    streaming=True,

)

# Initialize Chroma vector store
vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    persist_directory=CHROMA_DB_DIR,
    embedding_function=embeddings
)

# Thread-safe initialization
vector_store_initialized = False
vector_store_lock = threading.Lock()

# Updated prompt template
template = """
# System Prompt — Karachi University AI Assistant

You are the **official Karachi University AI Assistant**.

## Rules
- Use **ONLY** the provided context.
- **Do NOT** add external knowledge, assumptions, or interpretations.
- **Do NOT** add notes, disclaimers, explanations, summaries about the source, or self-references.
- **Do NOT** mention phrases like:
  - "based on the provided prospectus"
  - "according to the context"
  - "this information does not include external knowledge"
- Summarize information **clearly and concisely**.
- If information is **partially available**, answer **only what is present**.
- If **no relevant information exists**, respond exactly with:

> **I don't have information about that in the provided prospectus.**

## Response Format (MANDATORY)
- **All answers MUST be in Markdown**
- Use:
  - Headings where appropriate
  - Bullet points or tables for structured data
  - **Bold text** for important terms
- **ONLY output the answer content**
- **No extra text before or after the answer**

## Input Format
```text
Context:
{context}

Question:
{question}


"""

prompt = ChatPromptTemplate.from_template(template)

def ensure_database_connection():
    """Ensure database connection is active"""
    for conn in connections.all():
        if not conn.is_usable():
            conn.connect()

def sync_kb_to_chroma():
    """Sync only new entries to vector store with proper DB connection handling"""
    global vector_store_initialized
    try:
        ensure_database_connection()
        try:
            existing_ids = set(vector_store.get()['ids'])
            logger.info(f"[VECTOR SYNC] Existing IDs: {existing_ids}")
        except:
            existing_ids = set()

        new_docs, new_ids = [], []
        for entry in KnowledgeBase.objects.all().iterator():
            cleaned_text = clean_kb_text(entry.content)
            chunks = semantic_chunk(cleaned_text)

            for i, chunk in enumerate(chunks):
                if len(chunk) < 50:
                    continue

                doc_id = f"{entry.file_name}_{entry.page}_{i}"
                if doc_id in existing_ids:
                    continue

                doc = Document(
                    page_content=f"Karachi University Prospectus Information.\n{chunk}",
                    metadata={"file": entry.file_name, "page": entry.page, "chunk": i},
                    id=doc_id
                )
                new_docs.append(doc)
                new_ids.append(doc_id)

        if new_docs:
            logger.info(f"[VECTOR SYNC] Adding {len(new_docs)} new documents")
            vector_store.add_documents(documents=new_docs, ids=new_ids)
        else:
            logger.info("[VECTOR SYNC] No new documents to add")

        vector_store_initialized = True
        return True

    except Exception as e:
        logger.warning(f"[VECTOR SYNC ERROR] {str(e)}")
        return False

def initialize_vector_store():
    """Thread-safe vector store initialization"""
    global vector_store_initialized
    if not vector_store_initialized:
        with vector_store_lock:
            if not vector_store_initialized:
                sync_kb_to_chroma()





def chatbot_response(user, question):
    logger.info(f"[START] Processing prompt: {question}")
    try:
        initialize_vector_store()
     
        context = get_context(question)

        if not context:
            reply = "I don't have information about that"
            yield reply

            ChatMessage.objects.create(user=user, role="user", content=question)
            ChatMessage.objects.create(user=user, role="assistant", content=reply)
            return
        


        llm_input = prompt.format(context=context, question=question)
        full_reply = ""
        start_gen = time.time()
        try:
            for chunk in llm.stream(llm_input):
                token = chunk.content if hasattr(chunk, "content") else str(chunk)
                full_reply += token
                yield token

            # response = client.models.generate_content_stream(
            # model=MODEL,
            # contents=llm_input,
            # )

            # for chunk in response:
            #     if chunk.text:
            #         full_reply += chunk.text
            #         yield chunk.text
        except Exception as e:
            logger.error(f"[STREAM ERROR] {str(e)}")
            yield "I encountered an error processing your request."
            return

        generation_time = time.time() - start_gen
        logger.info(f"[GENERATION] Took {generation_time:.2f} seconds")

        final_reply = clean_response(full_reply)

        # Save messages
        ChatMessage.objects.create(user=user, role="user", content=question)
        ChatMessage.objects.create(user=user, role="assistant", content=final_reply)

    except Exception as e:
        logger.info(f"[ERROR] {str(e)}")
        yield "I encountered an error processing your request."


def clean_response(response):
    """Remove unwanted AI self-introductions from responses"""
    unwanted_patterns = [
        r"Context:.*?Answer:",
        r"Chat History.*?\]",
        r"User Question:.*?Answer:",
        r"Hello!.*",
        r"As an AI.*",
        r"<\|.*?\|>",
        ]
    for pattern in unwanted_patterns:
        response = re.sub(pattern, "", response, flags=re.DOTALL).strip()

    if not response:
        response = "How can I help you with information about Karachi University?"
    return response

def get_context(question):
    docs = vector_store.similarity_search(question, k=5)

    if not docs:
        logger.info("[RETRIEVER] No documents returned")
        return ""
    
    for d in docs:
        logger.info(f"[RETRIEVED] Page {d.metadata['page']} Chunk {d.metadata['chunk']}:\n{d.page_content[:300]}")

    return "\n\n".join([d.page_content for d in docs])


def semantic_chunk(text):
    chunks = []
    buffer = ""

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Heading detection
        if line.isupper() and len(line) < 80:
            if buffer:
                chunks.append(buffer.strip())
                buffer = ""
            buffer += f"\n## {line}\n"
        else:
            buffer += line + " "

    if buffer:
        chunks.append(buffer.strip())

    return chunks

def clean_kb_text(text):
    """Remove garbage lines and duplicates."""
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\b(NAME|DESIGNATION|EXT:|TELEPHONE)\b.*', '', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()