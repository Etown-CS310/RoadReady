document.addEventListener("DOMContentLoaded", function () {

    const content = document.getElementById("vehicle-content");

    const vehicles = roadReadyData.vehicles;

    const selectedVehicleId =
        Number(localStorage.getItem("selectedVehicleId")) || vehicles[0].id;

    let vehicle = vehicles.find(
        v => v.id === selectedVehicleId
    );

    if (!vehicle) {
        vehicle = vehicles[0];
    }

    content.innerHTML = `

        ${renderTopbar(
            "My Vehicle",
            "Vehicles you own or have been given access to.",
            roadReadyData.user.name
        )}
        
        <div id="import_csv">
            <button id = "import">Import Vehicle CSV Data </button>
            <input type="file" id="csv-input" style="display: none;" />
        </div>

        <div class="vehicle-list">

            ${vehicles.map(v => `

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

            `).join("")}

        </div>

        <section class="vehicle-detail-card">

            <div class="vehicle-detail-header">

                <div>

                    <h2>
                        ${vehicle.year}
                        ${vehicle.make}
                        ${vehicle.model}
                    </h2>

                    <p class="vehicle-nickname">
                        ${vehicle.nickname}
                    </p>

                </div>

                <span class="mileage">
                    ${vehicle.mileage.toLocaleString()} mi
                </span>

            </div>

            <div class="detail-grid">

                <div>
                    <span>VIN</span>
                    <strong>${vehicle.vin}</strong>
                </div>

                <div>
                    <span>Trim</span>
                    <strong>${vehicle.trim}</strong>
                </div>

                <div>
                    <span>Engine</span>
                    <strong>${vehicle.engine}</strong>
                </div>

                <div>
                    <span>Transmission</span>
                    <strong>${vehicle.transmission}</strong>
                </div>

                <div>
                    <span>Body Type</span>
                    <strong>${vehicle.bodyType}</strong>
                </div>

            </div>

        </section>

    `;

    //Making event listener and function for my import button
    window.addEventListener("load", importinit);
    function importinit(){
        let import_button = document.getElementById("import");
        import_button.addEventListener("click", importCSV);
    }
    function importCSV(){
        let fileInput = document.getElementById('csv-input');
        fileInput.value = "";
        fileInput.click();
        fileInput.addEventListener('change', readFile(), { once: true });
    }
    function readFile() {
        const fileInput = document.getElementById('csv-input');
        const file = fileInput.files[0]; 
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = processingCSV();
            
            function processingCSV() {
                const textContent = reader.result; 
                const data = parseCSVData(textContent);
                
                for (let i = 1; i < data.length; i++) {
                const row = data[i];
                
                // Ensure the row isn't empty and has data fields
                if (row.length >= 5) {
                    // Need to change RoadReadyData to add in new vehicle from CSV
                }
            }
            }
            
            reader.readAsText(file);
        }
    }
    // Need to make ParseCSVData Function
    document.querySelectorAll("[data-vehicle-id]")
        .forEach(card => {

            card.addEventListener("click", function () {

                const id = Number(this.dataset.vehicleId);

                localStorage.setItem(
                    "selectedVehicleId",
                    id
                );

            });

        });

});
