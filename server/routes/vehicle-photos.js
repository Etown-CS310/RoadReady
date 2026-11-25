
/*
 * Filename: /server/routes/vehicle-photos.js
 *
 * This file manages vehicle photo galleries for RoadReady.
 *
 * Responsibilities:
 * - Load photos belonging to a vehicle.
 * - Upload multiple vehicle photos.
 * - Verify that the authenticated user owns or has access to the vehicle.
 * - Store uploaded images in the server uploads directory.
 * - Save photo records in the vehicle_photos table.
 *
 * This file does NOT:
 * - Render frontend pages.
 * - Manage vehicle registration.
 * - Handle authentication directly.
 */

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "vehicle-photos"
);

fs.mkdirSync(uploadDirectory, { recursive: true });


// --------------------------------------------------
// MULTER CONFIGURATION
// --------------------------------------------------

const storage = multer.diskStorage({

    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {

        const extension = path.extname(file.originalname).toLowerCase();

        callback(
            null,
            `${crypto.randomUUID()}${extension}`
        );
    }
});


const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/bmp"
];


const upload = multer({

    storage,

    limits: {
        fileSize: 8 * 1024 * 1024,
        files: 10
    },

    fileFilter: (req, file, callback) => {

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
                new Error("Only supported image files can be uploaded.")
            );
        }

        callback(null, true);
    }
});


// --------------------------------------------------
// VEHICLE OWNERSHIP
// --------------------------------------------------

async function verifyVehicleOwnership(req, res, next) {

    try {

        const vehicleId = Number(req.params.vehicleId);

        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID."
            });
        }

        const userId = req.session.user.id;

        const [rows] = await db.query(
            `
            SELECT v.id
            FROM vehicles v
            INNER JOIN user_vehicles uv
                ON uv.vehicle_id = v.id
            WHERE v.id = ?
              AND uv.user_id = ?
            LIMIT 1
            `,
            [vehicleId, userId]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }

        req.vehicleId = vehicleId;

        next();

    } catch (error) {

        console.error("Vehicle photo ownership error:", error);

        res.status(500).json({
            success: false,
            message: "Could not verify vehicle access."
        });
    }
}


// --------------------------------------------------
// MULTER ERROR HANDLING
// --------------------------------------------------

function parsePhotoUpload(req, res, next) {

    upload.array("photos", 10)(req, res, error => {

        if (!error) {
            return next();
        }

        let message = "Could not upload vehicle photos.";

        if (error.code === "LIMIT_FILE_SIZE") {
            message = "Each photo must be 8 MB or smaller.";
        }

        if (error.code === "LIMIT_FILE_COUNT") {
            message = "You can upload a maximum of 10 photos at once.";
        }

        if (error.message && !error.code) {
            message = error.message;
        }

        return res.status(400).json({
            success: false,
            message
        });
    });
}


// --------------------------------------------------
// GET VEHICLE PHOTOS
// --------------------------------------------------

router.get(
    "/:vehicleId",
    requireLogin,
    verifyVehicleOwnership,
    async (req, res) => {

        try {

            const [photos] = await db.query(
                `
                SELECT
                    id,
                    vehicle_id,
                    image_url,
                    created_at
                FROM vehicle_photos
                WHERE vehicle_id = ?
                ORDER BY created_at ASC, id ASC
                `,
                [req.vehicleId]
            );

            // Support older vehicles that only have vehicles.image_url.
            if (photos.length === 0) {

                const [vehicleRows] = await db.query(
                    `
                    SELECT image_url
                    FROM vehicles
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [req.vehicleId]
                );

                if (
                    vehicleRows.length > 0 &&
                    vehicleRows[0].image_url
                ) {

                    photos.push({
                        id: null,
                        vehicle_id: req.vehicleId,
                        image_url: vehicleRows[0].image_url,
                        created_at: null
                    });
                }
            }

            res.json({
                success: true,
                photos
            });

        } catch (error) {

            console.error("Vehicle photo loading error:", error);

            res.status(500).json({
                success: false,
                message: "Could not load vehicle photos."
            });
        }
    }
);


// --------------------------------------------------
// UPLOAD VEHICLE PHOTOS
// --------------------------------------------------

router.post(
    "/:vehicleId",
    requireLogin,
    verifyVehicleOwnership,
    parsePhotoUpload,
    async (req, res) => {

        const files = req.files || [];

        if (files.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Please select at least one photo."
            });
        }

        const connection = await db.getConnection();

        try {

            await connection.beginTransaction();

            const uploadedPhotos = [];

            for (const file of files) {

                const imageUrl =
                    `/uploads/vehicle-photos/${file.filename}`;

                const [result] = await connection.query(
                    `
                    INSERT INTO vehicle_photos (
                        vehicle_id,
                        image_url
                    )
                    VALUES (?, ?)
                    `,
                    [
                        req.vehicleId,
                        imageUrl
                    ]
                );

                uploadedPhotos.push({
                    id: result.insertId,
                    vehicle_id: req.vehicleId,
                    image_url: imageUrl
                });

            }

            // Preserve compatibility with older parts of the application.
            // The first uploaded photo becomes the legacy vehicle image
            // only when image_url has not already been set.
            if (uploadedPhotos.length > 0) {

                await connection.query(
                    `
                    UPDATE vehicles
                    SET image_url = COALESCE(NULLIF(image_url, ''), ?)
                    WHERE id = ?
                    `,
                    [
                        uploadedPhotos[0].image_url,
                        req.vehicleId
                    ]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: "Vehicle photos uploaded successfully.",
                photos: uploadedPhotos
            });

        } catch (error) {

            await connection.rollback();

            // Remove files if their database records were not saved.
            for (const file of files) {

                fs.unlink(
                    file.path,
                    unlinkError => {
                        if (unlinkError) {
                            console.error(
                                "Vehicle photo cleanup error:",
                                unlinkError
                            );
                        }
                    }
                );
            }

            console.error("Vehicle photo upload error:", error);

            res.status(500).json({
                success: false,
                message: "Could not save vehicle photos."
            });

        } finally {

            connection.release();
        }
    }
);


module.exports = router;
