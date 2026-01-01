from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import status,permissions
from rest_framework.parsers import MultiPartParser,FormParser
from rest_framework.response import Response
from .models import UploadRecord,ChatMessage
from .embedding import openai_embedder
from phi.knowledge.pdf import PDFKnowledgeBase
from phi.vectordb.pgvector import PgVector2
from .serializer import ChatMessageSerializer,UploadSerializer
from .utils import ask_phi,SafePDFReader
from phi.document.chunking.document import DocumentChunking




# Create your views here.


class ChatBotAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        prompt = request.data.get('prompt')

        if not prompt:
            return Response({'error':'prompt is required'},status=status.HTTP_400_BAD_REQUEST)
        
        try:
            full_response = ""
            for chunk in ask_phi(request.user, prompt):
                chunk = chunk.replace("<br>", "\n")
                full_response += chunk

            return Response({"response": full_response.strip()})
        except Exception as e:
            return Response({'error': str(e)},status=status.HTTP_400_BAD_REQUEST)
        
                    
class UploadFileView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser,FormParser]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.lower().endswith(".pdf"):
            return Response({"error": "Only PDF files allowed"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                pdf = UploadRecord(
                            file=file,
                            name=file.name,
                            uploaded_by=request.user,
                        )


        
                pdf_knowledge_base = PDFKnowledgeBase(
                    path=pdf.file.path,
                    vector_db=PgVector2(
                        collection="UoK_Data",
                        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
                        embedder=openai_embedder
                        
                    ),
                    reader=SafePDFReader(
                        chunk=True,
                        chunking_strategy = DocumentChunking(chunk_size=5000, overlap=150)),
                    )
                
    
                 # Re-index knowledge base
                pdf_knowledge_base.load()

                pdf.save()
        
        except Exception as e:
            return Response({'error': f"Failed to process PDF: {str(e)}"},status=status.HTTP_400_BAD_REQUEST)
        
        return Response(
            {
                "message": "PDF uploaded and indexed successfully",
                "file": pdf.name,
            },
            status=status.HTTP_201_CREATED,
        )



class UploadedDataListView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        
        records = UploadRecord.objects.all().order_by('-uploaded_at')

        serializer =  UploadSerializer(records,many=True)

        return Response({'message':serializer.data}, status=status.HTTP_200_OK)
     




class GetChatDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        last_msg = timezone.now() - timedelta(minutes=5)
        try:
            chat = ChatMessage.objects.filter(
                user=request.user,
                timestemp__gte = last_msg,
                ).order_by('timestemp')
            
           
            serializer = ChatMessageSerializer(chat, many=True)
            return Response({'data':serializer.data},status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({'error':str(e)},status=status.HTTP_400_BAD_REQUEST)
        