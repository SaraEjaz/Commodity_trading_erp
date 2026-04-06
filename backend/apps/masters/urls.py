from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PartyViewSet, WarehouseViewSet, BankAccountViewSet, CommissionRuleViewSet
from .views import UnitOfMeasureViewSet

router = DefaultRouter()
router.register(r'parties', PartyViewSet, basename='party')
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'bank-accounts', BankAccountViewSet, basename='bank-account')
router.register(r'commission-rules', CommissionRuleViewSet, basename='commission-rule')
router.register(r'uofs', UnitOfMeasureViewSet, basename='uof')

urlpatterns = [
    path('', include(router.urls)),
]
