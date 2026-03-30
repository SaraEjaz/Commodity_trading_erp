from rest_framework import serializers
from .models import (
    CommissionLedgerEntry, PartyLedgerEntry, PaymentReceived, PaymentMade,
    PaymentAllocation, ThirdPartySettlement, CPREntry, JournalEntry
)
from apps.masters.serializers import PartySerializer


class CommissionLedgerEntrySerializer(serializers.ModelSerializer):
    party_details = PartySerializer(source='party', read_only=True)
    deal_id = serializers.CharField(source='commission_deal.deal_id', read_only=True)
    
    class Meta:
        model = CommissionLedgerEntry
        fields = [
            'id', 'ledger_entry_no', 'deal_id',
            'party', 'party_details',
            'side', 'commission_type',
            'gross_commission', 'cpr_amount', 'net_receivable',
            'received_amount', 'outstanding_amount',
            'payment_status', 'posting_date',
            'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['ledger_entry_no', 'net_receivable', 'created_at', 'updated_at']


class PartyLedgerEntrySerializer(serializers.ModelSerializer):
    party_details = PartySerializer(source='party', read_only=True)
    
    class Meta:
        model = PartyLedgerEntry
        fields = [
            'id', 'ledger_entry_no', 'entry_date',
            'party', 'party_details',
            'entry_type', 'business_line',
            'debit', 'credit', 'running_balance',
            'description', 'remarks',
            'created_at'
        ]
        read_only_fields = ['ledger_entry_no', 'entry_date', 'running_balance', 'created_at']


class PaymentReceivedSerializer(serializers.ModelSerializer):
    party_details = PartySerializer(source='party', read_only=True)
    
    class Meta:
        model = PaymentReceived
        fields = [
            'id', 'payment_ref', 'party', 'party_details',
            'payment_date', 'payment_mode',
            'bank_account',
            'gross_amount', 'cpr_amount', 'net_amount_received',
            'cheque_number', 'certificate_reference',
            'status', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['payment_ref', 'net_amount_received', 'created_at', 'updated_at']


class PaymentMadeSerializer(serializers.ModelSerializer):
    party_details = PartySerializer(source='party', read_only=True)
    
    class Meta:
        model = PaymentMade
        fields = [
            'id', 'payment_ref', 'party', 'party_details',
            'payment_date', 'payment_mode',
            'bank_account',
            'gross_amount', 'cpr_amount', 'net_amount_paid',
            'cheque_number',
            'status', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['payment_ref', 'net_amount_paid', 'created_at', 'updated_at']


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = [
            'id', 'payment_received', 'payment_made',
            'commission_deal', 'commission_ledger_entry', 'trading_sale',
            'allocation_amount', 'allocation_status',
            'remarks', 'created_at'
        ]
        read_only_fields = ['created_at']


class ThirdPartySettlementSerializer(serializers.ModelSerializer):
    original_party_details = PartySerializer(source='original_party', read_only=True)
    third_party_details = PartySerializer(source='third_party', read_only=True)
    
    class Meta:
        model = ThirdPartySettlement
        fields = [
            'id', 'original_party', 'original_party_details',
            'third_party', 'third_party_details',
            'settlement_date', 'settlement_reason', 'gross_amount',
            'instruction_reference', 'related_commission_deal',
            'status', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CPREntrySerializer(serializers.ModelSerializer):
    party_details = PartySerializer(source='party', read_only=True)
    
    class Meta:
        model = CPREntry
        fields = [
            'id', 'party', 'party_details',
            'cpr_amount', 'cpr_percentage',
            'certificate_number', 'posted_to_authority', 'posted_date',
            'created_at'
        ]
        read_only_fields = ['created_at']


class JournalEntrySerializer(serializers.ModelSerializer):
    debit_party_details = PartySerializer(source='debit_party', read_only=True)
    credit_party_details = PartySerializer(source='credit_party', read_only=True)
    approver_email = serializers.CharField(source='approved_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'journal_ref', 'entry_type',
            'debit_party', 'debit_party_details',
            'credit_party', 'credit_party_details',
            'amount', 'reason', 'remarks',
            'is_approved', 'approved_by', 'approver_email', 'approved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['journal_ref', 'created_at', 'updated_at']
