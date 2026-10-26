/*
 * Filename: /client/js/pages/maintenance-guide.js
 *
 * This file controls the RoadReady Maintenance Guide page.
 *
 * Responsibilities:
 * - Request maintenance guide articles from the server API.
 * - Display the authenticated user's information.
 * - Display available maintenance guide topics.
 * - Allow the user to select a guide topic.
 * - Display the selected guide category, title, summary, body,
 *   and risks if maintenance is skipped.
 * - Remember the selected guide using localStorage.
 *
 * This file does NOT:
 * - Query MySQL directly.
 * - Contain SQL queries.
 * - Manage authentication directly.
 *
 * Guide data is provided by /server/routes/maintenance-guide.js.
 */

document.addEventListener("DOMContentLoaded", async function () {

    const userElement =
        document.getElementById("guide-user");

    const topicsElement =
        document.getElementById("guide-topics");

    const categoryElement =
        document.getElementById("guide-category");

    const titleElement =
        document.getElementById("guide-title");

    const summaryElement =
        document.getElementById("guide-summary");

    const bodyElement =
        document.getElementById("guide-body");

    const risksElement =
        document.getElementById("guide-risks");


    try {

        const response =
            await fetch("/api/maintenance-guide", {
                credentials: "include"
            });

        if (!response.ok) {
            throw new Error(
                "Could not load maintenance guide."
            );
        }

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Could not load maintenance guide."
            );
        }


        const guides =
            data.guides || [];


        // ------------------------------------------
        // USER
        // ------------------------------------------

        if (userElement) {
            userElement.textContent =
                "👤 " +
                (
                    data.user.fullName ||
                    data.user.email
                );
        }


        // ------------------------------------------
        // NO GUIDES
        // ------------------------------------------

        if (guides.length === 0) {

            if (topicsElement) {
                topicsElement.innerHTML = `
                    <p>No guide topics found.</p>
                `;
            }

            if (categoryElement) {
                categoryElement.textContent = "";
            }

            if (titleElement) {
                titleElement.textContent =
                    "No maintenance guides found.";
            }

            if (summaryElement) {
                summaryElement.textContent = "";
            }

            if (bodyElement) {
                bodyElement.textContent = "";
            }

            if (risksElement) {
                risksElement.textContent = "";
            }

            return;
        }


        // ------------------------------------------
        // SELECTED GUIDE
        // ------------------------------------------

        let selectedGuideId =
            Number(
                localStorage.getItem(
                    "selectedGuideId"
                )
            );

        let selected =
            guides.find(function (guide) {
                return Number(guide.id) ===
                    selectedGuideId;
            });


        // Fallback to first guide

        if (!selected) {
            selected = guides[0];

            localStorage.setItem(
                "selectedGuideId",
                selected.id
            );
        }


        // ------------------------------------------
        // TOPICS
        // ------------------------------------------

        if (topicsElement) {

            topicsElement.replaceChildren();

            guides.forEach(function (guide) {

                const link =
                    document.createElement("a");

                link.href = "#";

                link.className =
                    "guide-link" +
                    (
                        Number(guide.id) ===
                        Number(selected.id)
                            ? " selected"
                            : ""
                    );

                link.dataset.guideId =
                    guide.id;

                link.textContent =
                    guide.category;

                link.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        const guideId =
                            Number(
                                this.dataset.guideId
                            );

                        localStorage.setItem(
                            "selectedGuideId",
                            guideId
                        );

                        renderGuide(
                            guides.find(function (item) {
                                return Number(item.id) ===
                                    guideId;
                            }),
                            guides
                        );
                    }
                );

                topicsElement.appendChild(link);
            });
        }


        // ------------------------------------------
        // DISPLAY GUIDE
        // ------------------------------------------

        renderGuide(
            selected,
            guides
        );


    } catch (error) {

        console.error(
            "Maintenance guide loading error:",
            error
        );

        if (titleElement) {
            titleElement.textContent =
                "Could not load maintenance guide.";
        }

        if (summaryElement) {
            summaryElement.textContent =
                "Please try again later.";
        }

        if (bodyElement) {
            bodyElement.textContent = "";
        }

        if (risksElement) {
            risksElement.textContent = "";
        }
    }
});


function renderGuide(selected, guides) {

    if (!selected) {
        return;
    }


    const categoryElement =
        document.getElementById("guide-category");

    const titleElement =
        document.getElementById("guide-title");

    const summaryElement =
        document.getElementById("guide-summary");

    const bodyElement =
        document.getElementById("guide-body");

    const risksElement =
        document.getElementById("guide-risks");

    const topicsElement =
        document.getElementById("guide-topics");


    // ------------------------------------------
    // SELECTED TOPIC
    // ------------------------------------------

    if (topicsElement) {

        const links =
            topicsElement.querySelectorAll(
                ".guide-link"
            );

        links.forEach(function (link) {

            link.classList.toggle(
                "selected",
                Number(link.dataset.guideId) ===
                    Number(selected.id)
            );
        });
    }


    // ------------------------------------------
    // ARTICLE
    // ------------------------------------------

    if (categoryElement) {
        categoryElement.textContent =
            selected.category || "";
    }

    if (titleElement) {
        titleElement.textContent =
            selected.title || "";
    }

    if (summaryElement) {
        summaryElement.textContent =
            selected.summary || "";
    }


    // body_markdown currently contains
    // the article body from the database.
    //
    // For now we display it as HTML so the
    // existing formatting continues to work.

    if (bodyElement) {
        bodyElement.innerHTML =
            selected.body_markdown || "";
    }


    // ------------------------------------------
    // RISKS
    // ------------------------------------------

    if (risksElement) {
        risksElement.textContent =
            selected.risks_if_skipped || "";
    }
}
