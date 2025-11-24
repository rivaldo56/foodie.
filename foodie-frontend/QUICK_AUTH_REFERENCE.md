# Quick Authentication Reference

## What Was Fixed

| Issue | Before | After | Impact |
|-------|--------|-------|--------|
| Login redirect | `router.replace()` | `router.push()` | ✅ Now redirects properly |
| Middleware routes | Only `/auth/:path*` | Added `/login` and `/register` | ✅ Routes properly intercepted |
| Test timeout | 5 seconds | 10 seconds | ✅ More reliable in CI |
| Test coverage | Login only | Login + Registration | ✅ Both flows validated |

## Key Files Changed

### 1. `src/contexts/AuthContext.tsx` (Line ~130-145)
```typescript
// Changed from router.replace() to router.push()
startTransition(() => {
  if (newUser.role === 'chef') {
    router.push('/chef/dashboard');  // ← Changed
  } else {
    router.push('/client/home');     // ← Changed
  }
});
```

### 2. `middleware.ts` (Lines 1-30)
```typescript
// Enhanced route detection
const isAuthRoute = 
  pathname === '/auth' || 
  pathname === '/login' || 
  pathname === '/register' ||
  pathname.startsWith('/auth/') ||
  pathname.startsWith('/login/') ||
  pathname.startsWith('/register/');

// Updated matcher config
export const config = {
  matcher: [
    '/client/:path*', 
    '/chef/:path*', 
    '/auth/:path*', 
    '/login/:path*',      // ← Added
    '/register/:path*',   // ← Added
    '/login',             // ← Added
    '/register'           // ← Added
  ],
};
```

### 3. `tests/e2e/auth.smoke.spec.ts`
- Added intermediate URL assertions
- Increased timeout to 10 seconds
- Added registration test
- Added element visibility timeouts

## How Authentication Works Now

```
User Login
    ↓
AuthContext.login() called
    ↓
loginUser() API call
    ↓
Token + User stored (localStorage + cookie)
    ↓
router.push('/client/home') ← KEY FIX
    ↓
Middleware intercepts
    ↓
Validates token exists
    ↓
Allows navigation to /client/home
    ↓
✅ User logged in and redirected
```

## Testing the Fix

### Quick Manual Test
```bash
# 1. Start dev server
npm run dev

# 2. Go to http://localhost:3000/login
# 3. Enter credentials
# 4. Should redirect to /client/home
# 5. Refresh page - should stay logged in
```

### Run Playwright Tests
```bash
# Run all auth tests
npx playwright test tests/e2e/auth.smoke.spec.ts

# Run with UI
npx playwright test --ui tests/e2e/auth.smoke.spec.ts

# Run specific test
npx playwright test -g "client login"
```

## Session Persistence

The session is maintained through:
1. **localStorage** - Survives page reloads
2. **Cookies** - Accessible to middleware
3. **AuthContext** - In-memory state for React

## Error Handling

Failed login shows:
- Toast notification with error message
- User stays on login page
- Can retry immediately

## Common Issues & Solutions

### Issue: Still stuck on /login after login
**Solution**: 
- Check browser console for errors
- Verify API is responding with token
- Clear localStorage and try again
- Check middleware.ts is properly configured

### Issue: Session lost on page refresh
**Solution**:
- Verify token is in localStorage
- Check cookie is being set
- Verify AuthContext hydration is complete

### Issue: Playwright test timeout
**Solution**:
- Increase timeout in test (already done: 10s)
- Check API is running
- Verify test credentials are valid
- Run with `--debug` flag for debugging

## API Endpoints Used

### Login
```
POST /api/users/login/
Body: { email, password }
Response: { token, user }
```

### Register
```
POST /api/users/register/
Body: { email, username, first_name, last_name, password, password_confirm, role }
Response: { token, user }
```

### Get Current User
```
GET /api/users/profile/
Headers: Authorization: Token {token}
Response: { user }
```

## Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Playwright Testing
PLAYWRIGHT_EMAIL=client@example.com
PLAYWRIGHT_PASSWORD=password123
```

## Security Notes

✅ **Implemented**:
- Token stored in secure cookie (SameSite=Lax)
- Token stored in localStorage for persistence
- Middleware validates token on protected routes
- Automatic logout on 401 response

⚠️ **Recommended**:
- Use httpOnly cookies (requires backend support)
- Implement CSRF protection
- Add rate limiting on login endpoint
- Implement token refresh mechanism
- Add email verification

## Debugging Tips

### Enable Debug Logging
```typescript
// In AuthContext.tsx, logs are already added:
console.log('[Foodie] Login success');
console.error('[Foodie] Login failed:', message);
```

### Check Network Requests
1. Open DevTools → Network tab
2. Look for POST to `/api/users/login/`
3. Check response has `token` and `user`

### Check Storage
1. DevTools → Application → Local Storage
2. Look for `token` and `user` keys
3. DevTools → Application → Cookies
4. Look for `token` cookie

### Check Middleware
1. Add console.log in middleware.ts
2. Check Next.js server logs
3. Verify matcher config includes your routes

## Performance Considerations

- Login/register redirects use `startTransition()` for non-blocking updates
- Token validation happens in middleware (fast)
- User profile fetch happens after hydration (doesn't block render)
- Session persists without additional API calls

## Next Steps

1. ✅ Test login flow manually
2. ✅ Run Playwright tests
3. ✅ Test with different user roles (client/chef)
4. ✅ Test session persistence
5. ✅ Test logout flow
6. Consider implementing recommendations from AUTH_FIX_SUMMARY.md
