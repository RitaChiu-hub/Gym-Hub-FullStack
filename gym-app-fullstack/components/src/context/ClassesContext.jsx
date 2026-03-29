import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ClassesContext = createContext(null);
const API = "http://localhost:3000/api";

export function fmtSchedule(isoDate, time) {
  const [y, mo, day] = isoDate.split("-").map(Number);
  const d = new Date(y, mo - 1, day);
  const [h, min] = time.split(":").map(Number);
  const period  = h >= 12 ? "PM" : "AM";
  const h12     = h % 12 || 12;
  const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
  const monLabel = d.toLocaleDateString("en-US", { month: "short" });
  return `${dayLabel}, ${monLabel} ${day} — ${h12}:${String(min).padStart(2,"0")} ${period}`;
}

export function ClassesProvider({ children }) {
  const { token } = useAuth();
  const [classes, setClasses] = useState([]);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  /* ── helpers ── */
  function normalise(c) {
    const dateStr = c.date ? c.date.slice(0, 10) : "";
    const timeStr = c.time ? c.time.slice(0, 5) : "";
    return {
      ...c,
      date:         dateStr,
      time:         timeStr,
      schedule:     dateStr && timeStr ? fmtSchedule(dateStr, timeStr) : "",
      enrolled:     [],
      waitlist:     [],
      attendance:   [],
      promotionLog: [],
      enrolledCount: Number(c.enrolled_count ?? 0),
      waitlistCount: Number(c.waitlist_count  ?? 0),
      userStatus:    c.user_status ?? null,
      linkToPage:   "panels",
      linkLabel:    "See Our Facilities →",
    };
  }

  /* ── Fetch all classes ── */
  const fetchClasses = async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/classes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) setClasses(data.map(normalise));
    } catch (err) {
      console.error("fetchClasses error:", err);
    }
  };

  useEffect(() => { fetchClasses(); }, [token]);

  const createClasses = async (newClasses) => {
    try {
      const created = await Promise.all(
        newClasses.map((c) =>
          fetch(`${API}/classes`, {
            method:  "POST",
            headers: getHeaders(),
            body:    JSON.stringify(c),
          }).then((r) => r.json())
        )
      );
      setClasses((prev) => [...prev, ...created.map(normalise)]);
    } catch (err) {
      console.error("createClasses error:", err);
    }
  };

  const updateClass = async (updated) => {
    try {
      const res  = await fetch(`${API}/classes/${updated.id}`, {
        method:  "PUT",
        headers: getHeaders(),
        body:    JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok) {
        setClasses((prev) =>
          prev.map((c) => (c.id === updated.id ? normalise(data) : c))
        );
      }
    } catch (err) {
      console.error("updateClass error:", err);
    }
  };

  const deleteClass = async (classId) => {
    try {
      await fetch(`${API}/classes/${classId}`, {
        method:  "DELETE",
        headers: getHeaders(),
      });
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch (err) {
      console.error("deleteClass error:", err);
    }
  };

  const joinClass = async (classId, userId) => {
    try {
      const res = await fetch(`${API}/classes/${classId}/enroll`, {
        method:  "POST",
        headers: getHeaders(),
      });
      if (res.ok) await fetchClasses(); // Refresh class list
    } catch (err) {
      console.error("joinClass error:", err);
    }
  };

  const leaveClass = async (classId, userId) => {
    try {
      const res = await fetch(`${API}/classes/${classId}/enroll`, {
        method:  "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) await fetchClasses();
    } catch (err) {
      console.error("leaveClass error:", err);
    }
  };

  const removeMember = async (classId, uid) => {
    try {
      await fetch(`${API}/classes/${classId}/enroll`, {
        method:  "DELETE",
        headers: { ...getHeaders(), "x-target-user": uid },
      });
      await fetchClasses();
    } catch (err) {
      console.error("removeMember error:", err);
    }
  };

  const toggleAttendance = async (classId, uid) => {
    try {
      const res = await fetch(`${API}/classes/${classId}/attendance/${uid}`, {
        method:  "POST",
        headers: getHeaders(),
      });
      if (res.ok) await fetchClasses();
    } catch (err) {
      console.error("toggleAttendance error:", err);
    }
  };

  return (
    <ClassesContext.Provider value={{
      classes,
      fetchClasses,
      createClasses,
      updateClass,
      deleteClass,
      joinClass,
      leaveClass,
      removeMember,
      toggleAttendance,
    }}>
      {children}
    </ClassesContext.Provider>
  );
}

export function useClasses() {
  return useContext(ClassesContext);
}