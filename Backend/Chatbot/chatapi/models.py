from django.db import models
from user.models import User
# Create your models here.

class KnowledgeBase(models.Model):
    file_name = models.CharField(max_length=250,null=True,blank=True)
    page = models.PositiveIntegerField(null=True,blank=True)
    content = models.TextField(null=True,blank=True)

    class Meta:
        unique_together = ('file_name','page')

    def __str__(self):
        return f"{self.file_name}  - Page {self.page}"
  

class UploadRecord(models.Model):
    file = models.FileField(upload_to="pdfs/",null=True,blank=True)
    name = models.CharField(max_length=255,null=True,blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):

        return f'{self.name} - {self.uploaded_by} - {self.uploaded_at}'
    
class ChatMessage(models.Model):
    ROLE_CHOICES = [('user','User'),('assistant','Assistant')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    timestemp = models.DateTimeField(auto_now_add=True)
    