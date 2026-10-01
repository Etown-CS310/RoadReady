document.addEventListener("DOMContentLoaded", function () {

const vehicleSelector = document.getElementById("maintenanceVehicle");
const userElement = document.getElementById("maintenance-user");
const maintenanceList = document.getElementById("maintenance-list");
const maintenanceHistory = document.getElementById("maintenance-history");


//Selected vehicle
const vehicleId =
    Number(localStorage.getItem("selectedVehicleId")) || 1;

const vehicle =
    roadReadyData.vehicles.find(v => v.id === vehicleId) ||
    roadReadyData.vehicles[0];



// User
userElement.textContent = roadReadyData.user.name;



// Vehicle selector

roadReadyData.vehicles.forEach(function (v) {
    const option = document.createElement("option");
    option.value = v.id;
    option.textContent = `${v.year} ${v.make} ${v.model}`;
    if (v.id === vehicle.id) {
        option.selected = true;
    }
    vehicleSelector.appendChild(option);
});

vehicleSelector.addEventListener("change", function () {
    localStorage.setItem("selectedVehicleId", this.value);
    location.reload();

});

//Maintenance data
const schedule = roadReadyData.maintenance.filter(function (item) {
    return Number(item.vehicleId) === Number(vehicle.id);
});

const history = roadReadyData.history.filter(function (item) {
    return Number(item.vehicleId) === Number(vehicle.id);
});


//Upcoming Maintenance
maintenanceList.replaceChildren();
if (schedule.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state-small";
    emptyState.textContent = "No scheduled maintenance.";
    maintenanceList.appendChild(emptyState);
} else {
    schedule.forEach(function (item) {
        const itemElement = document.createElement("div");
        itemElement.className = "maintenance-item";

        // Maintenance name
        const title = document.createElement("h3");
        title.textContent =
            item.name ||
            item.type ||
            item.service ||
            "Maintenance";
        itemElement.appendChild(title);


        // Put in maintenance details

        if (item.detail) {
            const detail = document.createElement("p");
            detail.textContent = item.detail;
            itemElement.appendChild(detail);
        } else {
            if (
                item.dueMileage !== undefined &&
                item.dueMileage !== null &&
                item.dueMileage !== ""
            ) {
                const mileage = document.createElement("p");
                mileage.textContent =
                    `Due mileage: ${Number(item.dueMileage).toLocaleString()}`;
                itemElement.appendChild(mileage);
            }

            if (item.dueDate) {
                const date = document.createElement("p");
                date.textContent =
                    `Due date: ${item.dueDate}`;
                itemElement.appendChild(date);
            }

            if (item.notes) {
                const notes = document.createElement("p");
                notes.textContent = item.notes;
                itemElement.appendChild(notes);
            }
        }

        // Status
        if (item.status) {
            const status = document.createElement("p");
            status.className = `maintenance-status ${item.status}`;
            const statusText = {
                overdue: "Overdue",
                soon: "Due Soon",
                good: "Scheduled"
            };
            status.textContent =
                statusText[item.status] || item.status;
            itemElement.appendChild(status);
        }
        maintenanceList.appendChild(itemElement);
    });
}

// Maintenance History
maintenanceHistory.replaceChildren();
if (history.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state-small";
    emptyState.textContent = "No maintenance history.";
    maintenanceHistory.appendChild(emptyState);
} else {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    [
        "Maintenance Type",
        "Date",
        "Mileage",
        "Notes"
    ].forEach(function (heading) {
        const th = document.createElement("th");
        th.textContent = heading;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    history.forEach(function (item) {
        const row = document.createElement("tr");
        const typeCell = document.createElement("td");
        typeCell.textContent =
            item.type ||
            item.name ||
            item.service ||
            "";

        const dateCell = document.createElement("td");
        dateCell.textContent =
            item.date ||
            item.completedDate ||
            "";

        const mileageCell = document.createElement("td");
        mileageCell.textContent =
            item.mileage ??
            item.completedMileage ??
            "";

        const notesCell = document.createElement("td");
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


// Maintenance form

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