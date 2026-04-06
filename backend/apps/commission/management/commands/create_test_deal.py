from django.core.management.base import BaseCommand
from decimal import Decimal
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Create a single test commission deal (for UI testing)'

    def handle(self, *args, **options):
        from apps.masters.models import UnitOfMeasure, Party
        from apps.commodities.models import Commodity
        from apps.commission.models import CommissionDeal, CommissionDealReceiver
        import uuid

        commodity = Commodity.objects.filter(code__in=['SOYB', 'CAN', 'SUN', 'RAP']).first() or Commodity.objects.first()
        if not commodity:
            self.stdout.write(self.style.ERROR('No commodity found in DB; aborting'))
            return

        uof = UnitOfMeasure.objects.filter(code='MT').first() or UnitOfMeasure.objects.first()

        seller = Party.objects.filter(party_type__icontains='supplier').first() or Party.objects.first()
        buyer = Party.objects.filter(party_type__icontains='buyer').exclude(pk=getattr(seller, 'pk', None)).first() or Party.objects.exclude(pk=getattr(seller, 'pk', None)).first()

        deal_id = f"TEST-DEAL-{uuid.uuid4().hex[:8].upper()}"

        deal = CommissionDeal.objects.create(
            deal_id=deal_id,
            deal_date=date.today(),
            delivery_period_from=date.today(),
            delivery_period_to=date.today() + timedelta(days=30),
            commodity=commodity,
            total_quantity_mt=Decimal('100'),
            uof=uof,
            commercial_rate=Decimal('500'),
            seller_party=seller,
            principal_buyer_party=buyer,
            commission_applicable=True,
            commission_basis='per_mt',
            commission_payer='buyer',
            buyer_side_commission_rate=Decimal('1.0'),
        )

        # Attach a single receiver (use a different party if available)
        receiver_party = Party.objects.exclude(pk=getattr(seller, 'pk', None)).first()
        if receiver_party:
            CommissionDealReceiver.objects.create(
                deal=deal,
                receiver_party=receiver_party,
                expected_quantity_mt=Decimal('100'),
            )

        deal.quantity_remaining_mt = deal.total_quantity_mt - deal.quantity_lifted_mt
        deal.total_amount = deal.total_quantity_mt * deal.commercial_rate
        deal.save()

        self.stdout.write(self.style.SUCCESS(f'Created test deal: {deal.deal_id} (pk={deal.pk})'))
