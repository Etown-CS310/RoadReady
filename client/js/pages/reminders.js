
/*
 * Filename: /client/js/pages/reminders.js
 *
 * This file controls the RoadReady Reminders page.
 *
 * Responsibilities:
 * - Load the authenticated user's vehicles.
 * - Load scheduled maintenance and custom reminders from the database.
 * - Display upcoming, overdue, and completed reminders.
 * - Allow users to create custom reminders.
 * - Allow users to mark reminders as completed or reopen them.
 * - Allow users to delete custom reminders.
 * - Migrate existing localStorage reminders into the database.
 * - Remember the selected vehicle using localStorage.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Contain SQL queries.
 * - Manage authentication directly.
 *
 * Database data is provided by:
 * - /server/routes/maintenance.js
 * - /server/routes/reminders.js
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


    // ==========================================================
    // STORAGE KEYS
    // ==========================================================

    // These two keys are retained temporarily for migration.
    const customStorageKey =
        "roadReadyCustomReminders";

    const completedStorageKey =
        "roadReadyCompletedReminders";

    // Migration progress prevents already-imported custom
    // reminders from being inserted again if migration fails.
    const migrationStorageKey =
        "roadReadyReminderMigration";

    // This is still a UI preference, not application data.
    const selectedVehicleStorageKey =
        "roadReadySelectedReminderVehicle";


    // ==========================================================
    // PAGE DATA
    // ==========================================================

    let vehicles = [];
    let maintenance = [];
    let customReminders = [];

    let activeFilter = "all";


    // ==========================================================
    // API HELPERS
    // ==========================================================

    async function apiRequest(url, options = {}) {

        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                ...(options.headers || {})
            }
        });

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            // A non-JSON response is handled below.
        }

        if (!response.ok || data.success === false) {

            if (response.status === 401) {
                throw new Error(
                    "Please log in to view your reminders."
                );
            }

            throw new Error(
                data.message ||
                "The request could not be completed."
            );
        }

        return data;
    }


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

            return true;

        } catch (error) {

            console.error(
                `Could not save ${key}:`,
                error
            );

            return false;
        }
    }


    function getLegacyCustomReminders() {

        const reminders =
            readStorage(customStorageKey, []);

        return Array.isArray(reminders)
            ? reminders
            : [];
    }


    function getLegacyCompletedReminders() {

        const completed =
            readStorage(completedStorageKey, []);

        return Array.isArray(completed)
            ? completed.map(String)
            : [];
    }


    function getMigrationProgress() {

        const progress =
            readStorage(migrationStorageKey, {});

        return (
            progress &&
            typeof progress === "object" &&
            !Array.isArray(progress)
        )
            ? progress
            : {};
    }


    // ==========================================================
    // LOAD DATABASE DATA
    // ==========================================================

    async function loadReminderData() {

        // Vehicles and current mileage come from the
        // existing Maintenance API.

        const maintenanceData = await apiRequest(
            "/api/maintenance"
        );

        // Scheduled and custom reminders come from
        // the new Reminders API.

        const reminderData = await apiRequest(
            "/api/reminders"
        );

        vehicles =
            maintenanceData.vehicles || [];

        maintenance =
            reminderData.scheduledReminders || [];

        customReminders =
            reminderData.customReminders || [];
    }


    // ==========================================================
    // MIGRATE OLD LOCAL STORAGE DATA
    // ==========================================================

    async function migrateLegacyReminders() {

        const oldCustomReminders =
            getLegacyCustomReminders();

        const oldCompletedReminders =
            getLegacyCompletedReminders();

        const progress =
            getMigrationProgress();


        // ------------------------------------------------------
        // MIGRATE CUSTOM REMINDERS
        // ------------------------------------------------------

        for (const oldReminder of oldCustomReminders) {

            if (
                !oldReminder ||
                !oldReminder.id ||
                !oldReminder.vehicleId ||
                !oldReminder.name
            ) {
                console.warn(
                    "Skipping invalid legacy reminder:",
                    oldReminder
                );

                continue;
            }

            const oldId =
                String(oldReminder.id);

            let databaseId =
                progress[oldId];


            // Create the database record if it has not
            // already been migrated.

            if (!databaseId) {

                const created = await apiRequest(
                    "/api/reminders",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            vehicleId: Number(oldReminder.vehicleId),
                            name: oldReminder.name,
                            dueDate: oldReminder.dueDate || null,
                            dueMileage:
                                oldReminder.dueMileage === "" ||
                                oldReminder.dueMileage === undefined
                                    ? null
                                    : oldReminder.dueMileage,
                            notes: oldReminder.notes || null
                        })
                    }
                );

                databaseId =
                    created.reminder.id;

                // Save progress immediately so a later
                // failure does not normally create duplicates.

                progress[oldId] =
                    databaseId;

                if (!saveStorage(migrationStorageKey, progress)) {
                    throw new Error(
                        "Could not save reminder migration progress."
                    );
                }
            }


            // Restore completion state if the old reminder
            // had been marked complete.

            if (
                oldCompletedReminders.includes(oldId)
            ) {

                await apiRequest(
                    `/api/reminders/${databaseId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            completed: true
                        })
                    }
                );
            }
        }


        // ------------------------------------------------------
        // MIGRATE SCHEDULED MAINTENANCE COMPLETION FLAGS
        // ------------------------------------------------------

        for (const completedId of oldCompletedReminders) {

            const match =
                completedId.match(/^maintenance-(\d+)$/);

            if (!match) {
                continue;
            }

            const scheduleId =
                Number(match[1]);

            const scheduledItem =
                maintenance.find(function (item) {
                    return Number(item.id) === scheduleId;
                });

            if (!scheduledItem) {
                continue;
            }

            // Do not create another history entry if the
            // scheduled item is already completed.

            if (scheduledItem.status === "completed") {
                continue;
            }

            await apiRequest(
                `/api/maintenance/${scheduleId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "completed"
                    })
                }
            );
        }


        // ------------------------------------------------------
        // FINISH MIGRATION
        // ------------------------------------------------------

        // Only clear the old storage after every migration
        // operation has completed successfully.

        localStorage.removeItem(customStorageKey);
        localStorage.removeItem(completedStorageKey);
        localStorage.removeItem(migrationStorageKey);
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

        const scheduledReminders =
            maintenance.map(function (item) {

                return {
                    id: `maintenance-${item.id}`,
                    sourceId: Number(item.id),
                    source: "scheduled",

                    vehicleId: Number(item.vehicle_id),

                    name: item.maintenance_name ||
                        "Scheduled maintenance",

                    detail: "",

                    dueDate: item.due_date || "",

                    dueMileage: item.due_mileage,

                    notes: item.notes || "",

                    status: item.status || "good",

                    completed:
                        item.status === "completed"
                };
            });


        const databaseCustomReminders =
            customReminders.map(function (item) {

                return {
                    id: Number(item.id),

                    sourceId: Number(item.id),

                    source: "custom",

                    vehicleId: Number(item.vehicle_id),

                    name: item.name || "Reminder",

                    dueDate: item.due_date || "",

                    dueMileage: item.due_mileage,

                    notes: item.notes || "",

                    completed: Boolean(item.completed_at)
                };
            });


        return [
            ...scheduledReminders,
            ...databaseCustomReminders
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
    // REFRESH DATABASE DATA
    // ==========================================================

    async function refreshReminderData() {

        const reminderData = await apiRequest(
            "/api/reminders"
        );

        maintenance =
            reminderData.scheduledReminders || [];

        customReminders =
            reminderData.customReminders || [];
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


        // ------------------------------------------------------
        // ACTION BUTTONS
        // ------------------------------------------------------

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


        // Only custom reminders can be deleted here.

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

    async function toggleCompleted(reminder) {

        try {

            if (reminder.source === "scheduled") {

                // Scheduled maintenance uses its existing API.

                await apiRequest(
                    `/api/maintenance/${reminder.sourceId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            status: reminder.completed
                                ? "good"
                                : "completed"
                        })
                    }
                );

            } else {

                // Custom reminders use the new Reminders API.

                await apiRequest(
                    `/api/reminders/${reminder.sourceId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            completed: !reminder.completed
                        })
                    }
                );
            }

            await refreshReminderData();

            renderReminders();

        } catch (error) {

            console.error(
                "Could not update reminder:",
                error
            );

            alert(error.message);
        }
    }


    // ==========================================================
    // DELETE CUSTOM REMINDER
    // ==========================================================

    async function deleteCustomReminder(reminderId) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this reminder?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await apiRequest(
                `/api/reminders/${reminderId}`,
                {
                    method: "DELETE"
                }
            );

            await refreshReminderData();

            renderReminders();

        } catch (error) {

            console.error(
                "Could not delete reminder:",
                error
            );

            alert(error.message);
        }
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
            async function (event) {

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


                try {

                    await apiRequest(
                        "/api/reminders",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                vehicleId: vehicleId,
                                name: name,
                                dueDate: dueDate || null,
                                dueMileage: dueMileage === ""
                                    ? null
                                    : Number(dueMileage),
                                notes: notes || null
                            })
                        }
                    );

                    closeReminderPanel();

                    await refreshReminderData();

                    renderReminders();

                } catch (error) {

                    console.error(
                        "Could not create reminder:",
                        error
                    );

                    alert(error.message);
                }
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

        // Import old localStorage records before displaying
        // the reminders page.

        await migrateLegacyReminders();

        // Reload so the page uses the newly migrated records.

        await loadReminderData();

        populateVehicleSelector();

        if (vehicles.length === 0) {

            if (reminderList) {

                reminderList.textContent =
                    "Add a vehicle before creating reminders.";
            }

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

            reminderList.replaceChildren();

            const errorMessage =
                document.createElement("div");

            errorMessage.className =
                "empty-state-small";

            errorMessage.textContent =
                error.message;

            reminderList.appendChild(errorMessage);
        }
    }
});
