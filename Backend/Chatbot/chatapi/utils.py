
import os
from phi.knowledge.pdf import PDFKnowledgeBase, PDFReader
from phi.vectordb.pgvector import SearchType,PgVector
from phi.tools.tavily import TavilyTools
from phi.agent import Agent,AgentMemory
from .models import ChatMessage
from phi.document.chunking.document import DocumentChunking
from .embedding import openai_embedder
from phi.storage.agent.postgres import PgAgentStorage 
from phi.memory.db.postgres import PgMemoryDb
from phi.model.openai import OpenAIChat



BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PDF_DIR = os.path.join(BASE_DIR, "media", "pdfs")

posgre_url = os.getenv("DATABASE_URL")
# posgre_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

open_api_key = os.environ.get("OPENAI_API_KEY")
travily_api_key = os.environ.get("TAVILY_API_KEY")


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


def get_pdf_knowledge_base(path: str):
    return PDFKnowledgeBase(
        path=path,
        vector_db=PgVector(
            table_name="UoK_Data",
            db_url=posgre_url,
            embedder=openai_embedder,
            search_type=SearchType.hybrid,
        ),
        reader=SafePDFReader(
            chunk=True,
            chunking_strategy=DocumentChunking(
                chunk_size=800,
                overlap=150
            ),
        ),
    )



description = (
    "You are the official AI assistant of the University of Karachi (UoK). "
    "You help students with admissions, fee structures, eligibility criteria, "
    "departments, scholarships, exam schedules, and all university-related queries."
)


instructions = [

    # ── SEARCH ORDER ────────────────────────────────────────────────────────
    "STEP 1: For every university-related question, ALWAYS search the knowledge "
    "base first using relevant keywords.",

    "STEP 2: If the knowledge base does not return a useful answer, you MUST "
    "immediately call the TavilyTools search tool. "
    "Your search query should be natural and specific, always including "
    "'University of Karachi' in the query. "
    "Examples: "
    "'University of Karachi PM laptop scheme 2025', "
    "'University of Karachi admission 2026', "
    "'University of Karachi fee structure morning', "
    "'University of Karachi latest news', "
    "'University of Karachi scholarship'. "
    "NEVER go to fallback before calling TavilyTools.",

    "STEP 3: When TavilyTools returns results, you MUST read every single result "
    "title and snippet and summarize the information clearly for the student. "
    "The results are real data from the official UoK website. "
    "It does NOT matter if the snippets are short or partial — "
    "extract whatever is there and present it. "
    "NEVER say 'I could not find information' if the tool returned any results at all.",

    "STEP 4: Only use the fallback message 'I don't have information about that. "
    "Please visit https://www.uok.edu.pk' when BOTH the knowledge base "
    "AND TavilyTools return absolutely zero relevant results.",

    # ── KNOWLEDGE BASE ──────────────────────────────────────────────────────
    "Prioritize information from the knowledge base over your general training knowledge.",

    "Closing percentages, eligibility requirements, fee structures, seat counts, "
    "and reserved seats ARE all available in the knowledge base. "
    "Always search with specific terms such as: "
    "'closing percentage morning 2025', 'fee structure BSCS', "
    "'eligibility computer science', 'reserved seats', or just the department name.",

    # ── CONVERSATIONAL CONTEXT ──────────────────────────────────────────────
    "Always remember the full conversation history and maintain context across messages.",
    "If a student refers to something mentioned earlier such as 'what about that fee' "
    "or 'how do I apply for that', resolve it from prior messages — never ask them to repeat.",
    "If a follow-up question is vague or incomplete, infer its meaning from the conversation history.",

    # ── SHIFT HANDLING ──────────────────────────────────────────────────────
    "The University of Karachi offers TWO shifts: Morning and Evening. "
    "These shifts have DIFFERENT fees, seat counts, and timings.",
    "Whenever a student asks about fee, admission, seats, or any program details, "
    "ALWAYS show BOTH Morning and Evening shifts together in a Markdown table. "
    "Never default to one shift only. Never ask which shift — just always show both.",
    "Only skip the shift table for questions clearly unrelated to shifts "
    "such as campus location, contact info, or general university history.",

    # ── DOMAIN FOCUS ────────────────────────────────────────────────────────
    "You assist students with: admissions, eligibility, fee structures, "
    "closing percentages, departments, scholarships, exam schedules, "
    "hostel, transport, and campus facilities.",
    "If a question is completely unrelated to UoK say: "
    "'I am specialized for University of Karachi queries. "
    "For other topics I recommend using a general search engine.'",

    # ── FORMATTING ──────────────────────────────────────────────────────────
    "Always use Markdown formatting in every response.",
    "Use Markdown tables for fees, seats, closing percentages, and comparative data.",
    "Use bullet points for lists and step-by-step instructions.",
    "Keep responses concise but complete — no unnecessary filler text.",

    # ── TONE ────────────────────────────────────────────────────────────────
    "Respond in a friendly, helpful, and professional tone.",
    "If a user greets you, respond warmly and ask how you can help them today.",
    "Be patient and encouraging — many users may be first-time university applicants.",
]



def get_agent(user_id: str):
    return Agent(
        model=OpenAIChat(id="gpt-4o"),
        memory=AgentMemory(
            db=PgMemoryDb(
                table_name="agent_memory",
                db_url=posgre_url,
              
            ),
            user_id = user_id,
            create_user_memories=True,
            update_user_memories_after_run=True,
            create_session_summary=True,
        ),
        storage=PgAgentStorage(
            table_name="University_of_Karachi",
            db_url=posgre_url,
        ),
        user_id=user_id,
        session_id = str(user_id),
        knowledge_base=get_pdf_knowledge_base(PDF_DIR),
        tools =[TavilyTools(
                api_key=travily_api_key,

        )] ,
        api_key=open_api_key,
        description=description,
        instructions=instructions,
        add_history_to_messages=True,
        num_history_responses=3,
        read_chat_history=True,
        markdown=True,
        stream=True,
        use_knowledge=True,
        search_knowledge=True,
        prevent_hallucinations=False,
        show_tool_calls=False,
    )


def ask_phi(user, question):
    full_response = ""

    agent = get_agent(str(user.id))
    for chunk in agent.run(question, user_id= user.id,session_id=str(user.id),stream=True):
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
