
/*
 * Filename: /server/routes/maintenance-guide.js
 *
 * This file provides the Maintenance Guide API for RoadReady.
 *
 * Responsibilities:
 * - Load all available maintenance guide articles from MySQL.
 * - Load the maintenance type associated with each guide article.
 * - Return guide categories, titles, summaries, article bodies,
 *   and skipped-maintenance risks to the frontend.
 * - Restrict guide access to authenticated users.
 *
 * This file does NOT:
 * - Render the maintenance guide HTML.
 * - Handle guide navigation in the browser.
 * - Manage user authentication directly.
 *
 * Maintenance guide rendering is handled by
 * /client/js/pages/maintenance-guide.js.
 */

const express = require("express");

const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.session.user,
            totalGuides: guideRows.length,
            guides: guideRows
        });

    } catch (error) {

        console.error(
            "Maintenance guide error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not load maintenance guide."
        });
    }
});

module.exports = router;
