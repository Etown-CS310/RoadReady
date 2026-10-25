const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON requests
app.use(express.json());

// --------------------------------------------------
// SESSION SETUP
// --------------------------------------------------

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
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

// Protect API routes
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    next();
}

// Protect frontend pages
function requirePageLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/forms/login.html");
    }

    next();
}

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
// AUTH ROUTES
// --------------------------------------------------

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Find user by email
        const [rows] = await db.query(
            `
            SELECT
                id,
                email,
                password_hash,
                full_name,
                avatar_url
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = rows[0];

        // Compare entered password with bcrypt hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Store only safe user information in the session
        req.session.user = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url
        };

        res.json({
            success: true,
            message: "Login successful.",
            user: req.session.user
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while logging in."
        });
    }
});

// LOGOUT
app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not log out."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

// CHECK CURRENT LOGIN
app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });
    }

    res.json({
        success: true,
        user: req.session.user
    });
});

// --------------------------------------------------
// DATABASE TEST
// --------------------------------------------------

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
app.use(express.static(path.join(__dirname, "..")));

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
    console.log(`RoadReady running at http://localhost:${PORT}`);
});
