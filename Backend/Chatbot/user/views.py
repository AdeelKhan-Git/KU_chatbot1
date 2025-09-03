
from user.serializer import LoginSerializer, UserProfileSerializer,GoogleLoginSerializer
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions,status
from .models import User
from google.auth.transport import requests
from google.oauth2 import id_token
import os


# Create your views here.

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)

        google_token = serializer.validated_data['id_token']

        try:
            id_info = id_token.verify_oauth2_token(
                google_token, requests.Request(), os.getenv('VITE_GOOGLE_CLIENT_ID')
            )

            email = id_info.get('email')
            username = id_info.get('name')
            google_user_id = id_info.get('sub')
            

        except ValueError:
            return Response({"error": "Invalid Google token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            user = User.objects.get(email=email)
            created = False
        except User.DoesNotExist:
            user = User.objects.create_user(email=email,username=username,password = None)
            created= True

        token = User.generated_token(user)
       
        return Response({"token":token, "user":{"id":user.id,"username":user.username,"email":user.email,'role':'student'},"new_user":created},status=status.HTTP_201_CREATED)



class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.data.get('email')
        password = serializer.data.get('password')

        user = authenticate(email=email,password=password)


        if user is None:
            return Response({'message': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_superuser:
            return Response({'message':'You are not admin sorry'}, status=status.HTTP_401_UNAUTHORIZED)
        
        
        token=User.generated_token(user)
        
        return Response({'token':token,'user':{'id':user.id,'Username':user.username,'email':user.email,'role':'admin'}}, status=status.HTTP_200_OK)
        
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated,permissions.IsAdminUser]
    def get(self,request):
        user = request.user
        serializer = UserProfileSerializer(user)

        return Response({"data": serializer.data},status=status.HTTP_200_OK)