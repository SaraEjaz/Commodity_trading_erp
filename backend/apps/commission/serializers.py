# from rest_framework import serializers
# from .models import CommissionDeal, CommissionDealReceiver, CommissionLifting, CommissionAllocation
# from apps.masters.serializers import PartySerializer
# from apps.commodities.models import Commodity


# class CommissionDealReceiverSerializer(serializers.ModelSerializer):
#     receiver_party_details = PartySerializer(source='receiver_party', read_only=True)
#     invoice_party_details = PartySerializer(source='invoice_party', read_only=True)
    
#     class Meta:
#         model = CommissionDealReceiver
#         fields = [
#             'id', 'receiver_party', 'receiver_party_details',
#             'invoice_party', 'invoice_party_details',
#             'payment_responsibility_party',
#             'expected_quantity_mt', 'lifted_quantity_mt', 'remaining_quantity_mt',
#             'remarks'
#         ]


# class CommissionDealSerializer(serializers.ModelSerializer):
#     commodity_name = serializers.CharField(source='commodity.name', read_only=True)
#     seller_name = serializers.CharField(source='seller_party.party_name', read_only=True)
#     buyer_name = serializers.CharField(source='principal_buyer_party.party_name', read_only=True)
#     receivers = CommissionDealReceiverSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = CommissionDeal
#         fields = [
#             'id', 'deal_id', 'deal_date',
#             'commodity', 'commodity_name',
#             'total_quantity_mt', 'quantity_lifted_mt', 'quantity_remaining_mt', 'unit',
#             'delivery_period_from', 'delivery_period_to',
#             'commercial_rate',
#             'seller_party', 'seller_name', 'seller_rate_per_mt',
#             'principal_buyer_party', 'buyer_name', 'buyer_rate_per_mt',
#             'commission_applicable', 'commission_basis', 'commission_payer',
#             'buyer_side_commission_rate', 'seller_side_commission_rate',
#             'total_buyer_commission', 'total_seller_commission',
#             'commission_received', 'commission_outstanding',
#             'terms', 'status', 'remarks',
#             'receivers',
#             'created_at', 'updated_at'
#         ]
#         read_only_fields = [
#             'deal_id', 'deal_date', 'quantity_lifted_mt', 'quantity_remaining_mt',
#             'total_buyer_commission', 'total_seller_commission',
#             'commission_received', 'commission_outstanding',
#             'created_at', 'updated_at'
#         ]


# class CommissionLiftingSerializer(serializers.ModelSerializer):
#     deal_id = serializers.CharField(source='deal.deal_id', read_only=True)
#     principal_buyer_name = serializers.CharField(source='principal_buyer.party_name', read_only=True)
#     receiver_name = serializers.CharField(source='receiver_party.party_name', read_only=True)
#     invoice_party_name = serializers.CharField(source='invoice_party.party_name', read_only=True)
    
#     class Meta:
#         model = CommissionLifting
#         fields = [
#             'id', 'lifting_id', 'deal', 'deal_id', 'lifting_date',
#             'quantity_mt',
#             'principal_buyer', 'principal_buyer_name',
#             'receiver_party', 'receiver_name',
#             'invoice_party', 'invoice_party_name',
#             'payment_party',
#             'vehicle_no', 'weighbridge_reference',
#             'buyer_commission', 'seller_commission',
#             'payment_status', 'posting_reference',
#             'notes', 'created_at', 'updated_at'
#         ]
#         read_only_fields = [
#             'lifting_id', 'lifting_date', 'buyer_commission', 'seller_commission',
#             'created_at', 'updated_at'
#         ]


# class CommissionAllocationSerializer(serializers.ModelSerializer):
#     purchase_deal_id = serializers.CharField(source='purchase_deal.deal_id', read_only=True)
#     sales_deal_ids = serializers.StringRelatedField(source='sales_deals', many=True, read_only=True)
    
#     class Meta:
#         model = CommissionAllocation
#         fields = [
#             'id', 'purchase_deal', 'purchase_deal_id',
#             'sales_deals', 'sales_deal_ids',
#             'allocated_quantity_mt', 'executed_quantity_mt', 'remaining_quantity_mt',
#             'status', 'remarks', 'created_at'
#         ]
#         read_only_fields = ['remaining_quantity_mt', 'created_at']


from rest_framework import serializers
from .models import CommissionDeal, CommissionDealReceiver, CommissionLifting, CommissionAllocation
from apps.masters.serializers import PartySerializer
from apps.commodities.models import Commodity


class CommissionDealReceiverSerializer(serializers.ModelSerializer):
    receiver_party_details = PartySerializer(source='receiver_party', read_only=True)
    invoice_party_details = PartySerializer(source='invoice_party', read_only=True)
    
    class Meta:
        model = CommissionDealReceiver
        fields = [
            'id', 'receiver_party', 'receiver_party_details',
            'invoice_party', 'invoice_party_details',
            'payment_responsibility_party',
            'expected_quantity_mt', 'lifted_quantity_mt', 'remaining_quantity_mt',
            'remarks'
        ]


class CommissionDealSerializer(serializers.ModelSerializer):
    commodity_name = serializers.CharField(source='commodity.name', read_only=True)
    seller_name = serializers.CharField(source='seller_party.party_name', read_only=True)
    buyer_name = serializers.CharField(source='principal_buyer_party.party_name', read_only=True)
    receivers = CommissionDealReceiverSerializer(many=True, read_only=True)
    
    class Meta:
        model = CommissionDeal
        fields = [
            'id', 'deal_id', 'deal_date',
            'commodity', 'commodity_name',
            'total_quantity_mt', 'quantity_lifted_mt', 'quantity_remaining_mt', 'unit',
            'delivery_period_from', 'delivery_period_to',
            'commercial_rate',
            'seller_party', 'seller_name', 'seller_rate_per_mt',
            'principal_buyer_party', 'buyer_name', 'buyer_rate_per_mt',
            'commission_applicable', 'commission_basis', 'commission_payer',
            'buyer_side_commission_rate', 'seller_side_commission_rate',
            'total_buyer_commission', 'total_seller_commission',
            'commission_received', 'commission_outstanding',
            'terms', 'status', 'remarks',
            'receivers',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'deal_id', 'deal_date', 'quantity_lifted_mt', 'quantity_remaining_mt',
            'total_buyer_commission', 'total_seller_commission',
            'commission_received', 'commission_outstanding',
            'created_at', 'updated_at'
        ]


class CommissionLiftingSerializer(serializers.ModelSerializer):
    deal_id = serializers.CharField(source='deal.deal_id', read_only=True)
    principal_buyer_name = serializers.CharField(source='principal_buyer.party_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver_party.party_name', read_only=True)
    invoice_party_name = serializers.CharField(source='invoice_party.party_name', read_only=True)
    
    class Meta:
        model = CommissionLifting
        fields = [
            'id', 'lifting_id', 'deal', 'deal_id', 'lifting_date',
            'quantity_mt',
            'principal_buyer', 'principal_buyer_name',
            'receiver_party', 'receiver_name',
            'invoice_party', 'invoice_party_name',
            'payment_party',
            'vehicle_no', 'weighbridge_reference',
            'buyer_commission', 'seller_commission',
            'payment_status', 'posting_reference',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'lifting_id', 'lifting_date', 'buyer_commission', 'seller_commission',
            'created_at', 'updated_at'
        ]


class CommissionAllocationSerializer(serializers.ModelSerializer):
    purchase_deal_id = serializers.CharField(source='purchase_deal.deal_id', read_only=True)
    sales_deal_ids = serializers.StringRelatedField(source='sales_deals', many=True, read_only=True)
    
    class Meta:
        model = CommissionAllocation
        fields = [
            'id', 'purchase_deal', 'purchase_deal_id',
            'sales_deals', 'sales_deal_ids',
            'allocated_quantity_mt', 'executed_quantity_mt', 'remaining_quantity_mt',
            'status', 'remarks', 'created_at'
        ]
        read_only_fields = ['remaining_quantity_mt', 'created_at']
