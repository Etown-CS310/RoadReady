function renderFooter() {

    const footer = `
        <footer class="site-footer">
            <p>&copy; © 2026 RoadReady, a CS312 project. All rights reserved.</p>
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
