from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction, models
from django.utils import timezone
from decimal import Decimal

from .models import Trade, TradePosition, Purchase, PurchaseCost, Lot, LotMovement, Sale, SaleLot, BrokeragePayable
from .serializers import (
    TradeSerializer, TradePositionSerializer,
    PurchaseListSerializer, PurchaseDetailSerializer, PurchaseCostSerializer,
    LotListSerializer, LotDetailSerializer, LotMovementSerializer,
    SaleListSerializer, SaleDetailSerializer, SaleLotSerializer,
    BrokeragePayableListSerializer, BrokeragePayableDetailSerializer
)
from apps.users.permissions import HasModuleAccess



class TradeViewSet(viewsets.ModelViewSet):
    queryset = Trade.objects.all()
    serializer_class = TradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trade.objects.filter(trader=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def active_trades(self, request):
        trades = Trade.objects.filter(
            trader=request.user,
            status__in=['pending', 'confirmed', 'on_hold'],
        )
        serializer = self.get_serializer(trades, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def close_trade(self, request, pk=None):
        trade = self.get_object()
        trade.status = 'cancelled'
        trade.save()
        return Response({'status': 'trade cancelled'})


class TradePositionViewSet(viewsets.ModelViewSet):
    queryset = TradePosition.objects.all()
    serializer_class = TradePositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TradePosition.objects.filter(trader=self.request.user).order_by('-created_at')


# ============================================================================
# WAREHOUSE TRADING VIEWSETS
# ============================================================================

class PurchaseViewSet(viewsets.ModelViewSet):
    """
    Purchase creates warehouse inventory lots
    """
    permission_classes = [permissions.IsAuthenticated, HasModuleAccess]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'supplier_party', 'commodity', 'warehouse']
    search_fields = ['purchase_id', 'supplier_party__party_name', 'commodity__code']
    ordering_fields = ['purchase_date', 'total_value', 'status']
    
    def get_queryset(self):
        return Purchase.objects.select_related(
            'supplier_party', 'commodity', 'warehouse', 'broker_agent_party', 'created_by'
        ).order_by('-purchase_date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'retrieve']:
            return PurchaseDetailSerializer
        return PurchaseListSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm_purchase(self, request, pk=None):
        """Confirm purchase and create lot"""
        purchase = self.get_object()
        if purchase.status != 'draft':
            return Response({'detail': 'Only draft purchases can be confirmed'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            purchase.status = 'confirmed'
            purchase.save()
            
            # Create lot from this purchase
            lot = Lot.objects.create(
                lot_id=f"LOT-{purchase.purchase_id}",
                purchase=purchase,
                commodity=purchase.commodity,
                warehouse=purchase.warehouse,
                supplier_party=purchase.supplier_party,
                original_quantity_mt=purchase.quantity_mt,
                balance_quantity_mt=purchase.quantity_mt,
                inward_rate_per_mt=purchase.rate_per_mt,
                landed_cost_per_mt=purchase.landed_cost_per_mt,
                total_cost=purchase.total_landed_cost,
                cost_per_mt_current=purchase.landed_cost_per_mt,
                status='active'
            )
            
            # Record inward movement
            LotMovement.objects.create(
                lot=lot,
                movement_date=purchase.purchase_date,
                movement_type='inward',
                quantity_mt=purchase.quantity_mt,
                reference_id=purchase.purchase_id
            )
        
        return Response({'status': 'Purchase confirmed, lot created'})
    
    @action(detail=False, methods=['get'])
    def open_purchases(self, request):
        """Get all open (not completed) purchases"""
        purchases = Purchase.objects.filter(
            status__in=['draft', 'confirmed', 'received']
        ).select_related('supplier_party', 'commodity', 'warehouse')
        serializer = self.get_serializer(purchases, many=True)
        return Response(serializer.data)


class PurchaseCostViewSet(viewsets.ModelViewSet):
    """Add costs to purchases (freight, insurance, etc.)"""
    queryset = PurchaseCost.objects.all()
    serializer_class = PurchaseCostSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['purchase', 'cost_type']
    
    def perform_create(self, serializer):
        purchase = serializer.validated_data['purchase']
        cost = serializer.save()
        
        # Update landed cost
        total_extra_costs = PurchaseCost.objects.filter(purchase=purchase).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')
        
        purchase.landed_cost_per_mt = purchase.rate_per_mt + (total_extra_costs / purchase.quantity_mt)
        purchase.total_landed_cost = purchase.quantity_mt * purchase.landed_cost_per_mt
        purchase.save()


class LotViewSet(viewsets.ModelViewSet):
    """
    Inventory lots - track warehouse stock with unique batches
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'commodity', 'warehouse', 'supplier_party']
    search_fields = ['lot_id', 'commodity__code', 'warehouse__warehouse_name']
    ordering_fields = ['inward_date', 'balance_quantity_mt']
    
    def get_queryset(self):
        return Lot.objects.select_related(
            'commodity', 'warehouse', 'supplier_party', 'purchase'
        ).order_by('-inward_date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'retrieve']:
            return LotDetailSerializer
        return LotListSerializer
    
    @action(detail=False, methods=['get'])
    def active_lots(self, request):
        """Get all lots with available stock"""
        lots = Lot.objects.filter(
            balance_quantity_mt__gt=0
        ).select_related('commodity', 'warehouse')
        serializer = self.get_serializer(lots, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def movements(self, request, pk=None):
        """Get all movements for a lot"""
        lot = self.get_object()
        movements = lot.movements.all().order_by('-movement_date')
        serializer = LotMovementSerializer(movements, many=True)
        return Response(serializer.data)


class SaleViewSet(viewsets.ModelViewSet):
    """
    Sales from warehouse - allocates stock from lots
    """
    permission_classes = [permissions.IsAuthenticated, HasModuleAccess]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'buyer_party', 'commodity', 'warehouse']
    search_fields = ['sale_id', 'buyer_party__party_name', 'commodity__code']
    ordering_fields = ['sale_date', 'total_revenue', 'status']
    
    def get_queryset(self):
        return Sale.objects.select_related(
            'buyer_party', 'commodity', 'warehouse', 'created_by'
        ).prefetch_related('sale_lots__lot').order_by('-sale_date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'retrieve']:
            return SaleDetailSerializer
        return SaleListSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def post_sale(self, request, pk=None):
        """Post sale and update lot balances"""
        sale = self.get_object()
        if sale.status != 'draft':
            return Response({'detail': 'Only draft sales can be posted'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        sale_lots = sale.sale_lots.all()
        if not sale_lots.exists():
            return Response({'detail': 'Sale must have at least one lot allocation'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Update each lot balance
            for sale_lot in sale_lots:
                lot = sale_lot.lot
                lot.sold_quantity_mt += sale_lot.quantity_taken_mt
                lot.balance_quantity_mt = lot.original_quantity_mt - lot.sold_quantity_mt
                
                # Update lot status
                if lot.balance_quantity_mt <= 0:
                    lot.status = 'fully_sold'
                else:
                    lot.status = 'partially_sold'
                lot.save()
                
                # Record outward movement
                LotMovement.objects.create(
                    lot=lot,
                    movement_date=sale.sale_date,
                    movement_type='outward',
                    quantity_mt=sale_lot.quantity_taken_mt,
                    reference_id=sale.sale_id
                )
            
            # Update sale totals and status
            sale_lots_data = sale.sale_lots.aggregate(
                total_qty=models.Sum('quantity_taken_mt'),
                total_revenue=models.Sum('total_revenue'),
                total_cost=models.Sum('total_cost')
            )
            
            sale.total_quantity_mt = sale_lots_data['total_qty'] or Decimal('0')
            sale.total_revenue = sale_lots_data['total_revenue'] or Decimal('0')
            sale.total_cost = sale_lots_data['total_cost'] or Decimal('0')
            sale.gross_profit = sale.total_revenue - sale.total_cost
            sale.status = 'delivered'
            sale.save()
        
        return Response({'status': 'Sale posted successfully'})
    
    @action(detail=False, methods=['get'])
    def sales_summary(self, request):
        """Get sales summary with profitability"""
        sales = Sale.objects.filter(status__in=['delivered', 'invoiced', 'completed'])
        
        total_qty = sales.aggregate(models.Sum('total_quantity_mt'))['total_quantity_mt__sum'] or Decimal('0')
        total_revenue = sales.aggregate(models.Sum('total_revenue'))['total_revenue__sum'] or Decimal('0')
        total_cost = sales.aggregate(models.Sum('total_cost'))['total_cost__sum'] or Decimal('0')
        
        return Response({
            'total_quantity_mt': total_qty,
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'gross_profit': total_revenue - total_cost,
            'profit_margin': (total_revenue - total_cost) / total_revenue * 100 if total_revenue > 0 else 0
        })


class SaleLotViewSet(viewsets.ModelViewSet):
    """Lot allocation within a sale"""
    queryset = SaleLot.objects.select_related('sale', 'lot')
    serializer_class = SaleLotSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sale', 'lot']
    
    def perform_create(self, serializer):
        sale_lot = serializer.save()
        
        # Update sale totals
        sale = sale_lot.sale
        sale_lots_data = sale.sale_lots.aggregate(
            total_qty=models.Sum('quantity_taken_mt'),
            total_revenue=models.Sum('total_revenue'),
            total_cost=models.Sum('total_cost')
        )
        
        sale.total_quantity_mt = sale_lots_data['total_qty'] or Decimal('0')
        sale.total_revenue = sale_lots_data['total_revenue'] or Decimal('0')
        sale.total_cost = sale_lots_data['total_cost'] or Decimal('0')
        sale.gross_profit = sale.total_revenue - sale.total_cost
        sale.save()


class BrokeragePayableViewSet(viewsets.ModelViewSet):
    """
    Broker commissions for purchases and sales
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'broker_party']
    search_fields = ['purchase__purchase_id', 'sale__sale_id', 'broker_party__party_name']
    ordering_fields = ['-created_at', 'gross_amount']
    
    def get_queryset(self):
        return BrokeragePayable.objects.select_related(
            'broker_party', 'purchase', 'sale'
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'retrieve']:
            return BrokeragePayableDetailSerializer
        return BrokeragePayableListSerializer
    
    @action(detail=False, methods=['get'])
    def outstanding_brokerage(self, request):
        """Get all outstanding brokerage payables"""
        payables = BrokeragePayable.objects.filter(
            status__in=['outstanding', 'partially_paid']
        ).select_related('broker_party')
        
        total = payables.aggregate(models.Sum('outstanding_amount'))['outstanding_amount__sum'] or Decimal('0')
        
        serializer = self.get_serializer(payables, many=True)
        return Response({
            'count': payables.count(),
            'total_outstanding': total,
            'details': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark brokerage as paid"""
        payable = self.get_object()
        payable.paid_amount = payable.gross_amount
        payable.outstanding_amount = Decimal('0')
        payable.status = 'paid'
        payable.save()
        
        return Response({'status': 'Brokerage marked as paid'})
