from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
]
