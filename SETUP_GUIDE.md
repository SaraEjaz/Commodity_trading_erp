# Commodity Trading ERP - Complete Setup Guide

This guide walks you through setting up the complete full-stack Commodity Trading ERP System with Next.js, Django, PostgreSQL, and Docker.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  - React 19 with Server Components                          │
│  - Tailwind CSS 4 + shadcn/ui                              │
│  - Redux Toolkit + TanStack Query                          │
│  - GSAP Animations                                          │
│  - TypeScript                                               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│              Backend API (Django REST)                       │
│  - Django 4.2 with REST Framework                           │
│  - JWT Authentication                                        │
│  - 7 Core Apps (Trading, Orders, Inventory, etc)           │
│  - PostgreSQL Database                                       │
│  - Gunicorn Server                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL
┌────────────────────▼────────────────────────────────────────┐
│            PostgreSQL Database                              │
│  - Multi-schema design                                       │
│  - Row-level security                                       │
│  - Optimized indexes                                        │
│  - Backup-friendly                                          │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows (with WSL2)
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 20GB available space

### Software Requirements
- **Docker Desktop**: 4.0+ (includes Docker & Docker Compose)
- **Node.js**: 20.x LTS (for local frontend development)
- **Python**: 3.11+ (for local backend development)
- **Git**: 2.0+

## Quick Start (Using Docker Compose)

### Step 1: Clone & Initialize

```bash
# Clone or extract project
cd commodity-erp

# Copy environment template
cp .env.example .env

# (Optional) Edit .env for custom configuration
nano .env  # or use your preferred editor
```

### Step 2: Start Services

```bash
# Build and start all containers
docker-compose up -d

# Monitor startup
docker-compose logs -f

# Wait for health checks to pass (~30-60 seconds)
```

### Step 3: Initialize Database

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
# Follow prompts to set email and password

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# (Optional) Load sample data
docker-compose exec backend python manage.py loaddata commodities suppliers
```

### Step 4: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **pgAdmin**: http://localhost:5050
  - Email: admin@example.com
  - Password: admin (change from `.env`)

## Local Development Setup

### Frontend Development (Next.js)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local`**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Start Dev Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to http://localhost:3000

### Backend Development (Django)

1. **Setup Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Create Database**
   ```bash
   createdb erp_db
   # Or use PostgreSQL GUI
   ```

3. **Setup Environment**
   ```bash
   export DJANGO_SETTINGS_MODULE=config.settings
   # Windows: set DJANGO_SETTINGS_MODULE=config.settings
   ```

4. **Run Migrations**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Start Server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## Database Setup

### PostgreSQL Connection

```bash
# Connect via docker-compose
docker-compose exec db psql -U postgres -d erp_db

# Or use pgAdmin at http://localhost:5050
```

### Useful psql Commands

```sql
-- List databases
\l

-- Connect to database
\c erp_db

-- List tables
\dt

-- Describe table
\d users_user

-- Run query
SELECT * FROM users_user;

-- Exit
\q
```

## File Structure Explanation

### Frontend (Next.js)

```
app/
├── (auth)/           # Authentication pages
│   ├── login/        # Login page
│   └── register/     # Registration page
├── (dashboard)/      # Protected dashboard routes
│   ├── dashboard/    # Main dashboard
│   ├── trading/      # Trading module
│   ├── orders/       # Orders module
│   ├── inventory/    # Inventory module
│   ├── reports/      # Reports module
│   └── settings/     # Settings
└── layout.tsx        # Root layout with providers

components/
├── RootProvider.tsx   # Redux + Theme + Query Client setup
├── ThemeProvider.tsx  # Dark mode support
├── layout/           # Layout components
├── forms/            # Reusable forms
└── ui/              # shadcn/ui components

lib/
├── store.ts         # Redux store configuration
├── slices/          # Redux reducers
│   ├── authSlice.ts
│   ├── uiSlice.ts
│   ├── tradingSlice.ts
│   ├── ordersSlice.ts
│   ├── inventorySlice.ts
│   └── commoditiesSlice.ts
├── api/             # API client
│   ├── client.ts    # Axios instance with interceptors
│   └── auth.ts      # Auth endpoints
└── utils.ts         # Utility functions
```

### Backend (Django)

```
backend/
├── config/          # Django settings & URLs
├── apps/
│   ├── users/       # User management, auth, permissions
│   ├── commodities/ # Commodity catalog, suppliers
│   ├── trading/     # Trade execution, positions
│   ├── orders/      # Purchase & sales orders
│   ├── inventory/   # Stock, warehouses, movements
│   ├── reports/     # Report generation
│   └── settlements/ # Financial settlements, payments
├── migrations/      # Database migrations
├── manage.py        # Django CLI
└── requirements.txt # Python dependencies
```

## API Endpoints Reference

### Authentication
```
POST   /api/auth/token/              # Login
POST   /api/auth/token/refresh/      # Refresh token
```

### Users
```
GET    /api/users/                   # List users
POST   /api/users/                   # Register
GET    /api/users/me/                # Current user
PATCH  /api/users/me/                # Update profile
POST   /api/users/change_password/   # Change password
```

### Commodities
```
GET    /api/commodities/             # List commodities
POST   /api/commodities/             # Create commodity
GET    /api/commodities/{id}/        # Get commodity
PATCH  /api/commodities/{id}/        # Update commodity
```

### Trading
```
GET    /api/trading/trades/          # List trades
POST   /api/trading/trades/          # Create trade
GET    /api/trading/trades/{id}/     # Get trade
PATCH  /api/trading/trades/{id}/     # Update trade
GET    /api/trading/positions/       # List positions
```

### Orders
```
GET    /api/orders/orders/           # List orders
POST   /api/orders/orders/           # Create order
GET    /api/orders/orders/{id}/      # Get order
PATCH  /api/orders/orders/{id}/      # Update order
```

### Inventory
```
GET    /api/inventory/stocks/        # List stocks
GET    /api/inventory/stocks/{id}/   # Get stock
PATCH  /api/inventory/stocks/{id}/   # Update stock
GET    /api/inventory/warehouses/    # List warehouses
GET    /api/inventory/movements/     # List movements
```

## Common Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Backup

```bash
# Backup database
docker-compose exec db pg_dump -U postgres erp_db > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres erp_db < backup.sql
```

### Reset Everything

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Start fresh
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Create Django Admin User

```bash
docker-compose exec backend python manage.py createsuperuser

# Or manually
docker-compose exec backend python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.create_superuser('admin@example.com', 'password')
```

### Run Django Management Commands

```bash
docker-compose exec backend python manage.py <command>

# Examples:
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose exec backend python manage.py shell
```

## Environment Variables

### Critical Variables

```env
# Database
DB_NAME=erp_db
DB_USER=postgres
DB_PASSWORD=<secure-password>
DB_HOST=db
DB_PORT=5432

# Django
DJANGO_SECRET_KEY=<generate-secure-key>
DEBUG=False  # Always False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# pgAdmin
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=<secure-password>
```

### Generate Django Secret Key

```bash
# Option 1: Python
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Option 2: OpenSSL
openssl rand -base64 32
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait a moment
# 2. Secret key not set - check .env
# 3. Database exists but migrations needed
docker-compose exec backend python manage.py migrate
```

### Frontend Won't Connect to Backend

```bash
# Check API URL
echo $NEXT_PUBLIC_API_URL

# Check backend is running
curl http://localhost:8000/api/

# Check CORS configuration
# Edit backend/config/settings.py CORS_ALLOWED_ORIGINS
```

### PostgreSQL Connection Errors

```bash
# Check container is running
docker-compose ps db

# Check database exists
docker-compose exec db psql -U postgres -l

# Check connection string
docker-compose exec backend python manage.py dbshell
```

### Port Already in Use

```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:5432 | xargs kill -9  # Database

# Or use different port in docker-compose.yml
# Change ports: ["3001:3000"]
```

## Production Deployment

### Before Deployment

1. **Set secure environment variables**
   ```bash
   export DJANGO_SECRET_KEY=$(openssl rand -base64 32)
   export DEBUG=False
   ```

2. **Update ALLOWED_HOSTS and CORS**
   ```env
   ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

3. **Enable HTTPS**
   - Use reverse proxy (Nginx)
   - Get SSL certificate (Let's Encrypt)

4. **Database Backup**
   ```bash
   pg_dump -U postgres erp_db > backup_$(date +%Y%m%d).sql
   ```

### Deployment Checklist

- [ ] All environment variables set
- [ ] Database backups configured
- [ ] HTTPS enabled
- [ ] Debug mode disabled
- [ ] Static files collected
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup
- [ ] Error tracking (Sentry) configured
- [ ] Log aggregation configured

## Security Considerations

1. **JWT Secret**: Change `DJANGO_SECRET_KEY` regularly
2. **Database Password**: Use strong, randomly generated password
3. **CORS**: Restrict to specific domains in production
4. **HTTPS**: Always use in production
5. **Rate Limiting**: Configured in Django settings
6. **Input Validation**: All endpoints validate input
7. **SQL Injection**: Protected via ORM parameterization
8. **CSRF**: Protected via Django middleware

## Performance Optimization

- Database query optimization with indexes
- API response caching (5 minutes default)
- Frontend code splitting and lazy loading
- Image optimization with Next.js Image component
- Database connection pooling
- Redis caching (optional)

## Support & Documentation

- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- PostgreSQL Docs: https://www.postgresql.org/docs/

## Next Steps

1. Customize UI colors and branding
2. Add additional business logic
3. Configure email notifications
4. Set up monitoring and alerts
5. Implement backup strategy
6. Train team on system usage
