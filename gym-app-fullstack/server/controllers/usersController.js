const pool = require("../db");

// Admins can only assign these roles; "admin" itself cannot be granted through the API
const ASSIGNABLE_ROLES = ["member", "trainer"];

/* ── List all users (admin only) ── */
async function getUsers(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role FROM users ORDER BY role, username"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getUsers error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Change a user's role (admin only) ── */
async function updateUserRole(req, res) {
  const targetId = Number(req.params.id);
  const { role } = req.body;

  if (!Number.isInteger(targetId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: "Role must be member or trainer" });
  }
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET role = $1
       WHERE id = $2 AND role <> 'admin'
       RETURNING id, username, email, role`,
      [role, targetId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found or cannot be changed" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateUserRole error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getUsers, updateUserRole };