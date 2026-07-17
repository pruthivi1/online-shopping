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

db.connect((err) => {
    if (err) {
        console.log("Database Connection Failed");
        console.log(err);
        return;
    }

    console.log("MySQL Connected Successfully");
});

module.exports = db;