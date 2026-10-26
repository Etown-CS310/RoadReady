/*
 * Filename: /server/middleware/auth.js
 *
 * This file contains authentication middleware for RoadReady.
 *
 * Responsibilities:
 * - Check whether a user is logged into the current session.
 * - Protect API endpoints from unauthenticated requests.
 * - Protect user-facing pages from unauthenticated access.
 * - Return appropriate responses or redirects when authentication fails.
 *
 * This file does NOT:
 * - Log users in.
 * - Log users out.
 * - Query application data.
 * - Render frontend pages.
 *
 * Authentication actions are handled by /server/routes/auth.js.
 */

function requireLogin(req, res, next) {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    next();
}


function requirePageLogin(req, res, next) {

    if (!req.session.user) {
        return res.redirect("/forms/login.html");
    }

    next();
}


module.exports = {
    requireLogin,
    requirePageLogin
};
