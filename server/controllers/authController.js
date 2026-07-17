const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    console.warn("WARNING: JWT_SECRET environment variable is not defined! Using fallback-dev-secret-key-change-this-in-production.");
    return "fallback-dev-secret-key-change-this-in-production";
})();

// ==================== REGISTER ====================
const register = async (req, res) => {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Username, email, and password are required"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        });
    }

    try {
        // Check if email already exists
        db.query("SELECT * FROM Users WHERE email = ?", [email], async (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            
            if (result.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Email already registered. Please login." 
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user (default role: customer)
            const sql = "INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)";
            db.query(sql, [username, email, hashedPassword, "customer"], (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }

                res.status(201).json({
                    success: true,
                    message: "Account created successfully! Please login.",
                    userId: result.insertId
                });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const sql = "SELECT * FROM Users WHERE email = ?";
    db.query(sql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        
        if (result.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        const user = result[0];
        
        // Try bcrypt compare
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
            // If bcrypt fails, try plain text (for testing only!)
            isMatch = user.password === password;
        }

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    });
};

// ==================== GET CURRENT USER ====================
const getMe = (req, res) => {
    // req.user is set by verifyToken middleware
    res.status(200).json({
        success: true,
        user: req.user
    });
};

const registerAdmin = async (req, res) => {
    const { username, email, password, adminSecret } = req.body;

    // Secret key to prevent random admin creation
    const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin-secret-123";

    if (adminSecret !== ADMIN_SECRET) {
        return res.status(403).json({
            success: false,
            message: "Invalid admin secret key"
        });
    }

    // Same as register but with role = 'admin'
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    try {
        db.query("SELECT * FROM Users WHERE email = ?", [email], async (err, result) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (result.length > 0) {
                return res.status(400).json({ success: false, message: "Email already registered" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = "INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)";
            
            db.query(sql, [username, email, hashedPassword, "admin"], (err, result) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.status(201).json({
                    success: true,
                    message: "Admin account created successfully!",
                    userId: result.insertId
                });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllUsers = (req, res) => {
    db.query("SELECT id, username, email, role, created_at FROM Users ORDER BY created_at DESC", (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(200).json({ success: true, count: result.length, data: result });
    });
};

module.exports = { register, login, getMe, registerAdmin, getAllUsers };