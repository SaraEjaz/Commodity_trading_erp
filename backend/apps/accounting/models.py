from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()


class CommissionLedgerEntry(models.Model):
    """
    Commission ledger - tracks commission receivable/payable per party
    Created automatically when a lifting is posted
    """
    SIDE_CHOICES = [
        ('buyer', 'Buyer Side Commission'),
        ('seller', 'Seller Side Commission'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('outstanding', 'Outstanding'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('disputed', 'Disputed'),
        ('cancelled', 'Cancelled'),
    ]
    
    COMMISSION_TYPE_CHOICES = [
        ('per_mt', 'Per MT'),
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed'),
    ]
    
    # Identification
    ledger_entry_no = models.CharField(max_length=50, unique=True, db_index=True)
    
    # References
    commission_deal = models.ForeignKey('commission.CommissionDeal', on_delete=models.PROTECT, related_name='ledger_entries')
    commission_lifting = models.ForeignKey('commission.CommissionLifting', on_delete=models.PROTECT, null=True, blank=True)
    party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='commission_ledger_entries')
    
    # Commission details
    side = models.CharField(max_length=20, choices=SIDE_CHOICES)  # buyer or seller
    commission_type = models.CharField(max_length=20, choices=COMMISSION_TYPE_CHOICES)
    
    # Amounts
    gross_commission = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    cpr_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)], 
                                     help_text="CPR/Withholding deducted")
    net_receivable = models.DecimalField(max_digits=15, decimal_places=2, 
                                         help_text="gross_commission - cpr_amount")
    received_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, 
                                          validators=[MinValueValidator(0)])
    outstanding_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Status
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='outstanding', db_index=True)
    posting_date = models.DateField(auto_now_add=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-posting_date']
        indexes = [
            models.Index(fields=['ledger_entry_no']),
            models.Index(fields=['commission_deal', 'side']),
            models.Index(fields=['party']),
            models.Index(fields=['payment_status']),
        ]
        verbose_name_plural = "Commission Ledger Entries"
    
    def __str__(self):
        return f"{self.ledger_entry_no} - {self.party.party_code}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate net_receivable
        self.net_receivable = self.gross_commission - self.cpr_amount
        self.outstanding_amount = self.net_receivable - self.received_amount
        super().save(*args, **kwargs)


class PartyLedgerEntry(models.Model):
    """
    Running balance ledger for all parties
    Tracks debit/credit transactions from all sources:
    - Commission deals
    - Trading deals
    - Payments received/made
    - Adjustments
    """
    ENTRY_TYPE_CHOICES = [
        ('commission_lifting', 'Commission Lifting'),
        ('commission_receipt', 'Commission Receipt'),
        ('trading_sale', 'Trading Sale'),
        ('trading_purchase', 'Trading Purchase'),
        ('payment_received', 'Payment Received'),
        ('payment_made', 'Payment Made'),
        ('third_party_settlement', 'Third Party Settlement'),
        ('adjustment', 'Adjustment/Journal'),
        ('opening_balance', 'Opening Balance'),
    ]
    
    BUSINESS_LINE_CHOICES = [
        ('trading', 'Trading'),
        ('commission', 'Commission'),
        ('both', 'Both'),
    ]
    
    # Identification
    ledger_entry_no = models.CharField(max_length=50, unique=True, db_index=True)
    entry_date = models.DateField(auto_now_add=True)
    
    # Party & Ledger
    party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='ledger_entries')
    entry_type = models.CharField(max_length=50, choices=ENTRY_TYPE_CHOICES, db_index=True)
    business_line = models.CharField(max_length=20, choices=BUSINESS_LINE_CHOICES, default='both')
    
    # References - flexible for any transaction type
    commission_deal = models.ForeignKey('commission.CommissionDeal', on_delete=models.SET_NULL, null=True, blank=True)
    commission_lifting = models.ForeignKey('commission.CommissionLifting', on_delete=models.SET_NULL, null=True, blank=True)
    trading_purchase = models.ForeignKey('trading.Purchase', on_delete=models.SET_NULL, null=True, blank=True)
    trading_sale = models.ForeignKey('trading.Sale', on_delete=models.SET_NULL, null=True, blank=True)
    payment_received = models.ForeignKey('PaymentReceived', on_delete=models.SET_NULL, null=True, blank=True)
    payment_made = models.ForeignKey('PaymentMade', on_delete=models.SET_NULL, null=True, blank=True)
    settlement = models.ForeignKey('ThirdPartySettlement', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Amounts
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    running_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Notes
    description = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-entry_date']
        indexes = [
            models.Index(fields=['ledger_entry_no']),
            models.Index(fields=['party', '-entry_date']),
            models.Index(fields=['entry_type']),
            models.Index(fields=['business_line']),
        ]
    
    def __str__(self):
        return f"{self.ledger_entry_no} - {self.party.party_code}"


class PaymentReceived(models.Model):
    """
    Payment received from a party
    Can be allocated to multiple deals/invoices
    """
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('third_party', 'Third Party Payment'),
        ('adjustment', 'Adjustment/Credit'),
    ]
    
    STATUS_CHOICES = [
        ('recorded', 'Recorded'),
        ('allocated', 'Allocated'),
        ('reconciled', 'Reconciled'),
        ('disputed', 'Disputed'),
        ('reversed', 'Reversed'),
    ]
    
    # Identification
    payment_ref = models.CharField(max_length=50, unique=True, db_index=True)
    party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='payments_received')
    
    # Payment details
    payment_date = models.DateField()
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)
    
    # Bank/Cash account (if bank transfer or cash)
    bank_account = models.ForeignKey('masters.BankAccount', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Amounts
    gross_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.01)])
    cpr_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)],
                                     help_text="CPR/Withholding deducted by party")
    net_amount_received = models.DecimalField(max_digits=15, decimal_places=2,
                                              help_text="gross_amount - cpr_amount")
    
    # Reference info
    cheque_number = models.CharField(max_length=50, blank=True)
    certificate_reference = models.CharField(max_length=100, blank=True, help_text="CPR certificate number if applicable")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='recorded', db_index=True)
    notes = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['payment_ref']),
            models.Index(fields=['party', '-payment_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.payment_ref} - {self.party.party_code}"
    
    def save(self, *args, **kwargs):
        self.net_amount_received = self.gross_amount - self.cpr_amount
        super().save(*args, **kwargs)


class PaymentMade(models.Model):
    """
    Payment made to a party (supplier, broker, etc.)
    """
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('adjustment', 'Adjustment/Debit'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('made', 'Made'),
        ('reconciled', 'Reconciled'),
        ('disputed', 'Disputed'),
        ('reversed', 'Reversed'),
    ]
    
    # Identification
    payment_ref = models.CharField(max_length=50, unique=True, db_index=True)
    party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='payments_made')
    
    # Payment details
    payment_date = models.DateField()
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)
    
    # Bank/Cash account
    bank_account = models.ForeignKey('masters.BankAccount', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Amounts
    gross_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.01)])
    cpr_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    net_amount_paid = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Reference
    cheque_number = models.CharField(max_length=50, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    notes = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['payment_ref']),
            models.Index(fields=['party', '-payment_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.payment_ref} - {self.party.party_code}"
    
    def save(self, *args, **kwargs):
        self.net_amount_paid = self.gross_amount - self.cpr_amount
        super().save(*args, **kwargs)


class PaymentAllocation(models.Model):
    """
    Allocation of payments to deals/invoices/transactions
    Flexible allocation linking
    """
    ALLOCATION_STATUS_CHOICES = [
        ('allocated', 'Allocated'),
        ('partial', 'Partial'),
        ('full', 'Full'),
        ('reversed', 'Reversed'),
    ]
    
    # Payment reference
    payment_received = models.ForeignKey(PaymentReceived, on_delete=models.CASCADE, null=True, blank=True,
                                        related_name='allocations')
    payment_made = models.ForeignKey(PaymentMade, on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='allocations')
    
    # Allocation target  
    commission_deal = models.ForeignKey('commission.CommissionDeal', on_delete=models.SET_NULL, null=True, blank=True)
    commission_ledger_entry = models.ForeignKey(CommissionLedgerEntry, on_delete=models.SET_NULL, null=True, blank=True)
    trading_sale = models.ForeignKey('trading.Sale', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Amount
    allocation_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.01)])
    
    # Status
    allocation_status = models.CharField(max_length=20, choices=ALLOCATION_STATUS_CHOICES, default='allocated')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Alloc: {self.allocation_amount}"


class ThirdPartySettlement(models.Model):
    """
    Third-party settlement transactions
    When amount is collected on behalf of someone else
    """
    STATUS_CHOICES = [
        ('recorded', 'Recorded'),
        ('recovered', 'Recovered'),
        ('paid_back', 'Paid Back'),
        ('disputed', 'Disputed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Parties
    original_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='settlement_original')
    third_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='settlement_intermediary')
    
    # Settlement details
    settlement_date = models.DateField()
    settlement_reason = models.CharField(max_length=255)
    gross_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    
    # References
    instruction_reference = models.CharField(max_length=100, blank=True)
    related_commission_deal = models.ForeignKey('commission.CommissionDeal', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='recorded')
    remarks = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-settlement_date']
        indexes = [
            models.Index(fields=['original_party', 'third_party']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Settlement: {self.original_party.party_code} via {self.third_party.party_code}"


class CPREntry(models.Model):
    """
    CPR (Withholding Tax) tracking
    Deducted from payments, reconciled with tax authority
    """
    # Reference to original party ledger or payment
    payment_received = models.OneToOneField(PaymentReceived, on_delete=models.CASCADE, null=True, blank=True,
                                           related_name='cpr_entry')
    commission_ledger_entry = models.OneToOneField(CommissionLedgerEntry, on_delete=models.CASCADE, null=True, blank=True,
                                                   related_name='cpr_entry')
    
    # CPR details
    party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='cpr_entries')
    cpr_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    cpr_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Reconciliation
    certificate_number = models.CharField(max_length=100, blank=True, help_text="Tax authority certificate number")
    posted_to_authority = models.BooleanField(default=False)
    posted_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"CPR: {self.cpr_amount} - {self.party.party_code}"


class JournalEntry(models.Model):
    """
    Manual adjustment/correction journal entries (admin only)
    """
    ENTRY_TYPE_CHOICES = [
        ('correction', 'Correction'),
        ('write_off', 'Write-off'),
        ('adjustment', 'Adjustment'),
        ('accrual', 'Accrual'),
        ('reversal', 'Reversal'),
    ]
    
    journal_ref = models.CharField(max_length=50, unique=True, db_index=True)
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPE_CHOICES)
    
    # Parties affected
    debit_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='journal_debit')
    credit_party = models.ForeignKey('masters.Party', on_delete=models.PROTECT, related_name='journal_credit')
    
    # Amount
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.01)])
    
    # Notes
    reason = models.TextField(help_text="Why is this journal entry needed?")
    remarks = models.TextField(blank=True)
    
    # Approval
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_journals')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_journals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['journal_ref']),
            models.Index(fields=['is_approved']),
        ]
    
    def __str__(self):
        return f"{self.journal_ref} - {self.entry_type}"
