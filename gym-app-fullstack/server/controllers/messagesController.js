const pool = require("../db");

/* ── Send message (public) ── */
async function sendMessage(req, res) {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await pool.query(
      "INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)",
      [name, email, message]
    );
    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("sendMessage error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Get all messages (admin only) ── */
async function getMessages(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getMessages error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Mark as read / unread (admin only) ── */
async function toggleRead(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE messages SET is_read = NOT is_read WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("toggleRead error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Delete message (admin only) ── */
async function deleteMessage(req, res) {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM messages WHERE id = $1", [id]);
    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("deleteMessage error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { sendMessage, getMessages, toggleRead, deleteMessage };