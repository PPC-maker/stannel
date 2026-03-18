import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8">
      {/* Architectural top rule */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-gray-900" />
        <div className="w-5 h-px bg-gray-300" />
        <div className="w-1.5 h-1.5 border border-gray-400 rotate-45" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-gray-900 leading-none">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-2 tracking-wider uppercase">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-4 h-px bg-gray-100" />
    </div>
  );
}