document.addEventListener("DOMContentLoaded", function () {

    const content = document.getElementById("maintenance-content");

    const vehicleId =
        Number(localStorage.getItem("selectedVehicleId")) || 1;

    const vehicle = roadReadyData.vehicles.find(
        v => v.id === vehicleId
    );

    const schedule = roadReadyData.maintenance.filter(
        item => item.vehicleId === vehicle.id
    );

    const history = roadReadyData.history.filter(
        item => item.vehicleId === vehicle.id
    );

    content.innerHTML = `

        ${renderTopbar(
            "Maintenance",
            "Track upcoming service and completed maintenance.",
            roadReadyData.user.name
        )}

        <div class="vehicle-selector">

            <label for="maintenanceVehicle">
                Vehicle
            </label>

            <select id="maintenanceVehicle">

                ${roadReadyData.vehicles.map(v => `

                    <option
                        value="${v.id}"
                        ${v.id === vehicle.id ? "selected" : ""}
                    >
                        ${v.year} ${v.make} ${v.model}
                    </option>

                `).join("")}

            </select>

        </div>

        <section class="content-grid maintenance-layout">

            ${renderPanel(
                "Upcoming Maintenance",

                schedule.length
                    ? renderMaintenanceList(schedule)
                    : `<div class="empty-state-small">
                        No scheduled maintenance.
                       </div>`
            )}

            ${renderPanel(
                "Add Maintenance",

                `

                    <form id="maintenanceForm" class="form-grid">

                        <label for="maintenanceType">
                            Maintenance Type
                        </label>

                        <select id="maintenanceType" required>

                            <option value="">
                                Select service
                            </option>

                            <option>Oil Change</option>
                            <option>Brake Inspection</option>
                            <option>Tire Rotation</option>
                            <option>Air Filter</option>
                            <option>Transmission Service</option>

                        </select>

                        <label for="dueMileage">
                            Due Mileage
                        </label>

                        <input
                            type="number"
                            id="dueMileage"
                            min="0"
                            placeholder="e.g. 145000"
                        >

                        <label for="dueDate">
                            Due Date
                        </label>

                        <input
                            type="date"
                            id="dueDate"
                        >

                        <label for="notes">
                            Notes
                        </label>

                        <textarea
                            id="notes"
                            maxlength="255"
                            rows="3"
                        ></textarea>

                        <button
                            type="submit"
                            class="button"
                        >
                            Add Schedule Item
                        </button>

                    </form>

                `
            )}

        </section>

        ${renderPanel(
            "Maintenance History",
            renderHistoryTable(history)
        )}

    `;


    /*
     * Vehicle selector
     */

    document
        .getElementById("maintenanceVehicle")
        .addEventListener("change", function () {

            localStorage.setItem(
                "selectedVehicleId",
                this.value
            );

            location.reload();

        });


    /*
     * Temporary maintenance form.
     */

    document
        .getElementById("maintenanceForm")
        .addEventListener("submit", function (event) {

            event.preventDefault();

            alert(
                "Maintenance was submitted locally. " +
                "Database integration will be added later."
            );

        });

});
