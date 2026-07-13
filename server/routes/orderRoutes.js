const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { createOrder, getMyOrders, getOrderDetails, getAllOrders, updateOrderStatus } = require("../controllers/orderController");

router.post("/", verifyToken, createOrder);
router.get("/", verifyToken, getMyOrders);
router.get("/all", verifyToken, requireAdmin, getAllOrders);
router.put("/:id/status", verifyToken, requireAdmin, updateOrderStatus);
router.get("/:id", verifyToken, getOrderDetails);

module.exports = router;