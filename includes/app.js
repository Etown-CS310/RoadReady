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
        <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
                <h1 class="mb-1">${title}</h1>
                <p class="text-muted mb-0">${subtitle}</p>
            </div>

            <div class="text-muted">
                <i class="fa-solid fa-user me-2"></i>
                ${userName}
            </div>
        </div>
    `;
}


/* -----------------------------------------
   Vehicle Card
----------------------------------------- */

function renderVehicleCard(vehicle) {
    return `
        <section class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row align-items-center g-4">

                    <div class="col-md-7">

                        <h2 class="h3 mb-2">
                            ${vehicle.year}
                            ${vehicle.make}
                            ${vehicle.model}
                        </h2>

                        <p class="text-muted mb-3">
                            ${vehicle.engine}
                            &nbsp; • &nbsp;
                            ${vehicle.transmission}
                            &nbsp; • &nbsp;
                            ${vehicle.bodyType}
                        </p>

                        <span class="badge text-bg-light">
                            Current Mileage: ${formatMileage(vehicle.mileage)}
                        </span>

                    </div>

                    <div class="col-md-5 text-center">

                        <div class="vehicle-carousel position-relative">

                            <img
                                id="vehiclePhoto"
                                src="${vehicle.image}"
                                alt="${vehicle.make} ${vehicle.model}"
                                class="img-fluid rounded"
                            >

                            <button
                                id="previousButton"
                                onclick="previousPhoto()"
                                class="btn btn-light position-absolute top-50 start-0 translate-middle-y"
                                aria-label="Previous photo"
                            >
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>

                            <span
                                id="photoNumber"
                                class="position-absolute bottom-0 start-50 translate-middle-x mb-2 badge text-bg-dark"
                            >
                                1 / 3
                            </span>

                            <button
                                id="nextButton"
                                onclick="nextPhoto()"
                                class="btn btn-light position-absolute top-50 end-0 translate-middle-y"
                                aria-label="Next photo"
                            >
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>

                        </div>

                        <label class="btn btn-outline-primary mt-3">
                            <i class="fa-solid fa-upload me-2"></i>
                            Add Vehicle Photos
                            <input
                                type="file"
                                id="vehicleUpload"
                                accept="image/*"
                                multiple
                                hidden
                            >
                        </label>

                    </div>

                </div>
            </div>
        </section>
    `;
}



/* -----------------------------------------
   Vehicle Photo Carousel
----------------------------------------- */

let vehiclePhotos = [];
let currentPhoto = 0;

function nextPhoto() {

    if (vehiclePhotos.length === 0) return;

    currentPhoto++;

    if (currentPhoto >= vehiclePhotos.length) {
        currentPhoto = 0;
    }

    showPhoto();
}

function previousPhoto() {

    if (vehiclePhotos.length === 0) return;

    currentPhoto--;

    if (currentPhoto < 0) {
        currentPhoto = vehiclePhotos.length - 1;
    }

    showPhoto();
}

function showPhoto() {

    if (vehiclePhotos.length === 0) return;

    const vehiclePhoto = document.getElementById("vehiclePhoto");
    const photoNumber = document.getElementById("photoNumber");

    if (!vehiclePhoto || !photoNumber) return;

    vehiclePhoto.src = vehiclePhotos[currentPhoto];

    photoNumber.textContent =
        (currentPhoto + 1) + " / " + vehiclePhotos.length;
}


document.addEventListener("change", function(event) {

    if (event.target.id !== "vehicleUpload") return;

    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    files.forEach(function(file) {

        const photo = URL.createObjectURL(file);

        vehiclePhotos.push(photo);

    });

    currentPhoto = vehiclePhotos.length - files.length;

    showPhoto();

    // Allow the same file to be selected again later
    event.target.value = "";
});


/* -----------------------------------------
   Statistics
----------------------------------------- */

function renderStatCard(label, number, sub) {
    return `
        <div class="col-md-4">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="text-muted small text-uppercase fw-semibold">
                        ${label}
                    </div>

                    <div class="display-6 fw-semibold my-2">
                        ${number}
                    </div>

                    <div class="text-muted">
                        ${sub}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderStats(stats) {
    return `
        <section class="row g-3 mb-4">

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
        <div class="d-flex justify-content-between align-items-center py-3 border-bottom">

            <div>
                <div class="fw-semibold">
                    ${item.name}
                </div>

                <div class="text-muted small">
                    ${item.detail}
                </div>
            </div>

            <span class="badge ${
                item.status === "overdue"
                    ? "text-bg-danger"
                    : item.status === "soon"
                        ? "text-bg-warning"
                        : "text-bg-success"
            }">
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
            <div class="text-muted py-3">
                No maintenance history yet.
            </div>
        `;
    }

    return `
        <div class="table-responsive">

            <table class="table table-hover align-middle mb-0">

                <thead class="table-light">
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
        <div class="card border-0 shadow-sm h-100">

            <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-4 px-4">

                <h2 class="h5 mb-0">
                    ${title}
                </h2>

                ${
                    viewAllHref
                        ? `
                            <a
                                href="${viewAllHref}"
                                class="btn btn-sm btn-outline-primary"
                            >
                                View all
                            </a>
                        `
                        : ""
                }

            </div>

            <div class="card-body px-4">
                ${bodyHTML}
            </div>

        </div>
    `;
}


/* -----------------------------------------
   Vehicle Value
----------------------------------------- */

async function getVehicleValue(vehicle) {

    // FUTURE:
    // const res = await fetch(`/api/vehicles/${vehicle.id}/value`);
    // if (!res.ok) throw new Error("Valuation unavailable");
    // return await res.json();

    if (vehicle.estimatedValue == null) return null;

    return {
        value: vehicle.estimatedValue,
        low: Math.round(vehicle.estimatedValue * 0.92),
        high: Math.round(vehicle.estimatedValue * 1.08),
        updated: "Sample data",
        source: "Placeholder"
    };
}

function formatMoney(n) {
    return "$" + Number(n).toLocaleString();
}


/* -----------------------------------------
   Vehicle Value Card
----------------------------------------- */

function renderValueCard() {

    return `
        <section
            class="card border-0 shadow-sm mb-4"
            id="value-card"
        >
            <div class="card-body">

                <div class="text-muted small text-uppercase fw-semibold">
                    Estimated Value
                </div>

                <strong class="display-6 d-block my-2">
                    Loading...
                </strong>

                <small class="text-muted d-block value-range"></small>

            </div>
        </section>
    `;
}


// Fills the card in once data arrives.
async function loadValueCard(vehicle) {

    const card = document.getElementById("value-card");

    if (!card) return;

    try {

        const data = await getVehicleValue(vehicle);

        if (!data) {

            card.innerHTML = `
                <div class="card-body">

                    <div class="text-muted small text-uppercase fw-semibold">
                        Estimated Value
                    </div>

                    <strong class="display-6 d-block my-2">
                        Unavailable
                    </strong>

                    <small class="text-muted">
                        No valuation data yet.
                    </small>

                </div>
            `;

            return;
        }

        card.innerHTML = `
            <div class="card-body">

                <div class="text-muted small text-uppercase fw-semibold">
                    Estimated Value
                </div>

                <strong class="display-6 d-block my-2">
                    ${formatMoney(data.value)}
                </strong>

                <small class="text-muted">
                    ${formatMoney(data.low)}
                    –
                    ${formatMoney(data.high)}
                    • ${data.source}
                </small>

            </div>
        `;

    } catch (err) {

        card.innerHTML = `
            <div class="card-body">

                <div class="text-muted small text-uppercase fw-semibold">
                    Estimated Value
                </div>

                <strong class="display-6 d-block my-2">
                    Unavailable
                </strong>

                <small class="text-muted">
                    Couldn't load valuation.
                </small>

            </div>
        `;
    }
}