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
 * - Import vehicles from CSV data sent by the frontend.
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


// --------------------------------------------------
// IMPORT VEHICLES FROM CSV
// --------------------------------------------------

// Convert a CSV cell such as "45,000" or " 2020 " to a number.
// Blank cells become 0 for mileage-style fields; anything else
// non-numeric becomes NaN and fails validation below.
function parseNumber(value) {
    const cleaned = String(value ?? "").replace(/,/g, "").trim();
    return cleaned === "" ? 0 : Number(cleaned);
}

router.post("/import", requireLogin, async (req, res) => {

    const userId = req.session.user.id;
    const vehicles = req.body && req.body.vehicles;

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No vehicles were provided."
        });
    }

    if (vehicles.length > 500) {
        return res.status(400).json({
            success: false,
            message: "You can only import 500 vehicles at a time."
        });
    }

    let connection;

    try {

        // Validate and prepare all vehicles before inserting.
        const preparedVehicles = vehicles.map((vehicle, index) => {

            const make = String(vehicle.make || "").trim();
            const model = String(vehicle.model || "").trim();
            const modelYear = parseNumber(vehicle.model_year);
            const mileage = parseNumber(vehicle.current_mileage);

            if (!make || !model) {
                throw new Error(
                    `Row ${index + 2}: Make and model are required.`
                );
            }

            if (
                !Number.isInteger(modelYear) ||
                modelYear < 1886 ||
                modelYear > 2100
            ) {
                throw new Error(
                    `Row ${index + 2}: Invalid model year.`
                );
            }

            if (
                !Number.isInteger(mileage) ||
                mileage < 0
            ) {
                throw new Error(
                    `Row ${index + 2}: Invalid mileage.`
                );
            }

            const vin = String(vehicle.vin || "").trim().toUpperCase();

            return {
                vin: vin || null,
                nickname: String(vehicle.nickname || "").trim() || null,
                make,
                model,
                model_year: modelYear,
                trim: String(vehicle.trim || "").trim() || null,
                engine: String(vehicle.engine || "").trim() || null,
                transmission: String(vehicle.transmission || "").trim() || null,
                body_type: String(vehicle.body_type || "").trim() || null,
                current_mileage: mileage,
                image_url: String(vehicle.image_url || "").trim() || null
            };
        });

        // Detect duplicate VINs within the CSV itself.
        const vins = preparedVehicles
            .map(vehicle => vehicle.vin)
            .filter(Boolean);

        if (new Set(vins).size !== vins.length) {
            return res.status(400).json({
                success: false,
                message: "The CSV contains duplicate VINs."
            });
        }

        // Start database transaction.
        connection = await db.getConnection();

        await connection.beginTransaction();

        for (const vehicle of preparedVehicles) {

            // Insert vehicle into vehicles table.
            const [result] = await connection.query(
                `
                INSERT INTO vehicles (
                    vin,
                    nickname,
                    make,
                    model,
                    model_year,
                    trim,
                    engine,
                    transmission,
                    body_type,
                    current_mileage,
                    image_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    vehicle.vin,
                    vehicle.nickname,
                    vehicle.make,
                    vehicle.model,
                    vehicle.model_year,
                    vehicle.trim,
                    vehicle.engine,
                    vehicle.transmission,
                    vehicle.body_type,
                    vehicle.current_mileage,
                    vehicle.image_url
                ]
            );

            // Associate vehicle with logged-in user.
            await connection.query(
                `
                INSERT INTO user_vehicles (
                    user_id,
                    vehicle_id,
                    role
                )
                VALUES (?, ?, ?)
                `,
                [
                    userId,
                    result.insertId,
                    "owner"
                ]
            );
        }

        // Save all inserts together.
        await connection.commit();

        res.json({
            success: true,
            message: `${preparedVehicles.length} vehicles imported successfully.`,
            imported: preparedVehicles.length
        });

    } catch (error) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Vehicle import rollback error:", rollbackError);
            }
        }

        console.error("Vehicle import error:", error);

        const duplicateError = error.code === "ER_DUP_ENTRY";

        // Database errors (bad column, connection failure, etc.) are
        // server problems, not bad input; only validation errors
        // (plain Errors with no SQL code) should return 400.
        const databaseError = Boolean(error.code || error.sqlMessage);

        let status = 400;
        let message = error.message || "Could not import vehicles.";

        if (duplicateError) {
            status = 409;
            message = "One or more VINs already exist in the database.";
        } else if (databaseError) {
            status = 500;
            message = "Could not import vehicles due to a database error.";
        }

        res.status(status).json({
            success: false,
            message
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;