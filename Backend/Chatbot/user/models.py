from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from rest_framework_simplejwt.tokens import RefreshToken
# Create your models here.

class UserManager(BaseUserManager):

    def create_user(self,email, password=None, **extra_fields):

        if not email:
            raise ValueError("Email should be provided!")
        
        user = self.model(
            email = self.normalize_email(email),**extra_fields
        )

        user.set_password(password)
        user.save(using =self._db)

        return user
    
    def create_superuser(self, email,password=None, **extra_fields):

        if not email:
            raise ValueError("Email should be provided!")
        
        user = self.create_user(
            email=email,
            password=password,
            **extra_fields
        )

        user.is_admin = True
        user.save(using = self._db)

        return user
    

class User(AbstractBaseUser):
    username = models.CharField(max_length = 200, null = True, blank = True)
    email = models.EmailField (max_length = 255,  unique = True)

    created_at  = models.DateTimeField(auto_now_add = True)
    updated_at = models.DateTimeField(auto_now = True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
      return self.email

    def has_perm(self, perm, obj=None):
     "Does the user have a specific permission?"
      # Simplest possible answer: Yes, always
     return self.is_admin

    def has_module_perms(self, app_label):
      "Does the user have permissions to view the app `app_label`?"
      # Simplest possible answer: Yes, always
      return True
    
    def is_superuser(self):
       return self.is_admin




    def generated_token(user):
        refresh = RefreshToken.for_user(user)      #token for every user 

        return {
            'refresh': str(refresh),
            'access' : str(refresh.access_token),
        } 
    
    @property
    def is_staff(self):
      "Is the user a member of staff?"
      # Simplest possible answer: All admins are staff
      return self.is_admin