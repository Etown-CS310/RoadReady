/*
 * Filename: /client/js/pages/vehicle.js
 *
 * This file controls the RoadReady My Vehicle page.
 *
 * Responsibilities:
 * - Request vehicle data from the server API.
 * - Display vehicles associated with the authenticated user.
 * - Allow the user to select a vehicle.
 * - Display the selected vehicle's information.
 * - Display vehicle mileage, VIN, trim, engine, transmission,
 *   and body type.
 * - Remember the selected vehicle using localStorage.
 * - Provide the interface for vehicle CSV import.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Contain SQL queries.
 * - Manage authentication directly.
 * - Directly modify vehicle records in MySQL.
 *
 * Vehicle data is provided by /server/routes/vehicle.js.
 */

document.addEventListener("DOMContentLoaded", async function () {

    const vehicleList =
        document.getElementById("vehicle-list");

    const vehicleTitle =
        document.getElementById("vehicle-title");

    const vehicleNickname =
        document.getElementById("vehicle-nickname");

    const vehicleMileage =
        document.getElementById("vehicle-mileage");

    const vehicleVin =
        document.getElementById("vehicle-vin");

    const vehicleTrim =
        document.getElementById("vehicle-trim");

    const vehicleEngine =
        document.getElementById("vehicle-engine");

    const vehicleTransmission =
        document.getElementById("vehicle-transmission");

    const vehicleBodyType =
        document.getElementById("vehicle-body-type");


    // ------------------------------------------
    // CSV IMPORT
    //
    // Set up BEFORE loading vehicles. Previously this lived at the
    // bottom of the load try-block, so a user with zero vehicles
    // (the exact person who needs to import) hit an early `return`
    // and never got a working Import button.
    // ------------------------------------------

    const importButton = document.getElementById("import");
    const csvInput = document.getElementById("csv-input");

    // Only the make/model/year/mileage columns are required.
    // The rest are optional and default to empty.
    const requiredHeaders = [
        "make",
        "model",
        "model_year",
        "current_mileage"
    ];

    const knownHeaders = [
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
        "image_url"
    ];

    if (importButton && csvInput) {

        importButton.addEventListener("click", function () {
            // Reset so choosing the same file twice still fires "change".
            csvInput.value = "";
            csvInput.click();
        });

        // Attached once, instead of on every button click.
        csvInput.addEventListener("change", readFile);
    }


    // Parse CSV while respecting quoted fields.
    function parseCSV(text) {

        const rows = [];
        let row = [];
        let value = "";
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {

            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"' && insideQuotes && nextChar === '"') {
                value += '"';
                i++;
            }

            else if (char === '"') {
                insideQuotes = !insideQuotes;
            }

            else if (char === "," && !insideQuotes) {
                row.push(value.trim());
                value = "";
            }

            else if ((char === "\n" || char === "\r") && !insideQuotes) {

                if (char === "\r" && nextChar === "\n") {
                    i++;
                }

                row.push(value.trim());

                if (row.some(field => field !== "")) {
                    rows.push(row);
                }

                row = [];
                value = "";
            }

            else {
                value += char;
            }
        }

        if (insideQuotes) {
            throw new Error("The CSV contains an unclosed quotation mark.");
        }

        row.push(value.trim());

        if (row.some(field => field !== "")) {
            rows.push(row);
        }

        return rows;
    }


    async function readFile() {

        const file = csvInput.files[0];

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            alert("Please select a CSV file.");
            return;
        }

        try {

            const csvText = await file.text();

            const rows = parseCSV(csvText);

            if (rows.length < 2) {
                throw new Error(
                    "The CSV does not contain any vehicle records."
                );
            }

            // Extract column names (strip BOM, normalize case/spacing).
            const headers = rows[0].map(header =>
                header
                    .replace(/^﻿/, "")
                    .trim()
                    .toLowerCase()
                    .replace(/[\s-]+/g, "_")
            );

            const missingHeaders = requiredHeaders.filter(
                header => !headers.includes(header)
            );

            if (missingHeaders.length > 0) {
                throw new Error(
                    "Missing CSV columns: " + missingHeaders.join(", ")
                );
            }

            // Convert CSV rows into vehicle objects.
            const vehicles = rows.slice(1).map((row, index) => {

                // Allow rows with trailing empty cells trimmed off,
                // but reject rows with extra data.
                if (row.length > headers.length) {
                    throw new Error(
                        `Row ${index + 2} has more columns than the header row.`
                    );
                }

                const vehicle = {};

                headers.forEach((header, columnIndex) => {
                    if (knownHeaders.includes(header)) {
                        vehicle[header] = row[columnIndex] ?? "";
                    }
                });

                return vehicle;
            });

            // Send vehicles to the backend.
            // NOTE: must match the route the GET request uses
            // (/api/vehicle, singular). The old "/api/vehicles/import"
            // path did not exist, so Express returned an HTML 404 page,
            // which produced "Server returned something other than JSON".
            const response = await fetch("/api/vehicle/import", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    vehicles: vehicles
                })
            });

            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error(
                    "Import response was not JSON:",
                    response.status,
                    responseText
                );

                throw new Error(
                    `Server returned status ${response.status} with a non-JSON response. ` +
                    "Check that the import route exists and the request body is not too large."
                );
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Vehicle import failed."
                );
            }

            alert(data.message);

            // Refresh vehicle information from the database.
            window.location.reload();

        } catch (error) {

            console.error("CSV import error:", error);

            alert("Import failed: " + error.message);
        }
    }


    try {

        // ------------------------------------------
        // LOAD VEHICLES
        // ------------------------------------------

        const response =
            await fetch("/api/vehicle", {
                credentials: "include"
            });

        if (!response.ok) {
            throw new Error(
                "Could not load vehicles."
            );
        }

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Could not load vehicles."
            );
        }


        const vehicles =
            data.vehicles || [];


        // ------------------------------------------
        // NO VEHICLES
        // ------------------------------------------

        if (vehicles.length === 0) {

            if (vehicleList) {
                vehicleList.innerHTML = `
                    <div class="empty-state-small">
                        No vehicles found.
                    </div>
                `;
            }

            if (vehicleTitle) {
                vehicleTitle.textContent =
                    "No vehicle found";
            }

            return;
        }


        // ------------------------------------------
        // SELECT VEHICLE
        // ------------------------------------------

        let selectedVehicleId =
            Number(
                localStorage.getItem(
                    "selectedVehicleId"
                )
            );

        let vehicle =
            vehicles.find(function (v) {
                return Number(v.id) ===
                    selectedVehicleId;
            });


        // Fall back to first vehicle

        if (!vehicle) {

            vehicle = vehicles[0];

            selectedVehicleId =
                Number(vehicle.id);

            localStorage.setItem(
                "selectedVehicleId",
                selectedVehicleId
            );
        }


        // ------------------------------------------
        // VEHICLE LIST
        // ------------------------------------------

        if (vehicleList) {

            vehicleList.replaceChildren();

            vehicles.forEach(function (v) {

                const card =
                    document.createElement("a");

                card.href =
                    `/web/vehicle.html`;

                card.className =
                    "vehicle-list-card" +
                    (
                        Number(v.id) ===
                        Number(vehicle.id)
                            ? " selected"
                            : ""
                    );

                card.dataset.vehicleId =
                    v.id;


                const strong =
                    document.createElement("strong");

                strong.textContent =
                    `${v.model_year} ${v.make} ${v.model}`;


                const nickname =
                    document.createElement("span");

                nickname.textContent =
                    v.nickname ||
                    v.trim ||
                    "Vehicle";


                const mileage =
                    document.createElement("small");

                mileage.textContent =
                    v.current_mileage !== null &&
                    v.current_mileage !== undefined
                        ? `${Number(
                            v.current_mileage
                        ).toLocaleString()} miles`
                        : "Mileage unavailable";


                card.appendChild(strong);
                card.appendChild(nickname);
                card.appendChild(mileage);


                card.addEventListener(
                    "click",
                    function () {

                        localStorage.setItem(
                            "selectedVehicleId",
                            v.id
                        );

                    }
                );


                vehicleList.appendChild(card);
            });
        }


        // ------------------------------------------
        // VEHICLE DETAILS
        // ------------------------------------------

        if (vehicleTitle) {

            vehicleTitle.textContent =
                `${vehicle.model_year} ${vehicle.make} ${vehicle.model}`;
        }

        if (vehicleNickname) {

            vehicleNickname.textContent =
                vehicle.nickname || "";
        }

        if (vehicleMileage) {

            vehicleMileage.textContent =
                vehicle.current_mileage !== null &&
                vehicle.current_mileage !== undefined
                    ? `${Number(
                        vehicle.current_mileage
                    ).toLocaleString()} mi`
                    : "";
        }

        if (vehicleVin) {
            vehicleVin.textContent =
                vehicle.vin || "";
        }

        if (vehicleTrim) {
            vehicleTrim.textContent =
                vehicle.trim || "";
        }

        if (vehicleEngine) {
            vehicleEngine.textContent =
                vehicle.engine || "";
        }

        if (vehicleTransmission) {
            vehicleTransmission.textContent =
                vehicle.transmission || "";
        }

        if (vehicleBodyType) {
            vehicleBodyType.textContent =
                vehicle.body_type || "";
        }


        // ------------------------------------------
        // VEHICLE VALUE
        // ------------------------------------------

        const valueContainer =
            document.getElementById("vehicle-value");

        if (valueContainer) {

            /*
             * Keep the existing value-card code
             * if renderValueCard/loadValueCard
             * exists elsewhere in the project.
             */

            if (
                typeof renderValueCard ===
                "function"
            ) {
                valueContainer.innerHTML =
                    renderValueCard();
            }

            if (
                typeof loadValueCard ===
                "function"
            ) {
                loadValueCard(vehicle);
            }
        }


    } catch (error) {

        console.error(
            "Vehicle loading error:",
            error
        );

        if (vehicleList) {

            vehicleList.innerHTML = `
                <div class="empty-state-small">
                    Could not load vehicle data.
                </div>
            `;
        }

        if (vehicleTitle) {

            vehicleTitle.textContent =
                "Could not load vehicle";
        }
    }
});