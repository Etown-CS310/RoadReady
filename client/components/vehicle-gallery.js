/*
 * Filename: /client/components/vehicle-gallery.js
 *
 * This file provides the shared RoadReady vehicle photo gallery.
 *
 * Responsibilities:
 * - Load photos for a selected vehicle.
 * - Display photos in a carousel.
 * - Allow users to move between photos.
 * - Upload additional vehicle photos.
 * - Display an empty state when no photos exist.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Manage vehicle ownership.
 * - Store vehicle photo records directly.
 *
 * Vehicle photos are provided by /server/routes/vehicle-photos.js.
 */

(function () {

    window.initializeVehicleGallery = function (vehicle) {

        const carousel =
            document.querySelector(".vehicle-carousel");

        const vehiclePhoto =
            document.getElementById("vehiclePhoto");

        const previousButton =
            document.getElementById("previousButton");

        const nextButton =
            document.getElementById("nextButton");

        const photoNumber =
            document.getElementById("photoNumber");

        const uploadInput =
            document.getElementById("vehicleUpload");

        const uploadButton =
            document.querySelector(".upload-button");

        if (!carousel || !vehiclePhoto) {
            return;
        }

        const vehicleId = vehicle ? String(vehicle.id) : "";

        // Used to prevent an older request from replacing the
        // gallery after the user switches to another vehicle.
        carousel.dataset.vehicleId = vehicleId;

        let photos = [];
        let currentPhotoIndex = 0;
        let uploading = false;

        let emptyState =
            carousel.querySelector(".vehicle-photo-empty");

        if (!emptyState) {

            emptyState = document.createElement("div");

            emptyState.className =
                "vehicle-photo-empty";

            carousel.appendChild(emptyState);
        }

        // --------------------------------------------------
        // RENDER PHOTO
        // --------------------------------------------------

        function renderPhoto() {

            if (!vehicleId) {

                vehiclePhoto.removeAttribute("src");
                vehiclePhoto.style.display = "none";

                emptyState.textContent =
                    "Register a vehicle to add photos.";

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

                if (uploadInput) {
                    uploadInput.disabled = true;
                }

                return;
            }

            if (uploadInput) {
                uploadInput.disabled = false;
            }

            if (photos.length === 0) {

                vehiclePhoto.removeAttribute("src");
                vehiclePhoto.style.display = "none";

                emptyState.textContent =
                    "No vehicle photos yet";

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
                `${vehicle.make || ""} ${vehicle.model || ""} photo ${currentPhotoIndex + 1}`;

            vehiclePhoto.onerror = function () {

                vehiclePhoto.style.display = "none";

                emptyState.textContent =
                    "This photo could not be loaded.";

                emptyState.style.display = "flex";
            };

            vehiclePhoto.src = photo.image_url;

            if (photoNumber) {

                photoNumber.textContent =
                    `${currentPhotoIndex + 1} / ${photos.length}`;
            }

            const multiplePhotos =
                photos.length > 1;

            if (previousButton) {
                previousButton.disabled = !multiplePhotos;
            }

            if (nextButton) {
                nextButton.disabled = !multiplePhotos;
            }
        }


        // --------------------------------------------------
        // LOAD PHOTOS
        // --------------------------------------------------

        async function loadPhotos() {

            if (!vehicleId) {
                renderPhoto();
                return;
            }

            try {

                const response = await fetch(
                    `/api/vehicle-photos/${encodeURIComponent(vehicleId)}`,
                    {
                        credentials: "include"
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Could not load vehicle photos."
                    );
                }

                // Ignore this response if another vehicle was
                // selected while the request was in progress.
                if (carousel.dataset.vehicleId !== vehicleId) {
                    return;
                }

                photos = Array.isArray(data.photos)
                    ? data.photos
                    : [];

                currentPhotoIndex = 0;

                renderPhoto();

            } catch (error) {

                if (carousel.dataset.vehicleId !== vehicleId) {
                    return;
                }

                console.error(
                    "Vehicle gallery error:",
                    error
                );

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

            previousButton.onclick = function () {

                if (photos.length <= 1) {
                    return;
                }

                currentPhotoIndex =
                    (currentPhotoIndex - 1 + photos.length) %
                    photos.length;

                renderPhoto();
            };
        }


        // --------------------------------------------------
        // NEXT PHOTO
        // --------------------------------------------------

        if (nextButton) {

            nextButton.onclick = function () {

                if (photos.length <= 1) {
                    return;
                }

                currentPhotoIndex =
                    (currentPhotoIndex + 1) % photos.length;

                renderPhoto();
            };
        }


        // --------------------------------------------------
        // UPLOAD PHOTOS
        // --------------------------------------------------

        if (uploadInput) {

            uploadInput.onchange = async function () {

                const selectedFiles =
                    Array.from(uploadInput.files || []);

                if (
                    selectedFiles.length === 0 ||
                    uploading ||
                    !vehicleId
                ) {
                    return;
                }

                if (selectedFiles.length > 10) {

                    alert(
                        "You can upload a maximum of 10 photos at once."
                    );

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

                    uploadButton.setAttribute(
                        "aria-busy",
                        "true"
                    );
                }

                try {

                    const response = await fetch(
                        `/api/vehicle-photos/${encodeURIComponent(vehicleId)}`,
                        {
                            method: "POST",
                            credentials: "include",
                            body: formData
                        }
                    );

                    const data = await response.json();

                    if (!response.ok || !data.success) {

                        throw new Error(
                            data.message ||
                            "Could not upload vehicle photos."
                        );
                    }

                    // Only reload this gallery if the same vehicle
                    // is still selected.
                    if (carousel.dataset.vehicleId === vehicleId) {
                        await loadPhotos();
                    }

                    alert(
                        "Vehicle photos uploaded successfully."
                    );

                } catch (error) {

                    console.error(
                        "Vehicle photo upload error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Could not upload vehicle photos."
                    );

                } finally {

                    uploading = false;

                    if (uploadButton) {

                        uploadButton.classList.remove("uploading");

                        uploadButton.removeAttribute("aria-busy");
                    }

                    uploadInput.value = "";
                }
            };
        }


        // Initial gallery load.
        renderPhoto();
        loadPhotos();
    };

})();
