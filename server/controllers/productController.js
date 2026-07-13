const db = require("../config/db");

const getAllProducts = (req, res) => {

    const sql = "SELECT * FROM Products";

    db.query(sql, (err, result) => {

        if(err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    });
};

const addProduct = (req, res) => {

    const { name, description, price, stock, image, category_id } = req.body;

    if(!name || price === undefined || !category_id) {
        return res.status(400).json({
            success: false,
            message: "Name, price, and category_id are required"
        });
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({
            success: false,
            message: "Price must be a valid positive number"
        });
    }

    const productData = {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: stock ? parseInt(stock) : 0,
        image: image || null,
        category_id: parseInt(category_id)
    };

    const sql = "INSERT INTO Products SET ?";
    
    db.query(sql, productData, (err, result) => {
        if(err){
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            productId: result.insertId
        });
    });
};

const deleteProduct = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM Products WHERE id = ?"
    db.query(sql, [id], (err, result) => {
        if(err){
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
        if(result.affectedRows === 0){
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        res.json({
            success: true,
            message: "Product deleted successfully"
        });
    });
};

const updateProduct = (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, image, category_id } = req.body;

    if(!name || price === undefined || !category_id) {
        return res.status(400).json({
            success: false,
            message: "Name, price, and category_id are required"
        });
    }

    const productData = {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: stock ? parseInt(stock) : 0,
        image: image || null,
        category_id: parseInt(category_id)
    };

    const sql = "UPDATE Products SET ? WHERE id = ?";

    db.query(sql, [productData, id], (err, result) => {
        if(err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
        if(result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            productId: parseInt(id)
        });
    });
};

const searchProducts = (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return getAllProducts(req, res);
    }

    const sql = "SELECT * FROM Products WHERE name LIKE ? OR description LIKE ?";
    const searchTerm = `%${q}%`;

    db.query(sql, [searchTerm, searchTerm], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    });
};

const getProductsByCategory = (req, res) => {
    const { categoryId } = req.params;
    
    const sql = "SELECT * FROM Products WHERE category_id = ?";
    db.query(sql, [categoryId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    });
};

module.exports = { getAllProducts, addProduct, deleteProduct, updateProduct, searchProducts, getProductsByCategory };