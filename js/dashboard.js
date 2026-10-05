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

        ${renderValueCard()}

        ${renderStats(stats)}


        <section class="row g-4">


           <div class="col-lg-6">
        ${renderPanel(
            "Upcoming Maintenance",

            maintenance.length
                ? renderMaintenanceList(maintenance)
                : `
                    <div class="text-muted py-3">
                        No scheduled maintenance.
                    </div>
                `,

            "maintenance.html"
        )}
    </div>

    <div class="col-lg-6">
        ${renderPanel(
            "Recent Maintenance",

            history.length
                ? renderHistoryTable(
                    history.slice(0, 3)
                )
                : `
                    <div class="text-muted py-3">
                        No maintenance history yet.
                    </div>
                `,

            "maintenance.html"
        )}
    </div>

</section>

    `;

    loadValueCard(vehicle);

});
