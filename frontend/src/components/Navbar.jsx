import { useContext, useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import {
  LogOut,
  Sun,
  Moon,
  Zap,
  Bell,
  Clock,
  Trash2,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ShieldAlert,
  Users,
  Menu,
  X,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [showServices, setShowServices] = useState(false);
  const [showConstructionSubmenu, setShowConstructionSubmenu] = useState(false);
  const [showMobileServices, setShowMobileServices] = useState(false);
  const [showMobileConstructionSubmenu, setShowMobileConstructionSubmenu] =
    useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifPanelStyle, setNotifPanelStyle] = useState({});
  const [scrolled, setScrolled] = useState(false);
  const notifPanelRef = useRef(null);
  const notifButtonRef = useRef(null);
  const servicesRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // ✅ SMART DETECT: Are we on the Home Page?
  const isHomePage = location.pathname === "/";

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Notifications Logic
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get("/dashboard/notifications");
        const notificationsWithTime = data.map((n) => ({
          ...n,
          timestamp: n.timestamp || new Date(n.createdAt).getTime(),
        }));
        setNotifications(notificationsWithTime);
      } catch (err) {
        // Silently fail if unauthorized (user logged out)
      }
    };

    if (user) {
      fetchNotifs();
      // Poll every 5 seconds for faster notification updates
      const interval = setInterval(fetchNotifs, 5000);
      return () => clearInterval(interval);
    }
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

  useEffect(() => {
    if (!showNotifPanel) return;

    const updateNotifPanelPosition = () => {
      if (!notifButtonRef.current) return;

      const minMargin = 8;
      const buttonRect = notifButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 640;
      const panelWidth = isMobile
        ? Math.min(620, Math.round(viewportWidth * 0.95))
        : Math.min(360, viewportWidth - minMargin * 2);

      let left = isMobile
        ? (viewportWidth - panelWidth) / 2
        : buttonRect.right - panelWidth;
      left = Math.max(minMargin, left);
      left = Math.min(left, viewportWidth - panelWidth - minMargin);

      setNotifPanelStyle({
        left: `${left}px`,
        top: `${buttonRect.bottom + 10}px`,
        width: `${panelWidth}px`,
        maxHeight: `${Math.min(420, Math.round(viewportHeight * 0.68))}px`,
      });
    };

    updateNotifPanelPosition();
    window.addEventListener("resize", updateNotifPanelPosition);
    window.addEventListener("scroll", updateNotifPanelPosition, true);

    return () => {
      window.removeEventListener("resize", updateNotifPanelPosition);
      window.removeEventListener("scroll", updateNotifPanelPosition, true);
    };
  }, [showNotifPanel]);

  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMs / 3600000)}h ago`;
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/dashboard/notifications/${notificationId}`);
      setNotifications(notifications.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error(err);
    }
  };

  // Infer notification category from message text (fallback for older notifications without notifCategory)
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

    setShowNotifPanel(false);

    // Determine category — use stored value, or infer from message text
    const category =
      notification.notifCategory && notification.notifCategory !== "general"
        ? notification.notifCategory
        : inferCategoryFromMessage(notification.message);
    const bookingId = notification.relatedBooking || notification.relatedId;
    const role = user?.role;

    const navState = {
      fromNotification: true,
      notifCategory: category,
      bookingId: bookingId,
      notificationId: notification._id,
      timestamp: Date.now(),
    };

    // Admin routing — admin uses tab views inside AdminDashboard, not separate pages
    if (role === "admin") {
      const targetTab = getAdminTabForCategory(category);
      navigate("/dashboard", {
        state: { ...navState, adminView: targetTab },
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

    navigate("/dashboard", { state: navState });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Reset mobile-only dropdown state when the drawer closes.
  useEffect(() => {
    if (!mobileMenuOpen) {
      setShowMobileServices(false);
      setShowMobileConstructionSubmenu(false);
    }
  }, [mobileMenuOpen]);

  // Close services dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) {
        setShowServices(false);
        setShowConstructionSubmenu(false);
      }
    };
    if (showServices) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showServices]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  // --- MENU ITEMS ---
  const publicNavLinkClass = isHomePage
    ? "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 hover:underline hover:underline-offset-4 decoration-slate-400 dark:decoration-slate-200 transition-colors duration-200"
    : "transition-colors duration-200 hover:text-primary";

  const publicServicesButtonClass = isHomePage
    ? "btn btn-ghost normal-case inline-flex items-center gap-1 h-full text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-500/10 dark:hover:bg-slate-300/10 hover:underline hover:underline-offset-4 decoration-slate-400 dark:decoration-slate-200 hover:scale-105 transition-all duration-200 text-lg"
    : "btn btn-ghost normal-case inline-flex items-center gap-1 h-full hover:scale-105 transition-all duration-200 hover:text-primary text-lg";

  const renderLinks = () => {
    if (user?.role === "admin") {
      return (
        <>
          <li>
            <Link to="/dashboard" className="font-bold text-primary">
              <LayoutDashboard size={18} /> Admin Control
            </Link>
          </li>
        </>
      );
    }
    if (user?.role === "contractor") {
      return (
        <>
          <li>
            <Link to="/dashboard" className="font-bold text-primary">
              <LayoutDashboard size={18} /> Workspace
            </Link>
          </li>
          <li>
            <Link to="/profile">Profile</Link>
          </li>
        </>
      );
    }
    return (
      <>
        <li>
          <Link
            to="/"
            className={publicNavLinkClass}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Home
          </Link>
        </li>
        <li className="relative" ref={servicesRef}>
          <button
            type="button"
            className={publicServicesButtonClass}
            onClick={() => {
              setShowServices((open) => !open);
              setShowConstructionSubmenu(false);
            }}
          >
            Services
            <ChevronDown
              size={16}
              className={`transition-all duration-300 ${
                showServices
                  ? isHomePage
                    ? "rotate-180 text-slate-600 dark:text-slate-300"
                    : "rotate-180 text-primary"
                  : isHomePage
                    ? "text-slate-500 dark:text-slate-300"
                    : ""
              }`}
            />
          </button>
          {showServices && (
            <ul className="absolute left-0 top-full mt-1 w-60 p-2 bg-base-100 rounded-box shadow-2xl border border-base-300 z-50 animate-in fade-in slide-in-from-top-4 duration-300 origin-top">
              <li
                onClick={() => {
                  setShowServices(false);
                  setShowConstructionSubmenu(false);
                }}
                className="animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ animationDelay: "50ms" }}
              >
                <Link
                  to="/services/modification"
                  className="hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 rounded-lg"
                >
                  Modification
                </Link>
              </li>
              <li
                onClick={() => {
                  setShowServices(false);
                  setShowConstructionSubmenu(false);
                }}
                className="animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ animationDelay: "100ms" }}
              >
                <Link
                  to="/services/renovation"
                  className="hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 rounded-lg"
                >
                  Renovation
                </Link>
              </li>
              <li
                className="relative animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ animationDelay: "150ms" }}
              >
                <div className="flex items-center justify-between gap-2 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 rounded-lg">
                  <Link
                    to="/services/construction"
                    onClick={() => {
                      setShowServices(false);
                      setShowConstructionSubmenu(false);
                    }}
                    className="flex-1"
                  >
                    Construction
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConstructionSubmenu((open) => !open);
                    }}
                    aria-label="Toggle Construction submenu"
                  >
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-300 ${
                        showConstructionSubmenu ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
                {showConstructionSubmenu && (
                  <ul className="absolute top-0 left-full ml-1 w-60 p-2 bg-base-100 rounded-box shadow-2xl border border-base-300 z-[60] animate-in fade-in slide-in-from-left-4 zoom-in-95 duration-300">
                    <li
                      onClick={() => {
                        setShowServices(false);
                        setShowConstructionSubmenu(false);
                      }}
                      className="animate-in fade-in slide-in-from-left-2 duration-200"
                      style={{ animationDelay: "50ms" }}
                    >
                      <Link
                        to="/services/construction"
                        className="hover:bg-gradient-to-r hover:from-secondary/10 hover:to-transparent transition-all duration-200 rounded-lg"
                      >
                        General Construction
                      </Link>
                    </li>
                    <li
                      onClick={() => {
                        setShowServices(false);
                        setShowConstructionSubmenu(false);
                      }}
                      className="animate-in fade-in slide-in-from-left-2 duration-200"
                      style={{ animationDelay: "100ms" }}
                    >
                      <Link
                        to="/services/heavy-duty-construction"
                        className="hover:bg-gradient-to-r hover:from-secondary/10 hover:to-transparent transition-all duration-200 rounded-lg"
                      >
                        Heavy Duty Construction
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          )}
        </li>
        <li>
          <Link to="/find-pro" className={publicNavLinkClass}>
            Find Pro AI
          </Link>
        </li>
        <li>
          <Link to="/ai-estimator" className="text-accent font-bold">
            <Zap size={16} className="fill-current" /> AI Assistant
          </Link>
        </li>
        <li>
          <Link to="/contact" className={publicNavLinkClass}>
            Contact Us
          </Link>
        </li>
      </>
    );
  };

  return (
    // ✅ SMART POSITIONING:
    // If Home Page: 'fixed' (Transparent).
    // If Other Page: 'sticky' (Solid & Pushes content down).
    <div
      className={`navbar z-50 px-4 md:px-10 transition-all duration-300 anim-fade-down
      ${
        isHomePage
          ? `fixed top-0 ${
              scrolled
                ? "bg-base-100/95 backdrop-blur shadow-md"
                : "bg-transparent"
            }`
          : "sticky top-0 bg-base-100 shadow-sm"
      }
    `}
    >
      <div className="navbar-start min-w-0">
        {/* Hamburger Menu Button - Mobile Only */}
        <button
          className="btn btn-ghost btn-circle lg:hidden mr-2"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center min-w-0 transition-colors duration-300 hover:text-primary-focus select-none anim-slide-left anim-delay-100"
        >
          <BrandLogo
            iconSize={28}
            textSize="hidden sm:inline text-xl md:text-3xl"
            iconClassName="text-primary"
            textClassName="text-primary"
          />
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2 font-medium text-lg anim-fade-up anim-delay-200">
          {renderLinks()}
        </ul>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-0 right-0 bg-base-100 shadow-xl border-t border-base-300 lg:hidden z-50 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-4 duration-300"
        >
          <div className="p-4">
            {user?.role === "admin" ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-base-200 transition-colors font-bold text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} /> Admin Control
                </Link>
              </>
            ) : user?.role === "contractor" ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-base-200 transition-colors font-bold text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} /> Workspace
                </Link>
                <Link
                  to="/profile"
                  className="block p-3 rounded-lg hover:bg-base-200 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="block p-3 rounded-lg hover:bg-base-200 transition-colors"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setMobileMenuOpen(false);
                  }}
                >
                  Home
                </Link>

                {/* Mobile Services Dropdown */}
                <div className="mt-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-base-200 transition-colors"
                    onClick={() => {
                      setShowMobileServices((open) => !open);
                      setShowMobileConstructionSubmenu(false);
                    }}
                  >
                    <span>Services</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        showMobileServices ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {showMobileServices && (
                    <div className="ml-4 mt-2 space-y-1">
                      <Link
                        to="/services/modification"
                        className="block p-2 rounded-lg hover:bg-base-200 transition-colors text-sm"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setShowMobileServices(false);
                        }}
                      >
                        Modification
                      </Link>
                      <Link
                        to="/services/renovation"
                        className="block p-2 rounded-lg hover:bg-base-200 transition-colors text-sm"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setShowMobileServices(false);
                        }}
                      >
                        Renovation
                      </Link>

                      {/* Construction Submenu */}
                      <div>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors text-sm"
                          onClick={() =>
                            setShowMobileConstructionSubmenu((open) => !open)
                          }
                        >
                          <span>Construction</span>
                          <ChevronRight
                            size={14}
                            className={`transition-transform duration-300 ${
                              showMobileConstructionSubmenu ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        {showMobileConstructionSubmenu && (
                          <div className="ml-4 mt-1 space-y-1">
                            <Link
                              to="/services/construction"
                              className="block p-2 rounded-lg hover:bg-base-200 transition-colors text-xs"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setShowMobileServices(false);
                                setShowMobileConstructionSubmenu(false);
                              }}
                            >
                              General Construction
                            </Link>
                            <Link
                              to="/services/heavy-duty-construction"
                              className="block p-2 rounded-lg hover:bg-base-200 transition-colors text-xs"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setShowMobileServices(false);
                                setShowMobileConstructionSubmenu(false);
                              }}
                            >
                              Heavy Duty Construction
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/find-pro"
                  className="block p-3 rounded-lg hover:bg-base-200 transition-colors mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Pro AI
                </Link>
                <Link
                  to="/ai-estimator"
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-base-200 transition-colors text-accent font-bold mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Zap size={16} className="fill-current" /> AI Assistant
                </Link>
                <Link
                  to="/contact"
                  className="block p-3 rounded-lg hover:bg-base-200 transition-colors mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact Us
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="navbar-end gap-2 sm:gap-3 flex-nowrap anim-slide-right anim-delay-200">
        <label className="swap swap-rotate shrink-0 hover:text-primary transition-all duration-300 hover:scale-110 cursor-pointer">
          <input
            type="checkbox"
            onChange={toggleTheme}
            checked={theme === "dark"}
          />
          <Sun className="swap-on w-6 h-6 animate-in spin-in-180 duration-500" />
          <Moon className="swap-off w-6 h-6 animate-in spin-in-180 duration-500" />
        </label>

        {user ? (
          <>
            {/* Bell Icon */}
            <div className="relative">
              <button
                ref={notifButtonRef}
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="btn btn-ghost btn-circle relative hover:bg-base-200 hover:scale-110 transition-all duration-200 focus:outline-2 focus:outline-offset-2 focus:outline-primary hover:shadow-lg"
              >
                <div className="indicator">
                  <Bell
                    size={24}
                    className={
                      unreadCount > 0
                        ? "text-primary animate-pulse drop-shadow-lg"
                        : "opacity-70 hover:opacity-100 transition-opacity"
                    }
                  />
                  {unreadCount > 0 && (
                    <span className="badge badge-sm badge-error indicator-item text-white animate-in zoom-in-50 duration-300 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>

              {showNotifPanel &&
                createPortal(
                  <>
                    <button
                      type="button"
                      aria-label="Close notifications"
                      className="fixed inset-0 bg-base-content/35 backdrop-blur-[1px] z-[170]"
                      onClick={() => setShowNotifPanel(false)}
                    />

                    <div
                      ref={notifPanelRef}
                      className="fixed bg-base-100 rounded-2xl border border-base-200 overflow-hidden z-[180] shadow-[0_26px_65px_-24px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300"
                      style={{
                        ...notifPanelStyle,
                        transformOrigin: "top right",
                      }}
                    >
                      <div className="px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent font-semibold border-b border-base-200 flex justify-between items-center animate-in slide-in-from-top-2 duration-200">
                        <span className="flex items-center gap-2">
                          <Bell size={18} className="text-primary" />
                          Notifications
                        </span>
                        {notifications.length > 0 && (
                          <span
                            className="text-xs badge badge-primary animate-in zoom-in-50 duration-300"
                            style={{ animationDelay: "100ms" }}
                          >
                            {notifications.length}
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-y-auto overscroll-contain scroll-smooth p-2 sm:p-3"
                        style={{ maxHeight: "min(360px, calc(72vh - 56px))" }}
                      >
                        {notifications.length === 0 ? (
                          <p className="text-center opacity-60 text-sm py-7 animate-in fade-in duration-300">
                            No notifications
                          </p>
                        ) : (
                          notifications.map((n, index) => (
                            <div
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className="px-3 py-3 border-b border-base-200/80 last:border-b-0 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent flex justify-between items-start gap-2 group rounded-lg transition-all cursor-pointer hover:shadow-sm animate-in fade-in slide-in-from-right-2"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="text-sm flex-1 min-w-0">
                                <p
                                  className={
                                    !n.isRead
                                      ? "font-semibold text-primary leading-relaxed whitespace-normal break-words"
                                      : "leading-relaxed whitespace-normal break-words text-base-content/90"
                                  }
                                >
                                  {n.message}
                                </p>
                                <span className="text-xs opacity-60 inline-flex items-center gap-1 mt-2">
                                  <Clock size={10} />{" "}
                                  {getRelativeTime(n.timestamp)}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id);
                                }}
                                className="btn btn-ghost btn-xs text-error opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ml-1 hover:bg-error/10 transition-all duration-200 hover:scale-105"
                                title="Delete notification"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>,
                  document.body,
                )}
            </div>

            {/* Profile */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar placeholder border border-base-300 hover:scale-110 hover:shadow-lg transition-all duration-200 hover:border-primary"
              >
                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center overflow-hidden">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold">
                      {user.fullName[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-300 animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300"
                style={{ transformOrigin: "top right" }}
              >
                <li className="menu-title px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-primary">Logged in as {user.role}</span>
                </li>
                <li
                  className="animate-in fade-in slide-in-from-right-2 duration-200"
                  style={{ animationDelay: "50ms" }}
                >
                  <Link
                    to="/dashboard"
                    className="hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 hover:scale-105 hover:translate-x-1"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                </li>
                <li
                  className="animate-in fade-in slide-in-from-right-2 duration-200"
                  style={{ animationDelay: "100ms" }}
                >
                  <Link
                    to="/profile"
                    className="hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 hover:scale-105 hover:translate-x-1"
                  >
                    <Users size={16} />
                    Profile
                  </Link>
                </li>
                <div
                  className="divider my-1 animate-in fade-in duration-200"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <li
                  className="animate-in fade-in slide-in-from-right-2 duration-200"
                  style={{ animationDelay: "200ms" }}
                >
                  <button
                    onClick={handleLogout}
                    className="text-error hover:bg-gradient-to-r hover:from-error/10 hover:to-transparent transition-all duration-200 hover:scale-105 hover:translate-x-1"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/login"
              className="btn btn-ghost btn-xs sm:btn-md px-2 sm:px-4 hover:bg-base-200 transition-colors duration-300 text-[11px] sm:text-base whitespace-nowrap"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="btn btn-primary btn-xs sm:btn-md px-2 sm:px-4 text-white hover:brightness-110 transition-all duration-300 text-[11px] sm:text-base whitespace-nowrap"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
