const express = require("express");
const router  = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { sendMessage, getMessages, toggleRead, deleteMessage } = require("../controllers/messagesController");

router.post("/",           sendMessage);                           // Everyone can send messages
router.get("/",            verifyToken, requireAdmin, getMessages); // admin only
router.put("/:id/read",    verifyToken, requireAdmin, toggleRead);  // admin only
router.delete("/:id",      verifyToken, requireAdmin, deleteMessage); // admin only

module.exports = router;