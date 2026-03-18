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
