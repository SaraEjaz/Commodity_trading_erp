from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Settlement(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    settlement_id = models.CharField(max_length=50, unique=True, db_index=True)
    trade = models.ForeignKey('trading.Trade', on_delete=models.PROTECT, related_name='settlements')
    
    settlement_date = models.DateField()
    due_date = models.DateField()
    actual_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Financial details
    gross_amount = models.DecimalField(max_digits=15, decimal_places=2)
    commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Payment details
    payment_method = models.CharField(max_length=50, blank=True)
    bank_account = models.CharField(max_length=100, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    
    notes = models.TextField(blank=True)
    documents = models.JSONField(default=list, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-settlement_date']
        indexes = [
            models.Index(fields=['settlement_id']),
            models.Index(fields=['status']),
            models.Index(fields=['settlement_date']),
        ]
    
    def save(self, *args, **kwargs):
        self.net_amount = self.gross_amount - self.commission - self.fees
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.settlement_id} - {self.status}"


class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('settlement', 'Settlement'),
        ('commission', 'Commission'),
        ('expense', 'Expense'),
        ('refund', 'Refund'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    payment_id = models.CharField(max_length=50, unique=True)
    settlement = models.ForeignKey(Settlement, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    payer = models.CharField(max_length=200)
    payee = models.CharField(max_length=200)
    
    payment_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    payment_method = models.CharField(max_length=50)
    bank_reference = models.CharField(max_length=100, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date']
        indexes = [models.Index(fields=['payment_id']), models.Index(fields=['status'])]
    
    def __str__(self):
        return f"{self.payment_id} - {self.amount} {self.currency}"


class BankAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('money_market', 'Money Market'),
        ('investment', 'Investment'),
    ]
    
    name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50, unique=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    
    bank_name = models.CharField(max_length=200)
    bank_code = models.CharField(max_length=20)
    swift_code = models.CharField(max_length=20, blank=True)
    iban = models.CharField(max_length=50, blank=True)
    
    currency = models.CharField(max_length=3, default='USD')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.account_number})"


class SettlementAllocation(models.Model):
    settlement = models.ForeignKey(Settlement, on_delete=models.CASCADE, related_name='allocations')
    account = models.ForeignKey(BankAccount, on_delete=models.PROTECT)
    
    allocated_amount = models.DecimalField(max_digits=15, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['settlement', 'account']
    
    def __str__(self):
        return f"{self.settlement.settlement_id} - {self.account.name}"


class SettlementHistory(models.Model):
    settlement = models.ForeignKey(Settlement, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    action = models.CharField(max_length=100)
    old_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20, null=True, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Settlement Histories"
    
    def __str__(self):
        return f"{self.settlement.settlement_id} - {self.action}"
