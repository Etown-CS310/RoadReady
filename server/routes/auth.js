
/*
 * Filename: /server/routes/auth.js
 *
 * This file provides the authentication API for RoadReady.
 *
 * Responsibilities:
 * - Register new user accounts.
 * - Authenticate users during login.
 * - Create authenticated user sessions.
 * - Return the currently authenticated user.
 * - Allow authenticated users to change their passwords.
 * - Destroy user sessions during logout.
 *
 * This file does NOT:
 * - Serve frontend HTML pages.
 * - Manage vehicle or maintenance data.
 * - Contain frontend authentication JavaScript.
 *
 * Authentication protection is provided by
 * /server/middleware/auth.js.
 */

const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../db");

const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

const { requireLogin } = require("../middleware/auth");

const router = express.Router();

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;


/*
 * Helper: Validate password length.
 */
function validPassword(password) {

    return (
        typeof password === "string" &&
        password.length >= MIN_PASSWORD_LENGTH &&
        Buffer.byteLength(password, "utf8") <= MAX_PASSWORD_BYTES
    );
}


/*
 * POST /api/auth/register
 *
 * Creates a new user account.
 */
router.post("/register", async (req, res) => {

    try {

        const { fullName, email, password } = req.body;

        if (
            typeof fullName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name cannot exceed 100 characters."
            });
        }

        if (cleanEmail.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {

            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        if (!validPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters and cannot exceed 72 UTF-8 bytes."
            });
        }


        // Check whether the email is already registered.

        const [existingUsers] = await db.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }


        // Hash the password before storing it.

        const passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );


        // Create the account.

        const [result] = await db.query(
            `
            INSERT INTO users (
                full_name,
                email,
                password_hash
            )
            VALUES (?, ?, ?)
            `,
            [
                cleanName,
                cleanEmail,
                passwordHash
            ]
        );


        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            userId: result.insertId
        });

    } catch (error) {

        // Handle duplicate email errors from MySQL.

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during registration."
        });
    }
});


/*
 * POST /api/auth/login
 *
 * Authenticates an existing user.
 */
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

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
            [cleanEmail]
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
 * POST /api/auth/change-password
 *
 * Allows an authenticated user to change their password.
 *
 * Requires:
 * - Current password.
 * - New password.
 *
 * The current password must be verified before updating.
 */
router.post("/change-password", requireLogin, async (req, res) => {

    try {

        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
        }

        if (!validPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 8 characters and cannot exceed 72 UTF-8 bytes."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "Your new password must be different from your current password."
            });
        }


        // Retrieve the authenticated user's current password hash.

        const [rows] = await db.query(
            `
            SELECT password_hash
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.session.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }


        // Verify the current password.

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            rows[0].password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Your current password is incorrect."
            });
        }


        // Hash the new password.

        const newPasswordHash = await bcrypt.hash(
            newPassword,
            SALT_ROUNDS
        );


        // Update the database.

        await db.query(
            `
            UPDATE users
            SET password_hash = ?
            WHERE id = ?
            `,
            [
                newPasswordHash,
                req.session.user.id
            ]
        );


        res.json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (error) {

        console.error("Password change error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while changing password."
        });
    }
});


/*
 * POST /api/auth/logout
 *
 * Destroys the current authentication session.
 */
router.post("/logout", (req, res) => {

    if (!req.session) {
        return res.json({
            success: true
        });
    }

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
 *
 * Returns the currently authenticated user.
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



/* GOOGLE SIGN IN */

// Step 1: Send user to Google

router.get("/google", (req, res) => {

    const state = crypto.randomBytes(16).toString("hex");

    req.session.googleState = state;

    req.session.save((error) => {

        if (error) {
            console.error("Session save error:", error);
            return res.status(500).send("Could not start Google login.");
        }

        const url = googleClient.generateAuthUrl({
            access_type: "online",
            scope: ["email", "profile"],
            state: state,
            redirect_uri: process.env.GOOGLE_CALLBACK_URL
        });

        res.redirect(url);
    });
});



// Step 2: Google sends user back to RoadReady
router.get("/google/callback", async (req, res) => {

    try {

        // Check security state
        if (
            !req.session.googleState ||
            req.query.state !== req.session.googleState
        ) {
            return res.status(403).send("Invalid login request.");
        }

        delete req.session.googleState;

        // Get Google's response
        const { tokens } = await googleClient.getToken({
            code: req.query.code,
            redirect_uri: "http://localhost:3000/api/auth/google/callback"
        });

        // Verify the Google account
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const googleUser = ticket.getPayload();

        if (!googleUser.email_verified) {
            return res.status(403).send("Email not verified.");
        }

        const email = googleUser.email.toLowerCase();

        // Check if user already exists
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        let user;

        if (rows.length > 0) {

            user = rows[0];

        } else {

            // Create a new RoadReady account
            const passwordHash = await bcrypt.hash(
                crypto.randomBytes(32).toString("hex"),
                SALT_ROUNDS
            );

            const [result] = await db.query(
                `INSERT INTO users
                (full_name, email, password_hash, avatar_url)
                VALUES (?, ?, ?, ?)`,
                [
                    googleUser.name || email,
                    email,
                    passwordHash,
                    googleUser.picture || null
                ]
            );

            user = {
                id: result.insertId,
                email: email,
                full_name: googleUser.name,
                avatar_url: googleUser.picture
            };
        }

        // Create RoadReady login session
        req.session.user = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url
        };

        res.redirect("/dashboard.html");

    } catch (error) {

        console.error("Google login error:", error);

        res.status(500).send("Google login failed.");
    }
});


module.exports = router;
