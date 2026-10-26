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
 * Vehicle data is provided by /server/routes/vehicles.js.
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


        // ------------------------------------------
        // CSV IMPORT
        // ------------------------------------------

        const importButton =
            document.getElementById("import");

        if (importButton) {

            importButton.addEventListener(
                "click",
                importCSV
            );
        }


        function importCSV() {

            const fileInput =
                document.getElementById(
                    "csv-input"
                );

            if (!fileInput) {
                return;
            }

            fileInput.value = "";

            fileInput.click();

            fileInput.addEventListener(
                "change",
                readFile,
                { once: true }
            );
        }


        function readFile() {

            const fileInput =
                document.getElementById(
                    "csv-input"
                );

            const file =
                fileInput.files[0];

            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function () {

                    /*
                     * CSV import is intentionally
                     * not connected to MySQL yet.
                     *
                     * The old version pushed directly
                     * into roadReadyData. That no
                     * longer applies now that vehicles
                     * come from the database.
                     */

                    console.log(
                        "CSV loaded:",
                        reader.result
                    );

                    alert(
                        "CSV was loaded, but database import is not implemented yet."
                    );
                };


            reader.readAsText(file);
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
