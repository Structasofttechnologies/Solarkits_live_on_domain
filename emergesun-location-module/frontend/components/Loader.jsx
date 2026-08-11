import React from "react";

export default function Loader({ text = "Preparing your content...", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[200px] ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-text-secondary font-medium">{text}</p>
    </div>
  );
}
