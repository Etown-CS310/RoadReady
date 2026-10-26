/*
 * Filename: /server/routes/vehicle.js
 *
 * This file provides the Vehicles API for RoadReady.
 *
 * Responsibilities:
 * - Load vehicles associated with the authenticated user.
 * - Join vehicle records with user-vehicle relationships.
 * - Return vehicle information to the frontend as JSON.
 * - Provide vehicle details such as VIN, make, model, mileage,
 *   engine, transmission, trim, and body type.
 *
 * This file does NOT:
 * - Render the vehicle page.
 * - Handle frontend vehicle selection.
 * - Manage vehicle CSV files.
 * - Manage user authentication directly.
 *
 * Vehicle page rendering is handled by /client/js/pages/vehicle.js.
 */

const express = require("express");

const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();


// --------------------------------------------------
// GET USER VEHICLES
// --------------------------------------------------

router.get("/", requireLogin, async (req, res) => {

    try {

        const userId = req.session.user.id;

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
                v.image_url,
                uv.role
            FROM vehicles v
            INNER JOIN user_vehicles uv
                ON uv.vehicle_id = v.id
            WHERE uv.user_id = ?
            ORDER BY v.id
            `,
            [userId]
        );


        res.json({
            success: true,
            user: req.session.user,
            vehicles: vehicleRows
        });


    } catch (error) {

        console.error(
            "Vehicles error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not load vehicles."
        });
    }
});


module.exports = router;
