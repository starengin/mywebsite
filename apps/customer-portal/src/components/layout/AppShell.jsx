import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import MobileSidebar from "./MobileSidebar.jsx";

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen gradient-bg">
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-72 z-40">
        <Sidebar />
      </div>

      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main className="px-4 sm:px-6 lg:px-8 py-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}