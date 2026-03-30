"""
Report endpoints for Accounting module
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Q, F, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta

from .models import (
    CommissionLedgerEntry, PartyLedgerEntry, PaymentReceived, PaymentMade,
    ThirdPartySettlement, CPREntry
)
from apps.masters.models import Party


class AccountingReportViewSet(viewsets.ViewSet):
    """
    Accounting module reports
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def party_ledger_summary(self, request):
        """
        Summary ledger for each party showing balance
        """
        business_line = request.query_params.get('business_line')  # 'trading' or 'commission'
        
        party_ledger = PartyLedgerEntry.objects.all()
        if business_line:
            party_ledger = party_ledger.filter(business_line=business_line)
        
        party_balances = {}
        
        for entry in party_ledger.select_related('party'):
            party_key = entry.party.id
            
            if party_key not in party_balances:
                party_balances[party_key] = {
                    'party_code': entry.party.party_code,
                    'party_name': entry.party.party_name,
                    'party_type': entry.party.party_type,
                    'total_debit': Decimal('0'),
                    'total_credit': Decimal('0'),
                    'balance': Decimal('0'),
                    'transaction_count': 0
                }
            
            party_data = party_balances[party_key]
            party_data['total_debit'] += entry.debit_amount
            party_data['total_credit'] += entry.credit_amount
            party_data['balance'] = party_data['total_debit'] - party_data['total_credit']
            party_data['transaction_count'] += 1
        
        return Response({
            'report_date': timezone.now(),
            'business_line_filter': business_line,
            'total_parties': len(party_balances),
            'party_ledgers': list(party_balances.values())
        })
    
    @action(detail=False, methods=['get'])
    def party_detail_ledger(self, request):
        """
        Detailed ledger for a specific party
        """
        party_id = request.query_params.get('party_id')
        if not party_id:
            return Response({'error': 'party_id is required'}, status=400)
        
        entries = PartyLedgerEntry.objects.filter(
            party_id=party_id
        ).order_by('posting_date').select_related('party')
        
        if not entries.exists():
            return Response({'error': 'No ledger entries found'}, status=404)
        
        party = entries.first().party
        
        ledger_lines = []
        running_balance = Decimal('0')
        
        for entry in entries:
            running_balance += entry.debit_amount - entry.credit_amount
            
            ledger_lines.append({
                'posting_date': entry.posting_date,
                'transaction_type': entry.transaction_type,
                'document_reference': entry.document_reference,
                'debit': entry.debit_amount,
                'credit': entry.credit_amount,
                'balance': running_balance,
                'remarks': entry.remarks
            })
        
        summary = entries.aggregate(
            total_debit=Sum('debit_amount'),
            total_credit=Sum('credit_amount')
        )
        
        return Response({
            'party': {
                'party_code': party.party_code,
                'party_name': party.party_name,
                'party_type': party.party_type
            },
            'summary': {
                'total_debit': summary['total_debit'] or Decimal('0'),
                'total_credit': summary['total_credit'] or Decimal('0'),
                'balance': (summary['total_debit'] or Decimal('0')) - (summary['total_credit'] or Decimal('0'))
            },
            'ledger_lines': ledger_lines
        })
    
    @action(detail=False, methods=['get'])
    def payment_received_summary(self, request):
        """
        Summary of payments received
        """
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date() - timedelta(days=30)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        payments = PaymentReceived.objects.filter(
            payment_date__gte=start_date,
            payment_date__lte=end_date
        ).select_related('original_party')
        
        party_summary = {}
        total_gross = Decimal('0')
        total_cpr = Decimal('0')
        total_net = Decimal('0')
        
        for payment in payments:
            party_key = payment.original_party.party_code
            
            if party_key not in party_summary:
                party_summary[party_key] = {
                    'party_name': payment.original_party.party_name,
                    'gross_amount': Decimal('0'),
                    'cpr_deducted': Decimal('0'),
                    'net_received': Decimal('0'),
                    'payment_count': 0
                }
            
            party_data = party_summary[party_key]
            party_data['gross_amount'] += payment.gross_amount
            party_data['cpr_deducted'] += payment.cpr_amount
            party_data['net_received'] += payment.net_amount_received
            party_data['payment_count'] += 1
            
            total_gross += payment.gross_amount
            total_cpr += payment.cpr_amount
            total_net += payment.net_amount_received
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'total_payments': payments.count(),
            'summary': {
                'total_gross': total_gross,
                'total_cpr_deducted': total_cpr,
                'total_net_received': total_net
            },
            'by_party': list(party_summary.values())
        })
    
    @action(detail=False, methods=['get'])
    def payment_made_summary(self, request):
        """
        Summary of payments made
        """
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date() - timedelta(days=30)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        payments = PaymentMade.objects.filter(
            payment_date__gte=start_date,
            payment_date__lte=end_date
        ).select_related('party')
        
        party_summary = {}
        total_gross = Decimal('0')
        total_net = Decimal('0')
        
        for payment in payments:
            party_key = payment.party.party_code
            
            if party_key not in party_summary:
                party_summary[party_key] = {
                    'party_name': payment.party.party_name,
                    'gross_amount': Decimal('0'),
                    'cpr_deducted': Decimal('0'),
                    'net_paid': Decimal('0'),
                    'payment_count': 0
                }
            
            party_data = party_summary[party_key]
            party_data['gross_amount'] += payment.gross_amount
            party_data['cpr_deducted'] += payment.cpr_amount
            party_data['net_paid'] += payment.net_amount_paid
            party_data['payment_count'] += 1
            
            total_gross += payment.gross_amount
            total_net += payment.net_amount_paid
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'total_payments': payments.count(),
            'summary': {
                'total_gross': total_gross,
                'total_net_paid': total_net
            },
            'by_party': list(party_summary.values())
        })
    
    @action(detail=False, methods=['get'])
    def cpr_withholding_summary(self, request):
        """
        CPR (Withholding Tax) summary
        """
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date() - timedelta(days=30)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        cpr_entries = CPREntry.objects.filter(
            posting_date__gte=start_date,
            posting_date__lte=end_date
        ).select_related('party')
        
        party_summary = {}
        total_gross = Decimal('0')
        total_cpr = Decimal('0')
        
        for cpr in cpr_entries:
            party_key = cpr.party.party_code
            
            if party_key not in party_summary:
                party_summary[party_key] = {
                    'party_name': cpr.party.party_name,
                    'gross_amount': Decimal('0'),
                    'cpr_amount': Decimal('0'),
                    'cpr_percentage': Decimal('0'),
                    'entry_count': 0
                }
            
            party_data = party_summary[party_key]
            party_data['gross_amount'] += cpr.gross_amount
            party_data['cpr_amount'] += cpr.cpr_amount
            party_data['entry_count'] += 1
            
            if cpr.gross_amount > 0:
                party_data['cpr_percentage'] = (cpr.cpr_amount / cpr.gross_amount) * 100
            
            total_gross += cpr.gross_amount
            total_cpr += cpr.cpr_amount
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'total_gross_amount': total_gross,
            'total_cpr_withheld': total_cpr,
            'average_cpr_rate': (total_cpr / total_gross * 100) if total_gross > 0 else Decimal('0'),
            'by_party': list(party_summary.values())
        })
    
    @action(detail=False, methods=['get'])
    def cash_position(self, request):
        """
        Current cash position summary
        """
        # Total received
        total_received = PaymentReceived.objects.aggregate(
            total=Sum('net_amount_received')
        )['total'] or Decimal('0')
        
        # Total paid
        total_paid = PaymentMade.objects.aggregate(
            total=Sum('net_amount_paid')
        )['total'] or Decimal('0')
        
        # Outstanding receivables
        outstanding_receivables = CommissionLedgerEntry.objects.filter(
            payment_status__in=['outstanding', 'partial']
        ).aggregate(
            total=Sum('outstanding_amount')
        )['total'] or Decimal('0')
        
        # Outstanding payables
        outstanding_payables = CommissionLedgerEntry.objects.filter(
            payment_status__in=['outstanding', 'partial']
        ).aggregate(
            total=Sum('outstanding_amount')
        )['total'] or Decimal('0')
        
        net_cash = total_received - total_paid
        
        return Response({
            'report_date': timezone.now(),
            'cash_summary': {
                'total_received': total_received,
                'total_paid': total_paid,
                'net_cash_flow': net_cash
            },
            'outstanding_items': {
                'outstanding_receivables': outstanding_receivables,
                'outstanding_payables': outstanding_payables,
                'net_working_capital': outstanding_receivables - outstanding_payables
            }
        })
