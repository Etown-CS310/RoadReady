function renderNavbar() {

    const currentPage = window.location.pathname.split("/").pop();

    const navItems = [
        {
            href: "dashboard.html",
            label: "Dashboard",
            icon: "fa-solid fa-table-cells-large"
        },
        {
            href: "maintenance.html",
            label: "Maintenance",
            icon: "fa-solid fa-wrench"
        },
        {
            href: "vehicle.html",
            label: "My Vehicle",
            icon: "fa-solid fa-car"
        },
        {
            href: "#",
            label: "Reminders",
            icon: "fa-solid fa-bell"
        },
        {
            href: "maintenance-guide.html",
            label: "Maintenance Guide",
            icon: "fa-solid fa-book-open"
        }
    ];

    const navHTML = navItems.map(item => {

        const active =
            currentPage === item.href ? " active" : "";

        return `
            <a href="${item.href}" class="nav-item${active}">
                <i class="${item.icon} nav-icon"></i>
                ${item.label}
            </a>
        `;

    }).join("");

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
                    Sam Vossen
                </div>

                <a
                    href="#"
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