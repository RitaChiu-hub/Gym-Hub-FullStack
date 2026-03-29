const express = require("express");
const router  = express.Router();
const { verifyToken } = require("../middleware/auth");
const { sendMessage, getMessages, toggleRead, deleteMessage } = require("../controllers/messagesController");

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

router.post("/",           sendMessage);                           // 所有人都可以傳訊息
router.get("/",            verifyToken, requireAdmin, getMessages); // admin only
router.put("/:id/read",    verifyToken, requireAdmin, toggleRead);  // admin only
router.delete("/:id",      verifyToken, requireAdmin, deleteMessage); // admin only

module.exports = router;