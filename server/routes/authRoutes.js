const express = require("express");
const router = express.Router();
const { register, login, getMe, registerAdmin, getAllUsers } = require("../controllers/authController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getMe);
router.post("/register-admin", registerAdmin);
router.get("/users", verifyToken, requireAdmin, getAllUsers);

module.exports = router;