/*
 * Filename: /server/routes/maintenance.js
 *
 * This file provides the Maintenance API for RoadReady.
 *
 * Responsibilities:
 * - Load vehicles belonging to the authenticated user.
 * - Load scheduled maintenance records.
 * - Load maintenance history records.
 * - Join maintenance records with their maintenance types.
 * - Return maintenance data to the frontend as JSON.
 *
 * This file does NOT:
 * - Render the maintenance page.
 * - Handle frontend maintenance interactions.
 * - Manage user authentication directly.
 *
 * Maintenance page rendering is handled by /client/js/pages/maintenance.js.
 */

const express = require("express");

const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();


// GET /api/maintenance
router.get("/", requireLogin, async (req, res) => {

    try {

        const userId = req.session.user.id;


        // --------------------------------------------------
        // VEHICLES
        // --------------------------------------------------

        const [vehicleRows] = await db.query(
            `
            SELECT
                v.id,
                v.vin,
                v.nickname,
                v.make,
                v.model,
                v.model_year,
                v.trim,
                v.engine,
                v.transmission,
                v.body_type,
                v.current_mileage,
                v.image_url
            FROM vehicles v
            INNER JOIN user_vehicles uv
                ON uv.vehicle_id = v.id
            WHERE uv.user_id = ?
            ORDER BY v.id
            `,
            [userId]
        );


        // --------------------------------------------------
        // UPCOMING MAINTENANCE
        // --------------------------------------------------

        const [scheduleRows] = await db.query(
            `
            SELECT
                s.id,
                s.vehicle_id,
                s.maintenance_type_id,
                s.due_mileage,
                s.due_date,
                s.status,
                s.notes,
                mt.name AS maintenance_name
            FROM vehicle_maintenance_schedule s
            INNER JOIN maintenance_types mt
                ON mt.id = s.maintenance_type_id
            INNER JOIN user_vehicles uv
                ON uv.vehicle_id = s.vehicle_id
            WHERE uv.user_id = ?
              AND s.status != 'completed'
            ORDER BY
                s.vehicle_id,
                CASE
                    WHEN s.status = 'overdue' THEN 1
                    WHEN s.status = 'soon' THEN 2
                    ELSE 3
                END,
                s.due_mileage,
                s.due_date
            `,
            [userId]
        );


        // --------------------------------------------------
        // MAINTENANCE HISTORY
        // --------------------------------------------------

        const [historyRows] = await db.query(
            `
            SELECT
                h.id,
                h.vehicle_id,
                h.maintenance_type_id,
                h.service_date,
                h.mileage_at_service,
                h.cost_cents,
                h.shop_name,
                h.notes,
                mt.name AS maintenance_name
            FROM maintenance_history h
            INNER JOIN maintenance_types mt
                ON mt.id = h.maintenance_type_id
            INNER JOIN user_vehicles uv
                ON uv.vehicle_id = h.vehicle_id
            WHERE uv.user_id = ?
            ORDER BY
                h.vehicle_id,
                h.service_date DESC
            `,
            [userId]
        );


        res.json({
            success: true,

            user: req.session.user,

            vehicles: vehicleRows,

            maintenance: scheduleRows,

            history: historyRows
        });


    } catch (error) {

        console.error("Maintenance error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load maintenance data."
        });
    }
});


module.exports = router;
