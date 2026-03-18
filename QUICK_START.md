# Quick Start Guide - Commodity Trading ERP

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local frontend development)
- Python 3.10+ (for local backend development)
- Git

## Option 1: Docker Compose (Recommended)

### 1. Clone & Setup
```bash
# Navigate to project directory
cd commodity-erp

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
```

### 2. Start Services
```bash
# Start all containers
docker-compose up -d

# Wait for PostgreSQL to be ready (~5 seconds)
sleep 5

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser (optional)
docker-compose exec backend python manage.py createsuperuser
```

### 3. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/
- **pgAdmin**: http://localhost:8080 (user: admin@admin.com, pass: admin)

### 4. Test Login
- **Username**: admin (or your created superuser)
- **Password**: Your configured password

---

## Option 2: Local Development

### Frontend Setup
```bash
# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Commodity Trading ERP
EOF

# Start development server
npm run dev

# Open http://localhost:3000
```

### Backend Setup
```bash
# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env file in backend/
cat > backend/.env << EOF
SECRET_KEY=your-secret-key-123456789
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://postgres:password@localhost:5432/erp_db
POSTGRES_PASSWORD=password
POSTGRES_DB=erp_db
CORS_ALLOWED_ORIGINS=http://localhost:3000
EOF

# Run PostgreSQL locally or use Docker
# docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15

# Apply migrations
cd backend
python manage.py migrate
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

---

## Project Structure Overview

```
commodity-erp/
├── app/                    # Next.js pages & layouts
├── components/             # React components
├── lib/                    # API clients, Redux, utilities
├── backend/                # Django REST API
│   ├── apps/              # 7 Django apps (users, commodities, etc.)
│   ├── config/            # Django settings
│   └── requirements.txt    # Python packages
├── docker-compose.yml      # Multi-container setup
├── package.json            # Node dependencies
└── README.md               # Full documentation
```

---

## Common Tasks

### Create a New Commodity
1. Go to http://localhost:3000/commodities
2. Click "Add Commodity"
3. Fill in details (Name, Symbol, Category, Unit, Price)
4. Click Create

### Create a Trading Position
1. Go to http://localhost:3000/trading
2. Click "New Trade"
3. Select commodity, direction (LONG/SHORT), quantity, price
4. Click Create

### Create an Order
1. Go to http://localhost:3000/orders
2. Click "Create Order"
3. Select order type (BUY/SELL), commodity, quantity
4. Click Create

### View Reports
1. Go to http://localhost:3000/reports
2. Select report type (Sales, Inventory, Trading, Financial)
3. Choose date range
4. View charts and export data

---

## API Endpoints Reference

### Authentication
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Response includes access token
# Use in headers: Authorization: Bearer <token>
```

### Commodities
```bash
# List commodities
curl -X GET http://localhost:8000/api/commodities/ \
  -H "Authorization: Bearer <token>"

# Create commodity
curl -X POST http://localhost:8000/api/commodities/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Crude Oil","symbol":"WTI","category":"Energy","unit":"Barrel","current_price":75.50}'
```

### Trading
```bash
# List trades
curl -X GET http://localhost:8000/api/trading/ \
  -H "Authorization: Bearer <token>"
```

### Orders
```bash
# List orders
curl -X GET http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer <token>"
```

### Inventory
```bash
# List inventory
curl -X GET http://localhost:8000/api/inventory/ \
  -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in docker-compose.yml
# Or kill process on port:
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL container is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

### Frontend Build Error
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Backend Migration Error
```bash
# Check migration status
docker-compose exec backend python manage.py showmigrations

# Reset database (careful - deletes data)
docker-compose exec backend python manage.py flush
docker-compose exec backend python manage.py migrate
```

---

## Environment Variables

### Frontend (.env.local)
| Variable | Default | Description |
|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | http://localhost:8000 | Backend API URL |
| NEXT_PUBLIC_APP_NAME | Commodity Trading ERP | Application title |

### Backend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| SECRET_KEY | (generate) | Django secret key |
| DEBUG | False | Debug mode |
| ALLOWED_HOSTS | localhost | Allowed host domains |
| DATABASE_URL | (PostgreSQL) | Database connection |
| CORS_ALLOWED_ORIGINS | http://localhost:3000 | CORS origins |

---

## Database Management

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U postgres -d erp_db
```

### Common SQL Commands
```sql
-- List all tables
\dt

-- Check users
SELECT * FROM users_user;

-- Check commodities
SELECT * FROM commodities_commodity;

-- Check trades
SELECT * FROM trading_tradeposition;

-- Exit
\q
```

### pgAdmin GUI (Recommended)
1. Go to http://localhost:8080
2. Login with admin@admin.com / admin
3. Add PostgreSQL server:
   - Host: postgres
   - Port: 5432
   - Username: postgres
   - Password: (from .env)
   - Database: erp_db
4. Browse tables & run queries

---

## Development Tips

### Hot Reload
- **Frontend**: Changes auto-reload (Next.js HMR)
- **Backend**: Restart container for changes
  ```bash
  docker-compose restart backend
  ```

### Redux DevTools
- Install [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools-extension)
- Access from browser DevTools when in development

### TypeScript Checking
```bash
npx tsc --noEmit
```

### Code Formatting
```bash
# Format with Prettier
npx prettier --write .

# Lint with ESLint
npx eslint .
```

### View Logs
```bash
# Frontend logs
docker-compose logs -f frontend

# Backend logs
docker-compose logs -f backend

# All logs
docker-compose logs -f
```

---

## Production Deployment

### Before Deploying
- [ ] Update SECRET_KEY in .env
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Set up SSL certificates
- [ ] Configure production database
- [ ] Set up environment variables securely
- [ ] Run security checks
- [ ] Test all features

### Build for Production
```bash
# Frontend
npm run build

# Backend
docker build -t commodity-erp-backend ./backend
```

### Deploy with Docker
```bash
# Push to registry
docker tag commodity-erp-frontend:latest myregistry/commodity-erp-frontend:latest
docker push myregistry/commodity-erp-frontend:latest

# Deploy to your server
docker pull myregistry/commodity-erp-frontend:latest
docker-compose -f docker-compose.prod.yml up -d
```

---

## Support & Documentation

- **Full README**: See README.md
- **Setup Guide**: See SETUP_GUIDE.md
- **Implementation Details**: See IMPLEMENTATION_SUMMARY.md
- **Project Report**: See PROJECT_COMPLETION.md

---

## Next Steps

1. ✅ Start Docker Compose
2. ✅ Create test data (commodities, trades, orders)
3. ✅ Explore all pages and features
4. ✅ Review API documentation
5. ✅ Customize as needed for your use case
6. ✅ Configure production settings
7. ✅ Deploy to your infrastructure

---

**Quick Links**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- pgAdmin: http://localhost:8080
- Django Admin: http://localhost:8000/admin

**Default Credentials**
- Django Admin: admin / (created during setup)
- pgAdmin: admin@admin.com / admin

**Need Help?**
Check the troubleshooting section or review detailed documentation in PROJECT_COMPLETION.md

Happy Trading! 🚀
