import { useState, useEffect, useRef } from "react";
import { 
  Menu, 
  X, 
  Leaf, 
  LogOut, 
  User as UserIcon, 
  Bell, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Utensils, 
  MessageSquareCheck, 
  Trash2, 
  CheckCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  type User, 
  type InAppNotification, 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from "../utils/db";

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

const dashboardHashes = [
  { label: "Overview", href: "#overview" },
  { label: "Globe", href: "#globe" },
  { label: "Sectors", href: "#sectors" },
  { label: "Countries", href: "#countries" },
  { label: "Timeline", href: "#timeline" },
  { label: "Impact", href: "#impact" },
  { label: "Solutions", href: "#solutions" },
];

export default function Navbar({ user, activeTab, setTab, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Helper to handle tab changes and close mobile menu
  const handleTabSelect = (tab: string) => {
    setTab(tab);
    setIsOpen(false);
    setShowNotifs(false);
  };

  // Fetch in-app notifications
  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  // 30s Polling for live notifications when user is logged in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifs();
    const interval = setInterval(() => {
      fetchNotifs();
    }, 30000); // 30 seconds polling

    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };

    if (showNotifs) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifs]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string, link?: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      if (link) {
        handleTabSelect(link);
      }
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoadingNotifs(true);
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error("Failed to mark all notifications read", e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleDeleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error("Failed to delete notification", e);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Recent";
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "cart_approved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />;
      case "cart_rejected":
        return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />;
      case "complaint_status":
        return <MessageSquareCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />;
      case "new_menu":
        return <Utensils className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" aria-hidden="true" />;
      case "leaderboard":
        return <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand/Logo */}
          <button 
            onClick={() => handleTabSelect("dashboard3d")} 
            className="flex items-center gap-2 text-emerald-400 font-bold text-lg sm:text-xl cursor-pointer select-none bg-transparent border-0 p-2 min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="PG Food Waste Home"
          >
            <Leaf className="w-6 h-6 animate-pulse" aria-hidden="true" />
            <span>PG Food Waste</span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            
            {/* If on 3D Dashboard view, show section scroll links */}
            {activeTab === "dashboard3d" && !user && (
              <div className="flex items-center gap-4 border-r border-white/10 pr-4 mr-1">
                {dashboardHashes.map((link) => (
                  <a 
                    key={link.href} 
                    href={link.href} 
                    className="text-stone-300 hover:text-emerald-400 font-medium text-xs transition-colors py-2 px-1 focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {/* Standard Dashboard Nav link */}
            <button
              onClick={() => handleTabSelect("dashboard3d")}
              className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                activeTab === "dashboard3d"
                  ? "text-emerald-400 bg-white/10"
                  : "text-stone-300 hover:text-emerald-400 bg-transparent"
              }`}
              style={{ boxShadow: 'none' }}
              aria-label="Global Analytics Dashboard"
            >
              Global Analytics
            </button>

            {/* Role-Specific Tabs */}
            {user && user.role === "resident" && (
              <>
                <button
                  onClick={() => handleTabSelect("order")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "order"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Request Food"
                >
                  Request Food
                </button>
                <button
                  onClick={() => handleTabSelect("attendance")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "attendance"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Meal Attendance & Skips"
                >
                  Meal Skips
                </button>
                <button
                  onClick={() => handleTabSelect("my_requests")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "my_requests"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="My Requests"
                >
                  My Requests
                </button>
                <button
                  onClick={() => handleTabSelect("contact")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "contact"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Support Desk"
                >
                  Support
                </button>
              </>
            )}

            {user && user.role === "manager" && (
              <>
                <button
                  onClick={() => handleTabSelect("inventory")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "inventory"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Manage Inventory"
                >
                  Inventory
                </button>
                <button
                  onClick={() => handleTabSelect("approve_carts")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "approve_carts"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Approve Requests"
                >
                  Approve Requests
                </button>
                <button
                  onClick={() => handleTabSelect("support_center")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "support_center"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Resolve Support"
                >
                  Support Desk
                </button>
                <button
                  onClick={() => handleTabSelect("upload")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "upload"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Log Waste"
                >
                  Log Waste
                </button>
                <button
                  onClick={() => handleTabSelect("prep_planner")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "prep_planner"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Smart Prep Planner"
                >
                  Smart Prep
                </button>
                <button
                  onClick={() => handleTabSelect("donations")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "donations"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Food Donations"
                >
                  Donations
                </button>
                <button
                  onClick={() => handleTabSelect("reports")}
                  className={`font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                    activeTab === "reports"
                      ? "text-emerald-400 bg-white/10"
                      : "text-stone-300 hover:text-emerald-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Reports and Analytics"
                >
                  Reports
                </button>
              </>
            )}

            {/* Zero Waste Hero Leaderboard (Visible to all logged in users) */}
            {user && (
              <button
                onClick={() => handleTabSelect("leaderboard")}
                className={`flex items-center gap-1.5 font-medium text-xs transition-colors min-h-[44px] px-3 rounded-lg border-0 cursor-pointer ${
                  activeTab === "leaderboard"
                    ? "text-amber-400 bg-amber-400/10 font-bold"
                    : "text-stone-300 hover:text-amber-400 bg-transparent"
                }`}
                style={{ boxShadow: 'none' }}
                aria-label="Zero Waste Hero Leaderboard"
              >
                <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Leaderboard</span>
              </button>
            )}

            {/* In-App Notifications Bell Icon with live popover */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    fetchNotifs();
                  }}
                  className="relative p-2.5 text-stone-300 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ boxShadow: 'none' }}
                  title="Notifications"
                  aria-label={`In-App Notifications (${unreadCount} unread)`}
                  aria-expanded={showNotifs}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.7)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-stone-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 text-white"
                      role="region"
                      aria-label="Notifications Dropdown"
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-stone-950/80">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                          <span className="font-bold text-sm">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {unreadCount} new
                            </span>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            disabled={loadingNotifs}
                            className="flex items-center gap-1 text-[11px] font-medium text-stone-300 hover:text-emerald-400 bg-transparent border-0 cursor-pointer min-h-[36px] px-2 rounded"
                            aria-label="Mark all notifications as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-stone-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                            <p className="text-xs m-0 font-medium">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleMarkRead(notif.id, notif.link)}
                              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group min-h-[50px] ${
                                !notif.read ? "bg-white/[0.06] hover:bg-white/[0.1]" : "hover:bg-white/[0.03]"
                              }`}
                              role="button"
                              tabIndex={0}
                              aria-label={`${notif.title}: ${notif.message}`}
                            >
                              {getNotifIcon(notif.type)}

                              <div className="flex-1 min-w-0 pr-8">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className={`text-xs font-semibold truncate ${!notif.read ? "text-white" : "text-stone-300"}`}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[10px] text-stone-400 whitespace-nowrap">
                                    {formatTimeAgo(notif.createdAt)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-300 leading-snug m-0 line-clamp-2">
                                  {notif.message}
                                </p>

                                {notif.link && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 mt-1">
                                    View details <ChevronRight className="w-3 h-3" aria-hidden="true" />
                                  </span>
                                )}
                              </div>

                              {/* Delete action */}
                              <button
                                onClick={(e) => handleDeleteNotif(e, notif.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-red-400 rounded transition-opacity absolute right-2 top-2.5 bg-transparent border-0 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                                title="Delete notification"
                                aria-label="Delete notification"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>

                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-emerald-400 absolute right-3 bottom-3 shadow-[0_0_6px_rgba(16,185,129,0.8)]" aria-hidden="true" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Auth Actions / User profile info */}
            {user ? (
              <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs uppercase" aria-hidden="true">
                    {user.name.slice(0, 2)}
                  </div>
                  <div className="text-left leading-none">
                    <div className="text-xs font-semibold text-white">{user.name}</div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-stone-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ boxShadow: 'none' }}
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleTabSelect("login")}
                className="btn text-xs font-bold px-4 py-2 min-h-[44px] border-0"
                aria-label="Hostel Mess Login"
              >
                Hostel Mess Login
              </button>
            )}

          </div>

          {/* Mobile Right Controls: Notifications & Hamburger Toggle */}
          <div className="flex items-center gap-1 md:hidden">
            {user && (
              <button
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  fetchNotifs();
                }}
                className="relative p-2.5 text-stone-300 border-0 bg-transparent cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ boxShadow: 'none' }}
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-emerald-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <button 
              className="p-2.5 text-stone-300 border-0 bg-transparent cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center" 
              onClick={() => setIsOpen(!isOpen)}
              style={{ boxShadow: 'none' }}
              aria-label={isOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-stone-950/98 backdrop-blur-2xl border-b border-white/15 overflow-hidden"
          >
            <div className="px-3 py-3 space-y-1">
              <button
                onClick={() => handleTabSelect("dashboard3d")}
                className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                  activeTab === "dashboard3d"
                    ? "text-emerald-400 bg-white/10 font-bold"
                    : "text-stone-300 hover:text-emerald-400 bg-transparent"
                }`}
                style={{ boxShadow: 'none' }}
                aria-label="Global Analytics"
              >
                Global Analytics
              </button>

              {/* Role Specific items on Mobile */}
              {user && user.role === "resident" && (
                <>
                  <button
                    onClick={() => handleTabSelect("order")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "order"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Request Food"
                  >
                    Request Food
                  </button>
                  <button
                    onClick={() => handleTabSelect("attendance")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "attendance"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Meal Attendance & Skips"
                  >
                    Meal Attendance & Skips
                  </button>
                  <button
                    onClick={() => handleTabSelect("my_requests")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "my_requests"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="My Requests"
                  >
                    My Requests
                  </button>
                  <button
                    onClick={() => handleTabSelect("contact")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "contact"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Submit Support"
                  >
                    Submit Support
                  </button>
                </>
              )}

              {user && user.role === "manager" && (
                <>
                  <button
                    onClick={() => handleTabSelect("inventory")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "inventory"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Inventory Management"
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => handleTabSelect("approve_carts")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "approve_carts"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Approve Requests"
                  >
                    Approve Requests
                  </button>
                  <button
                    onClick={() => handleTabSelect("support_center")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "support_center"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Resolve Support Desk"
                  >
                    Support Desk
                  </button>
                  <button
                    onClick={() => handleTabSelect("upload")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "upload"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Log Waste Records"
                  >
                    Log Waste
                  </button>
                  <button
                    onClick={() => handleTabSelect("prep_planner")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "prep_planner"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Smart Prep Planner"
                  >
                    Smart Prep
                  </button>
                  <button
                    onClick={() => handleTabSelect("donations")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "donations"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Surplus Food Donations"
                  >
                    Donations
                  </button>
                  <button
                    onClick={() => handleTabSelect("reports")}
                    className={`block w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                      activeTab === "reports"
                        ? "text-emerald-400 bg-white/10 font-bold"
                        : "text-stone-300 hover:text-emerald-400 bg-transparent"
                    }`}
                    style={{ boxShadow: 'none' }}
                    aria-label="Reports and Analytics"
                  >
                    Reports
                  </button>
                </>
              )}

              {/* Zero Waste Hero Leaderboard (Mobile) */}
              {user && (
                <button
                  onClick={() => handleTabSelect("leaderboard")}
                  className={`flex items-center gap-2 w-full text-left px-3 py-3 rounded-xl font-medium text-sm transition-colors min-h-[44px] border-0 cursor-pointer ${
                    activeTab === "leaderboard"
                      ? "text-amber-400 bg-amber-400/10 font-bold"
                      : "text-stone-300 hover:text-amber-400 bg-transparent"
                  }`}
                  style={{ boxShadow: 'none' }}
                  aria-label="Zero Waste Hero Leaderboard"
                >
                  <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  Zero Waste Hero Leaderboard
                </button>
              )}

              {/* Action Buttons */}
              {user ? (
                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-semibold text-white">{user.name}</div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider">{user.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 text-xs font-semibold text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 cursor-pointer border-0 bg-transparent min-h-[44px]"
                    style={{ boxShadow: 'none' }}
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleTabSelect("login")}
                  className="btn w-full mt-3 min-h-[44px] border-0"
                  aria-label="Hostel Mess Login"
                >
                  Hostel Mess Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
