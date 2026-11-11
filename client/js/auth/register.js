
/*
 * Filename: /client/js/auth/register.js
 *
 * This file handles the RoadReady registration form.
 *
 * Responsibilities:
 * - Listen for registration form submissions.
 * - Validate passwords and required fields.
 * - Send registration information to the authentication API.
 * - Display registration errors and success messages.
 * - Redirect users to login after successful registration.
 *
 * This file does NOT:
 * - Directly access MySQL.
 * - Hash passwords.
 * - Create authentication sessions.
 *
 * Registration is handled by /server/routes/auth.js.
 */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");
    const button = document.getElementById("registerButton");

    const errorBox = document.getElementById("registerError");
    const successBox = document.getElementById("registerSuccess");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        errorBox.style.display = "none";
        successBox.style.display = "none";

        const fullName =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password.length < 8) {
            errorBox.textContent =
                "Password must contain at least 8 characters.";

            errorBox.style.display = "block";
            return;
        }

        if (password !== confirmPassword) {
            errorBox.textContent =
                "Passwords do not match.";

            errorBox.style.display = "block";
            return;
        }

        button.disabled = true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

        try {

            const response = await fetch("/api/auth/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Registration failed."
                );
            }

            successBox.textContent =
                "Account created successfully! Redirecting to login...";

            successBox.style.display = "block";

            form.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {

            errorBox.textContent = error.message;
            errorBox.style.display = "block";

            button.disabled = false;

            button.innerHTML =
                '<i class="fa-solid fa-user-plus"></i> Create Account';
        }
    });
});
