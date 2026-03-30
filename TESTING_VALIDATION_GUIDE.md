# Commodity Trading ERP - Testing & Validation Guide

## Phase 7: Testing

### Unit Testing

#### Backend (Django)

```bash
# Create test directory structure
mkdir -p backend/apps/{users,trading,commission,accounting}/tests

# Run tests
python manage.py test apps.users
python manage.py test apps.trading
python manage.py test apps.commission
python manage.py test apps.accounting
```

#### Key Test Scenarios

**Users & Authentication Tests**
```python
# Test user creation with roles
# Test module access assignment
# Test JWT token generation with module info
# Test permission classes

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import Role, ModuleAccess

class UserAuthTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.role = Role.objects.create(name='trading_user')
        self.module_access = ModuleAccess.objects.create(
            user=self.user,
            module='trading'
        )
    
    def test_user_created_successfully(self):
        self.assertEqual(self.user.email, 'test@example.com')
    
    def test_module_access_created(self):
        self.assertTrue(self.user.has_module_access('trading'))
    
    def test_jwt_token_includes_module_access(self):
        # Test CustomTokenObtainPairView
        pass
```

**Trading Tests**
```python
class PurchaseTests(TestCase):
    def test_purchase_creation(self):
        # Create purchase, verify fields
        pass
    
    def test_purchase_to_lot_conversion(self):
        # Post purchase → create lot
        pass
    
    def test_lot_quantity_tracking(self):
        # Create lot, allocate to sale, verify balance
        pass
    
    def test_sale_with_lot_allocation(self):
        # Create sale, allocate lots, post, verify quantities
        pass

class TradingEngineTests(TestCase):
    def test_post_purchase_creates_lot(self):
        from apps.trading.services import TradingEngine
        purchase = Purchase.objects.create(...)
        result = TradingEngine.post_purchase(purchase.id)
        self.assertIsNotNone(result['lot'])
    
    def test_post_sale_updates_lot_balance(self):
        # Verify lot balance decrements correctly
        pass
    
    def test_inventory_summary_calculation(self):
        # Create multiple lots, verify summary metrics
        pass
```

**Commission Tests**
```python
class CommissionDealTests(TestCase):
    def test_deal_creation(self):
        # Create deal with all required fields
        pass
    
    def test_lifting_creation_posts_commission(self):
        # Create lifting → verify ledger entry created
        pass
    
    def test_commission_calculation(self):
        # Test per_mt, percentage, fixed commission types
        pass
    
    def test_cpr_withholding(self):
        # Verify CPR deduction from commission
        pass

class CommissionEngineTests(TestCase):
    def test_commission_rule_matching(self):
        from apps.commission.services import CommissionEngine
        # Match rule by party, commodity, date
        pass
    
    def test_get_deal_summary(self):
        # Aggregate deal data with liftings
        pass
```

**Accounting Tests**
```python
class LedgerTests(TestCase):
    def test_party_ledger_posting(self):
        # Create entry, verify balance updated
        pass
    
    def test_payment_allocation(self):
        # Receive payment, allocate to deals/commissions
        pass
    
    def test_payment_reconciliation(self):
        # Verify payment amounts match allocations
        pass
```

### Integration Testing

```bash
# End-to-end workflow tests
python manage.py test --verbosity=2
```

**Key E2E Flows**

1. **Trading Purchase → Sale Flow**
   ```
   Create Purchase 
   → Confirm Purchase (creates Lot)
   → Create Sale with Lot Allocation
   → Post Sale (updates Lot balance)
   → Verify ledger entries
   ```

2. **Commission Deal → Lifting → Payment Flow**
   ```
   Create Commission Deal (seller, buyer, commodity)
   → Create Lifting (post to ledger, calc commission)
   → Verify Commission Ledger Entry (buyer/seller commission)
   → Receive Payment with CPR
   → Verify Party Ledger updated
   ```

3. **Multi-Party Deal Flow**
   ```
   Create Deal (seller → principal buyer)
   → Add Multiple Receivers
   → Create Liftings for each receiver
   → Allocate sales across buyers
   → Verify all parties get correct commission
   ```

### Frontend Testing (Next.js)

```bash
# Frontend tests
npm run test
```

**Key Frontend Tests**
- Module access guard (redirect if no access)
- List pages load data correctly
- CRUD operations work
- Form validation
- Error handling
- Loading states

### API Testing

Use Postman/Insomnia collections or write test scripts:

```python
import requests
import json

BASE_URL = 'http://localhost:8000/api'
TOKEN = 'your-jwt-token'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Test Purchase API
def test_purchase_api():
    # Create purchase
    purchase_data = {
        'purchase_id': 'PUR-001',
        'purchase_date': '2024-01-15',
        'supplier_party_id': 1,
        'warehouse_id': 1,
        'commodity_id': 1,
        'quantity_mt': 100,
        'rate_per_mt': 50000
    }
    
    response = requests.post(
        f'{BASE_URL}/trading/purchases/',
        json=purchase_data,
        headers=headers
    )
    assert response.status_code == 201
    assert 'id' in response.json()

# Test Commission API
def test_commission_deal_api():
    deal_data = {
        'deal_id': 'DEAL-001',
        'deal_date': '2024-01-15',
        'commodity_id': 1,
        'total_quantity_mt': 500,
        'seller_party_id': 1,
        'principal_buyer_party_id': 2,
        'commission_applicable': True,
        'commission_basis': 'per_mt',
        'buyer_side_commission_rate': 100,
        'seller_side_commission_rate': 50
    }
    
    response = requests.post(
        f'{BASE_URL}/commission/deals/',
        json=deal_data,
        headers=headers
    )
    assert response.status_code == 201

# Test Report API
def test_report_api():
    response = requests.get(
        f'{BASE_URL}/commission/reports/deal_balance_report/',
        headers=headers
    )
    assert response.status_code == 200
    assert 'total_deals' in response.json()
```

---

## Phase 8: Validation Checklist

### Data Integrity

- [ ] Lot quantities never exceed original purchase quantity
- [ ] Sale quantities never exceed available lot quantities
- [ ] Commission calculations match deal parameters
- [ ] CPR withholding applied correctly (2% or configured %)
- [ ] Payment allocations don't exceed outstanding amounts
- [ ] Ledger balances reconcile across all parties
- [ ] Dates are consistent (inward ≤ sale date ≤ today)
- [ ] Negative quantities are rejected

#### Validation Queries

```python
# Verify lot balance integrity
from django.db.models import F, Sum
from apps.trading.models import Lot, SaleLot

# Check if balance = original - sold
problematic_lots = Lot.objects.annotate(
    calculated_balance=F('original_quantity_mt') - F('sold_quantity_mt')
).filter(balance_quantity_mt__ne=F('calculated_balance'))

print(f"Lots with balance mismatch: {len(problematic_lots)}")

# Verify ledger balance
from apps.accounting.models import PartyLedgerEntry
from django.db.models import Sum, Q

parties = Party.objects.all()
for party in parties:
    ledger = PartyLedgerEntry.objects.filter(party=party)
    total_debit = ledger.aggregate(Sum('debit_amount'))['debit_amount__sum'] or 0
    total_credit = ledger.aggregate(Sum('credit_amount'))['credit_amount__sum'] or 0
    balance = total_debit - total_credit
    print(f"{party.party_name}: {balance}")
```

### Business Logic

- [ ] Purchase confirmation creates lot with correct cost
- [ ] Sale posting updates all related lot balances
- [ ] Lifting automatically calculates commission
- [ ] Commission ledger shows correct buyer/seller split
- [ ] Payment allocation reduces outstanding balances
- [ ] Third-party settlement recorded correctly

#### Business Logic Test Cases

```python
def test_purchase_to_lot_cost_calculation():
    """
    Purchase: 100 MT @ 50,000/MT + freight 5,000
    Expected Lot Cost: (100 * 50,000 + 5,000) / 100 = 50,050/MT
    """
    purchase = Purchase.objects.create(
        purchase_id='PUR-001',
        quantity_mt=100,
        rate_per_mt=50000,
        total_value=5000000
    )
    
    PurchaseCost.objects.create(
        purchase=purchase,
        cost_type='freight',
        amount=5000
    )
    
    TradingEngine.post_purchase(purchase.id)
    lot = purchase.created_lot
    
    assert lot.landed_cost_per_mt == 50050
    assert lot.total_cost == 5005000

def test_commission_calculation_per_mt():
    """
    Lifting: 50 MT
    Commission: 100/MT for buyer
    Expected: 50 * 100 = 5,000
    """
    deal = CommissionDeal.objects.create(
        deal_id='DEAL-001',
        total_quantity_mt=500,
        buyer_side_commission_rate=100,
        commission_basis='per_mt'
    )
    
    lifting = CommissionLifting.objects.create(
        deal=deal,
        quantity_mt=50,
        lifting_id='LIFT-001'
    )
    
    CommissionEngine.post_lifting(lifting.id)
    ledger = CommissionLedgerEntry.objects.get(
        commission_lifting=lifting,
        side='buyer'
    )
    
    assert ledger.gross_commission == 5000

def test_cpr_withholding_2_percent():
    """
    Commission: 10,000
    CPR Rate: 2%
    Expected CPR: 200
    Expected Net: 9,800
    """
    ledger = CommissionLedgerEntry.objects.create(
        gross_commission=10000,
        cpr_percentage=2
    )
    ledger.save()
    
    expected_cpr = 10000 * 0.02
    assert ledger.cpr_amount == expected_cpr
    assert ledger.net_receivable == 10000 - expected_cpr
```

### Permission & Security

- [ ] Users without 'trading' module can't access purchase/sale APIs
- [ ] Users without 'commission' module can't access deal APIs
- [ ] Manager role can view but not edit others' transactions
- [ ] Admin role can view and edit all
- [ ] Viewer role can only view (read-only)
- [ ] Passwords hashed correctly
- [ ] JWT tokens expire correctly
- [ ] Delete operations cascade properly

#### Permission Test

```python
def test_module_access_prevents_api_access():
    # Create user without trading module
    user = User.objects.create_user(email='viewer@test.com')
    ModuleAccess.objects.create(user=user, module='commission')
    
    # Try to access trading API
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get('/api/trading/purchases/')
    assert response.status_code == 403  # Forbidden
```

### Performance

- [ ] List endpoints paginate (max 100 items)
- [ ] Filters use database indexes
- [ ] Reports queries use aggregation (not N+1)
- [ ] Large lot movements (1000+ lines) don't timeout
- [ ] Concurrent requests don't cause conflicts

#### Performance Test

```python
import time
from django.test import TestCase
from django.db import connection
from django.test.utils import override_settings

class PerformanceTests(TestCase):
    @override_settings(DEBUG=True)
    def test_lot_list_query_efficiency(self):
        # Create 1000 lots
        for i in range(1000):
            Lot.objects.create(...)
        
        # Reset queries
        connection.queries_log.clear()
        
        # Execute list query
        start = time.time()
        lots = Lot.objects.select_related(
            'commodity', 'warehouse'
        )[:100]
        list(lots)
        duration = time.time() - start
        
        # Should be <100ms
        assert duration < 1.0
        # Should use <5 queries (with select_related)
        assert len(connection.queries) < 5
```

### Error Handling

- [ ] Invalid dates rejected with clear error
- [ ] Duplicate IDs rejected
- [ ] Negative quantities rejected
- [ ] Over-allocation detected (qty > available)
- [ ] Orphaned records handled (deleted party)
- [ ] Concurrent edits don't cause conflicts

#### Error Test

```python
def test_sale_qty_exceeds_lot_balance():
    """Prevent overselling from lot"""
    lot = Lot.objects.create(
        lot_id='LOT-001',
        balance_quantity_mt=100
    )
    
    sale = Sale.objects.create(sale_id='SALE-001')
    
    # Try to allocate 150 MT from 100 MT lot
    with self.assertRaises(ValidationError):
        SaleLot.objects.create(
            sale=sale,
            lot=lot,
            quantity_taken_mt=150  # Error!
        )
```

### Reporting Validation

- [ ] Deal Balance report sums correctly
- [ ] Commission statements net out to zero (gross - received = outstanding)
- [ ] Inventory valuation matches lot totals
- [ ] Sales profit calculated correctly (revenue - cost)
- [ ] Brokerage amounts match purchase/sale rates

#### Report Test

```python
def test_commission_statement_reconciliation():
    """Verify: gross - received = outstanding"""
    party = Party.objects.create(party_code='P001')
    
    entries = CommissionLedgerEntry.objects.filter(party=party)
    
    total_gross = entries.aggregate(Sum('gross_commission'))['gross_commission__sum'] or 0
    total_received = entries.aggregate(Sum('received_amount'))['received_amount__sum'] or 0
    total_outstanding = entries.aggregate(Sum('outstanding_amount'))['outstanding_amount__sum'] or 0
    
    # Should reconcile
    assert total_outstanding == total_gross - total_received
```

---

## Deployment Checklist

- [ ] All migrations applied (`python manage.py migrate`)
- [ ] Static files collected (`python manage.py collectstatic`)
- [ ] Test data population ran (`python manage.py populate_test_data`)
- [ ] Database backup created
- [ ] Environment variables set (SECRET_KEY, DEBUG=False)
- [ ] Email configuration tested
- [ ] CORS settings configured
- [ ] SSL certificate installed
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Monitoring alerts set up

---

## Sign-Off Checklist

- [ ] All Unit Tests Pass
- [ ] All Integration Tests Pass
- [ ] All E2E Flows Working
- [ ] Permissions Enforced
- [ ] Performance Acceptable
- [ ] Data Integrity Verified
- [ ] Business Logic Validated
- [ ] Error Handling Tested
- [ ] Reports Reconciled
- [ ] Documentation Complete

