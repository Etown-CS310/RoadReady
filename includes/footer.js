function renderFooter() {

    const footer = `
        <footer class="site-footer">
            <p>&copy; 2026 RoadReady</p>
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
