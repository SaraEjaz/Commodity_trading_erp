from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order',
            'commodity',
            'quantity_ordered',
            'quantity_received',
            'unit_price',
            'line_total',
            'grade',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['line_total', 'created_at', 'updated_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'order_type',
            'supplier',
            'customer',
            'created_by',
            'order_date',
            'required_date',
            'delivery_date',
            'subtotal',
            'tax_amount',
            'shipping_cost',
            'total_amount',
            'status',
            'notes',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['order_date', 'created_at', 'updated_at']

