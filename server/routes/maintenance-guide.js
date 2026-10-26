/*
 * Filename: /server/routes/maintenance-guide.js
 *
 * This file provides the Maintenance Guide API for RoadReady.
 *
 * Responsibilities:
 * - Load maintenance guide articles from MySQL.
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

        const [guideRows] = await db.query(
            `
            SELECT
                mga.id,
                mga.maintenance_type_id,
                mt.name AS category,
                mga.title,
                mga.summary,
                mga.body_markdown,
                mga.risks_if_skipped,
                mga.updated_at
            FROM maintenance_guide_articles mga
            INNER JOIN maintenance_types mt
                ON mt.id = mga.maintenance_type_id
            ORDER BY
                mga.id
            `
        );

        res.json({
            success: true,
            user: req.session.user,
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
