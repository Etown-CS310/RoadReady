
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


/*
 * GET /
 *
 * Retrieves all maintenance guide articles.
 *
 * Each article is joined with its associated
 * maintenance type to retrieve its category name.
 *
 * Requires an authenticated user session.
 */
router.get("/", requireLogin, async (req, res) => {

    try {

        // Retrieve maintenance guide articles and their categories.

        const [guideRows] = await db.query(
            `
            SELECT
                maintenance_guide_articles.id,
                maintenance_types.name AS category,
                maintenance_guide_articles.title,
                maintenance_guide_articles.summary,
                maintenance_guide_articles.body_markdown,
                maintenance_guide_articles.risks_if_skipped,
                maintenance_guide_articles.updated_at

            FROM maintenance_guide_articles

            INNER JOIN maintenance_types
                ON maintenance_guide_articles.maintenance_type_id =
                   maintenance_types.id

            ORDER BY maintenance_types.name ASC
            `
        );


        // Return the maintenance guides.

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
