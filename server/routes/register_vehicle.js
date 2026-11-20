
/*
 * Filename: /server/routes/register_vehicle.js
 *
 * This file provides the Register Vehicle API for RoadReady.
 *
 * Responsibilities:
 * - Validate a single vehicle submitted from register_vehicle.html.
 * - Insert the vehicle into the vehicles table.
 * - Associate the vehicle with the authenticated user as its owner.
 * - Insert any optional maintenance schedule items for the vehicle.
 * - Return the new vehicle id to the frontend as JSON.
 *
 * This file does NOT:
 * - Render or serve register_vehicle.html.
 * - Import vehicles in bulk from CSV (see /server/routes/vehicle.js).
 * - Manage user authentication directly.
 * - Set id, created_at, or updated_at (the database handles these).
 *
 * Expected request body (JSON):
 * {
 *   "vehicle": { vin, nickname, make, model, model_year, trim, engine,
 *               transmission, body_type, current_mileage, image_url,
 *               estimated_value },
 *   "vehicle_maintenance_schedule": [
 *     { maintenance_type_id, due_mileage, due_date, status, notes }
 *   ]
 * }
 */

const express = require("express");

const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();


// --------------------------------------------------
// HELPERS
// --------------------------------------------------

// Errors thrown for bad user input (returned as 400, not 500).
class ValidationError extends Error {}

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Trim a value to a string, or null when blank.
function cleanText(value, maxLength, label) {

    const text = String(value ?? "").trim();

    if (text === "") return null;

    if (text.length > maxLength) {
        throw new ValidationError(
            `${label} must be ${maxLength} characters or fewer.`
        );
    }

    return text;
}

// Convert a value to an integer, or null when blank.
function cleanInteger(value, label) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const number = Number(String(value).replace(/,/g, "").trim());

    if (!Number.isSafeInteger(number)) {
        throw new ValidationError(`${label} must be a whole number.`);
    }

    return number;
}


// --------------------------------------------------
// VEHICLE VALIDATION
// --------------------------------------------------

function validateVehicle(input) {

    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new ValidationError("No vehicle was provided.");
    }

    const make = cleanText(input.make, 60, "Make");
    const model = cleanText(input.model, 60, "Model");

    if (!make || !model) {
        throw new ValidationError("Make and model are required.");
    }

    const modelYear = cleanInteger(input.model_year, "Model year");

    if (
        modelYear === null ||
        modelYear < 1886 ||
        modelYear > 2100
    ) {
        throw new ValidationError("Invalid model year.");
    }


    // ------------------------------------------
    // CURRENT MILEAGE
    // ------------------------------------------

    // Mileage is required.
    // Zero is allowed, but a missing value is not.
    const mileage = cleanInteger(
        input.current_mileage,
        "Current mileage"
    );

    if (mileage === null) {
        throw new ValidationError("Current mileage is required.");
    }

    if (mileage < 0) {
        throw new ValidationError(
            "Current mileage must be zero or greater."
        );
    }


    // ------------------------------------------
    // VIN
    // ------------------------------------------

    // VIN is required and must contain exactly 17 valid characters.
    const vinText = cleanText(input.vin, 17, "VIN");

    if (!vinText) {
        throw new ValidationError("VIN is required.");
    }

    const vin = vinText.toUpperCase();

    if (!VIN_PATTERN.test(vin)) {
        throw new ValidationError(
            "VIN must contain exactly 17 characters. Letters I, O and Q are not allowed."
        );
    }


    // ------------------------------------------
    // IMAGE URL
    // ------------------------------------------

    const imageUrl = cleanText(input.image_url, 500, "Image URL");

    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
        throw new ValidationError(
            "Image URL must start with http:// or https://."
        );
    }


    // ------------------------------------------
    // ESTIMATED VALUE
    // ------------------------------------------

    // decimal(10,2): at most 99,999,999.99
    let estimatedValue = null;

    const valueText = String(
        input.estimated_value ?? ""
    ).replace(/,/g, "").trim();

    if (valueText !== "") {

        estimatedValue = Number(valueText);

        if (
            !Number.isFinite(estimatedValue) ||
            estimatedValue < 0 ||
            estimatedValue > 99999999.99
        ) {
            throw new ValidationError("Invalid estimated value.");
        }

        estimatedValue =
            Math.round(estimatedValue * 100) / 100;
    }


    // ------------------------------------------
    // RETURN CLEAN VEHICLE DATA
    // ------------------------------------------

    return {
        vin,
        nickname: cleanText(input.nickname, 100, "Nickname"),
        make,
        model,
        model_year: modelYear,
        trim: cleanText(input.trim, 60, "Trim"),
        engine: cleanText(input.engine, 80, "Engine"),
        transmission: cleanText(input.transmission, 40, "Transmission"),
        body_type: cleanText(input.body_type, 40, "Body type"),
        current_mileage: mileage,
        image_url: imageUrl,
        estimated_value: estimatedValue
    };
}


// --------------------------------------------------
// MAINTENANCE SCHEDULE VALIDATION
// --------------------------------------------------

function validateScheduleItems(items) {

    if (items === undefined || items === null) return [];

    if (!Array.isArray(items)) {
        throw new ValidationError("Maintenance schedule must be a list.");
    }

    if (items.length > 50) {
        throw new ValidationError(
            "You can only add 50 maintenance items at a time."
        );
    }

    return items.map((item, index) => {

        const row = `Maintenance item ${index + 1}`;

        const maintenanceTypeId = cleanInteger(
            item.maintenance_type_id,
            `${row}: Maintenance type`
        );

        if (maintenanceTypeId === null || maintenanceTypeId < 1) {
            throw new ValidationError(
                `${row}: Maintenance type is required.`
            );
        }

        const dueMileage = cleanInteger(
            item.due_mileage,
            `${row}: Due mileage`
        );

        if (dueMileage !== null && dueMileage < 0) {
            throw new ValidationError(
                `${row}: Invalid due mileage.`
            );
        }

        const dueDate = cleanText(
            item.due_date,
            10,
            `${row}: Due date`
        );

        if (
            dueDate &&
            (
                !DATE_PATTERN.test(dueDate) ||
                Number.isNaN(Date.parse(dueDate))
            )
        ) {
            throw new ValidationError(
                `${row}: Invalid due date.`
            );
        }

        // Status is NOT NULL with a default of "good".
        const status =
            cleanText(item.status, 20, `${row}: Status`) || "good";

        return {
            maintenance_type_id: maintenanceTypeId,
            due_mileage: dueMileage,
            due_date: dueDate,
            status,
            notes: cleanText(item.notes, 255, `${row}: Notes`)
        };
    });
}


// --------------------------------------------------
// REGISTER A VEHICLE
// --------------------------------------------------

router.post("/", requireLogin, async (req, res) => {

    const userId = req.session.user.id;

    let connection;

    try {

        // Validate everything before touching the database.
        const vehicle = validateVehicle(
            req.body && req.body.vehicle
        );

        const scheduleItems = validateScheduleItems(
            req.body && req.body.vehicle_maintenance_schedule
        );


        // ------------------------------------------
        // START DATABASE TRANSACTION
        // ------------------------------------------

        connection = await db.getConnection();

        await connection.beginTransaction();


        // ------------------------------------------
        // INSERT VEHICLE
        // ------------------------------------------

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
                image_url,
                estimated_value
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                vehicle.image_url,
                vehicle.estimated_value
            ]
        );

        const vehicleId = result.insertId;


        // ------------------------------------------
        // ASSOCIATE VEHICLE WITH USER
        // ------------------------------------------

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
                vehicleId,
                "owner"
            ]
        );


        // ------------------------------------------
        // INSERT MAINTENANCE SCHEDULE ITEMS
        // ------------------------------------------

        for (const item of scheduleItems) {

            await connection.query(
                `
                INSERT INTO vehicle_maintenance_schedule (
                    vehicle_id,
                    maintenance_type_id,
                    due_mileage,
                    due_date,
                    status,
                    notes
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    vehicleId,
                    item.maintenance_type_id,
                    item.due_mileage,
                    item.due_date,
                    item.status,
                    item.notes
                ]
            );
        }


        // ------------------------------------------
        // COMMIT TRANSACTION
        // ------------------------------------------

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Vehicle registered successfully.",
            vehicleId
        });

    } catch (error) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Register vehicle rollback error:",
                    rollbackError
                );
            }
        }

        let status = 500;
        let message = "Could not register vehicle.";

        if (error instanceof ValidationError) {

            status = 400;
            message = error.message;

        } else if (error.code === "ER_DUP_ENTRY") {

            status = 409;
            message = "A vehicle with that VIN already exists.";

        } else if (error.code === "ER_NO_REFERENCED_ROW_2") {

            // Foreign key failure, e.g. unknown maintenance_type_id.
            status = 400;
            message = "One of the maintenance types does not exist.";

        } else {

            console.error("Register vehicle error:", error);
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
