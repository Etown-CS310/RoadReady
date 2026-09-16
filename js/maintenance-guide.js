document.addEventListener("DOMContentLoaded", function () {

    const content = document.getElementById("guide-content");

    const guides = roadReadyData.guides;

    let selectedGuideId =
        Number(localStorage.getItem("selectedGuideId")) || guides[0].id;

    let selected = guides.find(
        guide => guide.id === selectedGuideId
    );

    if (!selected) {
        selected = guides[0];
    }

    content.innerHTML = `

        ${renderTopbar(
            "Maintenance Guide",
            "Learn why routine maintenance matters.",
            roadReadyData.user.name
        )}

        <section class="guide-layout">

            <aside class="panel guide-sidebar">

                <h2>Topics</h2>

                ${guides.map(guide => `

                    <a
                        href="#"
                        class="guide-link ${
                            guide.id === selected.id
                                ? "selected"
                                : ""
                        }"
                        data-guide-id="${guide.id}"
                    >
                        ${guide.category}
                    </a>

                `).join("")}

            </aside>

            <article class="panel guide-article">

                <span class="guide-category">
                    ${selected.category}
                </span>

                <h2>
                    ${selected.title}
                </h2>

                <p class="guide-summary">
                    ${selected.summary}
                </p>

                <div class="guide-body">

                    ${selected.body}

                </div>

                <div class="risk-box">

                    <h3>
                        Risks if skipped
                    </h3>

                    <p>
                        ${selected.risks}
                    </p>

                </div>

            </article>

        </section>

    `;

    document.querySelectorAll("[data-guide-id]")
        .forEach(link => {

            link.addEventListener("click", function (event) {

                event.preventDefault();

                const guideId =
                    Number(this.dataset.guideId);

                localStorage.setItem(
                    "selectedGuideId",
                    guideId
                );

                location.reload();

            });

        });

});
