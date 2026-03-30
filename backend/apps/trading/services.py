"""
Trading Service Layer - Handles business logic for warehouse inventory trading
"""

from decimal import Decimal
from django.db import transaction, models
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import Purchase, PurchaseCost, Lot, LotMovement, Sale, SaleLot, BrokeragePayable
from apps.masters.models import Party
from apps.accounting.models import PartyLedgerEntry


class TradingEngine:
    """
    Service layer for warehouse trading operations
    Handles purchases, sales, lot tracking, and cost calculations
    """
    
    @staticmethod
    @transaction.atomic
    def post_purchase(purchase_id):
        """
        Post a purchase - creates a lot and records in warehouse
        
        Args:
            purchase_id: Purchase object ID
            
        Returns:
            dict: Created lot details
            
        Raises:
            ValidationError: If purchase cannot be posted
        """
        purchase = Purchase.objects.get(id=purchase_id)
        
        if purchase.status != 'draft':
            raise ValidationError(f"Only draft purchases can be posted. Current status: {purchase.status}")
        
        # Calculate landed cost per MT
        total_extra_costs = PurchaseCost.objects.filter(purchase=purchase).aggregate(
            total=models.Sum('amount')
        ).get('total') or Decimal('0')
        
        landed_cost_per_mt = purchase.rate_per_mt + (total_extra_costs / purchase.quantity_mt)
        total_landed_cost = purchase.quantity_mt * landed_cost_per_mt
        
        # Update purchase with final landed cost
        purchase.landed_cost_per_mt = landed_cost_per_mt
        purchase.total_landed_cost = total_landed_cost
        purchase.status = 'received'
        purchase.save()
        
        # Create lot
        lot = Lot.objects.create(
            lot_id=f"LOT-{purchase.purchase_id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            purchase=purchase,
            commodity=purchase.commodity,
            warehouse=purchase.warehouse,
            supplier_party=purchase.supplier_party,
            original_quantity_mt=purchase.quantity_mt,
            balance_quantity_mt=purchase.quantity_mt,
            sold_quantity_mt=Decimal('0'),
            inward_rate_per_mt=purchase.rate_per_mt,
            landed_cost_per_mt=landed_cost_per_mt,
            total_cost=total_landed_cost,
            cost_per_mt_current=landed_cost_per_mt,
            status='active'
        )
        
        # Record inward movement
        LotMovement.objects.create(
            lot=lot,
            movement_date=purchase.purchase_date,
            movement_type='inward',
            quantity_mt=purchase.quantity_mt,
            reference_id=purchase.purchase_id
        )
        
        # Post to ledger (supplier debit, warehouse credit)
        if purchase.supplier_party:
            PartyLedgerEntry.objects.create(
                party=purchase.supplier_party,
                business_line='trading',
                transaction_type='purchase',
                document_reference=purchase.purchase_id,
                debit_amount=total_landed_cost,
                credit_amount=Decimal('0'),
                posting_date=purchase.purchase_date,
                payment_status='pending'
            )
        
        return {
            'lot_id': lot.lot_id,
            'lot': lot,
            'message': f'Purchase posted. Lot created: {lot.lot_id}'
        }
    
    @staticmethod
    @transaction.atomic
    def post_sale(sale_id):
        """
        Post a sale - allocates from lots and updates balances
        
        Args:
            sale_id: Sale object ID
            
        Returns:
            dict: Sale posting summary
            
        Raises:
            ValidationError: If sale cannot be posted
        """
        sale = Sale.objects.get(id=sale_id)
        
        if sale.status != 'draft':
            raise ValidationError(f"Only draft sales can be posted. Current status: {sale.status}")
        
        # Get all lot allocations
        sale_lots = sale.sale_lots.all()
        if not sale_lots.exists():
            raise ValidationError("Sale must have at least one lot allocation")
        
        total_qty = Decimal('0')
        total_revenue = Decimal('0')
        total_cost = Decimal('0')
        
        # Process each lot allocation
        for sale_lot in sale_lots:
            lot = sale_lot.lot
            
            if sale_lot.quantity_taken_mt > lot.balance_quantity_mt:
                raise ValidationError(
                    f"Cannot allocate {sale_lot.quantity_taken_mt}MT from lot {lot.lot_id}. "
                    f"Only {lot.balance_quantity_mt}MT available"
                )
            
            # Update lot balance
            lot.sold_quantity_mt += sale_lot.quantity_taken_mt
            lot.balance_quantity_mt = lot.original_quantity_mt - lot.sold_quantity_mt
            
            # Update lot status
            if lot.balance_quantity_mt <= 0:
                lot.status = 'fully_sold'
            elif lot.sold_quantity_mt > 0:
                lot.status = 'partially_sold'
            
            lot.save()
            
            # Record outward movement
            LotMovement.objects.create(
                lot=lot,
                movement_date=sale.sale_date,
                movement_type='outward',
                quantity_mt=sale_lot.quantity_taken_mt,
                reference_id=sale.sale_id
            )
            
            # Calculate totals
            total_qty += sale_lot.quantity_taken_mt
            total_revenue += sale_lot.total_revenue
            total_cost += sale_lot.total_cost
        
        # Update sale
        gross_profit = total_revenue - total_cost
        sale.total_quantity_mt = total_qty
        sale.total_revenue = total_revenue
        sale.total_cost = total_cost
        sale.gross_profit = gross_profit
        sale.status = 'delivered'
        sale.save()
        
        # Post to ledger (buyer debit, warehouse credit)
        if sale.buyer_party:
            PartyLedgerEntry.objects.create(
                party=sale.buyer_party,
                business_line='trading',
                transaction_type='sale',
                document_reference=sale.sale_id,
                debit_amount=total_revenue,
                credit_amount=Decimal('0'),
                posting_date=sale.sale_date,
                payment_status='pending'
            )
        
        return {
            'sale_id': sale.sale_id,
            'total_qty': total_qty,
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'gross_profit': gross_profit,
            'message': f'Sale posted. {total_qty}MT @ {total_revenue}'
        }
    
    @staticmethod
    def get_lot_available_for_sale(warehouse_id=None, commodity_id=None):
        """
        Get all lots available for sale with remaining balance
        
        Args:
            warehouse_id: Filter by warehouse (optional)
            commodity_id: Filter by commodity (optional)
            
        Returns:
            QuerySet: Active lots with balance > 0
        """
        lots = Lot.objects.filter(
            balance_quantity_mt__gt=0,
            status__in=['active', 'partially_sold']
        )
        
        if warehouse_id:
            lots = lots.filter(warehouse_id=warehouse_id)
        if commodity_id:
            lots = lots.filter(commodity_id=commodity_id)
        
        return lots.select_related('commodity', 'warehouse', 'supplier_party')
    
    @staticmethod
    def get_inventory_summary(warehouse_id=None):
        """
        Get warehouse inventory summary
        
        Args:
            warehouse_id: Filter by warehouse (optional)
            
        Returns:
            dict: Inventory metrics
        """
        lots = Lot.objects.filter(
            balance_quantity_mt__gt=0,
            status__in=['active', 'partially_sold']
        )
        
        if warehouse_id:
            lots = lots.filter(warehouse_id=warehouse_id)
        
        summary = lots.aggregate(
            total_qty=models.Sum('balance_quantity_mt'),
            total_value=models.Sum(models.F('balance_quantity_mt') * models.F('cost_per_mt_current'), output_field=models.DecimalField()),
            avg_cost_per_mt=models.Avg('cost_per_mt_current')
        )
        
        return {
            'total_quantity_mt': summary['total_qty'] or Decimal('0'),
            'total_inventory_value': summary['total_value'] or Decimal('0'),
            'average_cost_per_mt': summary['avg_cost_per_mt'] or Decimal('0'),
            'total_lots': lots.count()
        }
    
    @staticmethod
    def get_sales_summary(warehouse_id=None, start_date=None, end_date=None):
        """
        Get sales summary for period
        
        Args:
            warehouse_id: Filter by warehouse (optional)
            start_date: Filter from date (optional)
            end_date: Filter to date (optional)
            
        Returns:
            dict: Sales metrics
        """
        sales = Sale.objects.filter(
            status__in=['delivered', 'invoiced', 'completed']
        )
        
        if warehouse_id:
            sales = sales.filter(warehouse_id=warehouse_id)
        if start_date:
            sales = sales.filter(sale_date__gte=start_date)
        if end_date:
            sales = sales.filter(sale_date__lte=end_date)
        
        summary = sales.aggregate(
            total_qty=models.Sum('total_quantity_mt'),
            total_revenue=models.Sum('total_revenue'),
            total_cost=models.Sum('total_cost'),
            total_profit=models.Sum('gross_profit')
        )
        
        total_revenue = summary['total_revenue'] or Decimal('0')
        total_profit = summary['total_profit'] or Decimal('0')
        
        return {
            'total_quantity_mt': summary['total_qty'] or Decimal('0'),
            'total_revenue': total_revenue,
            'total_cost': summary['total_cost'] or Decimal('0'),
            'total_profit': total_profit,
            'profit_margin_pct': (total_profit / total_revenue * 100) if total_revenue > 0 else Decimal('0'),
            'total_transactions': sales.count()
        }
    
    @staticmethod
    def create_purchase_brokerage(purchase_id, broker_party_id, brokerage_type, brokerage_rate):
        """
        Create brokerage payable for purchase
        
        Args:
            purchase_id: Purchase object ID
            broker_party_id: Broker party ID
            brokerage_type: 'per_mt', 'percentage', or 'fixed'
            brokerage_rate: Rate or amount
            
        Returns:
            dict: Created brokerage record
        """
        purchase = Purchase.objects.get(id=purchase_id)
        broker_party = Party.objects.get(id=broker_party_id)
        
        # Calculate gross amount
        if brokerage_type == 'per_mt':
            gross_amount = purchase.quantity_mt * brokerage_rate
        elif brokerage_type == 'percentage':
            gross_amount = (purchase.total_value * brokerage_rate) / Decimal('100')
        elif brokerage_type == 'fixed':
            gross_amount = brokerage_rate
        else:
            raise ValidationError(f"Invalid brokerage type: {brokerage_type}")
        
        brokerage = BrokeragePayable.objects.create(
            purchase=purchase,
            broker_party=broker_party,
            brokerage_type=brokerage_type,
            brokerage_rate=brokerage_rate,
            total_quantity_mt=purchase.quantity_mt,
            gross_amount=gross_amount,
            outstanding_amount=gross_amount,
            status='outstanding'
        )
        
        # Post to ledger
        PartyLedgerEntry.objects.create(
            party=broker_party,
            business_line='trading',
            transaction_type='purchase',
            document_reference=purchase.purchase_id,
            debit_amount=Decimal('0'),
            credit_amount=gross_amount,  # Brokerage payable
            posting_date=purchase.purchase_date,
            payment_status='pending'
        )
        
        return {
            'brokerage_id': brokerage.id,
            'gross_amount': gross_amount,
            'brokerage': brokerage
        }
