import { createContext, useContext, useState } from "react";

const ClassesContext = createContext(null);

function offset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function fmtSchedule(isoDate, time) {
  const [y, mo, day] = isoDate.split("-").map(Number);
  const d = new Date(y, mo - 1, day);
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const dayLabel  = d.toLocaleDateString("en-US", { weekday: "short" });
  const monLabel  = d.toLocaleDateString("en-US", { month: "short" });
  return `${dayLabel}, ${monLabel} ${day} — ${h12}:${String(min).padStart(2,"0")} ${period}`;
}

const base = { enrolled:[], waitlist:[], attendance:[], promotionLog:[], linkToPage:"panels", linkLabel:"See Our Facilities →" };

function mk(o) {
  return { ...base, ...o, schedule: fmtSchedule(o.date, o.time) };
}

const initialClasses = [
  mk({ id:"yoga",    title:"Yoga Flow",          level:"beginner",     date:offset(1), time:"07:00", capacity:3, trainerName:"Coach Sara",  description:"Find your balance and calm with our Yoga Flow class. Improve flexibility and reduce stress through guided breathing and posture work." }),
  mk({ id:"hiit",    title:"HIIT Training",       level:"advanced",     date:offset(3), time:"18:00", capacity:3, trainerName:"Coach Mike",  description:"Push your limits with High-Intensity Interval Training. Burn calories fast with 45-minute sessions that combine cardio and strength." }),
  mk({ id:"boxing",  title:"Boxing Fundamentals", level:"intermediate", date:offset(5), time:"19:00", capacity:3, trainerName:"Coach Mike",  description:"Learn proper technique, footwork, and combinations in a high-energy group setting. Great for stress relief and full-body conditioning." }),
  mk({ id:"cycling", title:"Spin Cycling",        level:"intermediate", date:offset(7), time:"09:00", capacity:3, trainerName:"Coach Sara",  description:"An intense cardio cycling class set to high-energy music. Our certified instructors will guide you through hills and sprints." }),
];

export function ClassesProvider({ children }) {
  const [classes, setClasses] = useState(initialClasses);

  const joinClass = (classId, userId) => setClasses(prev => prev.map(c => {
    if (c.id !== classId || c.enrolled.includes(userId) || c.waitlist.includes(userId)) return c;
    return c.enrolled.length < c.capacity
      ? { ...c, enrolled: [...c.enrolled, userId] }
      : { ...c, waitlist: [...c.waitlist, userId] };
  }));

  const leaveClass = (classId, userId) => setClasses(prev => prev.map(c => {
    if (c.id !== classId) return c;
    if (c.enrolled.includes(userId)) {
      const newE = c.enrolled.filter(id => id !== userId);
      const [promoted, ...rest] = c.waitlist;
      const log = promoted ? [{ uid: promoted, time: new Date().toLocaleTimeString() }] : [];
      return { ...c, enrolled: promoted ? [...newE, promoted] : newE, waitlist: rest, promotionLog: [...c.promotionLog, ...log] };
    }
    return { ...c, waitlist: c.waitlist.filter(id => id !== userId) };
  }));

  const createClasses = (newClasses) => setClasses(prev => [...prev, ...newClasses]);

  const updateClass = (updated) => setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));

  const deleteClass = (classId) => setClasses(prev => prev.filter(c => c.id !== classId));

  const removeMember = (classId, uid) => setClasses(prev => prev.map(c => {
    if (c.id !== classId) return c;
    const newE = c.enrolled.filter(id => id !== uid);
    const [promoted, ...rest] = c.waitlist;
    const log = promoted ? [{ uid: promoted, time: new Date().toLocaleTimeString() }] : [];
    return { ...c, enrolled: promoted ? [...newE, promoted] : newE, waitlist: rest, promotionLog: [...c.promotionLog, ...log] };
  }));

  const toggleAttendance = (classId, uid) => setClasses(prev => prev.map(c => {
    if (c.id !== classId) return c;
    return { ...c, attendance: c.attendance.includes(uid) ? c.attendance.filter(id => id !== uid) : [...c.attendance, uid] };
  }));

  return (
    <ClassesContext.Provider value={{ classes, joinClass, leaveClass, createClasses, updateClass, deleteClass, removeMember, toggleAttendance }}>
      {children}
    </ClassesContext.Provider>
  );
}

export function useClasses() {
  return useContext(ClassesContext);
}