const express  = require("express");
const router   = express.Router();
const { verifyToken, requireTrainer } = require("../middleware/auth");
const {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  enrollClass,
  leaveClass,
  getMembers,
  markAttendance,
} = require("../controllers/classesController");

// Public (need to be logged in)
router.get("/",verifyToken, getAllClasses);

// Trainer only
router.post("/", verifyToken, requireTrainer, createClass);
router.put("/:id", verifyToken, requireTrainer, updateClass);
router.delete("/:id", verifyToken, requireTrainer, deleteClass);
router.get("/:id/members", verifyToken, requireTrainer, getMembers);
router.post("/:id/attendance/:userId", verifyToken, requireTrainer, markAttendance);

// Member
router.post("/:id/enroll", verifyToken, enrollClass);
router.delete("/:id/enroll", verifyToken, leaveClass);

module.exports = router;