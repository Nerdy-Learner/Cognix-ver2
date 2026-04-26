import { useEffect } from "react";
import axios from "axios";

export default function GoogleCallback() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        axios
            .post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/google`,
                { code }
            )
            .then((res) => {
                localStorage.setItem("cognix_user", JSON.stringify(res.data.user));
                window.location.href = "/dashboard";
            });
    }, []);

    return <div>Signing in with Google...</div>;
}