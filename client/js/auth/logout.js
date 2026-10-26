/*
 * Filename: /client/js/auth/logout.js
 *
 * This file handles RoadReady user logout.
 *
 * Responsibilities:
 * - Send the logout request to the authentication API.
 * - End the user's authenticated session through the server.
 * - Redirect the user to the login page after logout.
 *
 * This file does NOT:
 * - Directly modify the database.
 * - Destroy sessions directly.
 * - Authenticate user credentials.
 *
 * Session management is handled by the server.
 */

document.addEventListener("DOMContentLoaded", async () => {

    const message =
        document.getElementById("logoutMessage");

    const status =
        document.getElementById("logoutStatus");

    try {

        const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Could not log out."
            );
        }

        message.textContent =
            "You have been signed out.";

        status.className = "alert success";

        status.innerHTML =
            '<i class="fa-solid fa-circle-check"></i> ' +
            "Redirecting to the login page...";

        status.style.display = "block";

        setTimeout(() => {
            window.location.href = "/forms/login.html";
        }, 800);

    } catch (error) {

        status.className = "alert error";

        status.innerHTML =
            '<i class="fa-solid fa-circle-xmark"></i> ' +
            error.message;

        status.style.display = "block";

        setTimeout(() => {
            window.location.href = "/forms/login.html";
        }, 1500);
    }
});
