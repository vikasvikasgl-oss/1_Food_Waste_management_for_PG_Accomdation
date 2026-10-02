import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./components/Navbar";
import Hero3D from "./components/Hero3D";
import GlobeSection from "./components/GlobeSection";
import Sector3D from "./components/Sector3D";
import CountrySection from "./components/CountrySection";
import TimelineSection from "./components/TimelineSection";
import Impact3D from "./components/Impact3D";
import SolutionsSection from "./components/SolutionsSection";
import Footer from "./components/Footer";

// Hostel Mess App Pages
import Login from "./pages/Login";
import OrderFood from "./pages/OrderFood";
import MyRequests from "./pages/MyRequests";
import Contact from "./pages/Contact";
import ManageInventory from "./pages/ManageInventory";
import ApproveCarts from "./pages/ApproveCarts";
import SupportCenter from "./pages/SupportCenter";
import Upload from "./pages/Upload";
import Reports from "./pages/Reports";
import SmartPrepPlanner from "./pages/SmartPrepPlanner";
import Donations from "./pages/Donations";
import Leaderboard from "./pages/Leaderboard";
import MealAttendanceCalendar from "./components/MealAttendanceCalendar";

import { seedDatabase, type User, type LogEntry, getLogs, saveLogEntry, deleteLogEntry, setAuthToken } from "./utils/db";

interface ToastState {
  message: string;
  type: "success" | "danger" | "warning";
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard3d");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Initialize DB, Auth Session, and Logs
  useEffect(() => {
    seedDatabase();
    
    // Load auth session
    const savedUser = localStorage.getItem("hostel_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setUser(parsed);
        // Default logged-in users to their primary dashboard action
        if (parsed.role === "resident") {
          setActiveTab("order");
        } else if (parsed.role === "manager") {
          setActiveTab("approve_carts");
        }
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }

    // Load daily logs from backend NoSQL database
    getLogs()
      .then(data => setLogs(data))
      .catch(e => {
        console.error("Failed to fetch daily logs", e);
      });
  }, []);

  // Global Toast Handler
  const showToast = (message: string, type: "success" | "danger" | "warning" = "success") => {
    setToast({ message, type });
  };

  // Close toast on click or timeout
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Login handler
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("hostel_user", JSON.stringify(loggedInUser));
    
    // Redirect based on role
    if (loggedInUser.role === "resident") {
      setActiveTab("order");
    } else {
      setActiveTab("approve_carts");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("hostel_user");
    setActiveTab("dashboard3d");
    showToast("Logged out successfully.", "success");
  };

  // Log upload callback
  const handleSaveLog = (newLog: Omit<LogEntry, "id" | "wasted">) => {
    saveLogEntry(newLog)
      .then(saved => {
        setLogs(prev => [saved, ...prev]);
        showToast("Daily log saved successfully!", "success");
      })
      .catch(e => {
        const errorMsg = e instanceof Error ? e.message : "Failed to save daily log.";
        console.error("Failed to save daily log", e);
        showToast(errorMsg, "danger");
      });
  };

  // Log delete callback
  const handleDeleteLog = (id: string) => {
    deleteLogEntry(id)
      .then(() => {
        setLogs(prev => prev.filter(log => log.id !== id));
        showToast("Log entry deleted successfully.", "success");
      })
      .catch(e => {
        const errorMsg = e instanceof Error ? e.message : "Failed to delete daily log.";
        console.error("Failed to delete daily log", e);
        showToast(errorMsg, "danger");
      });
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      
      {/* Dynamic Navigation */}
      <Navbar 
        user={user} 
        activeTab={activeTab} 
        setTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main Panel View Routing */}
      <div className="w-full">
        {activeTab === "dashboard3d" && (
          <div className="w-full animate-[fadeIn_0.5s_ease-out]">
            <Hero3D />
            <GlobeSection />
            <Sector3D />
            <CountrySection />
            <TimelineSection />
            <Impact3D />
            <SolutionsSection />
            <Footer />
          </div>
        )}

        {activeTab === "login" && (
          <Login onLogin={handleLogin} showToast={showToast} />
        )}

        {activeTab === "order" && user && (
          <OrderFood user={user} showToast={showToast} />
        )}

        {activeTab === "attendance" && user && (
          <main className="container" style={{ maxWidth: '1280px', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2>📅 Meal Attendance & Skip Planner</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Mark upcoming meals you plan to skip so the mess kitchen prepares exact portion batches without waste.
              </p>
            </div>
            <MealAttendanceCalendar user={user} showToast={showToast} />
          </main>
        )}

        {activeTab === "my_requests" && user && (
          <MyRequests user={user} />
        )}

        {activeTab === "contact" && (
          <Contact user={user} showToast={showToast} />
        )}

        {activeTab === "inventory" && user && (
          <ManageInventory showToast={showToast} />
        )}

        {activeTab === "approve_carts" && user && (
          <ApproveCarts user={user} showToast={showToast} />
        )}

        {activeTab === "support_center" && (
          <SupportCenter showToast={showToast} />
        )}

        {activeTab === "upload" && user && (
          <Upload onSaveLog={handleSaveLog} showToast={showToast} />
        )}

        {activeTab === "reports" && (
          <Reports logs={logs} onDeleteLog={handleDeleteLog} />
        )}

        {activeTab === "prep_planner" && user && user.role === "manager" && (
          <SmartPrepPlanner showToast={showToast} />
        )}

        {activeTab === "donations" && user && user.role === "manager" && (
          <Donations user={user} showToast={showToast} />
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard user={user} showToast={showToast} />
        )}
      </div>

      {/* Shared Footer for operational views */}
      {activeTab !== "dashboard3d" && (
        <footer className="py-6 text-center text-xs text-stone-500 border-t border-white/5 bg-black/40 mt-12">
          &copy; {new Date().getFullYear()} PG Food Waste & Hostel Mess System. All Rights Reserved.
        </footer>
      )}

      {/* Premium Toast Notification Floating Card */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={() => setToast(null)}
            className="fixed bottom-6 right-6 z-[9999] cursor-pointer select-none max-w-sm"
          >
            <div 
              className={`px-5 py-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${
                toast.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : toast.type === "danger"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              <span className="text-base">
                {toast.type === "success" ? "✅" : toast.type === "danger" ? "❌" : "⚠️"}
              </span>
              <p className="text-xs font-semibold m-0 leading-tight text-white">
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
