# Authentication Flow Diagrams

## 1. Complete Login Flow (Fixed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW - FIXED                              │
└─────────────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ User navigates to /login
  │     │
  │     └─→ Middleware checks:
  │           - token exists? NO
  │           - isAuthRoute? YES (/login)
  │           - Action: ALLOW ✅
  │
  ├─→ LoginPage renders
  │     │
  │     ├─ Email input field
  │     ├─ Password input field
  │     └─ Sign in button
  │
  ├─→ User fills form and clicks "Sign in"
  │     │
  │     └─→ handleSubmit() called
  │           ���
  │           └─→ useAuth().login(credentials)
  │                 │
  │                 ├─→ loginUser() API call
  │                 │     │
  │                 │     └─→ POST /api/users/login/
  │                 │           {
  │                 │             "email": "user@example.com",
  │                 │             "password": "password123"
  │                 │           }
  │                 │
  │                 ├─→ Backend validates credentials
  │                 │     │
  │                 │     ├─ Valid? YES
  │                 │     │   └─→ Return { token, user }
  │                 │     │
  │                 │     └─ Valid? NO
  │                 │         └─→ Throw error
  │                 │
  │                 ├─→ Frontend receives response
  │                 │     │
  │                 │     ├─→ setToken(newToken)
  │                 │     ├─→ setUser(newUser)
  │                 │     ├─→ localStorage.setItem('token', newToken)
  │                 │     ├─→ localStorage.setItem('user', JSON.stringify(newUser))
  │                 │     └─→ setTokenCookie(newToken)
  │                 │
  │                 ├���→ showToast('Welcome back!', 'success')
  │                 │
  │                 └─→ startTransition(() => {
  │                       router.push('/client/home')  ← KEY FIX
  │                     })
  │
  ├─→ Next.js Navigation triggered
  │     │
  │     └─→ Middleware intercepts redirect
  │           │
  │           ├─ Check: token exists? YES ✅
  │           ├─ Check: isAuthRoute('/client/home')? NO
  │           └─ Action: ALLOW ✅
  │
  ├─→ ClientHomePage loads
  │     │
  │     ├─→ useAuth() hook called
  │     │     │
  │     │     └─→ isAuthenticated = true ✅
  │     │
  │     └─→ Page renders content
  │           │
  │           ├─ "Personalised chef matches" heading
  │           ├─ Feed content
  │           └─ Bottom navigation
  │
  └─→ ✅ SUCCESS: User logged in on /client/home

PERSISTENCE:
  User refreshes page
    │
    ├─→ AuthContext hydration
    │     │
    │     ├─→ localStorage.getItem('token')
    │     ├─→ localStorage.getItem('user')
    │     └─→ setTokenCookie(token)
    │
    ├─→ Middleware validates token
    │
    └─→ ✅ Session restored
```

---

## 2. Registration Flow (Already Working)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW - WORKING                          │
└─────────────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ User navigates to /register
  │     │
  │     └─→ Middleware: no token + isAuthRoute → ALLOW ✅
  │
  ├─→ RegisterPage renders
  │     │
  │     ├─ Full name input
  │     ├─ Username input
  │     ├─ Email input
  │     ├─ Password input
  │     ├─ Role selector (Client/Chef)
  │     └─ Create account button
  │
  ├─→ User fills form and clicks "Create account"
  │     │
  │     └─→ handleSubmit() called
  │           │
  │           └─→ useAuth().register(data)
  │                 │
  │                 ├─→ registerUser() API call
  │                 │     │
  │                 │     └─→ POST /api/users/register/
  │                 │           {
  │                 │             "email": "newuser@example.com",
  │                 │             "username": "newuser",
  │                 │             "first_name": "New",
  │                 │             "last_name": "User",
  │                 │             "password": "password123",
  │                 │             "password_confirm": "password123",
  │                 │             "role": "client"
  │                 │           }
  │                 │
  │                 ├─→ Backend creates user
  │                 │     │
  │                 │     ├─ Valid? YES
  │                 │     │   └─→ Return { token, user }
  │                 │     │
  │                 │     └─ Valid? NO
  │                 │         └─→ Return errors
  │                 │
  │                 ├─→ Frontend receives response
  │                 │     │
  │                 │     ├─→ setToken(newToken)
  │                 │     ├─→ setUser(newUser)
  │                 │     ├─→ localStorage.setItem('token', newToken)
  │                 │     ├─→ localStorage.setItem('user', JSON.stringify(newUser))
  │                 │     └─→ setTokenCookie(newToken)
  │                 │
  │                 ├─→ showToast('Account created! Karibu.', 'success')
  │                 │
  │                 └─→ startTransition(() => {
  │                       router.replace('/client/home')
  │                     })
  │
  ├─→ Navigation to /client/home
  │
  └─→ ✅ SUCCESS: User registered and logged in
```

---

## 3. Middleware Route Matching (Fixed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│              MIDDLEWARE ROUTE MATCHING - FIXED                          │
└─────────────────────────────────────────────────────────────────────────┘

REQUEST ARRIVES
  │
  ├─→ Extract pathname from request
  │     │
  │     └─ Examples: /login, /register, /client/home, /auth, etc.
  │
  ├─→ Extract token from cookies
  │     │
  │     └─ token = req.cookies.get('token')?.value
  │
  ├─→ Check if isAuthRoute
  │     │
  │     ├─ pathname === '/auth'? 
  │     ├─ pathname === '/login'?          ← FIXED: Added exact match
  │     ├─ pathname === '/register'?       ← FIXED: Added exact match
  │     ├─ pathname.startsWith('/auth/')?
  │     ├─ pathname.startsWith('/login/')?  ← FIXED: Added wildcard
  │     └─ pathname.startsWith('/register/')? ← FIXED: Added wildcard
  │
  ├─→ Decision Logic
  │     │
  │     ├─ NO token AND NOT authRoute?
  │     │   └─→ Redirect to /auth (protect routes)
  │     │
  │     ├─ YES token AND IS authRoute?
  │     │   └─→ Redirect to /client/home (prevent re-login)
  │     │
  │     └─ Otherwise?
  │         └─→ Allow request (NextResponse.next())
  │
  └─→ MATCHER CONFIG (Fixed)
      │
      ├─ /client/:path*      (protect client routes)
      ├─ /chef/:path*        (protect chef routes)
      ├─ /auth/:path*        (auth routes)
      ├─ /login/:path*       ← FIXED: Added
      ├─ /register/:path*    ← FIXED: Added
      ├─ /login              ← FIXED: Added exact
      └─ /register           ← FIXED: Added exact

EXAMPLES:

Request: GET /login (no token)
  ├─ isAuthRoute? YES (/login === /login)
  ├─ token? NO
  └─ Action: ALLOW ✅

Request: GET /login (with token)
  ├─ isAuthRoute? YES (/login === /login)
  ├─ token? YES
  └─ Action: REDIRECT to /client/home ✅

Request: GET /client/home (no token)
  ├─ isAuthRoute? NO
  ├─ token? NO
  └─ Action: REDIRECT to /auth ✅

Request: GET /client/home (with token)
  ├─ isAuthRoute? NO
  ├─ token? YES
  └─ Action: ALLOW ✅
```

---

## 4. Session Persistence Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  SESSION PERSISTENCE FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

INITIAL LOGIN
  │
  ├─→ User logs in successfully
  │     │
  │     └─→ Token stored in:
  │           ├─ localStorage['token']
  │           ├─ localStorage['user']
  │           └─ cookie['token'] (SameSite=Lax, 7-day expiration)
  │
  └─→ User on /client/home

PAGE REFRESH
  │
  ├─→ Browser reloads page
  │
  ├─→ AuthContext hydration starts
  │     │
  │     ├─→ useEffect(() => { loadUser() }, [])
  │     │     │
  │     │     ├─→ Check if window exists (SSR safety)
  │     │     │
  │     │     ├─→ storedToken = localStorage.getItem('token')
  │     │     │
  │     │     ├─→ storedUser = localStorage.getItem('user')
  │     │     │
  │     │     ├─→ if (storedToken && storedUser)
  │     │     │     │
  │     │     │     ├─→ setToken(storedToken)
  │     │     │     ├─→ setUser(JSON.parse(storedUser))
  │     │     │     └─→ setTokenCookie(storedToken)
  │     │     │
  │     │     └─→ setHydrated(true)
  │     │
  │     └─→ useEffect(() => { fetchProfile() }, [token, hydrated])
  │           │
  │           ├─→ if (!hydrated) return
  │           │
  │           ├─→ if (!token) return
  │           │
  │           ├─→ getCurrentUser() API call
  │           │     │
  │           │     └─→ GET /api/users/profile/
  │           │           Headers: Authorization: Token {token}
  │           │
  │           ├─→ if (response.data)
  │           │     │
  │           │     ├─→ setUser(response.data)
  │           │     └─→ localStorage.setItem('user', JSON.stringify(response.data))
  │           │
  │           └─→ if (response.status === 401)
  │                 │
  │                 └─→ clearAuthState() (token expired)
  │
  ├─→ Middleware validates cookie token
  │     │
  │     └─→ token exists? YES → ALLOW ✅
  │
  ├─→ Page renders with restored session
  │
  └─→ ✅ User still logged in

BROWSER CLOSE & REOPEN
  │
  ├─→ Browser closes (cookies persist, localStorage persists)
  │
  ├─→ User reopens browser and navigates to app
  │
  ├─→ Same hydration process as PAGE REFRESH
  │
  └─→ ✅ User still logged in (session restored)

TOKEN EXPIRATION
  │
  ├─→ API returns 401 Unauthorized
  │
  ├─→ AuthContext catches 401
  │     │
  │     └─→ clearAuthState()
  │           ├─ localStorage.removeItem('token')
  │           ├─ localStorage.removeItem('user')
  │           ├─ setTokenCookie(null)
  │           ├─ setToken(null)
  │           └─ setUser(null)
  │
  ├─→ Middleware detects no token
  │
  ├─→ Redirects to /auth
  │
  └─→ ✅ User prompted to log in again
```

---

## 5. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

INVALID CREDENTIALS
  │
  ├─→ User enters wrong email/password
  │
  ├─→ loginUser() API call
  │     │
  │     └─→ POST /api/users/login/
  │           │
  │           └─→ Backend returns 401 Unauthorized
  │                 {
  │                   "detail": "Invalid email or password"
  │                 }
  │
  ├─→ Frontend catch block
  │     │
  │     ├─→ throw new Error(err.detail)
  │     │
  │     └─→ Caught in AuthContext.login()
  │
  ├─→ Error handling
  │     │
  │     ├─→ const message = error.message
  │     │
  │     ├─→ console.error('[Foodie] Login failed:', message)
  │     │
  │     ├─→ showToast(message, 'error')
  │     │     │
  │     │     └─→ Toast notification displays error
  │     │
  │     └─→ return { success: false, error: message }
  │
  ├─→ LoginPage receives error
  │     │
  │     ├─→ setError(result.error)
  │     │
  │     └─→ Error message renders in UI
  │           │
  │           └─ "Invalid email or password"
  │
  ├─→ User stays on /login page
  │
  └─→ User can retry

NETWORK ERROR
  │
  ├─→ API unreachable
  │
  ├─→ fetch() throws error
  │
  ├─→ Caught in loginUser()
  │     │
  │     └─→ throw new Error('Network error')
  │
  ├─→ Caught in AuthContext.login()
  │     │
  │     ├─→ const message = error.message
  │     │
  │     ├─→ showToast(message, 'error')
  │     │
  │     └─→ return { success: false, error: message }
  │
  ├─→ Error displays to user
  │
  └─→ User can retry

VALIDATION ERROR
  │
  ├─→ User submits invalid data
  │
  ├─→ Backend returns 400 Bad Request
  │     {
  │       "email": ["Invalid email format"],
  │       "password": ["Password too short"]
  │     }
  │
  ├─→ Frontend processes errors
  │     │
  │     └─→ Extract field errors
  │
  ├─→ Display field-specific errors
  │
  └─→ User corrects and retries

UNEXPECTED ERROR
  │
  ├─→ Unhandled exception
  │
  ├─→ Caught in catch block
  │     │
  │     ├─→ console.error('[Foodie] Login failed:', error)
  │     │
  │     ├─→ showToast('Login failed', 'error')
  │     │
  │     └─→ return { success: false, error: 'Login failed' }
  │
  └─→ Generic error message displayed
```

---

## 6. State Management Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

AUTHCONTEXT STATE

┌─ user: User | null
│   ├─ Initially: null
│   ├─ After login: { id, email, username, full_name, role, ... }
│   └─ After logout: null
│
├─ token: string | null
│   ├─ Initially: null
│   ├─ After login: "abc123def456..."
│   └─ After logout: null
│
├─ loading: boolean
│   ├─ Initially: true (hydrating)
│   ├─ During API call: true
│   └─ After API call: false
│
├─ hydrated: boolean
│   ├─ Initially: false
│   ├─ After localStorage check: true
│   └─ Stays: true
│
└─ isAuthenticated: boolean
    ├─ Computed: !!user && !!token
    ├─ Initially: false
    ├─ After login: true
    └─ After logout: false

COMPONENT USAGE

LoginPage:
  │
  ├─→ const { login, loading } = useAuth()
  │     │
  │     ├─ login: function to call on form submit
  │     └─ loading: boolean to disable button during request
  │
  └─→ Renders form with loading state

ClientHomePage:
  │
  ├─→ const { isAuthenticated, loading } = useAuth()
  │     │
  │     ├─ isAuthenticated: check if user is logged in
  │     └─ loading: check if still hydrating
  │
  ├─→ if (!loading && !isAuthenticated)
  │     └─→ router.replace('/auth')
  │
  └─→ Renders home content if authenticated

STORAGE SYNC

localStorage:
  ├─ token: stored after login
  ├─ user: stored after login
  └─ cleared on logout

Cookies:
  ├─ token: set after login (7-day expiration)
  └─ cleared on logout

AuthContext:
  ├─ user: in-memory state
  ├─ token: in-memory state
  └─ cleared on logout

Middleware:
  ├─ reads: cookie['token']
  └─ validates: token exists for protected routes
```

---

## 7. Router Navigation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  ROUTER NAVIGATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

BEFORE FIX: router.replace()
  │
  ├─→ router.replace('/client/home')
  │     │
  │     ├─ Replaces current history entry
  │     ├─ Doesn't add to browser history
  │     └─ ❌ Sometimes doesn't trigger in certain scenarios
  │
  └─→ Result: Unreliable redirect

AFTER FIX: router.push()
  │
  ├─→ router.push('/client/home')
  │     │
  │     ├─ Adds new history entry
  │     ├─ Adds to browser history
  │     ├─ Properly triggers Next.js navigation
  │     └─ ✅ Reliably triggers in all scenarios
  │
  ├─→ Next.js Navigation System
  │     │
  │     ├─→ Update URL in address bar
  │     │
  │     ├─→ Trigger middleware
  │     │     │
  │     │     └��→ Validate token
  │     │
  │     ├─→ Load new page component
  │     │
  │     └─→ Render new page
  │
  └─→ Result: Reliable redirect ✅

STARTRANSITION WRAPPER

startTransition(() => {
  router.push('/client/home')
})

Benefits:
  ├─ Non-blocking update
  ├─ Allows React to prioritize other updates
  ├─ Better UX during navigation
  └─ Prevents UI freezing

Flow:
  ├─→ Mark update as non-urgent
  ├─→ Allow other updates to complete
  ├─→ Then perform navigation
  └─→ Render new page
```

---

## 8. Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND (Next.js)
  │
  ├─ Pages
  │   ├─ /login (LoginPage)
  │   ├─ /register (RegisterPage)
  │   ├─ /client/home (ClientHomePage)
  │   └─ /chef/dashboard (ChefDashboardPage)
  │
  ├─ Contexts
  │   ├─ AuthContext (manages auth state)
  │   └─ ToastContext (manages notifications)
  │
  ├─ Hooks
  │   └─ useAuth() (access auth state and functions)
  │
  ├─ Middleware
  │   └─ middleware.ts (route protection)
  │
  └─ API Layer
      └─ src/lib/api.ts (API integration)

BACKEND (Django)
  │
  ├─ Endpoints
  │   ├─ POST /api/users/login/
  │   ├─ POST /api/users/register/
  │   └─ GET /api/users/profile/
  │
  ├─ Authentication
  │   ├─ Token-based (DRF Token Auth)
  │   └─ Returns token on login/register
  │
  └─ Database
      └─ User model with email, username, role, etc.

STORAGE
  │
  ├─ localStorage
  │   ├─ token (for persistence)
  │   └─ user (for persistence)
  │
  ├─ Cookies
  │   └─ token (for middleware access)
  │
  └─ Memory (AuthContext)
      ├─ user
      ├─ token
      ├─ loading
      └─ hydrated

FLOW
  │
  ├─ User logs in
  │   ├─→ Frontend sends credentials to backend
  │   ├─→ Backend validates and returns token
  │   ├─→ Frontend stores token (localStorage + cookie)
  │   ├─→ Frontend redirects to /client/home
  │   └─→ Middleware validates token
  │
  ├─ User refreshes page
  │   ├─→ AuthContext reads localStorage
  │   ├─→ AuthContext sets cookie
  │   ├─→ Middleware validates cookie
  │   └─→ Page renders with restored session
  │
  └─ User logs out
      ├─→ Frontend clears localStorage
      ├─→ Frontend clears cookie
      ├─→ Frontend redirects to /auth
      └─→ Middleware blocks access to protected routes
```

---

## Summary

These diagrams show:
1. ✅ Complete login flow (now working)
2. ✅ Registration flow (already working)
3. ✅ Middleware route matching (fixed)
4. ✅ Session persistence (working)
5. ✅ Error handling (working)
6. ✅ State management (working)
7. ✅ Router navigation (fixed)
8. ✅ Complete system architecture

All flows are now unified and working correctly!
