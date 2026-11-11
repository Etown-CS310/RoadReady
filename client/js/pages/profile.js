
/*
 * Filename: /client/js/pages/profile.js
 *
 * This file handles the RoadReady profile page.
 *
 * Responsibilities:
 * - Retrieve the authenticated user's information.
 * - Display the user's name and email.
 * - Redirect unauthenticated users to login.
 * - Handle password change form submissions.
 * - Display password update errors and success messages.
 *
 * This file does NOT:
 * - Directly access MySQL.
 * - Hash or verify passwords.
 * - Modify database records directly.
 *
 * Account management is handled by /server/routes/auth.js.
 */

document.addEventListener("DOMContentLoaded", async () => {

    const passwordForm =
        document.getElementById("passwordForm");

    const passwordButton =
        document.getElementById("passwordButton");

    const errorBox =
        document.getElementById("passwordError");

    const successBox =
        document.getElementById("passwordSuccess");


    /*
     * Load authenticated user information.
     */

    async function loadProfile() {

        try {

            const response = await fetch("/api/auth/me", {
                method: "GET",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.user) {
                window.location.href = "/forms/login.html";
                return;
            }

            document.getElementById("profile-name").textContent =
                data.user.fullName || "Not provided";

            document.getElementById("profile-email").textContent =
                data.user.email;

        } catch (error) {

            console.error("Profile loading error:", error);

            window.location.href = "/forms/login.html";
        }
    }


    /*
     * Handle password changes.
     */

    passwordForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        errorBox.style.display = "none";
        successBox.style.display = "none";

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        if (newPassword.length < 8) {

            errorBox.textContent =
                "Your new password must contain at least 8 characters.";

            errorBox.style.display = "block";
            return;
        }

        if (newPassword !== confirmPassword) {

            errorBox.textContent =
                "Your new passwords do not match.";

            errorBox.style.display = "block";
            return;
        }

        if (currentPassword === newPassword) {

            errorBox.textContent =
                "Your new password must be different from your current password.";

            errorBox.style.display = "block";
            return;
        }


        passwordButton.disabled = true;

        passwordButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Updating Password...';


        try {

            const response = await fetch(
                "/api/auth/change-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message || "Could not update password."
                );
            }

            successBox.textContent =
                "Your password has been updated successfully.";

            successBox.style.display = "block";

            passwordForm.reset();

        } catch (error) {

            errorBox.textContent = error.message;
            errorBox.style.display = "block";

        } finally {

            passwordButton.disabled = false;

            passwordButton.innerHTML =
                '<i class="fa-solid fa-key"></i> Update Password';
        }
    });


    await loadProfile();

});
