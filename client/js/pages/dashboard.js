/*
 * Filename: /client/js/pages/dashboard.js
 *
 * This file controls the RoadReady Dashboard page.
 *
 * Responsibilities:
 * - Request dashboard data from the server API.
 * - Display the authenticated user's information.
 * - Display the user's vehicle information.
 * - Display upcoming maintenance.
 * - Display maintenance history.
 * - Display vehicle maintenance status.
 * - Update dashboard elements using database-backed API data.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Authenticate users directly.
 * - Contain SQL queries.
 *
 * Dashboard data is provided by /server/routes/dashboard.js.
 */

// Format a "YYYY-MM-DD" string as a local date (avoids UTC off-by-one-day).
function localDate(value) {
    const date = new Date(String(value).slice(0, 10) + "T00:00:00");
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString();
}

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch("/api/dashboard", {
            credentials: "include"
        });


        if (!response.ok) {
            throw new Error("Could not load dashboard data.");
        }


        const data = await response.json();


        if (!data.success) {
            throw new Error(
                data.message || "Could not load dashboard data."
            );
        }


        // --------------------------------------------------
        // USER
        // --------------------------------------------------

        const userElement =
            document.getElementById("dashboard-user");

        if (userElement && data.user) {

            userElement.textContent =
                data.user.fullName || data.user.email;
        }


        // --------------------------------------------------
        // VEHICLE
        // --------------------------------------------------

        if (!data.vehicle) {

            console.log("No vehicle found for this user.");
            return;
        }


        const vehicle = data.vehicle;


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
                `${Number(vehicle.current_mileage).toLocaleString()} miles`;
        }


        // --------------------------------------------------
        // VEHICLE IMAGE
        // --------------------------------------------------

        const vehiclePhoto =
            document.getElementById("vehiclePhoto");

        if (vehiclePhoto && vehicle.image_url) {

            vehiclePhoto.src = vehicle.image_url;
        }


        // --------------------------------------------------
        // NEXT SERVICE
        // --------------------------------------------------

        const nextServiceNumber =
            document.getElementById("next-service-number");

        const nextServiceSub =
            document.getElementById("next-service-sub");


        if (
            nextServiceNumber &&
            data.nextService &&
            data.nextService.next_due_mileage
        ) {

            const dueMileage =
                Number(data.nextService.next_due_mileage);

            nextServiceNumber.textContent =
                dueMileage.toLocaleString();

            nextServiceSub.textContent =
                "miles";
        }


        // --------------------------------------------------
        // MAINTENANCE THIS YEAR
        // --------------------------------------------------

        const maintenanceYearNumber =
        document.getElementById("maintenance-year-number");

        const maintenanceYearSub =
        maintenanceYearNumber.parentElement.querySelector(".stat-sub");


        if (maintenanceYearNumber) {

            const servicesCompleted =
            Number(data.maintenanceThisYear.services_completed || 0);

            const totalCost =
            Number(data.maintenanceThisYear.total_cost_cents || 0) / 100;

            maintenanceYearNumber.textContent =
            servicesCompleted.toLocaleString();

            if (maintenanceYearSub) {

                maintenanceYearSub.textContent =
                    `${servicesCompleted === 1 ? "Service" : "Services"} completed • $${totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
            })} spent`;
            }
        }  


        // --------------------------------------------------
        // VEHICLE STATUS
        // --------------------------------------------------

        const statusElement =
            document.querySelector(
                ".stat-card:nth-child(3) .stat-number"
            );


        if (statusElement) {

            const status =
                data.vehicleStatus || "good";

            statusElement.textContent =
                status.charAt(0).toUpperCase() +
                status.slice(1);
        }


        // --------------------------------------------------
        // UPCOMING MAINTENANCE
        // --------------------------------------------------

        const maintenanceList =
            document.getElementById(
                "dashboard-maintenance-list"
            );


        if (maintenanceList) {

            maintenanceList.innerHTML = "";


            if (
                !data.upcomingMaintenance ||
                data.upcomingMaintenance.length === 0
            ) {

                maintenanceList.innerHTML = `
                    <div class="empty-state-small">
                        No scheduled maintenance.
                    </div>
                `;

            } else {

                data.upcomingMaintenance.forEach(item => {

                    const element =
                        document.createElement("div");

                    element.className =
                        "maintenance-item";

                    const title = document.createElement("strong");
                    title.textContent = item.maintenance_name;

                    const detail = document.createElement("span");
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
        }


        // --------------------------------------------------
        // MAINTENANCE HISTORY
        // --------------------------------------------------

        const history =
            document.getElementById(
                "dashboard-history"
            );


        if (history) {

            history.innerHTML = "";


            if (
                !data.history ||
                data.history.length === 0
            ) {

                history.innerHTML = `
                    <div class="empty-state-small">
                        No maintenance history yet.
                    </div>
                `;

            } else {

                data.history.forEach(item => {

                    const element =
                        document.createElement("div");

                    element.className =
                        "maintenance-item";

                    const title = document.createElement("strong");
                    title.textContent = item.maintenance_name;

                    const detail = document.createElement("span");
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
        }


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );
    }
});
