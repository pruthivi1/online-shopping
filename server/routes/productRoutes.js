const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

const { 
    getAllProducts, 
    addProduct, 
    deleteProduct, 
    updateProduct,
    searchProducts,
    getProductsByCategory
} = require("../controllers/productController");

router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/category/:categoryId", getProductsByCategory);

router.post("/upload", verifyToken, requireAdmin, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        filename: req.file.filename
    });
});

router.post("/", verifyToken, requireAdmin, addProduct);
router.delete("/:id", verifyToken, requireAdmin, deleteProduct);
router.put("/:id", verifyToken, requireAdmin, updateProduct);

module.exports = router;