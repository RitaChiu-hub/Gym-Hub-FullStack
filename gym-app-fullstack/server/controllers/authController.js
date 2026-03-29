const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const pool   = require("../db");

/* ── Register ── */
async function register(req, res) {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["member", "trainer"].includes(role)) {
    return res.status(400).json({ error: "Role must be member or trainer" });
  }

  try {
    // Check if email already exists, if so return 409 Conflict
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1", [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "This email is already registered" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role`,
      [username, email, hash, role]
    );

    res.status(201).json({ message: "Account created successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Login ── */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1", [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Update Email ── */
async function updateEmail(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1 AND id!=$2", [email, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "This email is already registered" });
    }
    await pool.query("UPDATE users SET email=$1 WHERE id=$2", [email, req.user.id]);
    res.json({ message: "Email updated" });
  } catch (err) {
    console.error("updateEmail error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

/* ── Update Password ── */
async function updatePassword(req, res) {
  const { current, next } = req.body;
  if (!current || !next) return res.status(400).json({ error: "Both fields required" });

  try {
    const result = await pool.query("SELECT password_hash FROM users WHERE id=$1", [req.user.id]);
    const match  = await bcrypt.compare(current, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(next, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, req.user.id]);
    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("updatePassword error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { register, login, updateEmail, updatePassword };