from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

User = get_user_model()


class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    address = models.TextField()
    capacity = models.DecimalField(max_digits=15, decimal_places=2, help_text="Capacity in default unit")
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_warehouses')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class InventoryLocation(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='locations')
    code = models.CharField(max_length=50)
    section = models.CharField(max_length=50)
    aisle = models.CharField(max_length=50)
    rack = models.CharField(max_length=50)
    shelf = models.CharField(max_length=50)
    
    capacity = models.DecimalField(max_digits=15, decimal_places=2)
    used_space = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ['warehouse', 'code']
        ordering = ['warehouse', 'code']
    
    def __str__(self):
        return f"{self.warehouse.name} - {self.code}"


class Stock(models.Model):
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT, related_name='stocks')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='stocks')
    location = models.ForeignKey(InventoryLocation, on_delete=models.SET_NULL, null=True, blank=True)
    
    quantity_on_hand = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    quantity_reserved = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    quantity_available = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    reorder_point = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reorder_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    last_counted = models.DateField(null=True, blank=True)
    last_received = models.DateField(null=True, blank=True)
    last_issued = models.DateField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['commodity', 'warehouse']
        ordering = ['commodity', 'warehouse']
        indexes = [models.Index(fields=['commodity', 'warehouse'])]
    
    def save(self, *args, **kwargs):
        self.quantity_available = self.quantity_on_hand - self.quantity_reserved
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.commodity.code} @ {self.warehouse.name}"


class StockMovement(models.Model):
    MOVEMENT_TYPE_CHOICES = [
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
        ('adjustment', 'Adjustment'),
        ('transfer', 'Transfer'),
        ('damaged', 'Damaged'),
        ('expired', 'Expired'),
    ]
    
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    
    quantity = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    reference_type = models.CharField(max_length=50, blank=True)  # e.g., 'PO', 'SO', 'Transfer'
    reference_number = models.CharField(max_length=50, blank=True)
    
    from_location = models.ForeignKey(InventoryLocation, on_delete=models.SET_NULL, 
                                     null=True, blank=True, related_name='outbound_movements')
    to_location = models.ForeignKey(InventoryLocation, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='inbound_movements')
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['stock', '-created_at'])]
    
    def __str__(self):
        return f"{self.movement_type} - {self.stock.commodity.code}"


class StockAdjustment(models.Model):
    REASON_CHOICES = [
        ('recount', 'Recount'),
        ('damage', 'Damage'),
        ('loss', 'Loss'),
        ('error', 'Error in Recording'),
        ('expiry', 'Expiry'),
        ('other', 'Other'),
    ]
    
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='adjustments')
    adjustment_date = models.DateField(auto_now_add=True)
    
    quantity_before = models.DecimalField(max_digits=15, decimal_places=2)
    quantity_after = models.DecimalField(max_digits=15, decimal_places=2)
    variance = models.DecimalField(max_digits=15, decimal_places=2)
    
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    notes = models.TextField(blank=True)
    
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_adjustments')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_adjustments')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-adjustment_date']
    
    def __str__(self):
        return f"{self.stock.commodity.code} adjustment - {self.variance}"


class InventoryValuation(models.Model):
    VALUATION_METHOD_CHOICES = [
        ('fifo', 'FIFO'),
        ('lifo', 'LIFO'),
        ('weighted', 'Weighted Average'),
    ]
    
    stock = models.OneToOneField(Stock, on_delete=models.CASCADE, related_name='valuation')
    valuation_date = models.DateField(auto_now_add=True)
    
    quantity = models.DecimalField(max_digits=15, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total_value = models.DecimalField(max_digits=15, decimal_places=2)
    
    method = models.CharField(max_length=20, choices=VALUATION_METHOD_CHOICES, default='weighted')
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        self.total_value = self.quantity * self.unit_cost
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.stock.commodity.code} - {self.total_value}"
