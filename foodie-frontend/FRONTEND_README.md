# Foodie v2 - Frontend Documentation

## 🎨 Overview
Full-stack Next.js 15 frontend for Foodie v2, integrated with Django REST API backend. Built with TypeScript, Tailwind CSS, and modern React patterns.

## 🏗️ Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API
- **Authentication**: JWT (localStorage)
- **API Client**: Axios (configured in `src/lib/api.ts`)

## 📁 Project Structure
```
foodie-frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home page (/)
│   ├── chefs/
│   │   ├── page.tsx            # Chefs list (/chefs)
│   │   └── [id]/page.tsx       # Chef detail (/chefs/[id])
│   ├── meals/
│   │   ├── page.tsx            # Meals list with filters (/meals)
│   │   └── [id]/
│   │       ├── page.tsx        # Meal detail (/meals/[id])
│   │       └── review/page.tsx # Write review (/meals/[id]/review)
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Registration page
│   ├── orders/page.tsx         # User orders (protected)
│   └── profile/page.tsx        # User profile (protected)
│
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.tsx         # Navigation with auth state
│   │   ├── Footer.tsx         # Site footer
│   │   ├── ChefCard.tsx       # Chef display card
│   │   ├── MealCard.tsx       # Meal display card
│   │   ├── ReviewCard.tsx     # Review display card
│   │   ├── OrderCard.tsx      # Order display card
│   │   ├── LoadingSpinner.tsx # Loading indicator
│   │   ├── StatusLight.tsx    # API health indicator
│   │   └── ProtectedRoute.tsx # Route protection wrapper
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx    # Global authentication state
│   │
│   └── lib/
│       └── api.ts             # API integration layer
│
├── public/                     # Static assets
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── package.json               # Dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Django backend running on `http://127.0.0.1:8000`

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd foodie-v2/foodie-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
   ```
   If not set, defaults to `http://127.0.0.1:8000/api`

4. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🔌 API Integration

### Backend Connection
The frontend connects to Django REST API at `http://127.0.0.1:8000/api/`

**Ensure Django backend is running:**
```bash
cd /home/rivaldo/codes/foodie-v2
source venv/bin/activate
python manage.py runserver
```

### API Endpoints Used
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/users/register/` | POST | User registration | No |
| `/users/login/` | POST | User login (returns JWT) | No |
| `/users/profile/` | GET | Get current user | Yes |
| `/chefs/` | GET | List all chefs | No |
| `/chefs/{id}/` | GET | Get chef details | No |
| `/meals/` | GET | List all meals | No |
| `/meals/{id}/` | GET | Get meal details | No |
| `/orders/` | POST | Create new order | Yes |
| `/orders/user/` | GET | Get user's orders | Yes |
| `/reviews/` | GET/POST | List/create reviews | Yes (POST) |
| `/health/` | GET | API health check | No |

### Payments & M-Pesa

- Stripe checkout has been removed in favour of an M-Pesa-based flow.
- `MpesaPaymentForm` lives in `src/components/mpesa-payment-form.tsx` and uses `/payments/mpesa/initiate/` and `/payments/mpesa/status/` endpoints via the shared axios client.
- Ensure backend environment variables (consumer key/secret, shortcode, passkey) are populated before end-to-end testing.

### Mock Data Fallback
If the backend is unavailable, the frontend automatically falls back to mock data for:
- Chefs (3 sample chefs)
- Meals (3 sample meals)

This allows frontend development and testing without a running backend.

## 🎯 Features

### Authentication Flow
- JWT-based authentication
- Token stored in localStorage
- Global auth state via Context API
- Protected routes redirect to login
- Auto-logout on token expiration

### Pages & Routes

#### Public Routes
- **Home (`/`)**: Hero section, featured chefs, popular meals
- **Chefs (`/chefs`)**: Browse all chefs with ratings
- **Chef Detail (`/chefs/[id]`)**: Chef profile + their meals
- **Meals (`/meals`)**: Browse meals with search & category filters
- **Meal Detail (`/meals/[id]`)**: Meal info, reviews, order button
- **Login (`/login`)**: Email/password authentication
- **Register (`/register`)**: New user signup

#### Protected Routes (Require Authentication)
- **Orders (`/orders`)**: View order history and status
- **Profile (`/profile`)**: User profile with logout
- **Write Review (`/meals/[id]/review`)**: Submit meal reviews

### UI Components

#### Navigation
- **Navbar**: Responsive navigation with auth-aware links
- **StatusLight**: Real-time API health indicator (green/red)
- **Footer**: Site links and information

#### Cards
- **ChefCard**: Chef profile preview with rating
- **MealCard**: Meal preview with price and category
- **ReviewCard**: User review with star rating
- **OrderCard**: Order summary with status badge

#### Utilities
- **LoadingSpinner**: Animated loading indicator
- **ProtectedRoute**: HOC for route protection

## 🎨 Styling

### Tailwind Configuration
- **Primary Color**: Orange (#f97316)
- **Font**: Inter (Google Fonts)
- **Responsive**: Mobile-first design
- **Custom Utilities**: line-clamp-2, line-clamp-3

### Color Palette
```css
Orange Primary: #f97316
Orange Secondary: #fb923c
Background: #fafafa
Text: #171717
```

## 🧪 Testing Checklist

### Smoke Test Steps

1. **Homepage Load**
   - [ ] Hero section displays
   - [ ] Featured chefs load (3 cards)
   - [ ] Popular meals load (6 cards)
   - [ ] Navigation links work
   - [ ] Status light shows API status

2. **Browse Chefs**
   - [ ] Navigate to `/chefs`
   - [ ] All chefs display in grid
   - [ ] Click chef card → redirects to detail
   - [ ] Chef detail shows profile + meals

3. **Browse Meals**
   - [ ] Navigate to `/meals`
   - [ ] All meals display in grid
   - [ ] Search filter works
   - [ ] Category filter works
   - [ ] Click meal card → redirects to detail

4. **Meal Detail & Order**
   - [ ] Meal info displays correctly
   - [ ] Reviews section shows
   - [ ] "Order Now" button visible
   - [ ] Click order (not logged in) → redirects to login

5. **Authentication**
   - [ ] Register new user
   - [ ] Redirects to home after registration
   - [ ] Navbar shows "Orders" and "Profile"
   - [ ] Logout works
   - [ ] Login with existing user

6. **Protected Features**
   - [ ] Place an order (logged in)
   - [ ] Order appears in `/orders`
   - [ ] Order status displays
   - [ ] Write a review
   - [ ] Review appears on meal page

7. **Profile**
   - [ ] Navigate to `/profile`
   - [ ] User info displays
   - [ ] Logout button works

8. **Responsive Design**
   - [ ] Mobile menu works
   - [ ] Cards stack on mobile
   - [ ] Forms are usable on mobile

## 🐛 Troubleshooting

### Module Not Found Errors
If you see `Cannot resolve '@/...'`:
```bash
# Ensure tsconfig.json has correct path alias
"paths": {
  "@/*": ["./src/*"]
}

# Clear Next.js cache
rm -rf .next
npm run dev
```

### API Connection Issues
If API calls fail:
1. Check Django backend is running: `http://127.0.0.1:8000/api/health/`
2. Check CORS settings in Django `settings.py`
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
4. Check browser console for errors

### Port Already in Use
```bash
# Kill existing Next.js process
pkill -f "next dev"

# Or use different port
npm run dev -- -p 3001
```

## 📦 Dependencies

### Core
- `next@16.0.0` - React framework
- `react@19.2.0` - UI library
- `react-dom@19.2.0` - React DOM renderer

### Styling
- `tailwindcss@4.1.16` - Utility-first CSS
- `@tailwindcss/postcss@4` - PostCSS integration

### Development
- `typescript@5` - Type safety
- `eslint@9` - Code linting
- `@types/*` - TypeScript definitions

## 🔐 Security Notes

- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- No sensitive data in client-side code
- API keys should be in `.env.local` (not committed)
- CORS configured on Django backend

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Development Notes

- All pages use `'use client'` directive (client-side rendering)
- Authentication state managed globally via Context
- API calls include automatic error handling
- Mock data available for offline development
- TypeScript strict mode enabled

## 🎯 Future Enhancements

- [ ] Image optimization with Next.js Image component
- [ ] Server-side rendering for SEO
- [ ] Real-time order updates (WebSockets)
- [ ] Advanced search with Algolia
- [ ] Payment integration (Stripe/M-Pesa)
- [ ] Chef dashboard
- [ ] Admin panel
- [ ] Push notifications
- [ ] Dark mode toggle
- [ ] Multi-language support

## 📞 Support

For issues or questions:
- Check Django backend logs
- Check browser console for errors
- Verify API endpoint responses
- Review this documentation

---

**Built with ❤️ for Foodie v2**
