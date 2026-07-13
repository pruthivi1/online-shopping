const db = require("../config/db");

const createOrder = (req, res) => {
    const userId = req.user.id;
    const { shipping_address } = req.body;

    // Get cart items
    db.query(`
        SELECT c.*, p.price, p.stock, p.name 
        FROM Cart c 
        JOIN Products p ON c.product_id = p.id 
        WHERE c.user_id = ?
    `, [userId], (err, cartItems) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        db.query(
            "INSERT INTO Orders (user_id, total_amount, status, shipping_address) VALUES (?, ?, ?, ?)",
            [userId, total, "pending", shipping_address || null],
            (err, orderResult) => {
                if (err) return res.status(500).json({ success: false, message: err.message });

                const orderId = orderResult.insertId;

                // Create order items
                const orderItems = cartItems.map(item => [orderId, item.product_id, item.quantity, item.price]);
                
                db.query(
                    "INSERT INTO Order_Items (order_id, product_id, quantity, price) VALUES ?",
                    [orderItems],
                    (err) => {
                        if (err) return res.status(500).json({ success: false, message: err.message });

                        // Update product stock
                        cartItems.forEach(item => {
                            db.query(
                                "UPDATE Products SET stock = stock - ? WHERE id = ?",
                                [item.quantity, item.product_id]
                            );
                        });

                        // Clear cart
                        db.query("DELETE FROM Cart WHERE user_id = ?", [userId]);

                        res.status(201).json({
                            success: true,
                            message: "Order placed successfully",
                            orderId,
                            total: total.toFixed(2)
                        });
                    }
                );
            }
        );
    });
};

const getMyOrders = (req, res) => {
    const userId = req.user.id;
    
    db.query(`
        SELECT o.*, 
               COUNT(oi.id) as item_count,
               GROUP_CONCAT(p.name SEPARATOR ', ') as product_names
        FROM Orders o
        LEFT JOIN Order_Items oi ON o.id = oi.order_id
        LEFT JOIN Products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    });
};

const getOrderDetails = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    db.query("SELECT * FROM Orders WHERE id = ? AND user_id = ?", [id, userId], (err, orderResult) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        db.query(`
            SELECT oi.*, p.name, p.image
            FROM Order_Items oi
            JOIN Products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id], (err, itemsResult) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            
            res.status(200).json({
                success: true,
                order: orderResult[0],
                items: itemsResult
            });
        });
    });
};

const getAllOrders = (req, res) => {
    db.query(`
        SELECT o.*, u.username,
               COUNT(oi.id) as item_count,
               GROUP_CONCAT(p.name SEPARATOR ', ') as product_names
        FROM Orders o
        LEFT JOIN Users u ON o.user_id = u.id
        LEFT JOIN Order_Items oi ON o.id = oi.order_id
        LEFT JOIN Products p ON oi.product_id = p.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    });
};

const updateOrderStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
    }

    db.query("UPDATE Orders SET status = ? WHERE id = ?", [status, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            orderId: id,
            status: status
        });
    });
};

module.exports = { createOrder, getMyOrders, getOrderDetails, getAllOrders, updateOrderStatus };