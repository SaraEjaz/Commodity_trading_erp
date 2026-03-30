from rest_framework import serializers
from .models import Party, Warehouse, BankAccount, CommissionRule
from apps.commodities.models import Commodity


class PartySerializer(serializers.ModelSerializer):
    party_type_display = serializers.CharField(source='get_party_type_display', read_only=True)
    business_line_display = serializers.CharField(source='get_business_line_tag_display', read_only=True)
    default_bank_account_details = serializers.StringRelatedField(source='default_bank_account', read_only=True)
    
    class Meta:
        model = Party
        fields = [
            'id', 'party_code', 'party_name', 'party_type', 'party_type_display',
            'business_line_tag', 'business_line_display',
            'contact_person', 'mobile', 'email', 'phone',
            'address', 'city', 'country',
            'ntn', 'strn',
            'cpr_applicable', 'cpr_percentage',
            'payment_terms', 'credit_limit',
            'default_bank_account', 'default_bank_account_details',
            'is_active', 'opening_balance', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class WarehouseSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    occupancy_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Warehouse
        fields = [
            'id', 'warehouse_code', 'warehouse_name', 'location', 'address', 'city',
            'manager', 'manager_name',
            'total_capacity_mt', 'current_stock_mt', 'occupancy_percentage',
            'is_active', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'current_stock_mt', 'occupancy_percentage']
    
    def get_occupancy_percentage(self, obj):
        if obj.total_capacity_mt == 0:
            return 0
        return float((obj.current_stock_mt / obj.total_capacity_mt) * 100)


class BankAccountSerializer(serializers.ModelSerializer):
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    
    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_code', 'account_name', 'account_type', 'account_type_display',
            'bank_name', 'account_number', 'iban', 'swift_code', 'branch',
            'opening_balance', 'current_balance',
            'is_active', 'is_default', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CommissionRuleSerializer(serializers.ModelSerializer):
    party_name = serializers.CharField(source='party.party_name', read_only=True)
    commodity_name = serializers.CharField(source='commodity.name', read_only=True)
    commission_type_display = serializers.CharField(source='get_commission_type_display', read_only=True)
    payer_type_display = serializers.CharField(source='get_payer_type_display', read_only=True)
    is_valid_today = serializers.SerializerMethodField()
    
    class Meta:
        model = CommissionRule
        fields = [
            'id', 'rule_name',
            'party', 'party_name',
            'commodity', 'commodity_name',
            'valid_from', 'valid_to', 'is_valid_today',
            'commission_type', 'commission_type_display',
            'rate_or_amount',
            'payer_type', 'payer_type_display',
            'is_active', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_valid_today']
    
    def get_is_valid_today(self, obj):
        return obj.is_valid_today()
