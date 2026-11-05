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

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    parsedDueDate
                )
            ) {
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


module.exports = router;
