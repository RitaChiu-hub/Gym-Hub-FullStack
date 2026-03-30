import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClasses } from "../context/ClassesContext";

const API = "http://localhost:3000/api";

function Avatar({ name }) {
  return <div className="profile-avatar">{name ? name.slice(0,2).toUpperCase() : "?"}</div>;
}

function LevelBadge({ level }) {
  if (!level) return null;
  return <span className={`level-badge level-badge--${level}`}>{level.charAt(0).toUpperCase()+level.slice(1)}</span>;
}

/* ── Role helpers ── */
function roleLabel(role) {
  if (role === "admin")   return "Admin";
  if (role === "trainer") return "Trainer";
  return "Member";
}

/* ── Member Class History ── */
function ClassHistory() {
  const { classes } = useClasses();
  const [tab, setTab] = useState("upcoming");

  const todayISO = new Date().toISOString().split("T")[0];

  const myClasses = classes.filter(c => c.userStatus === "enrolled" || c.userStatus === "waitlist");
  const upcoming  = myClasses.filter(c => !c.date || c.date >= todayISO).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  const past      = myClasses.filter(c => c.date && c.date < todayISO).sort((a,b)=>b.date.localeCompare(a.date));
  const attended  = past;

  const tabs = [
    { key:"upcoming", label:`Upcoming (${upcoming.length})` },
    { key:"past",     label:`Past (${past.length})` },
    { key:"attended", label:`Attended (${attended.length})` },
  ];

  const listFor  = { upcoming, past, attended };
  const emptyMsg = {
    upcoming: "No upcoming classes.",
    past:     "No past classes yet.",
    attended: "No attended classes yet — trainers will mark your attendance.",
  };

  return (
    <section className="profile-section">
      <h3 className="profile-section-title">My Classes</h3>
      <div className="history-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`history-tab ${tab===t.key?"history-tab--active":""}`} onClick={()=>setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {listFor[tab].length === 0 ? (
        <p className="members-empty">{emptyMsg[tab]}</p>
      ) : (
        <ul className="history-list">
          {listFor[tab].map(c => (
            <li key={c.id} className="history-item">
              <div className="history-item-top">
                <span className="history-item-title">{c.title}</span>
                <LevelBadge level={c.level} />
              </div>
              <span className="history-item-schedule">{c.schedule}</span>
              <div className="history-item-status">
                {c.userStatus === "waitlist"
                  ? <span className="waitlist-label">⏳ Waitlist</span>
                  : <span className="enrolled-label">✓ Enrolled</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Trainer Class List ── */
function TrainerClasses() {
  const { classes } = useClasses();
  const { user } = useAuth();
  const [tab, setTab] = useState("upcoming");

  const todayISO = new Date().toISOString().split("T")[0];

  const myClasses = classes.filter(c =>
    c.trainer_id === user.id || c.trainer === user.username
  );
  const upcoming = myClasses.filter(c => !c.date || c.date >= todayISO).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  const past     = myClasses.filter(c => c.date && c.date < todayISO).sort((a,b)=>b.date.localeCompare(a.date));

  const tabs = [
    { key:"upcoming", label:`Upcoming (${upcoming.length})` },
    { key:"past",     label:`Past (${past.length})` },
  ];
  const listFor = { upcoming, past };
  const emptyMsg = {
    upcoming: "No upcoming classes.",
    past:     "No past classes yet.",
  };

  return (
    <section className="profile-section">
      <h3 className="profile-section-title">My Classes</h3>
      <div className="history-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`history-tab ${tab===t.key?"history-tab--active":""}`} onClick={()=>setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {listFor[tab].length === 0 ? (
        <p className="members-empty">{emptyMsg[tab]}</p>
      ) : (
        <ul className="history-list">
          {listFor[tab].map(c => (
            <li key={c.id} className="history-item">
              <div className="history-item-top">
                <span className="history-item-title">{c.title}</span>
                <LevelBadge level={c.level} />
              </div>
              <span className="history-item-schedule">{c.schedule}</span>
              <div className="history-item-status">
                <span className="enrolled-label">👟 {c.enrolled ?? 0} / {c.capacity ?? "∞"} enrolled</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Admin Dashboard Card (embedded in Profile) ── */
function AdminDashboardCard({ token }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [filter,   setFilter]   = useState("all");
  const [loading,  setLoading]  = useState(false);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchMessages = async () => {
    setLoading(true);
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

  const handleToggle = () => {
    if (!open) fetchMessages();
    setOpen(o => !o);
  };

  const handleToggleRead = async (id) => {
    try {
      const res  = await fetch(`${API}/messages/${id}/read`, { method:"PUT", headers: authHeaders });
      const data = await res.json();
      if (res.ok) setMessages(prev => prev.map(m => m.id === id ? data : m));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`${API}/messages/${id}`, { method:"DELETE", headers: authHeaders });
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error(err); }
  };

  const visible = messages.filter(m => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read")   return m.is_read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <section className="profile-section">
      {/* Admin Dashboard Card */}
      <div className="profile-card" style={{ justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <div style={{ fontSize:"2rem" }}>📬</div>
          <div className="profile-meta">
            <h3 className="profile-section-title" style={{ margin:0 }}>Admin Dashboard</h3>
            {unreadCount > 0 && (
              <span style={{ fontSize:"0.78rem", fontWeight:700, background:"#fee2e2", color:"#ef4444", borderRadius:"999px", padding:"0.1rem 0.5rem" }}>
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>
        <button className="btn-button" onClick={handleToggle}>
          {open ? "Close Dashboard" : "Manage Dashboard"}
        </button>
      </div>

      {/* Expandable Messages */}
      {open && (
        <div style={{ marginTop:"1rem" }}>
          <div className="profile-section-header">
            <h3 className="profile-section-title">Contact Messages</h3>
            <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem" }}>
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
                      <button className="info-save-btn" onClick={() => handleToggleRead(m.id)}
                        title={m.is_read ? "Mark as unread" : "Mark as read"}>
                        {m.is_read ? "Unread" : "✓ Read"}
                      </button>
                      <button className="remove-btn" onClick={() => handleDelete(m.id)} title="Delete">
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Main Page ── */
function ProfilePage() {
  const { user, token, updatePassword, updateEmail } = useAuth();
  const [showPwForm,   setShowPwForm]   = useState(false);
  const [pwSuccess,    setPwSuccess]    = useState(false);
  const [pwForm,       setPwForm]       = useState({ current:"", next:"", confirm:"" });
  const [pwError,      setPwError]      = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput,   setEmailInput]   = useState(user.email);
  const [emailError,   setEmailError]   = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  const updatePwForm = e => { setPwForm(f=>({...f,[e.target.name]:e.target.value})); setPwError(""); };

  const handleSavePassword = async e => {
    e.preventDefault();
    if (pwForm.next.length < 6)        { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    const ok = await updatePassword(pwForm.current, pwForm.next);
    if (ok) { setPwSuccess(true); setShowPwForm(false); setPwForm({current:"",next:"",confirm:""}); }
    else      setPwError("Current password is incorrect.");
  };

  const handleSaveEmail = async () => {
    setEmailError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) { setEmailError("Please enter a valid email address."); return; }
    const ok = await updateEmail(emailInput);
    if (ok) { setEmailSuccess(true); setEditingEmail(false); setTimeout(()=>setEmailSuccess(false), 3000); }
    else      setEmailError("This email is already registered.");
  };

  return (
    <article className="profile-page">
      {/* Card */}
      <div className="profile-card">
        <Avatar name={user.username} />
        <div className="profile-meta">
          <h2 className="profile-username">{user.username}</h2>
          {/* ✅ 修正：加入 admin role 判斷 */}
          <span className={`user-badge user-badge--profile user-badge--${user.role}`}>
            {roleLabel(user.role)}
          </span>
        </div>
      </div>

      {/* Account Info */}
      <section className="profile-section">
        <h3 className="profile-section-title">Account Info</h3>
        <div className="info-table">
          <div className="info-row"><span className="info-label">Username</span><span className="info-value">{user.username}</span></div>
          <div className="info-row">
            <span className="info-label">Email</span>
            {editingEmail ? (
              <div className="info-edit-group">
                <input className="info-edit-input" type="email" value={emailInput} onChange={e=>{setEmailInput(e.target.value);setEmailError("");}} autoFocus />
                <button className="info-save-btn" onClick={handleSaveEmail}>Save</button>
                <button className="info-cancel-btn" onClick={()=>{setEditingEmail(false);setEmailInput(user.email);setEmailError("");}}>✕</button>
                {emailError && <span className="info-edit-error">{emailError}</span>}
              </div>
            ) : (
              <div className="info-value-row">
                <span className="info-value">{user.email}</span>
                <button className="info-edit-btn" onClick={()=>{setEditingEmail(true);setEmailSuccess(false);}}>✏️</button>
                {emailSuccess && <span className="info-edit-success">Updated!</span>}
              </div>
            )}
          </div>
          {/* ✅ 修正：Role 顯示也加入 admin */}
          <div className="info-row"><span className="info-label">Role</span><span className="info-value">{roleLabel(user.role)}</span></div>
          <div className="info-row"><span className="info-label">Member since</span><span className="info-value">{new Date(user.created_at || user.id).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span></div>
        </div>
      </section>

      {/* Password */}
      <section className="profile-section">
        <div className="profile-section-header">
          <h3 className="profile-section-title">Password</h3>
          {!showPwForm && <button className="btn-link" onClick={()=>{setShowPwForm(true);setPwSuccess(false);}}>Change Password</button>}
        </div>
        {pwSuccess && <p className="login-success" role="status">Password updated successfully!</p>}
        {showPwForm && (
          <form className="password-form" onSubmit={handleSavePassword}>
            <div className="form-group"><label>Current Password</label><input type="password" name="current" value={pwForm.current} onChange={updatePwForm} placeholder="Enter current password" required /></div>
            <div className="form-group"><label>New Password</label><input type="password" name="next" value={pwForm.next} onChange={updatePwForm} placeholder="At least 6 characters" required /></div>
            <div className="form-group"><label>Confirm New Password</label><input type="password" name="confirm" value={pwForm.confirm} onChange={updatePwForm} placeholder="Re-enter new password" required /></div>
            {pwError && <p className="login-error" role="alert">{pwError}</p>}
            <div className="dialog-actions">
              <button type="submit" className="btn-button">Update Password</button>
              <button type="button" className="btn-link" onClick={()=>setShowPwForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      {/* ✅ 新增：Admin Dashboard 卡片（只有 admin 看得到）*/}
      {user.role === "admin" && <AdminDashboardCard token={token} />}

      {/* Class History */}
      {user.role === "member"  && <ClassHistory />}
      {user.role === "trainer" && <TrainerClasses />}
    </article>
  );
}

export default ProfilePage;