# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import (
#     CommissionDealViewSet, CommissionDealReceiverViewSet,
#     CommissionLiftingViewSet, CommissionAllocationViewSet
# )
# from .reports import CommissionReportViewSet

# router = DefaultRouter()
# router.register(r'deals', CommissionDealViewSet, basename='commission-deal')
# router.register(r'deal-receivers', CommissionDealReceiverViewSet, basename='commission-deal-receiver')
# router.register(r'liftings', CommissionLiftingViewSet, basename='commission-lifting')
# router.register(r'allocations', CommissionAllocationViewSet, basename='commission-allocation')
# router.register(r'reports', CommissionReportViewSet, basename='commission-report')

# urlpatterns = [
#     path('', include(router.urls)),
# ]

from rest_framework.routers import DefaultRouter
from .views import CommissionDealViewSet

router = DefaultRouter()
router.register(r"deals", CommissionDealViewSet, basename="commission-deals")

urlpatterns = router.urls