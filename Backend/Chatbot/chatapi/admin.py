from django.contrib import admin
from .models import KnowledgeBase,UploadRecord,ChatMessage
# from django.contrib.auth.models import User

# Register your models here.

@admin.register(KnowledgeBase)
class AdminKnowledgeBase(admin.ModelAdmin):
    list_display = ['id','question']


@admin.register(UploadRecord)
class AdminUpload(admin.ModelAdmin):
    list_display = ['id', 'file_name','uploaded_by','uploaded_at']

@admin.register(ChatMessage)
class AdminChatmessage(admin.ModelAdmin):
    list_display = ['id', 'user','role','short_content']

    def short_content(self, obj):
        obj = obj.content.split()
        short_txt = ''.join(obj[:20])
        if len(obj)>20:
            short_txt += '...'
        return short_txt

    short_content.short_description = "Content(first 20 words)" 