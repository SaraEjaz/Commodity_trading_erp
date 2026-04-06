from django.core.management.base import BaseCommand
from django.utils.text import slugify
from decimal import Decimal
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Seed UOF, masters and sample commission deals for Deals module phase'

    def handle(self, *args, **options):
        from apps.masters.models import UnitOfMeasure, Party, CommissionRule
        from apps.commodities.models import Category, Commodity
        from apps.commission.models import CommissionDeal, CommissionDealReceiver

        # UOF
        uof_mt, _ = UnitOfMeasure.objects.get_or_create(code='MT', defaults={'name': 'Metric Ton'})
        self.stdout.write(self.style.SUCCESS(f'UOF ensured: {uof_mt}'))

        # Category
        meals_cat, _ = Category.objects.get_or_create(name='Meals', defaults={'description': 'Meal commodities'})

        # Commodities
        commodities = [
            ('SOYB', 'Soybean Meal'),
            ('CAN', 'Canola Meal'),
            ('SUN', 'Sunflower Meal'),
            ('RAP', 'Rapeseed Meal'),
        ]
        created_commodities = {}
        for code, name in commodities:
            obj, _ = Commodity.objects.get_or_create(code=code, defaults={
                'name': name,
                'category': meals_cat,
                'unit': 'MT',
                'base_price': Decimal('0'),
            })
            created_commodities[code] = obj
            self.stdout.write(self.style.SUCCESS(f'Commodity ensured: {obj}'))

        # Parties
        party_names = [
            'Ahmed Traders', 'Rehan Feeds', 'Bilal Foods', 'XYZ Distributors',
            'Farmers Mill Pvt Ltd', 'Al Noor Feeds', 'Sunrise Protein', 'Pak Agro Mills'
        ]
        created_parties = {}
        for name in party_names:
            code = slugify(name).upper().replace('-', '_')[:20]
            obj, _ = Party.objects.get_or_create(party_code=code, defaults={
                'party_name': name,
                'party_type': 'buyer' if 'Traders' in name or 'Distributors' in name else 'supplier',
            })
            created_parties[name] = obj
            self.stdout.write(self.style.SUCCESS(f'Party ensured: {obj}'))

        # Commission Rules (sample)
        # Soybean buyer-side per MT
        soy = created_commodities.get('SOYB')
        if soy:
            CommissionRule.objects.get_or_create(
                rule_name='Soybean Buyer Per MT',
                commodity=soy,
                defaults={
                    'commission_type': 'per_mt',
                    'rate_or_amount': Decimal('5.00'),
                    'payer_type': 'buyer',
                    'valid_from': date.today() - timedelta(days=365),
                }
            )

        # Soybean seller-side per MT
        if soy:
            CommissionRule.objects.get_or_create(
                rule_name='Soybean Seller Per MT',
                commodity=soy,
                defaults={
                    'commission_type': 'per_mt',
                    'rate_or_amount': Decimal('3.00'),
                    'payer_type': 'seller',
                    'valid_from': date.today() - timedelta(days=365),
                }
            )

        # Percentage-based rule (generic)
        CommissionRule.objects.get_or_create(
            rule_name='Generic Percentage 1%',
            defaults={
                'commission_type': 'percentage',
                'rate_or_amount': Decimal('1.00'),
                'payer_type': 'buyer',
                'valid_from': date.today() - timedelta(days=365),
            }
        )

        # Fixed rule example
        CommissionRule.objects.get_or_create(
            rule_name='Fixed Fee 500',
            defaults={
                'commission_type': 'fixed',
                'rate_or_amount': Decimal('500.00'),
                'payer_type': 'buyer',
                'valid_from': date.today() - timedelta(days=365),
            }
        )

        # Sample deals
        # Open Soybean deal
        seller = created_parties.get('Farmers Mill Pvt Ltd') or list(created_parties.values())[0]
        buyer = created_parties.get('Ahmed Traders') or list(created_parties.values())[0]
        soybean = created_commodities.get('SOYB')

        if soybean:
            deal1, created = CommissionDeal.objects.get_or_create(
                deal_id='SAMPLE-COMM-001',
                defaults={
                    'deal_date': date.today(),
                    'delivery_period_from': date.today(),
                    'delivery_period_to': date.today() + timedelta(days=30),
                    'commodity': soybean,
                    'total_quantity_mt': Decimal('1000'),
                    'uof': uof_mt,
                    'commercial_rate': Decimal('500'),
                    'seller_party': seller,
                    'principal_buyer_party': buyer,
                    'commission_applicable': True,
                    'commission_basis': 'per_mt',
                    'commission_payer': 'buyer',
                }
            )
            if created:
                CommissionDealReceiver.objects.create(deal=deal1, receiver_party=created_parties.get('Rehan Feeds'), expected_quantity_mt=Decimal('400'))
                CommissionDealReceiver.objects.create(deal=deal1, receiver_party=created_parties.get('Bilal Foods'), expected_quantity_mt=Decimal('300'))
                CommissionDealReceiver.objects.create(deal=deal1, receiver_party=created_parties.get('XYZ Distributors'), expected_quantity_mt=Decimal('300'))
                deal1.quantity_remaining_mt = deal1.total_quantity_mt
                deal1.total_amount = deal1.total_quantity_mt * deal1.commercial_rate
                deal1.save()
            self.stdout.write(self.style.SUCCESS(f'Deal ensured: {deal1.deal_id}'))

        # Partially executed deal
        if soybean:
            deal2, created = CommissionDeal.objects.get_or_create(
                deal_id='SAMPLE-COMM-002',
                defaults={
                    'deal_date': date.today() - timedelta(days=30),
                    'delivery_period_from': date.today() - timedelta(days=30),
                    'delivery_period_to': date.today(),
                    'commodity': soybean,
                    'total_quantity_mt': Decimal('500'),
                    'uof': uof_mt,
                    'commercial_rate': Decimal('480'),
                    'seller_party': seller,
                    'principal_buyer_party': buyer,
                    'commission_applicable': True,
                    'commission_basis': 'percentage',
                    'commission_payer': 'both',
                    'buyer_side_commission_rate': Decimal('0.5'),
                    'seller_side_commission_rate': Decimal('0.25'),
                }
            )
            if created:
                CommissionDealReceiver.objects.create(deal=deal2, receiver_party=created_parties.get('Sunrise Protein'), expected_quantity_mt=Decimal('500'))
                deal2.quantity_lifted_mt = Decimal('200')
                deal2.quantity_remaining_mt = deal2.total_quantity_mt - deal2.quantity_lifted_mt
                deal2.total_amount = deal2.total_quantity_mt * deal2.commercial_rate
                deal2.save()
            self.stdout.write(self.style.SUCCESS(f'Deal ensured: {deal2.deal_id}'))

        # Closed deal (safe)
        if soybean:
            deal3, created = CommissionDeal.objects.get_or_create(
                deal_id='SAMPLE-COMM-003',
                defaults={
                    'deal_date': date.today() - timedelta(days=90),
                    'delivery_period_from': date.today() - timedelta(days=90),
                    'delivery_period_to': date.today() - timedelta(days=60),
                    'commodity': soybean,
                    'total_quantity_mt': Decimal('300'),
                    'uof': uof_mt,
                    'commercial_rate': Decimal('470'),
                    'seller_party': seller,
                    'principal_buyer_party': buyer,
                    'commission_applicable': True,
                    'commission_basis': 'per_mt',
                    'commission_payer': 'seller',
                    'status': 'closed',
                }
            )
            if created:
                CommissionDealReceiver.objects.create(deal=deal3, receiver_party=created_parties.get('Pak Agro Mills'), expected_quantity_mt=Decimal('300'))
                deal3.quantity_lifted_mt = deal3.total_quantity_mt
                deal3.quantity_remaining_mt = 0
                deal3.total_amount = deal3.total_quantity_mt * deal3.commercial_rate
                deal3.save()
            self.stdout.write(self.style.SUCCESS(f'Deal ensured: {deal3.deal_id}'))

        self.stdout.write(self.style.SUCCESS('Seeding complete for commission deals phase'))
