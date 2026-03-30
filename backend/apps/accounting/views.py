from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Q
from .models import (
    CommissionLedgerEntry, PartyLedgerEntry, PaymentReceived, PaymentMade,
    PaymentAllocation, ThirdPartySettlement, CPREntry, JournalEntry
)
from .serializers import (
    CommissionLedgerEntrySerializer, PartyLedgerEntrySerializer,
    PaymentReceivedSerializer, PaymentMadeSerializer, PaymentAllocationSerializer,
    ThirdPartySettlementSerializer, CPREntrySerializer, JournalEntrySerializer
)
from apps.users.permissions import IsAccountsUser


class CommissionLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """Commission ledger - read-only view of all commission balances"""
    queryset = CommissionLedgerEntry.objects.all()
    serializer_class = CommissionLedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsAccountsUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['party', 'side', 'payment_status', 'commission_deal']
    search_fields = ['party__party_code', 'ledger_entry_no']
    ordering_fields = ['posting_date', '-created_at']
    ordering = ['-posting_date']
    
    @action(detail=False, methods=['get'])
    def outstanding(self, request):
        """Get all outstanding commission entries"""
        entries = CommissionLedgerEntry.objects.filter(
            payment_status__in=['outstanding', 'partially_paid']
        )
        serializer = self.get_serializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def party_summary(self, request):
        """Summary of commission by party"""
        party_id = request.query_params.get('party_id')
        entries = CommissionLedgerEntry.objects.filter(party_id=party_id) if party_id else CommissionLedgerEntry.objects.all()
        
        summary = entries.values('party__party_code', 'side').annotate(
            total_gross=Sum('gross_commission'),
            total_received=Sum('received_amount'),
            total_outstanding=Sum('outstanding_amount')
        )
        return Response(summary)


class PartyLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """Running balance ledger for parties"""
    queryset = PartyLedgerEntry.objects.all()
    serializer_class = PartyLedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsAccountsUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['party', 'entry_type', 'business_line']
    search_fields = ['party__party_code', 'ledger_entry_no']
    ordering_fields = ['entry_date', '-created_at']
    ordering = ['-entry_date']
    
    @action(detail=False, methods=['get'])
    def party_balance(self, request):
        """Get running balance for a specific party"""
        party_id = request.query_params.get('party_id')
        if not party_id:
            return Response({'error': 'party_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        entries = PartyLedgerEntry.objects.filter(party_id=party_id).order_by('entry_date')
        serializer = self.get_serializer(entries, many=True)
        return Response(serializer.data)


class PaymentReceivedViewSet(viewsets.ModelViewSet):
    """CRUD for payments received from parties"""
    queryset = PaymentReceived.objects.all()
    serializer_class = PaymentReceivedSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccountsUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['party', 'payment_mode', 'status']
    search_fields = ['payment_ref', 'party__party_code', 'cheque_number']
    ordering_fields = ['payment_date', '-created_at']
    ordering = ['-payment_date']
    
    def perform_create(self, serializer):
        """Create payment and optionally post to ledger"""
        instance = serializer.save(created_by=self.request.user)
        # Auto-post to party ledger - optionally implement
    
    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        """Allocate payment to a deal/invoice"""
        payment = self.get_object()
        allocation_amount = request.data.get('amount')
        deal_id = request.data.get('commission_deal_id')
        
        if not allocation_amount or not deal_id:
            return Response({'error': 'amount and commission_deal_id required'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from apps.commission.models import CommissionDeal
            deal = CommissionDeal.objects.get(id=deal_id)
            
            PaymentAllocation.objects.create(
                payment_received=payment,
                commission_deal=deal,
                allocation_amount=allocation_amount
            )
            
            payment.status = 'allocated'
            payment.save()
            
            return Response({'status': 'Allocated successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentMadeViewSet(viewsets.ModelViewSet):
    """CRUD for payments made to parties"""
    queryset = PaymentMade.objects.all()
    serializer_class = PaymentMadeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccountsUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['party', 'payment_mode', 'status']
    search_fields = ['payment_ref', 'party__party_code', 'cheque_number']
    ordering_fields = ['payment_date', '-created_at']
    ordering = ['-payment_date']
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)


class PaymentAllocationViewSet(viewsets.ModelViewSet):
    """CRUD for payment allocations"""
    queryset = PaymentAllocation.objects.all()
    serializer_class = PaymentAllocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccountsUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['payment_received', 'payment_made', 'allocation_status']


class ThirdPartySettlementViewSet(viewsets.ModelViewSet):
    """CRUD for third-party settlements"""
    queryset = ThirdPartySettlement.objects.all()
    serializer_class = ThirdPartySettlementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccountsUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['original_party', 'third_party', 'status']
    search_fields = ['instruction_reference']
    ordering_fields = ['settlement_date', '-created_at']
    ordering = ['-settlement_date']
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)


class CPREntryViewSet(viewsets.ReadOnlyModelViewSet):
    """CPR/Withholding entries - read-only"""
    queryset = CPREntry.objects.all()
    serializer_class = CPREntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsAccountsUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['party', 'posted_to_authority']
    
    @action(detail=False, methods=['get'])
    def outstanding_cpr(self, request):
        """Get outstanding CPR amounts not yet submitted"""
        entries = CPREntry.objects.filter(posted_to_authority=False)
        serializer = self.get_serializer(entries, many=True)
        
        total = entries.aggregate(total=Sum('cpr_amount'))['total'] or 0
        
        return Response({
            'entries': serializer.data,
            'total_outstanding': total
        })


class JournalEntryViewSet(viewsets.ModelViewSet):
    """Journal entries for adjustments (admin only)"""
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['entry_type', 'is_approved']
    search_fields = ['journal_ref', 'reason']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a journal entry"""
        journal = self.get_object()
        if request.user.is_superuser or request.user.role == 'admin':
            journal.is_approved = True
            journal.approved_by = request.user
            from django.utils import timezone
            journal.approved_at = timezone.now()
            journal.save()
            return Response({'status': 'Approved'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
