from rest_framework.views import APIView
from rest_framework import status,permissions
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from .models import UploadRecord,ChatMessage
from .serializer import ChatMessageSerializer,UploadSerializer
from .utils import ask_phi
from .task import process_pdf
from django.http import StreamingHttpResponse

# Create your views here.
class ChatBotAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        prompt = request.data.get('prompt')

        if not prompt:
            return Response({'error': 'prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

        def generate():
            try:
                for chunk in ask_phi(request.user, prompt):
                    safe_chunk = chunk.replace("\n", "\\n")
                    yield f"data: {safe_chunk}\n\n"
            except Exception as e:
                yield f"data: [ERROR] {str(e)}\n\n"

        return StreamingHttpResponse(
            generate(),
            content_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',  
            }
        )
        
                    
class UploadFileView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.lower().endswith(".pdf"):
            return Response({"error": "Only PDF files allowed"}, status=status.HTTP_400_BAD_REQUEST)


        
        pdf = UploadRecord.objects.create(
                file=file,
                name=file.name,
                uploaded_by=request.user,
                        )
        

        process_pdf.delay(pdf.id)

        return Response(
            {
                "message": "PDF uploaded and Processing started",
                "id":pdf.id,
                "file": pdf.name,
                "status": pdf.status
            },
            status=status.HTTP_201_CREATED,
        )



class UploadedDataListView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        
        records = UploadRecord.objects.filter(status="completed").order_by('-uploaded_at')

        serializer =  UploadSerializer(records,many=True)

        return Response({'message':serializer.data}, status=status.HTTP_200_OK)
    
     
class UploadStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request, pdf_id):

        try:
            pdf = UploadRecord.objects.get(id=pdf_id)

            return Response({
                "id":pdf.id,
                "status": pdf.status,
                "file": pdf.name

            })
        except UploadRecord.DoesNotExist:
            return Response({"error":"Pdf record not Found"}, status= status.HTTP_404_NOT_FOUND)



class GetChatDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            chat = ChatMessage.objects.filter(
                user=request.user,
                ).order_by('timestemp')[:20]
            
           
            serializer = ChatMessageSerializer(chat, many=True)
            return Response({'data':serializer.data},status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({'error':str(e)},status=status.HTTP_400_BAD_REQUEST)
        