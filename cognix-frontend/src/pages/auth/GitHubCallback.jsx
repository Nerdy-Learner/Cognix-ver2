import { useEffect } from "react";
import axios from "axios";

export default function GithubCallback() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) return;

        axios
            .post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/github`,
                { code }
            )
            .then((res) => {
                localStorage.setItem(
                    "cognix_user",
                    JSON.stringify(res.data.user)
                );

                window.location.href = "/dashboard";
            })
            .catch(() => {
                alert("GitHub login failed");
            });
    }, []);

    return <div>Signing in with GitHub...</div>;
}