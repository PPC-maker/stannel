import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/shared/PageHeader";
import { ExternalLink, Phone, Mail, Globe, Palette, Briefcase, Megaphone, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORY_GROUP_LABELS = {
  marketing_advertising: "שיווק ופרסום",
  business_consulting: "ייעוץ עסקי",
};

const CATEGORY_GROUP_ICONS = {
  marketing_advertising: Megaphone,
  business_consulting: Briefcase,
};

const CATEGORY_LABELS = {
  photography: "צלמים",
  social_media: "סושיאל מדיה",
  magazine: "פרסום במגזין",
  tv: "השתתפות בטלוויזיה",
  branding: "ברנדינג",
  web_development: "פיתוח אתרים",
  business_advisor: "יועץ עסקי",
  mentor: "מנטור",
  marketing: "שיווק",
  other: "אחר",
};

// Nirlat color families with approximate hex values
const COLOR_FAMILIES = [
  { name: "אדומים", key: "red", colors: [
    { name: "IS 0062", hex: "#C0392B", code: "IS_0062" },
    { name: "IS 0063", hex: "#E74C3C", code: "IS_0063" },
    { name: "IS 0064", hex: "#D35400", code: "IS_0064" },
    { name: "IS 0065", hex: "#CB4335", code: "IS_0065" },
    { name: "IS 0066", hex: "#B03A2E", code: "IS_0066" },
    { name: "IS 0067", hex: "#922B21", code: "IS_0067" },
  ]},
  { name: "ורודים", key: "pink", colors: [
    { name: "IS 0050", hex: "#F1948A", code: "IS_0050" },
    { name: "IS 0051", hex: "#E8A0B0", code: "IS_0051" },
    { name: "IS 0052", hex: "#D98880", code: "IS_0052" },
    { name: "IS 0053", hex: "#EDBB99", code: "IS_0053" },
    { name: "IS 0054", hex: "#F5CBA7", code: "IS_0054" },
    { name: "IS 0055", hex: "#F0B27A", code: "IS_0055" },
  ]},
  { name: "כתומים", key: "orange", colors: [
    { name: "IS 0030", hex: "#E67E22", code: "IS_0030" },
    { name: "IS 0031", hex: "#D35400", code: "IS_0031" },
    { name: "IS 0032", hex: "#F39C12", code: "IS_0032" },
    { name: "IS 0033", hex: "#E59866", code: "IS_0033" },
    { name: "IS 0034", hex: "#CA6F1E", code: "IS_0034" },
    { name: "IS 0035", hex: "#F0A500", code: "IS_0035" },
  ]},
  { name: "צהובים", key: "yellow", colors: [
    { name: "IS 0020", hex: "#F4D03F", code: "IS_0020" },
    { name: "IS 0021", hex: "#F7DC6F", code: "IS_0021" },
    { name: "IS 0022", hex: "#D4AC0D", code: "IS_0022" },
    { name: "IS 0023", hex: "#E8C03B", code: "IS_0023" },
    { name: "IS 0024", hex: "#C9A227", code: "IS_0024" },
    { name: "IS 0025", hex: "#B7950B", code: "IS_0025" },
  ]},
  { name: "ירוקים", key: "green", colors: [
    { name: "IS 0080", hex: "#27AE60", code: "IS_0080" },
    { name: "IS 0081", hex: "#2ECC71", code: "IS_0081" },
    { name: "IS 0082", hex: "#1E8449", code: "IS_0082" },
    { name: "IS 0083", hex: "#A9DFBF", code: "IS_0083" },
    { name: "IS 0084", hex: "#58D68D", code: "IS_0084" },
    { name: "IS 0085", hex: "#196F3D", code: "IS_0085" },
  ]},
  { name: "כחולים", key: "blue", colors: [
    { name: "IS 0070", hex: "#2E86C1", code: "IS_0070" },
    { name: "IS 0071", hex: "#3498DB", code: "IS_0071" },
    { name: "IS 0072", hex: "#1A5276", code: "IS_0072" },
    { name: "IS 0073", hex: "#85C1E9", code: "IS_0073" },
    { name: "IS 0074", hex: "#5DADE2", code: "IS_0074" },
    { name: "IS 0075", hex: "#154360", code: "IS_0075" },
  ]},
  { name: "סגולים", key: "purple", colors: [
    { name: "IS 0090", hex: "#8E44AD", code: "IS_0090" },
    { name: "IS 0091", hex: "#9B59B6", code: "IS_0091" },
    { name: "IS 0092", hex: "#6C3483", code: "IS_0092" },
    { name: "IS 0093", hex: "#BB8FCE", code: "IS_0093" },
    { name: "IS 0094", hex: "#D7BDE2", code: "IS_0094" },
    { name: "IS 0095", hex: "#76448A", code: "IS_0095" },
  ]},
  { name: "חומים", key: "brown", colors: [
    { name: "IS 0040", hex: "#7D6608", code: "IS_0040" },
    { name: "IS 0041", hex: "#A04000", code: "IS_0041" },
    { name: "IS 0042", hex: "#784212", code: "IS_0042" },
    { name: "IS 0043", hex: "#935116", code: "IS_0043" },
    { name: "IS 0044", hex: "#6E2F1A", code: "IS_0044" },
    { name: "IS 0045", hex: "#BDC3C7", code: "IS_0045" },
  ]},
  { name: "אפורים", key: "gray", colors: [
    { name: "IS 0010", hex: "#7F8C8D", code: "IS_0010" },
    { name: "IS 0011", hex: "#95A5A6", code: "IS_0011" },
    { name: "IS 0012", hex: "#5D6D7E", code: "IS_0012" },
    { name: "IS 0013", hex: "#ABB2B9", code: "IS_0013" },
    { name: "IS 0014", hex: "#D5D8DC", code: "IS_0014" },
    { name: "IS 0015", hex: "#2C3E50", code: "IS_0015" },
  ]},
  { name: "לבנים", key: "white", colors: [
    { name: "IS 0001", hex: "#FDFEFE", code: "IS_0001" },
    { name: "IS 0002", hex: "#F8F9F9", code: "IS_0002" },
    { name: "IS 0003", hex: "#F2F3F4", code: "IS_0003" },
    { name: "IS 0004", hex: "#EAEDED", code: "IS_0004" },
    { name: "IS 0005", hex: "#E5E7E9", code: "IS_0005" },
    { name: "IS 0006", hex: "#D5D8DC", code: "IS_0006" },
  ]},
  { name: "טבעיים", key: "natural", colors: [
    { name: "IS 0100", hex: "#EDBB99", code: "IS_0100" },
    { name: "IS 0101", hex: "#E59866", code: "IS_0101" },
    { name: "IS 0102", hex: "#D0B49F", code: "IS_0102" },
    { name: "IS 0103", hex: "#C39BD3", code: "IS_0103" },
    { name: "IS 0104", hex: "#F5CBA7", code: "IS_0104" },
    { name: "IS 0105", hex: "#D7CCC8", code: "IS_0105" },
  ]},
];

export default function ArchitectTools() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("colors");
  const [selectedColor, setSelectedColor] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({ marketing_advertising: true, business_consulting: true });

  useEffect(() => { loadProviders(); }, []);

  const loadProviders = async () => {
    const data = await base44.entities.ServiceProvider.filter({ is_active: true }, "name");
    setProviders(data);
    setLoading(false);
  };

  const grouped = providers.reduce((acc, p) => {
    const g = p.category_group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(p);
    return acc;
  }, {});

  const TABS = [
    { key: "colors", label: "מניפת צבעים", icon: Palette },
    { key: "marketing", label: "שיווק ופרסום", icon: Megaphone },
    { key: "consulting", label: "ייעוץ עסקי", icon: Briefcase },
  ];

  const marketingProviders = providers.filter(p => p.category_group === "marketing_advertising");
  const consultingProviders = providers.filter(p => p.category_group === "business_consulting");

  return (
    <div>
      <PageHeader
        title="כלים לאדריכלים"
        subtitle="מניפות צבעים, שיווק וייעוץ עסקי"
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-6 gap-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-xs tracking-wider uppercase transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-gray-900 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Color Catalog */}
      {activeTab === "colors" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">קטלוג צבעי נירלאט — לחץ על צבע לפרטים</p>
            <a
              href="https://nirlat.com/fan/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors uppercase tracking-wide"
            >
              <ExternalLink className="w-3 h-3" /> מניפה מלאה באתר נירלאט
            </a>
          </div>

          {selectedColor && (
            <div className="mb-6 bg-white border border-gray-100 p-5 flex items-center gap-5">
              <div className="w-16 h-16 border border-gray-200 flex-shrink-0" style={{ backgroundColor: selectedColor.hex }} />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedColor.name}</p>
                <p className="text-xs text-gray-400 mt-1">קוד: {selectedColor.code}</p>
                <p className="text-xs text-gray-400 mt-0.5">HEX: {selectedColor.hex}</p>
              </div>
              <button onClick={() => setSelectedColor(null)} className="mr-auto text-gray-300 hover:text-gray-600 text-xs">סגור</button>
            </div>
          )}

          <div className="space-y-5">
            {COLOR_FAMILIES.map(family => (
              <div key={family.key} className="bg-white border border-gray-100 p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-3 font-medium">{family.name}</p>
                <div className="flex flex-wrap gap-2">
                  {family.colors.map(color => (
                    <button
                      key={color.code}
                      onClick={() => setSelectedColor(color)}
                      className={`relative group flex-shrink-0 ${selectedColor?.code === color.code ? "ring-2 ring-gray-900 ring-offset-1" : ""}`}
                      title={`${color.name} — ${color.hex}`}
                    >
                      <div
                        className="w-10 h-10 border border-gray-200/50 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {color.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marketing Providers */}
      {activeTab === "marketing" && (
        <ProviderList providers={marketingProviders} loading={loading} emptyText="אין נותני שירות בקטגוריה זו עדיין" />
      )}

      {/* Consulting Providers */}
      {activeTab === "consulting" && (
        <ProviderList providers={consultingProviders} loading={loading} emptyText="אין נותני שירות בקטגוריה זו עדיין" />
      )}
    </div>
  );
}

function ProviderList({ providers, loading, emptyText }) {
  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>;
  if (providers.length === 0) return <div className="text-center py-16 text-sm text-gray-400">{emptyText}</div>;

  const byCat = providers.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const CATEGORY_LABELS = {
    photography: "צלמים", social_media: "סושיאל מדיה", magazine: "פרסום במגזין",
    tv: "השתתפות בטלוויזיה", branding: "ברנדינג", web_development: "פיתוח אתרים",
    business_advisor: "יועץ עסקי", mentor: "מנטור", marketing: "שיווק", other: "אחר",
  };

  return (
    <div className="space-y-6">
      {Object.entries(byCat).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-3 font-medium flex items-center gap-2">
            <span className="w-3 h-px bg-gray-300" />
            {CATEGORY_LABELS[cat] || cat}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 p-4 hover:border-gray-300 transition-all">
                {p.image_url && (
                  <div className="w-12 h-12 border border-gray-100 overflow-hidden mb-3">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                {p.description && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{p.description}</p>}
                <div className="mt-3 space-y-1.5">
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-[11px] text-gray-500 hover:text-gray-900 transition-colors">
                      <Phone className="w-3 h-3 flex-shrink-0" /> {p.phone}
                    </a>
                  )}
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-[11px] text-gray-500 hover:text-gray-900 transition-colors">
                      <Mail className="w-3 h-3 flex-shrink-0" /> {p.email}
                    </a>
                  )}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] text-gray-500 hover:text-gray-900 transition-colors">
                      <Globe className="w-3 h-3 flex-shrink-0" /> אתר
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}