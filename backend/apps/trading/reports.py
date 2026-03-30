"""
Report endpoints for Trading module
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, F, DecimalField, Q, Avg
from django.db.models.functions import Coalesce
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta

from .models import Purchase, Lot, Sale, SaleLot, BrokeragePayable
from apps.masters.models import Warehouse
from .services import TradingEngine


class TradingReportViewSet(viewsets.ViewSet):
    """
    Trading module reports and analytics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def lot_wise_stock_report(self, request):
        """
        Lot-wise inventory report showing current stock levels
        """
        warehouse_id = request.query_params.get('warehouse_id')
        commodity_id = request.query_params.get('commodity_id')
        
        lots = Lot.objects.filter(
            balance_quantity_mt__gt=0,
            status__in=['active', 'partially_sold']
        )
        
        if warehouse_id:
            lots = lots.filter(warehouse_id=warehouse_id)
        if commodity_id:
            lots = lots.filter(commodity_id=commodity_id)
        
        report_data = []
        total_qty = Decimal('0')
        total_value = Decimal('0')
        
        for lot in lots.select_related('commodity', 'warehouse', 'supplier_party'):
            lot_value = lot.balance_quantity_mt * lot.cost_per_mt_current
            
            report_data.append({
                'lot_id': lot.lot_id,
                'commodity': lot.commodity.code,
                'commodity_name': lot.commodity.name,
                'warehouse': lot.warehouse.warehouse_name,
                'supplier': lot.supplier_party.party_name,
                'original_qty_mt': lot.original_quantity_mt,
                'sold_qty_mt': lot.sold_quantity_mt,
                'balance_qty_mt': lot.balance_quantity_mt,
                'cost_per_mt': lot.cost_per_mt_current,
                'lot_value': lot_value,
                'inward_date': lot.inward_date,
                'days_in_stock': (timezone.now().date() - lot.inward_date).days,
                'status': lot.status
            })
            
            total_qty += lot.balance_quantity_mt
            total_value += lot_value
        
        return Response({
            'report_date': timezone.now(),
            'warehouse_filter': warehouse_id,
            'commodity_filter': commodity_id,
            'total_lots': len(report_data),
            'total_quantity_mt': total_qty,
            'total_inventory_value': total_value,
            'average_cost_per_mt': (total_value / total_qty) if total_qty > 0 else Decimal('0'),
            'details': report_data
        })
    
    @action(detail=False, methods=['get'])
    def inventory_valuation_report(self, request):
        """
        Warehouse-wise inventory valuation
        Shows total stock value by warehouse and commodity
        """
        warehouse_id = request.query_params.get('warehouse_id')
        
        warehouses = Warehouse.objects.all()
        if warehouse_id:
            warehouses = warehouses.filter(id=warehouse_id)
        
        report_data = []
        grand_total_qty = Decimal('0')
        grand_total_value = Decimal('0')
        
        for warehouse in warehouses:
            warehouse_lots = Lot.objects.filter(
                warehouse=warehouse,
                balance_quantity_mt__gt=0,
                status__in=['active', 'partially_sold']
            )
            
            commodity_summary = {}
            warehouse_total_qty = Decimal('0')
            warehouse_total_value = Decimal('0')
            
            for lot in warehouse_lots:
                lot_value = lot.balance_quantity_mt * lot.cost_per_mt_current
                commodity_key = lot.commodity.code
                
                if commodity_key not in commodity_summary:
                    commodity_summary[commodity_key] = {
                        'commodity_name': lot.commodity.name,
                        'quantity_mt': Decimal('0'),
                        'avg_cost_per_mt': Decimal('0'),
                        'total_value': Decimal('0'),
                        'lot_count': 0
                    }
                
                comm_data = commodity_summary[commodity_key]
                comm_data['quantity_mt'] += lot.balance_quantity_mt
                comm_data['total_value'] += lot_value
                comm_data['lot_count'] += 1
                
                warehouse_total_qty += lot.balance_quantity_mt
                warehouse_total_value += lot_value
            
            # Calculate avg cost per MT for each commodity
            for comm in commodity_summary.values():
                if comm['quantity_mt'] > 0:
                    comm['avg_cost_per_mt'] = comm['total_value'] / comm['quantity_mt']
            
            report_data.append({
                'warehouse': warehouse.warehouse_name,
                'warehouse_code': warehouse.warehouse_code,
                'total_quantity_mt': warehouse_total_qty,
                'total_value': warehouse_total_value,
                'commodity_breakdown': commodity_summary
            })
            
            grand_total_qty += warehouse_total_qty
            grand_total_value += warehouse_total_value
        
        return Response({
            'report_date': timezone.now(),
            'grand_total_quantity_mt': grand_total_qty,
            'grand_total_value': grand_total_value,
            'average_cost_per_mt': (grand_total_value / grand_total_qty) if grand_total_qty > 0 else Decimal('0'),
            'warehouse_details': report_data
        })
    
    @action(detail=False, methods=['get'])
    def purchase_sales_summary(self, request):
        """
        Purchase and sales summary for period
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
        
        # Purchase summary
        purchases = Purchase.objects.filter(
            purchase_date__gte=start_date,
            purchase_date__lte=end_date,
            status='received'
        )
        
        purchase_data = {
            'total_purchases': purchases.count(),
            'total_quantity': purchases.aggregate(Sum('quantity_mt'))['quantity_mt__sum'] or Decimal('0'),
            'total_value': purchases.aggregate(Sum('total_landed_cost'))['total_landed_cost__sum'] or Decimal('0'),
            'average_rate': Decimal('0')
        }
        
        if purchase_data['total_quantity'] > 0:
            purchase_data['average_rate'] = purchase_data['total_value'] / purchase_data['total_quantity']
        
        # Sales summary
        sales = Sale.objects.filter(
            sale_date__gte=start_date,
            sale_date__lte=end_date,
            status__in=['delivered', 'invoiced', 'completed']
        )
        
        sales_data = {
            'total_sales': sales.count(),
            'total_quantity': sales.aggregate(Sum('total_quantity_mt'))['total_quantity_mt__sum'] or Decimal('0'),
            'total_revenue': sales.aggregate(Sum('total_revenue'))['total_revenue__sum'] or Decimal('0'),
            'total_cost': sales.aggregate(Sum('total_cost'))['total_cost__sum'] or Decimal('0'),
            'total_profit': sales.aggregate(Sum('gross_profit'))['gross_profit__sum'] or Decimal('0'),
            'average_rate': Decimal('0'),
            'margin_pct': Decimal('0')
        }
        
        if sales_data['total_quantity'] > 0:
            sales_data['average_rate'] = sales_data['total_revenue'] / sales_data['total_quantity']
        if sales_data['total_revenue'] > 0:
            sales_data['margin_pct'] = (sales_data['total_profit'] / sales_data['total_revenue']) * 100
        
        return Response({
            'report_period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'purchases': purchase_data,
            'sales': sales_data,
            'net_result': {
                'gross_profit': sales_data['total_profit'],
                'profit_margin_pct': sales_data['margin_pct']
            }
        })
    
    @action(detail=False, methods=['get'])
    def brokerage_payable_report(self, request):
        """
        Outstanding brokerage payable by broker
        """
        status = request.query_params.get('status', 'outstanding')
        
        brokerage_records = BrokeragePayable.objects.filter(
            status__in=[status] if status != 'all' else ['outstanding', 'partially_paid', 'paid']
        ).select_related('broker_party', 'purchase', 'sale')
        
        broker_summary = {}
        
        for brokerage in brokerage_records:
            broker_key = brokerage.broker_party.party_code
            
            if broker_key not in broker_summary:
                broker_summary[broker_key] = {
                    'broker_name': brokerage.broker_party.party_name,
                    'total_outstanding': Decimal('0'),
                    'total_paid': Decimal('0'),
                    'total_gross': Decimal('0'),
                    'brokerage_count': 0,
                    'details': []
                }
            
            broker_data = broker_summary[broker_key]
            broker_data['total_outstanding'] += brokerage.outstanding_amount
            broker_data['total_paid'] += brokerage.paid_amount
            broker_data['total_gross'] += brokerage.gross_amount
            broker_data['brokerage_count'] += 1
            
            broker_data['details'].append({
                'reference': brokerage.purchase.purchase_id if brokerage.purchase else brokerage.sale.sale_id,
                'type': 'purchase' if brokerage.purchase else 'sale',
                'gross_amount': brokerage.gross_amount,
                'paid_amount': brokerage.paid_amount,
                'outstanding': brokerage.outstanding_amount,
                'status': brokerage.status
            })
        
        total_outstanding = sum(b['total_outstanding'] for b in broker_summary.values())
        
        return Response({
            'report_date': timezone.now(),
            'status_filter': status,
            'total_outstanding': total_outstanding,
            'broker_count': len(broker_summary),
            'brokers': list(broker_summary.values())
        })
    
    @action(detail=False, methods=['get'])
    def warehouse_performance(self, request):
        """
        Warehouse-wise performance metrics
        """
        warehouse_id = request.query_params.get('warehouse_id')
        
        warehouses = Warehouse.objects.all()
        if warehouse_id:
            warehouses = warehouses.filter(id=warehouse_id)
        
        performance_data = []
        
        for warehouse in warehouses:
            # Inventory stats
            inventory = TradingEngine.get_inventory_summary(warehouse.id)
            
            # Sales stats
            sales = Sale.objects.filter(warehouse=warehouse, status__in=['delivered', 'invoiced', 'completed'])
            sales_summary = TradingEngine.get_sales_summary(warehouse.id)
            
            # Current utilization
            current_stock = inventory['total_quantity_mt']
            capacity = warehouse.total_capacity_mt
            utilization_pct = (current_stock / capacity * 100) if capacity > 0 else 0
            
            performance_data.append({
                'warehouse': warehouse.warehouse_name,
                'warehouse_code': warehouse.warehouse_code,
                'total_capacity_mt': capacity,
                'current_stock_mt': current_stock,
                'utilization_pct': utilization_pct,
                'inventory_value': inventory['total_inventory_value'],
                'sale_transactions': sales.count(),
                'sales_summary': sales_summary
            })
        
        return Response({
            'report_date': timezone.now(),
            'performance_metrics': performance_data
        })
