import { useEffect } from "react";

export default function GoogleCallback() {

    useEffect(() => {

        async function handleGoogleLogin() {

            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");

            if (!code) {
                window.close();
                return;
            }

            try {

                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/google`,
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

                // ✅ Handle OTP-required response
                if (data.requiresTwoFactor && data.data) {

                    const { otpId, userId } = data.data;

                    // Save in popup (optional but safe)
                    localStorage.setItem("otpId", otpId);
                    localStorage.setItem("userId", userId);

                    // Send to parent window
                    if (window.opener) {

                        window.opener.localStorage.setItem("otpId", otpId);
                        window.opener.localStorage.setItem("userId", userId);

                        // Redirect main window back to login OTP screen
                        window.opener.location.href = "/login";

                        window.close();
                    }
                }

            } catch (err) {

                console.error("Google login failed:", err);
                window.close();

            }

        }

        handleGoogleLogin();

    }, []);

    return <p>Signing you in with Google...</p>;
}