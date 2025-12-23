from rest_framework import serializers
from .models import ChatMessage,UploadRecord

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id','role','content','timestemp']


class UploadSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    class Meta:
        model = UploadRecord
        fields = ['id','file','name','admin_name','uploaded_at']

    def get_admin_name(self,obj):
        user = obj.uploaded_by

        return user.username if user else None

