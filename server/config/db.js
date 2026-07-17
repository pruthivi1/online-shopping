const mysql = require("mysql2");

const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
};

// Aiven MySQL and other cloud providers require SSL connections.
// If host is not localhost, enable SSL.
if (process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1") {
    connectionConfig.ssl = {
        rejectUnauthorized: false
    };
}

const db = mysql.createConnection(connectionConfig);

const initDb = (connection) => {
    const createTables = [
        `CREATE TABLE IF NOT EXISTS Users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS Categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS Products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            stock INT DEFAULT 0,
            image VARCHAR(255),
            category_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS Cart (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
            UNIQUE KEY user_product (user_id, product_id)
        )`,
        `CREATE TABLE IF NOT EXISTS Orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            shipping_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS Order_Items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
        )`
    ];

    const seedProductsIfEmpty = (conn) => {
        conn.query("SELECT COUNT(*) as count FROM Products", (err, rows) => {
            if (err || (rows && rows[0] && rows[0].count > 0)) {
                return;
            }

            console.log("No products found in database. Starting auto-seeding products...");

            conn.query("SELECT id, name FROM Categories", (err, catRows) => {
                if (err || !catRows || catRows.length === 0) {
                    console.error("Failed to fetch categories for product seeding");
                    return;
                }

                const categoryMap = {};
                catRows.forEach(row => {
                    categoryMap[row.name] = row.id;
                });

                const MOCK_PRODUCTS = [
                    {
                        name: "Wireless Noise-Cancelling Headphones",
                        description: "Premium sound quality with active noise cancellation and 30-hour battery life.",
                        price: 8999.00,
                        stock: 15,
                        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
                        category_name: "Electronics"
                    },
                    {
                        name: "Mechanical Gaming Keyboard",
                        description: "Tactile blue switches, RGB backlighting, and durable aluminum top frame.",
                        price: 4500.00,
                        stock: 15,
                        image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80",
                        category_name: "Electronics"
                    },
                    {
                        name: "Ultra-Lightweight Running Shoes",
                        description: "Breathable mesh upper and responsive cushioning for maximum comfort.",
                        price: 3200.00,
                        stock: 15,
                        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
                        category_name: "Clothing"
                    },
                    {
                        name: "Minimalist Leather Wallet",
                        description: "Genuine top-grain leather with RFID blocking technology.",
                        price: 1200.00,
                        stock: 15,
                        image: "https://images.unsplash.com/photo-1627124765135-56c33fc3a1cd?auto=format&fit=crop&w=600&q=80",
                        category_name: "Clothing"
                    },
                    {
                        name: "Stainless Steel Coffee Maker",
                        description: "12-cup programmable coffee maker with strength control and auto shut-off.",
                        price: 2499.00,
                        stock: 15,
                        image: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=600&q=80",
                        category_name: "Home & Kitchen"
                    },
                    {
                        name: "Smart Thermostat",
                        description: "Wi-Fi enabled smart thermostat to save energy and control temperature from anywhere.",
                        price: 12999.00,
                        stock: 15,
                        image: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=600&q=80",
                        category_name: "Home & Kitchen"
                    },
                    {
                        name: "Introduction to Algorithms",
                        description: "The classic guide to computer algorithms, covering a broad range of topics in depth.",
                        price: 999.00,
                        stock: 15,
                        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80",
                        category_name: "Books"
                    }
                ];

                let seededCount = 0;
                MOCK_PRODUCTS.forEach(p => {
                    const category_id = categoryMap[p.category_name] || null;
                    const productData = {
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        stock: p.stock,
                        image: p.image,
                        category_id: category_id
                    };

                    conn.query("INSERT INTO Products SET ?", productData, (err) => {
                        if (err) {
                            console.error(`Failed to seed product ${p.name}:`, err.message);
                        }
                        seededCount++;
                        if (seededCount === MOCK_PRODUCTS.length) {
                            console.log("Seeded mock products successfully!");
                        }
                    });
                });
            });
        });
    };

    const seedAdminIfEmpty = (conn) => {
        conn.query("SELECT COUNT(*) as count FROM Users WHERE role = 'admin'", async (err, rows) => {
            if (err || (rows && rows[0] && rows[0].count > 0)) {
                return;
            }

            console.log("No admin user found in database. Starting auto-seeding admin user...");
            try {
                const bcrypt = require("bcryptjs");
                const hashedPassword = await bcrypt.hash("admin123", 10);
                const adminData = {
                    username: "admin",
                    email: "admin@gmail.com",
                    password: hashedPassword,
                    role: "admin"
                };

                conn.query("INSERT INTO Users SET ?", adminData, (err) => {
                    if (err) {
                        console.error("Failed to seed admin user:", err.message);
                    } else {
                        console.log("Seeded default admin user (admin@gmail.com / admin123) successfully!");
                    }
                });
            } catch (hashErr) {
                console.error("Failed to hash admin password for seeding:", hashErr.message);
            }
        });
    };

    let errorsOccurred = false;
    let completed = 0;
    
    createTables.forEach((sql) => {
        connection.query(sql, (err) => {
            completed++;
            if (err) {
                console.error("Error creating table:", err.message);
                errorsOccurred = true;
            }
            if (completed === createTables.length && !errorsOccurred) {
                console.log("Database tables verified/created successfully.");
                
                // Seed default categories if empty
                connection.query("SELECT COUNT(*) as count FROM Categories", (err, rows) => {
                    if (!err && rows && rows[0] && rows[0].count === 0) {
                        connection.query("INSERT INTO Categories (name) VALUES ('Electronics'), ('Clothing'), ('Home & Kitchen'), ('Books')", (err) => {
                            if (err) console.error("Category seeding failed:", err.message);
                            else {
                                console.log("Seeded default e-commerce categories.");
                                seedProductsIfEmpty(connection);
                                seedAdminIfEmpty(connection);
                            }
                        });
                    } else {
                        seedProductsIfEmpty(connection);
                        seedAdminIfEmpty(connection);
                    }
                });
            }
        });
    });
};

db.connect((err) => {
    if (err) {
        console.log("Database Connection Failed");
        console.log(err);
        return;
    }

    console.log("MySQL Connected Successfully");
    initDb(db);
});

module.exports = db;