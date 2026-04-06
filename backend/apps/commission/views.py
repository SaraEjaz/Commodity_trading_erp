from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Q
from django.core.exceptions import ValidationError
from .models import CommissionDeal, CommissionDealReceiver, CommissionLifting, CommissionAllocation
from .serializers import (
    CommissionDealSerializer, CommissionDealReceiverSerializer,
    CommissionLiftingSerializer, CommissionAllocationSerializer,
    CommissionDealCreateSerializer
)
from .services import CommissionEngine

# from rest_framework import viewsets, permissions, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django_filters.rest_framework import DjangoFilterBackend
# from rest_framework.filters import SearchFilter, OrderingFilter
# from django.db.models import Sum, Q
# from .models import CommissionDeal, CommissionDealReceiver, CommissionLifting, CommissionAllocation
# from .serializers import (
#     CommissionDealSerializer, CommissionDealReceiverSerializer,
#     CommissionLiftingSerializer, CommissionAllocationSerializer
# )
# from .services import CommissionEngine
# from apps.users.permissions import IsCommissionUser


# class CommissionDealViewSet(viewsets.ModelViewSet):
#     """CRUD for commission deals"""
#     queryset = CommissionDeal.objects.all()
#     serializer_class = CommissionDealSerializer
#     permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
#     filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
#     filterset_fields = ['status', 'seller_party', 'principal_buyer_party', 'commodity']
#     search_fields = ['deal_id', 'seller_party__party_name', 'principal_buyer_party__party_name']
#     ordering_fields = ['deal_date', 'deal_id', '-created_at']
#     ordering = ['-deal_date']
    
#     def perform_create(self, serializer):
#         """Set created_by and auto-calculate remaining quantity"""
#         instance = serializer.save(created_by=self.request.user)
#         instance.quantity_remaining_mt = instance.total_quantity_mt
#         instance.save()
    
#     @action(detail=True, methods=['get'])
#     def summary(self, request, pk=None):
#         """Get deal summary with statistics"""
#         deal = self.get_object()
#         try:
#             summary = CommissionEngine.get_deal_summary(deal.deal_id)
#             return Response(summary)
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
#     @action(detail=False, methods=['get'])
#     def open_deals(self, request):
#         """Get all open commission deals"""
#         deals = CommissionDeal.objects.filter(status__in=['open', 'partially_executed'])
#         serializer = self.get_serializer(deals, many=True)
#         return Response(serializer.data)


# class CommissionDealReceiverViewSet(viewsets.ModelViewSet):
#     """CRUD for deal receivers (multi-buyer support)"""
#     queryset = CommissionDealReceiver.objects.all()
#     serializer_class = CommissionDealReceiverSerializer
#     permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
#     filterset_fields = ['deal', 'receiver_party']
    
#     def perform_create(self, serializer):
#         """Auto-calculate remaining quantity"""
#         instance = serializer.save()
#         instance.remaining_quantity_mt = instance.expected_quantity_mt - instance.lifted_quantity_mt
#         instance.save()


# class CommissionLiftingViewSet(viewsets.ModelViewSet):
#     """CRUD for commission liftings (dispatch transactions)"""
#     queryset = CommissionLifting.objects.all()
#     serializer_class = CommissionLiftingSerializer
#     permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
#     filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
#     filterset_fields = ['deal', 'payment_status']
#     search_fields = ['lifting_id', 'vehicle_no']
#     ordering_fields = ['lifting_date', '-created_at']
#     ordering = ['-lifting_date']
    
#     def perform_create(self, serializer):
#         """Create lifting and post to commission ledger"""
#         instance = serializer.save(created_by=self.request.user)
        
#         # Auto-post to ledger
#         try:
#             CommissionEngine.post_lifting(instance.lifting_id)
#         except Exception as e:
#             # Log error but don't fail the creation
#             print(f"Error posting lifting {instance.lifting_id}: {str(e)}")
    
#     @action(detail=True, methods=['post'])
#     def post_to_ledger(self, request, pk=None):
#         """Manually post a lifting to the commission ledger"""
#         lifting = self.get_object()
#         try:
#             CommissionEngine.post_lifting(lifting.lifting_id)
#             return Response({'status': 'Lifting posted successfully'})
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
#     @action(detail=False, methods=['get'])
#     def today_liftings(self, request):
#         """Get all liftings for today"""
#         from datetime import date
#         liftings = CommissionLifting.objects.filter(lifting_date=date.today())
#         serializer = self.get_serializer(liftings, many=True)
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['get'])
#     def pending_liftings(self, request):
#         """Get all pending payment liftings"""
#         liftings = CommissionLifting.objects.filter(payment_status__in=['pending', 'partially_paid'])
#         serializer = self.get_serializer(liftings, many=True)
#         return Response(serializer.data)


# class CommissionAllocationViewSet(viewsets.ModelViewSet):
#     """CRUD for commission allocations (exceptional multiple buy/sell scenarios)"""
#     queryset = CommissionAllocation.objects.all()
#     serializer_class = CommissionAllocationSerializer
#     permission_classes = [permissions.IsAuthenticated, IsCommissionUser]
#     filter_backends = [DjangoFilterBackend]
#     filterset_fields = ['status', 'purchase_deal']
#     ordering_fields = ['created_at']
#     ordering = ['-created_at']

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.commission.models import (
    CommissionDeal, CommissionDealReceiver,
    CommissionLifting, CommissionAllocation
)
from .serializers import (
    CommissionDealSerializer, CommissionDealReceiverSerializer,
    CommissionLiftingSerializer, CommissionAllocationSerializer,
    CommissionDealCreateSerializer
)


class CommissionDealViewSet(viewsets.ModelViewSet):
    queryset = CommissionDeal.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'seller_party', 'principal_buyer_party', 'commodity']
    search_fields = ['deal_id', 'seller_party__party_name', 'principal_buyer_party__party_name']
    ordering_fields = ['deal_date', 'deal_id', '-created_at']
    ordering = ['-deal_date']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CommissionDealCreateSerializer
        return CommissionDealSerializer

    def get_queryset(self):
        qs = (
            CommissionDeal.objects
            .select_related('commodity', 'seller_party', 'principal_buyer_party')
            .order_by('-deal_date', '-id')
        )

        params = self.request.query_params
        search = params.get("search")
        status_value = params.get("status")
        commodity_id = params.get("commodity")
        seller_id = params.get("seller")
        buyer_id = params.get("buyer")
        date_from = params.get("date_from")
        date_to = params.get("date_to")

        if search:
            qs = qs.filter(
                Q(deal_id__icontains=search)
                | Q(seller_party__party_name__icontains=search)
                | Q(principal_buyer_party__party_name__icontains=search)
                | Q(commodity__name__icontains=search)
            )

        if status_value and status_value != "all":
            qs = qs.filter(status=status_value)

        if commodity_id:
            qs = qs.filter(commodity_id=commodity_id)

        if seller_id:
            qs = qs.filter(seller_party_id=seller_id)

        if buyer_id:
            qs = qs.filter(principal_buyer_party_id=buyer_id)

        if date_from:
            qs = qs.filter(deal_date__gte=date_from)

        if date_to:
            qs = qs.filter(deal_date__lte=date_to)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deal = serializer.save(created_by=request.user)
        # Return the read serializer data
        read_serializer = CommissionDealSerializer(deal)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        deal = self.get_object()
        serializer = self.get_serializer(deal, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return the read serializer data
        read_serializer = CommissionDealSerializer(deal)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        deal = self.get_object()

        if CommissionLifting.objects.filter(deal=deal).exists():
            raise ValidationError("This deal cannot be deleted because liftings already exist.")

        deal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a commission deal"""
        deal = self.get_object()
        if deal.status == 'closed':
            return Response({'error': 'Deal is already closed'}, status=status.HTTP_400_BAD_REQUEST)
        
        deal.status = 'closed'
        deal.save()
        serializer = self.get_serializer(deal)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a commission deal"""
        deal = self.get_object()
        if deal.quantity_lifted_mt > 0:
            return Response({'error': 'Cannot cancel deal with existing liftings'}, status=status.HTTP_400_BAD_REQUEST)
        
        deal.status = 'cancelled'
        deal.save()
        serializer = self.get_serializer(deal)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def deal_sheet(self, request, pk=None):
        """Get deal sheet with summary and receiver details"""
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
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['deal', 'receiver_party']
    search_fields = ['receiver_party__party_name']
    ordering_fields = ['receiver_party', 'created_at']
    ordering = ['receiver_party']
    
    def perform_create(self, serializer):
        """Auto-calculate remaining quantity"""
        instance = serializer.save()
        instance.remaining_quantity_mt = instance.expected_quantity_mt - instance.lifted_quantity_mt
        instance.save()


class CommissionLiftingViewSet(viewsets.ModelViewSet):
    """CRUD for commission liftings (dispatch transactions)"""
    queryset = CommissionLifting.objects.all()
    serializer_class = CommissionLiftingSerializer
    permission_classes = [permissions.IsAuthenticated]
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

    @action(detail=True, methods=['post'])
    def generate_invoice(self, request, pk=None):
        """Generate an invoice preview for a commission lifting"""
        lifting = self.get_object()
        party_type = request.data.get('party_type', 'buyer')
        if party_type not in ['buyer', 'seller']:
            return Response({'error': 'Invalid party_type'}, status=status.HTTP_400_BAD_REQUEST)

        invoice_date = request.data.get('invoice_date')
        if not invoice_date:
            return Response({'error': 'invoice_date is required'}, status=status.HTTP_400_BAD_REQUEST)

        gst_percentage = Decimal(str(request.data.get('gst_percentage', '18') or '18'))
        commission_amount = lifting.buyer_commission if party_type == 'buyer' else lifting.seller_commission
        gst_amount = (commission_amount * gst_percentage / Decimal('100')).quantize(Decimal('0.01'))
        net_amount = (commission_amount + gst_amount).quantize(Decimal('0.01'))
        invoice_number = f"INV-{lifting.lifting_id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        return Response({
            'invoice_number': invoice_number,
            'invoice_date': invoice_date,
            'dispatch_id': lifting.lifting_id,
            'deal_id': lifting.deal.deal_id,
            'party_type': party_type,
            'party_code': lifting.principal_buyer.party_code if party_type == 'buyer' else lifting.invoice_party.party_code,
            'party_name': lifting.principal_buyer.party_name if party_type == 'buyer' else lifting.invoice_party.party_name,
            'commodity': lifting.deal.commodity.name,
            'quantity': float(lifting.quantity_mt),
            'rate': float(lifting.deal.commercial_rate),
            'commission_amount': float(commission_amount),
            'gst_amount': float(gst_amount),
            'net_amount': float(net_amount),
            'status': 'generated',
            'remarks': request.data.get('remarks', ''),
        })

    @action(detail=False, methods=['get'])
    def today_liftings(self, request):
        """Get all liftings for today"""
        from datetime import date
        today = date.today()
        liftings = CommissionLifting.objects.filter(lifting_date=today)
        serializer = self.get_serializer(liftings, many=True)
        return Response(serializer.data)


class CommissionAllocationViewSet(viewsets.ModelViewSet):
    """CRUD for commission allocations (multiple buys → multiple sales)"""
    queryset = CommissionAllocation.objects.all()
    serializer_class = CommissionAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'purchase_deal']
    ordering_fields = ['created_at']
    ordering = ['-created_at']