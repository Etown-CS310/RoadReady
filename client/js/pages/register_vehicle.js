
/*
 * Filename: /client/js/pages/register_vehicle.js
 *
 * This file controls the RoadReady Register Vehicle page.
 *
 * Responsibilities:
 * - Manage the optional maintenance schedule rows on the form.
 * - Collect the form fields into a vehicle payload.
 * - Validate required vehicle information before submission.
 * - Send the payload to the server API to register the vehicle.
 * - Display success and error messages to the user.
 * - Remember the new vehicle as the selected vehicle using localStorage.
 * - Return the user to the My Vehicle page after registering.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Contain SQL queries.
 * - Manage authentication directly.
 * - Import vehicles in bulk from CSV (see /client/js/pages/vehicle.js).
 *
 * Vehicle registration is handled by /server/routes/register_vehicle.js.
 */

document.addEventListener("DOMContentLoaded", function () {

    const form =
        document.getElementById("vehicleForm");

    const scheduleRows =
        document.getElementById("scheduleRows");

    const scheduleTemplate =
        document.getElementById("rowTpl");

    const addRowButton =
        document.getElementById("addRow");

    const formMessage =
        document.getElementById("form-message");

    const submitButton =
        form ? form.querySelector("button[type='submit']") : null;

    const REGISTER_URL = "/api/register_vehicle";
    const VEHICLES_PAGE = "/web/vehicle.html";

    const vehicleFields = [
        "vin",
        "nickname",
        "make",
        "model",
        "model_year",
        "trim",
        "engine",
        "transmission",
        "body_type",
        "current_mileage",
        "image_url",
        "estimated_value"
    ];

    let nextRowIndex = 0;


    if (!form) {
        console.error("Register vehicle form was not found.");
        return;
    }


    // ------------------------------------------
    // MESSAGES
    // ------------------------------------------

    function showMessage(text, isError) {

        if (!formMessage) {
            alert(text);
            return;
        }

        formMessage.textContent = text;

        formMessage.style.color =
            isError
                ? "var(--danger)"
                : "var(--accent)";

        formMessage.style.display = "block";
    }

    function clearMessage() {

        if (formMessage) {
            formMessage.textContent = "";
            formMessage.style.display = "none";
        }
    }


    // ------------------------------------------
    // VEHICLE FIELD VALIDATION
    // ------------------------------------------

    function validateVehicleFields() {

        const vinInput =
            document.getElementById("vin");

        const mileageInput =
            document.getElementById("current_mileage");

        // VIN is required and must contain exactly 17 valid characters.
        const vin = vinInput.value.trim().toUpperCase();

        vinInput.value = vin;

        const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;

        if (!vin) {
            showMessage("VIN is required.", true);
            vinInput.focus();
            return false;
        }

        if (!vinPattern.test(vin)) {
            showMessage(
                "VIN must contain exactly 17 characters. Letters I, O and Q are not allowed.",
                true
            );
            vinInput.focus();
            return false;
        }

        // Current mileage is required, must be a whole number,
        // and must be zero or greater.
        const mileageValue = mileageInput.value.trim();
        const mileage = Number(mileageValue);

        if (
            mileageValue === "" ||
            !Number.isSafeInteger(mileage) ||
            mileage < 0
        ) {
            showMessage(
                "Current mileage is required and must be a whole number of 0 or greater.",
                true
            );
            mileageInput.focus();
            return false;
        }

        return true;
    }


    // ------------------------------------------
    // MAINTENANCE SCHEDULE ROWS
    // ------------------------------------------

    function addScheduleRow() {

        const row =
            scheduleTemplate.content.firstElementChild.cloneNode(true);

        const rowIndex = nextRowIndex++;

        // Names keep the form usable as a plain HTML form as well.
        row.querySelectorAll("[data-f]").forEach(function (input) {
            input.name =
                `schedule[${rowIndex}][${input.dataset.f}]`;
        });

        row.querySelector(".remove").addEventListener(
            "click",
            function () {
                row.remove();
            }
        );

        scheduleRows.appendChild(row);
    }

    if (addRowButton) {
        addRowButton.addEventListener("click", addScheduleRow);
    }

    form.addEventListener("reset", function () {
        scheduleRows.replaceChildren();
        clearMessage();
    });


    // ------------------------------------------
    // BUILD REQUEST PAYLOAD
    // ------------------------------------------

    // Blank form values are sent as null so the database stores
    // NULL (important for the unique VIN column).
    function blankToNull(value) {

        const text = String(value ?? "").trim();

        return text === "" ? null : text;
    }

    function buildVehiclePayload() {

        const formData = new FormData(form);

        const vehicle = {};

        vehicleFields.forEach(function (field) {
            vehicle[field] = blankToNull(formData.get(field));
        });

        if (vehicle.vin) {
            vehicle.vin = vehicle.vin.toUpperCase();
        }

        vehicle.model_year = Number(vehicle.model_year);
        vehicle.current_mileage = Number(vehicle.current_mileage);

        if (vehicle.estimated_value !== null) {
            vehicle.estimated_value = Number(vehicle.estimated_value);
        }

        return vehicle;
    }

    function buildSchedulePayload() {

        return Array.from(scheduleRows.children).map(function (row) {

            const item = {};

            row.querySelectorAll("[data-f]").forEach(function (input) {
                item[input.dataset.f] = blankToNull(input.value);
            });

            item.maintenance_type_id = Number(item.maintenance_type_id);

            if (item.due_mileage !== null) {
                item.due_mileage = Number(item.due_mileage);
            }

            return item;
        });
    }


    // ------------------------------------------
    // SUBMIT
    // ------------------------------------------

    async function registerVehicle(event) {

        event.preventDefault();

        clearMessage();

        // Run the browser's required, pattern, min and step validation.
        if (!form.reportValidity()) {
            return;
        }

        // Run additional VIN and mileage validation.
        if (!validateVehicleFields()) {
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {

            const response =
                await fetch(REGISTER_URL, {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        vehicle: buildVehiclePayload(),
                        vehicle_maintenance_schedule: buildSchedulePayload()
                    })
                });

            const responseText =
                await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error(
                    "Register response was not JSON:",
                    response.status,
                    responseText
                );

                throw new Error(
                    `Server returned status ${response.status} with a non-JSON response. ` +
                    "Check that the register route is mounted at " +
                    REGISTER_URL + "."
                );
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Could not register vehicle."
                );
            }

            // Make the new vehicle the selected one on the My Vehicle page.
            localStorage.setItem(
                "selectedVehicleId",
                data.vehicleId
            );

            showMessage(
                data.message || "Vehicle registered successfully.",
                false
            );

            window.location.href = VEHICLES_PAGE;

        } catch (error) {

            console.error("Register vehicle error:", error);

            showMessage(error.message, true);

            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    form.addEventListener("submit", registerVehicle);
});
