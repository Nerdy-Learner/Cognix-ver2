import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import TopNav from "../components/layout/TopNav";

const API_BASE = "http://localhost:3001";

function loadCashfreeScript() {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree);
      return;
    }

    const existing = document.querySelector('script[data-cashfree-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Cashfree), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "true";
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error("Could not load Cashfree SDK."));
    document.body.appendChild(script);
  });
}

export default function PaymentCheckout() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Preparing secure checkout...");

  useEffect(() => {
    const raw = sessionStorage.getItem("cognix_checkout_payload");

    if (!raw) {
      navigate("/subscription");
      return;
    }

    const payload = JSON.parse(raw);

    const startCheckout = async () => {
      try {
        setMessage("Loading Cashfree checkout...");
        await loadCashfreeScript();

        const configResponse = await fetch(`${API_BASE}/api/payment/config`);
        const config = await configResponse.json();

        if (!configResponse.ok) {
          throw new Error(config.error || "Could not read payment config.");
        }

        if (config.demoMode && !config.cashfreeReady) {
          const demoResponse = await fetch(`${API_BASE}/api/payment/demo-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const demoData = await demoResponse.json();

          if (!demoResponse.ok) {
            throw new Error(demoData.error || "Could not start demo payment.");
          }

          window.location.href = demoData.redirectUrl;
          return;
        }

        const orderResponse = await fetch(`${API_BASE}/api/payment/create-checkout-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
          throw new Error(orderData.error || "Could not create checkout order.");
        }

        const cashfree = window.Cashfree({
          mode: config.environment === "production" ? "production" : "sandbox",
        });

        const result = await cashfree.checkout({
          paymentSessionId: orderData.paymentSessionId,
          redirectTarget: "_self",
        });

        if (result?.error) {
          throw new Error(result.error.message || "Cashfree checkout failed.");
        }
      } catch (error) {
        setMessage(error.message || "Could not launch payment.");
      }
    };

    startCheckout();
  }, [navigate]);

  return (
    <div style={{ minHeight: "100vh", color: "var(--t1)" }}>
      <TopNav />
      <section style={{ padding: "8rem 6vw 6rem" }}>
        <div className="app-surface line-accent" style={{ padding: 28, maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div className="page-eyebrow">cashfree redirect</div>
          <h1 className="page-title" style={{ maxWidth: "none", margin: "14px auto 0" }}>
            Opening secure payment
          </h1>
          <p className="page-description" style={{ margin: "16px auto 0", maxWidth: 520 }}>
            {message}
          </p>
          <div style={{ marginTop: 24, display: "grid", placeItems: "center", color: "var(--accent-2)" }}>
            <LoaderCircle size={34} className="spin-anim" />
          </div>
        </div>
      </section>
    </div>
  );
}
