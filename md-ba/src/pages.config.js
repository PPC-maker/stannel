/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIInsights from './pages/AIInsights';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminArchitects from './pages/AdminArchitects';
import AdminDashboard from './pages/AdminDashboard';
import AdminInvoices from './pages/AdminInvoices';
import AdminPayments from './pages/AdminPayments';
import AdminSuppliers from './pages/AdminSuppliers';
import ArchitectCard from './pages/ArchitectCard';
import ArchitectDashboard from './pages/ArchitectDashboard';
import ArchitectGoals from './pages/ArchitectGoals';
import ArchitectInvoices from './pages/ArchitectInvoices';
import ArchitectTools from './pages/ArchitectTools';
import AuditLogs from './pages/AuditLogs';
import ManageArchitectGoals from './pages/ManageArchitectGoals';
import ManageContracts from './pages/ManageContracts';
import ManageEvents from './pages/ManageEvents';
import ManageServiceProviders from './pages/ManageServiceProviders';
import ManageSupplierDetails from './pages/ManageSupplierDetails';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import RateSupplier from './pages/RateSupplier';
import SupplierInvoices from './pages/SupplierInvoices';
import SupplierPayments from './pages/SupplierPayments';
import SupplierDashboard from './pages/SupplierDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "AdminAnalytics": AdminAnalytics,
    "AdminArchitects": AdminArchitects,
    "AdminDashboard": AdminDashboard,
    "AdminInvoices": AdminInvoices,
    "AdminPayments": AdminPayments,
    "AdminSuppliers": AdminSuppliers,
    "ArchitectCard": ArchitectCard,
    "ArchitectDashboard": ArchitectDashboard,
    "ArchitectGoals": ArchitectGoals,
    "ArchitectInvoices": ArchitectInvoices,
    "ArchitectTools": ArchitectTools,
    "AuditLogs": AuditLogs,
    "ManageArchitectGoals": ManageArchitectGoals,
    "ManageContracts": ManageContracts,
    "ManageEvents": ManageEvents,
    "ManageServiceProviders": ManageServiceProviders,
    "ManageSupplierDetails": ManageSupplierDetails,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "RateSupplier": RateSupplier,
    "SupplierInvoices": SupplierInvoices,
    "SupplierPayments": SupplierPayments,
    "SupplierDashboard": SupplierDashboard,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};