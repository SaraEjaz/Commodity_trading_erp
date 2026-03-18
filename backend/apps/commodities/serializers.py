from rest_framework import serializers
from .models import Category, Commodity, PriceHistory, Supplier, SupplierCommodity


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']


class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = ['id', 'price', 'high_price', 'low_price', 'volume', 'timestamp']


class CommoditySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    latest_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Commodity
        fields = [
            'id', 'code', 'name', 'category', 'category_name', 'description',
            'unit', 'base_price', 'currency', 'grade', 'purity', 'is_active',
            'latest_price', 'created_at', 'updated_at'
        ]
    
    def get_latest_price(self, obj):
        latest = obj.price_history.first()
        return latest.price if latest else obj.base_price


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'address',
            'country', 'rating', 'is_active', 'created_at', 'updated_at'
        ]


class SupplierCommoditySerializer(serializers.ModelSerializer):
    commodity_name = serializers.CharField(source='commodity.name', read_only=True)
    commodity_code = serializers.CharField(source='commodity.code', read_only=True)
    
    class Meta:
        model = SupplierCommodity
        fields = [
            'id', 'supplier', 'commodity', 'commodity_name', 'commodity_code',
            'supplier_code', 'min_order_quantity', 'lead_time_days'
        ]
