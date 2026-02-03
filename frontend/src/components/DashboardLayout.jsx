import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  ShieldAlert,
  LogOut,
  User,
  Bell,
  Menu,
  X,
  Home,
  Clock,
  Trash2,
} from "lucide-react";
import api from "../services/api";

const DashboardLayout = ({
  children,
  adminNavItems = null,
  adminView = null,
  onAdminViewChange = null,
}) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/dashboard/notifications");
      const notificationsWithTime = data.map((n) => ({
        ...n,
        timestamp: n.timestamp || new Date(n.createdAt).getTime(),
      }));
      setNotifications(notificationsWithTime);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
    // Poll every 5 seconds for faster notification updates
    const notifInterval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(notifInterval);
  }, [user]);

  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/dashboard/notifications/${notificationId}`);
      setNotifications(notifications.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const menus = {
    user: [
      {
        name: "My Bookings",
        path: "/dashboard",
        icon: <Briefcase size={20} />,
      },
      { name: "Profile Settings", path: "/profile", icon: <User size={20} /> },
      {
        name: "Disputes",
        path: "/dashboard/disputes",
        icon: <ShieldAlert size={20} />,
      },
    ],
    contractor: [
      {
        name: "Workspace",
        path: "/dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: "Earnings",
        path: "/dashboard/earnings",
        icon: <DollarSign size={20} />,
      },
      { name: "Profile", path: "/profile", icon: <User size={20} /> },
      {
        name: "Disputes",
        path: "/dashboard/disputes",
        icon: <ShieldAlert size={20} />,
      },
    ],
    admin: [],
  };

  const currentMenu = menus[user?.role] || [];

  return (
    <div className="flex h-screen bg-base-200 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-neutral text-neutral-content transition-all duration-300 flex flex-col shadow-2xl z-20`}
      >
        <div className="p-4 flex items-center justify-between border-b border-neutral-focus">
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-wider">BuildLink</span>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-focus transition-all text-neutral-content/70 hover:text-white"
          >
            <Home size={20} />
            {isSidebarOpen && <span>Back to Home</span>}
          </Link>

          <div className="divider my-2 border-neutral-focus"></div>

          {/* Admin Filter Navigation (only for admin users) */}
          {adminNavItems && adminNavItems.length > 0 && (
            <>
              {adminNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    onAdminViewChange && onAdminViewChange(item.id)
                  }
                  className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all justify-between ${
                    adminView === item.id
                      ? "bg-primary text-primary-content shadow-md"
                      : "hover:bg-neutral-focus text-neutral-content/70 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {item.icon}
                    {isSidebarOpen && <span>{item.label}</span>}
                  </div>
                  {isSidebarOpen && (
                    <span
                      className={`badge badge-sm font-bold ${
                        adminView === item.id
                          ? "badge-secondary"
                          : "badge-primary"
                      }`}
                    >
                      {item.count || 0}
                    </span>
                  )}
                </button>
              ))}
              <div className="divider my-2 border-neutral-focus"></div>
            </>
          )}

          {/* Regular Navigation Items (for non-admin or additional menu items) */}
          {currentMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                location.pathname === item.path
                  ? "bg-primary text-primary-content shadow-md"
                  : "hover:bg-neutral-focus"
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-focus">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-4 text-error hover:text-red-400 transition-colors w-full p-2"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-base-100 shadow-sm flex justify-between items-center px-6 z-10 shrink-0">
          <h2 className="text-xl font-bold opacity-70 capitalize">
            {user?.role} Dashboard
          </h2>

          <div className="relative">
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="btn btn-ghost btn-circle relative"
            >
              <div className="indicator">
                <Bell
                  size={24}
                  className={
                    unreadCount > 0
                      ? "text-primary fill-current animate-pulse"
                      : "opacity-70"
                  }
                />
                {unreadCount > 0 && (
                  <span className="badge badge-sm badge-error indicator-item text-white font-bold border-2 border-base-100 shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            </button>

            {showNotifPanel && (
              <div className="absolute right-0 mt-2 w-80 bg-base-100 shadow-2xl rounded-xl border border-base-200 overflow-hidden z-50">
                <div className="p-3 bg-base-200 font-bold border-b flex justify-between items-center">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge badge-primary badge-sm">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <p className="text-center opacity-50 text-sm py-4">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`p-3 border-b border-base-200 hover:bg-base-200/50 transition-colors flex gap-3 justify-between items-start group rounded-lg ${
                          !n.isRead ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              !n.isRead ? "font-bold" : "font-medium"
                            } text-base-content`}
                          >
                            {n.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-50">
                            <Clock size={12} />
                            {getRelativeTime(n.timestamp)}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteNotification(n._id)}
                          className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity text-error"
                          title="Remove notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-base-200">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
