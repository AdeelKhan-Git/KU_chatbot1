import json
from rest_framework.views import APIView
from rest_framework import status,permissions
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from .models import KnowledgeBase,UploadRecord
from .utils import chatbot_response,sync_new_entries_to_vector_store
from django.http import StreamingHttpResponse


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

        if not file:
            return Response({'error':'no file uploaded'},status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = json.load(file)
            
            if not isinstance(data, list):
                return Response({'error':'Json must be a list of objects'}, status=status.HTTP_400_BAD_REQUEST)
            

            for i, item in enumerate(data):
                if not isinstance(item, dict):
                    return Response({'error':'Invalid not a JSON object.'},status=status.HTTP_400_BAD_REQUEST)

                if 'question' not in item or 'answer' not in item:
                    return Response({"error":"Missing 'question' or 'answer' in some items."},status=status.HTTP_400_BAD_REQUEST)

        except json.JSONDecodeError:
            return Response({'error':'provided file is not json format'},status=status.HTTP_400_BAD_REQUEST)


       
      
        try:
            inserted_count = 0
            skipped_count = 0
            for item in data:

                question = item.get('question','').strip()
                answer =item.get('answer','').strip()
                
                if not question and not answer:
                    continue
                
                
                exists = KnowledgeBase.objects.filter(
                    question__iexact=question,
                    answer__iexact = answer
                    ).exists()
                
        
                if not exists:
                    KnowledgeBase.objects.create(question=question, answer=answer)
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
                sync_new_entries_to_vector_store()
                print("vector db recreated")
                

            return Response({'message':"Data upload successfully and vector store rebuilt successfully",
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
     

