import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Eye } from "lucide-react";

export default function ProfileViewers({ userEmail }) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    loadViews();
  }, [userEmail]);

  const loadViews = async () => {
    const data = await base44.entities.ProfileView.filter(
      { viewed_user_email: userEmail },
      "-created_date",
      20
    );
    // Deduplicate by viewer_email, keep most recent
    const seen = new Set();
    const unique = data.filter(v => {
      if (seen.has(v.viewer_email)) return false;
      seen.add(v.viewer_email);
      return true;
    });
    setViews(unique);
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-px h-4 bg-gray-900" />
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">מי צפה בפרופיל שלך</p>
        <span className="text-[10px] text-gray-300 mr-auto">{views.length} צפיות ייחודיות</span>
      </div>
      {views.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">אין צפיות עדיין</p>
      ) : (
        <div className="space-y-2">
          {views.map(v => (
            <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                  {(v.viewer_name || v.viewer_email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{v.viewer_name || v.viewer_email}</p>
                  {v.viewer_company && <p className="text-[10px] text-gray-400">{v.viewer_company}</p>}
                  <p className="text-[10px] text-gray-300">{v.viewer_role === "architect" ? "אדריכל" : v.viewer_role === "supplier" ? "ספק" : "אדמין"}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-300">{new Date(v.created_date).toLocaleDateString("he-IL")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}