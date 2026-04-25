from django.db import models
from user.models import User
# Create your models here.

  

class UploadRecord(models.Model):
    STATUS_CHOICES = [
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    file = models.FileField(upload_to="pdfs/",null=True,blank=True)
    name = models.CharField(max_length=255,null=True,blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default='processing')
    total_chunks = models.IntegerField(default=0)
    processed_chunks = models.IntegerField(default=0)


    def __str__(self):

        return f'{self.name} - {self.uploaded_by} - {self.uploaded_at}'
    
class ChatMessage(models.Model):
    ROLE_CHOICES = [('user','User'),('assistant','Assistant')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    session_id = models.CharField(max_length=255, null= True, blank=True, db_index=True)
    content = models.TextField()
    timestemp = models.DateTimeField(auto_now_add=True)
        
