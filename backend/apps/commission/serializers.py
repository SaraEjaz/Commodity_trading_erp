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


class CommissionDealCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating deals with nested receivers"""
    receivers = CommissionDealReceiverSerializer(many=True, required=False)
    
    class Meta:
        model = CommissionDeal
        fields = [
            'commodity', 'total_quantity_mt', 'uof',
            'delivery_period_from', 'delivery_period_to',
            'commercial_rate', 'seller_party',
            'principal_buyer_party',
            'commission_applicable', 'commission_basis', 'commission_payer',
            'buyer_side_commission_rate', 'seller_side_commission_rate',
            'terms', 'remarks', 'receivers'
        ]
    
    def create(self, validated_data):
        receivers_data = validated_data.pop('receivers', [])
        # compute total_amount from commercial_rate and total_quantity_mt
        total_qty = validated_data.get('total_quantity_mt') or 0
        commercial_rate = validated_data.get('commercial_rate') or 0
        validated_data['total_amount'] = (commercial_rate * total_qty)
        deal = CommissionDeal.objects.create(**validated_data)
        
        # Auto-generate deal_id if not provided
        if not deal.deal_id:
            from datetime import datetime
            base_id = f"COMM-{datetime.now().strftime('%Y%m%d')}-"
            counter = 1
            while CommissionDeal.objects.filter(deal_id=f"{base_id}{counter:03d}").exists():
                counter += 1
            deal.deal_id = f"{base_id}{counter:03d}"
            deal.save()
        
        for receiver_data in receivers_data:
            CommissionDealReceiver.objects.create(deal=deal, **receiver_data)
        
        # Calculate remaining quantity
        deal.quantity_remaining_mt = deal.total_quantity_mt
        deal.save()
        
        return deal
    
    def update(self, instance, validated_data):
        receivers_data = validated_data.pop('receivers', [])
        
        # Update deal fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Recompute total_amount when commercial_rate/quantity change
        try:
            instance.total_amount = (instance.commercial_rate or 0) * (instance.total_quantity_mt or 0)
        except Exception:
            instance.total_amount = instance.total_amount or 0
        instance.save()
        
        # Handle receivers - for simplicity, delete all and recreate
        # In production, you might want more sophisticated update logic
        if receivers_data:
            instance.receivers.all().delete()  # Clear existing
            for receiver_data in receivers_data:
                CommissionDealReceiver.objects.create(deal=instance, **receiver_data)
        
        return instance

    def validate(self, data):
        # If receivers provided, ensure receiver total <= total_quantity
        receivers = data.get('receivers') or []
        if receivers:
            total_expected = sum([r.get('expected_quantity_mt', 0) for r in receivers])
            total_qty = data.get('total_quantity_mt') or 0
            if total_expected > total_qty:
                raise serializers.ValidationError('Sum of receiver expected quantities cannot exceed deal total quantity')
        return data


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
            'total_quantity_mt', 'quantity_lifted_mt', 'quantity_remaining_mt', 'uof', 'total_amount',
            'delivery_period_from', 'delivery_period_to',
            'commercial_rate',
            'seller_party', 'seller_name',
            'principal_buyer_party', 'buyer_name',
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
    principal_buyer_code = serializers.CharField(source='principal_buyer.party_code', read_only=True)
    receiver_name = serializers.CharField(source='receiver_party.party_name', read_only=True)
    receiver_party_code = serializers.CharField(source='receiver_party.party_code', read_only=True)
    invoice_party_name = serializers.CharField(source='invoice_party.party_name', read_only=True)
    invoice_party_code = serializers.CharField(source='invoice_party.party_code', read_only=True)
    payment_party_name = serializers.CharField(source='payment_party.party_name', read_only=True)
    payment_party_code = serializers.CharField(source='payment_party.party_code', read_only=True)
    
    class Meta:
        model = CommissionLifting
        fields = [
            'id', 'lifting_id', 'deal', 'deal_id', 'lifting_date',
            'quantity_mt',
            'principal_buyer', 'principal_buyer_name', 'principal_buyer_code',
            'receiver_party', 'receiver_name', 'receiver_party_code',
            'invoice_party', 'invoice_party_name', 'invoice_party_code',
            'payment_party', 'payment_party_name', 'payment_party_code',
            'vehicle_no', 'weighbridge_reference',
            'buyer_commission', 'seller_commission',
            'payment_status', 'posting_reference',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'lifting_id', 'lifting_date', 'buyer_commission', 'seller_commission',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        # Auto-generate lifting_id if not provided
        if 'lifting_id' not in validated_data or not validated_data['lifting_id']:
            # Generate unique lifting ID
            from datetime import datetime
            base_id = f"LIFT-{datetime.now().strftime('%Y%m%d')}-"
            counter = 1
            while CommissionLifting.objects.filter(lifting_id=f"{base_id}{counter:03d}").exists():
                counter += 1
            validated_data['lifting_id'] = f"{base_id}{counter:03d}"
        
        return super().create(validated_data)


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
