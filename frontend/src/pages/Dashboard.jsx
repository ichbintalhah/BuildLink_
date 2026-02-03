import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  DollarSign,
  ArrowUpRight,
  AlertTriangle,
  BookOpen,
  Users,
  Wrench,
} from "lucide-react";
import api from "../services/api";

// Sub-Pages & Components
import AdminDashboard from "./AdminDashboard";
import ContractorDashboard from "./ContractorDashboard";
import UserDashboard from "./UserDashboard";
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
        const [
          bookingsRes,
          disputesRes,
          withdrawalsRes,
          usersRes,
          contractorsRes,
        ] = await Promise.allSettled([
          api.get("/bookings/admin/all?limit=100"),
          api.get("/disputes"),
          api.get("/wallet/admin/requests"),
          api.get("/users/admin/users"),
          api.get("/users/admin/contractors"),
        ]);

        const counts = {
          payments: 0,
          withdrawals: 0,
          disputes: 0,
          bookings: 0,
          users: 0,
          contractors: 0,
        };

        // Count Bookings with Verification_Pending status
        if (bookingsRes.status === "fulfilled") {
          const bookingData = bookingsRes.value.data;
          const allBookings = Array.isArray(bookingData)
            ? bookingData
            : bookingData.bookings || [];
          counts.bookings = allBookings.length;
          counts.payments = allBookings.filter(
            (b) => b.status === "Verification_Pending"
          ).length;
        }

        // Count Disputes
        if (disputesRes.status === "fulfilled") {
          counts.disputes = (disputesRes.value.data || []).length;
        }

        // Count Withdrawals (only pending ones)
        if (withdrawalsRes.status === "fulfilled") {
          const allWithdrawals = withdrawalsRes.value.data || [];
          counts.withdrawals = allWithdrawals.filter(
            (w) => w.status === "Pending"
          ).length;
        }

        // Count Users
        if (usersRes.status === "fulfilled") {
          counts.users = (usersRes.value.data || []).length;
        }

        // Count Contractors
        if (contractorsRes.status === "fulfilled") {
          counts.contractors = (contractorsRes.value.data || []).length;
        }

        setAdminCounts(counts);
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
      label: "Payments",
      icon: <DollarSign size={20} />,
      count: adminCounts.payments,
    },
    {
      id: "withdrawals",
      label: "Withdrawals",
      icon: <ArrowUpRight size={20} />,
      count: adminCounts.withdrawals,
    },
    {
      id: "disputes",
      label: "Disputes",
      icon: <AlertTriangle size={20} />,
      count: adminCounts.disputes,
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: <BookOpen size={20} />,
      count: adminCounts.bookings,
    },
    {
      id: "users",
      label: "Users",
      icon: <Users size={20} />,
      count: adminCounts.users,
    },
    {
      id: "contractors",
      label: "Contractors",
      icon: <Wrench size={20} />,
      count: adminCounts.contractors,
    },
  ];

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
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Earnings History</h1>
          <EarningsHistory />
        </div>
      </DashboardLayout>
    );
  }

  // 3. DEFAULT: Main Dashboard based on Role
  if (user.role === "admin") {
    return (
      <DashboardLayout
        adminNavItems={adminNavItems}
        adminView={adminView}
        onAdminViewChange={setAdminView}
      >
        <AdminDashboard externalView={adminView} />
      </DashboardLayout>
    );
  }

  let content;
  if (user.role === "contractor") content = <ContractorDashboard />;
  else content = <UserDashboard />;

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default Dashboard;
