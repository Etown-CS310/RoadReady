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
