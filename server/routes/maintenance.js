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

const VALID_STATUSES = ["good", "soon", "overdue", "completed"];

// True for a real calendar date written as YYYY-MM-DD.
function isValidDate(value) {

    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsed = new Date(value + "T00:00:00Z");

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
    );
}


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

/*
 * Add a scheduled maintenance item.
 *
 * POST /api/maintenance/:vehicleId
 *
 * This route:
 * - Verifies the user owns the vehicle.
 * - Finds or creates the maintenance type.
 * - Adds the maintenance schedule item.
 * - Returns the created maintenance record.
 */

router.post("/:vehicleId", requireLogin, async (req, res) => {

    const userId =
        req.session.user.id;

    const vehicleId =
        Number(req.params.vehicleId);

    const {
        maintenanceType,
        customMaintenanceType,
        dueMileage,
        dueDate,
        notes
    } = req.body;

    try {

        // ======================================================
        // VALIDATE VEHICLE ID
        // ======================================================

        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        // ======================================================
        // VALIDATE MAINTENANCE TYPE
        // ======================================================

        if (
            typeof maintenanceType !== "string" ||
            !maintenanceType.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Maintenance type is required."
            });
        }

        let maintenanceName =
            maintenanceType.trim();

        // ======================================================
        // HANDLE "OTHER"
        // ======================================================

        if (maintenanceName === "Other") {

            if (
                typeof customMaintenanceType !== "string" ||
                !customMaintenanceType.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Custom maintenance type is required."
                });
            }

            maintenanceName =
                customMaintenanceType.trim();
        }

        // ======================================================
        // VALIDATE MAINTENANCE NAME
        // ======================================================

        if (maintenanceName.length > 100) {
            return res.status(400).json({
                success: false,
                message:
                    "Maintenance type must be 100 characters or fewer."
            });
        }

        // ======================================================
        // VALIDATE DUE MILEAGE
        // ======================================================

        let parsedMileage = null;

        if (
            dueMileage !== null &&
            dueMileage !== undefined &&
            dueMileage !== ""
        ) {

            parsedMileage =
                Number(dueMileage);

            if (
                !Number.isInteger(parsedMileage) ||
                parsedMileage < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Due mileage must be a non-negative whole number."
                });
            }
        }

        // ======================================================
        // VALIDATE DUE DATE
        // ======================================================

        let parsedDueDate = null;

        if (
            dueDate !== null &&
            dueDate !== undefined &&
            dueDate !== ""
        ) {

            parsedDueDate =
                dueDate;

            if (!isValidDate(parsedDueDate)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Due date must be a valid date."
                });
            }
        }

        // ======================================================
        // VALIDATE NOTES
        // ======================================================

        let parsedNotes = null;

        if (
            notes !== null &&
            notes !== undefined &&
            notes !== ""
        ) {

            parsedNotes =
                String(notes).trim();

            if (parsedNotes.length > 255) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Notes must be 255 characters or fewer."
                });
            }
        }

        // ======================================================
        // VERIFY VEHICLE ACCESS
        // ======================================================

        const [vehicleRows] =
            await db.execute(
                `
                SELECT v.id
                FROM vehicles v
                INNER JOIN user_vehicles uv
                    ON uv.vehicle_id = v.id
                WHERE v.id = ?
                  AND uv.user_id = ?
                LIMIT 1
                `,
                [
                    vehicleId,
                    userId
                ]
            );

        if (vehicleRows.length === 0) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this vehicle."
            });
        }

        // ======================================================
        // FIND OR CREATE MAINTENANCE TYPE
        // ======================================================

        let [typeRows] =
            await db.execute(
                `
                SELECT id, name
                FROM maintenance_types
                WHERE name = ?
                LIMIT 1
                `,
                [
                    maintenanceName
                ]
            );

        let maintenanceTypeId;

        if (typeRows.length > 0) {

            maintenanceTypeId =
                typeRows[0].id;

        } else {

            // --------------------------------------------------
            // CREATE NEW MAINTENANCE TYPE
            // --------------------------------------------------

            const [insertTypeResult] =
                await db.execute(
                    `
                    INSERT INTO maintenance_types
                        (name)
                    VALUES
                        (?)
                    `,
                    [
                        maintenanceName
                    ]
                );

            maintenanceTypeId =
                insertTypeResult.insertId;
        }

        // ======================================================
        // INSERT MAINTENANCE SCHEDULE
        // ======================================================

        const [insertResult] =
            await db.execute(
                `
                INSERT INTO vehicle_maintenance_schedule
                    (
                        vehicle_id,
                        maintenance_type_id,
                        due_mileage,
                        due_date,
                        status,
                        notes
                    )
                VALUES
                    (?, ?, ?, ?, ?, ?)
                `,
                [
                    vehicleId,
                    maintenanceTypeId,
                    parsedMileage,
                    parsedDueDate,
                    "good",
                    parsedNotes
                ]
            );

        // ======================================================
        // GET CREATED RECORD
        // ======================================================

        const [createdRows] =
            await db.execute(
                `
                SELECT
                    vms.id,
                    vms.vehicle_id,
                    vms.maintenance_type_id,
                    mt.name AS maintenance_name,
                    vms.due_mileage,
                    vms.due_date,
                    vms.status,
                    vms.notes
                FROM vehicle_maintenance_schedule vms
                INNER JOIN maintenance_types mt
                    ON mt.id = vms.maintenance_type_id
                WHERE vms.id = ?
                LIMIT 1
                `,
                [
                    insertResult.insertId
                ]
            );

        // ======================================================
        // RESPONSE
        // ======================================================

        return res.status(201).json({
            success: true,
            maintenance: createdRows[0]
        });

    } catch (error) {

        console.error(
            "Add maintenance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to add maintenance."
        });
    }
});

/*
 * PATCH /api/maintenance/:id
 * Body (all optional, at least one required):
 *   status      "good" | "soon" | "overdue" | "completed"
 *   dueMileage  non-negative integer or null
 *   dueDate     "YYYY-MM-DD" or null
 *   notes       string (max 255) or null
 *
 * Marking an item "completed" also logs it in maintenance_history
 * (today's date, the vehicle's current mileage) in one transaction.
 */
router.patch("/:id", requireLogin, async (req, res) => {

    const userId = req.session.user.id;
    const scheduleId = Number(req.params.id);
    const body = req.body || {};

    if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid maintenance ID."
        });
    }

    const updates = {};

    if (body.status !== undefined) {
        if (!VALID_STATUSES.includes(body.status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be one of: " + VALID_STATUSES.join(", ") + "."
            });
        }
        updates.status = body.status;
    }

    if (body.dueMileage !== undefined) {
        if (body.dueMileage === null || body.dueMileage === "") {
            updates.due_mileage = null;
        } else {
            const mileage = Number(body.dueMileage);
            if (!Number.isInteger(mileage) || mileage < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Due mileage must be a non-negative whole number."
                });
            }
            updates.due_mileage = mileage;
        }
    }

    if (body.dueDate !== undefined) {
        if (body.dueDate === null || body.dueDate === "") {
            updates.due_date = null;
        } else if (!isValidDate(body.dueDate)) {
            return res.status(400).json({
                success: false,
                message: "Due date must be a valid date (YYYY-MM-DD)."
            });
        } else {
            updates.due_date = body.dueDate;
        }
    }

    if (body.notes !== undefined) {
        if (body.notes === null || body.notes === "") {
            updates.notes = null;
        } else {
            const notes = String(body.notes).trim();
            if (notes.length > 255) {
                return res.status(400).json({
                    success: false,
                    message: "Notes must be 255 characters or fewer."
                });
            }
            updates.notes = notes || null;
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one field to update."
        });
    }

    let connection;

    try {

        connection = await db.getConnection();
        await connection.beginTransaction();

        // The item must belong to one of this user's vehicles.
        const [rows] = await connection.query(
            `
            SELECT
                s.id,
                s.vehicle_id,
                s.maintenance_type_id,
                v.current_mileage
            FROM vehicle_maintenance_schedule s
            INNER JOIN vehicles v ON v.id = s.vehicle_id
            INNER JOIN user_vehicles uv ON uv.vehicle_id = s.vehicle_id
            WHERE s.id = ?
              AND uv.user_id = ?
            LIMIT 1
            `,
            [scheduleId, userId]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Maintenance item not found."
            });
        }

        const item = rows[0];

        const columns = Object.keys(updates);

        await connection.query(
            `UPDATE vehicle_maintenance_schedule SET ${
                columns.map(column => column + " = ?").join(", ")
            } WHERE id = ?`,
            [...columns.map(column => updates[column]), scheduleId]
        );

        if (updates.status === "completed") {
            await connection.query(
                `
                INSERT INTO maintenance_history
                    (vehicle_id, maintenance_type_id, service_date, mileage_at_service)
                VALUES (?, ?, CURDATE(), ?)
                `,
                [item.vehicle_id, item.maintenance_type_id, item.current_mileage]
            );
        }

        await connection.commit();

        const [updatedRows] = await db.query(
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
            INNER JOIN maintenance_types mt ON mt.id = s.maintenance_type_id
            WHERE s.id = ?
            `,
            [scheduleId]
        );

        res.json({
            success: true,
            maintenance: updatedRows[0]
        });

    } catch (error) {

        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }

        console.error("Update maintenance error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update maintenance."
        });

    } finally {

        if (connection) connection.release();
    }
});


/*
 * DELETE /api/maintenance/:id
 */
router.delete("/:id", requireLogin, async (req, res) => {

    const userId = req.session.user.id;
    const scheduleId = Number(req.params.id);

    if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid maintenance ID."
        });
    }

    try {

        const [result] = await db.query(
            `
            DELETE s
            FROM vehicle_maintenance_schedule s
            INNER JOIN user_vehicles uv ON uv.vehicle_id = s.vehicle_id
            WHERE s.id = ?
              AND uv.user_id = ?
            `,
            [scheduleId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Maintenance item not found."
            });
        }

        res.json({
            success: true,
            message: "Maintenance item deleted."
        });

    } catch (error) {

        console.error("Delete maintenance error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete maintenance."
        });
    }
});


module.exports = router;
