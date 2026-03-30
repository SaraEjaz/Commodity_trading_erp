"""
Commission Engine - Service layer for commission calculation and posting
"""
from decimal import Decimal
from django.db import transaction
from apps.masters.models import CommissionRule
from .models import CommissionLifting, CommissionDeal
from datetime import date


class CommissionEngine:
    """
    Service class to handle commission calculations, rule matching, and ledger posting
    """
    
    @staticmethod
    def get_applicable_rules(party=None, commodity=None, lifting_date=None):
        """Get commission rules applicable for a party/commodity on a given date"""
        if lifting_date is None:
            lifting_date = date.today()
        
        rules = CommissionRule.objects.filter(
            is_active=True,
            valid_from__lte=lifting_date
        ).filter(
            models.Q(valid_to__isnull=True) | models.Q(valid_to__gte=lifting_date)
        )
        
        if party:
            from django.db.models import Q
            rules = rules.filter(Q(party=party) | Q(party__isnull=True))
        
        if commodity:
            from django.db.models import Q
            rules = rules.filter(Q(commodity=commodity) | Q(commodity__isnull=True))
        
        return rules
    
    @staticmethod
    def calculate_commission(quantity_mt, rate_or_amount, commission_type):
        """Calculate commission amount based on type"""
        if commission_type == 'per_mt':
            return Decimal(quantity_mt) * Decimal(rate_or_amount)
        elif commission_type == 'percentage':
            return Decimal(quantity_mt) * Decimal(rate_or_amount) / Decimal('100')
        elif commission_type == 'fixed':
            return Decimal(rate_or_amount)
        return Decimal('0')
    
    @staticmethod
    @transaction.atomic
    def post_lifting(lifting_id):
        """
        Post a lifting to the commission ledger
        Creates commission ledger entries and updates deal status
        """
        from apps.accounting.models import CommissionLedgerEntry
        
        lifting = CommissionLifting.objects.get(lifting_id=lifting_id)
        deal = lifting.deal
        
        # Calculate commissions based on deal terms
        buyer_commission = Decimal('0')
        seller_commission = Decimal('0')
        
        if deal.commission_applicable:
            if deal.commission_payer in ['buyer', 'both']:
                buyer_commission = CommissionEngine.calculate_commission(
                    lifting.quantity_mt,
                    deal.buyer_side_commission_rate,
                    deal.commission_basis
                )
            
            if deal.commission_payer in ['seller', 'both']:
                seller_commission = CommissionEngine.calculate_commission(
                    lifting.quantity_mt,
                    deal.seller_side_commission_rate,
                    deal.commission_basis
                )
        
        lifting.buyer_commission = buyer_commission
        lifting.seller_commission = seller_commission
        lifting.save()
        
        # Create ledger entries
        if buyer_commission > 0:
            CommissionLedgerEntry.objects.create(
                commission_deal=deal,
                commission_lifting=lifting,
                party=deal.principal_buyer_party,
                side='buyer',
                commission_type=deal.commission_basis,
                gross_commission=buyer_commission,
                received_amount=Decimal('0'),
                outstanding_amount=buyer_commission,
                payment_status='outstanding',
                posting_date=lifting.lifting_date,
            )
        
        if seller_commission > 0:
            CommissionLedgerEntry.objects.create(
                commission_deal=deal,
                commission_lifting=lifting,
                party=deal.seller_party,
                side='seller',
                commission_type=deal.commission_basis,
                gross_commission=seller_commission,
                received_amount=Decimal('0'),
                outstanding_amount=seller_commission,
                payment_status='outstanding',
                posting_date=lifting.lifting_date,
            )
        
        # Update deal quantities
        deal.quantity_lifted_mt += lifting.quantity_mt
        deal.quantity_remaining_mt = deal.total_quantity_mt - deal.quantity_lifted_mt
        
        # Update deal status
        if deal.quantity_remaining_mt <= 0:
            deal.status = 'closed'
        else:
            deal.status = 'partially_executed'
        
        deal.save()
        
        return True
    
    @staticmethod
    def get_deal_summary(deal_id):
        """Get summary statistics for a commission deal"""
        from apps.accounting.models import CommissionLedgerEntry
        
        deal = CommissionDeal.objects.get(deal_id=deal_id)
        liftings = CommissionLifting.objects.filter(deal=deal)
        ledger_entries = CommissionLedgerEntry.objects.filter(commission_deal=deal)
        
        return {
            'deal_id': deal.deal_id,
            'commodity': str(deal.commodity),
            'total_quantity_mt': float(deal.total_quantity_mt),
            'quantity_lifted_mt': float(deal.quantity_lifted_mt),
            'quantity_remaining_mt': float(deal.quantity_remaining_mt),
            'lifting_count': liftings.count(),
            'seller_party': deal.seller_party.party_code,
            'principal_buyer': deal.principal_buyer_party.party_code,
            'buyer_receivers': list(deal.receivers.values_list('receiver_party__party_code', flat=True)),
            'total_buyer_commission': float(
                ledger_entries.filter(side='buyer').aggregate(
                    models.Sum('gross_commission')
                )['gross_commission__sum'] or 0
            ),
            'total_seller_commission': float(
                ledger_entries.filter(side='seller').aggregate(
                    models.Sum('gross_commission')
                )['gross_commission__sum'] or 0
            ),
            'commission_received': float(
                ledger_entries.filter(payment_status='paid').aggregate(
                    models.Sum('received_amount')
                )['received_amount__sum'] or 0
            ),
            'commission_outstanding': float(
                ledger_entries.filter(payment_status='outstanding').aggregate(
                    models.Sum('outstanding_amount')
                )['outstanding_amount__sum'] or 0
            ),
            'status': deal.status,
        }


# Import at end to avoid circular imports
from django.db import models
