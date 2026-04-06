import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  DollarSign,
  ArrowUpRight,
  AlertTriangle,
  BookOpen,
  History,
  Users,
  Wrench,
  Settings,
  BarChart3,
} from "lucide-react";
import api from "../services/api";

// Sub-Pages & Components
import AdminDashboard from "./AdminDashboard";
import ContractorDashboard from "./ContractorDashboard";
import ContractorMessages from "./ContractorMessages";
import UserDashboard from "./UserDashboard";
import UserMessages from "./UserMessages";
import DisputesPage from "./DisputesPage";
import EarningsHistory from "../components/EarningsHistory"; // ✅ Import Earnings Component

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [adminView, setAdminView] = useState("payments");
  const [adminCounts, setAdminCounts] = useState({
    payments: 0,
    withdrawals: 0,
    disputes: 0,
    bookings: 0,
    users: 0,
    contractors: 0,
  });

  if (!user)
    return <div className="p-10 text-center">Loading User Profile...</div>;

  // Fetch admin counts
  useEffect(() => {
    if (user?.role !== "admin") return;

    const fetchCounts = async () => {
      try {
        const { data } = await api.get("/dashboard/admin/counts");
        setAdminCounts({
          payments: data?.payments || 0,
          withdrawals: data?.withdrawals || 0,
          disputes: data?.disputes || 0,
          bookings: data?.bookings || 0,
          users: data?.users || 0,
          contractors: data?.contractors || 0,
        });
      } catch (error) {
        console.error("Error fetching admin counts:", error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Admin filter navigation items
  const adminNavItems = [
    {
      id: "payments",
      label: "Pay Approvals",
      icon: <DollarSign size={20} />,
      count: adminCounts.payments,
      showBadge: true,
    },
    {
      id: "withdrawals",
      label: "Withdrawals",
      icon: <ArrowUpRight size={20} />,
      count: adminCounts.withdrawals,
      showBadge: true,
    },
    {
      id: "disputes",
      label: "Disputes",
      icon: <AlertTriangle size={20} />,
      count: adminCounts.disputes,
      showBadge: true,
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: <BookOpen size={20} />,
      count: adminCounts.bookings,
      showBadge: true,
    },
    {
      id: "users",
      label: "Users",
      icon: <Users size={20} />,
      count: adminCounts.users,
      showBadge: true,
    },
    {
      id: "contractors",
      label: "Contractors",
      icon: <Wrench size={20} />,
      count: adminCounts.contractors,
      showBadge: true,
    },
    {
      id: "finance-history",
      label: "History",
      icon: <History size={20} />,
      showBadge: false,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart3 size={20} />,
      showBadge: false,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={20} />,
      showBadge: false,
    },
  ];

  // --- NOTIFICATION NAVIGATION STATE ---
  // Store notification state separately so it persists through re-renders
  // and can be cleared after being consumed by the child dashboard.
  const [notifState, setNotifState] = useState({});

  // When location.state changes (from notification click), capture it
  useEffect(() => {
    const locState = location.state;
    if (!locState) return;

    // Allow direct navigation to a specific admin tab from links/buttons.
    if (locState.adminView && user?.role === "admin") {
      setAdminView(locState.adminView);
    }

    if (locState.fromNotification) {
      setNotifState({ ...locState });

      // Clear location.state so refreshing the page doesn't re-trigger
      window.history.replaceState({}, "");
      return;
    }

    if (locState.adminView) {
      // Clear one-time route state after applying admin tab navigation.
      window.history.replaceState({}, "");
    }
  }, [location.state, location.key, user?.role]);

  // --- ROUTING LOGIC ---

  // 1. Check for Disputes Page
  if (location.pathname.includes("/disputes")) {
    return (
      <DashboardLayout>
        <DisputesPage />
      </DashboardLayout>
    );
  }

  // 2. ✅ FIX: Check for Earnings Page
  if (location.pathname.includes("/earnings")) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <EarningsHistory />
        </div>
      </DashboardLayout>
    );
  }

  // 3. ✅ Check for Messages Page
  if (location.pathname.includes("/messages")) {
    return (
      <DashboardLayout>
        {user.role === "contractor" ? <ContractorMessages /> : <UserMessages />}
      </DashboardLayout>
    );
  }

  // 4. DEFAULT: Main Dashboard based on Role
  if (user.role === "admin") {
    return (
      <DashboardLayout
        adminNavItems={adminNavItems}
        adminView={adminView}
        onAdminViewChange={setAdminView}
      >
        <AdminDashboard externalView={adminView} notifState={notifState} />
      </DashboardLayout>
    );
  }

  let content;
  if (user.role === "contractor")
    content = <ContractorDashboard notifState={notifState} />;
  else content = <UserDashboard notifState={notifState} />;

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default Dashboard;
