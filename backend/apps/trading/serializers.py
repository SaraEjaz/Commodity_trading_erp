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

