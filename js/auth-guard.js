document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch("/api/auth/me", {
            credentials: "include"
        });

        if (!response.ok) {
            window.location.href = "/forms/login.html";
            return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
            window.location.href = "/forms/login.html";
        }

    } catch (error) {

        window.location.href = "/forms/login.html";
    }
});
