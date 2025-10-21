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
from langchain.memory import ConversationBufferMemory

logger = logging.getLogger(__name__)

CHROMA_DB_DIR = "/data/chroma"
COLLECTION_NAME = "knowledgebase_qna"

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
You are the KU AI Assistant, helping students of Karachi University.

Rules:
- Answer ONLY from the given context.
- Use chat history ONLY to maintain continuity, do NOT repeat or summarize it.
- Do not introduce yourself or restate previous answers.
- If the context does not have the answer, reply with: "I don't have information about that."
- Keep responses short, clear, and to the point.

Context:
{context}

Chat History (previous Q&A for reference only):
{chat_history}

User Question: {question}
Answer:
"""

prompt = ChatPromptTemplate.from_template(template)

def ensure_database_connection():
    """Ensure database connection is active"""
    for conn in connections.all():
        if not conn.is_usable():
            conn.connect()

def sync_new_entries_to_vector_store():
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
            entry_id = str(entry.id)
            if entry_id not in existing_ids:
                new_docs.append(Document(
                    page_content=entry.question,
                    metadata={"source": "kb", "answer": entry.answer, "id": entry_id},
                    id=entry_id
                ))
                new_ids.append(entry_id)

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
                sync_new_entries_to_vector_store()

def get_user_memory(user):
    memory = ConversationBufferMemory(
        memory_key='chat_history',
        return_messages=True
    )

    messages = ChatMessage.objects.filter(user=user).order_by('timestemp')[:10]
    for msg in messages:
        if msg.role == 'user':
            memory.chat_memory.add_user_message(msg.content)
        else:
            memory.chat_memory.add_ai_message(msg.content)

    return memory

def format_chat_history(memory):
    """Format recent history as short Q&A turns"""
    history = memory.chat_memory.messages[-5:]  # last 5 turns only
    formatted = []
    for msg in history:
        if msg.type == "human":
            formatted.append(f"User: {msg.content}")
        else:
            formatted.append(f"Assistant: {msg.content}")
    return "\n".join(formatted)

def chatbot_response(user, question):
    logger.info(f"[START] Processing prompt: {question}")
    try:
        initialize_vector_store()
        memory = get_user_memory(user)

        chain = (
            {
                "context": lambda x: get_context(x["question"]),
                "question": lambda x: x["question"],
                "chat_history": lambda x: format_chat_history(memory)
            }
            | prompt
            | llm
        )

        full_reply = ""
        start_gen = time.time()

        try:
            for chunk in chain.stream({"question": question}):
                token = chunk.content if hasattr(chunk, "content") else str(chunk)
                full_reply += token
                yield token
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
    """Retrieve relevant context from vector store"""
    docs = vector_store.similarity_search_with_score(question, k=10)
    relevant_docs = []
    for doc, score in docs:
        similarity = 1.0 - score
        if similarity > 0.6:
            relevant_docs.append((doc, similarity))
            logger.info(f"Relevant doc: similarity={similarity:.2f}, content={doc.page_content[:50]}...")

    if relevant_docs:
        return "\n".join([
            f"Content: {doc.page_content}\nAnswer: {doc.metadata.get('answer', '')}"
            for doc, _ in relevant_docs
        ])
    else:
        logger.info("[RETRIEVER] No relevant documents found")
        return ""
