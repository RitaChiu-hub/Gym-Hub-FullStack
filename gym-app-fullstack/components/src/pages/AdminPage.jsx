import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:3000/api";

function AdminPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [filter, setFilter]     = useState("all"); // "all" | "unread" | "read"
  const [loading, setLoading]   = useState(true);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  /* ── Fetch messages ── */
  const fetchMessages = async () => {
    try {
      const res  = await fetch(`${API}/messages`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setMessages(data);
    } catch (err) {
      console.error("fetchMessages error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  /* ── Toggle read ── */
  const handleToggleRead = async (id) => {
    try {
      const res  = await fetch(`${API}/messages/${id}/read`, {
        method: "PUT",
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? data : m));
      }
    } catch (err) {
      console.error("toggleRead error:", err);
    }
  };

  /* ── Delete message ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`${API}/messages/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("deleteMessage error:", err);
    }
  };

  /* ── Filter ── */
  const visible = messages.filter(m => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read")   return m.is_read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <article className="profile-page" style={{ maxWidth: "720px" }}>

      {/* Header */}
      <div className="profile-card">
        <div style={{ fontSize:"2rem" }}>📬</div>
        <div className="profile-meta">
          <h2 className="profile-username">Admin Dashboard</h2>
          <span className="user-badge user-badge--admin">Admin</span>
        </div>
        {unreadCount > 0 && (
          <span style={{ marginLeft:"auto", background:"#ef4444", color:"#fff", borderRadius:"999px", padding:"0.2rem 0.7rem", fontSize:"0.82rem", fontWeight:700 }}>
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Messages section */}
      <section className="profile-section">
        <div className="profile-section-header">
          <h3 className="profile-section-title">Contact Messages</h3>
          <div style={{ display:"flex", gap:"0.4rem" }}>
            {["all","unread","read"].map(f => (
              <button
                key={f}
                className={`filter-pill ${filter===f?"filter-pill--active":""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="members-empty">Loading messages...</p>
        ) : visible.length === 0 ? (
          <p className="members-empty">No {filter !== "all" ? filter : ""} messages.</p>
        ) : (
          <ul style={{ display:"flex", flexDirection:"column", gap:"0.75rem", listStyle:"none", padding:0 }}>
            {visible.map(m => (
              <li key={m.id} className="history-item" style={{
                borderLeft: m.is_read ? "3px solid var(--color-border)" : "3px solid var(--color-primary)",
                opacity: m.is_read ? 0.75 : 1,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.5rem" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.2rem", flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <span className="history-item-title">{m.name}</span>
                      {!m.is_read && (
                        <span style={{ fontSize:"0.72rem", fontWeight:700, background:"var(--color-primary-light)", color:"var(--color-primary)", borderRadius:"999px", padding:"0.1rem 0.5rem" }}>
                          New
                        </span>
                      )}
                    </div>
                    <span className="history-item-schedule">{m.email}</span>
                    <p style={{ color:"var(--color-text)", fontSize:"0.92rem", marginTop:"0.4rem", lineHeight:1.6 }}>
                      {m.message}
                    </p>
                    <span className="history-item-schedule">
                      {new Date(m.created_at).toLocaleDateString("en-US", {
                        year:"numeric", month:"short", day:"numeric",
                        hour:"2-digit", minute:"2-digit"
                      })}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:"0.4rem", flexShrink:0 }}>
                    <button
                      className="info-save-btn"
                      onClick={() => handleToggleRead(m.id)}
                      title={m.is_read ? "Mark as unread" : "Mark as read"}
                    >
                      {m.is_read ? "Unread" : "✓ Read"}
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => handleDelete(m.id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

export default AdminPage;