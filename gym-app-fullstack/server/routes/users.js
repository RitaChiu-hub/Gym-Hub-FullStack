const express = require("express");
const router  = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { getUsers, updateUserRole } = require("../controllers/usersController");

router.get("/",         verifyToken, requireAdmin, getUsers);
router.put("/:id/role", verifyToken, requireAdmin, updateUserRole);

module.exports = router;