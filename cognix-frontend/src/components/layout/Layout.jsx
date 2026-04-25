import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="app-shell shell-frame">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}
