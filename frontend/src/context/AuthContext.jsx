import { createContext, useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session version: increments on every login/logout to invalidate stale updates
  const sessionVersionRef = useRef(0);

  // Abort controller: cancels all in-flight API requests on logout
  const abortControllerRef = useRef(null);

  // Create a fresh AbortController for the current session
  const createAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  // Safe setUser that checks session version before updating —
  // prevents stale API responses from overwriting auth state.
  const safeSetUser = useCallback((newUser, expectedVersion) => {
    // If no expectedVersion is provided, always allow (for login/logout calls)
    if (
      expectedVersion !== undefined &&
      expectedVersion !== sessionVersionRef.current
    ) {
      console.warn("[Auth] Blocked stale setUser — session version mismatch", {
        expected: expectedVersion,
        current: sessionVersionRef.current,
      });
      return;
    }

    setUser((prevUser) => {
      if (!newUser) return null;

      // Preserve token when profile refresh endpoints return user payloads
      // without auth fields.
      if (
        typeof newUser === "object" &&
        !Array.isArray(newUser) &&
        !newUser.token &&
        prevUser?.token
      ) {
        return { ...newUser, token: prevUser.token };
      }

      return newUser;
    });
  }, []);

  // Expose the current session version so components can capture it at mount time
  const getSessionVersion = useCallback(() => sessionVersionRef.current, []);

  // 1. Load User from LocalStorage on Startup
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("user");
      }
    }
    // Create initial abort controller
    createAbortController();
    setLoading(false);
  }, [createAbortController]);

  // 2. Sync State changes to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else if (!loading) {
      localStorage.removeItem("user");
    }
  }, [user, loading]);

  // --- LOGIN ---
  const login = async (email, password) => {
    // 1. Abort any in-flight requests from the previous session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Increment session version to invalidate any stale callbacks
    sessionVersionRef.current += 1;
    const loginVersion = sessionVersionRef.current;

    // 3. Clear all stale auth data
    localStorage.removeItem("user");
    sessionStorage.clear();
    setUser(null);

    // 4. Clear the old JWT cookie on the server before issuing the new login
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore — cookie may already be cleared or server unreachable
    }

    // 5. Create a fresh AbortController for the new session
    createAbortController();

    // 6. Perform the actual login (no try/catch — let errors propagate to Login.jsx)
    const { data } = await api.post("/auth/login", { email, password });

    // 7. Guard against a concurrent logout that happened while the login was in-flight
    if (sessionVersionRef.current !== loginVersion) {
      console.warn(
        "[Auth] Login response discarded — session changed during login",
      );
      return data;
    }

    setUser(data);
    return data;
  };

  // --- SIGNUP ---
  const signup = async (userData) => {
    // Abort previous session requests & bump version
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    sessionVersionRef.current += 1;

    localStorage.removeItem("user");
    sessionStorage.clear();
    setUser(null);

    // Clear old cookie
    try {
      await api.post("/auth/logout");
    } catch (e) {
      /* ignore */
    }

    createAbortController();

    const isFormData = userData instanceof FormData;
    const { data } = await api.post("/auth/signup", userData, {
      headers: isFormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
    });
    setUser(data);
    return data;
  };

  // --- LOGOUT ---
  const logout = async () => {
    // 1. Abort ALL in-flight API requests immediately so stale responses
    //    can never call setUser() after we clear state.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Increment session version to block any stale safeSetUser calls
    sessionVersionRef.current += 1;

    // 3. Clear all client-side auth data
    localStorage.removeItem("user");
    sessionStorage.clear();
    setUser(null);

    // 4. Clear the JWT cookie on the server
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignore errors — we've already cleared local state
      console.error("Logout API error (ignored):", error);
    }

    // 5. Create a fresh AbortController for the next session
    createAbortController();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: safeSetUser,
        login,
        signup,
        logout,
        loading,
        getSessionVersion,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
