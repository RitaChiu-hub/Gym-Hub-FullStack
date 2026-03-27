import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [user, setUser]   = useState(null);
  const [authError, setAuthError] = useState("");

  const clearError = () => setAuthError("");

  const login = (email, password) => {
    setAuthError("");
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) { setUser(found); }
    else { setAuthError("Incorrect email or password."); }
  };

  const register = ({ username, email, password, role }) => {
    setAuthError("");
    if (users.find((u) => u.email === email)) {
      setAuthError("This email is already registered.");
      return;
    }
    const newUser = { id: Date.now(), username, email, password, role };
    setUsers((prev) => [...prev, newUser]);
  };

  const logout = () => setUser(null);

  const updatePassword = (current, next) => {
    if (user.password !== current) {
      setAuthError("Current password is incorrect.");
      return false;
    }
    const updated = { ...user, password: next };
    setUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    return true;
  };

  const updateEmail = (newEmail) => {
    if (users.find((u) => u.email === newEmail && u.id !== user.id)) return false;
    const updated = { ...user, email: newEmail };
    setUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, authError, clearError, updatePassword, updateEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}