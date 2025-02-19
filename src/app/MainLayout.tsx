"use client";

import React from "react";
import TopNavigation from "@/components/ui/TopNavigation";
import SpotTradeSection from "@/components/SpotSection/SpotPage";

const MainLayout: React.FC = () => {
  return (
    <div className="w-full text-white">
      {/* Top Navigation */}
      <div className="w-full">
        <TopNavigation />
      </div>
      <SpotTradeSection />
    </div>
  );
};

export default MainLayout;
