from user.models import User
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(max_length = 150)
    password = serializers.CharField(max_length = 100)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField(write_only = True)