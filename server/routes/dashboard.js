/*
 * Filename: /server/routes/dashboard.js
 *
 * This file provides the Dashboard API for RoadReady.
 *
 * Responsibilities:
 * - Load dashboard information for the authenticated user.
 * - Load the user's vehicle information.
 * - Load the next scheduled maintenance service.
 * - Load yearly maintenance information.
 * - Load vehicle status information.
 * - Load upcoming maintenance records.
 * - Load recent maintenance history.
 *
 * This file does NOT:
 * - Render the dashboard HTML.
 * - Handle frontend dashboard interactions.
 * - Manage user login sessions directly.
 *
 * Dashboard rendering is handled by /client/js/pages/dashboard.js.
 */

const express = require("express");

const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();


// GET /api/dashboard
router.get("/", requireLogin, async (req, res) => {

    try {

        const userId = req.session.user.id;


        // --------------------------------------------------
        // USER + VEHICLE
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
            LIMIT 1
            `,
            [userId]
        );


        if (vehicleRows.length === 0) {
            return res.json({
                success: true,
                user: req.session.user,
                vehicle: null,
                upcomingMaintenance: [],
                history: [],
                nextService: null,
                maintenanceThisYear: 0,
                vehicleStatus: "good"
            });
        }


        const vehicle = vehicleRows[0];


        // --------------------------------------------------
        // NEXT SERVICE
        // --------------------------------------------------

        const [nextServiceRows] = await db.query(
            `
            SELECT
                vns.next_due_mileage
            FROM vehicle_next_service vns
            WHERE vns.vehicle_id = ?
            `,
            [vehicle.id]
        );


        const nextService =
            nextServiceRows.length > 0
                ? nextServiceRows[0]
                : null;


        // --------------------------------------------------
        // MAINTENANCE THIS YEAR
        // --------------------------------------------------

        const [yearRows] = await db.query(
            `
            SELECT
                services_completed,
                total_cost_cents
            FROM vehicle_maintenance_this_year
            WHERE vehicle_id = ?
            `,
            [vehicle.id]
        );


        const maintenanceThisYear =
            yearRows.length > 0
                ? yearRows[0]
                : {
                    services_completed: 0,
                    total_cost_cents: 0
                };


        // --------------------------------------------------
        // VEHICLE STATUS
        // --------------------------------------------------

        const [statusRows] = await db.query(
            `
            SELECT
                overall_status
            FROM vehicle_status
            WHERE vehicle_id = ?
            `,
            [vehicle.id]
        );


        const vehicleStatus =
            statusRows.length > 0
                ? statusRows[0].overall_status
                : "good";


        // --------------------------------------------------
        // UPCOMING MAINTENANCE
        // --------------------------------------------------

        const [upcomingRows] = await db.query(
            `
            SELECT
                s.id,
                s.due_mileage,
                s.due_date,
                s.status,
                s.notes,
                mt.name AS maintenance_name
            FROM vehicle_maintenance_schedule s
            INNER JOIN maintenance_types mt
                ON mt.id = s.maintenance_type_id
            WHERE s.vehicle_id = ?
              AND s.status != 'completed'
            ORDER BY
                CASE
                    WHEN s.status = 'overdue' THEN 1
                    WHEN s.status = 'soon' THEN 2
                    ELSE 3
                END,
                s.due_mileage,
                s.due_date
            LIMIT 5
            `,
            [vehicle.id]
        );


        // --------------------------------------------------
        // RECENT MAINTENANCE
        // --------------------------------------------------

        const [historyRows] = await db.query(
            `
            SELECT
                h.id,
                h.service_date,
                h.mileage_at_service,
                h.cost_cents,
                h.shop_name,
                h.notes,
                mt.name AS maintenance_name
            FROM maintenance_history h
            INNER JOIN maintenance_types mt
                ON mt.id = h.maintenance_type_id
            WHERE h.vehicle_id = ?
            ORDER BY h.service_date DESC
            LIMIT 5
            `,
            [vehicle.id]
        );


        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        res.json({
            success: true,

            user: req.session.user,

            vehicle: vehicle,

            nextService: nextService,

            maintenanceThisYear: maintenanceThisYear,

            vehicleStatus: vehicleStatus,

            upcomingMaintenance: upcomingRows,

            history: historyRows
        });


    } catch (error) {

        console.error("Dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load dashboard data."
        });
    }
});


module.exports = router;
