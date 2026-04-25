import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CreditCard, Landmark, ShieldCheck, Wallet } from "lucide-react";
import TopNav from "../components/layout/TopNav";

const formatInr = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const plans = [
  {
    id: "weekly",
    label: "Weekly",
    headline: "Rapid trial lane",
    price: 19,
    cadence: "week",
    accent: "var(--amber)",
    detail: "Fast onboarding for short security operations and pilot teams.",
  },
  {
    id: "monthly",
    label: "Monthly",
    headline: "Operational default",
    price: 59,
    cadence: "month",
    accent: "var(--accent-2)",
    detail: "Balanced cost and flexibility for growing teams that want steady coverage.",
  },
  {
    id: "yearly",
    label: "Yearly",
    headline: "Best value command plan",
    price: 499,
    cadence: "year",
    accent: "var(--green)",
    detail: "Lowest effective rate for long-term SOC teams standardizing on Cognix.",
  },
];

const paymentMethods = [
  { id: "card", label: "Card", icon: CreditCard, copy: "Visa, Mastercard, Amex" },
  { id: "upi", label: "UPI / Wallet", icon: Wallet, copy: "UPI, wallet, mobile pay" },
  { id: "bank", label: "Netbanking", icon: Landmark, copy: "Direct bank checkout" },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [form, setForm] = useState({
    company: "Cognix AI",
    name: "",
    email: "",
    phone: "",
  });

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) ?? plans[1],
    [selectedPlan]
  );

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const checkoutPayload = {
      ...form,
      company: "Cognix AI",
      method: selectedMethod,
      planId: activePlan.id,
      planLabel: activePlan.label,
      amount: activePlan.price,
    };

    sessionStorage.setItem("cognix_checkout_payload", JSON.stringify(checkoutPayload));
    navigate("/payment-checkout");
  };

  return (
    <div style={{ minHeight: "100vh", color: "var(--t1)" }}>
      <TopNav />

      <section
        style={{
          padding: "7.5rem 6vw 3rem",
          position: "relative",
        }}
      >
        <div className="page-hero" style={{ minHeight: 320 }}>
          <div className="page-hero-copy">
            <div className="page-eyebrow">// cognix secure billing</div>
            <h1 className="page-title" style={{ maxWidth: "14ch" }}>
              COGNIX subscription portal
            </h1>
            <p className="page-description" style={{ maxWidth: 620 }}>
              Buy a Cognix subscription in the same command-center theme as the main website. Choose
              weekly, monthly, or yearly billing, select a payment path, and review the branded order
              summary before checkout.
            </p>

            <div className="page-meta-row">
              <div className="page-meta-chip">
                <span>Website</span>
                <strong>COGNIX</strong>
              </div>
              <div className="page-meta-chip">
                <span>Billing options</span>
                <strong>Weekly / Monthly / Yearly</strong>
              </div>
              <div className="page-meta-chip">
                <span>Security</span>
                <strong>Encrypted purchase flow</strong>
              </div>
            </div>
          </div>

          <div className="page-hero-aside">
            <div className="app-surface line-accent" style={{ padding: 24 }}>
              <div className="label-sm" style={{ marginBottom: 10 }}>
                selected plan
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: "2.2rem", fontWeight: 700, color: activePlan.accent }}>
                {formatInr(activePlan.price)}
              </div>
              <div style={{ marginTop: 6, color: "var(--t2)" }}>
                per {activePlan.cadence} for the {activePlan.label.toLowerCase()} Cognix subscription
              </div>
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "rgba(255,255,255,.03)",
                }}
              >
                <div className="label-xs" style={{ marginBottom: 8 }}>
                  included
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    "Threat monitoring dashboard access",
                    "Analyst-ready incident workflows",
                    "Priority support and billing receipt",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--t2)" }}>
                      <Check size={15} color={activePlan.accent} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 6vw 6rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
            gap: 22,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 22 }}>
            <div className="app-surface" style={{ padding: 24 }}>
              <div className="section-heading">
                <div>
                  <div className="page-eyebrow">subscription plans</div>
                  <h2 className="section-title">Choose your billing cycle</h2>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                {plans.map((plan) => {
                  const active = plan.id === selectedPlan;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className="card"
                      style={{
                        padding: 22,
                        textAlign: "left",
                        background: active ? "linear-gradient(180deg, rgba(43,18,15,0.96) 0%, rgba(18,9,9,0.96) 100%)" : undefined,
                        borderColor: active ? "rgba(255,138,61,.28)" : undefined,
                        boxShadow: active ? "0 26px 90px rgba(255,106,42,.1)" : undefined,
                      }}
                    >
                      <div className="label-sm" style={{ marginBottom: 12 }}>
                        {plan.label}
                      </div>
                      <div style={{ fontFamily: "var(--display)", fontSize: "1.65rem", fontWeight: 700, color: plan.accent }}>
                        {formatInr(plan.price)}
                        <span style={{ fontSize: "0.88rem", color: "var(--t3)", marginLeft: 6 }}>/ {plan.cadence}</span>
                      </div>
                      <div style={{ marginTop: 10, fontWeight: 600, color: "#fff8f4" }}>{plan.headline}</div>
                      <p style={{ marginTop: 8, color: "var(--t2)", lineHeight: 1.7 }}>{plan.detail}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="app-surface" style={{ padding: 24 }}>
              <div className="section-heading">
                <div>
                  <div className="page-eyebrow">payment methods</div>
                  <h2 className="section-title">Pick how you want to pay</h2>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {paymentMethods.map((method) => {
                  const active = method.id === selectedMethod;
                  const Icon = method.icon;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className="card card-sm"
                      style={{
                        padding: 18,
                        textAlign: "left",
                        borderColor: active ? "rgba(255,138,61,.24)" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(255,138,61,.12)",
                            color: "var(--accent-2)",
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#fff8f4" }}>{method.label}</div>
                          <div style={{ color: "var(--t3)", marginTop: 4, fontSize: 13 }}>{method.copy}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="app-surface line-accent" style={{ padding: 24, position: "sticky", top: 108 }}>
            <div className="page-eyebrow" style={{ marginBottom: 8 }}>
              order review
            </div>
            <h2 className="section-title" style={{ marginBottom: 10 }}>
              Complete your Cognix payment
            </h2>
            <p style={{ color: "var(--t2)", lineHeight: 1.75, marginBottom: 20 }}>
              Your subscription portal carries the Cognix website name and styling so customers see a
              consistent branded payment experience.
            </p>

            <div
              style={{
                padding: 18,
                borderRadius: 20,
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.08)",
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "var(--t2)" }}>
                <span>Website</span>
                <strong style={{ color: "#fff" }}>COGNIX</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "var(--t2)" }}>
                <span>Subscription</span>
                <strong style={{ color: "#fff" }}>{activePlan.label}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "var(--t2)" }}>
                <span>Payment mode</span>
                <strong style={{ color: "#fff" }}>
                  {paymentMethods.find((method) => method.id === selectedMethod)?.label}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                <span style={{ color: "var(--t2)" }}>Total</span>
                <strong style={{ color: activePlan.accent, fontSize: "1.3rem" }}>
                  {formatInr(activePlan.price)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span className="label-sm">Company name</span>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Cognix AI"
                  className="field-input"
                  required
                />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span className="label-sm">Full name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Alex Johnson"
                  className="field-input"
                  required
                />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span className="label-sm">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="alex@company.com"
                  className="field-input"
                  required
                />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span className="label-sm">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="field-input"
                  required
                />
              </label>

              <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: 6 }}>
                <ShieldCheck size={16} />
                Pay for {activePlan.label} plan
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
