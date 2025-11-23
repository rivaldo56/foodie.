# 🚀 Foodie v2 Deployment Checklist

## Pre-Deployment

### Backend (Django)

- [ ] **Environment Variables**
  - [ ] Copy `.env.example` to `.env` on server
  - [ ] Set `SECRET_KEY` (generate new one for production)
  - [ ] Set `DEBUG=False`
  - [ ] Configure `ALLOWED_HOSTS` with your domain
  - [ ] Set `DATABASE_URL` for PostgreSQL
  - [ ] Configure M-Pesa credentials (consumer key, secret, shortcode, passkey)
  - [ ] Set `GEMINI_API_KEY` for AI features
  - [ ] Configure `CLOUDINARY` credentials for file storage
  - [ ] Set `REDIS_URL` for Channels and Celery
  - [ ] Set `CORS_ALLOWED_ORIGINS` with frontend URL

- [ ] **Database**
  - [ ] Create PostgreSQL database
  - [ ] Run migrations: `python manage.py migrate`
  - [ ] Create superuser: `python manage.py createsuperuser`
  - [ ] Load initial data (if any): `python manage.py loaddata fixtures/*.json`

- [ ] **Static Files**
  - [ ] Collect static files: `python manage.py collectstatic --noinput`
  - [ ] Configure static file serving (WhiteNoise or CDN)

- [ ] **Dependencies**
  - [ ] Install Python dependencies: `pip install -r requirements.txt`
  - [ ] Verify all packages are installed

- [ ] **Server Setup**
  - [ ] Install and configure Redis
  - [ ] Install and configure PostgreSQL
  - [ ] Set up Gunicorn/Daphne for ASGI
  - [ ] Configure Nginx reverse proxy (if needed)
  - [ ] Set up SSL certificates

### Frontend (Next.js)

- [ ] **Environment Variables**
  - [ ] Set `NEXT_PUBLIC_API_BASE_URL` to backend API URL
  - [ ] Verify all environment variables are set

- [ ] **Build**
  - [ ] Install dependencies: `npm install`
  - [ ] Build production bundle: `npm run build`
  - [ ] Test production build locally: `npm start`

- [ ] **Deployment Platform**
  - [ ] Configure Vercel/Railway/Render project
  - [ ] Set environment variables in platform
  - [ ] Configure build settings
  - [ ] Set up custom domain (if needed)

## Deployment Steps

### Backend Deployment (Render/Railway)

1. **Create New Service**
   ```bash
   # On Render/Railway
   - Connect GitHub repository
   - Select backend directory
   - Set build command: pip install -r requirements.txt
   - Set start command: gunicorn chefconnect.wsgi:application --bind 0.0.0.0:$PORT
   ```

2. **Configure Environment**
   - Add all environment variables from `.env.example`
   - Set `DATABASE_URL` to PostgreSQL connection string
   - Set `REDIS_URL` to Redis connection string

3. **Database Setup**
   ```bash
   # SSH into server or use platform CLI
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py collectstatic --noinput
   ```

4. **Verify Deployment**
   - [ ] Check API health: `https://your-api.com/`
   - [ ] Test authentication: `POST /api/users/login/`
   - [ ] Verify CORS is working
   - [ ] Check API documentation: `https://your-api.com/swagger/`

### Frontend Deployment (Vercel)

1. **Connect Repository**
   - Import project from GitHub
   - Select `foodie-frontend` directory
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm install`

2. **Set Environment Variables**
   - `NEXT_PUBLIC_API_BASE_URL`: Your backend API URL
   - `NEXT_PUBLIC_API_URL`: Same as above

3. **Deploy**
   - Deploy to production
   - Verify build succeeds
   - Test frontend functionality

4. **Custom Domain (Optional)**
   - Add custom domain in Vercel
   - Configure DNS records
   - Verify SSL certificate

## Post-Deployment

### Testing

- [ ] **Authentication Flow**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Token refresh works
  - [ ] Logout works

- [ ] **Booking Flow**
  - [ ] Client can browse chefs
  - [ ] Client can create booking
  - [ ] M-Pesa payment works
  - [ ] Booking confirmation works
  - [ ] Chef can view bookings
  - [ ] Chef can update booking status

- [ ] **Chat System**
  - [ ] WebSocket connection works
  - [ ] Messages send/receive
  - [ ] Chat rooms work correctly

- [ ] **API Endpoints**
  - [ ] All endpoints return expected responses
  - [ ] Error handling works
  - [ ] CORS is configured correctly

### Monitoring

- [ ] **Logging**
  - [ ] Set up error logging (Sentry, LogRocket, etc.)
  - [ ] Configure log aggregation
  - [ ] Set up alerts for errors

- [ ] **Performance**
  - [ ] Monitor API response times
  - [ ] Check database query performance
  - [ ] Monitor Redis usage
  - [ ] Set up performance alerts

- [ ] **Security**
  - [ ] Verify HTTPS is enabled
  - [ ] Check CORS configuration
  - [ ] Verify API authentication
  - [ ] Set up rate limiting (if needed)

## Production URLs

- **Backend API**: `https://your-api.com/`
- **Frontend**: `https://your-frontend.com/`
- **API Docs**: `https://your-api.com/swagger/`
- **Admin Panel**: `https://your-api.com/admin/`

## Rollback Plan

If deployment fails:

1. **Backend Rollback**
   - Revert to previous deployment version
   - Restore database backup (if needed)
   - Verify API is working

2. **Frontend Rollback**
   - Revert to previous deployment in Vercel
   - Verify frontend is working
   - Check environment variables

## Maintenance

### Regular Tasks

- [ ] Monitor error logs daily
- [ ] Check database performance weekly
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Review security updates

### Updates

- [ ] Test updates in staging first
- [ ] Backup database before updates
- [ ] Deploy during low-traffic hours
- [ ] Monitor after deployment

## Support Contacts

- **Backend Issues**: [Your Contact]
- **Frontend Issues**: [Your Contact]
- **Database Issues**: [Your Contact]
- **Payment Issues**: [Your Contact]

## Notes

- M-Pesa is the only payment method enabled
- Stripe has been disabled
- PostgreSQL is required for production
- Redis is required for WebSocket chat
- All environment variables must be set before deployment

