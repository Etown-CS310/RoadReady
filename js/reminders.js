/*
 * RoadReady Reminders
 * Displays scheduled maintenance and lets users save custom reminders locally.
 */

document.addEventListener("DOMContentLoaded", function () {
    const vehicleSelect = document.getElementById("reminderVehicle");
    const reminderList = document.getElementById("reminderList");
    const reminderForm = document.getElementById("reminderForm");
    const addReminderPanel = document.getElementById("addReminderPanel");
    const filterButtons = document.querySelectorAll(".reminder-filter");

    const customStorageKey = "roadReadyCustomReminders";
    const completedStorageKey = "roadReadyCompletedReminders";

    let activeFilter = "all";

    // Read saved information from the browser.
    function readStorage(key, fallback) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    // Save information in the browser.
    function saveStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getCustomReminders() {
        return readStorage(customStorageKey, []);
    }

    function getCompletedReminders() {
        return readStorage(completedStorageKey, []);
    }

    // Load vehicles from the existing RoadReady data.
    roadReadyData.vehicles.forEach(function (vehicle) {
        const option = document.createElement("option");

        option.value = vehicle.id;
        option.textContent =
            vehicle.year + " " + vehicle.make + " " + vehicle.model;

        vehicleSelect.appendChild(option);
    });

    // Restore the previously selected vehicle.
    const savedVehicle = localStorage.getItem(
        "roadReadySelectedReminderVehicle"
    );

    if (
        savedVehicle &&
        roadReadyData.vehicles.some(function (vehicle) {
            return String(vehicle.id) === savedVehicle;
        })
    ) {
        vehicleSelect.value = savedVehicle;
    }

    // Get maintenance and custom reminders for the selected vehicle.
    function getVehicleReminders() {
        const vehicleId = Number(vehicleSelect.value);
        const completed = getCompletedReminders();

        const scheduled = roadReadyData.maintenance
            .filter(function (item) {
                return Number(item.vehicleId) === vehicleId;
            })
            .map(function (item) {
                return {
                    id: "maintenance-" + item.id,
                    vehicleId: vehicleId,
                    name: item.name || item.type || "Maintenance",
                    detail: item.detail || "",
                    dueDate: item.dueDate || "",
                    dueMileage: item.dueMileage,
                    notes: item.notes || "",
                    status: item.status || "good",
                    builtIn: true
                };
            });

        const custom = getCustomReminders()
            .filter(function (item) {
                return Number(item.vehicleId) === vehicleId;
            })
            .map(function (item) {
                const reminder = Object.assign({}, item);

                reminder.status = getStatus(reminder);
                reminder.builtIn = false;

                return reminder;
            });

        return scheduled.concat(custom).map(function (item) {
            item.isCompleted = completed.includes(item.id);

            if (item.isCompleted) {
                item.status = "completed";
            }

            return item;
        });
    }

    // Determine whether a reminder is overdue, due soon, or upcoming.
    function getStatus(item) {
        const vehicle = roadReadyData.vehicles.find(function (entry) {
            return Number(entry.id) === Number(item.vehicleId);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (item.dueDate) {
            const dueDate = new Date(item.dueDate + "T00:00:00");

            if (!isNaN(dueDate.getTime()) && dueDate < today) {
                return "overdue";
            }

            if (!isNaN(dueDate.getTime())) {
                const daysLeft = Math.ceil(
                    (dueDate - today) / 86400000
                );

                if (daysLeft <= 30) {
                    return "soon";
                }
            }
        }

        if (
            item.dueMileage !== "" &&
            item.dueMileage !== null &&
            item.dueMileage !== undefined &&
            vehicle
        ) {
            const milesLeft =
                Number(item.dueMileage) - Number(vehicle.mileage);

            if (milesLeft < 0) {
                return "overdue";
            }

            if (milesLeft <= 500) {
                return "soon";
            }

            return "good";
        }

        return item.status || "good";
    }

    function statusLabel(status) {
        const labels = {
            overdue: "OVERDUE",
            soon: "DUE SOON",
            good: "UPCOMING",
            completed: "COMPLETED"
        };

        return labels[status] || "UPCOMING";
    }

    // Build the reminder's date, mileage, and notes text.
    function reminderDetail(item) {
        const parts = [];

        if (
            item.dueMileage !== "" &&
            item.dueMileage !== null &&
            item.dueMileage !== undefined
        ) {
            parts.push(
                "Due at " +
                Number(item.dueMileage).toLocaleString() +
                " miles"
            );
        }

        if (item.dueDate) {
            const date = new Date(item.dueDate + "T00:00:00");

            parts.push("Due " + date.toLocaleDateString());
        }

        if (item.detail) {
            parts.push(item.detail);
        }

        if (item.notes) {
            parts.push(item.notes);
        }

        return parts.join(" · ") || "No due date or mileage added";
    }

    // Create a button and connect its action.
    function makeButton(label, className, action, reminderId) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = className;
        button.textContent = label;

        button.addEventListener("click", function () {
            action(reminderId);
        });

        return button;
    }

    // Display the reminders and update the summary cards.
    function renderReminders() {
        const reminders = getVehicleReminders();

        const active = reminders.filter(function (item) {
            return !item.isCompleted;
        });

        document.getElementById("overdueCount").textContent =
            active.filter(function (item) {
                return item.status === "overdue";
            }).length;

        document.getElementById("soonCount").textContent =
            active.filter(function (item) {
                return item.status === "soon";
            }).length;

        document.getElementById("upcomingCount").textContent =
            active.filter(function (item) {
                return item.status === "good";
            }).length;

        const filtered = reminders.filter(function (item) {
            return activeFilter === "all" ||
                item.status === activeFilter;
        });

        reminderList.replaceChildren();

        if (filtered.length === 0) {
            const empty = document.createElement("div");

            empty.className = "empty-state-small";

            empty.textContent = activeFilter === "completed"
                ? "No completed reminders for this vehicle yet."
                : "No reminders in this category. Add a reminder to get started.";

            reminderList.appendChild(empty);

            return;
        }

        // Show the most urgent reminders first.
        filtered.sort(function (a, b) {
            const order = {
                overdue: 0,
                soon: 1,
                good: 2,
                completed: 3
            };

            return order[a.status] - order[b.status];
        });

        filtered.forEach(function (item) {
            const card = document.createElement("article");
            card.className = "reminder-item";

            const info = document.createElement("div");
            info.className = "reminder-item-info";

            const title = document.createElement("h3");
            title.textContent = item.name;

            info.appendChild(title);

            const detail = document.createElement("p");
            detail.className = "reminder-detail";
            detail.textContent = reminderDetail(item);

            info.appendChild(detail);

            const actions = document.createElement("div");
            actions.className = "reminder-item-actions";

            const badge = document.createElement("span");
            badge.className = "status " + item.status;
            badge.textContent = statusLabel(item.status);

            actions.appendChild(badge);

            if (item.status !== "completed") {
                actions.appendChild(
                    makeButton(
                        "Mark Complete",
                        "reminder-action",
                        markCompleted,
                        item.id
                    )
                );
            } else {
                actions.appendChild(
                    makeButton(
                        "Reopen",
                        "reminder-action",
                        reopenReminder,
                        item.id
                    )
                );
            }

            // Only custom reminders can be deleted.
            if (!item.builtIn) {
                actions.appendChild(
                    makeButton(
                        "Delete",
                        "reminder-delete",
                        deleteReminder,
                        item.id
                    )
                );
            }

            card.appendChild(info);
            card.appendChild(actions);

            reminderList.appendChild(card);
        });
    }

    // Mark a reminder as completed.
    function markCompleted(id) {
        const completed = getCompletedReminders();

        if (!completed.includes(id)) {
            completed.push(id);
        }

        saveStorage(completedStorageKey, completed);

        renderReminders();
    }

    // Reopen a completed reminder.
    function reopenReminder(id) {
        const completed = getCompletedReminders().filter(
            function (item) {
                return item !== id;
            }
        );

        saveStorage(completedStorageKey, completed);

        renderReminders();
    }

    // Delete a custom reminder.
    function deleteReminder(id) {
        const updated = getCustomReminders().filter(
            function (item) {
                return item.id !== id;
            }
        );

        saveStorage(customStorageKey, updated);

        const completed = getCompletedReminders().filter(
            function (item) {
                return item !== id;
            }
        );

        saveStorage(completedStorageKey, completed);

        renderReminders();
    }

    // Open and close the add-reminder form.
    function openForm() {
        addReminderPanel.hidden = false;

        document.getElementById("reminderName").focus();
    }

    function closeForm() {
        addReminderPanel.hidden = true;

        reminderForm.reset();
    }

    document.getElementById("showAddReminder")
        .addEventListener("click", openForm);

    document.getElementById("closeAddReminder")
        .addEventListener("click", closeForm);

    document.getElementById("cancelAddReminder")
        .addEventListener("click", closeForm);

    // Save a new custom reminder.
    reminderForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("reminderName")
            .value.trim();

        const dueDate = document.getElementById("reminderDueDate")
            .value;

        const dueMileageInput = document.getElementById(
            "reminderDueMileage"
        ).value;

        const notes = document.getElementById("reminderNotes")
            .value.trim();

        if (!name) {
            return;
        }

        if (!dueDate && !dueMileageInput) {
            alert("Please add a due date, due mileage, or both.");

            return;
        }

        const reminders = getCustomReminders();

        reminders.push({
            id: "custom-" + Date.now(),
            vehicleId: Number(vehicleSelect.value),
            name: name,
            dueDate: dueDate,
            dueMileage: dueMileageInput === ""
                ? ""
                : Number(dueMileageInput),
            notes: notes,
            status: "good"
        });

        saveStorage(customStorageKey, reminders);

        activeFilter = "all";

        filterButtons.forEach(function (button) {
            button.classList.toggle(
                "active",
                button.dataset.filter === "all"
            );
        });

        closeForm();

        renderReminders();
    });

    // Filter reminders by status.
    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            activeFilter = button.dataset.filter;

            filterButtons.forEach(function (filterButton) {
                filterButton.classList.toggle(
                    "active",
                    filterButton === button
                );
            });

            renderReminders();
        });
    });

    // Save the selected vehicle.
    vehicleSelect.addEventListener("change", function () {
        localStorage.setItem(
            "roadReadySelectedReminderVehicle",
            vehicleSelect.value
        );

        renderReminders();
    });

    // Display reminders when the page opens.
    renderReminders();
});