from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

User = get_user_model()


class Order(models.Model):
    ORDER_TYPE_CHOICES = [
        ('purchase', 'Purchase Order'),
        ('sales', 'Sales Order'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('partially_received', 'Partially Received'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES)
    
    # Related entities
    supplier = models.ForeignKey('commodities.Supplier', on_delete=models.SET_NULL, 
                                null=True, blank=True, related_name='purchase_orders')
    customer = models.ForeignKey('commodities.Supplier', on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='sales_orders')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_orders')
    
    # Order details
    order_date = models.DateField(auto_now_add=True)
    required_date = models.DateField()
    delivery_date = models.DateField(null=True, blank=True)
    
    # Financial
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['order_type', '-order_date']),
        ]
    
    def calculate_total(self):
        self.total_amount = self.subtotal + self.tax_amount + self.shipping_cost
        return self.total_amount
    
    def __str__(self):
        return f"{self.order_number} - {self.get_order_type_display()}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT)
    
    quantity_ordered = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    quantity_received = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    line_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Specifications
    grade = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def save(self, *args, **kwargs):
        self.line_total = self.quantity_ordered * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.order.order_number} - {self.commodity.code}"


class OrderHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    action = models.CharField(max_length=100)
    old_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20, null=True, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Order Histories"
    
    def __str__(self):
        return f"{self.order.order_number} - {self.action}"


class Shipment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('shipped', 'Shipped'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    shipment_number = models.CharField(max_length=50, unique=True)
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name='shipments')
    
    tracking_number = models.CharField(max_length=100, blank=True)
    carrier = models.CharField(max_length=100, blank=True)
    
    ship_date = models.DateField()
    expected_delivery = models.DateField()
    actual_delivery = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-ship_date']
    
    def __str__(self):
        return f"{self.shipment_number} - {self.status}"
