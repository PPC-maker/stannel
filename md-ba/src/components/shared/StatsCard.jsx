import React from "react";

const colorMap = {
  gray:   { bar: "bg-gray-400",    text: "text-gray-600",    bg: "bg-gray-50" },
  blue:   { bar: "bg-indigo-500",  text: "text-indigo-600",  bg: "bg-indigo-50" },
  green:  { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
  amber:  { bar: "bg-amber-400",   text: "text-amber-600",   bg: "bg-amber-50" },
  red:    { bar: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50" },
  purple: { bar: "bg-violet-500",  text: "text-violet-600",  bg: "bg-violet-50" },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "gray" }) {
  const c = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-white border border-gray-100 hover:border-gray-300 transition-all duration-200 relative overflow-hidden group">
      {/* Top accent bar */}
      <div className={`h-0.5 w-full ${c.bar}`} />

      <div className="p-5">
        {/* Blueprint corner mark */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M0 12V0h12" stroke="#d1d5db" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>

        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">{title}</p>
          {Icon && (
            <div className={`w-7 h-7 flex items-center justify-center ${c.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${c.text}`} />
            </div>
          )}
        </div>

        <p className="text-[1.6rem] font-light tracking-tight text-gray-900 leading-none">{value}</p>

        {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-[11px] font-medium mt-2 ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}