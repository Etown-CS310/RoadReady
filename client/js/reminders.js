
/*
 * Filename: /client/js/reminders.js
 *
 * This file controls the RoadReady Reminders page.
 *
 * Responsibilities:
 * - Load the authenticated user's vehicles.
 * - Load scheduled maintenance from the Maintenance API.
 * - Display upcoming, overdue, and completed reminders.
 * - Allow users to create custom reminders.
 * - Allow users to mark reminders as completed or reopen them.
 * - Allow users to delete custom reminders.
 * - Remember custom and completed reminders using localStorage.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Contain SQL queries.
 * - Manage authentication directly.
 *
 * Database data is provided by /server/routes/maintenance.js.
 */

document.addEventListener("DOMContentLoaded", async function () {

    // ==========================================================
    // ELEMENTS
    // ==========================================================

    const vehicleSelect =
        document.getElementById("reminderVehicle");

    const reminderList =
        document.getElementById("reminderList");

    const reminderForm =
        document.getElementById("reminderForm");

    const addReminderPanel =
        document.getElementById("addReminderPanel");

    const filterButtons =
        document.querySelectorAll(".reminder-filter");

    const showAddReminder =
        document.getElementById("showAddReminder");

    const closeAddReminder =
        document.getElementById("closeAddReminder");

    const cancelAddReminder =
        document.getElementById("cancelAddReminder");

    const overdueCount =
        document.getElementById("overdueCount");

    const soonCount =
        document.getElementById("soonCount");

    const upcomingCount =
        document.getElementById("upcomingCount");

    const customStorageKey =
        "roadReadyCustomReminders";

    const completedStorageKey =
        "roadReadyCompletedReminders";

    const selectedVehicleStorageKey =
        "roadReadySelectedReminderVehicle";

    let vehicles = [];
    let maintenance = [];
    let activeFilter = "all";

    // ==========================================================
    // LOCAL STORAGE
    // ==========================================================

    function readStorage(key, fallback) {

        try {

            const stored =
                localStorage.getItem(key);

            return stored
                ? JSON.parse(stored)
                : fallback;

        } catch (error) {

            console.error(
                `Could not read ${key}:`,
                error
            );

            return fallback;
        }
    }

    function saveStorage(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

        } catch (error) {

            console.error(
                `Could not save ${key}:`,
                error
            );
        }
    }

    function getCustomReminders() {

        const reminders =
            readStorage(customStorageKey, []);

        return Array.isArray(reminders)
            ? reminders
            : [];
    }

    function getCompletedReminders() {

        const completed =
            readStorage(completedStorageKey, []);

        return Array.isArray(completed)
            ? completed.map(String)
            : [];
    }

    // ==========================================================
    // LOAD DATABASE DATA
    // ==========================================================

    async function loadReminderData() {

        const response = await fetch(
            "/api/maintenance",
            {
                credentials: "include"
            }
        );

        if (!response.ok) {

            if (response.status === 401) {
                throw new Error(
                    "Please log in to view your reminders."
                );
            }

            throw new Error(
                "Could not load maintenance data."
            );
        }

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Could not load maintenance data."
            );
        }

        vehicles =
            data.vehicles || [];

        maintenance =
            data.maintenance || [];
    }

    // ==========================================================
    // VEHICLE SELECTOR
    // ==========================================================

    function getVehicleName(vehicle) {

        if (!vehicle) {
            return "Unknown vehicle";
        }

        const fullName =
            `${vehicle.model_year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`
                .trim();

        return vehicle.nickname
            ? `${vehicle.nickname} — ${fullName}`
            : fullName || "Vehicle";
    }

    function populateVehicleSelector() {

        if (!vehicleSelect) {
            return;
        }

        vehicleSelect.replaceChildren();

        if (vehicles.length === 0) {

            const option =
                document.createElement("option");

            option.value = "";
            option.textContent = "No vehicles found";
            option.disabled = true;
            option.selected = true;

            vehicleSelect.appendChild(option);

            return;
        }

        const savedVehicleId =
            localStorage.getItem(
                selectedVehicleStorageKey
            );

        let selectedVehicle =
            vehicles.find(function (vehicle) {
                return String(vehicle.id) ===
                    String(savedVehicleId);
            });

        if (!selectedVehicle) {

            const maintenancePageVehicleId =
                localStorage.getItem(
                    "selectedVehicleId"
                );

            selectedVehicle =
                vehicles.find(function (vehicle) {
                    return String(vehicle.id) ===
                        String(maintenancePageVehicleId);
                });
        }

        if (!selectedVehicle) {
            selectedVehicle = vehicles[0];
        }

        vehicles.forEach(function (vehicle) {

            const option =
                document.createElement("option");

            option.value = vehicle.id;
            option.textContent =
                getVehicleName(vehicle);

            option.selected =
                Number(vehicle.id) ===
                Number(selectedVehicle.id);

            vehicleSelect.appendChild(option);
        });

        localStorage.setItem(
            selectedVehicleStorageKey,
            String(selectedVehicle.id)
        );
    }

    function getSelectedVehicleId() {

        return vehicleSelect
            ? Number(vehicleSelect.value)
            : 0;
    }

    // ==========================================================
    // REMINDER DATA
    // ==========================================================

    function getAllReminders() {

        const completed =
            getCompletedReminders();

        const scheduledReminders =
            maintenance.map(function (item) {

                return {
                    id: `maintenance-${item.id}`,
                    sourceId: item.id,
                    source: "scheduled",
                    vehicleId: Number(item.vehicle_id),
                    name: item.maintenance_name ||
                        "Scheduled maintenance",
                    detail: "",
                    dueDate: item.due_date || "",
                    dueMileage: item.due_mileage,
                    notes: item.notes || "",
                    status: item.status || "good",
                    completed: completed.includes(
                        `maintenance-${item.id}`
                    )
                };
            });

        const customReminders =
            getCustomReminders().map(function (item) {

                return {
                    ...item,
                    source: "custom",
                    vehicleId: Number(item.vehicleId),
                    completed: completed.includes(
                        String(item.id)
                    )
                };
            });

        return [
            ...scheduledReminders,
            ...customReminders
        ];
    }

    function getVehicle(vehicleId) {

        return vehicles.find(function (vehicle) {
            return Number(vehicle.id) ===
                Number(vehicleId);
        });
    }

    // ==========================================================
    // REMINDER STATUS
    // ==========================================================

    function getStatus(reminder) {

        if (reminder.completed) {
            return "completed";
        }

        const vehicle =
            getVehicle(reminder.vehicleId);

        const currentMileage =
            vehicle
                ? Number(vehicle.current_mileage || 0)
                : 0;

        const dueMileage =
            reminder.dueMileage !== null &&
            reminder.dueMileage !== undefined &&
            reminder.dueMileage !== ""
                ? Number(reminder.dueMileage)
                : null;

        const mileageOverdue =
            dueMileage !== null &&
            currentMileage >= dueMileage;

        let daysUntilDue = null;

        if (reminder.dueDate) {

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dueDate =
                new Date(`${reminder.dueDate}T00:00:00`);

            if (!Number.isNaN(dueDate.getTime())) {

                daysUntilDue = Math.ceil(
                    (dueDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
            }
        }

        const dateOverdue =
            daysUntilDue !== null &&
            daysUntilDue < 0;

        if (mileageOverdue || dateOverdue) {
            return "overdue";
        }

        const dateSoon =
            daysUntilDue !== null &&
            daysUntilDue <= 30;

        const mileageSoon =
            dueMileage !== null &&
            currentMileage > 0 &&
            dueMileage - currentMileage <= 500;

        if (dateSoon || mileageSoon) {
            return "soon";
        }

        return "upcoming";
    }

    // ==========================================================
    // FORMATTING
    // ==========================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "No due date";
        }

        const date =
            new Date(`${dateValue}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleDateString();
    }

    function getDueDescription(reminder) {

        const descriptions = [];

        if (reminder.dueDate) {
            descriptions.push(
                `Due ${formatDate(reminder.dueDate)}`
            );
        }

        if (
            reminder.dueMileage !== null &&
            reminder.dueMileage !== undefined &&
            reminder.dueMileage !== ""
        ) {
            descriptions.push(
                `At ${Number(reminder.dueMileage).toLocaleString()} miles`
            );
        }

        return descriptions.length > 0
            ? descriptions.join(" • ")
            : "No due date or mileage set";
    }

    // ==========================================================
    // REMINDER CARD
    // ==========================================================

    function createReminderCard(reminder) {

        const status =
            getStatus(reminder);

        const vehicle =
            getVehicle(reminder.vehicleId);

        const card =
            document.createElement("article");

        card.className =
            `reminder-card ${status}`;

        const content =
            document.createElement("div");

        content.className =
            "reminder-card-content";

        const title =
            document.createElement("h3");

        title.textContent =
            reminder.name || "Reminder";

        const vehicleText =
            document.createElement("p");

        vehicleText.className =
            "reminder-vehicle";

        vehicleText.textContent =
            getVehicleName(vehicle);

        const dueText =
            document.createElement("p");

        dueText.className =
            "reminder-due";

        dueText.textContent =
            getDueDescription(reminder);

        const notes =
            document.createElement("p");

        notes.className =
            "reminder-notes";

        notes.textContent =
            reminder.notes || "";

        const statusText =
            document.createElement("span");

        statusText.className =
            `reminder-status ${status}`;

        const statusLabels = {
            overdue: "Overdue",
            soon: "Due Soon",
            upcoming: "Upcoming",
            completed: "Completed"
        };

        statusText.textContent =
            statusLabels[status];

        content.appendChild(title);
        content.appendChild(vehicleText);
        content.appendChild(dueText);

        if (reminder.notes) {
            content.appendChild(notes);
        }

        content.appendChild(statusText);

        const actions =
            document.createElement("div");

        actions.className =
            "reminder-actions";

        const completeButton =
            document.createElement("button");

        completeButton.type = "button";

        completeButton.className =
            "btn btn-sm btn-outline-primary";

        completeButton.textContent =
            reminder.completed
                ? "Reopen"
                : "Mark Complete";

        completeButton.addEventListener(
            "click",
            function () {
                toggleCompleted(reminder);
            }
        );

        actions.appendChild(completeButton);

        if (reminder.source === "custom") {

            const deleteButton =
                document.createElement("button");

            deleteButton.type = "button";

            deleteButton.className =
                "btn btn-sm btn-outline-danger";

            deleteButton.textContent =
                "Delete";

            deleteButton.addEventListener(
                "click",
                function () {
                    deleteCustomReminder(reminder.id);
                }
            );

            actions.appendChild(deleteButton);
        }

        card.appendChild(content);
        card.appendChild(actions);

        return card;
    }

    // ==========================================================
    // COMPLETE / REOPEN REMINDERS
    // ==========================================================

    function toggleCompleted(reminder) {

        let completed =
            getCompletedReminders();

        const reminderId =
            String(reminder.id);

        if (completed.includes(reminderId)) {

            completed =
                completed.filter(function (id) {
                    return id !== reminderId;
                });

        } else {

            completed.push(reminderId);
        }

        saveStorage(
            completedStorageKey,
            completed
        );

        renderReminders();
    }

    // ==========================================================
    // DELETE CUSTOM REMINDER
    // ==========================================================

    function deleteCustomReminder(reminderId) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this reminder?"
            );

        if (!confirmed) {
            return;
        }

        const reminders =
            getCustomReminders().filter(
                function (reminder) {
                    return String(reminder.id) !==
                        String(reminderId);
                }
            );

        saveStorage(
            customStorageKey,
            reminders
        );

        const completed =
            getCompletedReminders().filter(
                function (id) {
                    return id !== String(reminderId);
                }
            );

        saveStorage(
            completedStorageKey,
            completed
        );

        renderReminders();
    }

    // ==========================================================
    // COUNTERS
    // ==========================================================

    function updateCounters(reminders) {

        const activeReminders =
            reminders.filter(function (reminder) {
                return !reminder.completed;
            });

        const counts = {
            overdue: 0,
            soon: 0,
            upcoming: 0
        };

        activeReminders.forEach(function (reminder) {

            const status =
                getStatus(reminder);

            if (counts[status] !== undefined) {
                counts[status]++;
            }
        });

        if (overdueCount) {
            overdueCount.textContent =
                counts.overdue;
        }

        if (soonCount) {
            soonCount.textContent =
                counts.soon;
        }

        if (upcomingCount) {
            upcomingCount.textContent =
                counts.upcoming;
        }
    }

    // ==========================================================
    // RENDER REMINDERS
    // ==========================================================

    function renderReminders() {

        if (!reminderList) {
            return;
        }

        reminderList.replaceChildren();

        const selectedVehicleId =
            getSelectedVehicleId();

        let reminders =
            getAllReminders().filter(
                function (reminder) {
                    return Number(reminder.vehicleId) ===
                        selectedVehicleId;
                }
            );

        updateCounters(reminders);

        if (activeFilter === "completed") {

            reminders =
                reminders.filter(function (reminder) {
                    return reminder.completed;
                });

        } else if (activeFilter !== "all") {

            reminders =
                reminders.filter(function (reminder) {
                    return getStatus(reminder) ===
                        activeFilter;
                });

        }

        reminders.sort(function (a, b) {

            const order = {
                overdue: 0,
                soon: 1,
                upcoming: 2,
                completed: 3
            };

            return order[getStatus(a)] -
                order[getStatus(b)];
        });

        if (reminders.length === 0) {

            const empty =
                document.createElement("div");

            empty.className =
                "empty-state-small";

            empty.textContent =
                "No reminders found.";

            reminderList.appendChild(empty);

            return;
        }

        reminders.forEach(function (reminder) {

            reminderList.appendChild(
                createReminderCard(reminder)
            );
        });
    }

    // ==========================================================
    // FILTER BUTTONS
    // ==========================================================

    filterButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(function (item) {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                activeFilter =
                    button.dataset.filter || "all";

                renderReminders();
            }
        );
    });

    // ==========================================================
    // ADD REMINDER PANEL
    // ==========================================================

    function openReminderPanel() {

        if (addReminderPanel) {
            addReminderPanel.style.display = "block";
        }
    }

    function closeReminderPanel() {

        if (addReminderPanel) {
            addReminderPanel.style.display = "none";
        }

        if (reminderForm) {
            reminderForm.reset();
        }
    }

    if (showAddReminder) {
        showAddReminder.addEventListener(
            "click",
            openReminderPanel
        );
    }

    if (closeAddReminder) {
        closeAddReminder.addEventListener(
            "click",
            closeReminderPanel
        );
    }

    if (cancelAddReminder) {
        cancelAddReminder.addEventListener(
            "click",
            closeReminderPanel
        );
    }

    // ==========================================================
    // SAVE CUSTOM REMINDER
    // ==========================================================

    if (reminderForm) {

        reminderForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const vehicleId =
                    getSelectedVehicleId();

                const name =
                    document.getElementById(
                        "reminderName"
                    ).value.trim();

                const dueDate =
                    document.getElementById(
                        "reminderDueDate"
                    ).value;

                const dueMileage =
                    document.getElementById(
                        "reminderDueMileage"
                    ).value;

                const notes =
                    document.getElementById(
                        "reminderNotes"
                    ).value.trim();

                if (!vehicleId) {
                    alert("Please select a vehicle.");
                    return;
                }

                if (!name) {
                    alert("Please enter a reminder name.");
                    return;
                }

                const reminders =
                    getCustomReminders();

                reminders.push({
                    id: `custom-${Date.now()}`,
                    vehicleId: vehicleId,
                    name: name,
                    dueDate: dueDate || "",
                    dueMileage: dueMileage
                        ? Number(dueMileage)
                        : null,
                    notes: notes,
                    createdAt: new Date().toISOString()
                });

                saveStorage(
                    customStorageKey,
                    reminders
                );

                closeReminderPanel();
                renderReminders();
            }
        );
    }

    // ==========================================================
    // VEHICLE CHANGE
    // ==========================================================

    if (vehicleSelect) {

        vehicleSelect.addEventListener(
            "change",
            function () {

                localStorage.setItem(
                    selectedVehicleStorageKey,
                    String(this.value)
                );

                renderReminders();
            }
        );
    }

    // ==========================================================
    // INITIALIZE PAGE
    // ==========================================================

    try {

        await loadReminderData();

        populateVehicleSelector();

        if (vehicles.length === 0) {

            reminderList.innerHTML = `
                <div class="empty-state-small">
                    Add a vehicle before creating reminders.
                </div>
            `;

            if (showAddReminder) {
                showAddReminder.disabled = true;
            }

            updateCounters([]);

            return;
        }

        renderReminders();

    } catch (error) {

        console.error(
            "Reminders loading error:",
            error
        );

        if (reminderList) {

            reminderList.innerHTML = `
                <div class="empty-state-small">
                    ${error.message}
                </div>
            `;
        }
    }
});
