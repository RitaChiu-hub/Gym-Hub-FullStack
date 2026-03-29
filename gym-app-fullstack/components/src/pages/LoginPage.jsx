import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, register, authError, clearError } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "member" });
  const [localError, setLocalError]   = useState("");
  const [successMsg, setSuccessMsg]   = useState("");

  const update = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setLocalError("");
    clearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "register") {
      if (!/^[a-zA-Z]+$/.test(form.username)) { setLocalError("Username must contain letters only."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setLocalError("Please enter a valid email address."); return; }
      if (form.password !== form.confirmPassword) { setLocalError("Passwords do not match."); return; }
      if (form.password.length < 6) { setLocalError("Password must be at least 6 characters."); return; }
      register({ username: form.username, email: form.email, password: form.password, role: form.role });
      if (!authError) {
        setSuccessMsg("Account created! Please sign in with your email.");
        setForm({ username: "", email: "", password: "", confirmPassword: "", role: "member" });
        setMode("login");
      }
    } else {
      login(form.email, form.password);
    }
  };

  const switchMode = (next) => {
    setForm({ username: "", email: "", password: "", confirmPassword: "", role: "member" });
    setLocalError("");
    setSuccessMsg("");
    clearError();
    setMode(next);
  };

  const error = localError || authError;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🏋️</div>
        <h2 className="login-title">IronPeak Gym</h2>
        <p className="login-subtitle">
          {mode === "login" ? "Sign in to your account" : "Create a new account"}
        </p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`} onClick={() => switchMode("login")} type="button">Sign In</button>
          <button className={`auth-tab ${mode === "register" ? "auth-tab--active" : ""}`} onClick={() => switchMode("register")} type="button">Register</button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" name="username" value={form.username} onChange={update} placeholder="Letters only" required />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={form.password} onChange={update} placeholder="Enter your password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          </div>

          {mode === "register" && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Re-enter your password" autoComplete="new-password" required />
              </div>
              <div className="form-group">
                <label htmlFor="role">I am a...</label>
                <select id="role" name="role" value={form.role} onChange={update} className="role-select">
                  <option value="member">Member</option>
                  <option value="trainer">Trainer</option>
                </select>
              </div>
            </>
          )}

          {successMsg && <p className="login-success" role="status">{successMsg}</p>}
          {error      && <p className="login-error"   role="alert">{error}</p>}

          <button type="submit" className="btn-button login-submit">
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;