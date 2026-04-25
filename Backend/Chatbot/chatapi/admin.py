from django.contrib import admin
from .models import UploadRecord,ChatMessage

# Register your models here.

@admin.register(UploadRecord)
class AdminUpload(admin.ModelAdmin):
    list_display = ['id', 'name','status','total_chunks','processed_chunks','uploaded_by','uploaded_at']

@admin.register(ChatMessage)
class AdminChatmessage(admin.ModelAdmin):
    list_display = ['id', 'user','role','session_id','short_content']

    def short_content(self, obj):
        obj = obj.content.split()
        short_txt = ''.join(obj[:20])
        if len(obj)>20:
            short_txt += '...'
        return short_txt

    short_content.short_description = "Content(first 20 words)" 