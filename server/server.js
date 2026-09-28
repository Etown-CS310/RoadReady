const express = require("express");
const path = require("path");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON requests
app.use(express.json());

// Serve RoadReady frontend files
app.use(express.static(path.join(__dirname, "..")));

// Test database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "Connected to MySQL",
            database: process.env.DB_NAME,
            result: rows[0]
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Could not connect to MySQL"
        });
    }
});

app.listen(PORT, () => {
    console.log(`RoadReady running at http://localhost:${PORT}`);
});
