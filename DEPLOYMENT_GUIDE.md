# Deployment Guide - Commodity Trading ERP

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Git

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd commodity-erp

# 2. Create environment file
cp .env.example .env.local

# 3. Update .env.local with your settings
# - Change DJANGO_SECRET_KEY
# - Update DATABASE passwords
# - Set NEXT_PUBLIC_API_URL to your backend URL

# 4. Start all services
docker-compose up -d

# 5. Run migrations
docker-compose exec backend python manage.py migrate

# 6. Create superuser
docker-compose exec backend python manage.py createsuperuser

# 7. Access the application
# Frontend: http://localhost:3000
# Backend Admin: http://localhost:8000/admin
# API: http://localhost:8000/api
# pgAdmin: http://localhost:5050
```

### Manual Development Setup (Without Docker)

#### Backend Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Create PostgreSQL database
createdb commodity_erp

# 4. Create .env file in backend directory
cat > backend/.env << EOF
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_NAME=commodity_erp
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
EOF

# 5. Run migrations
cd backend
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. Start development server
python manage.py runserver
```

#### Frontend Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Commodity Trading ERP
EOF

# 3. Start development server
npm run dev
```

---

## Production Deployment

### Vercel Deployment (Frontend)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to vercel.com
   - Import your GitHub repository
   - Set environment variables in Vercel dashboard:
     ```
     NEXT_PUBLIC_API_URL=https://api.yourdomain.com
     NEXT_PUBLIC_APP_NAME=Commodity Trading ERP
     ```

3. **Deploy**
   - Vercel automatically deploys on push to main branch

### AWS Deployment (Backend)

#### Option 1: Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize Elastic Beanstalk
eb init -p python-3.11 commodity-erp --region us-east-1

# 3. Create environment
eb create production

# 4. Deploy
eb deploy

# 5. Set environment variables
eb setenv DEBUG=False SECRET_KEY=your-secret-key DATABASE_URL=your-db-url

# 6. Monitor
eb open
```

#### Option 2: EC2 with Gunicorn

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)

# 2. Connect and update
sudo apt update && sudo apt upgrade -y

# 3. Install dependencies
sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx

# 4. Clone repository
git clone <repo-url>
cd commodity-erp/backend

# 5. Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Create PostgreSQL database
sudo -u postgres psql << EOF
CREATE DATABASE commodity_erp;
CREATE USER erp_user WITH PASSWORD 'strong_password';
ALTER ROLE erp_user SET client_encoding TO 'utf8';
ALTER ROLE erp_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE erp_user SET default_transaction_deferrable TO on;
ALTER ROLE erp_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE commodity_erp TO erp_user;
EOF

# 7. Configure Django
cat > config/.env << EOF
DEBUG=False
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_NAME=commodity_erp
DATABASE_USER=erp_user
DATABASE_PASSWORD=strong_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
EOF

# 8. Run migrations
python manage.py migrate

# 9. Create superuser
python manage.py createsuperuser

# 10. Collect static files
python manage.py collectstatic --noinput

# 11. Install and configure Gunicorn
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Docker Compose Production Deployment

```bash
# 1. Update docker-compose.prod.yml
# - Set DEBUG=False
# - Use strong SECRET_KEY
# - Configure PostgreSQL with strong password
# - Set ALLOWED_HOSTS

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Backup database
docker-compose exec db pg_dump -U postgres commodity_erp > backup.sql
```

---

## Environment Variables

### Frontend (.env.local or .env.production)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=Commodity Trading ERP
NEXT_PUBLIC_APP_DESCRIPTION=Professional ERP system
```

### Backend (config/.env)
```
# Security
DEBUG=False
SECRET_KEY=very-strong-random-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=commodity_erp
DATABASE_USER=postgres
DATABASE_PASSWORD=strong-password
DATABASE_HOST=db-host
DATABASE_PORT=5432

# JWT
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_HOURS=24
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (for notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# AWS (if using S3 for storage)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1
```

---

## Database Backup & Restore

### Backup PostgreSQL
```bash
# Docker
docker-compose exec db pg_dump -U postgres commodity_erp > backup.sql

# Direct
pg_dump -U postgres -h localhost commodity_erp > backup.sql

# With compression
pg_dump -U postgres -h localhost commodity_erp | gzip > backup.sql.gz
```

### Restore PostgreSQL
```bash
# Docker
docker-compose exec -T db psql -U postgres commodity_erp < backup.sql

# Direct
psql -U postgres -h localhost commodity_erp < backup.sql

# From compressed
gunzip -c backup.sql.gz | psql -U postgres -h localhost commodity_erp
```

---

## SSL/TLS Certificate Setup

### Let's Encrypt with Nginx

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx

# 2. Obtain certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# 3. Configure Nginx
# Update /etc/nginx/sites-available/default with SSL settings

# 4. Renew certificates automatically
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Monitoring & Logging

### Application Logs

```bash
# Docker
docker-compose logs -f backend   # Backend logs
docker-compose logs -f frontend  # Frontend logs

# Direct
tail -f backend/logs/django.log
tail -f /var/log/nginx/access.log
```

### Database Monitoring

```bash
# Connect to pgAdmin
# URL: http://localhost:5050
# Create server connection and monitor queries
```

---

## Security Checklist

- [ ] Set strong SECRET_KEY in production
- [ ] Set DEBUG=False in production
- [ ] Configure ALLOWED_HOSTS properly
- [ ] Use HTTPS/SSL certificates
- [ ] Set strong database password
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular database backups
- [ ] Update dependencies regularly
- [ ] Configure firewall rules
- [ ] Monitor application logs
- [ ] Setup alerts for errors
- [ ] Regular security audits

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test connection
psql -U postgres -h localhost -d commodity_erp

# Check PostgreSQL service
sudo systemctl status postgresql
```

### Static Files Not Found
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R www-data:www-data /var/www/static
```

### SSL Certificate Issues
```bash
# Check certificate
openssl s_client -connect yourdomain.com:443

# Renew immediately
sudo certbot renew --force-renewal
```

---

## Performance Optimization

1. **Enable Caching**
   - Redis for session/cache
   - HTTP caching headers

2. **Database Optimization**
   - Add indexes on frequently queried fields
   - Use SELECT_RELATED and PREFETCH_RELATED

3. **Frontend Optimization**
   - Enable compression
   - Lazy load images
   - Code splitting

4. **Load Balancing**
   - Multiple Django instances
   - Load balancer (nginx, HAProxy)
   - Database replication

---

## Support & Resources

- Documentation: `/documentation`
- API Docs: `/api-documentation`
- Issues: GitHub Issues
- Email: support@commodityerp.com
