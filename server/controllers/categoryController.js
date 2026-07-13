const db = require("../config/db");

const getAllCategories = (req, res) => {
    const sql = "SELECT * FROM Categories ORDER BY category_name";
    db.query(sql, (err, result) => {
        if(err){
            return res.status(500).json({
                success: false,
                message: err.message
            })
        }
        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    });
};

module.exports = { getAllCategories };