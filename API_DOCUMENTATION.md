# Commodity Trading ERP - API Documentation

## Overview
Complete RESTful API for the Commodity Trading ERP System. All endpoints require JWT authentication except for auth endpoints.

## Base URL
```
http://localhost:8000/api/
```

## Authentication

### Login
**POST** `/auth/login/`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Register
**POST** `/auth/register/`
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

### Refresh Token
**POST** `/auth/refresh/`
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Headers
Include JWT token in all requests:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### Commodities

#### List Commodities
**GET** `/commodities/commodities/`

**Query Parameters:**
- `search`: Search by name
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20)

**Response:**
```json
{
  "count": 100,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Copper",
      "symbol": "CU",
      "category": "metals",
      "current_price": 8500.50,
      "quantity": 1000,
      "unit": "MT",
      "is_active": true
    }
  ]
}
```

#### Create Commodity
**POST** `/commodities/commodities/`
```json
{
  "name": "Gold",
  "symbol": "AU",
  "category": "precious_metals",
  "current_price": 65000,
  "quantity": 100,
  "unit": "oz",
  "is_active": true
}
```

#### Get Commodity Price History
**GET** `/commodities/commodities/{id}/price_history/`

**Response:**
```json
[
  {
    "id": 1,
    "commodity": 1,
    "price": 8500,
    "date": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Commodity Statistics
**GET** `/commodities/commodities/statistics/`

**Response:**
```json
{
  "total_commodities": 25,
  "active_commodities": 20,
  "total_value": 1250000.50
}
```

---

### Trading

#### List Trades
**GET** `/trading/trades/`

#### Create Trade
**POST** `/trading/trades/`
```json
{
  "commodity": 1,
  "quantity": 500,
  "price": 8500,
  "trade_type": "buy",
  "counterparty": "ABC Trading Corp",
  "status": "pending"
}
```

#### Get Active Trades
**GET** `/trading/trades/active_trades/`

#### Close Trade
**POST** `/trading/trades/{id}/close_trade/`

---

### Orders

#### List Orders
**GET** `/orders/orders/`

#### Create Order
**POST** `/orders/orders/`
```json
{
  "order_number": "PO-2024-001",
  "customer": "Customer Name",
  "status": "pending",
  "total_amount": 50000
}
```

#### Get Pending Orders
**GET** `/orders/orders/pending_orders/`

#### Confirm Order
**POST** `/orders/orders/{id}/confirm_order/`

#### Cancel Order
**POST** `/orders/orders/{id}/cancel_order/`

---

### Inventory

#### List Stock
**GET** `/inventory/stocks/`

#### Create Stock
**POST** `/inventory/stocks/`
```json
{
  "commodity": 1,
  "warehouse": "Warehouse A",
  "quantity": 1000,
  "unit_cost": 8500,
  "location": "Section A1"
}
```

#### Get Low Stock Items
**GET** `/inventory/stocks/low_stock/?threshold=100`

#### Get Inventory Statistics
**GET** `/inventory/stocks/statistics/`

**Response:**
```json
{
  "total_items": 500,
  "total_value": 4250000,
  "low_stock_items": 15
}
```

#### Record Stock Movement
**POST** `/inventory/movements/`
```json
{
  "stock": 1,
  "movement_type": "inbound",
  "quantity": 100,
  "reference": "PO-2024-001",
  "notes": "Stock received"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

---

## Pagination

All list endpoints support pagination:
- **page**: Page number (starts at 1)
- **page_size**: Number of items per page (max: 100)

Example: `/commodities/commodities/?page=2&page_size=50`

---

## Filtering

Most endpoints support filtering through query parameters:
- `search`: Text search
- `status`: Filter by status
- `date_from`: Filter by date range start
- `date_to`: Filter by date range end

---

## Rate Limiting

- 1000 requests per hour per user
- 5 requests per second per IP

---

## WebSocket Support (Real-time Updates)

WebSocket endpoint: `ws://localhost:8000/ws/trading/`

Subscribe to real-time commodity price updates:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/trading/');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Price update:', data);
};
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Examples

### Complete Login Flow
```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Response contains access and refresh tokens

# 2. Use access token
curl -X GET http://localhost:8000/api/commodities/commodities/ \
  -H "Authorization: Bearer <access_token>"

# 3. Refresh token when expired
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'
```

---

## Support

For API issues or questions, contact: api-support@commodityerp.com
