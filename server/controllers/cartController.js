const db = require("../config/db");

const getCart = (req, res) => {
    const userId = req.user.id;
    
    const sql = `
        SELECT c.id, c.quantity, c.product_id, 
               p.name, p.price, p.image, p.stock
        FROM Cart c
        JOIN Products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `;
    
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        const total = result.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        res.status(200).json({
            success: true,
            count: result.length,
            total: total.toFixed(2),
            data: result
        });
    });
};

const addToCart = (req, res) => {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
        return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Check if product exists and has stock
    db.query("SELECT stock FROM Products WHERE id = ?", [product_id], (err, productResult) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (productResult.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (productResult[0].stock < quantity) {
            return res.status(400).json({ success: false, message: "Not enough stock available" });
        }

        // Check if item already in cart
        db.query("SELECT * FROM Cart WHERE user_id = ? AND product_id = ?", 
            [userId, product_id], (err, cartResult) => {
            if (err) return res.status(500).json({ success: false, message: err.message });

            if (cartResult.length > 0) {
                // Update quantity
                const newQty = cartResult[0].quantity + parseInt(quantity);
                db.query("UPDATE Cart SET quantity = ? WHERE id = ?", 
                    [newQty, cartResult[0].id], (err) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    res.status(200).json({ success: true, message: "Cart updated" });
                });
            } else {
                // Insert new item
                db.query("INSERT INTO Cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
                    [userId, product_id, parseInt(quantity)], (err, result) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    res.status(201).json({ success: true, message: "Added to cart", cartId: result.insertId });
                });
            }
        });
    });
};

const updateCartItem = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    db.query("UPDATE Cart SET quantity = ? WHERE id = ? AND user_id = ?", 
        [parseInt(quantity), id, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Cart item not found" });
        }
        res.status(200).json({ success: true, message: "Quantity updated" });
    });
};

const removeFromCart = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    db.query("DELETE FROM Cart WHERE id = ? AND user_id = ?", [id, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Cart item not found" });
        }
        res.status(200).json({ success: true, message: "Item removed from cart" });
    });
};

const clearCart = (req, res) => {
    const userId = req.user.id;
    
    db.query("DELETE FROM Cart WHERE user_id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(200).json({ success: true, message: "Cart cleared" });
    });
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };