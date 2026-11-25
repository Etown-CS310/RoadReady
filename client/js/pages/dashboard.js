
/*
 * Filename: /client/js/pages/dashboard.js
 *
 * This file controls the RoadReady Dashboard page.
 *
 * Responsibilities:
 * - Request dashboard data from the server API.
 * - Display the authenticated user's information.
 * - Display the user's vehicle information.
 * - Load and control the vehicle photo gallery.
 * - Upload additional vehicle photos.
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
 * Vehicle photos are provided by /server/routes/vehicle-photos.js.
 */


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
// VEHICLE PHOTO GALLERY
// --------------------------------------------------

function initializeVehicleGallery(vehicle) {

    const carousel = document.querySelector(".vehicle-carousel");
    const vehiclePhoto = document.getElementById("vehiclePhoto");
    const previousButton = document.getElementById("previousButton");
    const nextButton = document.getElementById("nextButton");
    const photoNumber = document.getElementById("photoNumber");
    const uploadInput = document.getElementById("vehicleUpload");
    const uploadButton = document.querySelector(".upload-button");

    if (!carousel || !vehiclePhoto) {
        return;
    }

    let photos = [];
    let currentPhotoIndex = 0;
    let uploading = false;

    // Create the empty-gallery placeholder if it does not exist.
    let emptyState = carousel.querySelector(".vehicle-photo-empty");

    if (!emptyState) {

        emptyState = document.createElement("div");

        emptyState.className = "vehicle-photo-empty";

        emptyState.textContent = "No vehicle photos yet";

        carousel.appendChild(emptyState);
    }


    // --------------------------------------------------
    // RENDER CURRENT PHOTO
    // --------------------------------------------------

    function renderPhoto() {

        const hasPhotos = photos.length > 0;

        if (!hasPhotos) {

            vehiclePhoto.removeAttribute("src");
            vehiclePhoto.style.display = "none";

            emptyState.style.display = "flex";

            if (photoNumber) {
                photoNumber.textContent = "0 / 0";
            }

            if (previousButton) {
                previousButton.disabled = true;
            }

            if (nextButton) {
                nextButton.disabled = true;
            }

            return;
        }

        const photo = photos[currentPhotoIndex];

        vehiclePhoto.style.display = "block";
        emptyState.style.display = "none";

        vehiclePhoto.alt =
            `${vehicle.make} ${vehicle.model} photo ${currentPhotoIndex + 1}`;

        vehiclePhoto.onerror = () => {
            vehiclePhoto.style.display = "none";
            emptyState.textContent = "This photo could not be loaded.";
            emptyState.style.display = "flex";
        };

        vehiclePhoto.src = photo.image_url;

        if (photoNumber) {

            photoNumber.textContent =
                `${currentPhotoIndex + 1} / ${photos.length}`;
        }

        const multiplePhotos = photos.length > 1;

        if (previousButton) {
            previousButton.disabled = !multiplePhotos;
        }

        if (nextButton) {
            nextButton.disabled = !multiplePhotos;
        }
    }


    // --------------------------------------------------
    // LOAD PHOTOS FROM SERVER
    // --------------------------------------------------

    async function loadPhotos() {

        try {

            const response = await fetch(
                `/api/vehicle-photos/${vehicle.id}`,
                {
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message || "Could not load vehicle photos."
                );
            }

            photos = Array.isArray(data.photos)
                ? data.photos
                : [];

            currentPhotoIndex = 0;

            renderPhoto();

        } catch (error) {

            console.error("Vehicle gallery error:", error);

            photos = [];

            emptyState.textContent =
                "Could not load vehicle photos.";

            renderPhoto();
        }
    }


    // --------------------------------------------------
    // PREVIOUS PHOTO
    // --------------------------------------------------

    if (previousButton) {

        previousButton.addEventListener("click", () => {

            if (photos.length <= 1) {
                return;
            }

            currentPhotoIndex =
                (currentPhotoIndex - 1 + photos.length) % photos.length;

            renderPhoto();
        });
    }


    // --------------------------------------------------
    // NEXT PHOTO
    // --------------------------------------------------

    if (nextButton) {

        nextButton.addEventListener("click", () => {

            if (photos.length <= 1) {
                return;
            }

            currentPhotoIndex =
                (currentPhotoIndex + 1) % photos.length;

            renderPhoto();
        });
    }


    // --------------------------------------------------
    // UPLOAD PHOTOS
    // --------------------------------------------------

    if (uploadInput) {

        uploadInput.addEventListener("change", async () => {

            const selectedFiles = Array.from(uploadInput.files || []);

            if (selectedFiles.length === 0 || uploading) {
                return;
            }

            if (selectedFiles.length > 10) {

                alert("You can upload a maximum of 10 photos at once.");

                uploadInput.value = "";

                return;
            }

            const formData = new FormData();

            selectedFiles.forEach(file => {
                formData.append("photos", file);
            });

            uploading = true;

            if (uploadButton) {

                uploadButton.classList.add("uploading");
                uploadButton.setAttribute("aria-busy", "true");
            }

            try {

                const response = await fetch(
                    `/api/vehicle-photos/${vehicle.id}`,
                    {
                        method: "POST",
                        credentials: "include",
                        body: formData
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message || "Could not upload vehicle photos."
                    );
                }

                // Reload the complete gallery so the new images
                // appear in the same order used by the server.
                await loadPhotos();

                alert("Vehicle photos uploaded successfully.");

            } catch (error) {

                console.error("Vehicle photo upload error:", error);

                alert(error.message || "Could not upload vehicle photos.");

            } finally {

                uploading = false;

                if (uploadButton) {

                    uploadButton.classList.remove("uploading");
                    uploadButton.removeAttribute("aria-busy");
                }

                uploadInput.value = "";
            }
        });
    }


    // Initial gallery load.
    loadPhotos();
}


// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

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

            initializeVehicleGallery({
                id: null,
                make: "",
                model: ""
            });

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
        // VEHICLE PHOTO GALLERY
        // --------------------------------------------------

        initializeVehicleGallery(vehicle);


        // --------------------------------------------------
        // VEHICLE VALUE
        // --------------------------------------------------

        const valueAmount =
            document.querySelector("#value-card .value-amount");

        const valueRange =
            document.querySelector("#value-card .value-range");

        if (valueAmount) {

            // Not awaited, so a slow valuation never blocks
            // the rest of the dashboard from rendering.
            getVehicleValue(vehicle.id)

                .then(valueData => {

                    if (!valueData) {

                        valueAmount.textContent = "Unavailable";

                        if (valueRange) {
                            valueRange.textContent =
                                "No valuation data yet.";
                        }

                        return;
                    }

                    valueAmount.textContent =
                        formatMoney(valueData.value);

                    if (valueRange) {

                        valueRange.textContent =
                            `${formatMoney(valueData.low)} – ${formatMoney(valueData.high)} • ${valueData.source}`;
                    }
                })

                .catch(valueError => {

                    console.error("Vehicle value error:", valueError);

                    valueAmount.textContent = "Unavailable";

                    if (valueRange) {
                        valueRange.textContent =
                            "Couldn't load valuation.";
                    }
                });
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

            if (nextServiceSub) {
                nextServiceSub.textContent = "miles";
            }
        }


        // --------------------------------------------------
        // MAINTENANCE THIS YEAR
        // --------------------------------------------------

        const maintenanceYearNumber =
            document.getElementById("maintenance-year-number");

        const maintenanceYearSub =
            maintenanceYearNumber
                ? maintenanceYearNumber.parentElement.querySelector(".stat-sub")
                : null;

        if (maintenanceYearNumber) {

            const servicesCompleted =
                Number(data.maintenanceThisYear?.services_completed || 0);

            const totalCost =
                Number(data.maintenanceThisYear?.total_cost_cents || 0) / 100;

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
            document.getElementById("dashboard-maintenance-list");

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

                    element.className = "maintenance-item";

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
            document.getElementById("dashboard-history");

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

                    element.className = "maintenance-item";

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
