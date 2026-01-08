# Architecture Diagram

## Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      App.tsx (Root)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              <BrowserRouter>                         │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │           <AuthProvider>                       │ │  │
│  │  │  ┌──────────────────────────────────────────┐ │ │  │
│  │  │  │         <AppRoutes>                      │ │ │  │
│  │  │  │  Routes Configuration                    │ │ │  │
│  │  │  │  ┌─────────────────────────────────────┐│ │ │  │
│  │  │  │  │ /login          → LoginPage         ││ │ │  │
│  │  │  │  │ /dashboard      → ProtectedRoute    ││ │ │  │
│  │  │  │  │                    ↓                ││ │ │  │
│  │  │  │  │                 DashboardPage       ││ │ │  │
│  │  │  │  │ *               → Redirect          ││ │ │  │
│  │  │  │  └─────────────────────────────────────┘│ │ │  │
│  │  │  └──────────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Route Flow Diagram

```
                        User visits App
                             │
                             ▼
                      BrowserRouter
                             │
                             ▼
                      AuthProvider
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
    Check Token           Check Current Route
  (localStorage)                │
         │              ┌───────┼────────┐
    Set isLoading        │      │        │
         │           /login /dash  Other
         │               │      │        │
         ▼               ▼      ▼        ▼
    isAuthenticated=true/false
         │                      │
    ┌────┴────┐           ┌─────┴────────┐
    │          │           │              │
   YES        NO        LoginPage    Protected?
    │          │           │              │
    │    ┌─────┴──────┐    │          ┌───┴───┐
    │    │  Browser  │    │          │       │
    │    │  shows    │    │         YES      NO
    │    │  login    │    │          │       │
    │    └───────────┘    │      Show     Redirect
    │                     │     Page      to login
    │                  User
    │                 logs in
    │                  │
    │                  ▼
    │         setAuth + navigate
    │                  │
    │                  ▼
    │              isAuthenticated=true
    │                  │
    └──────────┬───────┘
               ▼
        Show Dashboard
```

## Component Hierarchy

```
App
│
├── BrowserRouter
│   │
│   ├── AuthProvider
│   │   │
│   │   └── AppRoutes
│   │       │
│   │       ├── Route /login
│   │       │   └── LoginPage
│   │       │       ├── TextInput (Email)
│   │       │       ├── PasswordInput
│   │       │       └── Button (Sign In)
│   │       │
│   │       └── Route /dashboard
│   │           └── ProtectedRoute
│   │               └── DashboardPage
│   │                   ├── AppShell
│   │                   ├── Header
│   │                   │   ├── Title
│   │                   │   ├── ThemeToggle
│   │                   │   └── Logout Button
│   │                   ├── Navbar
│   │                   │   ├── Details Section
│   │                   │   ├── Node Data Display
│   │                   │   └── User Info
│   │                   └── Main
│   │                       └── CytoscapeComponent
│   │
│   └── ThemeProvider (from main.tsx)
│       └── ColorSchemeScript
```

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│                 AuthContext                         │
│  ┌───────────────────────────────────────────────┐ │
│  │  State:                                       │ │
│  │  • user: User | null                         │ │
│  │  • isAuthenticated: boolean                  │ │
│  │  • isLoading: boolean                        │ │
│  │                                              │ │
│  │  Methods:                                    │ │
│  │  • login(token, userData)                   │ │
│  │  • logout()                                 │ │
│  └───────────────────────────────────────────────┘ │
│                      │                              │
│          Provided to all components                │
│          via useAuth() hook                        │
└─────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
      LoginPage     DashboardPage  ProtectedRoute
      └─ Uses:      └─ Uses:       └─ Uses:
        • login()      • user        • isAuthenticated
                       • logout()    • isLoading


┌──────────────────────────────────────────┐
│         Protected Route Logic             │
└──────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
isLoading?          isAuthenticated?
    │                   │
   YES          ┌───────┼───────┐
    │           │               │
    ▼          YES              NO
 Loading     ✓ Show          ✗ Redirect
 Screen      Page          to /login
```

## State Management

```
                   localStorage
                        │
                   (token storage)
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
  App Load      User Login           User Logout
    │               │                    │
    └─ Read      Save Token          Clear Token
       Token        │                    │
    │              │                     │
    Set in       Set in                 Remove
    AuthContext   AuthContext            from storage
    │              │                     │
    └──────┬───────┴────────────┬────────┘
           │                    │
           ▼                    ▼
     Update useAuth()     Update useAuth()
           │                    │
           └────────┬───────────┘
                    ▼
            Trigger re-render
                    │
          Route protection kicks in
```

## Authentication Flow - Detailed

```
1. User Opens App
   │
   ▼
App loads App.tsx
   │
   ├─ Create BrowserRouter
   │
   ├─ Wrap with AuthProvider
   │   │
   │   ├─ useEffect: Initialize Auth
   │   │   └─ Check localStorage for token
   │   │
   │   └─ If token exists:
   │       ├─ Set user object
   │       ├─ Set isAuthenticated=true
   │       └─ Set isLoading=false
   │
   ├─ Wrap with AppRoutes
   │
   └─ Router handles current location
       │
       ├─ If /login → Show LoginPage
       │
       ├─ If /dashboard → Check ProtectedRoute
       │   │
       │   └─ If isAuthenticated → Show DashboardPage
       │   └─ Else → Navigate to /login
       │
       └─ If other → Navigate to /dashboard


2. User Tries to Login
   │
   ▼
LoginPage form submitted
   │
   ├─ Call API (or use fake token)
   │
   ├─ On Success:
   │   ├─ Call login(token, userData)
   │   ├─ AuthContext saves in localStorage
   │   ├─ Update user state
   │   ├─ Set isAuthenticated=true
   │   └─ Call navigate('/dashboard')
   │
   └─ Router re-evaluates
       └─ /dashboard route now accessible
           └─ DashboardPage renders


3. User Clicks Logout
   │
   ▼
DashboardPage logout handler
   │
   ├─ Call logout()
   │
   ├─ AuthContext:
   │   ├─ Clear localStorage token
   │   ├─ Set user=null
   │   └─ Set isAuthenticated=false
   │
   ├─ Call navigate('/login')
   │
   └─ Router re-evaluates
       └─ /login route renders
           └─ LoginPage shown
```

## Request/Response Cycle (with API)

```
Client Side                           Server Side
───────────                           ──────────

User Login Form
    │
    ├─ Extract email/password
    │
    ▼
Call loginAPI(email, pwd) ────────────►  POST /api/login
                                         ├─ Validate credentials
                                         ├─ Generate token
                                         └─ Return { token, user }

        ◄─────────────────────────────── { token, user }
    │
    ▼
On Success:
    ├─ login(token, user)
    ├─ Save token → localStorage
    ├─ Save user → AuthContext
    └─ Navigate to /dashboard

    ▼
Protected Route Check:
    └─ isAuthenticated? ✓ YES

    ▼
Show DashboardPage

    ▼
Subsequent Requests:
    ├─ Get token from AuthContext/localStorage
    ├─ Add to header: Authorization: Bearer {token}
    │
    ▼
API Call ──────────────────────────────► GET /api/dashboard
                                         ├─ Verify token
                                         ├─ Return data
                                         └─ Response

        ◄─────────────────────────────── { data }
    │
    ▼
Update UI with response data
```

---

**Note:** These diagrams show the complete architecture and data flow of the refactored application.
