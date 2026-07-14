const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "online_shoping"
});

const MOCK_PRODUCTS = [
    {
        title: "Wireless Noise-Cancelling Headphones",
        description: "Premium sound quality with active noise cancellation and 30-hour battery life.",
        price: 8999.00,
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"],
        category: { name: "Electronics" }
    },
    {
        title: "Mechanical Gaming Keyboard",
        description: "Tactile blue switches, RGB backlighting, and durable aluminum top frame.",
        price: 4500.00,
        images: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80"],
        category: { name: "Electronics" }
    },
    {
        title: "Ultra-Lightweight Running Shoes",
        description: "Breathable mesh upper and responsive cushioning for maximum comfort.",
        price: 3200.00,
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"],
        category: { name: "Clothing" }
    },
    {
        title: "Minimalist Leather Wallet",
        description: "Genuine top-grain leather with RFID blocking technology.",
        price: 1200.00,
        images: ["https://images.unsplash.com/photo-1627124765135-56c33fc3a1cd?auto=format&fit=crop&w=600&q=80"],
        category: { name: "Clothing" }
    },
    {
        title: "Stainless Steel Coffee Maker",
        description: "12-cup programmable coffee maker with strength control and auto shut-off.",
        price: 2499.00,
        images: ["https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=600&q=80"],
        category: { name: "Home & Kitchen" }
    },
    {
        title: "Smart Thermostat",
        description: "Wi-Fi enabled smart thermostat to save energy and control temperature from anywhere.",
        price: 12999.00,
        images: ["https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=600&q=80"],
        category: { name: "Home & Kitchen" }
    },
    {
        title: "Introduction to Algorithms",
        description: "The classic guide to computer algorithms, covering a broad range of topics in depth.",
        price: 999.00,
        images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80"],
        category: { name: "Books" }
    }
];

connection.connect((err) => {
    if (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected to database successfully!");

    // Clear existing tables
    connection.query("SET FOREIGN_KEY_CHECKS = 0", (err) => {
        if (err) throw err;

        const clearQueries = [
            "TRUNCATE TABLE Order_Items",
            "TRUNCATE TABLE Orders",
            "TRUNCATE TABLE Cart",
            "TRUNCATE TABLE Products",
            "TRUNCATE TABLE Categories"
        ];

        let cleared = 0;
        for (let q of clearQueries) {
            connection.query(q, (err) => {
                if (err) console.error("Truncate failed:", err.message);
                cleared++;
                if (cleared === clearQueries.length) {
                    console.log("Cleared all existing e-commerce tables.");
                    insertCategoriesAndProducts(MOCK_PRODUCTS);
                }
            });
        }
    });
});

function insertCategoriesAndProducts(products) {
    // Extract unique categories
    const categoriesMap = new Map();
    products.forEach(p => {
        if (p.category && p.category.name) {
            categoriesMap.set(p.category.name, p.category);
        }
    });

    const categoriesList = Array.from(categoriesMap.values());
    console.log(`Found ${categoriesList.length} unique categories.`);

    let categoriesInserted = 0;
    const categoryIdMap = {}; // Maps original category name to new database ID

    if (categoriesList.length === 0) {
        insertProducts(products, categoryIdMap);
        return;
    }

    categoriesList.forEach(cat => {
        // Table Categories uses 'name' column
        connection.query("INSERT INTO Categories (name) VALUES (?)", [cat.name], (err, result) => {
            if (err) {
                console.error(`Failed to insert category ${cat.name}:`, err.message);
            } else {
                categoryIdMap[cat.name] = result.insertId;
                console.log(`Inserted category: ${cat.name} with ID ${result.insertId}`);
            }

            categoriesInserted++;
            if (categoriesInserted === categoriesList.length) {
                // Re-enable FK checks
                connection.query("SET FOREIGN_KEY_CHECKS = 1", (err) => {
                    if (err) throw err;
                    insertProducts(products, categoryIdMap);
                });
            }
        });
    });
}

function insertProducts(products, categoryIdMap) {
    let productsInserted = 0;
    
    products.forEach(p => {
        const catId = p.category ? categoryIdMap[p.category.name] : null;
        const firstImage = p.images && p.images.length > 0 ? p.images[0] : 'placeholder.jpg';
        
        const productData = [
            p.title,                  // name
            p.description,            // description
            p.price,                  // price
            15,                       // stock (default to 15 in stock)
            firstImage,               // image
            catId                     // category_id
        ];

        const sql = "INSERT INTO Products (name, description, price, stock, image, category_id) VALUES (?, ?, ?, ?, ?, ?)";
        
        connection.query(sql, productData, (err, result) => {
            if (err) {
                console.error(`Failed to insert product "${p.title}":`, err.message);
            }
            productsInserted++;
            if (productsInserted === products.length) {
                console.log(`Successfully seeded ${products.length} products!`);
                connection.end();
                process.exit(0);
            }
        });
    });
}
