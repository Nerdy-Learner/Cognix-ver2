import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { signupUser } from "../services/login-api";
import "../styles/Login.css";

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {

            const res = await signupUser(form);

            if (!res.success) {
                setError(res.message);
                return;
            }

            // Optional success message before redirect
            setTimeout(() => {
                navigate("/login");
            }, 900);

        } catch (err) {

            console.error("Signup error:", err);

            setError("Signup failed. Try again.");

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="login-page login-page--mounted">
            <div className="login-container">

                {/* LEFT PANEL reused from login styling */}
                <div className="login-panel-left">
                    <div className="login-panel-left__content">

                        <div className="login-brand">
                            <div className="login-logo">
                                C
                            </div>

                            <h1 className="login-brand-name">COGNIX AI</h1>

                            <p className="login-brand-tagline">
                                SOC Triage Security Platform
                            </p>
                        </div>

                        <p className="login-panel-desc">
                            Create your analyst account to begin monitoring incidents,
                            triaging alerts, and securing infrastructure using Cognix AI.
                        </p>

                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="login-panel-right">

                    <motion.form
                        onSubmit={handleSignup}
                        className="login-form"
                    >
                        <h2 className="login-form-title">
                            Create account
                        </h2>

                        <p className="login-form-desc">
                            Register as a Cognix analyst
                        </p>

                        {error && (
                            <div className="login-error-banner">
                                {error}
                            </div>
                        )}

                        {/* NAME */}
                        <div className="login-field">
                            <label className="login-label">
                                Full Name
                            </label>

                            <div className="login-input-wrap">
                                <User size={18} className="login-input-icon" />

                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Security Analyst"
                                    className="login-input"
                                />
                            </div>
                        </div>

                        {/* EMAIL */}
                        <div className="login-field">
                            <label className="login-label">
                                Email
                            </label>

                            <div className="login-input-wrap">
                                <Mail size={18} className="login-input-icon" />

                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="analyst@cognix.io"
                                    className="login-input"
                                />
                            </div>
                        </div>

                        {/* PASSWORD */}
                        <div className="login-field">
                            <label className="login-label">
                                Password
                            </label>

                            <div className="login-input-wrap">
                                <Lock size={18} className="login-input-icon" />

                                <input
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="login-input"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 size={18} />
                            ) : (
                                <>
                                    Sign Up
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <p className="login-signup-text">
                            Already have an account?{" "}
                            <button
                                type="button"
                                className="login-signup-link"
                                onClick={() => navigate("/login")}
                            >
                                Sign in
                            </button>
                        </p>

                    </motion.form>

                </div>
            </div>
        </div>
    );
}