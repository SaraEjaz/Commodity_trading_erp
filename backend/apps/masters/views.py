from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .models import Party, Warehouse, BankAccount, CommissionRule
from .serializers import PartySerializer, WarehouseSerializer, BankAccountSerializer, CommissionRuleSerializer
from rest_framework.permissions import IsAuthenticated


class PartyViewSet(viewsets.ModelViewSet):
    """CRUD operations for parties (buyers, sellers, brokers, etc.)"""
    queryset = Party.objects.all()
    serializer_class = PartySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['party_type', 'business_line_tag', 'is_active', 'cpr_applicable']
    search_fields = ['party_code', 'party_name', 'email', 'ntn']
    ordering_fields = ['party_code', 'party_name', 'created_at']
    ordering = ['party_code']
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get parties filtered by type"""
        party_type = request.query_params.get('type')
        if not party_type:
            return Response({'error': 'type parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        parties = Party.objects.filter(party_type=party_type, is_active=True)
        serializer = self.get_serializer(parties, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def suppliers(self, request):
        """Get all suppliers"""
        suppliers = Party.objects.filter(party_type='supplier', is_active=True)
        serializer = self.get_serializer(suppliers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def buyers(self, request):
        """Get all buyers"""
        buyers = Party.objects.filter(party_type='buyer', is_active=True)
        serializer = self.get_serializer(buyers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def brokers(self, request):
        """Get all brokers"""
        brokers = Party.objects.filter(party_type='broker', is_active=True)
        serializer = self.get_serializer(brokers, many=True)
        return Response(serializer.data)


class WarehouseViewSet(viewsets.ModelViewSet):
    """CRUD operations for warehouses"""
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'manager']
    search_fields = ['warehouse_code', 'warehouse_name', 'city']
    ordering_fields = ['warehouse_code', 'created_at']
    ordering = ['warehouse_code']
    
    @action(detail=False, methods=['get'])
    def active_warehouses(self, request):
        """Get all active warehouses"""
        warehouses = Warehouse.objects.filter(is_active=True)
        serializer = self.get_serializer(warehouses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stock_summary(self, request, pk=None):
        """Get stock summary for a specific warehouse"""
        warehouse = self.get_object()
        # Will be populated when we add trading models
        return Response({
            'warehouse_id': warehouse.id,
            'warehouse_code': warehouse.warehouse_code,
            'total_capacity_mt': float(warehouse.total_capacity_mt),
            'current_stock_mt': float(warehouse.current_stock_mt),
            'occupancy_percentage': float((warehouse.current_stock_mt / warehouse.total_capacity_mt * 100) if warehouse.total_capacity_mt > 0 else 0),
            'available_capacity_mt': float(warehouse.total_capacity_mt - warehouse.current_stock_mt),
        })


class BankAccountViewSet(viewsets.ModelViewSet):
    """CRUD operations for bank/cash accounts"""
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['account_type', 'is_active', 'is_default']
    search_fields = ['account_code', 'account_name', 'account_number']
    ordering_fields = ['account_code', 'created_at']
    ordering = ['account_code']
    
    @action(detail=False, methods=['get'])
    def active_accounts(self, request):
        """Get all active accounts"""
        accounts = BankAccount.objects.filter(is_active=True)
        serializer = self.get_serializer(accounts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def default_account(self, request):
        """Get default payment account"""
        account = BankAccount.objects.filter(is_default=True, is_active=True).first()
        if not account:
            return Response({'error': 'No default account configured'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(account)
        return Response(serializer.data)


class CommissionRuleViewSet(viewsets.ModelViewSet):
    """CRUD operations for commission rules"""
    queryset = CommissionRule.objects.all()
    serializer_class = CommissionRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['party', 'commodity', 'commission_type', 'is_active']
    search_fields = ['rule_name']
    ordering_fields = ['valid_from', 'rule_name', 'created_at']
    ordering = ['-valid_from']
    
    @action(detail=False, methods=['get'])
    def active_rules(self, request):
        """Get currently active rules"""
        from datetime import date
        today = date.today()
        rules = CommissionRule.objects.filter(
            is_active=True,
            valid_from__lte=today
        ).filter(
            Q(valid_to__isnull=True) | Q(valid_to__gte=today)
        )
        serializer = self.get_serializer(rules, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def applicable_rules(self, request):
        """Get rules applicable for specific party and/or commodity"""
        from django.db.models import Q
        from datetime import date
        
        party_id = request.query_params.get('party_id')
        commodity_id = request.query_params.get('commodity_id')
        today = date.today()
        
        rules = CommissionRule.objects.filter(
            is_active=True,
            valid_from__lte=today
        ).filter(
            Q(valid_to__isnull=True) | Q(valid_to__gte=today)
        )
        
        if party_id:
            rules = rules.filter(Q(party_id=party_id) | Q(party__isnull=True))
        
        if commodity_id:
            rules = rules.filter(Q(commodity_id=commodity_id) | Q(commodity__isnull=True))
        
        serializer = self.get_serializer(rules, many=True)
        return Response(serializer.data)
