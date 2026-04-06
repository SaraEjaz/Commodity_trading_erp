"""
Report endpoints for Commission module
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, F, DecimalField, Q, When, Case
from django.db.models.functions import Coalesce
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta

from apps.commission.models import CommissionDeal, CommissionLifting
from apps.accounting.models import CommissionLedgerEntry
from apps.masters.models import Party


class CommissionReportViewSet(viewsets.ViewSet):
    """
    Commission reports and analytics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        """Get dashboard summary data"""
        # Deals in progress
        deals_in_progress = CommissionDeal.objects.filter(
            status__in=['open', 'partially_executed']
        ).count()
        
        # Quantity pending
        quantity_pending = CommissionDeal.objects.filter(
            status__in=['open', 'partially_executed']
        ).aggregate(
            total_pending=Coalesce(Sum('quantity_remaining_mt'), Decimal('0'))
        )['total_pending'] or Decimal('0')
        
        # Recent dispatches (last 7 days)
        week_ago = timezone.now().date() - timedelta(days=7)
        recent_dispatches = CommissionLifting.objects.filter(
            lifting_date__gte=week_ago
        ).count()
        
        # Commission totals
        commission_totals = CommissionLedgerEntry.objects.aggregate(
            earned_total=Coalesce(Sum('gross_commission'), Decimal('0')),
            received_total=Coalesce(Sum('received_amount'), Decimal('0')),
            pending_total=Coalesce(Sum('outstanding_amount'), Decimal('0')),
        )
        
        # Unpaid shipments
        unpaid_shipments = CommissionLifting.objects.filter(
            payment_status__in=['pending', 'partially_paid']
        ).count()
        
        # Third party recoverable and CPR
        third_party_recoverable = CommissionLedgerEntry.objects.filter(
            payment_status__in=['outstanding', 'partially_paid']
        ).exclude(
            party=F('commission_deal__principal_buyer_party')
        ).exclude(
            party=F('commission_deal__seller_party')
        ).aggregate(
            total=Coalesce(Sum('outstanding_amount'), Decimal('0'))
        )['total'] or Decimal('0')
        
        cpr_total = CommissionLedgerEntry.objects.aggregate(
            total_cpr=Coalesce(Sum('cpr_amount'), Decimal('0'))
        )['total_cpr'] or Decimal('0')
        
        return Response({
            'deals_in_progress_count': deals_in_progress,
            'quantity_pending_mt': float(quantity_pending),
            'recent_dispatches_count': recent_dispatches,
            'commission_earned_total': float(commission_totals['earned_total']),
            'commission_received_total': float(commission_totals['received_total']),
            'commission_pending_total': float(commission_totals['pending_total']),
            'unpaid_shipments_count': unpaid_shipments,
            'third_party_recoverable_total': float(third_party_recoverable),
            'cpr_total': float(cpr_total),
        })
    
    @action(detail=False, methods=['get'])
    def deal_balance_report(self, request):
        """
        Get balance of all commission deals
        Shows open deals with lifted quantities and outstanding commission
        """
        deals = CommissionDeal.objects.filter(
            status__in=['open', 'partially_executed']
        ).annotate(
            total_liftings=Count('commissionlifting__id'),
            commission_received_total=Coalesce(Sum('commissionlifting__commission_received'), Decimal('0'))
        )
        
        report_data = []
        for deal in deals:
            outstanding_commission = (deal.total_buyer_commission + deal.total_seller_commission) - deal.commission_received
            
            report_data.append({
                'deal_id': deal.deal_id,
                'commodity': deal.commodity.code,
                'total_quantity_mt': deal.total_quantity_mt,
                'quantity_lifted_mt': deal.quantity_lifted_mt,
                'quantity_remaining_mt': deal.quantity_remaining_mt,
                'seller_name': deal.seller_party.party_name,
                'principal_buyer': deal.principal_buyer_party.party_name,
                'total_commission': deal.total_buyer_commission + deal.total_seller_commission,
                'commission_received': deal.commission_received,
                'outstanding_commission': outstanding_commission,
                'no_of_liftings': deal.total_liftings,
                'status': deal.status
            })
        
        total_deals = len(report_data)
        total_commission = sum(d['total_commission'] for d in report_data)
        total_outstanding = sum(d['outstanding_commission'] for d in report_data)
        
        return Response({
            'report_date': timezone.now(),
            'total_deals': total_deals,
            'total_commission': total_commission,
            'commission_received': total_commission - total_outstanding,
            'outstanding_commission': total_outstanding,
            'details': report_data
        })
    
    @action(detail=False, methods=['get'])
    def buyer_commission_statement(self, request):
        """
        Buyer-wise commission statement
        Shows commission liability/receivable for each buyer
        """
        buyer_id = request.query_params.get('buyer_id')
        
        deals = CommissionDeal.objects.filter(
            principal_buyer_party__id=buyer_id if buyer_id else None
        ).distinct() if buyer_id else CommissionDeal.objects.all()
        
        buyer_comm_data = {}
        
        for deal in deals:
            buyer_party = deal.principal_buyer_party
            
            if buyer_party.id not in buyer_comm_data:
                buyer_comm_data[buyer_party.id] = {
                    'buyer_name': buyer_party.party_name,
                    'buyer_code': buyer_party.party_code,
                    'total_deals': 0,
                    'total_commission': Decimal('0'),
                    'commission_paid': Decimal('0'),
                    'outstanding': Decimal('0'),
                    'deals': []
                }
            
            buyer_data = buyer_comm_data[buyer_party.id]
            buyer_data['total_deals'] += 1
            buyer_data['total_commission'] += deal.total_buyer_commission
            buyer_data['commission_paid'] += deal.commission_received
            buyer_data['outstanding'] += (deal.total_buyer_commission - deal.commission_received)
            
            buyer_data['deals'].append({
                'deal_id': deal.deal_id,
                'commodity': deal.commodity.code,
                'quantity': deal.total_quantity_mt,
                'commission': deal.total_buyer_commission,
                'paid': deal.commission_received,
                'outstanding': deal.total_buyer_commission - deal.commission_received
            })
        
        return Response({
            'report_date': timezone.now(),
            'buyers': list(buyer_comm_data.values())
        })
    
    @action(detail=False, methods=['get'])
    def seller_commission_statement(self, request):
        """
        Seller-wise commission statement
        """
        seller_id = request.query_params.get('seller_id')
        
        deals = CommissionDeal.objects.filter(
            seller_party__id=seller_id if seller_id else None
        ).distinct() if seller_id else CommissionDeal.objects.all()
        
        seller_comm_data = {}
        
        for deal in deals:
            seller_party = deal.seller_party
            
            if seller_party.id not in seller_comm_data:
                seller_comm_data[seller_party.id] = {
                    'seller_name': seller_party.party_name,
                    'seller_code': seller_party.party_code,
                    'total_deals': 0,
                    'total_commission': Decimal('0'),
                    'commission_paid': Decimal('0'),
                    'outstanding': Decimal('0'),
                    'deals': []
                }
            
            seller_data = seller_comm_data[seller_party.id]
            seller_data['total_deals'] += 1
            seller_data['total_commission'] += deal.total_seller_commission
            seller_data['commission_paid'] += deal.commission_received
            seller_data['outstanding'] += (deal.total_seller_commission - deal.commission_received)
            
            seller_data['deals'].append({
                'deal_id': deal.deal_id,
                'commodity': deal.commodity.code,
                'quantity': deal.total_quantity_mt,
                'commission': deal.total_seller_commission,
                'paid': deal.commission_received,
                'outstanding': deal.total_seller_commission - deal.commission_received
            })
        
        return Response({
            'report_date': timezone.now(),
            'sellers': list(seller_comm_data.values())
        })
    
    @action(detail=False, methods=['get'])
    def commission_ledger_summary(self, request):
        """
        Commission ledger summary by party and status
        """
        ledger_entries = CommissionLedgerEntry.objects.all()
        
        summary = {
            'by_party': {},
            'by_status': {},
            'by_side': {}
        }
        
        for entry in ledger_entries:
            party_key = entry.party.party_code
            
            # By party
            if party_key not in summary['by_party']:
                summary['by_party'][party_key] = {
                    'party_name': entry.party.party_name,
                    'gross_commission': Decimal('0'),
                    'cpr_deducted': Decimal('0'),
                    'net_receivable': Decimal('0'),
                    'received': Decimal('0'),
                    'outstanding': Decimal('0')
                }
            
            party_data = summary['by_party'][party_key]
            party_data['gross_commission'] += entry.gross_commission
            party_data['cpr_deducted'] += entry.cpr_amount
            party_data['net_receivable'] += entry.net_receivable
            party_data['received'] += entry.received_amount
            party_data['outstanding'] += entry.outstanding_amount
            
            # By status
            status_key = entry.payment_status
            if status_key not in summary['by_status']:
                summary['by_status'][status_key] = Decimal('0')
            summary['by_status'][status_key] += entry.outstanding_amount
            
            # By side
            side_key = f"{entry.side}_side"
            if side_key not in summary['by_side']:
                summary['by_side'][side_key] = Decimal('0')
            summary['by_side'][side_key] += entry.outstanding_amount
        
        return Response({
            'report_date': timezone.now(),
            'summary': summary
        })
    
    @action(detail=False, methods=['get'])
    def daily_liftings_report(self, request):
        """Get liftings for a specific date (or today)"""
        date_str = request.query_params.get('date')
        if date_str:
            report_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            report_date = timezone.now().date()
        
        liftings = CommissionLifting.objects.filter(
            lifting_date=report_date
        ).select_related('deal', 'principal_buyer', 'receiver_party')
        
        lifting_data = []
        total_qty = Decimal('0')
        total_buyer_comm = Decimal('0')
        total_seller_comm = Decimal('0')
        
        for lifting in liftings:
            lifting_data.append({
                'lifting_id': lifting.lifting_id,
                'deal_id': lifting.deal.deal_id,
                'commodity': lifting.deal.commodity.code,
                'buyer': lifting.principal_buyer.party_name if lifting.principal_buyer else 'N/A',
                'receiver': lifting.receiver_party.party_name if lifting.receiver_party else 'N/A',
                'quantity_mt': lifting.quantity_mt,
                'buyer_commission': lifting.buyer_commission,
                'seller_commission': lifting.seller_commission,
                'payment_status': lifting.payment_status
            })
            total_qty += lifting.quantity_mt
            total_buyer_comm += lifting.buyer_commission
            total_seller_comm += lifting.seller_commission
        
        return Response({
            'lifting_date': report_date,
            'total_liftings': len(lifting_data),
            'total_quantity_mt': total_qty,
            'total_buyer_commission': total_buyer_comm,
            'total_seller_commission': total_seller_comm,
            'total_commission': total_buyer_comm + total_seller_comm,
            'details': lifting_data
        })
