# 🚀 Technical Highlights & Patterns

This document showcases the most critical logic patterns implemented in this system. Each section explains a complex problem and the specific technical solution applied.

---

## 🏗️ 1. Global Auth State Machine

### 💡 The Problem

Managing auth state across multiple tabs and components while keeping the UI in sync with Supabase.

### 🛠️ The Solution

Implemented a `useReducer` pattern combined with `onAuthStateChange` to ensure a single source of truth.

### 💻 Implementation

```typescript
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Helper function to map Supabase user to your custom User type
const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser || !supabaseUser.email) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    user_metadata: supabaseUser.user_metadata,
    app_metadata: supabaseUser.app_metadata,
  };
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_SESSION"; payload: any | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case "SET_SESSION":
      return { ...state, session: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        dispatch({ type: "SET_SESSION", payload: session });
        dispatch({
          type: "SET_USER",
          payload: mapSupabaseUser(session?.user || null),
        });
      } catch (error) {
        console.error("Error getting session:", error);
        dispatch({ type: "SET_ERROR", payload: "Failed to get session" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      dispatch({ type: "SET_SESSION", payload: session });
      dispatch({
        type: "SET_USER",
        payload: mapSupabaseUser(session?.user || null),
      });
      dispatch({ type: "SET_LOADING", payload: false });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      dispatch({ type: "SET_USER", payload: mapSupabaseUser(data?.user) });
      dispatch({ type: "SET_SESSION", payload: data?.session });
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const register = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Note: If email confirmation is enabled, user won't be logged in yet
      dispatch({ type: "SET_USER", payload: mapSupabaseUser(data?.user) });
      dispatch({ type: "SET_SESSION", payload: data?.session });
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

## 🏗️ 2. Get password strength function

### 💻 Implementation

```typescript
const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { strength: 0, label: "", color: "" };

  let strength = 0;
  if (pwd.length >= 6) strength++;
  if (pwd.length >= 10) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[a-z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[^A-Za-z0-9]/.test(pwd)) strength++;

  if (strength <= 2) return { strength: 1, label: "Weak", color: "bg-red-500" };
  if (strength <= 4)
    return { strength: 2, label: "Medium", color: "bg-yellow-500" };
  return { strength: 3, label: "Strong", color: "bg-green-500" };
};
```

## 🏗️ 2. Get password strength function

### 💡 The Problem

Managing auth state across multiple tabs and components while keeping the UI in sync with Supabase.

### 🛠️ The Solution

Implemented a `useReducer` pattern combined with `onAuthStateChange` to ensure a single source of truth.

### 💻 Implementation

```typescript
// Paste your code here
// Example:
const authReducer = (state, action) => {
  // ... your logic
};
```

## 🏗️ 2. Get password strength function

### 💡 The Problem

Managing auth state across multiple tabs and components while keeping the UI in sync with Supabase.

### 🛠️ The Solution

Implemented a `useReducer` pattern combined with `onAuthStateChange` to ensure a single source of truth.

### 💻 Implementation

```typescript
// Paste your code here
// Example:
const authReducer = (state, action) => {
  // ... your logic
};
```

## 🏗️ 2. Get password strength function

### 💡 The Problem

Managing auth state across multiple tabs and components while keeping the UI in sync with Supabase.

### 🛠️ The Solution

Implemented a `useReducer` pattern combined with `onAuthStateChange` to ensure a single source of truth.

### 💻 Implementation

```typescript
// Paste your code here
// Example:
const authReducer = (state, action) => {
  // ... your logic
};
```
