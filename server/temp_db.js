const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root"
});

connection.connect((err) => {
    if (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected to MySQL successfully!");
    
    connection.query("CREATE DATABASE IF NOT EXISTS online_shoping", (err) => {
        if (err) {
            console.error("Failed to create database:", err.message);
            process.exit(1);
        }
        console.log("Database online_shoping created or exists.");
        
        // Connect to the DB and create tables
        connection.query("USE online_shoping", (err) => {
            if (err) {
                console.error("USE failed:", err.message);
                process.exit(1);
            }
            
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
            
            let completed = 0;
            for (let sql of createTables) {
                connection.query(sql, (err) => {
                    if (err) {
                        console.error("Table creation failed:", err.message);
                        process.exit(1);
                    }
                    completed++;
                    if (completed === createTables.length) {
                        console.log("All tables created successfully!");
                        
                        // Seed category if empty
                        connection.query("SELECT COUNT(*) as count FROM Categories", (err, rows) => {
                            if (!err && rows[0].count === 0) {
                                connection.query("INSERT INTO Categories (name) VALUES ('Electronics'), ('Clothing'), ('Home & Kitchen'), ('Books')", (err) => {
                                    if (err) console.error("Category seeding failed:", err.message);
                                    else console.log("Seeded basic categories.");
                                    connection.end();
                                });
                            } else {
                                connection.end();
                            }
                        });
                    }
                });
            }
        });
    });
});
