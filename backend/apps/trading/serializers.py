from rest_framework import serializers

from .models import Trade, TradePosition


class TradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade
        fields = [
            'id',
            'trade_id',
            'session',
            'trader',
            'commodity',
            'trade_type',
            'quantity',
            'unit_price',
            'counterparty_name',
            'counterparty_country',
            'total_value',
            'commission',
            'net_value',
            'trade_date',
            'settlement_date',
            'status',
            'notes',
            'documents',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['total_value', 'net_value', 'created_at', 'updated_at']


class TradePositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradePosition
        fields = [
            'id',
            'trader',
            'commodity',
            'long_quantity',
            'short_quantity',
            'average_long_price',
            'average_short_price',
            'current_market_price',
            'unrealized_pnl',
            'realized_pnl',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


# ============================================================================
# WAREHOUSE TRADING SERIALIZERS
# ============================================================================

class PurchaseCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = None  # Placeholder, will be imported
        fields = ['id', 'purchase', 'cost_type', 'description', 'amount']


class PurchaseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    supplier_name = serializers.CharField(source='supplier_party.party_name', read_only=True)
    commodity_code = serializers.CharField(source='commodity.code', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.warehouse_name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'purchase_id', 'purchase_date', 'supplier_party', 'supplier_name',
                  'commodity', 'commodity_code', 'warehouse', 'warehouse_name',
                  'quantity_mt', 'rate_per_mt', 'total_value', 'status', 'created_by_email']


class PurchaseDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested costs"""
    supplier_party_id = serializers.IntegerField(write_only=True)
    warehouse_id = serializers.IntegerField(write_only=True)
    commodity_id = serializers.IntegerField(write_only=True)
    broker_agent_party_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    cost_components = PurchaseCostSerializer(many=True, read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'purchase_id', 'purchase_date', 'supplier_party_id',
                  'warehouse_id', 'commodity_id',
                  'broker_agent_party_id',
                  'quantity_mt', 'rate_per_mt', 'total_value',
                  'landed_cost_per_mt', 'total_landed_cost',
                  'status', 'remarks', 'cost_components', 'created_by_email',
                  'created_at', 'updated_at']
        read_only_fields = ['total_value', 'total_landed_cost', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data['quantity_mt'] <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        if data['rate_per_mt'] <= 0:
            raise serializers.ValidationError("Rate must be greater than 0")
        return data


class LotMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'lot', 'movement_date', 'movement_type', 'quantity_mt', 
                  'reference_id', 'remarks']


class LotListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for lot list views"""
    commodity_code = serializers.CharField(source='commodity.code', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.warehouse_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier_party.party_name', read_only=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'lot_id', 'commodity', 'commodity_code', 'warehouse', 'warehouse_name',
                  'supplier_party', 'supplier_name', 'inward_date',
                  'original_quantity_mt', 'balance_quantity_mt', 'status']


class LotDetailSerializer(serializers.ModelSerializer):
    """Full serializer with movements"""
    movements = LotMovementSerializer(many=True, read_only=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'lot_id', 'purchase', 'commodity', 'warehouse', 'supplier_party',
                  'inward_date', 'original_quantity_mt', 'sold_quantity_mt', 'balance_quantity_mt',
                  'inward_rate_per_mt', 'landed_cost_per_mt', 'total_cost', 'cost_per_mt_current',
                  'status', 'remarks', 'movements', 'created_at', 'updated_at']
        read_only_fields = ['original_quantity_mt', 'sold_quantity_mt', 'balance_quantity_mt',
                          'total_cost', 'cost_per_mt_current', 'created_at', 'updated_at']


class SaleLotSerializer(serializers.ModelSerializer):
    """Sale allocation to specific lot"""
    lot_id_display = serializers.CharField(source='lot.lot_id', read_only=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'sale', 'lot', 'lot_id_display', 'quantity_taken_mt',
                  'lot_cost_per_mt', 'total_cost', 'sale_rate_per_mt', 'total_revenue', 'profit']
        read_only_fields = ['total_cost', 'total_revenue', 'profit']


class SaleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sale list views"""
    buyer_name = serializers.CharField(source='buyer_party.party_name', read_only=True)
    commodity_code = serializers.CharField(source='commodity.code', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.warehouse_name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'sale_id', 'sale_date', 'buyer_party', 'buyer_name',
                  'commodity', 'commodity_code', 'warehouse', 'warehouse_name',
                  'total_quantity_mt', 'sale_rate_per_mt', 'total_revenue', 'status', 'created_by_email']


class SaleDetailSerializer(serializers.ModelSerializer):
    """Full serializer with lot allocations"""
    buyer_party_id = serializers.IntegerField(write_only=True)
    warehouse_id = serializers.IntegerField(write_only=True)
    commodity_id = serializers.IntegerField(write_only=True)
    
    sale_lots = SaleLotSerializer(many=True, read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'sale_id', 'sale_date', 'buyer_party_id',
                  'warehouse_id', 'commodity_id',
                  'total_quantity_mt', 'sale_rate_per_mt', 'total_revenue',
                  'total_cost', 'gross_profit', 'status', 'remarks',
                  'sale_lots', 'created_by_email',
                  'created_at', 'updated_at']
        read_only_fields = ['total_quantity_mt', 'total_revenue', 'total_cost', 'gross_profit',
                          'created_at', 'updated_at']
    
    def validate(self, data):
        if data['sale_rate_per_mt'] <= 0:
            raise serializers.ValidationError("Sale rate must be greater than 0")
        return data


class BrokeragePayableListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for brokerage list"""
    broker_name = serializers.CharField(source='broker_party.party_name', read_only=True)
    purchase_id = serializers.CharField(source='purchase.purchase_id', read_only=True, allow_null=True)
    sale_id = serializers.CharField(source='sale.sale_id', read_only=True, allow_null=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'purchase_id', 'sale_id', 'broker_party', 'broker_name',
                  'total_quantity_mt', 'gross_amount', 'outstanding_amount', 'status']


class BrokeragePayableDetailSerializer(serializers.ModelSerializer):
    """Full serializer for brokerage"""
    broker_party_id = serializers.IntegerField(write_only=True)
    purchase_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    sale_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = None  # Placeholder
        fields = ['id', 'purchase_id', 'sale_id',
                  'broker_party_id', 'brokerage_type', 'brokerage_rate',
                  'total_quantity_mt', 'gross_amount', 'paid_amount', 'outstanding_amount',
                  'status', 'created_at', 'updated_at']
        read_only_fields = ['gross_amount', 'outstanding_amount', 'created_at', 'updated_at']
    
    def validate(self, data):
        if not data.get('purchase_id') and not data.get('sale_id'):
            raise serializers.ValidationError("Either purchase or sale must be specified")
        if data['brokerage_rate'] < 0:
            raise serializers.ValidationError("Brokerage rate cannot be negative")
        return data
