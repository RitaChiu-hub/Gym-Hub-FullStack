import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useClasses } from "../context/ClassesContext";

function Avatar({ name }) {
  return <div className="profile-avatar">{name ? name.slice(0,2).toUpperCase() : "?"}</div>;
}

/* ── Shared level badge ── */
function LevelBadge({ level }) {
  if (!level) return null;
  return <span className={`level-badge level-badge--${level}`}>{level.charAt(0).toUpperCase()+level.slice(1)}</span>;
}

/* ── History section (member only) ── */
function ClassHistory({ userId }) {
  const { classes } = useClasses();
  const [tab, setTab] = useState("upcoming");

  const todayISO = new Date().toISOString().split("T")[0];

  const myEnrolled  = classes.filter(c => c.enrolled.includes(userId) || c.waitlist.includes(userId));
  const upcoming    = myEnrolled.filter(c => !c.date || c.date >= todayISO).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  const past        = myEnrolled.filter(c => c.date && c.date < todayISO).sort((a,b)=>b.date.localeCompare(a.date));
  const attended    = classes.filter(c => c.attendance.includes(userId)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  const tabs = [
    { key:"upcoming", label:`Upcoming (${upcoming.length})` },
    { key:"past",     label:`Past (${past.length})` },
    { key:"attended", label:`Attended (${attended.length})` },
  ];

  const listFor = { upcoming, past, attended };
  const emptyMsg = { upcoming:"No upcoming classes.", past:"No past classes yet.", attended:"No attended classes yet — trainers will mark your attendance." };

  return (
    <section className="profile-section">
      <h3 className="profile-section-title">My Classes</h3>
      <div className="history-tabs">
        {tabs.map(t=>(
          <button key={t.key} className={`history-tab ${tab===t.key?"history-tab--active":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {listFor[tab].length===0 ? (
        <p className="members-empty">{emptyMsg[tab]}</p>
      ) : (
        <ul className="history-list">
          {listFor[tab].map(c=>{
            const isWaiting  = c.waitlist.includes(userId);
            const didAttend  = c.attendance.includes(userId);
            return (
              <li key={c.id} className="history-item">
                <div className="history-item-top">
                  <span className="history-item-title">{c.title}</span>
                  <LevelBadge level={c.level} />
                </div>
                <span className="history-item-schedule">{c.schedule}</span>
                <div className="history-item-status">
                  {didAttend
                    ? <span className="attended-tag">✓ Attended</span>
                    : isWaiting
                      ? <span className="waitlist-label">⏳ Waitlist</span>
                      : <span className="enrolled-label">✓ Enrolled</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ── Main Page ── */
function ProfilePage() {
  const { user, updatePassword, updateEmail } = useAuth();
  const [showPwForm,   setShowPwForm]   = useState(false);
  const [pwSuccess,    setPwSuccess]    = useState(false);
  const [pwForm,       setPwForm]       = useState({ current:"", next:"", confirm:"" });
  const [pwError,      setPwError]      = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput,   setEmailInput]   = useState(user.email);
  const [emailError,   setEmailError]   = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  const updatePwForm = e => { setPwForm(f=>({...f,[e.target.name]:e.target.value})); setPwError(""); };

  const handleSavePassword = e => {
    e.preventDefault();
    if (pwForm.next.length < 6)       { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.next !== pwForm.confirm){ setPwError("Passwords do not match."); return; }
    const ok = updatePassword(pwForm.current, pwForm.next);
    if (ok) { setPwSuccess(true); setShowPwForm(false); setPwForm({current:"",next:"",confirm:""}); }
    else      setPwError("Current password is incorrect.");
  };

  const handleSaveEmail = () => {
    setEmailError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) { setEmailError("Please enter a valid email address."); return; }
    const ok = updateEmail(emailInput);
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
          <span className={`user-badge user-badge--profile user-badge--${user.role}`}>
            {user.role==="trainer"?"Trainer":"Member"}
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
          <div className="info-row"><span className="info-label">Role</span><span className="info-value">{user.role==="trainer"?"Trainer":"Member"}</span></div>
          <div className="info-row"><span className="info-label">Member since</span><span className="info-value">{new Date(user.id).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span></div>
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

      {/* Class History (members only) */}
      {user.role==="member" && <ClassHistory userId={user.id} />}
    </article>
  );
}

export default ProfilePage;