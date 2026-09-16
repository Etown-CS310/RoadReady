document.addEventListener("DOMContentLoaded", function () {

    const content = document.getElementById("dashboard-content");

    const vehicle =
        roadReadyData.vehicles.find(
            v => v.id === (
                Number(localStorage.getItem("selectedVehicleId")) || 1
            )
        ) || roadReadyData.vehicles[0];


    /*
     * Get maintenance information
     */

    const maintenance = roadReadyData.maintenance.filter(
        item => item.vehicleId === vehicle.id
    );

    const history = roadReadyData.history.filter(
        item => item.vehicleId === vehicle.id
    );


    /*
     * Dashboard statistics
     */

    const nextService =
        maintenance.find(
            item => item.status === "soon"
        );

    const stats = {

        nextService: {
            number: nextService ? "Soon" : "None",
            sub: nextService
                ? nextService.name
                : "No upcoming service"
        },

        year: {
            number: history.length,
            sub: "Services completed"
        },

        status: {
            number: "Good",
            sub: "Vehicle status"
        }

    };


    /*
     * Render dashboard
     */

    content.innerHTML = `

        ${renderTopbar(
            "Dashboard",
            "Keep track of your vehicle and maintenance.",
            roadReadyData.user.name
        )}


        ${renderVehicleCard(vehicle)}


        ${renderStats(stats)}


        <section class="content-grid">


            ${renderPanel(
                "Upcoming Maintenance",

                maintenance.length
                    ? renderMaintenanceList(maintenance)
                    : `
                        <div class="empty-state-small">
                            No scheduled maintenance.
                        </div>
                    `,

                "maintenance.html"
            )}


            ${renderPanel(
                "Recent Maintenance",

                history.length
                    ? renderHistoryTable(
                        history.slice(0, 3)
                    )
                    : `
                        <div class="empty-state-small">
                            No maintenance history yet.
                        </div>
                    `,

                "maintenance.html"
            )}

        </section>

    `;

});
