# 🍳 ChefConnect (Foodie V2)

**A modern full-stack platform connecting food lovers with professional chefs for personal meals, events, and home dining experiences.**

> "Uber for Chefs" - Making culinary excellence accessible to everyone

---

## ⚠️ Migration Status

> [!CAUTION]
> **Django Backend Removed - Migration in Progress**
> 
> This repository is undergoing a **serverless architecture migration** from Django monolith to Supabase.
> 
> **Phase 1: ✅ COMPLETE** - Django backend removed (2026-02-08)  
> **Phase 2: 🚧 PENDING** - Supabase integration (Auth + Database + Edge Functions)

### Current Architecture

| Component | Status | Details |
|-----------|--------|---------|
| **Frontend** | ✅ Operational | Next.js 15.0.3 (TypeScript + Tailwind CSS) |
| **Backend** | ❌ Removed | Django backend deleted |
| **Database** | ❌ Removed | SQLite/PostgreSQL removed |
| **APIs** | ⚠️ Non-functional | Endpoints will return 404 until Phase 2 |

### What Happens Now?

**✅ You CAN:**
- Browse the codebase
- Build the frontend (`cd foodie-frontend && npm run build`)
- Run the frontend dev server (`npm run dev`)
- View UI components and pages

**❌ You CANNOT:**
- Make API calls (all Django endpoints removed)
- Register/login users (backend auth removed)
- Create bookings or chat messages
- Process payments

**All functionality will be restored in Phase 2 using Supabase.**

### Phase 2 Migration Plan

| Django Component | Supabase Replacement |
|-----------------|---------------------|
| PostgreSQL + Django ORM | Supabase PostgreSQL + Row Level Security |
| Django REST Framework | Supabase Edge Functions (Deno) |
| Django Channels (WebSockets) | Supabase Realtime |
| django-allauth | Supabase Auth |
| Celery + Redis | Edge Functions + Cron Jobs |
| Cloudinary | Supabase Storage |
| Stripe/M-Pesa Integration | Edge Functions + Payment SDKs |
| Gemini AI | Edge Functions + Gemini API |

📄 **Full Audit Report:** [docs/audit_report.md](docs/audit_report.md)

---

## 🚀 Overview

ChefConnect is a production-ready platform that bridges food enthusiasts with professional chefs through an intuitive, feature-rich web application.

> **Note:** This project is currently being migrated from a Django monolith to a serverless Supabase architecture. The frontend is fully functional, but backend APIs are temporarily unavailable.

### Project History

**Original Stack (Removed in Phase 1):**
- ~~Full-Stack Application: Django REST API + Next.js Frontend~~
- ~~Real-time Features: WebSocket-based chat with Django Channels~~
- ~~AI Integration: Google Gemini for personalized recommendations~~
- ~~Multi-Payment Support: M-Pesa (mobile money) + Stripe (cards)~~
- ~~Production Ready: Docker deployment with comprehensive testing~~

**Target Stack (Phase 2):**
- ✅ **Frontend**: Next.js 15.0.3 (TypeScript + Tailwind CSS) - **Already Built**
- 🚧 **Backend**: Supabase PostgreSQL + Edge Functions - **In Planning**
- 🚧 **Real-time**: Supabase Realtime - **In Planning**
- 🚧 **Auth**: Supabase Auth - **Partially Integrated**
- 🚧 **Storage**: Supabase Storage - **In Planning**
- 🚧 **AI**: Edge Functions + Gemini API - **In Planning**

---

## 🎯 Core Features

### 👥 User Management
- **Multi-role System**: Client, Chef, and Admin roles
- **Token Authentication**: Secure JWT-based authentication
- **Profile Management**: Comprehensive user profiles with profile pictures
- **Dashboard**: Personalized dashboards for each user role

### 👨‍🍳 Chef Features
- **Profile Creation**: Detailed chef profiles with portfolios
- **Menu Management**: Create and manage menu items with dietary info
- **Availability Tracking**: Real-time availability calendar
- **Ratings & Reviews**: Customer feedback and rating system
- **Revenue Dashboard**: Analytics and earnings tracking

### 📅 Booking System
- **3-Tap Booking Flow**: Streamlined booking process
  1. Select date and time
  2. Choose chef and menu
  3. Complete payment
- **Status Management**: Pending → Confirmed → Completed workflow
- **Booking History**: Complete transaction tracking
- **Cancellation & Refunds**: Easy cancellation with automated refunds

### 💬 Real-time Chat
- **WebSocket Messaging**: Instant client-chef communication
- **Typing Indicators**: Real-time typing status
- **Read Receipts**: Message delivery confirmation
- **File Sharing**: Image and document uploads
- **Unread Counters**: Track unread messages

### 💳 Payment Processing
- **M-Pesa Integration**: Mobile money payments via Safaricom Daraja API
- **Stripe Integration**: Credit/debit card processing (optional)
- **Secure Flow**: Payment intents with webhook validation
- **Automated Payouts**: Chef payment distribution
- **Refund System**: Automated refund processing

### 🤖 AI-Powered Features
- **Personalized Recommendations**: AI-driven chef matching
- **Menu Suggestions**: Smart menu recommendations
- **AI Chatbot**: Culinary advice and platform assistance
- **Preference Learning**: Adaptive user preference tracking
- **Smart Search**: Intelligent filtering and discovery

---

## 🛠 Technology Stack

### Backend
```
🐍 Python 3.12
🎯 Django 5.0.7
🔌 Django REST Framework 3.15.2
⚡ Django Channels 4.0.0 (WebSockets)
🗄️ PostgreSQL (production) / SQLite (development)
🚀 Redis (caching + channels)
🤖 Google Gemini AI
💳 M-Pesa + Stripe APIs
☁️ Cloudinary (file storage)
```

### Frontend
```
⚛️ React 19.2.0
🔷 Next.js 16.0.0
📘 TypeScript 5
🎨 Tailwind CSS 4.1
🎭 Framer Motion (animations)
📋 React Hook Form + Zod (forms)
📊 Recharts (charts & analytics)
🎪 Radix UI (components)
```

### DevOps & Infrastructure
```
🐳 Docker + Docker Compose
🌐 Nginx (reverse proxy)
🔒 SSL/TLS support
📊 Health monitoring
🧪 Comprehensive test suite
```

---

## 📁 Project Structure

```
foodie-v2/
├── foodie-frontend/          # Next.js frontend application
│   ├── app/                  # Next.js app directory
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (chef)/          # Chef dashboard & features
│   │   ├── (client)/        # Client pages
│   │   └── api/             # API routes
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth, Toast)
│   │   ├── lib/            # API clients & utilities
│   │   └── schemas/         # Zod validation schemas
│   └── tests/               # E2E tests (Playwright)
│
├── users/                    # User management & auth
├── chefs/                    # Chef profiles & reviews
├── bookings/                 # Booking system & menus
├── chat/                     # Real-time messaging
├── payments/                 # Payment processing (M-Pesa)
├── ai/                       # AI recommendations & chatbot
├── chefconnect/             # Django project settings
├── media/                    # User uploads
├── static/                   # Static files
├── logs/                     # Application logs
└── tests/                    # Backend tests
```

---

## 🚀 Quick Start

### Prerequisites
- **Backend**: Python 3.8+, pip, virtualenv
- **Frontend**: Node.js 18+, npm
- **Services**: Redis (for WebSockets), PostgreSQL (production)

### Backend Setup

1. **Activate Virtual Environment**
   ```bash
   cd foodie-v2
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   
   Create/update `.env` file:
   ```bash
   # Django
   SECRET_KEY=your_django_secret_key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Database (optional - uses SQLite by default)
   DATABASE_URL=postgresql://user:pass@localhost:5432/chefconnect
   
   # External Services
   GEMINI_API_KEY=your_gemini_api_key
   
   # Payment Processing
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=your_mpesa_passkey
   
   # Optional: Stripe (if using card payments)
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   
   # File Storage
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Redis (for WebSockets)
   REDIS_URL=redis://localhost:6379/0
   
   # CORS
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Setup Database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Run Development Server**
   ```bash
   python manage.py runserver
   ```

   Backend API: http://localhost:8000

### Frontend Setup

1. **Navigate to Frontend**
   ```bash
   cd foodie-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   
   Create `foodie-frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

   Frontend App: http://localhost:3000

---

## 📚 API Documentation

Access interactive API documentation:
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/
- **Admin Panel**: http://localhost:8000/admin/

### Key API Endpoints

#### Authentication
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login
- `POST /api/users/logout/` - User logout
- `GET /api/users/profile/` - Get/update profile
- `GET /api/users/dashboard/` - User dashboard stats

#### Chefs
- `GET /api/chefs/` - List all chefs
- `GET /api/chefs/search/` - Search with filters
- `GET /api/chefs/<id>/` - Chef details
- `POST /api/chefs/profile/` - Create/update profile
- `GET /api/chefs/<id>/reviews/` - Chef reviews
- `POST /api/chefs/<id>/favorite/` - Toggle favorite

#### Bookings
- `GET /api/bookings/` - List user bookings
- `POST /api/bookings/create/` - Create booking
- `GET /api/bookings/<id>/` - Booking details
- `PATCH /api/bookings/<id>/status/` - Update status
- `GET /api/bookings/menu-items/` - Available menus

#### Chat (WebSocket)
- `GET /api/chat/rooms/` - List chat rooms
- `POST /api/chat/rooms/create/` - Create room
- `GET /api/chat/rooms/<id>/messages/` - Get messages
- `WS /ws/chat/<room_id>/` - WebSocket connection

#### Payments
- `POST /api/payments/mpesa/stk-push/` - Initiate M-Pesa payment
- `POST /api/payments/mpesa/callback/` - M-Pesa callback (webhook)
- `GET /api/payments/` - Payment history

#### AI Features
- `POST /api/ai/recommendations/chefs/` - Chef recommendations
- `POST /api/ai/recommendations/menus/` - Menu suggestions
- `POST /api/ai/chat/` - AI chatbot interaction

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test chefs
python manage.py test bookings

# Run with coverage
python manage.py test --coverage
```

### Frontend Tests
```bash
cd foodie-frontend

# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

---

## 🐳 Docker Deployment

### Using Docker Compose

1. **Build and Start Services**
   ```bash
   docker-compose up -d
   ```

2. **Run Migrations**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

3. **Create Superuser**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

4. **Access Applications**
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:8000/admin

---

## 🔐 Security Features

- ✅ **Token Authentication**: Secure JWT-based auth
- ✅ **CORS Protection**: Configured allowed origins
- ✅ **Input Validation**: Comprehensive request validation
- ✅ **SQL Injection Prevention**: ORM-based queries
- ✅ **CSRF Protection**: Django CSRF middleware
- ✅ **Secure Payments**: PCI-compliant payment processing
- ✅ **File Upload Security**: Cloudinary integration
- ✅ **Password Hashing**: Django's built-in password security

---

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries
- **Redis Caching**: Reduced database load
- **Connection Pooling**: Efficient resource usage
- **Lazy Loading**: Frontend code splitting
- **Image Optimization**: Cloudinary transformations
- **WebSocket**: Persistent connections for real-time features

---

## 🌍 Deployment Options

### Recommended Platforms
- **Backend**: Railway, Render, Heroku, AWS, GCP, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Database**: PostgreSQL on Supabase, Neon, AWS RDS
- **Redis**: Redis Cloud, AWS ElastiCache, Railway

### Environment Setup
See `.env.production` for production environment variables template.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/rivaldo56/foodie-v2/issues)
- **Documentation**: See `/docs` folder for detailed guides

---

## 🎯 Roadmap

### ✅ Completed
- Full authentication system
- Chef and client dashboards
- Real-time chat with WebSockets
- M-Pesa payment integration
- AI-powered recommendations
- Booking system with calendar
- Review and rating system
- Responsive frontend UI

### 🔄 In Progress
- Enhanced analytics dashboard
- Mobile app development (React Native)
- Advanced AI features

### 📋 Planned
- Multi-language support (i18n)
- Virtual cooking classes
- Ingredient marketplace
- Social features (chef following, recipe sharing)
- Advanced reporting and analytics

---

## 🏆 Project Statistics

```
📁 Total Files: 150+
📝 Lines of Code: 15,000+
🧪 Test Cases: 50+
📚 API Endpoints: 80+
🔌 WebSocket Consumers: 2
💾 Database Models: 20+
```

---

**Built with ❤️ by the ChefConnect Team**

*Connecting culinary dreams with professional excellence!* 🍳✨
