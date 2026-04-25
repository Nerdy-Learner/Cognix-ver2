import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BrandMark from "../BrandMark";

const NAV = [
  { label: "Home", path: "/" },
  { label: "Subscription", path: "/subscription" },
  { label: "Platform", path: "/login" },
  { label: "Intelligence", path: "/intel" },
  { label: "Status", path: "/system" },
];

export default function TopNav() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    const clk = setInterval(() => setTime(new Date()), 1000);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(clk);
    };
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const utc = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())} UTC`;

  return (
    <nav className={`topnav-shell${scrolled ? " scrolled" : ""}`}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <BrandMark />
      </Link>

      <div className="topnav-links">
        {NAV.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`topnav-link${active ? " active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="status-inline">{utc}</span>
        <Link to="/subscription" className="btn-primary">
          Buy subscription <ArrowRight size={14} />
        </Link>
      </div>
    </nav>
  );
}
