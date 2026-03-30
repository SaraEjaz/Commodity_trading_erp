from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()


class TradeSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('suspended', 'Suspended'),
    ]
    
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} - {self.status}"


class Trade(models.Model):
    TRADE_TYPE_CHOICES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('executed', 'Executed'),
        ('cancelled', 'Cancelled'),
        ('on_hold', 'On Hold'),
    ]
    
    trade_id = models.CharField(max_length=50, unique=True, db_index=True)
    session = models.ForeignKey(TradeSession, on_delete=models.PROTECT, related_name='trades')
    
    # Trade details
    trader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='trades')
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT)
    trade_type = models.CharField(max_length=10, choices=TRADE_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Counterparty
    counterparty_name = models.CharField(max_length=200)
    counterparty_country = models.CharField(max_length=100)
    
    # Financial details
    total_value = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    commission = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    net_value = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Trade dates
    trade_date = models.DateField()
    settlement_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Notes
    notes = models.TextField(blank=True)
    documents = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-trade_date']
        indexes = [
            models.Index(fields=['trade_id']),
            models.Index(fields=['status']),
            models.Index(fields=['trader', '-trade_date']),
        ]
    
    def save(self, *args, **kwargs):
        self.total_value = self.quantity * self.unit_price
        self.net_value = self.total_value - self.commission
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.trade_id} - {self.trade_type} {self.quantity} {self.commodity.code}"


class TradePosition(models.Model):
    trader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='positions')
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT)
    
    long_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    short_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    average_long_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_short_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    current_market_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unrealized_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    realized_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['trader', 'commodity']
    
    def __str__(self):
        return f"{self.trader.email} - {self.commodity.code}"


class TradeAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('price', 'Price Alert'),
        ('margin', 'Margin Alert'),
        ('position', 'Position Alert'),
        ('risk', 'Risk Alert'),
        ('system', 'System Alert'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trade_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.alert_type} - {self.user.email}"


# ============================================================================
# WAREHOUSE INVENTORY TRADING MODELS
# ============================================================================
# These models handle warehouse-based trading (inventory purchases and sales)
# Different from Financial Trading above (Trade model for commodities futures)

class Purchase(models.Model):
    """
    Warehouse purchase - creates inventory lots
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('received', 'Received'),
        ('invoiced', 'Invoiced'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Identification
    purchase_id = models.CharField(max_length=50, unique=True, db_index=True)
    purchase_date = models.DateField()
    
    # Parties
    supplier_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='warehouse_purchases')
    warehouse = models.ForeignKey('masters.Warehouse', on_delete=models.PROTECT, related_name='purchases')
    
    # Optional broker/agent
    broker_agent_party = models.ForeignKey('masters.Party', on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='brokered_purchases')
    
    # Commodity & Quantity
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT)
    quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Pricing
    rate_per_mt = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    total_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Landed Cost
    landed_cost_per_mt = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                           help_text="Cost per MT including all charges")
    total_landed_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    
    # Notes
    remarks = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-purchase_date']
        indexes = [
            models.Index(fields=['purchase_id']),
            models.Index(fields=['status']),
            models.Index(fields=['-purchase_date']),
        ]
    
    def __str__(self):
        return f"{self.purchase_id} - {self.commodity.code}"
    
    def save(self, *args, **kwargs):
        self.total_value = self.quantity_mt * self.rate_per_mt
        self.total_landed_cost = self.quantity_mt * self.landed_cost_per_mt
        super().save(*args, **kwargs)


class PurchaseCost(models.Model):
    """Cost components for a purchase (freight, insurance, etc.)"""
    COST_TYPE_CHOICES = [
        ('freight', 'Freight'),
        ('insurance', 'Insurance'),
        ('handling', 'Handling'),
        ('inspection', 'Inspection'),
        ('customs', 'Customs'),
        ('other', 'Other'),
    ]
    
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='cost_components')
    cost_type = models.CharField(max_length=50, choices=COST_TYPE_CHOICES)
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    
    class Meta:
        ordering = ['cost_type']
    
    def __str__(self):
        return f"{self.purchase.purchase_id} - {self.cost_type}"


class Lot(models.Model):
    """
    Inventory lot - unique batch of commodity with traceability
    Created from purchase, reduced by sales
    """
    LOT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('partially_sold', 'Partially Sold'),
        ('fully_sold', 'Fully Sold'),
        ('obsolete', 'Obsolete'),
    ]
    
    # Identification
    lot_id = models.CharField(max_length=50, unique=True, db_index=True)
    purchase = models.OneToOneField(Purchase, on_delete=models.PROTECT, related_name='created_lot')
    
    # Commodity & Warehouse
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT, related_name='lots')
    warehouse = models.ForeignKey('masters.Warehouse', on_delete=models.PROTECT, related_name='lots')
    
    # Supplier (from purchase)
    supplier_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='supplied_lots')
    
    # Inward Details
    inward_date = models.DateField(auto_now_add=True)
    original_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Quantity Tracking
    sold_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    balance_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Cost Tracking
    inward_rate_per_mt = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    landed_cost_per_mt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    cost_per_mt_current = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                             help_text="Updated cost per MT as part quantity is sold")
    
    # Status
    status = models.CharField(max_length=20, choices=LOT_STATUS_CHOICES, default='active', db_index=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-inward_date']
        indexes = [
            models.Index(fields=['lot_id']),
            models.Index(fields=['commodity']),
            models.Index(fields=['warehouse']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.lot_id} - {self.commodity.code}"
    
    def save(self, *args, **kwargs):
        # Update balance
        self.balance_quantity_mt = self.original_quantity_mt - self.sold_quantity_mt
        # Update status
        if self.balance_quantity_mt <= 0:
            self.status = 'fully_sold'
        elif self.sold_quantity_mt > 0:
            self.status = 'partially_sold'
        else:
            self.status = 'active'
        
        super().save(*args, **kwargs)


class LotMovement(models.Model):
    """Track all in/out movements for a lot"""
    MOVEMENT_TYPE_CHOICES = [
        ('inward', 'Inward (Purchase)'),
        ('outward', 'Outward (Sale)'),
        ('transfer', 'Transfer'),
        ('adjustment', 'Adjustment'),
    ]
    
    lot = models.ForeignKey(Lot, on_delete=models.CASCADE, related_name='movements')
    movement_date = models.DateField()
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    
    quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    reference_id = models.CharField(max_length=100, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-movement_date']
    
    def __str__(self):
        return f"{self.lot.lot_id} - {self.movement_type}"


class Sale(models.Model):
    """
    Warehouse sale - sells from specific lot(s)
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('delivered', 'Delivered'),
        ('invoiced', 'Invoiced'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Identification
    sale_id = models.CharField(max_length=50, unique=True, db_index=True)
    sale_date = models.DateField()
    
    # Parties
    buyer_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='warehouse_purchases_as_buyer')
    warehouse = models.ForeignKey('masters.Warehouse', on_delete=models.PROTECT, related_name='sales')
    
    # Commodity
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT)
    
    # Totals (calculated from sale lots)
    total_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    sale_rate_per_mt = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    gross_profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    
    # Notes
    remarks = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-sale_date']
        indexes = [
            models.Index(fields=['sale_id']),
            models.Index(fields=['status']),
            models.Index(fields=['-sale_date']),
        ]
    
    def __str__(self):
        return f"{self.sale_id} - {self.commodity.code}"


class SaleLot(models.Model):
    """
    Which lots were used in a sale (lot allocation)
    Tracks cost per lot for profit calculation
    """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='sale_lots')
    lot = models.ForeignKey(Lot, on_delete=models.PROTECT)
    
    # Lot allocation
    quantity_taken_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    lot_cost_per_mt = models.DecimalField(max_digits=12, decimal_places=2)  # Cost at time of sale
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Sale pricing same as sale
    sale_rate_per_mt = models.DecimalField(max_digits=12, decimal_places=2)
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        ordering = ['lot']
    
    def __str__(self):
        return f"{self.sale.sale_id} ← {self.lot.lot_id}"
    
    def save(self, *args, **kwargs):
        self.total_cost = self.quantity_taken_mt * self.lot_cost_per_mt
        self.total_revenue = self.quantity_taken_mt * self.sale_rate_per_mt
        self.profit = self.total_revenue - self.total_cost
        super().save(*args, **kwargs)


class BrokeragePayable(models.Model):
    """Broker commission payable from purchases or sales"""
    STATUS_CHOICES = [
        ('outstanding', 'Outstanding'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Reference
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, null=True, blank=True, 
                                 related_name='brokerage_payables')
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, null=True, blank=True,
                            related_name='brokerage_payables')
    
    broker_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='brokerage_payables')
    
    # Type & Amount
    brokerage_type = models.CharField(max_length=50, 
                                     choices=[('per_mt', 'Per MT'), ('percentage', 'Percentage'), ('fixed', 'Fixed')])
    brokerage_rate = models.DecimalField(max_digits=10, decimal_places=4, validators=[MinValueValidator(0)])
    total_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Calculated
    gross_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    outstanding_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='outstanding')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Brokerage: {self.gross_amount}"
