from celery import shared_task
from .models import UploadRecord
from phi.knowledge.pdf import PDFKnowledgeBase
from phi.vectordb.pgvector import PgVector2
from .embedding import openai_embedder
from .utils import SafePDFReader,posgre_url
from phi.document.chunking.document import DocumentChunking

@shared_task
def process_pdf(upload_id):
    pdf = UploadRecord.objects.get(id=upload_id)


    pdf_knowledge_base = PDFKnowledgeBase(
        path=pdf.file.path,
        vector_db=PgVector2(
        collection="UoK_Data",
        db_url=posgre_url,
        embedder=openai_embedder
                        
        ),
        reader=SafePDFReader(
        chunk=True,
        chunking_strategy = DocumentChunking(chunk_size=800, overlap=150)),
        )
    
    pdf_knowledge_base.load(recreate=False)