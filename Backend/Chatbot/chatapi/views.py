import json
from rest_framework.views import APIView
from rest_framework import status,permissions
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from .models import KnowledgeBase,UploadRecord
from .utils import chatbot_response,sync_kb_to_chroma
from django.http import StreamingHttpResponse
from .pdf_scrapper import extract_pdf_content


# Create your views here.


class ChatBotAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        prompt = request.data.get('prompt')

        if not prompt:
            return Response({'error':'prompt is required'},status=status.HTTP_400_BAD_REQUEST)
        
       
        
        def event_stream():
            for token in chatbot_response(request.user, prompt):
                yield f"data: {token}\n\n"
            
        return StreamingHttpResponse(event_stream(),content_type = "text/event-stream")


class UploadFileView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes =[ MultiPartParser]

    def post(self,request):
        file = request.FILES.get('file')
        
        try:
            if not file:
                 return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST
            )

            if not file.name.lower().endswith(".pdf"):
                return Response(
                {"error": "Only PDF files are allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response({f'error':'provided file is not pdf format ---{e}'},status=status.HTTP_400_BAD_REQUEST)


        data = extract_pdf_content(file)
      
        try:
            inserted_count = 0
            skipped_count = 0

            for item in data:
                page = item.get('page')
                content =item.get('content','').strip()
                
                if not content:
                    skipped_count+=1
                    continue
                
                
                exists = KnowledgeBase.objects.filter(
                    file_name = file.name,
                    page=page
                    ).exists()
                
        
                if not exists:
                    KnowledgeBase.objects.create(file_name=file.name, page=page, content=content)
                    inserted_count += 1
                else:
                    skipped_count += 1

            UploadRecord.objects.create(
                    file_name=file.name,
                    uploaded_by=request.user,
                    inserted=inserted_count,
                    skipped=skipped_count
                )

            if inserted_count:
                sync_kb_to_chroma()
                print("vector db recreated")
                

            return Response({"message": "PDF uploaded, parsed, indexed  and Vector Score rebuild successfully",
                            "inserted":inserted_count,
                            "skipped":skipped_count},
                            status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error':str(e)},status=status.HTTP_400_BAD_REQUEST)
                    


class UploadedDataListView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        
        records = UploadRecord.objects.all().order_by('-uploaded_at')

        data = [{
            "file_name": r.file_name,
            "uploaded_by": r.uploaded_by.username ,
            "uploaded_at": r.uploaded_at,
            "inserted_count": r.inserted,
            "skipped_count": r.skipped 
        }for r in records]

        if not data:
            return Response({"message":[]}, status=status.HTTP_200_OK)

        return Response({'message':data}, status=status.HTTP_200_OK)
     

