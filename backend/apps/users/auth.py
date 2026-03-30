"""
Custom authentication views for JWT token with module access information
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status
from rest_framework.response import Response
from .serializers import UserSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom serializer to include user info and module access in token response"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['allowed_modules'] = user.get_allowed_modules()
        token['default_module'] = user.get_default_module()
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user details to response
        user = self.user
        user_serializer = UserSerializer(user)
        
        return {
            'access': data['access'],
            'refresh': data['refresh'],
            'user': user_serializer.data
        }


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view with module access information"""
    serializer_class = CustomTokenObtainPairSerializer
