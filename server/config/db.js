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
                            else console.log("Seeded default e-commerce categories.");
                        });
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