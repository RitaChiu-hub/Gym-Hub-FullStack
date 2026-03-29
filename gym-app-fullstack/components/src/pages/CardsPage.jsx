import { useState, useEffect, useRef } from "react";
import Button from "../component/Button";
import { useAuth } from "../context/AuthContext";
import { useClasses, fmtSchedule } from "../context/ClassesContext";

const API     = "http://localhost:3000/api";
const LEVELS  = ["beginner", "intermediate", "advanced"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ── Shared ── */
function LevelBadge({ level }) {
  if (!level) return null;
  return <span className={`level-badge level-badge--${level}`}>{level.charAt(0).toUpperCase()+level.slice(1)}</span>;
}

function CapacityBar({ enrolled, capacity, waitlist }) {
  return (
    <div className="capacity-row">
      <span className="capacity-label">{enrolled} / {capacity} spots filled</span>
      <div className="capacity-bar"><div className="capacity-fill" style={{ width:`${(enrolled/capacity)*100}%` }} /></div>
      {waitlist > 0 && <span className="waitlist-count">{waitlist} on waitlist</span>}
    </div>
  );
}

function LevelPicker({ value, onChange }) {
  return (
    <div className="level-options">
      {LEVELS.map(lvl => (
        <label key={lvl} className={`level-tag ${value===lvl?"level-tag--active":""}`}>
          <input type="radio" name="level" value={lvl} checked={value===lvl} onChange={onChange} />
          {lvl.charAt(0).toUpperCase()+lvl.slice(1)}
        </label>
      ))}
    </div>
  );
}

function formatTime(t) {
  if (!t) return "";
  const [h,min] = t.split(":").map(Number);
  return `${h%12||12}:${String(min).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}

function getTerm(isoDate) {
  if (!isoDate) return null;
  const [y,,m] = isoDate.split("-").map(Number);
  if (m >= 3 && m <= 5)  return `Spring ${y}`;
  if (m >= 6 && m <= 8)  return `Summer ${y}`;
  if (m >= 9 && m <= 11) return `Fall ${y}`;
  return `Winter ${y}`;
}

/* ── Class form ── */
function ClassForm({ form, onChange, onSubmit, onCancel, submitLabel, showRepeat=false, repeatDays, onToggleDay }) {
  return (
    <form className="dialog-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label>Class Name</label>
        <input name="title" value={form.title} onChange={onChange} placeholder="e.g. Power Lifting" required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={form.date} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label>Time</label>
          <input type="time" name="time" value={form.time} onChange={onChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Level</label>
          <LevelPicker value={form.level} onChange={onChange} />
        </div>
        <div className="form-group">
          <label>Capacity</label>
          <input type="number" name="capacity" value={form.capacity} onChange={onChange} min="1" max="100" required />
        </div>
      </div>
      {showRepeat && (
        <div className="form-group">
          <label>Repeat on</label>
          <div className="repeat-days">
            {WEEKDAYS.map(d => (
              <button key={d} type="button" className={`repeat-day-btn ${repeatDays.includes(d)?"repeat-day-btn--active":""}`} onClick={()=>onToggleDay(d)}>{d}</button>
            ))}
          </div>
          <p className="repeat-hint">{repeatDays.length===0 ? "No repeat — single class only." : `Creates every ${repeatDays.join(", ")} from selected date (4 weeks).`}</p>
        </div>
      )}
      <div className="form-group">
        <label>Description</label>
        <textarea name="description" value={form.description} onChange={onChange} rows="3" placeholder="Describe the class..." required />
      </div>
      <div className="dialog-actions">
        <Button type="submit" visual="button">{submitLabel}</Button>
        <Button type="button" visual="link" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/* ── Helpers ── */
function buildClass(base, date, time) {
  return { ...base, date, time, schedule: fmtSchedule(date, time) };
}

function generateRecurring(base, startDate, time, repeatDays) {
  if (repeatDays.length===0) return [buildClass(base, startDate, time)];
  const results=[], start=new Date(startDate);
  for (let i=0; i<28; i++) {
    const d=new Date(start); d.setDate(start.getDate()+i);
    const iso=d.toISOString().split("T")[0];
    if (repeatDays.includes(WEEKDAYS[d.getDay()])) results.push(buildClass(base, iso, time));
  }
  return results;
}

/* ── Modals ── */
function CreateClassModal({ onClose }) {
  const { createClasses } = useClasses();
  const { user } = useAuth();
  const [form, setForm] = useState({ title:"", date:"", time:"", level:"beginner", description:"", capacity:10 });
  const [repeatDays, setRepeat] = useState([]);
  const update = e => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleSubmit = e => {
    e.preventDefault();
    const base = { title:form.title, description:form.description, level:form.level, capacity:Number(form.capacity), trainerName:user.username };
    createClasses(generateRecurring(base, form.date, form.time, repeatDays));
    onClose();
  };
  return (
    <div className="modal-overlay"><div className="create-class-modal">
      <h2 className="dialog-title">Create New Class</h2>
      <ClassForm form={form} onChange={update} onSubmit={handleSubmit} onCancel={onClose}
        submitLabel={`Create Class${repeatDays.length>0?"es":""}`}
        showRepeat repeatDays={repeatDays}
        onToggleDay={d=>setRepeat(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d])} />
    </div></div>
  );
}

function EditClassModal({ gymClass, onClose }) {
  const { updateClass } = useClasses();
  const [form, setForm] = useState({ title:gymClass.title, date:"", time:"", level:gymClass.level||"beginner", description:gymClass.description, capacity:gymClass.capacity });
  const update = e => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleSubmit = e => {
    e.preventDefault();
    const date = form.date || gymClass.date;
    const time = form.time || gymClass.time;
    updateClass({ ...gymClass, title:form.title, level:form.level, description:form.description, capacity:Number(form.capacity), date, time, schedule: date&&time ? fmtSchedule(date,time) : gymClass.schedule });
    onClose();
  };
  return (
    <div className="modal-overlay"><div className="create-class-modal">
      <h2 className="dialog-title">Edit Class</h2>
      <ClassForm form={form} onChange={update} onSubmit={handleSubmit} onCancel={onClose} submitLabel="Save Changes" />
    </div></div>
  );
}

function MembersModal({ gymClass, onClose }) {
  const { token } = useAuth();
  const { toggleAttendance, removeMember, fetchClasses } = useClasses();
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("members");

  useEffect(() => {
    fetch(`${API}/classes/${gymClass.id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setMembers)
      .catch(console.error);
  }, [gymClass.id]);

  const handleToggle = async (uid) => {
    await toggleAttendance(gymClass.id, uid);
    const res = await fetch(`${API}/classes/${gymClass.id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMembers(await res.json());
  };

  const handleRemove = async (uid) => {
    await removeMember(gymClass.id, uid);
    setMembers(prev => prev.filter(m => m.id !== uid));
    fetchClasses();
  };

  const enrolled  = members.filter(m => m.status === "enrolled");
  const waitlist  = members.filter(m => m.status === "waitlist");

  return (
    <div className="modal-overlay"><div className="create-class-modal members-modal-wide">
      <h2 className="dialog-title">👥 {gymClass.title}</h2>
      <div className="auth-tabs" style={{marginBottom:"1rem"}}>
        <button className={`auth-tab ${tab==="members"?"auth-tab--active":""}`} onClick={()=>setTab("members")}>Members</button>
        <button className={`auth-tab ${tab==="log"?"auth-tab--active":""}`} onClick={()=>setTab("log")}>Promotion Log</button>
      </div>

      {tab==="members" && <>
        <div className="members-section">
          <h4 className="members-heading">Enrolled <span className="members-count">{enrolled.length}/{gymClass.capacity}</span><span className="attendance-legend">☑ = Attended</span></h4>
          {enrolled.length===0 ? <p className="members-empty">No enrolled members yet.</p> : (
            <ul className="members-list">
              {enrolled.map(m => (
                <li key={m.id} className="members-row">
                  <label className="attendance-label">
                    <input type="checkbox" checked={m.attended} onChange={()=>handleToggle(m.id)} />
                    <span className={`member-id ${m.attended?"member-attended":""}`}>{m.username}</span>
                    {m.attended && <span className="attended-tag">✓ Attended</span>}
                  </label>
                  <button className="remove-btn" onClick={()=>handleRemove(m.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
          {enrolled.length>0 && <p className="attendance-summary">Attendance: {enrolled.filter(m=>m.attended).length} / {enrolled.length} marked present</p>}
        </div>
        <div className="members-section">
          <h4 className="members-heading">Waitlist <span className="members-count">{waitlist.length}</span></h4>
          {waitlist.length===0 ? <p className="members-empty">No one on the waitlist.</p> : (
            <ul className="members-list">
              {waitlist.map((m,i) => (
                <li key={m.id} className="members-row"><span className="member-id">#{i+1} — {m.username}</span></li>
              ))}
            </ul>
          )}
        </div>
      </>}

      {tab==="log" && (
        <div className="members-section">
          <p className="members-empty">Promotion history is tracked in real-time by the server.</p>
        </div>
      )}

      <div className="dialog-actions" style={{marginTop:"1rem"}}>
        <Button type="button" visual="button" onClick={onClose}>Close</Button>
      </div>
    </div></div>
  );
}

function DeleteConfirm({ gymClass, onClose }) {
  const { deleteClass } = useClasses();
  return (
    <div className="modal-overlay"><div className="create-class-modal">
      <h2 className="dialog-title">Delete Class</h2>
      <p style={{color:"var(--color-text-muted)",marginBottom:"1.5rem"}}>Are you sure you want to delete <strong>{gymClass.title}</strong>? This cannot be undone.</p>
      <div className="dialog-actions">
        <button className="btn-delete" onClick={()=>{ deleteClass(gymClass.id); onClose(); }}>Yes, Delete</button>
        <Button type="button" visual="link" onClick={onClose}>Cancel</Button>
      </div>
    </div></div>
  );
}

/* ── Trainer card ── */
function TrainerCard({ gymClass, setCurrentPage, onEdit, onDelete, onViewMembers }) {
  return (
    <article className="class-card class-card--animated">
      <div className="card-top-row">
        <h3 className="card-title">{gymClass.title}</h3>
        <div className="trainer-card-actions">
          <button className="icon-btn" onClick={()=>onEdit(gymClass)}>✏️</button>
          <button className="icon-btn" onClick={()=>onDelete(gymClass)}>🗑️</button>
        </div>
      </div>
      <LevelBadge level={gymClass.level} />
      {getTerm(gymClass.date) && <span className="card-term">{getTerm(gymClass.date)}</span>}
      <p className="card-description">{gymClass.description}</p>
      <p className="card-schedule"><strong>Schedule:</strong> {gymClass.schedule}</p>
      <CapacityBar enrolled={gymClass.enrolledCount} capacity={gymClass.capacity} waitlist={gymClass.waitlistCount} />
      {gymClass.enrolledCount>0 && <p className="card-attendance-hint">☑ attendance tracked</p>}
      <div className="card-actions">
        <Button type="button" visual="button" onClick={()=>onViewMembers(gymClass)}>View Members</Button>
        {gymClass.linkToPage && <button className="btn-link" onClick={()=>setCurrentPage(gymClass.linkToPage)}>{gymClass.linkLabel}</button>}
      </div>
    </article>
  );
}

/* ── Member card ── */
function MemberCard({ gymClass, setCurrentPage }) {
  const { joinClass, leaveClass } = useClasses();
  const { user } = useAuth();
  const uid          = user?.id;
  const isEnrolled   = gymClass.userStatus === "enrolled";
  const isWaitlisted = gymClass.userStatus === "waitlist";
  const isFull       = gymClass.enrolledCount >= gymClass.capacity;

  return (
    <article className="class-card class-card--animated">
      <h3 className="card-title">{gymClass.title}</h3>
      <LevelBadge level={gymClass.level} />
      {getTerm(gymClass.date) && <span className="card-term">{getTerm(gymClass.date)}</span>}
      {gymClass.trainer_name && <p className="card-trainer-name">👤 {gymClass.trainer_name}</p>}
      <p className="card-description">{gymClass.description}</p>
      <p className="card-schedule"><strong>Schedule:</strong> {gymClass.schedule}</p>
      <CapacityBar enrolled={gymClass.enrolledCount} capacity={gymClass.capacity} waitlist={gymClass.waitlistCount} />
      <div className="card-actions">
        {isEnrolled   ? <><span className="enrolled-label">✓ Enrolled</span><Button type="button" visual="link" onClick={()=>leaveClass(gymClass.id,uid)}>Leave Class</Button></>
        :isWaitlisted ? <><span className="waitlist-label">⏳ Waitlist</span><Button type="button" visual="link" onClick={()=>leaveClass(gymClass.id,uid)}>Leave Waitlist</Button></>
        :               <Button type="button" visual="button" onClick={()=>joinClass(gymClass.id,uid)}>{isFull?"Join Waitlist":"Join Class"}</Button>}
        {gymClass.linkToPage && <button className="btn-link" onClick={()=>setCurrentPage(gymClass.linkToPage)}>{gymClass.linkLabel}</button>}
      </div>
    </article>
  );
}

/* ── Month Calendar ── */
function MonthCalendar({ filterFn, emptyMsg="No classes this day." }) {
  const { classes } = useClasses();
  const today = new Date();
  const [cy, setCy] = useState(today.getFullYear());
  const [cm, setCm] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(null);

  const pad = n => String(n).padStart(2,"0");
  const todayISO = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

  const dayMap = {};
  classes.filter(filterFn).forEach(c => {
    if (!c.date) return;
    if (!dayMap[c.date]) dayMap[c.date] = [];
    dayMap[c.date].push(c);
  });

  const firstDow = new Date(cy, cm, 1).getDay();
  const daysInM  = new Date(cy, cm+1, 0).getDate();
  const prevM = () => { if(cm===0){setCm(11);setCy(y=>y-1);}else setCm(m=>m-1); setSelDay(null); };
  const nextM = () => { if(cm===11){setCm(0);setCy(y=>y+1);}else setCm(m=>m+1); setSelDay(null); };

  const cells = [];
  for(let i=0;i<firstDow;i++) cells.push(null);
  for(let d=1;d<=daysInM;d++) cells.push(d);

  const selISO     = selDay ? `${cy}-${pad(cm+1)}-${pad(selDay)}` : null;
  const selClasses = selISO ? (dayMap[selISO]||[]) : [];

  return (
    <div className="my-calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevM}>‹</button>
        <span className="cal-month-label">{new Date(cy,cm).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
        <button className="cal-nav" onClick={nextM}>›</button>
      </div>
      <div className="cal-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {cells.map((day,i)=>{
          if(day===null) return <div key={`e${i}`} className="cal-empty"/>;
          const iso=`${cy}-${pad(cm+1)}-${pad(day)}`;
          const hasCls=!!dayMap[iso];
          return (
            <div key={iso}
              className={`cal-day ${iso===todayISO?"cal-day--today":""} ${day===selDay?"cal-day--selected":""} ${hasCls?"cal-day--has-class":""}`}
              onClick={()=>hasCls&&setSelDay(day===selDay?null:day)}>
              <span className="cal-day-num">{day}</span>
              {hasCls&&<span className="cal-dot"/>}
            </div>
          );
        })}
      </div>
      {selDay && (
        <div className="cal-detail">
          <p className="cal-detail-date">{new Date(cy,cm,selDay).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
          {selClasses.length===0
            ? <p className="members-empty">{emptyMsg}</p>
            : selClasses.map(c=>(
              <div key={c.id} className="cal-class-item">
                <div className="cal-class-top">
                  <span className="cal-class-name">{c.title}</span>
                  <LevelBadge level={c.level}/>
                </div>
                {getTerm(c.date) && <span className="cal-class-term">{getTerm(c.date)}</span>}
                {c.trainer_name && <span className="cal-class-trainer">👤 {c.trainer_name}</span>}
                {c.time && <span className="cal-class-time">🕐 {formatTime(c.time)}</span>}
                <span className="cal-class-enrolled">👥 {c.enrolledCount} / {c.capacity} enrolled</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ── Toast ── */
function Toast({ message, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,4000); return ()=>clearTimeout(t); },[onDone]);
  return <div className="toast">{message}</div>;
}

/* ── Page ── */
function CardsPage({ setCurrentPage }) {
  const { user } = useAuth();
  const { classes } = useClasses();
  const isTrainer = user?.role==="trainer";

  const [view, setView]               = useState("all");
  const [calView, setCalView]         = useState(false);
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy]           = useState("default");
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [membersTarget, setMembersTarget] = useState(null);

  // Filter + sort
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay()); weekStart.setHours(0,0,0,0);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6); weekEnd.setHours(23,59,59,999);
  const inThisWeek = c => { if(!c.date) return false; const d=new Date(c.date); return d>=weekStart&&d<=weekEnd; };

  let visible=[...classes];
  visible = visible.filter(inThisWeek);
  if(!isTrainer&&view==="mine") visible=visible.filter(c=>c.userStatus==="enrolled"||c.userStatus==="waitlist");
  if(search.trim()) visible=visible.filter(c=>c.title.toLowerCase().includes(search.toLowerCase())||c.description?.toLowerCase().includes(search.toLowerCase()));
  if(levelFilter!=="all") visible=visible.filter(c=>c.level===levelFilter);
  if(sortBy==="name")  visible.sort((a,b)=>a.title.localeCompare(b.title));
  if(sortBy==="level") visible.sort((a,b)=>LEVELS.indexOf(a.level)-LEVELS.indexOf(b.level));

  return (
    <section className="cards-page">
      <div className="cards-header">
        <div>
          <h2 className="page-heading">Our Classes</h2>
          <p className="page-subheading">{isTrainer?"Classes this week — switch to Calendar for full schedule.":"Classes this week. All levels welcome."}</p>
        </div>
        <div style={{display:"flex",gap:"0.75rem",alignItems:"center"}}>
          {isTrainer && (
            <div className="view-tabs">
              <button className={`view-tab ${!calView?"view-tab--active":""}`} onClick={()=>setCalView(false)}>☰ List</button>
              <button className={`view-tab ${calView?"view-tab--active":""}`}  onClick={()=>setCalView(true)}>📅 Calendar</button>
            </div>
          )}
          {isTrainer && <Button type="button" visual="button" onClick={()=>setShowCreate(true)}>+ Create Class</Button>}
        </div>
      </div>

      {isTrainer && calView && (
        <MonthCalendar filterFn={c=>c.trainer_name===user.username} emptyMsg="You have no classes scheduled this day." />
      )}

      {!isTrainer && (
        <div className="view-tabs-row">
          <div className="view-tabs">
            <button className={`view-tab ${view==="all"?"view-tab--active":""}`} onClick={()=>{setView("all");setCalView(false);}}>All Classes</button>
            <button className={`view-tab ${view==="mine"?"view-tab--active":""}`} onClick={()=>setView("mine")}>My Classes</button>
          </div>
          {view==="mine" && (
            <div className="view-tabs" style={{marginLeft:"auto"}}>
              <button className={`view-tab ${!calView?"view-tab--active":""}`} onClick={()=>setCalView(false)}>☰ List</button>
              <button className={`view-tab ${calView?"view-tab--active":""}`}  onClick={()=>setCalView(true)}>📅 Calendar</button>
            </div>
          )}
        </div>
      )}

      {!isTrainer && view==="mine" && calView && (
        <MonthCalendar filterFn={c=>c.userStatus==="enrolled"} emptyMsg="No classes enrolled on this day." />
      )}

      {(!calView||(!isTrainer&&view!=="mine"))&&!(isTrainer&&calView) && (
        <>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input className="search-input" type="text" placeholder="Search by name or keyword…" value={search} onChange={e=>setSearch(e.target.value)} />
            {search&&<button className="search-clear" onClick={()=>setSearch("")}>✕</button>}
          </div>
          <div className="filter-bar">
            <div className="filter-level">
              <button className={`filter-pill ${levelFilter==="all"?"filter-pill--active":""}`} onClick={()=>setLevelFilter("all")}>All Levels</button>
              {LEVELS.map(lvl=>(
                <button key={lvl} className={`filter-pill filter-pill--${lvl} ${levelFilter===lvl?"filter-pill--active":""}`} onClick={()=>setLevelFilter(lvl)}>{lvl.charAt(0).toUpperCase()+lvl.slice(1)}</button>
              ))}
            </div>
            <select className="sort-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="default">Sort: Default</option>
              <option value="name">Sort: Name A–Z</option>
              <option value="level">Sort: Level</option>
            </select>
          </div>
          {visible.length===0 ? (
            <p className="no-classes">{view==="mine"?"No classes this week that you've joined.":search?`No classes found for "${search}".`:"No classes scheduled this week."}</p>
          ) : (
            <ul className="cards-list">
              {visible.map(gymClass=>(
                <li key={gymClass.id}>
                  {isTrainer
                    ? <TrainerCard gymClass={gymClass} setCurrentPage={setCurrentPage} onEdit={setEditTarget} onDelete={setDeleteTarget} onViewMembers={setMembersTarget} />
                    : <MemberCard  gymClass={gymClass} setCurrentPage={setCurrentPage} />}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {showCreate    && <CreateClassModal onClose={()=>setShowCreate(false)} />}
      {editTarget    && <EditClassModal   gymClass={editTarget}   onClose={()=>setEditTarget(null)} />}
      {deleteTarget  && <DeleteConfirm    gymClass={deleteTarget} onClose={()=>setDeleteTarget(null)} />}
      {membersTarget && <MembersModal     gymClass={membersTarget} onClose={()=>setMembersTarget(null)} />}
      {toast         && <Toast message={toast} onDone={()=>setToast(null)} />}
    </section>
  );
}

export default CardsPage;