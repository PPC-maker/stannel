import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Ruler,
  CreditCard,
  ClipboardList,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const TRUST_COLORS = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-500"
};

const TRUST_LABELS = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold"
};

// Role-specific sidebar accent colors
const ROLE_ACCENTS = {
  architect: "from-indigo-600 via-violet-600 to-purple-700",
  supplier:  "from-slate-700 via-gray-700 to-zinc-800",
  admin:     "from-gray-900 via-gray-800 to-gray-900",
};

const ROLE_LABELS = {
  architect: "Design Community",
  supplier: "Supplier Portal",
  admin: "Admin Panel",
};

// Tiny architectural mark in SVG
function ArchMark({ className = "" }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="1" y="1" width="26" height="26" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
      <rect x="5" y="5" width="18" height="18" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="2 2" />
      <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
      <line x1="1" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="14" y1="1" x2="14" y2="27" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
    </svg>
  );
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role === "admin") {
        setUserRole("admin");
        const notifs = await base44.entities.Notification.filter({ recipient_email: u.email, is_read: false });
        setUnreadCount(notifs.length);
        setLoading(false);
        return;
      }
      const architects = await base44.entities.ArchitectProfile.filter({ user_email: u.email });
      if (architects.length > 0) {
        setProfile(architects[0]);
        setUserRole("architect");
      } else {
        const suppliers = await base44.entities.SupplierProfile.filter({ user_email: u.email });
        if (suppliers.length > 0) {
          setProfile(suppliers[0]);
          setUserRole("supplier");
        } else {
          setUserRole("new_user");
        }
      }
      const notifs = await base44.entities.Notification.filter({ recipient_email: u.email, is_read: false });
      setUnreadCount(notifs.length);
    } catch (e) {}
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <ArchMark className="text-white w-10 h-10 animate-pulse" />
          <div className="w-6 h-px bg-white/20 animate-pulse" />
          <span className="text-white/30 text-[10px] tracking-[0.4em] uppercase">STANNEL</span>
        </div>
      </div>
    );
  }

  if (!user && currentPageName !== "Onboarding") {
    base44.auth.redirectToLogin();
    return null;
  }

  if (user && userRole === "new_user" && currentPageName !== "Onboarding") {
    window.location.href = createPageUrl("Onboarding");
    return <div className="min-h-screen bg-[#0e0e12]" />;
  }

  const adminPages = ["AdminDashboard", "AdminAnalytics", "AdminInvoices", "AdminArchitects", "AdminSuppliers", "AdminPayments", "AuditLogs", "ManageArchitectGoals", "ManageContracts", "ManageEvents", "ManageServiceProviders"];
  const architectPages = ["ArchitectDashboard", "ArchitectInvoices", "ArchitectGoals", "ArchitectCard", "RateSupplier", "ArchitectTools"];
  const supplierPages = ["SupplierDashboard", "SupplierInvoices", "SupplierPayments", "ManageSupplierDetails"];
  const sharedPages = ["Notifications", "AIInsights"];

  if (userRole === "architect" && adminPages.includes(currentPageName) && !sharedPages.includes(currentPageName)) {
    window.location.href = createPageUrl("ArchitectDashboard");
    return <div className="min-h-screen bg-[#0e0e12]" />;
  }
  if (userRole === "supplier" && (adminPages.includes(currentPageName) || architectPages.includes(currentPageName)) && !sharedPages.includes(currentPageName)) {
    window.location.href = createPageUrl("SupplierDashboard");
    return <div className="min-h-screen bg-[#0e0e12]" />;
  }
  if (userRole === "admin" && (architectPages.includes(currentPageName) || supplierPages.includes(currentPageName)) && !sharedPages.includes(currentPageName)) {
    window.location.href = createPageUrl("AdminDashboard");
    return <div className="min-h-screen bg-[#0e0e12]" />;
  }

  const navItems = getNavItems(userRole);
  const isOnboarding = currentPageName === "Onboarding";

  if (isOnboarding) {
    return <div className="min-h-screen bg-[#0e0e12]">{children}</div>;
  }

  const accentGradient = ROLE_ACCENTS[userRole] || ROLE_ACCENTS.admin;

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        body { font-family: 'Inter', sans-serif; }

        .nav-link-active {
          background: white;
          color: #111;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .nav-link-active::before {
          content: '';
          position: absolute;
          right: 0;
          top: 20%;
          height: 60%;
          width: 2px;
          background: #111;
          border-radius: 0 2px 2px 0;
        }
        .nav-link {
          position: relative;
          transition: all 0.15s ease;
        }
        .sidebar-bg-lines {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .content-scrollbar::-webkit-scrollbar { width: 4px; }
        .content-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .content-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed lg:sticky top-0 right-0 h-screen w-60 
        flex flex-col transition-transform duration-300 overflow-hidden
        bg-[#0e0e12] sidebar-bg-lines
        ${sidebarOpen ? "translate-x-0 z-[50]" : "translate-x-full z-[50] lg:translate-x-0"}
      `}>

        {/* Top accent strip */}
        <div className={`h-0.5 w-full bg-gradient-to-l ${accentGradient} flex-shrink-0`} />

        {/* Brand */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ArchMark className="text-white w-6 h-6" />
              <div>
                <p className="text-white text-[13px] font-medium tracking-[0.15em] uppercase leading-none">Stannel</p>
                <p className="text-white/30 text-[9px] tracking-[0.2em] uppercase mt-0.5">
                  {ROLE_LABELS[userRole] || "Platform"}
                </p>
              </div>
            </div>
            <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thin divider */}
        <div className="mx-5 border-t border-white/8 mb-3 flex-shrink-0" />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto content-scrollbar pb-4">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link flex items-center gap-3 px-3 py-2 text-[13px] transition-all
                  ${isActive
                    ? "nav-link-active rounded-md"
                    : "text-white/50 hover:text-white/90 hover:bg-white/6 rounded-md"}
                `}
              >
                <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-gray-800" : ""}`} />
                <span className={isActive ? "font-medium text-gray-900" : "font-light"}>{item.label}</span>
                {item.badge && (
                  <span className="mr-auto text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-white/8">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full outline-none">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/6 transition-colors cursor-pointer">
                <div className={`w-7 h-7 rounded-sm bg-gradient-to-br ${accentGradient} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                  {user?.full_name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-white/90 text-xs font-medium truncate leading-tight">{user?.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-white/30 text-[10px] uppercase tracking-wider">{userRole}</span>
                    {userRole === "architect" && profile?.trust_level && (
                      <span className={`text-[9px] uppercase tracking-wider font-medium ${TRUST_COLORS[profile.trust_level]}`}>
                        {TRUST_LABELS[profile.trust_level]}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-white/30 flex-shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-none border-gray-200 shadow-lg">
              <DropdownMenuItem className="text-xs text-gray-400 cursor-default" disabled>
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600 text-sm">
                <LogOut className="w-3.5 h-3.5 ml-2" />
                התנתקות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-14 bg-white border-b border-gray-100 flex flex-row items-center px-3 lg:px-6 sticky top-0 z-[100] flex-shrink-0" style={{ direction: 'ltr' }}>
          {/* Hamburger - leftmost on mobile */}
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Bell - second from left on mobile */}
          <Link
            to={createPageUrl("Notifications")}
            className="relative flex items-center justify-center w-10 h-10 hover:bg-gray-50 rounded-md transition-colors flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            <Bell className="w-4 h-4 text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="flex-1" />

          {/* Breadcrumb - right side */}
          <div className="flex items-center gap-2 text-xs text-gray-400" style={{ direction: 'rtl' }}>
            <span className="tracking-widest uppercase text-[10px] hidden sm:inline">STANNEL</span>
            <span className="text-gray-200 hidden sm:inline">/</span>
            <span className="text-gray-600 font-medium">{currentPageName?.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 content-scrollbar overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function getNavItems(role) {
  if (role === "admin") {
    return [
      { page: "AdminDashboard", label: "דשבורד", icon: LayoutDashboard },
      { page: "AdminAnalytics", label: "אנליטיקה", icon: TrendingUp },
      { page: "AdminInvoices", label: "חשבוניות", icon: FileText },
      { page: "AdminArchitects", label: "אדריכלים", icon: Ruler },
      { page: "AdminSuppliers", label: "ספקים", icon: Building2 },
      { page: "AdminPayments", label: "תשלומים", icon: CreditCard },
      { page: "ManageArchitectGoals", label: "ניהול יעדים", icon: TrendingUp },
      { page: "ManageContracts", label: "חוזים", icon: FileText },
      { page: "ManageEvents", label: "אירועים", icon: Users },
      { page: "AIInsights", label: "תובנות AI", icon: TrendingUp },
      { page: "AuditLogs", label: "לוג פעולות", icon: ClipboardList },
      { page: "Notifications", label: "התראות", icon: Bell },
    ];
  }
  if (role === "supplier") {
    return [
      { page: "SupplierDashboard", label: "דשבורד", icon: LayoutDashboard },
      { page: "SupplierInvoices", label: "חשבוניות", icon: FileText },
      { page: "SupplierPayments", label: "תשלומים", icon: CreditCard },
      { page: "ManageSupplierDetails", label: "פרטי הספק", icon: Building2 },
      { page: "ManageServiceProviders", label: "נותני שירות", icon: Users },
      { page: "AIInsights", label: "תובנות AI", icon: TrendingUp },
      { page: "Notifications", label: "התראות", icon: Bell },
    ];
  }
  if (role === "architect") {
    return [
      { page: "ArchitectDashboard", label: "דשבורד", icon: LayoutDashboard },
      { page: "ArchitectInvoices", label: "חשבוניות", icon: FileText },
      { page: "ArchitectGoals", label: "יעדים ובונוסים", icon: TrendingUp },
      { page: "ArchitectCard", label: "כרטיס STANNEL", icon: CreditCard },
      { page: "ArchitectTools", label: "כלים לאדריכלים", icon: Ruler },
      { page: "AIInsights", label: "תובנות AI", icon: TrendingUp },
      { page: "Notifications", label: "התראות", icon: Bell },
    ];
  }
  return [{ page: "Onboarding", label: "הרשמה", icon: Users }];
}