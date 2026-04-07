import { useContext, useState, useEffect, useRef } from "react";
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
  MessageCircle,
} from "lucide-react";
import api from "../services/api";
import BrandLogo from "./BrandLogo";

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
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

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

  const fetchUnreadMessages = async () => {
    try {
      const { data } = await api.get("/messages/unread/count");
      setUnreadMessagesCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch unread messages:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    fetchUnreadMessages();

    // Poll every 5 seconds for faster notification updates
    const notifInterval = setInterval(() => {
      if (!user) return;
      fetchNotifications();
      fetchUnreadMessages();
    }, 5000);

    return () => clearInterval(notifInterval);
  }, [user]);

  // Auto-close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };

    if (showNotifPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifPanel]);

  // Close mobile drawer on route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent page scroll while mobile drawer is open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

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

  // Infer notification category from message text (fallback for notifications without notifCategory)
  const inferCategoryFromMessage = (message) => {
    if (!message) return "general";
    const msg = message.toLowerCase();
    if (
      msg.includes("dispute") &&
      (msg.includes("resolved") || msg.includes("settlement"))
    )
      return "dispute_resolved";
    if (msg.includes("dispute") && msg.includes("defense"))
      return "dispute_defense";
    if (msg.includes("dispute")) return "dispute_created";
    if (msg.includes("withdrawal") && msg.includes("approved"))
      return "withdrawal_approved";
    if (msg.includes("withdrawal") && msg.includes("rejected"))
      return "withdrawal_rejected";
    if (msg.includes("withdrawal") && msg.includes("processed"))
      return "withdrawal_processed";
    if (msg.includes("withdrawal")) return "withdrawal_request";
    if (msg.includes("payment") && msg.includes("approved"))
      return "payment_approved";
    if (msg.includes("payment") && msg.includes("rejected"))
      return "payment_rejected";
    if (msg.includes("payment") && msg.includes("released"))
      return "payment_released";
    if (
      msg.includes("payment") &&
      (msg.includes("verification") ||
        msg.includes("uploaded") ||
        msg.includes("screenshot"))
    )
      return "payment_verification";
    if (msg.includes("message") || msg.includes("sent you")) return "message";
    if (msg.includes("booking") && msg.includes("accepted"))
      return "booking_accepted";
    if (msg.includes("booking") && msg.includes("rejected"))
      return "booking_rejected";
    if (
      msg.includes("booking") ||
      msg.includes("new job") ||
      msg.includes("new request")
    )
      return "booking_request";
    if (msg.includes("milestone") && msg.includes("completed"))
      return "milestone_completion";
    if (msg.includes("completed") || msg.includes("auto-complete"))
      return "auto_complete";
    if (msg.includes("refund")) return "refund";
    return "general";
  };

  // Map notifCategory to admin tab name
  const getAdminTabForCategory = (category) => {
    switch (category) {
      case "payment_verification":
      case "payment_approved":
      case "payment_rejected":
        return "payments";
      case "withdrawal_request":
      case "withdrawal_processed":
      case "withdrawal_approved":
      case "withdrawal_rejected":
        return "withdrawals";
      case "dispute_created":
      case "dispute_defense":
      case "dispute_resolved":
        return "disputes";
      case "booking_request":
      case "booking_accepted":
      case "booking_rejected":
      case "job_completion":
      case "milestone_completion":
      case "auto_complete":
        return "bookings";
      default:
        return "payments";
    }
  };

  // Mark notification as read and navigate to the relevant section
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read via API
      if (!notification.isRead) {
        await api.put(`/dashboard/notifications/${notification._id}/read`);
        setNotifications(
          notifications.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }

    // Close notification panel
    setShowNotifPanel(false);

    // Determine category — use stored value, or infer from message text
    const category =
      notification.notifCategory && notification.notifCategory !== "general"
        ? notification.notifCategory
        : inferCategoryFromMessage(notification.message);
    const bookingId = notification.relatedBooking || notification.relatedId;
    const role = user?.role;

    // Build navigation state
    const navState = {
      fromNotification: true,
      notifCategory: category,
      bookingId: bookingId,
      notificationId: notification._id,
      timestamp: Date.now(),
    };

    // Admin-specific routing — admin uses tab views inside AdminDashboard
    if (role === "admin") {
      const targetTab = getAdminTabForCategory(category);

      // Directly switch the admin tab (works immediately, no navigation needed)
      if (onAdminViewChange) onAdminViewChange(targetTab);

      // Also update location.state so AdminDashboard can scroll to the correct card
      navigate("/dashboard", {
        state: { ...navState, adminView: targetTab },
        replace: true,
      });
      return;
    }

    // --- Non-admin routing (user / contractor) ---
    if (category === "message") {
      navigate("/dashboard/messages", { state: navState });
      return;
    }

    if (
      category === "dispute_created" ||
      category === "dispute_defense" ||
      category === "dispute_resolved"
    ) {
      navigate("/dashboard/disputes", { state: navState });
      return;
    }

    if (
      category === "withdrawal_approved" ||
      category === "withdrawal_rejected" ||
      category === "payment_released"
    ) {
      navigate("/dashboard/earnings", { state: navState });
      return;
    }

    // Default: navigate to dashboard with booking highlight
    navigate("/dashboard", { state: navState });
  };

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isHeavyDutyContractor =
    user?.role === "contractor" &&
    user?.skill?.toLowerCase?.().includes("heavy duty");

  const menus = {
    user: [
      {
        name: "My Bookings",
        path: "/dashboard",
        icon: <Briefcase size={20} />,
      },
      {
        name: "Wallet & History",
        path: "/dashboard/earnings",
        icon: <DollarSign size={20} />,
      },
      {
        name: "Messages",
        path: "/dashboard/messages",
        icon: <MessageCircle size={20} />,
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
      ...(isHeavyDutyContractor
        ? [
            {
              name: "Messages",
              path: "/dashboard/messages",
              icon: <MessageCircle size={20} />,
            },
          ]
        : []),
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
        } hidden md:flex bg-neutral text-neutral-content transition-all duration-300 flex-col shadow-2xl z-20 anim-slide-left`}
      >
        <div className="p-4 flex items-center justify-between border-b border-neutral-focus">
          <BrandLogo
            showText={isSidebarOpen}
            iconSize={20}
            textSize="text-xl"
            iconClassName="text-primary"
            textClassName="text-neutral-content"
          />
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
                  {isSidebarOpen && item.showBadge !== false && (
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
              <div className="relative">
                {item.icon}
                {item.path === "/dashboard/messages" &&
                  unreadMessagesCount > 0 && (
                    <span className="absolute -top-2 -right-2 badge badge-error badge-xs">
                      {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                    </span>
                  )}
              </div>
              {isSidebarOpen && (
                <div className="flex items-center gap-2">
                  <span>{item.name}</span>
                  {item.path === "/dashboard/messages" &&
                    unreadMessagesCount > 0 && (
                      <span className="badge badge-error badge-xs">
                        {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                      </span>
                    )}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-focus">
          <button
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
            className="flex items-center gap-4 text-error hover:text-red-400 transition-colors w-full p-2"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-neutral text-neutral-content shadow-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-neutral-focus">
              <BrandLogo
                showText={true}
                iconSize={20}
                textSize="text-xl"
                iconClassName="text-primary"
                textClassName="text-neutral-content"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-focus transition-all text-neutral-content/70 hover:text-white"
              >
                <Home size={20} />
                <span>Back to Home</span>
              </Link>

              <div className="divider my-2 border-neutral-focus"></div>

              {adminNavItems && adminNavItems.length > 0 && (
                <>
                  {adminNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onAdminViewChange && onAdminViewChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all justify-between ${
                        adminView === item.id
                          ? "bg-primary text-primary-content shadow-md"
                          : "hover:bg-neutral-focus text-neutral-content/70 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.showBadge !== false && (
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

              {currentMenu.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                    location.pathname === item.path
                      ? "bg-primary text-primary-content shadow-md"
                      : "hover:bg-neutral-focus"
                  }`}
                >
                  <div className="relative">
                    {item.icon}
                    {item.path === "/dashboard/messages" &&
                      unreadMessagesCount > 0 && (
                        <span className="absolute -top-2 -right-2 badge badge-error badge-xs">
                          {unreadMessagesCount > 99
                            ? "99+"
                            : unreadMessagesCount}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{item.name}</span>
                    {item.path === "/dashboard/messages" &&
                      unreadMessagesCount > 0 && (
                        <span className="badge badge-error badge-xs">
                          {unreadMessagesCount > 99
                            ? "99+"
                            : unreadMessagesCount}
                        </span>
                      )}
                  </div>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-neutral-focus">
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                  navigate("/login", { replace: true });
                }}
                className="flex items-center gap-4 text-error hover:text-red-400 transition-colors w-full p-2"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-base-100 shadow-sm flex justify-between items-center px-6 z-10 shrink-0 anim-fade-down anim-delay-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="btn btn-ghost btn-sm btn-circle md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <h2 className="text-xl font-bold opacity-70 capitalize">
              {user?.role} Dashboard
            </h2>
          </div>

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
              <button
                type="button"
                aria-label="Close notifications"
                className="fixed inset-0 bg-base-content/30 backdrop-blur-[1px] z-[110] md:hidden"
                onClick={() => setShowNotifPanel(false)}
              />
            )}

            {showNotifPanel && (
              <div
                ref={notifPanelRef}
                className="fixed left-1/2 top-[calc(4rem+0.75rem)] w-[92vw] max-w-xl -translate-x-1/2 bg-base-100 rounded-xl border border-base-200 overflow-hidden z-[120] shadow-[0_22px_55px_-22px_rgba(0,0,0,0.55)] md:absolute md:right-0 md:left-auto md:top-auto md:mt-2 md:w-[26rem] md:max-w-none md:translate-x-0"
              >
                <div className="p-3 bg-base-200 font-bold border-b flex justify-between items-center">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge badge-primary badge-sm">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="max-h-[65vh] md:max-h-56 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <p className="text-center opacity-50 text-sm py-4">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 border-b border-base-200 hover:bg-base-200/50 transition-colors flex gap-3 justify-between items-start group rounded-lg cursor-pointer ${
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
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n._id);
                          }}
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
        <div className="flex-1 overflow-y-auto p-6 bg-base-200 anim-fade-up anim-delay-200">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
