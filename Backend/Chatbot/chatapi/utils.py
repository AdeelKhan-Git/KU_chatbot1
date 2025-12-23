
import os
from phi.knowledge.pdf import PDFKnowledgeBase, PDFReader
from phi.vectordb.pgvector import PgVector2
from phi.agent import Agent
from .models import ChatMessage
from phi.model.groq import Groq
from .embedding import gemini_embedder
from phi.storage.agent.postgres import PgAgentStorage


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PDF_DIR = os.path.join(BASE_DIR, "media", "pdfs")

groq_api_key = os.environ.get("GROQ_API_KEY")


class SafePDFReader(PDFReader):
    def read(self, pdf: str):
        documents = super().read(pdf=pdf)

        # filter empty documents
        safe_docs = []
        for doc in documents:
            if doc.content and doc.content.strip():
                safe_docs.append(doc)

        print(f"Loaded {len(safe_docs)} non-empty chunks")
        return safe_docs


pdf_knowledge_base = PDFKnowledgeBase(
    path=PDF_DIR,
    vector_db=PgVector2(
        collection="UoK_Data",
        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
        embedder=gemini_embedder
        
    ),
    reader=SafePDFReader(chunk=True,chunk_size=400,chunk_overlap=50),
)




description = "You are the official AI assistant of the University of Karachi."
instructions = [
    "Respond in a friendly and professional tone.",
    "Always use Markdown formatting.",
    "Use bullet points for lists.",
    "Use double newlines between paragraphs.",
    "Use headers (###) for sections.", 
    "If a user greets you, respond politely.",
    "Provide information strictly from the knowledge base.",
    "If information is missing, reply exactly with: I don't have information about that."
]



agent = Agent(
    model=Groq(id="openai/gpt-oss-120b"),
    storage=PgAgentStorage(table_name="University_of_Karachi", db_url="postgresql+psycopg://ai:ai@localhost:5532/ai"),
    knowledge_base=pdf_knowledge_base,
    api_key = groq_api_key,
    description=description,
    instructions=instructions,
    markdown=True,
    stream=True,
    use_knowledge=True,
    search_knowledge=True,
    read_chat_history=True,
    num_history_responses=5,
    prevent_hallucinations=True,
    
)


def ask_phi(user, question):
    """Chatbot streaming response with DB save"""
    full_response = ""

    # Stream tokens and yield them
    for chunk in agent.run(question, stream=True):
        content = getattr(chunk, "content", None)
        if content:
            full_response += content
            yield content  

    # If nothing generated, yield fallback
    if not full_response.strip():
        fallback = "I don't have information about that"
        full_response = fallback
        yield fallback

    # Save messages to DB
    ChatMessage.objects.create(user=user, role="user", content=question)
    ChatMessage.objects.create(user=user, role="assistant", content=full_response.strip())
