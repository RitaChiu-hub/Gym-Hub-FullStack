const pool = require("../db");
const { getEnrollmentStatus } = require("../utils/enrollment");


/* ── Validate class fields (shared by create and update) ── */
function validateClassInput({ title, date, start_time, end_time, capacity }) {
  if (!title || !date || !start_time || !end_time || capacity === undefined || capacity === "") {
    return "title, date, start_time, end_time and capacity are required";
  }
  // "HH:MM" strings compare correctly as text, e.g. "09:30" < "10:00"
  if (end_time.slice(0, 5) <= start_time.slice(0, 5)) {
    return "End time must be later than start time";
  }
  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1) {
    return "Capacity must be a whole number of at least 1";
  }
  return null;
}

/* ── Get all classes ── */
async function getAllClasses(req, res) {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT c.*,
        COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) AS enrolled_count,
        COUNT(CASE WHEN e.status = 'waitlist' THEN 1 END) AS waitlist_count,
        MAX(CASE WHEN e.user_id = $1 THEN e.status END)   AS user_status
       FROM classes c
       LEFT JOIN enrollments e ON c.id = e.class_id
       GROUP BY c.id
       ORDER BY c.date, c.start_time`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getAllClasses error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Create class (trainer only) ── */
async function createClass(req, res) {
  const { title, description, level, date, start_time, end_time, capacity } = req.body;
  const trainerName = req.user.username;
  const trainerId   = req.user.id;

  const error = validateClassInput(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await pool.query(
      `INSERT INTO classes (title, description, level, date, start_time, end_time, capacity, trainer_name, trainer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, level, date, start_time, end_time, capacity, trainerName, trainerId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createClass error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Update class (trainer only) ── */
async function updateClass(req, res) {
  const { id } = req.params;
  const { title, description, level, date, start_time, end_time, capacity } = req.body;

  const error = validateClassInput(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = await pool.query(
      `UPDATE classes
       SET title=$1, description=$2, level=$3, date=$4, start_time=$5, end_time=$6, capacity=$7
       WHERE id=$8 AND trainer_id=$9
       RETURNING *`,
      [title, description, level, date, start_time, end_time, capacity, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Class not found or unauthorized" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateClass error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Delete class (trainer only) ── */
async function deleteClass(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM classes WHERE id=$1 AND trainer_id=$2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Class not found or unauthorized" });
    }
    res.json({ message: "Class deleted" });
  } catch (err) {
    console.error("deleteClass error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Enroll in class ── */
async function enrollClass(req, res) {
  const classId = req.params.id;
  const userId  = req.user.id;

  try {
    // Check already enrolled or waitlisted
    const existing = await pool.query(
      "SELECT id FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Already enrolled or on waitlist" });
    }

    // Check capacity
    const cls = await pool.query("SELECT capacity FROM classes WHERE id=$1", [classId]);
    if (cls.rows.length === 0) return res.status(404).json({ error: "Class not found" });

    const enrolled = await pool.query(
      "SELECT COUNT(*) FROM enrollments WHERE class_id=$1 AND status='enrolled'",
      [classId]
    );
    const count  = parseInt(enrolled.rows[0].count);
    const status = getEnrollmentStatus(count, cls.rows[0].capacity);

    await pool.query(
      "INSERT INTO enrollments (user_id, class_id, status) VALUES ($1, $2, $3)",
      [userId, classId, status]
    );

    res.status(201).json({ message: `Successfully ${status}`, status });
  } catch (err) {
    console.error("enrollClass error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Leave class ── */
async function leaveClass(req, res) {
  const classId = req.params.id;
  const userId  = req.user.id;

  try {
    const enrollment = await pool.query(
      "SELECT * FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );
    if (enrollment.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const wasEnrolled = enrollment.rows[0].status === "enrolled";

    await pool.query(
      "DELETE FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );

    // Auto-promote first waitlist member if someone leaves enrolled spot
    if (wasEnrolled) {
      const next = await pool.query(
        `SELECT id FROM enrollments
         WHERE class_id=$1 AND status='waitlist'
         ORDER BY joined_at ASC LIMIT 1`,
        [classId]
      );
      if (next.rows.length > 0) {
        await pool.query(
          "UPDATE enrollments SET status='enrolled' WHERE id=$1",
          [next.rows[0].id]
        );
      }
    }

    res.json({ message: "Left class successfully" });
  } catch (err) {
    console.error("leaveClass error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Get members (trainer only) ── */
async function getMembers(req, res) {
  const classId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, e.status, e.joined_at,
        EXISTS (
          SELECT 1 FROM attendance a
          WHERE a.user_id = u.id AND a.class_id = $1
        ) AS attended
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.class_id = $1
       ORDER BY e.status, e.joined_at`,
      [classId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getMembers error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Mark attendance (trainer only) ── */
async function markAttendance(req, res) {
  const { id: classId, userId } = req.params;
  try {
    const existing = await pool.query(
      "SELECT id FROM attendance WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );

    if (existing.rows.length > 0) {
      // Toggle off
      await pool.query(
        "DELETE FROM attendance WHERE user_id=$1 AND class_id=$2",
        [userId, classId]
      );
      return res.json({ attended: false });
    }

    // Mark attended
    await pool.query(
      "INSERT INTO attendance (user_id, class_id) VALUES ($1, $2)",
      [userId, classId]
    );
    res.json({ attended: true });
  } catch (err) {
    console.error("markAttendance error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  enrollClass,
  leaveClass,
  getMembers,
  markAttendance,
};