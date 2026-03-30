from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Q
from .models import CommissionDeal, CommissionDealReceiver, CommissionLifting, CommissionAllocation
from .serializers import (
    CommissionDealSerializer, CommissionDealReceiverSerializer,
    CommissionLiftingSerializer, CommissionAllocationSerializer
)
from .services import CommissionEngine
from apps.users.permissions import IsCommissionUser


class CommissionDealViewSet(viewsets.ModelViewSet):
    """CRUD for commission deals"""
    queryset = CommissionDeal.objects.all()
    serializer_class = CommissionDealSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'seller_party', 'principal_buyer_party', 'commodity']
    search_fields = ['deal_id', 'seller_party__party_name', 'principal_buyer_party__party_name']
    ordering_fields = ['deal_date', 'deal_id', '-created_at']
    ordering = ['-deal_date']
    
    def perform_create(self, serializer):
        """Set created_by and auto-calculate remaining quantity"""
        instance = serializer.save(created_by=self.request.user)
        instance.quantity_remaining_mt = instance.total_quantity_mt
        instance.save()
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get deal summary with statistics"""
        deal = self.get_object()
        try:
            summary = CommissionEngine.get_deal_summary(deal.deal_id)
            return Response(summary)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def open_deals(self, request):
        """Get all open commission deals"""
        deals = CommissionDeal.objects.filter(status__in=['open', 'partially_executed'])
        serializer = self.get_serializer(deals, many=True)
        return Response(serializer.data)


class CommissionDealReceiverViewSet(viewsets.ModelViewSet):
    """CRUD for deal receivers (multi-buyer support)"""
    queryset = CommissionDealReceiver.objects.all()
    serializer_class = CommissionDealReceiverSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
    filterset_fields = ['deal', 'receiver_party']
    
    def perform_create(self, serializer):
        """Auto-calculate remaining quantity"""
        instance = serializer.save()
        instance.remaining_quantity_mt = instance.expected_quantity_mt - instance.lifted_quantity_mt
        instance.save()


class CommissionLiftingViewSet(viewsets.ModelViewSet):
    """CRUD for commission liftings (dispatch transactions)"""
    queryset = CommissionLifting.objects.all()
    serializer_class = CommissionLiftingSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['deal', 'payment_status']
    search_fields = ['lifting_id', 'vehicle_no']
    ordering_fields = ['lifting_date', '-created_at']
    ordering = ['-lifting_date']
    
    def perform_create(self, serializer):
        """Create lifting and post to commission ledger"""
        instance = serializer.save(created_by=self.request.user)
        
        # Auto-post to ledger
        try:
            CommissionEngine.post_lifting(instance.lifting_id)
        except Exception as e:
            # Log error but don't fail the creation
            print(f"Error posting lifting {instance.lifting_id}: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def post_to_ledger(self, request, pk=None):
        """Manually post a lifting to the commission ledger"""
        lifting = self.get_object()
        try:
            CommissionEngine.post_lifting(lifting.lifting_id)
            return Response({'status': 'Lifting posted successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def today_liftings(self, request):
        """Get all liftings for today"""
        from datetime import date
        liftings = CommissionLifting.objects.filter(lifting_date=date.today())
        serializer = self.get_serializer(liftings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_liftings(self, request):
        """Get all pending payment liftings"""
        liftings = CommissionLifting.objects.filter(payment_status__in=['pending', 'partially_paid'])
        serializer = self.get_serializer(liftings, many=True)
        return Response(serializer.data)


class CommissionAllocationViewSet(viewsets.ModelViewSet):
    """CRUD for commission allocations (exceptional multiple buy/sell scenarios)"""
    queryset = CommissionAllocation.objects.all()
    serializer_class = CommissionAllocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'purchase_deal']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
