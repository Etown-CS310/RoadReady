/*
 * Filename: /client/js/auth/auth-guard.js
 *
 * This file protects authenticated RoadReady frontend pages.
 *
 * Responsibilities:
 * - Check the current user's authentication session.
 * - Request the authenticated user from the server.
 * - Redirect unauthenticated users to the login page.
 *
 * This file does NOT:
 * - Authenticate login credentials.
 * - Create or destroy server sessions.
 * - Load application data.
 *
 * Server-side authentication is handled by the authentication
 * API and middleware.
 */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch("/api/auth/me", {
            credentials: "include"
        });

        if (!response.ok) {
            window.location.href = "/forms/login.html";
            return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
            window.location.href = "/forms/login.html";
        }

    } catch (error) {

        window.location.href = "/forms/login.html";
    }
});
