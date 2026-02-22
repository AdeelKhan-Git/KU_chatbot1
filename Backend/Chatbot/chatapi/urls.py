from .views import ChatBotAPIView,UploadFileView,UploadedDataListView,GetChatDataView,UploadStatusView
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

urlpatterns = [
    path('chat/',ChatBotAPIView.as_view(), name = 'chatbotresponse'), 
    path('upload_file/',UploadFileView.as_view(), name = 'uploadfile'),
    path('upload_status/<int:pdf_id>/',UploadStatusView.as_view(), name = 'uploadstatus'),
    path('chat-data/',GetChatDataView.as_view(), name = 'chatdata'),
    path('file_records',UploadedDataListView.as_view(), name= 'record_list'), 
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),  
]