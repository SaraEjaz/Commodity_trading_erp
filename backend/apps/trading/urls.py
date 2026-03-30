from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TradeViewSet, TradePositionViewSet,
    PurchaseViewSet, PurchaseCostViewSet, LotViewSet, SaleViewSet, SaleLotViewSet, BrokeragePayableViewSet
)
from .reports import TradingReportViewSet

router = DefaultRouter()
# Existing trading routes
router.register(r'trades', TradeViewSet, basename='trade')
router.register(r'positions', TradePositionViewSet, basename='trade-position')

# Warehouse trading routes
router.register(r'purchases', PurchaseViewSet, basename='purchase')
router.register(r'purchase-costs', PurchaseCostViewSet, basename='purchase-cost')
router.register(r'lots', LotViewSet, basename='lot')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'sale-lots', SaleLotViewSet, basename='sale-lot')
router.register(r'brokerage', BrokeragePayableViewSet, basename='brokerage-payable')
router.register(r'reports', TradingReportViewSet, basename='trading-report')

urlpatterns = [
    path('', include(router.urls)),
]
