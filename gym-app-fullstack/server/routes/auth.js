const express = require("express");
const router  = express.Router();
const { register, login, updateEmail, updatePassword } = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

router.post("/register",  register);
router.post("/login",     login);
router.put("/email",      verifyToken, updateEmail);
router.put("/password",   verifyToken, updatePassword);

module.exports = router;