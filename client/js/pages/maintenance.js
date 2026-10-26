/*
 * Filename: /client/js/pages/maintenance.js
 *
 * This file controls the RoadReady Maintenance page.
 *
 * Responsibilities:
 * - Request maintenance data from the server API.
 * - Display the authenticated user's information.
 * - Display available vehicles.
 * - Allow the user to select a vehicle.
 * - Display scheduled maintenance for the selected vehicle.
 * - Display maintenance history for the selected vehicle.
 * - Remember the selected vehicle using localStorage.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Contain SQL queries.
 * - Manage authentication directly.
 * - Write maintenance records to MySQL.
 *
 * Maintenance data is provided by /server/routes/maintenance.js.
 */

document.addEventListener("DOMContentLoaded", async function () {

    const vehicleSelector =
        document.getElementById("maintenanceVehicle");

    const userElement =
        document.getElementById("maintenance-user");

    const maintenanceList =
        document.getElementById("maintenance-list");

    const maintenanceHistory =
        document.getElementById("maintenance-history");


    try {

        // --------------------------------------------------
        // LOAD DATA
        // --------------------------------------------------

        const response = await fetch("/api/maintenance", {
            credentials: "include"
        });


        if (!response.ok) {
            throw new Error("Could not load maintenance data.");
        }


        const data = await response.json();


        if (!data.success) {
            throw new Error(
                data.message || "Could not load maintenance data."
            );
        }


        // --------------------------------------------------
        // USER
        // --------------------------------------------------

        if (userElement) {

            userElement.textContent =
                data.user.fullName || data.user.email;
        }


        // --------------------------------------------------
        // VEHICLES
        // --------------------------------------------------

        const vehicles = data.vehicles || [];


        if (vehicles.length === 0) {

            vehicleSelector.innerHTML = "";

            const option =
                document.createElement("option");

            option.textContent = "No vehicles found";
            option.disabled = true;
            option.selected = true;

            vehicleSelector.appendChild(option);

            renderEmptyMaintenance();
            renderEmptyHistory();

            return;
        }


        // --------------------------------------------------
        // SELECTED VEHICLE
        // --------------------------------------------------

        let selectedVehicleId =
            Number(
                localStorage.getItem("selectedVehicleId")
            );


        let vehicle =
            vehicles.find(
                v => Number(v.id) === selectedVehicleId
            );


        // If localStorage points to a vehicle the user
        // no longer has, use their first vehicle.
        if (!vehicle) {

            vehicle = vehicles[0];

            selectedVehicleId =
                Number(vehicle.id);

            localStorage.setItem(
                "selectedVehicleId",
                selectedVehicleId
            );
        }


        // --------------------------------------------------
        // VEHICLE SELECTOR
        // --------------------------------------------------

        vehicleSelector.replaceChildren();


        vehicles.forEach(function (v) {

            const option =
                document.createElement("option");

            option.value = v.id;

            option.textContent =
                v.nickname
                    ? `${v.nickname} — ${v.model_year} ${v.make} ${v.model}`
                    : `${v.model_year} ${v.make} ${v.model}`;

            if (Number(v.id) === Number(vehicle.id)) {
                option.selected = true;
            }

            vehicleSelector.appendChild(option);
        });


        vehicleSelector.addEventListener(
            "change",
            function () {

                localStorage.setItem(
                    "selectedVehicleId",
                    this.value
                );

                renderVehicleMaintenance(
                    Number(this.value),
                    data
                );
            }
        );


        // --------------------------------------------------
        // INITIAL DATA
        // --------------------------------------------------

        renderVehicleMaintenance(
            Number(vehicle.id),
            data
        );


    } catch (error) {

        console.error(
            "Maintenance loading error:",
            error
        );

        if (maintenanceList) {

            maintenanceList.innerHTML = `
                <div class="empty-state-small">
                    Could not load maintenance data.
                </div>
            `;
        }

        if (maintenanceHistory) {

            maintenanceHistory.innerHTML = `
                <div class="empty-state-small">
                    Could not load maintenance history.
                </div>
            `;
        }
    }
});


// ==========================================================
// RENDER SELECTED VEHICLE
// ==========================================================

function renderVehicleMaintenance(vehicleId, data) {

    const maintenanceList =
        document.getElementById("maintenance-list");

    const maintenanceHistory =
        document.getElementById("maintenance-history");


    // --------------------------------------------------
    // FILTER DATA
    // --------------------------------------------------

    const schedule =
        (data.maintenance || []).filter(function (item) {

            return Number(item.vehicle_id) ===
                Number(vehicleId);
        });


    const history =
        (data.history || []).filter(function (item) {

            return Number(item.vehicle_id) ===
                Number(vehicleId);
        });


    // --------------------------------------------------
    // UPCOMING MAINTENANCE
    // --------------------------------------------------

    maintenanceList.replaceChildren();


    if (schedule.length === 0) {

        renderEmptyMaintenance();

    } else {

        schedule.forEach(function (item) {

            const itemElement =
                document.createElement("div");

            itemElement.className =
                "maintenance-item";


            // Maintenance name

            const title =
                document.createElement("h3");

            title.textContent =
                item.maintenance_name ||
                "Maintenance";

            itemElement.appendChild(title);


            // Due mileage

            if (
                item.due_mileage !== null &&
                item.due_mileage !== undefined
            ) {

                const mileage =
                    document.createElement("p");

                mileage.textContent =
                    `Due mileage: ${
                        Number(item.due_mileage)
                            .toLocaleString()
                    }`;

                itemElement.appendChild(mileage);
            }


            // Due date

            if (item.due_date) {

                const date =
                    document.createElement("p");

                date.textContent =
                    `Due date: ${formatDate(item.due_date)}`;

                itemElement.appendChild(date);
            }


            // Notes

            if (item.notes) {

                const notes =
                    document.createElement("p");

                notes.textContent =
                    item.notes;

                itemElement.appendChild(notes);
            }


            // Status

            if (item.status) {

                const status =
                    document.createElement("p");

                status.className =
                    `maintenance-status ${item.status}`;


                const statusText = {
                    overdue: "Overdue",
                    soon: "Due Soon",
                    good: "Scheduled"
                };


                status.textContent =
                    statusText[item.status] ||
                    item.status;

                itemElement.appendChild(status);
            }


            maintenanceList.appendChild(
                itemElement
            );
        });
    }


    // --------------------------------------------------
    // MAINTENANCE HISTORY
    // --------------------------------------------------

    maintenanceHistory.replaceChildren();


    if (history.length === 0) {

        renderEmptyHistory();

    } else {

        const table =
            document.createElement("table");


        const thead =
            document.createElement("thead");


        const headerRow =
            document.createElement("tr");


        [
            "Maintenance Type",
            "Date",
            "Mileage",
            "Notes"
        ].forEach(function (heading) {

            const th =
                document.createElement("th");

            th.textContent =
                heading;

            headerRow.appendChild(th);
        });


        thead.appendChild(headerRow);
        table.appendChild(thead);


        const tbody =
            document.createElement("tbody");


        history.forEach(function (item) {

            const row =
                document.createElement("tr");


            const typeCell =
                document.createElement("td");

            typeCell.textContent =
                item.maintenance_name ||
                "";



            const dateCell =
                document.createElement("td");

            dateCell.textContent =
                formatDate(item.service_date);



            const mileageCell =
                document.createElement("td");

            mileageCell.textContent =
                item.mileage_at_service !== null &&
                item.mileage_at_service !== undefined
                    ? Number(
                        item.mileage_at_service
                    ).toLocaleString()
                    : "";



            const notesCell =
                document.createElement("td");

            notesCell.textContent =
                item.notes ||
                "";



            row.appendChild(typeCell);
            row.appendChild(dateCell);
            row.appendChild(mileageCell);
            row.appendChild(notesCell);

            tbody.appendChild(row);
        });


        table.appendChild(tbody);

        maintenanceHistory.appendChild(table);
    }
}


// ==========================================================
// EMPTY STATES
// ==========================================================

function renderEmptyMaintenance() {

    const maintenanceList =
        document.getElementById("maintenance-list");

    if (!maintenanceList) {
        return;
    }

    maintenanceList.innerHTML = `
        <div class="empty-state-small">
            No scheduled maintenance.
        </div>
    `;
}


function renderEmptyHistory() {

    const maintenanceHistory =
        document.getElementById("maintenance-history");

    if (!maintenanceHistory) {
        return;
    }

    maintenanceHistory.innerHTML = `
        <div class="empty-state-small">
            No maintenance history.
        </div>
    `;
}


// ==========================================================
// DATE FORMAT
// ==========================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString();
}
