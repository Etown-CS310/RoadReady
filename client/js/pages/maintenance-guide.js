
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
 * - Convert stored Markdown into properly formatted HTML.
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
                    data.user?.fullName ||
                    data.user?.email ||
                    "User"
                );
        }


        // ------------------------------------------
        // NO GUIDES
        // ------------------------------------------

        if (guides.length === 0) {

            if (topicsElement) {
                topicsElement.innerHTML =
                    "<p>No guide topics found.</p>";
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

                        const selectedGuide =
                            guides.find(function (item) {
                                return Number(item.id) ===
                                    guideId;
                            });

                        if (!selectedGuide) {
                            return;
                        }

                        localStorage.setItem(
                            "selectedGuideId",
                            guideId
                        );

                        renderGuide(
                            selectedGuide
                        );
                    }
                );

                topicsElement.appendChild(link);
            });
        }


        // ------------------------------------------
        // DISPLAY GUIDE
        // ------------------------------------------

        renderGuide(selected);


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


// ------------------------------------------
// MARKDOWN CONVERSION
// ------------------------------------------

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatInlineMarkdown(value) {

    let html = escapeHTML(value);

    // Inline code
    html = html.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    // Bold
    html = html.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic
    html = html.replace(
        /\*(.+?)\*/g,
        "<em>$1</em>"
    );

    return html;
}


function markdownToHTML(markdown) {

    if (!markdown) {
        return "";
    }

    // Normalize line endings and common formatting.
    let source = String(markdown)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

    // Support headings and bullet lists even if the
    // database content was saved as one long line.
    source = source
        .replace(/[ \t]*\\?(?=##\s)/g, "\n\n")
        .replace(/[ \t]+(?=-\s)/g, "\n");

    const lines =
        source.split("\n");

    const output = [];

    let paragraph = [];
    let listOpen = false;


    function closeList() {

        if (listOpen) {
            output.push("</ul>");
            listOpen = false;
        }
    }


    function flushParagraph() {

        if (paragraph.length > 0) {

            output.push(
                "<p>" +
                formatInlineMarkdown(
                    paragraph.join(" ")
                ) +
                "</p>"
            );

            paragraph = [];
        }
    }


    lines.forEach(function (rawLine) {

        const line =
            rawLine.trim();

        // Blank line
        if (!line) {
            flushParagraph();
            closeList();
            return;
        }


        // Heading
        const headingMatch =
            line.match(/^(#{1,6})\s+(.+)$/);

        if (headingMatch) {

            flushParagraph();
            closeList();

            const level =
                headingMatch[1].length;

            output.push(
                "<h" + level + ">" +
                formatInlineMarkdown(
                    headingMatch[2]
                ) +
                "</h" + level + ">"
            );

            return;
        }


        // Unordered list item
        const listMatch =
            line.match(/^[-*]\s+(.+)$/);

        if (listMatch) {

            flushParagraph();

            if (!listOpen) {
                output.push("<ul>");
                listOpen = true;
            }

            output.push(
                "<li>" +
                formatInlineMarkdown(
                    listMatch[1]
                ) +
                "</li>"
            );

            return;
        }


        // Regular paragraph line
        closeList();

        paragraph.push(line);
    });


    flushParagraph();
    closeList();

    return output.join("\n");
}


// ------------------------------------------
// DISPLAY GUIDE
// ------------------------------------------

function renderGuide(selected) {

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

    if (bodyElement) {
        bodyElement.innerHTML =
            markdownToHTML(
                selected.body_markdown || ""
            );
    }


    // ------------------------------------------
    // RISKS
    // ------------------------------------------

    if (risksElement) {
        risksElement.textContent =
            selected.risks_if_skipped || "";
    }
}
