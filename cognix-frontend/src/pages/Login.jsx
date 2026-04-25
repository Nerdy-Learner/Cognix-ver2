import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    Shield,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Fingerprint,
    KeyRound,
    SendHorizonal,
} from "lucide-react";
import {
    loginUser,
    verifyOTP,
    resendOTP,
    forgotPassword,
    initiateGoogleSignIn,
    initiateGitHubSignIn,
} from "../services/login-api";
import "../styles/Login.css";





// ── Stagger animation variants ─────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

function Login() {
    useEffect(() => {
        const token = localStorage.getItem("cognix_token");
        if (token) navigate("/app");
    }, []);
    const navigate = useNavigate();

    // ── state ──────────────────────────────────────────────
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [mounted, setMounted] = useState(false);

    // 2-step verification state
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
    const [otpData, setOtpData] = useState(null); // { otpId, userId, maskedEmail }

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSent, setForgotSent] = useState(false);

    // Resend OTP cooldown
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // ── validation ─────────────────────────────────────────
    const validate = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = "Email or username is required";
        } else if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Enter a valid email address";
        }
        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── handlers ───────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setLoginError("");
        setSuccessMsg("");

        try {
            const response = await loginUser({ email, password });

            if (!response.success) {
                setLoginError(response.error.message);
                setIsLoading(false);
                return;
            }

            // Credentials matched → proceed to 2FA
            setOtpData({
                otpId: response.data.otpId,
                userId: response.data.userId,
                maskedEmail: response.data.maskedEmail,
            });
            setShowVerification(true);
            setResendCooldown(30);
            setIsLoading(false);
        } catch (err) {
            setLoginError("Network error. Please try again.");
            setIsLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const code = verificationCode.join("");
        if (code.length < 6) return;

        setIsLoading(true);
        setLoginError("");

        try {
            const response = await verifyOTP({
                otpId: otpData?.otpId,
                code,
                userId: otpData?.userId,
            });

            if (!response.success) {
                setLoginError(response.error.message);
                setIsLoading(false);
                return;
            }

            // Success! Navigate to dashboard
            setIsLoading(false);
            navigate("/app");
        } catch (err) {
            setLoginError("Verification failed. Please try again.");
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setLoginError("");
        setSuccessMsg("");

        try {
            const response = await resendOTP({
                otpId: otpData?.otpId,
                userId: otpData?.userId,
            });

            if (response.success) {
                setOtpData((prev) => ({ ...prev, otpId: response.data.otpId }));
                setSuccessMsg(response.data.message);
                setResendCooldown(30);
                setVerificationCode(["", "", "", "", "", ""]);
                // Clear success message after 4 seconds
                setTimeout(() => setSuccessMsg(""), 4000);
            }
        } catch (err) {
            setLoginError("Failed to resend code. Try again.");
        }
    };

    const handleGoogleSignIn = () => {
        initiateGoogleSignIn();
    };

    const handleForgotPassword = () => {
        setShowForgotPassword(true);
        setForgotEmail(email); // Pre-fill with entered email
        setForgotSent(false);
        setLoginError("");
        setSuccessMsg("");
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) {
            setLoginError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        setLoginError("");

        try {
            const response = await forgotPassword({ email: forgotEmail });

            if (response.success) {
                setForgotSent(true);
                setSuccessMsg(response.data.message);
                setIsLoading(false);
            }
        } catch (err) {
            setLoginError("Failed to send reset link. Try again.");
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        // TODO: Navigate to sign up page when built
        // navigate("/signup");
        navigate("/signup");
    };

    // ── OTP input handler ─────────────────────────────────
    const handleCodeChange = (index, value) => {
        if (value.length > 1) return;
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleCodePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").trim().slice(0, 6);
        if (/^\d+$/.test(pasted)) {
            const newCode = [...verificationCode];
            for (let i = 0; i < pasted.length; i++) {
                newCode[i] = pasted[i];
            }
            setVerificationCode(newCode);
            const nextIndex = Math.min(pasted.length, 5);
            document.getElementById(`otp-${nextIndex}`)?.focus();
        }
    };

    // ── progress steps for the left panel ─────────────────
    const steps = [
        { icon: <Mail size={16} />, label: "Enter credentials", done: email && password },
        { icon: <KeyRound size={16} />, label: "Authenticate", done: showVerification },
        { icon: <Shield size={16} />, label: "Verify identity", done: false },
        { icon: <CheckCircle2 size={16} />, label: "Access granted", done: false },
    ];

    // ── Determine which view to show ──────────────────────
    const getFormView = () => {
        if (showForgotPassword) return "forgot";
        if (showVerification) return "verify";
        return "login";
    };

    const formView = getFormView();

    return (
        <div className={`login-page ${mounted ? "login-page--mounted" : ""}`}>
            {/* ── Animated background ─────────────────────────── */}
            <div className="login-bg">
                <div className="login-bg-base" />
                <div className="login-aurora login-aurora--1" />
                <div className="login-aurora login-aurora--2" />
                <div className="login-aurora login-aurora--3" />
                <div className="login-noise" />
                <div className="login-grid-overlay" />
            </div>

            {/* ── Floating orbs ───────────────────────────────── */}
            <div className="login-orbs">
                <div className="login-orb login-orb--1" />
                <div className="login-orb login-orb--2" />
                <div className="login-orb login-orb--3" />
            </div>

            {/* ── Main container (split layout) ───────────────── */}
            <motion.div
                className="login-container"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* ── Left panel – branding & info ──────────────── */}
                <motion.div
                    className="login-panel-left"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="login-panel-left__content">
                        {/* Brand */}
                        <div className="login-brand">
                            <motion.div
                                className="login-logo"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 200 }}
                            >
                                <Shield size={26} strokeWidth={1.8} />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                            >
                                <h1 className="login-brand-name">COGNIX AI</h1>
                                <p className="login-brand-tagline">SOC Triage Security Platform</p>
                            </motion.div>
                        </div>

                        {/* Description */}
                        <motion.p
                            className="login-panel-desc"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.75, duration: 0.5 }}
                        >
                            Advanced threat detection powered by artificial intelligence. Secure your
                            infrastructure with real-time monitoring and automated incident response.
                        </motion.p>

                        {/* Progress steps */}
                        <motion.div
                            className="login-steps"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                        >
                            {steps.map((step, i) => (
                                <motion.div
                                    key={i}
                                    className={`login-step ${step.done ? "login-step--done" : ""} ${(i === 0 && formView === "login") || (i === 2 && formView === "verify")
                                        ? "login-step--active"
                                        : ""
                                        }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                                >
                                    <div className="login-step__icon">{step.icon}</div>
                                    <span className="login-step__label">{step.label}</span>
                                    {i < steps.length - 1 && <div className="login-step__connector" />}
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Bottom decoration */}
                        <motion.div
                            className="login-panel-footer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4, duration: 0.5 }}
                        >
                            <div className="login-tech-badges">
                                <span className="login-tech-badge">256-bit Encryption</span>
                                <span className="login-tech-badge">SOC 2 Compliant</span>
                                <span className="login-tech-badge">Zero Trust</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Mesh gradient decoration */}
                    <div className="login-panel-left__mesh" />
                </motion.div>

                {/* ── Right panel – form ───────────────────────── */}
                <motion.div
                    className="login-panel-right"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <AnimatePresence mode="wait">
                        {formView === "login" && (
                            /* ── Login Form ─────────────────────────────── */
                            <motion.form
                                key="login-form"
                                onSubmit={handleLogin}
                                className="login-form"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <motion.div variants={itemVariants}>
                                    <h2 className="login-form-title">Welcome back</h2>
                                    <p className="login-form-desc">
                                        Sign in to access your security dashboard
                                    </p>
                                </motion.div>

                                {/* Login error banner */}
                                {loginError && (
                                    <motion.div
                                        className="login-error-banner"
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <span className="login-error-banner__icon">!</span>
                                        {loginError}
                                    </motion.div>
                                )}

                                {/* Email / Username */}
                                <motion.div className="login-field" variants={itemVariants}>
                                    <label htmlFor="login-email" className="login-label">
                                        Email or Username
                                    </label>
                                    <div className={`login-input-wrap ${errors.email ? "login-input-error" : ""}`}>
                                        <Mail size={18} className="login-input-icon" />
                                        <input
                                            id="login-email"
                                            type="text"
                                            placeholder="analyst@cognix.io"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                                                if (loginError) setLoginError("");
                                            }}
                                            className="login-input"
                                            autoComplete="username"
                                        />
                                    </div>
                                    {errors.email && (
                                        <motion.span
                                            className="login-error"
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {errors.email}
                                        </motion.span>
                                    )}
                                </motion.div>

                                {/* Password */}
                                <motion.div className="login-field" variants={itemVariants}>
                                    <div className="login-label-row">
                                        <label htmlFor="login-password" className="login-label">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            className="login-forgot-btn"
                                            onClick={handleForgotPassword}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className={`login-input-wrap ${errors.password ? "login-input-error" : ""}`}>
                                        <Lock size={18} className="login-input-icon" />
                                        <input
                                            id="login-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (errors.password)
                                                    setErrors((prev) => ({ ...prev, password: "" }));
                                                if (loginError) setLoginError("");
                                            }}
                                            className="login-input"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="login-toggle-pw"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <motion.span
                                            className="login-error"
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {errors.password}
                                        </motion.span>
                                    )}
                                </motion.div>

                                {/* Remember me */}
                                <motion.label
                                    className="login-remember"
                                    htmlFor="login-remember-check"
                                    variants={itemVariants}
                                >
                                    <input
                                        id="login-remember-check"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="login-checkbox"
                                    />
                                    <span>Remember me for 30 days</span>
                                </motion.label>

                                {/* Submit */}
                                <motion.div variants={itemVariants}>
                                    <motion.button
                                        type="submit"
                                        className="login-submit-btn"
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.015, y: -1 }}
                                        whileTap={{ scale: 0.985 }}
                                    >
                                        {isLoading ? (
                                            <Loader2 size={20} className="login-spinner" />
                                        ) : (
                                            <>
                                                Sign In
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>

                                {/* Divider */}
                                <motion.div className="login-divider" variants={itemVariants}>
                                    <span>or continue with</span>
                                </motion.div>

                                {/* Social sign-in buttons */}
                                <motion.div className="login-social-row" variants={itemVariants}>
                                    {/* Google */}
                                    <motion.button
                                        type="button"
                                        className="login-social-btn"
                                        onClick={handleGoogleSignIn}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        title="Sign in with Google"
                                    >
                                        <svg viewBox="0 0 24 24" width="20" height="20">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Google
                                    </motion.button>

                                    {/* GitHub */}
                                    <motion.button
                                        type="button"
                                        className="login-social-btn"
                                        onClick={() => initiateGitHubSignIn()}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        title="Sign in with GitHub"
                                    >
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#e2e8f0">
                                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        GitHub
                                    </motion.button>
                                </motion.div>

                                {/* Sign up link */}
                                <motion.p className="login-signup-text" variants={itemVariants}>
                                    Don't have an account?{" "}
                                    <button
                                        type="button"
                                        className="login-signup-link"
                                        onClick={handleSignUp}
                                    >
                                        Sign up
                                    </button>
                                </motion.p>
                            </motion.form>
                        )}

                        {formView === "verify" && (
                            /* ── 2-Step Verification ────────────────────── */
                            <motion.form
                                key="verify-form"
                                onSubmit={handleVerify}
                                className="login-form"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <motion.div className="login-verify-header" variants={itemVariants}>
                                    <div className="login-verify-icon-wrap">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                                        >
                                            <Fingerprint size={36} strokeWidth={1.5} />
                                        </motion.div>
                                        <div className="login-verify-pulse" />
                                    </div>
                                    <h2 className="login-form-title">Two-Step Verification</h2>
                                    <p className="login-form-desc">
                                        We sent a 6-digit code to{" "}
                                        <span className="login-email-highlight">
                                            {otpData?.maskedEmail || email}
                                        </span>
                                    </p>
                                </motion.div>

                                {/* Error banner */}
                                {loginError && (
                                    <motion.div
                                        className="login-error-banner"
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <span className="login-error-banner__icon">!</span>
                                        {loginError}
                                    </motion.div>
                                )}

                                {/* Success banner */}
                                {successMsg && (
                                    <motion.div
                                        className="login-success-banner"
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <CheckCircle2 size={16} />
                                        {successMsg}
                                    </motion.div>
                                )}

                                {/* OTP Inputs */}
                                <motion.div className="login-otp-row" variants={itemVariants}>
                                    {verificationCode.map((digit, i) => (
                                        <motion.input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(i, e.target.value)}
                                            onKeyDown={(e) => handleCodeKeyDown(i, e)}
                                            onPaste={i === 0 ? handleCodePaste : undefined}
                                            className="login-otp-input"
                                            autoFocus={i === 0}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                                        />
                                    ))}
                                </motion.div>

                                {/* Verify button */}
                                <motion.div variants={itemVariants}>
                                    <motion.button
                                        type="submit"
                                        className="login-submit-btn"
                                        disabled={isLoading || verificationCode.join("").length < 6}
                                        whileHover={{ scale: 1.015, y: -1 }}
                                        whileTap={{ scale: 0.985 }}
                                    >
                                        {isLoading ? (
                                            <Loader2 size={20} className="login-spinner" />
                                        ) : (
                                            <>
                                                Verify & Continue
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>

                                {/* Resend */}
                                <motion.p className="login-resend-text" variants={itemVariants}>
                                    Didn't receive a code?{" "}
                                    {resendCooldown > 0 ? (
                                        <span className="login-cooldown">
                                            Resend in {resendCooldown}s
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="login-signup-link"
                                            onClick={handleResendOTP}
                                        >
                                            Resend
                                        </button>
                                    )}
                                </motion.p>

                                {/* Back */}
                                <motion.button
                                    type="button"
                                    className="login-back-btn"
                                    onClick={() => {
                                        setShowVerification(false);
                                        setVerificationCode(["", "", "", "", "", ""]);
                                        setLoginError("");
                                        setSuccessMsg("");
                                        setOtpData(null);
                                    }}
                                    variants={itemVariants}
                                    whileHover={{ x: -4 }}
                                >
                                    ← Back to login
                                </motion.button>
                            </motion.form>
                        )}

                        {formView === "forgot" && (
                            /* ── Forgot Password ───────────────────────── */
                            <motion.form
                                key="forgot-form"
                                onSubmit={handleForgotSubmit}
                                className="login-form"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <motion.div className="login-verify-header" variants={itemVariants}>
                                    <div className="login-verify-icon-wrap">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                                        >
                                            <SendHorizonal size={32} strokeWidth={1.5} />
                                        </motion.div>
                                        <div className="login-verify-pulse" />
                                    </div>
                                    <h2 className="login-form-title">
                                        {forgotSent ? "Check your email" : "Reset password"}
                                    </h2>
                                    <p className="login-form-desc">
                                        {forgotSent
                                            ? "We've sent a password reset link to your email"
                                            : "Enter your email and we'll send you a reset link"}
                                    </p>
                                </motion.div>

                                {/* Error banner */}
                                {loginError && (
                                    <motion.div
                                        className="login-error-banner"
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                    >
                                        <span className="login-error-banner__icon">!</span>
                                        {loginError}
                                    </motion.div>
                                )}

                                {/* Success banner */}
                                {forgotSent && successMsg && (
                                    <motion.div
                                        className="login-success-banner"
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                    >
                                        <CheckCircle2 size={16} />
                                        {successMsg}
                                    </motion.div>
                                )}

                                {!forgotSent && (
                                    <>
                                        <motion.div className="login-field" variants={itemVariants}>
                                            <label htmlFor="forgot-email" className="login-label">
                                                Email Address
                                            </label>
                                            <div className="login-input-wrap">
                                                <Mail size={18} className="login-input-icon" />
                                                <input
                                                    id="forgot-email"
                                                    type="text"
                                                    placeholder="analyst@cognix.io"
                                                    value={forgotEmail}
                                                    onChange={(e) => {
                                                        setForgotEmail(e.target.value);
                                                        if (loginError) setLoginError("");
                                                    }}
                                                    className="login-input"
                                                    autoComplete="email"
                                                    autoFocus
                                                />
                                            </div>
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <motion.button
                                                type="submit"
                                                className="login-submit-btn"
                                                disabled={isLoading}
                                                whileHover={{ scale: 1.015, y: -1 }}
                                                whileTap={{ scale: 0.985 }}
                                            >
                                                {isLoading ? (
                                                    <Loader2 size={20} className="login-spinner" />
                                                ) : (
                                                    <>
                                                        Send Reset Link
                                                        <ArrowRight size={18} />
                                                    </>
                                                )}
                                            </motion.button>
                                        </motion.div>
                                    </>
                                )}

                                {/* Back */}
                                <motion.button
                                    type="button"
                                    className="login-back-btn"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotSent(false);
                                        setLoginError("");
                                        setSuccessMsg("");
                                    }}
                                    variants={itemVariants}
                                    whileHover={{ x: -4 }}
                                >
                                    ← Back to login
                                </motion.button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default Login;
