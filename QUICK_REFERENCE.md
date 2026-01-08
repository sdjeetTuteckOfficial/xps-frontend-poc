# Quick Reference Guide

## File Locations

| File                                | Purpose                    |
| ----------------------------------- | -------------------------- |
| `src/App.tsx`                       | Root component with Router |
| `src/routes/index.tsx`              | Route configuration        |
| `src/pages/LoginPage.tsx`           | Login page                 |
| `src/pages/DashboardPage.tsx`       | Dashboard page             |
| `src/components/ProtectedRoute.tsx` | Route protection           |
| `src/context/AuthContext.tsx`       | Auth state management      |

## Key Imports

```typescript
// Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Components
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppRoutes } from './routes';

// Hooks
const { login, logout, user, isAuthenticated, isLoading } = useAuth();
const navigate = useNavigate();
```

## Common Tasks

### Check if user is authenticated

```typescript
const { isAuthenticated } = useAuth();
if (!isAuthenticated) redirect to login
```

### Get current user

```typescript
const { user } = useAuth();
console.log(user?.name);
```

### Login a user

```typescript
const { login } = useAuth();
login('token-from-api', { name: 'User Name' });
```

### Logout a user

```typescript
const { logout } = useAuth();
const navigate = useNavigate();

logout();
navigate('/login', { replace: true });
```

### Navigate to a page

```typescript
const navigate = useNavigate();
navigate('/dashboard');
navigate('/login', { replace: true }); // Replace history
```

### Create a new protected route

```typescript
// In src/routes/index.tsx
import { MyPage } from '../pages/MyPage';

<Route
  path='/my-page'
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>;
```

### Create a new public route

```typescript
// In src/routes/index.tsx
import { PublicPage } from '../pages/PublicPage';

<Route path='/public' element={<PublicPage />} />;
```

## Route Paths

| Path         | Type      | Component      |
| ------------ | --------- | -------------- |
| `/login`     | Public    | LoginPage      |
| `/dashboard` | Protected | DashboardPage  |
| `/`          | Redirect  | → `/dashboard` |
| `*`          | Catch-all | → `/dashboard` |

## Hook Usage

### useAuth()

Get auth state and methods

```typescript
const {
  user, // Current user object or null
  isAuthenticated, // Boolean: is user logged in?
  isLoading, // Boolean: is auth check in progress?
  login, // Function: (token, userData) => void
  logout, // Function: () => void
} = useAuth();
```

### useNavigate()

Navigate programmatically

```typescript
const navigate = useNavigate();
navigate('/dashboard'); // Go to path
navigate(-1); // Go back
navigate('/login', { replace: true }); // Replace history
```

## Component Structure

### App.tsx

```
App
├── BrowserRouter
├── AuthProvider
└── AppRoutes
    ├── /login → LoginPage
    ├── /dashboard → ProtectedRoute → DashboardPage
    └── * → Redirect
```

## Error Handling

### When to use try-catch

```typescript
const handleLogin = async () => {
  try {
    const response = await loginAPI(email, password);
    login(response.token, response.user);
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    // Show error to user
  }
};
```

### When route is not found

Routes with `*` path automatically redirect authenticated users to `/dashboard`

## Performance Tips

### Lazy load pages

```typescript
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));

<Route
  path='/login'
  element={
    <Suspense>
      <LoginPage />
    </Suspense>
  }
/>;
```

### Memoize components

```typescript
import { memo } from 'react';

export const MyPage = memo(() => {
  // Component logic
});
```

## TypeScript Tips

### Type user object

```typescript
interface User {
  name: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

const { user } = useAuth(); // Typed as User | null
```

### Type route params

```typescript
import { useParams } from 'react-router-dom';

const { userId } = useParams<{ userId: string }>();
```

## Debugging

### Check auth state

```typescript
const { isAuthenticated, user, isLoading } = useAuth();
console.log({ isAuthenticated, user, isLoading });
```

### Check current route

```typescript
import { useLocation } from 'react-router-dom';

const location = useLocation();
console.log(location.pathname); // Current path
```

### Check navigation history

```typescript
// Browser DevTools → Application → Session Storage
// Look for 'token' key to see if auth is persisted
```

## Troubleshooting

### "useAuth must be used within an AuthProvider"

→ Make sure component is inside `<AuthProvider>`

### "Cannot use useNavigate outside Router"

→ Make sure component is inside `<BrowserRouter>`

### Page not found

→ Check route path in `src/routes/index.tsx`

### Protected route not working

→ Check `ProtectedRoute` component wraps the page

### Auth state lost on refresh

→ Check if token is stored in localStorage

## Build & Deploy

```bash
# Development
npm run dev

# Build for production
npm run build

# Output is in dist/ folder

# Deploy dist/ folder to your hosting
```

---

**Last Updated:** January 8, 2026
**Version:** 1.0 (Refactored)
