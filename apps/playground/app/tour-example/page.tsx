"use client";

import { useState } from "react";
import { ProductTour } from "../components/product-tour";

export default function TourExamplePage() {
  const [isTourOpen, setIsTourOpen] = useState(false);

  const tourSteps = [
    {
      target: "#step1",
      title: "Welcome to Giselle",
      content: "This platform helps you build and manage AI workflows easily.",
      placement: "bottom" as const
    },
    {
      target: "#step2",
      title: "Your command hub.",
      content: "Add Gen nodes, access your knowledge base, manipulate files, invoke other agents, and orchestrate your workflow.",
      placement: "right" as const
    },
    {
      target: "#step3",
      title: "Node Settings",
      content: "Double-tap nodes to edit settings, craft prompts, configure references, and establish connections between nodes to create a seamless generation flow.",
      placement: "left" as const
    },
    {
      target: "#step4",
      title: "Connecting Nodes",
      content: "Connect nodes by hovering over node edges and dragging to your target, or specify connections directly in node settings to create powerful automation pathways.",
      placement: "right" as const
    },
    {
      target: "#step5",
      title: "Agent Configuration",
      content: "Customize agent names, integrate with external tools like GitHub, and share your creations with collaborators to extend your workflow capabilities.",
      placement: "left" as const
    },
    {
      target: "#step6",
      title: "Resources & Support",
      content: "Get help when you need it. Visit our forum to connect with the community or explore our comprehensive documentation for detailed guidance and best practices whenever you encounter challenges.",
      placement: "bottom" as const
    }
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
              Deploy your AI agent to production with one click.
            </p>
            <button className="mt-4 px-3 py-1.5 bg-primary-700/50 rounded text-sm">
              Coming Soon
            </button>
          </div>
        </div>

        <div className="mt-8 bg-black-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4" id="step5">Settings & Integrations</h2>
          <p className="text-gray-400">
            Configure your agents and integrate with external tools and services.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="px-3 py-1.5 bg-primary-700 rounded text-sm">
              Settings
            </button>
            <button className="px-3 py-1.5 bg-primary-700/70 rounded text-sm">
              Integrations
            </button>
          </div>
        </div>

        <div className="mt-8 bg-black-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4" id="step6">Help & Resources</h2>
          <p className="text-gray-400">
            Get assistance and access additional resources to maximize your experience.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href="#" className="px-3 py-1.5 bg-primary-700/60 rounded text-sm text-center">Documentation</a>
            <a href="#" className="px-3 py-1.5 bg-primary-700/60 rounded text-sm text-center">Community Forum</a>
            <a href="#" className="px-3 py-1.5 bg-primary-700/60 rounded text-sm text-center">Tutorials</a>
            <a href="#" className="px-3 py-1.5 bg-primary-700/60 rounded text-sm text-center">Contact Support</a>
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
