
import os
from phi.knowledge.pdf import PDFKnowledgeBase, PDFReader
from phi.vectordb.pgvector import PgVector2
from phi.agent import Agent,AgentMemory
from .models import ChatMessage
from phi.document.chunking.document import DocumentChunking
from .embedding import openai_embedder
from phi.storage.agent.postgres import PgAgentStorage 
from phi.memory.db.postgres import PgMemoryDb
from phi.model.openai import OpenAIChat


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PDF_DIR = os.path.join(BASE_DIR, "media", "pdfs")


open_api_key = os.environ.get("OPENAI_API_KEY")


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
        embedder=openai_embedder
        
    ),
    reader=SafePDFReader(chunk=True,chunking_strategy = DocumentChunking(chunk_size=5000, overlap=150)),
)




description = "You are the official AI assistant of the University of Karachi."
instructions = [
    "Respond in a friendly and professional tone.",
    "Always use Markdown formatting.",
    "Use bullet points for lists.",
    "Use double newlines between paragraphs.",
    "Use headers (###) for sections.",
    "If a user greets you, respond politely.",
    "If you present tabular data, always format it as a Markdown table with headers and pipe-separated columns. Include proper alignmnt with --- under headers.",
    "Provide information strictly from the knowledge base.",
    "If information is missing, reply exactly with: I don't have information about that."
]



agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    memory=AgentMemory(
        db=PgMemoryDb(table_name="agent_memory", db_url="postgresql+psycopg://ai:ai@localhost:5532/ai"),
        create_user_memories=True,
        create_session_summary=True
    ),
    storage=PgAgentStorage(table_name="University_of_Karachi", db_url="postgresql+psycopg://ai:ai@localhost:5532/ai"),
    knowledge_base=pdf_knowledge_base,
    api_key = open_api_key,
    description=description,
    instructions=instructions,
    markdown=True,
    stream=True,
    use_knowledge=True,
    search_knowledge=True,
    prevent_hallucinations=True,

)


def ask_phi(user, question):
    full_response = ""

    
    for chunk in agent.run(question, stream=True):
        content = getattr(chunk, "content", None)
        if content:
            content = content.replace("<br>", "\n")
            full_response += content
            yield content  

    
    if not full_response.strip():
        fallback = "I don't have information about that"
        full_response = fallback
        yield fallback

    
    ChatMessage.objects.create(user=user, role="user", content=question)
    ChatMessage.objects.create(user=user, role="assistant", content=full_response.strip())
