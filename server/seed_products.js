const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "online_shoping"
});

connection.connect((err) => {
    if (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected to database successfully!");

    // Read the content.md file which contains the JSON products array
    const filepath = "C:\\Users\\gangi\\.gemini\\antigravity\\brain\\c5757239-5e40-48a0-87fe-2d523722478f\\.system_generated\\steps\\117\\content.md";
    try {
        const fileContent = fs.readFileSync(filepath, "utf8");
        const lines = fileContent.split("\n");
        // Find the line starting with [{"id":1
        const jsonLine = lines.find(l => l.trim().startsWith("[{\"id\":1"));
        if (!jsonLine) {
            console.error("Could not find JSON line in content.md");
            process.exit(1);
        }

        const products = JSON.parse(jsonLine.trim());
        console.log(`Loaded ${products.length} products from file.`);

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
                        insertCategoriesAndProducts(products);
                    }
                });
            }
        });
    } catch (e) {
        console.error("Error reading/parsing file:", e.message);
        process.exit(1);
    }
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
    const categoryIdMap = {}; // Maps original category ID/name to new database ID

    if (categoriesList.length === 0) {
        insertProducts(products, categoryIdMap);
        return;
    }

    categoriesList.forEach(cat => {
        // The table Categories uses 'category_name' in the user's database
        connection.query("INSERT INTO Categories (category_name) VALUES (?)", [cat.name], (err, result) => {
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
