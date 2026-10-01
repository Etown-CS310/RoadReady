document.addEventListener("DOMContentLoaded", function () {

    const vehicles = roadReadyData.vehicles;

    const selectedVehicleId =
        Number(localStorage.getItem("selectedVehicleId")) ||
        vehicles[0].id;

    let vehicle = vehicles.find(
        v => v.id === selectedVehicleId
    );

    if (!vehicle) {
        vehicle = vehicles[0];
    }

    // Render topbar
    document.getElementById("vehicle-topbar").innerHTML =
        renderTopbar(
            "My Vehicle",
            "Vehicles you own or have been given access to.",
            roadReadyData.user.name
        );

    // Render vehicle list
    const vehicleList =
        document.getElementById("vehicle-list");

    vehicleList.innerHTML = vehicles.map(v => `
        <a
            href="vehicle.html"
            class="vehicle-list-card ${v.id === vehicle.id ? "selected" : ""}"
            data-vehicle-id="${v.id}"
        >
            <strong>
                ${v.year} ${v.make} ${v.model}
            </strong>

            <span>
                ${v.nickname || v.trim || "Vehicle"}
            </span>

            <small>
                ${v.mileage.toLocaleString()} miles
            </small>

        </a>
    `).join("");

    // Render selected vehicle information
    document.getElementById("vehicle-title").textContent = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    document.getElementById("vehicle-nickname").textContent = vehicle.nickname || "";
    document.getElementById("vehicle-mileage").textContent = `${vehicle.mileage.toLocaleString()} mi`;
    document.getElementById("vehicle-vin").textContent = vehicle.vin;
    document.getElementById("vehicle-trim").textContent = vehicle.trim;
    document.getElementById("vehicle-engine").textContent = vehicle.engine;
    document.getElementById("vehicle-transmission").textContent = vehicle.transmission;
    document.getElementById("vehicle-body-type").textContent = vehicle.bodyType;

    // Render vehicle value
    const valueContainer =
        document.getElementById("vehicle-value");

    if (valueContainer) {
        valueContainer.innerHTML =
            renderValueCard();
    }

    // Import button
    const importButton =
        document.getElementById("import");

    importButton.addEventListener(
        "click",
        importCSV
    );

    // Vehicle selection
    document.querySelectorAll("[data-vehicle-id]")
        .forEach(card => {

            card.addEventListener("click", function () {

                const id =
                    Number(this.dataset.vehicleId);

                localStorage.setItem(
                    "selectedVehicleId",
                    id
                );

            });

        });

    // Import CSV
    function importCSV() {
        const fileInput =
            document.getElementById("csv-input");

        fileInput.value = "";

        fileInput.click();

        fileInput.addEventListener(
            "change",
            readFile,
            { once: true }
        );
    }

    // Read CSV
    function readFile() {
        const fileInput =
            document.getElementById("csv-input");
        const file = fileInput.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            const textContent = reader.result;
            const rows =
                textContent.split(/\r?\n/);
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) {
                    continue;
                }
                const row =
                    rows[i].split(",");
                if (row.length >= 5) {
                    const vehicleInfo = {
                        make: row[0].trim(),
                        model: row[1].trim(),
                        year: row[2].trim(),
                        relationship: parseInt(row[3].trim()),
                        vin: row[4].trim()
                    };
                    roadReadyData.vehicles.push(
                        vehicleInfo
                    );
                    console.log(roadReadyData);
                }
            }

            location.reload();
        };
        reader.readAsText(file);
    }

    // Vehicle value
    function loadVehicleValue(vehicle) {

        // Eventually call vehicle valuation API

    }
});