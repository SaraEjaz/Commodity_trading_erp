from rest_framework import serializers

from .models import Warehouse, InventoryLocation, Stock, StockMovement


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'id',
            'name',
            'location',
            'address',
            'capacity',
            'manager',
            'is_active',
            'created_at',
            'updated_at',
        ]


class InventoryLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryLocation
        fields = [
            'id',
            'warehouse',
            'code',
            'section',
            'aisle',
            'rack',
            'shelf',
            'capacity',
            'used_space',
        ]


class StockSerializer(serializers.ModelSerializer):
    unit_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        source='valuation.unit_cost',
        read_only=True,
        required=False,
    )
    total_value = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        source='valuation.total_value',
        read_only=True,
        required=False,
    )

    class Meta:
        model = Stock
        fields = [
            'id',
            'commodity',
            'warehouse',
            'location',
            'quantity_on_hand',
            'quantity_reserved',
            'quantity_available',
            'reorder_point',
            'reorder_quantity',
            'last_counted',
            'last_received',
            'last_issued',
            'updated_at',
            'unit_cost',
            'total_value',
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = [
            'id',
            'stock',
            'movement_type',
            'quantity',
            'reference_type',
            'reference_number',
            'from_location',
            'to_location',
            'notes',
            'created_by',
            'created_at',
        ]
