import { useState, useEffect } from "react";

const API = "http://localhost:3000/api";

function UserRoleManager({ token, currentUserId }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [notice,  setNotice]  = useState("");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  /* ── Load all users when the section first appears ── */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res  = await fetch(`${API}/users`, { headers: authHeaders });
        const data = await res.json();
        if (res.ok) setUsers(data);
        else setError(data.error || "Failed to load users");
      } catch {
        setError("Cannot connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  /* ── Change one user's role ── */
  const handleRoleChange = async (user, newRole) => {
    setError("");
    setNotice("");
    try {
      const res = await fetch(`${API}/users/${user.id}/role`, {
        method:  "PUT",
        headers: authHeaders,
        body:    JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update role");
        return;
      }
      setUsers(prev => prev.map(u => (u.id === data.id ? data : u)));
      setNotice(`${data.username} is now a ${data.role}. They need to sign out and sign in again to see the change.`);
    } catch {
      setError("Cannot connect to server");
    }
  };

  return (
    <section className="profile-section">
      <h3 className="profile-section-title">Manage User Roles</h3>

      {notice && <p className="login-success" role="status">{notice}</p>}
      {error  && <p className="login-error"   role="alert">{error}</p>}

      {loading ? (
        <p className="members-empty">Loading users...</p>
      ) : (
        <ul style={{ display:"flex", flexDirection:"column", gap:"0.5rem", listStyle:"none", padding:0 }}>
          {users.map(u => (
            <li key={u.id} className="history-item"
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"0.5rem" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.2rem" }}>
                <span className="history-item-title">{u.username}</span>
                <span className="history-item-schedule">{u.email}</span>
              </div>

              {u.role === "admin" || u.id === currentUserId ? (
                <span className={`user-badge user-badge--${u.role}`}>{u.role}</span>
              ) : (
                <select
                  className="role-select"
                  value={u.role}
                  onChange={e => handleRoleChange(u, e.target.value)}
                  aria-label={`Role for ${u.username}`}
                >
                  <option value="member">Member</option>
                  <option value="trainer">Trainer</option>
                </select>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default UserRoleManager;