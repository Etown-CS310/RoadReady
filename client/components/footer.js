/*
 * Filename: /client/components/footer.js
 *
 * This file provides the shared RoadReady footer component.
 *
 * Responsibilities:
 * - Create the shared site footer.
 * - Provide consistent footer markup across RoadReady pages.
 *
 * This file does NOT:
 * - Query MySQL.
 * - Manage authentication.
 * - Load page-specific application data.
 */

function renderFooter() {

    const footer = `
        <footer class="site-footer">
            <p>&copy; 2026 RoadReady, a CS312 project. All rights reserved.</p>
        </footer>
    `;

    document.body.insertAdjacentHTML(
        "beforeend",
        footer
    );
}

document.addEventListener(
    "DOMContentLoaded",
    renderFooter
);
