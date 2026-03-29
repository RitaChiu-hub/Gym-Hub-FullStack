import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const API = "http://localhost:3000/api";

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearError = () => setAuthError("");

  const login = async (email, password) => {
    setAuthError("");
    setIsLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }), // Login credentials. Turn JS object into JSON
      });
      const data = await res.json(); // Parse JSON response
      if (!res.ok) {
        setAuthError(data.error || "Login failed");
        return;
      }
      setToken(data.token); // Save token into React state
      setUser(data.user);
    } catch (err) {
      setAuthError("Cannot connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ username, email, password, role }) => {
    setAuthError("");
    setIsLoading(true);
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Registration failed");
        return false;
      }
      return true;
    } catch (err) {
      setAuthError("Cannot connect to server");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = async (newEmail) => {
    setAuthError("");
    try { 
      const res  = await fetch(`${API}/auth/email`, {
        method:  "PUT",
        headers: { // HTTP header Include authorization token
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`, 
        },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Failed to update email");
        return false;
      }
      setUser((prev) => ({ ...prev, email: newEmail }));
      return true;
    } catch (err) {
      setAuthError("Cannot connect to server");
      return false;
    }
  };

  const updatePassword = async (current, next) => {
    setAuthError("");
    try {
      const res  = await fetch(`${API}/auth/password`, {
        method:  "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Failed to update password");
        return false;
      }
      return true;
    } catch (err) {
      setAuthError("Cannot connect to server");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout,
      authError, clearError, isLoading,
      updateEmail, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}