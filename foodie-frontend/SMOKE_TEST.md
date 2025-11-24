# 🧪 Foodie v2 - Smoke Test Checklist

## Pre-Test Setup

### Backend
- [ ] Django server running: `http://127.0.0.1:8000`
- [ ] Database migrated: `python manage.py migrate`
- [ ] Test data loaded (optional): `python manage.py loaddata fixtures.json`
- [ ] API health check passes: `curl http://127.0.0.1:8000/api/health/`

### Frontend
- [ ] Dependencies installed: `npm install`
- [ ] Dev server running: `npm run dev`
- [ ] Frontend accessible: `http://localhost:3000`
- [ ] No console errors on load

---

## Test Scenarios

### 1. Homepage (/) - Public Access
**Expected**: Landing page with hero, featured chefs, and meals

- [ ] **Hero Section**
  - Hero banner displays with title "Discover Amazing Chefs & Meals"
  - CTA buttons visible: "Browse Meals" and "Find Chefs"
  - Gradient background renders correctly

- [ ] **Featured Chefs Section**
  - 3 chef cards display
  - Each card shows: name, specialty, rating, experience
  - "View All →" link present
  - Cards are clickable

- [ ] **Popular Meals Section**
  - 6 meal cards display (or available meals)
  - Each card shows: name, price, category, rating
  - "View All →" link present
  - Cards are clickable

- [ ] **Navigation**
  - Navbar shows: Home, Chefs, Meals, Login, Register
  - Status light indicator visible (green if API online)
  - Mobile menu works (< 768px width)

- [ ] **Footer**
  - Footer displays with links
  - All sections visible: Brand, Quick Links, Support, Legal

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 2. Chefs Page (/chefs) - Browse All Chefs
**Expected**: Grid of all available chefs

- [ ] **Page Load**
  - URL: `http://localhost:3000/chefs`
  - Page title: "Our Chefs"
  - Description text displays

- [ ] **Chef Grid**
  - All chefs from API display
  - Grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile
  - Each card shows complete info

- [ ] **Chef Card Interaction**
  - Hover effect works (shadow increases)
  - Click redirects to chef detail page
  - No broken images

- [ ] **Fallback Behavior**
  - If API fails, shows mock data (3 chefs)
  - Warning message displays if using mock data

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 3. Chef Detail (/chefs/[id]) - Individual Chef
**Expected**: Chef profile with their meals

- [ ] **Page Load**
  - URL: `http://localhost:3000/chefs/1`
  - Chef profile displays
  - Loading spinner shows initially

- [ ] **Chef Profile**
  - Large profile image/icon
  - Name, specialty, rating, experience
  - Bio text displays
  - Professional layout

- [ ] **Chef's Meals Section**
  - Meals by this chef display
  - Grid layout matches meals page
  - If no meals: "No meals available yet" message

- [ ] **Navigation**
  - Click meal card → redirects to meal detail
  - Back button works

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 4. Meals Page (/meals) - Browse & Filter
**Expected**: Searchable, filterable meal list

- [ ] **Page Load**
  - URL: `http://localhost:3000/meals`
  - Page title: "Our Meals"
  - All meals display

- [ ] **Search Functionality**
  - Search input visible
  - Type in search box
  - Results filter in real-time
  - "Showing X meals" count updates

- [ ] **Category Filter**
  - Dropdown shows categories: All, Traditional, BBQ, etc.
  - Select category → meals filter
  - Count updates correctly

- [ ] **Combined Filters**
  - Search + category work together
  - Clear search → shows all in category
  - Change category → maintains search

- [ ] **Meal Grid**
  - Responsive grid layout
  - All meal info visible
  - Cards clickable

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 5. Meal Detail (/meals/[id]) - View & Order
**Expected**: Meal details with order and review options

- [ ] **Page Load**
  - URL: `http://localhost:3000/meals/1`
  - Meal image/icon displays
  - All details visible

- [ ] **Meal Information**
  - Name, category badge
  - Rating with star icon
  - Review count
  - Description
  - Price (KSh format)

- [ ] **Order Button (Not Logged In)**
  - "Order Now" button visible
  - Click button → redirects to `/login`
  - URL preserves return path

- [ ] **Reviews Section**
  - "Customer Reviews" heading
  - Reviews display (if any)
  - Each review shows: user, rating, comment, date
  - If no reviews: "No reviews yet" message

- [ ] **Write Review Link**
  - "Write a Review" button visible
  - Click → redirects to review page

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 6. Authentication - Register
**Expected**: New user registration flow

- [ ] **Registration Page**
  - URL: `http://localhost:3000/register`
  - Form displays with all fields
  - "Create Account" heading

- [ ] **Form Fields**
  - Full Name (required)
  - Username (required)
  - Email (required, email format)
  - Password (required, min 8 chars)
  - Confirm Password (required, must match)

- [ ] **Form Validation**
  - Empty fields show browser validation
  - Password mismatch shows error
  - Invalid email format rejected

- [ ] **Successful Registration**
  - Fill all fields correctly
  - Click "Sign Up"
  - Button shows "Creating account..."
  - Success → redirects to home
  - Navbar updates: shows "Orders", "Profile", "Logout"
  - User is logged in

- [ ] **Error Handling**
  - Duplicate email → shows error message
  - API error → shows error message
  - Error message styled (red background)

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 7. Authentication - Login
**Expected**: Existing user login

- [ ] **Login Page**
  - URL: `http://localhost:3000/login`
  - Form displays
  - "Welcome Back" heading

- [ ] **Form Fields**
  - Email (required)
  - Password (required)

- [ ] **Successful Login**
  - Enter valid credentials
  - Click "Sign In"
  - Button shows "Signing in..."
  - Success → redirects to home
  - Navbar updates to show auth links

- [ ] **Failed Login**
  - Wrong password → error message
  - Non-existent email → error message
  - Error persists until corrected

- [ ] **Navigation**
  - "Don't have an account? Sign up" link works
  - Link redirects to `/register`

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 8. Place Order (Authenticated)
**Expected**: Logged-in user can order meals

- [ ] **Pre-condition**
  - User is logged in
  - Navigate to any meal detail page

- [ ] **Order Flow**
  - "Order Now" button visible
  - Click button
  - Button shows "Processing..."
  - Success message: "Order placed successfully!"
  - Auto-redirect to `/orders` after 2 seconds

- [ ] **Order Confirmation**
  - Order appears in orders list
  - Order shows: meal name, status, date, price
  - Status badge displays (e.g., "Pending")

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 9. Orders Page (/orders) - Protected Route
**Expected**: User's order history

- [ ] **Access Control**
  - Not logged in → redirects to `/login`
  - Logged in → page displays

- [ ] **Page Load**
  - URL: `http://localhost:3000/orders`
  - "My Orders" heading
  - Loading spinner initially

- [ ] **Orders List**
  - All user orders display
  - Most recent first (if sorted)
  - Each order card shows:
    - Order ID
    - Meal name
    - Status badge (colored)
    - Date/time
    - Price

- [ ] **Empty State**
  - No orders → "No orders yet" message
  - "Browse Meals" button displays
  - Button links to `/meals`

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 10. Write Review (/meals/[id]/review) - Protected
**Expected**: Submit meal review

- [ ] **Access Control**
  - Not logged in → redirects to `/login`
  - Logged in → form displays

- [ ] **Review Form**
  - URL: `http://localhost:3000/meals/1/review`
  - "Write a Review" heading
  - Star rating selector (1-5 stars)
  - Comment textarea

- [ ] **Star Rating**
  - Click stars to select rating
  - Selected stars turn yellow
  - Rating number displays (e.g., "4 / 5")

- [ ] **Submit Review**
  - Fill rating and comment
  - Click "Submit Review"
  - Button shows "Submitting..."
  - Success → redirects to meal detail
  - Review appears on meal page

- [ ] **Cancel**
  - "Cancel" button visible
  - Click → returns to previous page

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 11. Profile Page (/profile) - Protected
**Expected**: User profile with info and logout

- [ ] **Access Control**
  - Not logged in → redirects to `/login`
  - Logged in → profile displays

- [ ] **Page Load**
  - URL: `http://localhost:3000/profile`
  - "My Profile" heading
  - User info displays

- [ ] **Profile Information**
  - Profile image/icon
  - Full name
  - Username (with @ prefix)
  - Email
  - Role (capitalized)
  - Phone (if available)

- [ ] **Quick Actions**
  - "View My Orders" button → links to `/orders`
  - "Browse Meals" button → links to `/meals`

- [ ] **Logout**
  - "Logout" button visible (top right)
  - Click logout
  - Redirects to home
  - Navbar updates (shows Login/Register)
  - User is logged out

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 12. Responsive Design - Mobile
**Expected**: Fully functional on mobile devices

- [ ] **Viewport Testing**
  - Test at 375px width (mobile)
  - Test at 768px width (tablet)
  - Test at 1024px+ (desktop)

- [ ] **Mobile Navigation**
  - Hamburger menu icon displays
  - Click → menu slides open
  - All links accessible
  - Click link → menu closes

- [ ] **Card Layouts**
  - Cards stack vertically on mobile
  - No horizontal overflow
  - Images scale properly
  - Text readable

- [ ] **Forms**
  - Input fields full width
  - Buttons full width
  - Touch targets large enough (44px min)
  - Keyboard doesn't obscure inputs

- [ ] **Typography**
  - Text sizes appropriate
  - No text cutoff
  - Line heights comfortable

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 13. API Status Indicator
**Expected**: Real-time API health monitoring

- [ ] **Status Light**
  - Visible in navbar (all pages)
  - Shows "API Online" or "API Offline"
  - Green dot when online
  - Red dot when offline

- [ ] **Backend Down Scenario**
  - Stop Django server
  - Wait 30 seconds
  - Status light turns red
  - Shows "API Offline"
  - Mock data loads instead

- [ ] **Backend Up Scenario**
  - Start Django server
  - Wait 30 seconds
  - Status light turns green
  - Shows "API Online"

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 14. Error Handling
**Expected**: Graceful error handling throughout

- [ ] **Network Errors**
  - Disconnect internet
  - Try to load page
  - Error message displays
  - No app crash

- [ ] **404 Errors**
  - Visit `/nonexistent`
  - 404 page displays (or redirects)
  - Navigation still works

- [ ] **API Errors**
  - Backend returns 500
  - Error message displays
  - User can retry or navigate away

- [ ] **Form Errors**
  - Invalid data → clear error messages
  - Errors styled consistently
  - Errors clear on correction

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

### 15. Performance & Loading
**Expected**: Fast load times and smooth interactions

- [ ] **Initial Load**
  - Homepage loads < 3 seconds
  - No flash of unstyled content
  - Loading spinners show during data fetch

- [ ] **Navigation**
  - Page transitions smooth
  - No layout shifts
  - Back button works correctly

- [ ] **Images**
  - Images load progressively
  - Placeholders show while loading
  - No broken image icons

- [ ] **Interactions**
  - Button clicks responsive
  - Form submissions fast
  - No UI freezing

**Result**: ✅ Pass / ❌ Fail  
**Notes**: _____________________

---

## Summary

### Test Results
- **Total Tests**: 15
- **Passed**: _____
- **Failed**: _____
- **Pass Rate**: _____%

### Critical Issues
1. _____________________
2. _____________________
3. _____________________

### Minor Issues
1. _____________________
2. _____________________
3. _____________________

### Recommendations
- [ ] _____________________
- [ ] _____________________
- [ ] _____________________

### Sign-off
- **Tester**: _____________________
- **Date**: _____________________
- **Environment**: Development / Staging / Production
- **Status**: ✅ Ready for Deployment / ❌ Needs Fixes

---

**Notes**: 
- Run tests in Chrome, Firefox, and Safari
- Test on actual mobile devices if possible
- Check browser console for warnings/errors
- Verify all API calls in Network tab
