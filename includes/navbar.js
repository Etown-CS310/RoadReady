function renderNavbar() {

    const currentPage = window.location.pathname.split("/").pop();

    const navItems = [
        {
            href: "dashboard.html",
            label: "Dashboard",
            icon: "▦"
        },
        {
            href: "maintenance.html",
            label: "Maintenance",
            icon: "🔧"
        },
        {
            href: "vehicle.html",
            label: "My Vehicle",
            icon: "🚘"
        },
        {
            href: "#",
            label: "Reminders",
            icon: "🔔"
        },
        {
            href: "maintenance-guide.html",
            label: "Maintenance Guide",
            icon: "📖"
        }
    ];

    const navHTML = navItems.map(item => {

        const active =
            currentPage === item.href ? " active" : "";

        return `
            <a href="${item.href}" class="nav-item${active}">
                <span class="nav-icon">${item.icon}</span>
                ${item.label}
            </a>
        `;

    }).join("");

    const navbar = `
        <aside class="sidebar">

            <div class="logo">
                🚗 Road<span>Ready</span>
            </div>

            <nav class="main-nav">
                ${navHTML}
            </nav>

            <div class="sidebar-bottom">

                <div class="sidebar-user">
                    👤 Sam Vossen
                </div>

                <a
                    href="#"
                    class="nav-item logout-link"
                    id="logoutButton"
                >
                    <span class="nav-icon">↪</span>
                    Log Out
                </a>

            </div>

        </aside>
    `;

    document.body.insertAdjacentHTML(
        "afterbegin",
        navbar
    );

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                alert(
                    "Logout will be implemented when authentication is added."
                );

            }
        );

    }
}

document.addEventListener(
    "DOMContentLoaded",
    renderNavbar
);
