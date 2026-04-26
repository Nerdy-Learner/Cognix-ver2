import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TopNav from "../components/layout/TopNav";

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace("/api", "");

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your payment...");
  const [tone, setTone] = useState("var(--accent-2)");

  useEffect(() => {
    const demo = searchParams.get("demo") === "1";
    const orderId = searchParams.get("order_id");
    const customerName = searchParams.get("customer_name");

    if (demo) {
      setTone("var(--green)");
      setMessage(`Demo payment completed for ${customerName || "your order"}.`);
      return;
    }

    if (!orderId) {
      setTone("var(--red)");
      setMessage("Missing Cashfree order ID.");
      return;
    }

    let cancelled = false;

    const verifyOrder = async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          const response = await fetch(`${API_BASE}/api/payment/order-status?order_id=${encodeURIComponent(orderId)}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Could not verify payment.");
          }

          if (cancelled) return;

          if (data.orderStatus === "PAID") {
            setTone("var(--green)");
            setMessage(`Payment received for ${data.customerName || "your order"}.`);
            sessionStorage.removeItem("cognix_checkout_payload");
            return;
          }

          if (["FAILED", "CANCELLED", "USER_DROPPED"].includes(data.orderStatus)) {
            setTone("var(--red)");
            setMessage(`Payment not completed. Current status: ${data.orderStatus}.`);
            return;
          }
        } catch (error) {
          if (attempt === 7) {
            setTone("var(--red)");
            setMessage(error.message || "Could not verify payment.");
            return;
          }
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2500));
      }

      setTone("var(--amber)");
      setMessage("Checkout returned, but payment confirmation is still pending.");
    };

    verifyOrder();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div style={{ minHeight: "100vh", color: "var(--t1)" }}>
      <TopNav />
      <section style={{ padding: "8rem 6vw 6rem" }}>
        <div className="app-surface line-accent" style={{ padding: 28, maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div className="page-eyebrow">payment status</div>
          <h1 className="page-title" style={{ maxWidth: "none", margin: "14px auto 0" }}>
            Cognix payment result
          </h1>
          <p className="page-description" style={{ margin: "16px auto 0", maxWidth: 520, color: tone }}>
            {message}
          </p>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link to="/app" className="btn-ghost">Back to dashboard</Link>
            <Link to="/subscription" className="btn-primary">Open subscription portal</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
