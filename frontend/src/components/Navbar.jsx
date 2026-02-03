import { useContext, useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import {
  LogOut,
  Sun,
  Moon,
  Hammer, // ✅ Original Hammer Icon
  Zap,
  Bell,
  Clock,
  Trash2,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from "lucide-react";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [showServices, setShowServices] = useState(false);
  const [showConstructionSubmenu, setShowConstructionSubmenu] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifPanelRef = useRef(null);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // --- MENU ITEMS ---
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
          <Link to="/">Home</Link>
        </li>
        <li
          className="relative"
          onMouseEnter={() => setShowServices(true)}
          onMouseLeave={() => {
            setShowServices(false);
            setShowConstructionSubmenu(false);
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm normal-case inline-flex items-center gap-1 h-full"
            onClick={() => setShowServices((open) => !open)}
          >
            Services
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showServices ? "rotate-180" : ""
              }`}
            />
          </button>
          {showServices && (
            <ul className="absolute left-0 mt-2 w-60 p-2 bg-base-100 rounded-box shadow-lg z-50">
              <li
                onClick={() => {
                  setShowServices(false);
                  setShowConstructionSubmenu(false);
                }}
              >
                <Link to="/services/modification">Modification</Link>
              </li>
              <li
                onClick={() => {
                  setShowServices(false);
                  setShowConstructionSubmenu(false);
                }}
              >
                <Link to="/services/renovation">Renovation</Link>
              </li>
              <li
                className="relative"
                onMouseEnter={() => setShowConstructionSubmenu(true)}
                onMouseLeave={() => setShowConstructionSubmenu(false)}
              >
                <div className="flex items-center justify-between gap-2">
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
                    className="btn btn-ghost btn-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConstructionSubmenu((open) => !open);
                    }}
                    aria-label="Toggle Construction submenu"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                {showConstructionSubmenu && (
                  <ul className="absolute top-0 left-full ml-2 w-60 p-2 bg-base-100 rounded-box shadow-lg z-[60]">
                    <li
                      onClick={() => {
                        setShowServices(false);
                        setShowConstructionSubmenu(false);
                      }}
                    >
                      <Link to="/services/construction">
                        General Construction
                      </Link>
                    </li>
                    <li
                      onClick={() => {
                        setShowServices(false);
                        setShowConstructionSubmenu(false);
                      }}
                    >
                      <Link to="/services/heavy-duty-construction">
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
          <Link to="/find-pro">Find Pro AI</Link>
        </li>
        <li>
          <Link to="/ai-estimator" className="text-accent font-bold">
            <Zap size={16} className="fill-current" /> AI Assistant
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
      className={`navbar z-50 px-4 md:px-10 transition-all duration-300
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
      <div className="navbar-start">
        <Link
          to="/"
          className="btn btn-ghost text-2xl font-bold text-primary gap-2"
        >
          <Hammer size={24} className="fill-current" /> BuildLink
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2 font-medium">
          {renderLinks()}
        </ul>
      </div>

      <div className="navbar-end gap-3">
        <label className="swap swap-rotate hover:text-primary">
          <input
            type="checkbox"
            onChange={toggleTheme}
            checked={theme === "dark"}
          />
          <Sun className="swap-on w-6 h-6" />
          <Moon className="swap-off w-6 h-6" />
        </label>

        {user ? (
          <>
            {/* Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="btn btn-ghost btn-circle relative hover:bg-base-200 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              >
                <div className="indicator">
                  <Bell
                    size={24}
                    className={
                      unreadCount > 0
                        ? "text-primary animate-pulse"
                        : "opacity-70"
                    }
                  />
                  {unreadCount > 0 && (
                    <span className="badge badge-sm badge-error indicator-item text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>

              {showNotifPanel && (
                <div
                  ref={notifPanelRef}
                  className="absolute right-0 mt-2 w-80 bg-base-100 shadow-2xl rounded-xl border border-base-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="p-3 bg-base-200 font-bold border-b flex justify-between items-center">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="text-xs badge badge-primary">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <p className="text-center opacity-50 text-sm py-6">
                        No notifications
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className="p-3 border-b hover:bg-base-200 flex justify-between items-start group rounded-md transition-colors duration-150 cursor-pointer"
                        >
                          <div className="text-sm flex-1">
                            <p
                              className={
                                !n.isRead ? "font-bold text-primary" : ""
                              }
                            >
                              {n.message}
                            </p>
                            <span className="text-xs opacity-50 flex gap-1 mt-1">
                              <Clock size={10} /> {getRelativeTime(n.timestamp)}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteNotification(n._id)}
                            className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 ml-2 hover:bg-error/10 transition-all duration-150"
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

            {/* Profile */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar placeholder border border-base-300"
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
                className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
              >
                <li className="menu-title px-4 py-2">
                  Logged in as {user.role}
                </li>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={handleLogout} className="text-error">
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm text-white">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
