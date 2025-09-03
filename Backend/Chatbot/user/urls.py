from user.views import LoginView,UserProfileView,GoogleLoginView
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

urlpatterns = [
    path('login/',LoginView.as_view(), name = 'login'),  
    path('profile/',UserProfileView.as_view(), name = 'profile'),  
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),  
    path('google/login/',GoogleLoginView.as_view(), name = 'google_login'),
]