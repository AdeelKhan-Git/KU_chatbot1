from .views import ChatBotAPIView,UploadFileView,UploadedDataListView
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

urlpatterns = [
    path('chat/',ChatBotAPIView.as_view(), name = 'chatbotresponse'), 
    path('upload_file/',UploadFileView.as_view(), name = 'uploadfile'),
    path('file_records',UploadedDataListView.as_view(), name= 'record_list'), 
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),  
]