from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CommissionLedgerViewSet, PartyLedgerViewSet, PaymentReceivedViewSet, PaymentMadeViewSet,
    PaymentAllocationViewSet, ThirdPartySettlementViewSet, CPREntryViewSet, JournalEntryViewSet
)
from .reports import AccountingReportViewSet

router = DefaultRouter()
router.register(r'commission-ledger', CommissionLedgerViewSet, basename='commission-ledger')
router.register(r'party-ledger', PartyLedgerViewSet, basename='party-ledger')
router.register(r'payments-received', PaymentReceivedViewSet, basename='payment-received')
router.register(r'payments-made', PaymentMadeViewSet, basename='payment-made')
router.register(r'payment-allocations', PaymentAllocationViewSet, basename='payment-allocation')
router.register(r'settlements', ThirdPartySettlementViewSet, basename='settlement')
router.register(r'cpr-entries', CPREntryViewSet, basename='cpr-entry')
router.register(r'journals', JournalEntryViewSet, basename='journal')
router.register(r'reports', AccountingReportViewSet, basename='accounting-report')

urlpatterns = [
    path('', include(router.urls)),
]
