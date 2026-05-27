import { Routes, Route } from "react-router-dom";
import "./App.css";
import ParticleBackground from "./components/ParticleBackground";
import Overview from "./pages/Overview";
import Intel from "./pages/Intel";
import SystemStatus from "./pages/SystemStatus";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Incidents from "./pages/Incidents";
import Alerts from "./pages/Alerts";
import Agents from "./pages/Agents";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentSuccess from "./pages/PaymentSuccess";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GoogleCallback from "./pages/auth/GoogleCallback";
import GitHubCallback from "./pages/auth/GitHubCallback";

function App() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "#020209" }}>
      <ParticleBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/login" element={<Login />} />
          <Route path="/intel" element={<Intel />} />
          <Route path="/system" element={<SystemStatus />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes> */}
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/payment-checkout" element={<PaymentCheckout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          <Route
            path="/intel"
            element={
              <ProtectedRoute>
                <Intel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/system"
            element={
              <ProtectedRoute>
                <SystemStatus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />

          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <Incidents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />



          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
export default App;
