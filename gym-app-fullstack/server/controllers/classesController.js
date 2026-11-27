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

/* ── Enroll in class ──
   Runs in a transaction and locks the class row (FOR UPDATE), so two members
   racing for the last spot are handled one after the other instead of both
   being counted as "enrolled". */
async function enrollClass(req, res) {
  const classId = req.params.id;
  const userId  = req.user.id;
  const client  = await pool.connect();          // Dedicated connection: a transaction must stay on one client

  try {
    await client.query("BEGIN");                 // Start transaction

    const cls = await client.query(
      "SELECT capacity FROM classes WHERE id=$1 FOR UPDATE",   // Lock this class row until COMMIT/ROLLBACK
      [classId]
    );
    if (cls.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Class not found" });
    }

    // Check already enrolled or waitlisted
    const existing = await client.query(
      "SELECT id FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Already enrolled or on waitlist" });
    }

    // Count is safe to trust here: no one else can change this class while we hold the lock
    const enrolled = await client.query(
      "SELECT COUNT(*) FROM enrollments WHERE class_id=$1 AND status='enrolled'",
      [classId]
    );
    const count  = parseInt(enrolled.rows[0].count, 10);
    const status = getEnrollmentStatus(count, cls.rows[0].capacity);

    await client.query(
      "INSERT INTO enrollments (user_id, class_id, status) VALUES ($1, $2, $3)",
      [userId, classId, status]
    );
    await client.query("COMMIT");                // Save changes and release the lock

    res.status(201).json({ message: `Successfully ${status}`, status });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});   // Undo everything on error
    console.error("enrollClass error:", err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();                            // Always return the connection to the pool
  }
}

/* ── Promote the first waitlisted member to enrolled ──
   Must be called inside a transaction that holds the class-row lock.
   Shared by leaveClass and removeMember. */
async function promoteFromWaitlist(client, classId) {
  const next = await client.query(
    `SELECT id FROM enrollments
     WHERE class_id=$1 AND status='waitlist'
     ORDER BY joined_at ASC, id ASC LIMIT 1`,
    [classId]
  );
  if (next.rows.length > 0) {
    await client.query(
      "UPDATE enrollments SET status='enrolled' WHERE id=$1",
      [next.rows[0].id]
    );
  }
}

/* ── Leave class ──
   Removing the member and promoting the next person on the waitlist happen
   in one transaction, under the same class-row lock as enrollClass. */
async function leaveClass(req, res) {
  const classId = req.params.id;
  const userId  = req.user.id;
  const client  = await pool.connect();          // Dedicated connection: a transaction must stay on one client

  try {
    await client.query("BEGIN");                 // Start transaction
    await client.query("SELECT id FROM classes WHERE id=$1 FOR UPDATE", [classId]);   // Same lock as enrollClass

    const enrollment = await client.query(
      "SELECT * FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );
    if (enrollment.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const wasEnrolled = enrollment.rows[0].status === "enrolled";

    await client.query(
      "DELETE FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );

    // Auto-promote first waitlist member if someone leaves enrolled spot
    if (wasEnrolled) {
      await promoteFromWaitlist(client, classId);
    }

    await client.query("COMMIT");                // Delete + promotion are saved together

    res.json({ message: "Left class successfully" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});   // Undo everything on error
    console.error("leaveClass error:", err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();                            // Always return the connection to the pool
  }
}

/* ── Check that the logged-in trainer owns this class ── */
async function isClassOwner(classId, trainerId) {
  const result = await pool.query(
    "SELECT id FROM classes WHERE id=$1 AND trainer_id=$2",
    [classId, trainerId]
  );
  return result.rows.length > 0;
}

/* ── Get members (trainer only) ── */
async function getMembers(req, res) {
  const classId = req.params.id;
  try {
    // Only the trainer who owns this class may see its members
    if (!(await isClassOwner(classId, req.user.id))) {
      return res.status(404).json({ error: "Class not found or unauthorized" });
    }

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
    // Only the trainer who owns this class may change its attendance
    if (!(await isClassOwner(classId, req.user.id))) {
      return res.status(404).json({ error: "Class not found or unauthorized" });
    }

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

    // Only members with an enrolled spot can be marked as attended
    const enrolled = await pool.query(
      "SELECT id FROM enrollments WHERE user_id=$1 AND class_id=$2 AND status='enrolled'",
      [userId, classId]
    );
    if (enrolled.rows.length === 0) {
      return res.status(400).json({ error: "User is not enrolled in this class" });
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


/* ── Remove a member from a class (trainer only) ──
   The trainer is identified by the token (req.user.id) and must own the class.
   The member to remove comes from the URL (req.params.userId). */
async function removeMember(req, res) {
  const { id: classId, userId } = req.params;
  const client = await pool.connect();          // Dedicated connection: a transaction must stay on one client

  try {
    await client.query("BEGIN");                 // Start transaction

    // Ownership check and class-row lock in one query
    const cls = await client.query(
      "SELECT id FROM classes WHERE id=$1 AND trainer_id=$2 FOR UPDATE",
      [classId, req.user.id]
    );
    if (cls.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Class not found or unauthorized" });
    }

    const enrollment = await client.query(
      "SELECT status FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );
    if (enrollment.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Member not found in this class" });
    }

    const wasEnrolled = enrollment.rows[0].status === "enrolled";

    await client.query(
      "DELETE FROM enrollments WHERE user_id=$1 AND class_id=$2",
      [userId, classId]
    );

    // Removing an enrolled member frees a spot for the waitlist
    if (wasEnrolled) {
      await promoteFromWaitlist(client, classId);
    }

    await client.query("COMMIT");                // Delete + promotion are saved together

    res.json({ message: "Member removed" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});   // Undo everything on error
    console.error("removeMember error:", err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();                            // Always return the connection to the pool
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
  removeMember,
};