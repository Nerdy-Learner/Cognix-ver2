/* ═══════════════════════════════════════════════════════════════
   DEMO API SERVICE
   Simulates real backend API calls with proper request/response
   patterns, loading states, and error handling.
   Replace these with real API endpoints when backend is ready.
   ═══════════════════════════════════════════════════════════════ */

const API_DELAY = 1200; // Simulates network latency (ms)

// ── Mock user database ──────────────────────────────────────
const MOCK_USERS = [
    {
        id: "usr_001",
        email: "admin",
        password: "admin123",
        name: "Admin User",
        role: "admin",
        avatar: null,
    },
    {
        id: "usr_002",
        email: "analyst@cognix.io",
        password: "analyst123",
        name: "Security Analyst",
        role: "analyst",
        avatar: null,
    },
    {
        id: "usr_003",
        email: "demo@cognix.io",
        password: "demo123",
        name: "Demo User",
        role: "viewer",
        avatar: null,
    },
];

// ── Valid OTP codes (demo) ──────────────────────────────────
const VALID_OTPS = ["000000", "123456"];

// ── Helper: simulate network delay ─────────────────────────
const delay = (ms = API_DELAY) =>
    new Promise((resolve) => setTimeout(resolve, ms));

// ── Helper: generate a fake JWT token ──────────────────────
const generateToken = (user) => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
        JSON.stringify({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        })
    );
    const signature = btoa("demo-signature-" + user.id);
    return `${header}.${payload}.${signature}`;
};

// ═══════════════════════════════════════════════════════════════
// AUTH API ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/login
 * Authenticate user with email/username and password
 */

export async function loginUser({ email, password }) {
    try {
        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            return {
                success: false,
                status: res.status,
                error: {
                    message:
                        data.message ||
                        "Invalid username/email or password"
                }
            };
        }

        // Save login session
        localStorage.setItem("cognix_token", data.token || "");
        localStorage.setItem(
            "cognix_user",
            JSON.stringify(data.user)
        );

        return {
            success: true,
            status: 200,
            data
        };

    } catch (err) {
        console.warn("Backend unavailable. Falling back to mock login.");
    }

    // fallback to mock users if backend fails
    await delay();

    const user = MOCK_USERS.find(
        (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
    );

    if (!user) {
        return {
            success: false,
            status: 401,
            error: {
                message: "Invalid username/email or password"
            }
        };
    }

    return {
        success: true,
        status: 200,
        data: {
            user
        }
    };
}

// export async function loginUser({ email, password }) {
//     await delay();

//     const user = MOCK_USERS.find(
//         (u) =>
//             u.email.toLowerCase() === email.toLowerCase() && u.password === password
//     );

//     if (!user) {
//         return {
//             success: false,
//             status: 401,
//             error: {
//                 code: "INVALID_CREDENTIALS",
//                 message: "Invalid username/email or password",
//             },
//         };
//     }

//     // Simulate sending OTP to user's email/phone
//     const otpId = "otp_" + Date.now().toString(36);
//     console.log(
//         `[Demo API] OTP sent to ${user.email}. Use 000000 or 123456 to verify.`
//     );

//     return {
//         success: true,
//         status: 200,
//         data: {
//             message: "Credentials verified. OTP sent.",
//             otpId,
//             userId: user.id,
//             maskedEmail: maskEmail(user.email),
//             requiresTwoFactor: true,
//         },
//     };
// }

/**
 * POST /api/auth/verify-otp
 * Verify 2FA OTP code
 */
export async function verifyOTP({ otpId, code, userId }) {

    let backendReachable = true;

    try {
        // Step 1: Try real backend OTP verification first
        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ otpId, code, userId })
            }
        );

        if (res.ok) {
            const data = await res.json();

            localStorage.setItem("cognix_token", data.token);
            localStorage.setItem(
                "cognix_user",
                JSON.stringify(data.user)
            );

            return {
                success: true,
                status: 200,
                data
            };
        }

    } catch (err) {
        backendReachable = false;
        console.warn("Backend OTP verification unavailable.");
    }


    // Step 2: fallback to demo OTP (only if backend unreachable)

    if (
        !backendReachable &&
        import.meta.env.VITE_ALLOW_DEV_OTP === "true" &&
        ["000000", "123456"].includes(code)
    ) {

        const user = MOCK_USERS.find((u) => u.id === userId);
        const token = generateToken(user || MOCK_USERS[0]);

        localStorage.setItem("cognix_token", token);
        localStorage.setItem(
            "cognix_user",
            JSON.stringify({
                id: user?.id,
                name: user?.name,
                email: user?.email,
                role: user?.role
            })
        );

        return {
            success: true,
            status: 200,
            data: {
                message: "Authentication successful (demo OTP)",
                token
            }
        };
    }

    // Step 3: reject invalid OTP

    return {
        success: false,
        status: 400,
        error: {
            code: "INVALID_OTP",
            message: "Invalid verification code."
        }
    };
}
// export async function verifyOTP({ otpId, code, userId }) {
//     await delay(800);

//     if (!VALID_OTPS.includes(code)) {
//         return {
//             success: false,
//             status: 400,
//             error: {
//                 code: "INVALID_OTP",
//                 message: "Invalid verification code. Try 000000 or 123456.",
//             },
//         };
//     }

//     const user = MOCK_USERS.find((u) => u.id === userId);
//     const token = generateToken(user || MOCK_USERS[0]);

//     // Store token in localStorage (demo)
//     localStorage.setItem("cognix_token", token);
//     localStorage.setItem(
//         "cognix_user",
//         JSON.stringify({
//             id: user?.id,
//             name: user?.name,
//             email: user?.email,
//             role: user?.role,
//         })
//     );

//     return {
//         success: true,
//         status: 200,
//         data: {
//             message: "Authentication successful",
//             token,
//             user: {
//                 id: user?.id,
//                 name: user?.name,
//                 email: user?.email,
//                 role: user?.role,
//             },
//         },
//     };
// }

/**
 * POST /api/auth/resend-otp
 * Resend OTP code to user
 */
export async function resendOTP({ otpId, userId }) {
    await delay(600);

    console.log(
        `[Demo API] OTP re-sent for user ${userId}. Use 000000 or 123456.`
    );

    return {
        success: true,
        status: 200,
        data: {
            message: "A new verification code has been sent",
            otpId: "otp_" + Date.now().toString(36),
        },
    };
}

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
export async function forgotPassword({ email }) {
    await delay(1000);

    const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // Always return success to avoid email enumeration
    return {
        success: true,
        status: 200,
        data: {
            message: user
                ? `Password reset link sent to ${maskEmail(email)}`
                : "If an account exists with this email, a reset link has been sent",
        },
    };
}

/**
 * POST /api/auth/signup
 * Register a new user
 */
// export async function signupUser({ name, email, password }) {
//     await delay(1500);

//     const exists = MOCK_USERS.find(
//         (u) => u.email.toLowerCase() === email.toLowerCase()
//     );

//     if (exists) {
//         return {
//             success: false,
//             status: 409,
//             error: {
//                 code: "USER_EXISTS",
//                 message: "An account with this email already exists",
//             },
//         };
//     }

//     const newUser = {
//         id: "usr_" + Date.now().toString(36),
//         email,
//         password,
//         name,
//         role: "viewer",
//         avatar: null,
//     };

//     MOCK_USERS.push(newUser);

//     return {
//         success: true,
//         status: 201,
//         data: {
//             message: "Account created successfully. Please sign in.",
//             userId: newUser.id,
//         },
//     };
// }

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
export async function getCurrentUser() {
    await delay(300);

    const token = localStorage.getItem("cognix_token");
    const userData = localStorage.getItem("cognix_user");

    if (!token || !userData) {
        return {
            success: false,
            status: 401,
            error: {
                code: "UNAUTHENTICATED",
                message: "Not authenticated",
            },
        };
    }

    return {
        success: true,
        status: 200,
        data: { user: JSON.parse(userData) },
    };
}

/**
 * POST /api/auth/logout
 * Logout current user
 */
export async function logoutUser() {
    await delay(200);

    localStorage.removeItem("cognix_token");
    localStorage.removeItem("cognix_user");

    return {
        success: true,
        status: 200,
        data: { message: "Logged out successfully" },
    };
}


/**
 * loginUser
 * Sends login request to Cognix authentication service
 *
 * Endpoint:
 * POST /api/auth/login
 *
 * Params:
 * data = {
 *   email: string,
 *   password: string
 * }
 *
 * Returns:
 * {
 *   success: boolean,
 *   token?: string,
 *   user?: object,
 *   isNewUser?: boolean,
 *   message?: string
 * }
 *
 * Used in:
 * Login.jsx → authenticate analyst before dashboard access
 */
// export const loginUser = async (data) => {

//     const res = await fetch(
//         "http://localhost:5000/api/auth/login",
//         {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify(data)
//         }
//     );

//     return res.json();
// };


/**
 * signupUser
 * Register new Cognix analyst account
 */

export const signupUser = async (data) => {

    const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/signup`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    return res.json();
};


// ═══════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════════

/**
 * Initiate Google OAuth flow
 * Opens Google sign-in page in a popup window.
 *
 * NOTE: In production, replace GOOGLE_CLIENT_ID with your actual
 * Google Cloud Console OAuth 2.0 Client ID and set up the redirect URI.
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Replace with real Client ID

// export function initiateGoogleSignIn() {
//     // Google OAuth 2.0 authorization endpoint
//     const googleAuthURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");

//     googleAuthURL.searchParams.set("client_id", GOOGLE_CLIENT_ID);
//     googleAuthURL.searchParams.set("redirect_uri", window.location.origin + "/auth/google/callback");
//     googleAuthURL.searchParams.set("response_type", "code");
//     googleAuthURL.searchParams.set("scope", "openid email profile");
//     googleAuthURL.searchParams.set("access_type", "offline");
//     googleAuthURL.searchParams.set("prompt", "consent");
//     googleAuthURL.searchParams.set("state", crypto.randomUUID?.() || Date.now().toString(36));

//     // Open in a centered popup
//     const width = 500;
//     const height = 650;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;

//     const popup = window.open(
//         googleAuthURL.toString(),
//         "google-signin",
//         `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`
//     );

//     return popup;
// }
export function initiateGoogleSignIn() {
    const backendBase = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
    window.location.href = `${backendBase}/api/auth/google`;
}
// ═══════════════════════════════════════════════════════════════
// GITHUB OAUTH
// ═══════════════════════════════════════════════════════════════

/**
 * Initiate GitHub OAuth flow
 * Opens GitHub sign-in page in a popup window.
 *
 * NOTE: In production, replace GITHUB_CLIENT_ID with your actual
 * GitHub OAuth App Client ID from https://github.com/settings/developers
 */
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID; // Replace with real Client ID

// export function initiateGitHubSignIn() {
//     const githubAuthURL = new URL("https://github.com/login/oauth/authorize");

//     githubAuthURL.searchParams.set("client_id", GITHUB_CLIENT_ID);
//     githubAuthURL.searchParams.set("redirect_uri", window.location.origin + "/auth/github/callback");
//     githubAuthURL.searchParams.set("scope", "read:user user:email");
//     githubAuthURL.searchParams.set("state", crypto.randomUUID?.() || Date.now().toString(36));

//     // Open in a centered popup
//     const width = 500;
//     const height = 700;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;

//     const popup = window.open(
//         githubAuthURL.toString(),
//         "github-signin",
//         `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`
//     );

//     return popup;
// }
export function initiateGitHubSignIn() {
    const backendBase = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
    window.location.href = `${backendBase}/api/auth/github`;
}
// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function maskEmail(email) {
    if (!email.includes("@")) return email.charAt(0) + "***";
    const [local, domain] = email.split("@");
    if (local.length <= 2) return local.charAt(0) + "***@" + domain;
    return local.charAt(0) + "***" + local.slice(-1) + "@" + domain;
}
