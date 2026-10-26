/*
 * Filename: /client/js/auth/login.js
 *
 * This file handles the RoadReady login form.
 *
 * Responsibilities:
 * - Listen for login form submission.
 * - Collect the user's login credentials.
 * - Send login credentials to the authentication API.
 * - Display login errors.
 * - Disable the login button while authentication is processing.
 * - Redirect successfully authenticated users to the dashboard.
 *
 * This file does NOT:
 * - Directly access MySQL.
 * - Create sessions directly.
 * - Verify passwords directly.
 *
 * Authentication is performed by /server/routes/auth.js.
 */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    const button = document.getElementById("loginButton");
    const errorBox = document.getElementById("loginError");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        errorBox.style.display = "none";

        button.disabled = true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        try {

            const response = await fetch("/api/auth/login", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Invalid email or password."
                );
            }

            /*
             * Login succeeded.
             *
             * The server has created the authentication session.
             */
            window.location.href = "/dashboard.html";

        } catch (error) {

            errorBox.textContent = error.message;
            errorBox.style.display = "block";

            button.disabled = false;

            button.innerHTML =
                '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
        }
    });
});
