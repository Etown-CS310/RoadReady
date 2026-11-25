/*
 * Filename: /server/routes/dashboard.js
 *
 * This file provides the Dashboard API for RoadReady.
 *
 * Responsibilities:
 * - Load dashboard information for the authenticated user.
 * - Load the selected vehicle's information.
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
// Optional query parameter: ?vehicleId=123

router.get("/", requireLogin, async (req, res) => {

    try {

        const userId = req.session.user.id;

        const requestedVehicleId =
            req.query.vehicleId;


        // --------------------------------------------------
        // VALIDATE REQUESTED VEHICLE ID
        // --------------------------------------------------

        if (
            requestedVehicleId !== undefined &&
            (
                !/^\d+$/.test(String(requestedVehicleId)) ||
                Number(requestedVehicleId) <= 0
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }


        // --------------------------------------------------
        // USER + SELECTED VEHICLE
        // --------------------------------------------------

        let vehicleQuery = `
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
        `;

        const vehicleParams = [userId];

        if (requestedVehicleId !== undefined) {

            vehicleQuery += `
                AND v.id = ?
            `;

            vehicleParams.push(Number(requestedVehicleId));
        }

        vehicleQuery += `
            ORDER BY v.id
            LIMIT 1
        `;

        const [vehicleRows] = await db.query(
            vehicleQuery,
            vehicleParams
        );


        // A specifically requested vehicle must belong to the user.
        if (
            requestedVehicleId !== undefined &&
            vehicleRows.length === 0
        ) {

            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }


        // --------------------------------------------------
        // NO VEHICLES
        // --------------------------------------------------

        if (vehicleRows.length === 0) {

            return res.json({
                success: true,
                user: req.session.user,
                vehicle: null,
                upcomingMaintenance: [],
                history: [],
                nextService: null,
                maintenanceThisYear: {
                    services_completed: 0,
                    total_cost_cents: 0
                },
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
            vehicle,
            nextService,
            maintenanceThisYear,
            vehicleStatus,
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
