/*
 * Filename: /client/components/navbar.js
 *
 * This file provides the shared RoadReady navigation component.
 *
 * Responsibilities:
 * - Create the shared site navigation.
 * - Provide navigation links between RoadReady pages.
 * - Provide consistent navigation markup across the application.
 *
 * This file does NOT:
 * - Query MySQL.
 * - Manage server-side authentication.
 * - Load page-specific application data.
 */

async function renderNavbar() {

    const currentPage = window.location.pathname.split("/").pop();

    const navItems = [
        {
            href: "/web/dashboard.html",
            file: "dashboard.html",
            label: "Dashboard",
            icon: "fa-solid fa-table-cells-large"
        },
        {
            href: "/web/maintenance.html",
            file: "maintenance.html",
            label: "Maintenance",
            icon: "fa-solid fa-wrench"
        },
        {
            href: "/web/vehicle.html",
            file: "vehicle.html",
            label: "My Vehicle",
            icon: "fa-solid fa-car"
        },
        {
            href: "#",
            file: "",
            label: "Reminders",
            icon: "fa-solid fa-bell"
        },
        {
            href: "/web/maintenance-guide.html",
            file: "maintenance-guide.html",
            label: "Maintenance Guide",
            icon: "fa-solid fa-book-open"
        }
    ];

    const navHTML = navItems.map(item => {

        const active =
            currentPage === item.file ? " active" : "";

        return `
            <a href="${item.href}" class="nav-item${active}">
                <i class="${item.icon} nav-icon"></i>
                ${item.label}
            </a>
        `;

    }).join("");

    // Get the currently logged-in user
    let userName = "User";

    try {
        const response = await fetch("/api/auth/me", {
            credentials: "include"
        });

        if (response.ok) {
            const data = await response.json();

            if (data.success && data.user) {
                userName = data.user.fullName;
            }
        }

    } catch (error) {
        console.error("Could not load logged-in user:", error);
    }

    const navbar = `
        <aside class="sidebar">

            <div class="logo">
                <i class="fa-solid fa-car"></i>
                Road<span>Ready</span>
            </div>

            <nav class="main-nav">
                ${navHTML}
            </nav>

            <div class="sidebar-bottom">

                <div class="sidebar-user">
                    <i class="fa-solid fa-user nav-icon"></i>
                    ${userName}
                </div>

                <a
                    href="/forms/logout.html"
                    class="nav-item logout-link"
                    id="logoutButton"
                >
                    <i class="fa-solid fa-right-from-bracket nav-icon"></i>
                    Log Out
                </a>

            </div>

        </aside>
    `;

    document.body.insertAdjacentHTML(
        "afterbegin",
        navbar
    );
}

document.addEventListener(
    "DOMContentLoaded",
    renderNavbar
);
