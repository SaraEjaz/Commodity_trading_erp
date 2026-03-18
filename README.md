# Commodity Trading ERP System

A full-stack enterprise resource planning system built with Next.js 16 (TypeScript, Tailwind CSS, GSAP), Django REST Framework, PostgreSQL, and Docker.

## Features

### Trading Module
- Real-time trade execution and monitoring
- Buy/Sell order management
- Trade position tracking
- Profit & Loss calculations
- Trading alerts and notifications

### Inventory Management
- Multi-warehouse inventory tracking
- Stock level management
- Inventory movements and transfers
- Stock adjustments and reconciliation
- Reorder point management

### Orders & Procurement
- Purchase order creation and tracking
- Sales order management
- Supplier management
- Shipment tracking
- Order history and status updates

### Financial Management
- Settlement processing
- Payment management
- Bank account management
- Commission calculation
- Financial reporting

### Reporting & Analytics
- Trading reports by trader/commodity
- Inventory valuation reports
- Sales reports
- Financial statements
- Custom report generation

### User Management
- Role-based access control
- User profiles and permissions
- Audit logging
- Activity tracking

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4
- **Animations**: GSAP 3
- **State Management**: Redux Toolkit
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (Radix UI)
- **Forms**: React Hook Form + Zod validation
- **TypeScript**: Full type safety

### Backend
- **Framework**: Django 4.2
- **API**: Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL
- **Task Queue**: Celery (optional)
- **Caching**: Redis (optional)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Management**: pgAdmin
- **Server**: Gunicorn
- **Web Server**: Nginx (optional)

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── trading/
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── reports/
│   │   └── settings/
│
├── components/                  # Reusable React components
│   ├── layout/                 # Layout components
│   ├── forms/                  # Form components
│   ├── tables/                 # Data table components
│   └── ui/                     # UI components (shadcn)
│
├── lib/                         # Utilities and configurations
│   ├── store.ts                # Redux store
│   ├── slices/                 # Redux slices
│   ├── api/                    # API client and services
│   └── utils.ts                # Utility functions
│
├── public/                      # Static assets
│
├── backend/                     # Django backend
│   ├── config/                 # Django configuration
│   ├── apps/
│   │   ├── users/              # User management
│   │   ├── commodities/        # Commodity catalog
│   │   ├── trading/            # Trading operations
│   │   ├── orders/             # Order management
│   │   ├── inventory/          # Inventory tracking
│   │   ├── reports/            # Report generation
│   │   └── settlements/        # Financial settlements
│   ├── migrations/             # Database migrations
│   ├── requirements.txt        # Python dependencies
│   └── manage.py               # Django CLI
│
├── docker-compose.yml          # Docker services orchestration
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## Getting Started

### Prerequisites
- Docker & Docker Compose (recommended)
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)
- PostgreSQL 16+ (for local database)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd commodity-erp
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   docker-compose exec backend python manage.py collectstatic --noinput
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Django Admin: http://localhost:8000/admin
   - pgAdmin: http://localhost:5050

### Local Development Setup

#### Backend Setup

1. **Install Python dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Create PostgreSQL database**
   ```bash
   createdb erp_db
   ```

3. **Run migrations**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Start Django development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local`**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to http://localhost:3000

## API Documentation

### Authentication Endpoints

**POST** `/api/auth/token/`
- Login with email and password
- Returns: `{ access: string, refresh: string }`

**POST** `/api/auth/token/refresh/`
- Refresh access token
- Body: `{ refresh: string }`

### User Endpoints

**GET** `/api/users/me/`
- Get current user profile
- Auth Required: Yes

**POST** `/api/users/`
- Register new user
- Auth Required: No

### Commodity Endpoints

**GET** `/api/commodities/`
- List all commodities
- Auth Required: Yes

**POST** `/api/commodities/`
- Create new commodity
- Auth Required: Yes

### Trading Endpoints

**GET** `/api/trading/trades/`
- List all trades
- Auth Required: Yes

**POST** `/api/trading/trades/`
- Create new trade
- Auth Required: Yes

### Order Endpoints

**GET** `/api/orders/orders/`
- List all orders
- Auth Required: Yes

**POST** `/api/orders/orders/`
- Create new order
- Auth Required: Yes

### Inventory Endpoints

**GET** `/api/inventory/stocks/`
- List inventory stocks
- Auth Required: Yes

**PUT** `/api/inventory/stocks/{id}/`
- Update stock
- Auth Required: Yes

## Database Schema

### Users
- User authentication and role management
- User profiles and audit logs

### Commodities
- Commodity catalog with pricing
- Supplier management
- Price history tracking

### Trading
- Trade records (buy/sell)
- Trade positions
- Trading alerts

### Orders
- Purchase and sales orders
- Order items and history
- Shipment tracking

### Inventory
- Stock levels by warehouse
- Inventory locations
- Stock movements and adjustments

### Reports
- Trading reports
- Inventory reports
- Sales and financial reports

### Settlements
- Trade settlement records
- Payments and bank accounts
- Settlement history

## Authentication Flow

1. User submits email and password on login page
2. Backend validates credentials and returns JWT tokens
3. Frontend stores tokens in localStorage and Redux
4. API client automatically includes token in requests
5. On token expiry, refresh endpoint is called automatically
6. If refresh fails, user is redirected to login

## State Management

### Redux Store Structure
```typescript
{
  auth: {              // Authentication state
    user,
    access_token,
    refresh_token,
    is_authenticated,
    loading,
    error
  },
  ui: {               // UI state
    sidebarOpen,
    theme,
    loading,
    notifications
  },
  commodities: {},    // Commodities data
  trading: {},        // Trading data
  orders: {},         // Orders data
  inventory: {}       // Inventory data
}
```

## GSAP Animations

The application includes smooth animations for:
- Dashboard card entries
- Page transitions
- Menu animations
- Loading states
- Hover effects

## Error Handling

- Global error boundaries for React components
- API error interceptors with automatic retry
- User-friendly error messages via toast notifications
- Detailed logging for debugging

## Performance Optimization

- Code splitting and lazy loading
- Image optimization
- Caching strategies (5-minute stale time)
- Database query optimization
- Pagination for large datasets

## Security Features

- JWT authentication
- Password hashing (bcrypt)
- CORS configuration
- SQL injection prevention (parameterized queries)
- XSS protection via React
- CSRF tokens on API endpoints
- Rate limiting
- Input validation and sanitization

## Deployment

### Docker Production Build

1. **Build images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment Variables for Production

```env
DEBUG=False
DJANGO_SECRET_KEY=<strong-random-key>
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Monitoring & Logging

- Django logging configuration
- API request/response logging
- Error tracking (Sentry integration available)
- Performance monitoring

## Troubleshooting

### Database Connection Issues
```bash
docker-compose exec db psql -U postgres
```

### Redis Connection
```bash
docker-compose exec redis redis-cli
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reset Database
```bash
docker-compose exec backend python manage.py flush --no-input
docker-compose exec backend python manage.py migrate
```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

## Changelog

### Version 1.0.0 (Initial Release)
- Complete ERP system with trading, orders, and inventory
- Django REST API with JWT authentication
- Next.js frontend with React and Redux
- Docker containerization
- Full database schema with migrations
