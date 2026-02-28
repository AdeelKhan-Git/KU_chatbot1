from celery import shared_task
from .models import UploadRecord
from .embedding import openai_embedder
from .utils import get_pdf_knowledge_base
from phi.document.chunking.semantic import SemanticChunking

@shared_task
def process_pdf(upload_id):
    pdf = UploadRecord.objects.get(id=upload_id)

    try:
        pdf.status = 'processing'
        pdf.save(update_fields=['status'])
       
      
        pdf_knowledge_base = get_pdf_knowledge_base(pdf.file.path)
            
        
        pdf_knowledge_base.load(recreate=False)

        pdf.status = 'completed'
        pdf.save(update_fields=['status'])
        
    except Exception as e:
        pdf.status = 'failed'
        pdf.save(update_fields=['status'])
        raise e