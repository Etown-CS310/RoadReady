/*
 * Filename: /client/js/pages/dashboard.js
 *
 * This file controls the RoadReady Dashboard page.
 *
 * Responsibilities:
 * - Request dashboard data from the server API.
 * - Display the authenticated user's information.
 * - Allow the user to switch between vehicles.
 * - Remember the selected vehicle using localStorage.
 * - Load and control the vehicle photo gallery.
 * - Display vehicle valuation information.
 * - Display upcoming maintenance.
 * - Display maintenance history.
 * - Display vehicle maintenance status.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Authenticate users directly.
 * - Contain SQL queries.
 *
 * Dashboard data is provided by /server/routes/dashboard.js.
 * Vehicle photos are provided by /server/routes/vehicle-photos.js.
 */


// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const SELECTED_VEHICLE_STORAGE_KEY =
    "selectedVehicleId";


// --------------------------------------------------
// DATE FORMATTING
// --------------------------------------------------

function localDate(value) {

    const date = new Date(
        String(value).slice(0, 10) + "T00:00:00"
    );

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString();
}


// --------------------------------------------------
// MONEY FORMATTING
// --------------------------------------------------

function dashboardMoney(value) {

    if (typeof formatMoney === "function") {
        return formatMoney(value);
    }

    return Number(value || 0).toLocaleString(
        undefined,
        {
            style: "currency",
            currency: "USD"
        }
    );
}


// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    const vehicleSelect =
        document.getElementById("dashboard-vehicle-select");

    let dashboardRequestNumber = 0;
    let valueRequestNumber = 0;


    // --------------------------------------------------
    // USER
    // --------------------------------------------------

    function renderUser(user) {

        const userElement =
            document.getElementById("dashboard-user");

        if (userElement && user) {

            userElement.textContent =
                user.fullName || user.email || "";
        }
    }


    // --------------------------------------------------
    // LOAD VEHICLES
    // --------------------------------------------------

    async function loadVehicles() {

        const response = await fetch(
            "/api/vehicle",
            {
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error("Could not load vehicles.");
        }

        const data = await response.json();

        if (!data.success) {

            throw new Error(
                data.message || "Could not load vehicles."
            );
        }

        return data.vehicles || [];
    }


    // --------------------------------------------------
    // POPULATE VEHICLE SELECTOR
    // --------------------------------------------------

    function populateVehicleSelector(vehicles, selectedId) {

        if (!vehicleSelect) {
            return;
        }

        vehicleSelect.replaceChildren();

        if (vehicles.length === 0) {

            const option = document.createElement("option");

            option.value = "";
            option.textContent = "No vehicles";

            vehicleSelect.appendChild(option);
            vehicleSelect.disabled = true;

            return;
        }

        vehicleSelect.disabled = false;

        vehicles.forEach(vehicle => {

            const option = document.createElement("option");

            option.value = String(vehicle.id);

            option.textContent =
                vehicle.nickname ||
                `${vehicle.model_year} ${vehicle.make} ${vehicle.model}`;

            vehicleSelect.appendChild(option);
        });

        vehicleSelect.value = String(selectedId);
    }


    // --------------------------------------------------
    // CLEAR DASHBOARD
    // --------------------------------------------------

    function clearDashboard() {

        const vehicleName =
            document.getElementById("dashboard-vehicle-name");

        const vehicleDetails =
            document.getElementById("dashboard-vehicle-details");

        const mileage =
            document.getElementById("dashboard-mileage");

        const valueAmount =
            document.querySelector("#value-card .value-amount");

        const valueRange =
            document.querySelector("#value-card .value-range");

        const nextServiceNumber =
            document.getElementById("next-service-number");

        const nextServiceSub =
            document.getElementById("next-service-sub");

        const maintenanceYearNumber =
            document.getElementById("maintenance-year-number");

        const maintenanceYearSub =
            maintenanceYearNumber
                ? maintenanceYearNumber.parentElement.querySelector(".stat-sub")
                : null;

        const statusElement =
            document.querySelector(
                ".stat-card:nth-child(3) .stat-number"
            );

        if (vehicleName) {
            vehicleName.textContent = "No vehicle selected";
        }

        if (vehicleDetails) {
            vehicleDetails.textContent = "Register a vehicle to get started.";
        }

        if (mileage) {
            mileage.textContent = "";
        }

        if (valueAmount) {
            valueAmount.textContent = "Unavailable";
        }

        if (valueRange) {
            valueRange.textContent = "No vehicle selected.";
        }

        if (nextServiceNumber) {
            nextServiceNumber.textContent = "None";
        }

        if (nextServiceSub) {
            nextServiceSub.textContent = "No upcoming service";
        }

        if (maintenanceYearNumber) {
            maintenanceYearNumber.textContent = "0";
        }

        if (maintenanceYearSub) {
            maintenanceYearSub.textContent = "Services completed";
        }

        if (statusElement) {
            statusElement.textContent = "Good";
        }

        const maintenanceList =
            document.getElementById("dashboard-maintenance-list");

        const history =
            document.getElementById("dashboard-history");

        if (maintenanceList) {
            maintenanceList.innerHTML = `
                <div class="empty-state-small">
                    No scheduled maintenance.
                </div>
            `;
        }

        if (history) {
            history.innerHTML = `
                <div class="empty-state-small">
                    No maintenance history yet.
                </div>
            `;
        }

        if (typeof window.initializeVehicleGallery === "function") {
            window.initializeVehicleGallery(null);
        }
    }


    // --------------------------------------------------
    // RENDER VEHICLE
    // --------------------------------------------------

    function renderVehicle(vehicle) {

        const vehicleName =
            document.getElementById("dashboard-vehicle-name");

        const vehicleDetails =
            document.getElementById("dashboard-vehicle-details");

        const mileage =
            document.getElementById("dashboard-mileage");

        if (vehicleName) {

            vehicleName.textContent =
                vehicle.nickname ||
                `${vehicle.model_year} ${vehicle.make} ${vehicle.model}`;
        }

        if (vehicleDetails) {

            vehicleDetails.textContent =
                `${vehicle.model_year} ${vehicle.make} ${vehicle.model}`;
        }

        if (mileage) {

            mileage.textContent =
                vehicle.current_mileage !== null &&
                vehicle.current_mileage !== undefined
                    ? `${Number(vehicle.current_mileage).toLocaleString()} miles`
                    : "Mileage unavailable";
        }

        if (typeof window.initializeVehicleGallery === "function") {
            window.initializeVehicleGallery(vehicle);
        }
    }


    // --------------------------------------------------
    // LOAD VEHICLE VALUE
    // --------------------------------------------------

    async function renderVehicleValue(vehicleId, requestNumber) {

        const valueAmount =
            document.querySelector("#value-card .value-amount");

        const valueRange =
            document.querySelector("#value-card .value-range");

        if (!valueAmount) {
            return;
        }

        valueAmount.textContent = "Loading...";

        if (valueRange) {
            valueRange.textContent = "";
        }

        try {

            if (typeof getVehicleValue !== "function") {
                throw new Error("Vehicle valuation helper is unavailable.");
            }

            const valueData =
                await getVehicleValue(vehicleId);

            // Ignore a result belonging to an older selection.
            if (requestNumber !== valueRequestNumber) {
                return;
            }

            if (!valueData) {

                valueAmount.textContent = "Unavailable";

                if (valueRange) {
                    valueRange.textContent = "No valuation data yet.";
                }

                return;
            }

            valueAmount.textContent =
                dashboardMoney(valueData.value);

            if (valueRange) {

                valueRange.textContent =
                    `${dashboardMoney(valueData.low)} – ${dashboardMoney(valueData.high)} • ${valueData.source}`;
            }

        } catch (error) {

            if (requestNumber !== valueRequestNumber) {
                return;
            }

            console.error("Vehicle value error:", error);

            valueAmount.textContent = "Unavailable";

            if (valueRange) {
                valueRange.textContent = "Couldn't load valuation.";
            }
        }
    }


    // --------------------------------------------------
    // RENDER NEXT SERVICE
    // --------------------------------------------------

    function renderNextService(nextService) {

        const number =
            document.getElementById("next-service-number");

        const sub =
            document.getElementById("next-service-sub");

        if (!number) {
            return;
        }

        if (
            nextService &&
            nextService.next_due_mileage !== null &&
            nextService.next_due_mileage !== undefined
        ) {

            number.textContent =
                Number(nextService.next_due_mileage).toLocaleString();

            if (sub) {
                sub.textContent = "miles";
            }

        } else {

            number.textContent = "None";

            if (sub) {
                sub.textContent = "No upcoming service";
            }
        }
    }


    // --------------------------------------------------
    // RENDER YEARLY MAINTENANCE
    // --------------------------------------------------

    function renderMaintenanceThisYear(maintenance) {

        const number =
            document.getElementById("maintenance-year-number");

        const sub =
            number
                ? number.parentElement.querySelector(".stat-sub")
                : null;

        if (!number) {
            return;
        }

        const servicesCompleted =
            Number(maintenance?.services_completed || 0);

        const totalCost =
            Number(maintenance?.total_cost_cents || 0) / 100;

        number.textContent =
            servicesCompleted.toLocaleString();

        if (sub) {

            sub.textContent =
                `${servicesCompleted === 1 ? "Service" : "Services"} completed • ${dashboardMoney(totalCost)} spent`;
        }
    }


    // --------------------------------------------------
    // RENDER VEHICLE STATUS
    // --------------------------------------------------

    function renderVehicleStatus(status) {

        const statusElement =
            document.querySelector(
                ".stat-card:nth-child(3) .stat-number"
            );

        if (!statusElement) {
            return;
        }

        const normalizedStatus =
            String(status || "good");

        statusElement.textContent =
            normalizedStatus.charAt(0).toUpperCase() +
            normalizedStatus.slice(1);
    }


    // --------------------------------------------------
    // RENDER UPCOMING MAINTENANCE
    // --------------------------------------------------

    function renderUpcomingMaintenance(items) {

        const maintenanceList =
            document.getElementById("dashboard-maintenance-list");

        if (!maintenanceList) {
            return;
        }

        maintenanceList.replaceChildren();

        if (!items || items.length === 0) {

            maintenanceList.innerHTML = `
                <div class="empty-state-small">
                    No scheduled maintenance.
                </div>
            `;

            return;
        }

        items.forEach(item => {

            const element =
                document.createElement("div");

            element.className = "maintenance-item";

            const title =
                document.createElement("strong");

            title.textContent =
                item.maintenance_name || "Maintenance";

            const detail =
                document.createElement("span");

            detail.textContent =
                item.due_mileage
                    ? `Due at ${Number(item.due_mileage).toLocaleString()} miles`
                    : item.due_date
                        ? `Due ${localDate(item.due_date)}`
                        : "Scheduled maintenance";

            element.appendChild(title);
            element.appendChild(detail);

            maintenanceList.appendChild(element);
        });
    }


    // --------------------------------------------------
    // RENDER MAINTENANCE HISTORY
    // --------------------------------------------------

    function renderMaintenanceHistory(items) {

        const history =
            document.getElementById("dashboard-history");

        if (!history) {
            return;
        }

        history.replaceChildren();

        if (!items || items.length === 0) {

            history.innerHTML = `
                <div class="empty-state-small">
                    No maintenance history yet.
                </div>
            `;

            return;
        }

        items.forEach(item => {

            const element =
                document.createElement("div");

            element.className = "maintenance-item";

            const title =
                document.createElement("strong");

            title.textContent =
                item.maintenance_name || "Maintenance";

            const detail =
                document.createElement("span");

            detail.textContent =
                localDate(item.service_date) +
                (
                    item.mileage_at_service
                        ? ` • ${Number(item.mileage_at_service).toLocaleString()} miles`
                        : ""
                );

            element.appendChild(title);
            element.appendChild(detail);

            history.appendChild(element);
        });
    }


    // --------------------------------------------------
    // LOAD SELECTED VEHICLE DASHBOARD
    // --------------------------------------------------

    async function loadDashboard(vehicleId) {

        const requestNumber =
            ++dashboardRequestNumber;

        const currentValueRequest =
            ++valueRequestNumber;

        const url = vehicleId
            ? `/api/dashboard?vehicleId=${encodeURIComponent(vehicleId)}`
            : "/api/dashboard";

        try {

            const response = await fetch(
                url,
                {
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error("Could not load dashboard data.");
            }

            const data = await response.json();

            if (!data.success) {

                throw new Error(
                    data.message || "Could not load dashboard data."
                );
            }

            // Ignore stale dashboard responses.
            if (requestNumber !== dashboardRequestNumber) {
                return;
            }

            renderUser(data.user);

            if (!data.vehicle) {
                clearDashboard();
                return;
            }

            const vehicle = data.vehicle;

            // Keep the selector and saved selection synchronized.
            localStorage.setItem(
                SELECTED_VEHICLE_STORAGE_KEY,
                String(vehicle.id)
            );

            if (
                vehicleSelect &&
                vehicleSelect.value !== String(vehicle.id)
            ) {
                vehicleSelect.value = String(vehicle.id);
            }

            renderVehicle(vehicle);

            renderNextService(data.nextService);

            renderMaintenanceThisYear(
                data.maintenanceThisYear
            );

            renderVehicleStatus(data.vehicleStatus);

            renderUpcomingMaintenance(
                data.upcomingMaintenance
            );

            renderMaintenanceHistory(
                data.history
            );

            renderVehicleValue(
                vehicle.id,
                currentValueRequest
            );

        } catch (error) {

            if (requestNumber !== dashboardRequestNumber) {
                return;
            }

            console.error(
                "Dashboard loading error:",
                error
            );
        }
    }


    // --------------------------------------------------
    // INITIALIZE DASHBOARD
    // --------------------------------------------------

    try {

        const vehicles =
            await loadVehicles();

        let selectedVehicleId =
            localStorage.getItem(
                SELECTED_VEHICLE_STORAGE_KEY
            );

        let selectedVehicle =
            vehicles.find(vehicle =>
                String(vehicle.id) === String(selectedVehicleId)
            );

        // If the saved vehicle no longer belongs to this user,
        // select the first available vehicle instead.
        if (!selectedVehicle && vehicles.length > 0) {

            selectedVehicle = vehicles[0];

            selectedVehicleId =
                String(selectedVehicle.id);

            localStorage.setItem(
                SELECTED_VEHICLE_STORAGE_KEY,
                selectedVehicleId
            );
        }

        if (vehicleSelect) {

            populateVehicleSelector(
                vehicles,
                selectedVehicleId
            );

            vehicleSelect.addEventListener(
                "change",
                function () {

                    const newVehicleId =
                        vehicleSelect.value;

                    if (!newVehicleId) {
                        return;
                    }

                    localStorage.setItem(
                        SELECTED_VEHICLE_STORAGE_KEY,
                        newVehicleId
                    );

                    loadDashboard(newVehicleId);
                }
            );
        }

        if (selectedVehicle) {

            await loadDashboard(selectedVehicle.id);

        } else {

            clearDashboard();
        }

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );
    }
});
