from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, RegexValidator
from decimal import Decimal

User = get_user_model()


class Party(models.Model):
    """Master table for parties (buyers, sellers, brokers, agents, receivers)"""
    PARTY_TYPE_CHOICES = [
        ('supplier', 'Supplier'),
        ('buyer', 'Buyer'),
        ('broker', 'Broker'),
        ('agent', 'Agent'),
        ('receiver', 'Receiver'),
        ('other', 'Other'),
    ]
    
    BUSINESS_LINE_CHOICES = [
        ('trading', 'Trading (Warehouse Inventory)'),
        ('commission', 'Commission (Back-to-Back)'),
        ('both', 'Both Trading & Commission'),
    ]
    
    # Identification
    party_code = models.CharField(max_length=50, unique=True, db_index=True)
    party_name = models.CharField(max_length=200)
    party_type = models.CharField(max_length=50, choices=PARTY_TYPE_CHOICES)
    business_line_tag = models.CharField(max_length=50, choices=BUSINESS_LINE_CHOICES, default='both')
    
    # Contact details
    contact_person = models.CharField(max_length=150, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')],
        blank=True
    )
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='Pakistan')
    
    # Tax details
    ntn = models.CharField(max_length=50, blank=True, verbose_name='NTN (Tax ID)')
    strn = models.CharField(max_length=50, blank=True, verbose_name='STRN (Sales Tax Registration)')
    
    # Accounting fields
    cpr_applicable = models.BooleanField(default=False, verbose_name='CPR/Withholding Applicable')
    cpr_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)],
        verbose_name='CPR Percentage'
    )
    payment_terms = models.CharField(max_length=200, blank=True, help_text='e.g., Net 30 Days')
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Banking
    default_bank_account = models.ForeignKey('BankAccount', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_parties')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['party_code']
        indexes = [
            models.Index(fields=['party_code']),
            models.Index(fields=['party_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.party_code} - {self.party_name}"


class Warehouse(models.Model):
    """Warehouse/inventory location master"""
    warehouse_code = models.CharField(max_length=50, unique=True, db_index=True)
    warehouse_name = models.CharField(max_length=200)
    location = models.TextField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_warehouses')
    
    # Storage capacity
    total_capacity_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    current_stock_mt = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Status
    is_active = models.BooleanField(default=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['warehouse_code']
        indexes = [models.Index(fields=['warehouse_code']), models.Index(fields=['is_active'])]
    
    def __str__(self):
        return f"{self.warehouse_code} - {self.warehouse_name}"


class BankAccount(models.Model):
    """Bank/Cash accounts for payments and receipts"""
    ACCOUNT_TYPE_CHOICES = [
        ('bank', 'Bank Account'),
        ('cash', 'Cash Account'),
        ('check', 'Check Account'),
    ]
    
    account_code = models.CharField(max_length=50, unique=True, db_index=True)
    account_name = models.CharField(max_length=200)
    account_type = models.CharField(max_length=50, choices=ACCOUNT_TYPE_CHOICES)
    
    # Bank details
    bank_name = models.CharField(max_length=200, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    iban = models.CharField(max_length=100, blank=True, verbose_name='IBAN')
    swift_code = models.CharField(max_length=20, blank=True)
    branch = models.CharField(max_length=200, blank=True)
    
    # Balances
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text='Default account for payments')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['account_code']
        indexes = [models.Index(fields=['account_code']), models.Index(fields=['is_active'])]
    
    def __str__(self):
        return f"{self.account_code} - {self.account_name}"


class CommissionRule(models.Model):
    """Rules for automatic commission calculation"""
    COMMISSION_TYPE_CHOICES = [
        ('per_mt', 'Per MT'),
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    
    PAYER_TYPE_CHOICES = [
        ('buyer', 'Buyer'),
        ('seller', 'Seller'),
        ('both', 'Both (split)'),
    ]
    
    rule_name = models.CharField(max_length=200)
    party = models.ForeignKey(Party, on_delete=models.CASCADE, related_name='commission_rules', null=True, blank=True)
    commodity = models.ForeignKey('commodities.Commodity', on_delete=models.CASCADE, null=True, blank=True)
    
    # Validity
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)
    
    # Commission settings
    commission_type = models.CharField(max_length=50, choices=COMMISSION_TYPE_CHOICES)
    rate_or_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    payer_type = models.CharField(max_length=50, choices=PAYER_TYPE_CHOICES, default='buyer')
    
    # Status
    is_active = models.BooleanField(default=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-valid_from', 'rule_name']
        indexes = [models.Index(fields=['party']), models.Index(fields=['commodity']), models.Index(fields=['is_active'])]
    
    def __str__(self):
        return f"{self.rule_name} ({self.commission_type})"
    
    def is_valid_today(self):
        """Check if rule is valid on today's date"""
        from datetime import date
        today = date.today()
        return self.valid_from <= today and (self.valid_to is None or today <= self.valid_to)
