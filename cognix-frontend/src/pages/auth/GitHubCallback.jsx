import { useEffect } from "react";

export default function GithubCallback() {
    useEffect(() => {
        async function handleGitHubLogin() {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");

            if (!code) {
                window.close();
                return;
            }

            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/github`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ code })
                    }
                );

                const data = await res.json();

                if (!data.success) {
                    window.close();
                    return;
                }

                // Save auth data
                localStorage.setItem("cognix_token", data.token);
                localStorage.setItem("cognix_user", JSON.stringify(data.user));

                if (window.opener) {
                    // Running inside a popup — push data to the parent window
                    window.opener.localStorage.setItem("cognix_token", data.token);
                    window.opener.localStorage.setItem("cognix_user", JSON.stringify(data.user));

                    // Redirect parent to dashboard
                    window.opener.location.href = "/app";
                    window.close();
                } else {
                    // Not a popup — redirect directly
                    window.location.href = "/app";
                }
            } catch (err) {
                console.error("GitHub login failed:", err);
                window.close();
            }
        }

        handleGitHubLogin();
    }, []);

    return <p>Signing in with GitHub...</p>;
}