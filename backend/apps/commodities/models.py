from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Commodity(models.Model):
    UNIT_CHOICES = [
        ('MT', 'Metric Ton'),
        ('TON', 'Ton'),
        ('KG', 'Kilogram'),
        ('LB', 'Pound'),
        ('BBL', 'Barrel'),
        ('GAL', 'Gallon'),
        ('L', 'Liter'),
        ('UNIT', 'Unit'),
    ]
    
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='commodities')
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='MT')
    
    # Pricing
    base_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    
    # Specifications
    grade = models.CharField(max_length=50, blank=True)
    purity = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, 
                                  validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['code']
        indexes = [models.Index(fields=['code']), models.Index(fields=['category'])]
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class PriceHistory(models.Model):
    commodity = models.ForeignKey(Commodity, on_delete=models.CASCADE, related_name='price_history')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    high_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    low_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    volume = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [models.Index(fields=['commodity', '-timestamp'])]
        verbose_name_plural = "Price Histories"
    
    def __str__(self):
        return f"{self.commodity.code} - {self.price} @ {self.timestamp}"


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    country = models.CharField(max_length=100)
    
    # Rating and status
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0,
                                 validators=[MinValueValidator(0), MaxValueValidator(5)])
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class SupplierCommodity(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='commodities')
    commodity = models.ForeignKey(Commodity, on_delete=models.CASCADE, related_name='suppliers')
    supplier_code = models.CharField(max_length=100, blank=True)
    min_order_quantity = models.DecimalField(max_digits=15, decimal_places=2)
    lead_time_days = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['supplier', 'commodity']
    
    def __str__(self):
        return f"{self.supplier.name} - {self.commodity.code}"
