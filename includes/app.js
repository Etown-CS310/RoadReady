/*
 * RoadReady shared application JavaScript.
 *
 * This file currently contains frontend-only helpers.
 *
 * Later this can be expanded to communicate with the
 * PHP backend/API and database.
 */


/* -----------------------------------------
   Utility Functions
----------------------------------------- */

function formatMileage(mileage) {
    return Number(mileage).toLocaleString() + " mi";
}

function formatCurrency(amount) {
    return Number(amount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });
}


/* -----------------------------------------
   Topbar
----------------------------------------- */

function renderTopbar(title, subtitle, userName = "Sam Vossen") {
    return `
        <div class="topbar">
            <div>
                <h1>${title}</h1>
                <p>${subtitle}</p>
            </div>

            <div class="profile">
                👤 ${userName}
            </div>
        </div>
    `;
}


/* -----------------------------------------
   Vehicle Card
----------------------------------------- */

function renderVehicleCard(vehicle) {
    return `
        <section class="vehicle-card">

            <div class="vehicle-info">

                <h2>
                    ${vehicle.year}
                    ${vehicle.make}
                    ${vehicle.model}
                </h2>

                <p>
                    ${vehicle.engine}
                    &nbsp; • &nbsp;
                    ${vehicle.transmission}
                    &nbsp; • &nbsp;
                    ${vehicle.bodyType}
                </p>

                <span class="mileage">
                    Current Mileage: ${formatMileage(vehicle.mileage)}
                </span>

            </div>

            <div class="car-image">
                ${
                    vehicle.image
                        ? `<img src="${vehicle.image}" alt="${vehicle.make} ${vehicle.model}">`
                        : "🚘 No vehicle image"
                }
            </div>

        </section>
    `;
}


/* -----------------------------------------
   Statistics
----------------------------------------- */

function renderStatCard(label, number, sub) {
    return `
        <div class="stat-card">
            <div class="stat-label">${label}</div>
            <div class="stat-number">${number}</div>
            <div class="stat-sub">${sub}</div>
        </div>
    `;
}

function renderStats(stats) {
    return `
        <section class="stats">

            ${renderStatCard(
                "NEXT SERVICE",
                stats.nextService.number,
                stats.nextService.sub
            )}

            ${renderStatCard(
                "MAINTENANCE THIS YEAR",
                stats.year.number,
                stats.year.sub
            )}

            ${renderStatCard(
                "VEHICLE STATUS",
                stats.status.number,
                stats.status.sub
            )}

        </section>
    `;
}


/* -----------------------------------------
   Maintenance
----------------------------------------- */

function renderMaintenanceItem(item) {
    const labels = {
        soon: "DUE SOON",
        overdue: "OVERDUE",
        good: "UPCOMING"
    };

    const label = labels[item.status] || item.status.toUpperCase();

    return `
        <div class="maintenance-item">

            <div>
                <div class="service-name">
                    ${item.name}
                </div>

                <div class="service-detail">
                    ${item.detail}
                </div>
            </div>

            <span class="status ${item.status}">
                ${label}
            </span>

        </div>
    `;
}

function renderMaintenanceList(items) {
    return items.map(renderMaintenanceItem).join("");
}


/* -----------------------------------------
   History
----------------------------------------- */

function renderHistoryTable(rows) {
    if (!rows.length) {
        return `
            <div class="empty-state-small">
                No maintenance history yet.
            </div>
        `;
    }

    return `
        <div class="table-scroll">

            <table>

                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Service</th>
                        <th>Mileage</th>
                        <th>Cost</th>
                        <th>Shop</th>
                        <th>Notes</th>
                    </tr>
                </thead>

                <tbody>

                    ${rows.map(row => `
                        <tr>
                            <td>${row.date}</td>
                            <td>${row.service}</td>
                            <td>${row.mileage.toLocaleString()}</td>
                            <td>${formatCurrency(row.cost)}</td>
                            <td>${row.shop || "—"}</td>
                            <td>${row.notes || "—"}</td>
                        </tr>
                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}


/* -----------------------------------------
   Panels
----------------------------------------- */

function renderPanel(title, bodyHTML, viewAllHref = null) {
    return `
        <div class="panel">

            <div class="panel-header">

                <h2>${title}</h2>

                ${
                    viewAllHref
                        ? `<a href="${viewAllHref}" class="view-link">View all</a>`
                        : ""
                }

            </div>

            ${bodyHTML}

        </div>
    `;
}
