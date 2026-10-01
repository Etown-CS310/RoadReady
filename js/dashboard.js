document.addEventListener("DOMContentLoaded", function () {

// Elements
const userElement = document.getElementById("dashboard-user");
const vehicleName = document.getElementById("dashboard-vehicle-name");
const vehicleDetails = document.getElementById("dashboard-vehicle-details");
const mileageElement = document.getElementById("dashboard-mileage");
const maintenanceList = document.getElementById("dashboard-maintenance-list");
const historyElement = document.getElementById("dashboard-history");
const nextServiceNumber = document.getElementById("next-service-number");
const nextServiceSub = document.getElementById("next-service-sub");
const maintenanceYearNumber = document.getElementById("maintenance-year-number");


// Selected vehicle
const vehicleId = Number(localStorage.getItem("selectedVehicleId")) || 1;
const vehicle =roadReadyData.vehicles.find(v => v.id === vehicleId) || roadReadyData.vehicles[0];

//User
userElement.textContent = "👤 " + roadReadyData.user.name;

// Vehicle information
vehicleName.textContent = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
vehicleDetails.textContent = `${vehicle.engine} • ${vehicle.transmission} • ${vehicle.bodyType}`;
mileageElement.textContent = `Current Mileage: ${formatMileage(vehicle.mileage)}`;

// Vehicle image
const vehiclePhoto = document.getElementById("vehiclePhoto");
if (vehicle.image) {
    vehiclePhoto.src = vehicle.image;
} else {
    vehiclePhoto.style.display = "none";
}
 
// Maintenance data
const maintenance =
    roadReadyData.maintenance.filter(function (item) {
        return Number(item.vehicleId) === Number(vehicle.id);
    });

const history =
    roadReadyData.history.filter(function (item) {
        return Number(item.vehicleId) === Number(vehicle.id);
    });

// Next service
const nextService =
    maintenance.find(function (item) {
        return item.status === "soon";
    });

if (nextService) {
    nextServiceNumber.textContent = "Soon";
    nextServiceSub.textContent = nextService.name;
} else {
    nextServiceNumber.textContent = "None";
    nextServiceSub.textContent = "No upcoming service";
}



// Maintenance this year
maintenanceYearNumber.textContent =
    history.length;

// Upcoming Maintenance
maintenanceList.replaceChildren();
if (maintenance.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state-small";
    emptyState.textContent = "No scheduled maintenance.";
    maintenanceList.appendChild(emptyState);
} else {
    maintenance.forEach(function (item) {
        const maintenanceItem = document.createElement("div");
        maintenanceItem.className = "maintenance-item";

        // Left side
        const information = document.createElement("div");
        const serviceName = document.createElement("div");
        serviceName.className = "service-name";
        serviceName.textContent = item.name || "Maintenance";
        const serviceDetail = document.createElement("div");
        serviceDetail.className = "service-detail";
        serviceDetail.textContent = item.detail || "";
        information.appendChild(serviceName);
        information.appendChild(serviceDetail);

        // Status
        const status = document.createElement("span");
        status.className = `status ${item.status}`;
        const statusLabels = {
            soon: "DUE SOON",
            overdue: "OVERDUE",
            good: "UPCOMING"
        };
        status.textContent = statusLabels[item.status] || item.status || "";
        maintenanceItem.appendChild(information);
        maintenanceItem.appendChild(status);
        maintenanceList.appendChild(maintenanceItem);
    });

}

// Recent Maintenance History
historyElement.replaceChildren();
if (history.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state-small";
    emptyState.textContent = "No maintenance history yet.";
    historyElement.appendChild(emptyState);
} else {
    const tableScroll = document.createElement("div");
    tableScroll.className = "table-scroll";
    const table = document.createElement("table");
    
    //Table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    [
        "Date",
        "Service",
        "Mileage",
        "Cost",
        "Shop",
        "Notes"
    ].forEach(function (heading) {
        const th = document.createElement("th");
        th.textContent = heading;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement("tbody");
    history.slice(0, 3).forEach(function (item) {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.textContent == item.date || "";

        const serviceCell = document.createElement("td");
        serviceCell.textContent = item.service || item.name || "";

        const mileageCell = document.createElement("td");
        mileageCell.textContent = Number(item.mileage).toLocaleString();

        const costCell = document.createElement("td");
        costCell.textContent = formatCurrency(item.cost);

        const shopCell = document.createElement("td");
        shopCell.textContent = item.shop || "—";

        const notesCell = document.createElement("td");
        notesCell.textContent = item.notes || "—";

        row.appendChild(dateCell);
        row.appendChild(serviceCell);
        row.appendChild(mileageCell);
        row.appendChild(costCell);
        row.appendChild(shopCell);
        row.appendChild(notesCell);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableScroll.appendChild(table);
    historyElement.appendChild(tableScroll);
}

// Estimated Vehicle Value
loadValueCard(vehicle);
});