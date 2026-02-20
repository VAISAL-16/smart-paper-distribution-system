import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function MainLayout() {
  const [activeRole, setActiveRole] = useState("INVIGILATOR");
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
  };

  return (
    <div className="flex bg-slate-50">

      {/* Sidebar */}
      <Sidebar activeRole={activeRole} />

      {/* Content Area */}
      <div className="flex-1 flex flex-col ml-64">

        {/* Top Navbar */}
        <Navbar
          activeRole={activeRole}
          setActiveRole={setActiveRole}
          isOfflineMode={isOfflineMode}
          toggleOfflineMode={toggleOfflineMode}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6">
          {/* 👇 Pass role to all child pages */}
          <Outlet context={{ activeRole }} />
        </main>

      </div>
    </div>
  );
}

export default MainLayout;
