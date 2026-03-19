from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommodityViewSet, PriceHistoryViewSet

router = DefaultRouter()
router.register(r'commodities', CommodityViewSet, basename='commodity')
router.register(r'prices', PriceHistoryViewSet, basename='price-history')

urlpatterns = [
    path('', include(router.urls)),
]
