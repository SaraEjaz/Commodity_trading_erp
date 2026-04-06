from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()


class CommissionDeal(models.Model):
    """Commission Deal / Back-to-Back Contract"""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('partially_executed', 'Partially Executed'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
        ('suspended', 'Suspended'),
    ]
    
    # Identification
    deal_id = models.CharField(max_length=50, unique=True, db_index=True)
    deal_date = models.DateField(auto_now_add=True)
    
    # Commodity & Quantity
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.PROTECT)
    total_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    # UOF reference (master) — default MT will be set via seed/migration
    uof = models.ForeignKey('masters.UnitOfMeasure', on_delete=models.PROTECT, null=True, blank=True)
    # Total amount = commercial_rate * total_quantity_mt (stored for reporting)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    # Delivery period
    delivery_period_from = models.DateField()
    delivery_period_to = models.DateField()
    
    # Commercial rate
    commercial_rate = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Seller details
    seller_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='sold_commission_deals')
    
    # Principal buyer details
    principal_buyer_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='bought_commission_deals')
    
    # Commission settings
    commission_applicable = models.BooleanField(default=True)
    commission_basis = models.CharField(
        max_length=50,
        choices=[('per_mt', 'Per MT'), ('percentage', 'Percentage'), ('fixed', 'Fixed Amount')],
        default='per_mt'
    )
    commission_payer = models.CharField(
        max_length=50,
        choices=[('buyer', 'Buyer'), ('seller', 'Seller'), ('both', 'Both')],
        default='buyer'
    )
    buyer_side_commission_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    seller_side_commission_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Tracking
    quantity_lifted_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    quantity_remaining_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Commission tracking
    total_buyer_commission = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_seller_commission = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    commission_received = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    commission_outstanding = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Terms & status
    terms = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='open', db_index=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-deal_date']
        indexes = [
            models.Index(fields=['deal_id']),
            models.Index(fields=['status']),
            models.Index(fields=['-deal_date']),
        ]
    
    def __str__(self):
        return f"{self.deal_id} - {self.commodity.code}"
    
    def calculate_remaining_qty(self):
        """Calculate remaining quantity"""
        self.quantity_remaining_mt = self.total_quantity_mt - self.quantity_lifted_mt
        return self.quantity_remaining_mt
    
    def _update_commission_totals(self):
        """Update commission totals from ledger entries"""
        from apps.accounting.models import CommissionLedgerEntry
        
        buyer_entries = CommissionLedgerEntry.objects.filter(
            commission_deal=self, side='buyer'
        ).aggregate(total=models.Sum('gross_commission'))
        
        seller_entries = CommissionLedgerEntry.objects.filter(
            commission_deal=self, side='seller'
        ).aggregate(total=models.Sum('gross_commission'))
        
        received = CommissionLedgerEntry.objects.filter(
            commission_deal=self, payment_status='paid'
        ).aggregate(total=models.Sum('received_amount'))
        
        self.total_buyer_commission = buyer_entries['total'] or 0
        self.total_seller_commission = seller_entries['total'] or 0
        self.commission_received = received['total'] or 0
        self.commission_outstanding = (
            (self.total_buyer_commission + self.total_seller_commission) - self.commission_received
        )


class CommissionDealReceiver(models.Model):
    """Support multiple invoice parties / receivers under one deal"""
    deal = models.ForeignKey(CommissionDeal, on_delete=models.CASCADE, related_name='receivers')
    receiver_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT)
    invoice_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, null=True, blank=True, related_name='commission_invoices')
    payment_responsibility_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, null=True, blank=True, related_name='commission_payment_responsibility')
    
    # Allocation
    expected_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    lifted_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    remaining_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['receiver_party']
    
    def __str__(self):
        return f"{self.deal.deal_id} → {self.receiver_party.party_code}"


class CommissionLifting(models.Model):
    """Lifting/Dispatch transaction - main transaction for commission deals"""
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('disputed', 'Disputed'),
    ]
    
    # Identification
    lifting_id = models.CharField(max_length=50, unique=True, db_index=True)
    deal = models.ForeignKey(CommissionDeal, on_delete=models.PROTECT, related_name='liftings')
    lifting_date = models.DateField(auto_now_add=True)
    
    # Lifting details
    quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    principal_buyer = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='received_liftings')
    receiver_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='commission_liftings')
    invoice_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='commission_invoiced_liftings')
    payment_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='commission_payment_liftings')
    
    # Transaction references
    vehicle_no = models.CharField(max_length=100, blank=True)
    weighbridge_reference = models.CharField(max_length=100, blank=True)
    
    # Commission amounts (auto-calculated)
    buyer_commission = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    seller_commission = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status & tracking
    payment_status = models.CharField(max_length=50, choices=PAYMENT_STATUS_CHOICES, default='pending')
    posting_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-lifting_date']
        indexes = [
            models.Index(fields=['lifting_id']),
            models.Index(fields=['deal']),
            models.Index(fields=['-lifting_date']),
        ]
    
    def __str__(self):
        return f"{self.lifting_id} - {self.quantity_mt} MT"


class CommissionAllocation(models.Model):
    """Allocation for exceptional cases (multiple buys → multiple sales)"""
    STATUS_CHOICES = [
        ('allocated', 'Allocated'),
        ('partially_executed', 'Partially Executed'),
        ('fully_executed', 'Fully Executed'),
        ('cancelled', 'Cancelled'),
    ]
    
    purchase_deal = models.ForeignKey(CommissionDeal, on_delete=models.CASCADE, related_name='allocation_source')
    sales_deals = models.ManyToManyField(CommissionDeal, related_name='allocation_targets')
    
    allocated_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    executed_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    remaining_quantity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='allocated')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Alloc {self.pk}: {self.allocated_quantity_mt} MT"
