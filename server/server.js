/*
 * Filename: /server/server.js
 *
 * This file is the main Express server for the RoadReady application.
 *
 * Responsibilities:
 * - Configure the Express application.
 * - Configure JSON request parsing.
 * - Configure user sessions and session cookies.
 * - Load environment variables.
 * - Connect the application to the MySQL database pool.
 * - Register authentication and API route modules.
 * - Protect user-facing pages that require authentication.
 * - Serve the RoadReady frontend files.
 * - Provide the database connection test endpoint.
 * - Start the RoadReady web server.
 *
 * This file does NOT:
 * - Contain database queries for individual application features.
 * - Handle login logic directly.
 * - Render individual frontend pages.
 * - Contain frontend JavaScript.
 *
 * Those responsibilities are handled by the route, middleware,
 * database, and client-side files.
 */

const express = require("express");
const session = require("express-session");
const path = require("path");
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env') 
});

const db = require("./db");

const authRoutes = require("./routes/auth");
const {
    requirePageLogin
} = require("./middleware/auth");

const dashboardRoutes = require("./routes/dashboard");
const maintenanceRoutes = require("./routes/maintenance");
const maintenanceGuideRoutes = require("./routes/maintenance-guide");
const vehicleRoutes = require("./routes/vehicle");

const app = express();
const PORT = process.env.PORT || 3000;


// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.json());

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "roadready-development-secret-change-me",

        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 1000 * 60 * 60 * 8 // 8 hours
        }
    })
);


// --------------------------------------------------
// AUTH ROUTES
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/maintenance-guide", maintenanceGuideRoutes);
app.use("/api/vehicle", vehicleRoutes);

// --------------------------------------------------
// PROTECTED DASHBOARD
// --------------------------------------------------

// This must come BEFORE express.static()
app.get("/dashboard.html", requirePageLogin, (req, res) => {

    res.sendFile(
        path.join(__dirname, "..", "web", "dashboard.html")
    );
});


// --------------------------------------------------
// DATABASE TEST
// --------------------------------------------------

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT 1 AS result"
        );

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


// --------------------------------------------------
// ROADREADY FRONTEND
// --------------------------------------------------

// Home page
app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "..", "web", "index.html")
    );
});


// Protect all RoadReady HTML pages
app.get("/web/:page.html", requirePageLogin, (req, res, next) => {

    const allowedPages = [
        "dashboard.html",
        "maintenance.html",
        "vehicle.html",
        "maintenance-guide.html"
    ];

    const requestedPage = req.params.page + ".html";

    if (!allowedPages.includes(requestedPage)) {
        return next();
    }

    res.sendFile(
        path.join(
            __dirname,
            "..",
            "web",
            requestedPage
        )
    );
});


// Serve the rest of the frontend
app.use(
    express.static(
        path.join(__dirname, "..")
    )
);


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {

    console.log(
        `RoadReady running at http://localhost:${PORT}`
    );
});
