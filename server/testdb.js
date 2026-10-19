const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.TEST_DB_PORT || 3001;

// Parse JSON requests
app.use(express.json());

// Serve the test page
app.get("/testdb.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "web", "testdb.html"));
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                1 AS result,
                DATABASE() AS database_name,
                NOW() AS server_time
        `);

        res.json({
            success: true,
            message: "Connected to MySQL",
            database: rows[0].database_name,
            result: rows[0].result,
            serverTime: rows[0].server_time
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Could not connect to MySQL",
            error: error.message
        });
    }
});

// Test that the RoadReady tables exist
app.get("/api/test-schema", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT TABLE_NAME
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME IN (
                  'users',
                  'vehicles',
                  'user_vehicles',
                  'maintenance_types',
                  'maintenance_guide_articles',
                  'vehicle_maintenance_schedule',
                  'maintenance_history',
                  'reminders'
              )
            ORDER BY TABLE_NAME
        `);

        const expected = [
            "users",
            "vehicles",
            "user_vehicles",
            "maintenance_types",
            "maintenance_guide_articles",
            "vehicle_maintenance_schedule",
            "maintenance_history",
            "reminders"
        ];

        const found = rows.map(row => row.TABLE_NAME);
        const missing = expected.filter(table => !found.includes(table));

        res.json({
            success: missing.length === 0,
            expectedCount: expected.length,
            foundCount: found.length,
            found,
            missing
        });
    } catch (error) {
        console.error("Schema test error:", error);

        res.status(500).json({
            success: false,
            message: "Could not inspect database schema",
            error: error.message
        });
    }
});

// Test that dummy data is present
app.get("/api/test-data", async (req, res) => {
    try {
        const [[users]] = await db.query(
            "SELECT COUNT(*) AS count FROM users"
        );

        const [[vehicles]] = await db.query(
            "SELECT COUNT(*) AS count FROM vehicles"
        );

        const [[maintenanceTypes]] = await db.query(
            "SELECT COUNT(*) AS count FROM maintenance_types"
        );

        const [[schedule]] = await db.query(
            "SELECT COUNT(*) AS count FROM vehicle_maintenance_schedule"
        );

        const [[history]] = await db.query(
            "SELECT COUNT(*) AS count FROM maintenance_history"
        );

        res.json({
            success: true,
            counts: {
                users: users.count,
                vehicles: vehicles.count,
                maintenanceTypes: maintenanceTypes.count,
                maintenanceSchedule: schedule.count,
                maintenanceHistory: history.count
            }
        });
    } catch (error) {
        console.error("Test data error:", error);

        res.status(500).json({
            success: false,
            message: "Could not read test data",
            error: error.message
        });
    }
});

// Start test server
app.listen(PORT, () => {
    console.log(
        `RoadReady DB test running at http://localhost:${PORT}/testdb.html`
    );
});
