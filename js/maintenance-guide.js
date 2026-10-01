document.addEventListener("DOMContentLoaded", function () {

    // Elements
    const userElement = document.getElementById("guide-user");
    const topicsElement = document.getElementById("guide-topics");
    const categoryElement = document.getElementById("guide-category");
    const titleElement = document.getElementById("guide-title");
    const summaryElement = document.getElementById("guide-summary");
    const bodyElement = document.getElementById("guide-body");
    const risksElement = document.getElementById("guide-risks");

    // Guide data
    const guides = roadReadyData.guides;

    // Selected guide
    let selectedGuideId = Number(localStorage.getItem("selectedGuideId")) || guides[0].id;
    let selected =
        guides.find(function (guide) {
            return guide.id === selectedGuideId;
        });

    // Fallback to first guide
    if (!selected) {
        selected = guides[0];
    }

    // User
    userElement.textContent = "👤 " + roadReadyData.user.name;

    // Topics
    topicsElement.replaceChildren();

    guides.forEach(function (guide) {
        const link = document.createElement("a");
        link.href = "#";
        link.className =
            "guide-link" +
            (
                guide.id === selected.id
                    ? " selected"
                    : ""
            );
        link.dataset.guideId = guide.id;
        link.textContent = guide.category;

        link.addEventListener("click",
            function (event) {
                event.preventDefault();
                const guideId = Number(this.dataset.guideId);
                localStorage.setItem("selectedGuideId", guideId);
                location.reload();
            }
        );
        topicsElement.appendChild(link);
    });

    // Selected guide
    categoryElement.textContent = selected.category;

    titleElement.textContent = selected.title;

    summaryElement.textContent = selected.summary;

    // Guide body
    // The body in data.js contains HTML formatting,
    // so innerHTML is used here.
    bodyElement.innerHTML = selected.body;

    // Risks
    risksElement.textContent = selected.risks;
});
