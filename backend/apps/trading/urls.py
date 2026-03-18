from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TradeViewSet, TradePositionViewSet

router = DefaultRouter()
router.register(r'trades', TradeViewSet, basename='trade')
router.register(r'positions', TradePositionViewSet, basename='trade-position')

urlpatterns = [
    path('', include(router.urls)),
]
