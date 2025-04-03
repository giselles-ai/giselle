"use client";

import { useState } from "react";
import { WorkspaceTour } from "../components/workspace-tour";

export default function WorkspacesPage() {
  const [isTourOpen, setIsTourOpen] = useState(true);

  return (
    <div 
      className="min-h-screen text-white p-8 relative"
      style={{
        backgroundColor: "#0f1116",
        backgroundImage: "radial-gradient(circle at 50% 50%, #1a1f2e, #0f1116)",
      }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Giselle Workspaces</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ワークスペースのリストなどがここに表示される */}
        </div>
      </div>

      {/* ガイドツアーコンポーネント */}
      <WorkspaceTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
} 