/*
 * Filename: /server/routes/auth.js
 *
 * This file provides the authentication API for RoadReady.
 *
 * Responsibilities:
 * - Authenticate users during login.
 * - Create authenticated user sessions.
 * - Return the currently authenticated user.
 * - Destroy user sessions during logout.
 * - Provide authentication-related API responses.
 *
 * This file does NOT:
 * - Serve frontend HTML pages.
 * - Manage vehicle or maintenance data.
 * - Contain frontend authentication JavaScript.
 *
 * Authentication protection is provided by /server/middleware/auth.js.
 */

const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../db");

const router = express.Router();


/*
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

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

        req.session.user = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url
        };

        res.json({
            success: true,
            user: req.session.user
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
});


/*
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {

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
            success: true
        });
    });
});


/*
 * GET /api/auth/me
 */
router.get("/me", (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            user: null
        });
    }

    res.json({
        success: true,
        user: req.session.user
    });
});


module.exports = router;
