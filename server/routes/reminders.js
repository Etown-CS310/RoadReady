
/*
 * Filename: /server/routes/reminders.js
 *
 * This file provides the Reminders API for RoadReady.
 *
 * Responsibilities:
 * - Load scheduled maintenance reminders, including completed items.
 * - Load custom reminders belonging to the authenticated user.
 * - Create custom reminders for the user's vehicles.
 * - Mark custom reminders completed or reopen them.
 * - Delete custom reminders.
 *
 * This file does NOT:
 * - Render the reminders page.
 * - Handle frontend interactions.
 * - Manage authentication directly.
 *
 * Scheduled maintenance completion is updated through
 * /api/maintenance/:id.
 */

const express = require("express");

const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();


// --------------------------------------------------
// DATE VALIDATION
// --------------------------------------------------

function isValidDate(value) {

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const parsed = new Date(value + "T00:00:00Z");

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
    );
}


// --------------------------------------------------
// GET /api/reminders
//
// Returns:
// - All scheduled maintenance reminders, including completed.
// - All custom reminders belonging to the user.
// --------------------------------------------------

router.get("/", requireLogin, async (req, res) => {

    try {

        const userId = req.session.user.id;


        // --------------------------------------------------
        // SCHEDULED MAINTENANCE
        // --------------------------------------------------

        const [scheduledRows] = await db.query(
            `
            SELECT
                s.id,
                s.vehicle_id,
                s.maintenance_type_id,
                mt.name AS maintenance_name,
                s.due_mileage,
                s.due_date,
                s.status,
                s.notes
            FROM vehicle_maintenance_schedule s
            INNER JOIN maintenance_types mt
                ON mt.id = s.maintenance_type_id
            INNER JOIN user_vehicles uv
                ON uv.vehicle_id = s.vehicle_id
            WHERE uv.user_id = ?
            ORDER BY
                s.vehicle_id,
                s.due_date,
                s.due_mileage
            `,
            [userId]
        );


        // --------------------------------------------------
        // CUSTOM REMINDERS
        // --------------------------------------------------

        const [customRows] = await db.query(
            `
            SELECT
                cr.id,
                cr.vehicle_id,
                cr.name,
                cr.due_date,
                cr.due_mileage,
                cr.notes,
                cr.completed_at,
                cr.created_at
            FROM custom_reminders cr
            WHERE cr.user_id = ?
            ORDER BY cr.created_at DESC
            `,
            [userId]
        );


        return res.json({
            success: true,
            scheduledReminders: scheduledRows,
            customReminders: customRows
        });

    } catch (error) {

        console.error("Load reminders error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not load reminders."
        });
    }
});


// --------------------------------------------------
// POST /api/reminders
//
// Creates a custom reminder.
// --------------------------------------------------

router.post("/", requireLogin, async (req, res) => {

    const userId = req.session.user.id;

    const {
        vehicleId,
        name,
        dueDate,
        dueMileage,
        notes
    } = req.body || {};


    // --------------------------------------------------
    // VALIDATE VEHICLE ID
    // --------------------------------------------------

    const parsedVehicleId = Number(vehicleId);

    if (
        !Number.isInteger(parsedVehicleId) ||
        parsedVehicleId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "A valid vehicle is required."
        });
    }


    // --------------------------------------------------
    // VALIDATE NAME
    // --------------------------------------------------

    if (
        typeof name !== "string" ||
        !name.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Reminder name is required."
        });
    }

    const parsedName = name.trim();

    if (parsedName.length > 100) {
        return res.status(400).json({
            success: false,
            message: "Reminder name must be 100 characters or fewer."
        });
    }


    // --------------------------------------------------
    // VALIDATE DUE DATE
    // --------------------------------------------------

    let parsedDueDate = null;

    if (
        dueDate !== null &&
        dueDate !== undefined &&
        dueDate !== ""
    ) {

        if (!isValidDate(dueDate)) {
            return res.status(400).json({
                success: false,
                message: "Due date must be a valid date."
            });
        }

        parsedDueDate = dueDate;
    }


    // --------------------------------------------------
    // VALIDATE DUE MILEAGE
    // --------------------------------------------------

    let parsedDueMileage = null;

    if (
        dueMileage !== null &&
        dueMileage !== undefined &&
        dueMileage !== ""
    ) {

        parsedDueMileage = Number(dueMileage);

        if (
            !Number.isInteger(parsedDueMileage) ||
            parsedDueMileage < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Due mileage must be a non-negative whole number."
            });
        }
    }


    // --------------------------------------------------
    // VALIDATE NOTES
    // --------------------------------------------------

    let parsedNotes = null;

    if (
        notes !== null &&
        notes !== undefined &&
        notes !== ""
    ) {

        if (typeof notes !== "string") {
            return res.status(400).json({
                success: false,
                message: "Notes must be text."
            });
        }

        parsedNotes = notes.trim() || null;

        if (parsedNotes && parsedNotes.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Notes must be 255 characters or fewer."
            });
        }
    }


    try {

        // The user must have access to this vehicle.
        const [vehicleRows] = await db.query(
            `
            SELECT vehicle_id
            FROM user_vehicles
            WHERE user_id = ?
              AND vehicle_id = ?
            LIMIT 1
            `,
            [userId, parsedVehicleId]
        );

        if (vehicleRows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this vehicle."
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO custom_reminders
                (
                    user_id,
                    vehicle_id,
                    name,
                    due_date,
                    due_mileage,
                    notes
                )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                userId,
                parsedVehicleId,
                parsedName,
                parsedDueDate,
                parsedDueMileage,
                parsedNotes
            ]
        );


        const [createdRows] = await db.query(
            `
            SELECT
                id,
                vehicle_id,
                name,
                due_date,
                due_mileage,
                notes,
                completed_at,
                created_at
            FROM custom_reminders
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [result.insertId, userId]
        );


        return res.status(201).json({
            success: true,
            reminder: createdRows[0]
        });

    } catch (error) {

        console.error("Create custom reminder error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not create reminder."
        });
    }
});


// --------------------------------------------------
// PATCH /api/reminders/:id
//
// Body:
// {
//     "completed": true
// }
//
// completed: true  -> mark completed
// completed: false -> reopen
// --------------------------------------------------

router.patch("/:id", requireLogin, async (req, res) => {

    const userId = req.session.user.id;
    const reminderId = Number(req.params.id);

    if (
        !Number.isInteger(reminderId) ||
        reminderId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid reminder ID."
        });
    }

    if (typeof req.body?.completed !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "A completed boolean value is required."
        });
    }

    try {

        const [result] = await db.query(
            `
            UPDATE custom_reminders
            SET completed_at = ${
                req.body.completed
                    ? "CURRENT_TIMESTAMP"
                    : "NULL"
            }
            WHERE id = ?
              AND user_id = ?
            `,
            [reminderId, userId]
        );

        if (result.affectedRows === 0) {

            // Distinguish an unchanged value from a missing reminder.
            const [rows] = await db.query(
                `
                SELECT id
                FROM custom_reminders
                WHERE id = ?
                  AND user_id = ?
                LIMIT 1
                `,
                [reminderId, userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Custom reminder not found."
                });
            }
        }

        const [updatedRows] = await db.query(
            `
            SELECT
                id,
                vehicle_id,
                name,
                due_date,
                due_mileage,
                notes,
                completed_at,
                created_at
            FROM custom_reminders
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [reminderId, userId]
        );

        return res.json({
            success: true,
            reminder: updatedRows[0]
        });

    } catch (error) {

        console.error("Update custom reminder error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not update reminder."
        });
    }
});


// --------------------------------------------------
// DELETE /api/reminders/:id
// --------------------------------------------------

router.delete("/:id", requireLogin, async (req, res) => {

    const userId = req.session.user.id;
    const reminderId = Number(req.params.id);

    if (
        !Number.isInteger(reminderId) ||
        reminderId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid reminder ID."
        });
    }

    try {

        const [result] = await db.query(
            `
            DELETE FROM custom_reminders
            WHERE id = ?
              AND user_id = ?
            `,
            [reminderId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Custom reminder not found."
            });
        }

        return res.json({
            success: true,
            message: "Custom reminder deleted."
        });

    } catch (error) {

        console.error("Delete custom reminder error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not delete reminder."
        });
    }
});


module.exports = router;
