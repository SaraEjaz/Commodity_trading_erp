from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommodityViewSet, CommodityPriceViewSet

router = DefaultRouter()
router.register(r'commodities', CommodityViewSet, basename='commodity')
router.register(r'prices', CommodityPriceViewSet, basename='commodity-price')

urlpatterns = [
    path('', include(router.urls)),
]
