import { createContext, useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, []);

  // 2. Sync State changes to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else if (!loading) {
      localStorage.removeItem("user");
    }
  }, [user, loading]);

  // --- LOGIN (Simplified) ---
  const login = async (email, password) => {
    // No try/catch here! We want the error to reach Login.jsx
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };

  // --- SIGNUP (Simplified) ---
  const signup = async (userData) => {
    // No try/catch here! We want the error to reach Signup.jsx
    // Check if userData is FormData (for file uploads) or regular object
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
    try {
      await api.post("/auth/logout");
      toast.success("Logged out successfully"); // We can keep toast here as logout has no form
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, signup, logout, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
