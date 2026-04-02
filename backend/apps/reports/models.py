from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('trading', 'Trading Report'),
        ('inventory', 'Inventory Report'),
        ('financial', 'Financial Report'),
        ('sales', 'Sales Report'),
        ('purchase', 'Purchase Report'),
        ('compliance', 'Compliance Report'),
        ('custom', 'Custom Report'),
    ]
    
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reports')
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Report configuration
    filters = models.JSONField(default=dict, blank=True)
    columns = models.JSONField(default=list, blank=True)
    
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.report_type})"


class ReportData(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='data')
    
    # Data rows as JSON
    data = models.JSONField(default=list, blank=True)
    summary = models.JSONField(default=dict, blank=True)
    
    total_rows = models.IntegerField(default=0)
    
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"Data for {self.report.name}"


class TradingReport(models.Model):
    trader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    report_date = models.DateField(auto_now_add=True)
    
    total_trades = models.IntegerField(default=0)
    total_buy_trades = models.IntegerField(default=0)
    total_sell_trades = models.IntegerField(default=0)
    
    total_volume = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    avg_trade_size = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    realized_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    unrealized_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['trader', 'report_date']
        ordering = ['-report_date']
    
    def __str__(self):
        return f"Trading Report - {self.trader.email} ({self.report_date})"


class InventoryReport(models.Model):
    warehouse = models.ForeignKey('masters.Warehouse', on_delete=models.SET_NULL, null=True)
    report_date = models.DateField(auto_now_add=True)
    
    total_items = models.IntegerField(default=0)
    total_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    items_in_stock = models.IntegerField(default=0)
    items_below_reorder = models.IntegerField(default=0)
    items_zero_stock = models.IntegerField(default=0)
    
    capacity_utilization = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-report_date']
    
    def __str__(self):
        return f"Inventory Report - {self.warehouse.name if self.warehouse else 'All'}"


class SalesReport(models.Model):
    report_date = models.DateField(auto_now_add=True)
    
    total_orders = models.IntegerField(default=0)
    completed_orders = models.IntegerField(default=0)
    pending_orders = models.IntegerField(default=0)
    
    total_sales = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_quantity_sold = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    avg_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    top_commodity = models.ForeignKey('commodities.Commodity', on_delete=models.SET_NULL, null=True, blank=True)
    top_customer = models.CharField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-report_date']
    
    def __str__(self):
        return f"Sales Report ({self.report_date})"


class FinancialReport(models.Model):
    report_date = models.DateField(auto_now_add=True)
    
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_expenses = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    gross_profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    profit_margin = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    breakdown = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-report_date']
    
    def __str__(self):
        return f"Financial Report ({self.report_date})"
