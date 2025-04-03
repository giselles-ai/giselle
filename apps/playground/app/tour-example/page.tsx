"use client";

import { useState } from "react";
import { ProductTour } from "../components/product-tour";

export default function TourExamplePage() {
  const [isTourOpen, setIsTourOpen] = useState(false);

  const tourSteps = [
    {
      target: "#step1",
      title: "Welcome to Giselle",
      content: "This tour will guide you through the key features of our platform.",
      placement: "bottom" as const,
    },
    {
      target: "#step2",
      title: "Create Your First Workflow",
      content: "Click here to create a new workflow and start building your AI agent.",
      placement: "right" as const,
    },
    {
      target: "#step3",
      title: "Add Components",
      content: "Drag and drop components to build your workflow. Connect them to create a powerful AI agent.",
      placement: "top" as const,
    },
    {
      target: "#step4",
      title: "Deploy Your Agent",
      content: "When you're ready, deploy your agent to make it available to your users.",
      placement: "left" as const,
    },
  ];

  return (
    <div 
      className="min-h-screen text-white p-8 relative"
      style={{
        backgroundColor: "#0f1116",
        backgroundImage: "radial-gradient(circle at 50% 50%, #1a1f2e, #0f1116)",
      }}
    >
      <div className="absolute inset-0 bg-black opacity-30 pointer-events-none"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold" id="step1">Giselle Platform</h1>
          <button
            className="px-4 py-2 bg-primary-500 rounded hover:bg-primary-600"
            onClick={() => setIsTourOpen(true)}
          >
            Start Tour
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4" id="step2">Create Workflow</h2>
            <p className="text-gray-400">
              Start building your AI agent by creating a new workflow.
            </p>
            <button className="mt-4 px-3 py-1.5 bg-primary-700 rounded text-sm">
              New Workflow
            </button>
          </div>

          <div className="bg-black-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4" id="step3">Components</h2>
            <p className="text-gray-400">
              Browse available components and add them to your workflow.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-black-700 rounded text-xs">Text</span>
              <span className="px-2 py-1 bg-black-700 rounded text-xs">Image</span>
              <span className="px-2 py-1 bg-black-700 rounded text-xs">Logic</span>
              <span className="px-2 py-1 bg-black-700 rounded text-xs">API</span>
            </div>
          </div>

          <div className="bg-black-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4" id="step4">Deploy</h2>
            <p className="text-gray-400">
              Deploy your agent to make it available to your users.
            </p>
            <button className="mt-4 px-3 py-1.5 bg-green-700 rounded text-sm">
              Deploy Agent
            </button>
          </div>
        </div>
      </div>

      <ProductTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
