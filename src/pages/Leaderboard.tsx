import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Leaf, 
  ShieldCheck, 
  Info, 
  Search, 
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { getLeaderboard, type LeaderboardEntry, type User } from "../utils/db";

interface LeaderboardProps {
  user?: User | null;
  showToast?: (message: string, type: "success" | "danger" | "warning") => void;
}

export default function Leaderboard({ user, showToast }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load leaderboard data.";
      setError(msg);
      if (showToast) showToast(msg, "danger");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const filtered = leaderboard.filter(entry =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const top3 = leaderboard.slice(0, 3);
  const totalSkipped = leaderboard.reduce((sum, item) => sum + item.meals_skipped, 0);
  const totalFoodSaved = leaderboard.reduce((sum, item) => sum + item.food_saved_kg, 0);
  const avgReliability = leaderboard.length > 0 
    ? Math.round(leaderboard.reduce((sum, item) => sum + item.reliability_rate, 0) / leaderboard.length) 
    : 100;

  return (
    <main className="container" style={{ maxWidth: "1280px", paddingBottom: "4rem" }}>
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 rounded-2xl border border-amber-500/30 text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 m-0">
                Zero Waste Hero <span className="text-emerald-400">Leaderboard</span>
              </h1>
              <p className="text-stone-400 text-sm mt-1 m-0">
                Celebrating residents who prevent mess waste by planning skips in advance and maintaining flawless order reliability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-300 rounded-xl border border-white/10 text-sm font-medium transition-colors cursor-pointer"
            style={{ boxShadow: "none" }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            {refreshing ? "Updating..." : "Refresh Scores"}
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-stone-900/80 to-stone-950/90 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-2 text-emerald-400">
            <Calendar className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Advance Meal Skips</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{totalSkipped}</div>
          <p className="text-xs text-stone-400 mt-1">Meals notified to kitchen before cooking</p>
        </div>

        <div className="p-5 bg-gradient-to-br from-stone-900/80 to-stone-950/90 rounded-2xl border border-teal-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-2 text-teal-400">
            <Leaf className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Food Waste Avoided</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{totalFoodSaved.toFixed(1)} <span className="text-lg font-normal text-stone-400">kg</span></div>
          <p className="text-xs text-stone-400 mt-1">~{(totalFoodSaved * 2.5).toFixed(1)} kg CO₂e greenhouse gases saved</p>
        </div>

        <div className="p-5 bg-gradient-to-br from-stone-900/80 to-stone-950/90 rounded-2xl border border-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-2 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Avg Order Reliability</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{avgReliability}%</div>
          <p className="text-xs text-stone-400 mt-1">Percentage of approved vs requested orders</p>
        </div>

        <div className="p-5 bg-gradient-to-br from-stone-900/80 to-stone-950/90 rounded-2xl border border-purple-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-2 text-purple-400">
            <Flame className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Active Champions</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{leaderboard.length}</div>
          <p className="text-xs text-stone-400 mt-1">Ranked hostel residents participating</p>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && !refreshing && (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-white/5 my-8">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-stone-300 font-medium text-sm">Computing Zero Waste Hero rankings...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-semibold cursor-pointer border-0"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Current Eco Champions Podium
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* 2nd Place */}
                {top3[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-gradient-to-b from-stone-900 to-stone-950 rounded-2xl border border-slate-400/30 shadow-xl relative order-2 md:order-1"
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-300 text-stone-900 font-black flex items-center justify-center text-sm shadow-lg border-2 border-white">
                      2
                    </div>
                    <div className="text-center pt-2">
                      <div className="w-14 h-14 mx-auto rounded-full bg-slate-400/20 border-2 border-slate-300 flex items-center justify-center text-slate-200 font-bold text-lg mb-3">
                        {top3[1].name.slice(0, 2).toUpperCase()}
                      </div>
                      <h3 className="text-lg font-bold text-white m-0 truncate">{top3[1].name}</h3>
                      <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-400/15 text-slate-300 border border-slate-400/30">
                        {top3[1].badge}
                      </span>

                      <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-left">
                        <div>
                          <span className="text-[11px] text-stone-400 block">Eco Points</span>
                          <span className="text-xl font-black text-slate-200">{top3[1].score}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-400 block">Reliability</span>
                          <span className="text-xl font-bold text-emerald-400">{top3[1].reliability_rate}%</span>
                        </div>
                        <div className="col-span-2 text-xs text-stone-400 mt-1">
                          🌿 <strong>{top3[1].meals_skipped}</strong> meals skipped ahead ({top3[1].food_saved_kg} kg saved)
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 1st Place (Champion) */}
                {top3[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-7 bg-gradient-to-b from-amber-950/40 via-stone-900 to-stone-950 rounded-3xl border-2 border-amber-400/60 shadow-2xl relative order-1 md:order-2 md:-translate-y-3"
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black flex items-center gap-1.5 text-xs shadow-xl tracking-wider uppercase">
                      👑 Rank 1 Champion
                    </div>
                    <div className="text-center pt-3">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/30 border-4 border-amber-400 flex items-center justify-center text-amber-300 font-extrabold text-2xl mb-3 shadow-[0_0_25px_rgba(251,191,36,0.3)]">
                        {top3[0].name.slice(0, 2).toUpperCase()}
                      </div>
                      <h3 className="text-xl font-extrabold text-white m-0 truncate">{top3[0].name}</h3>
                      <span className="inline-block mt-1 px-4 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        {top3[0].badge}
                      </span>

                      <div className="mt-6 pt-5 border-t border-amber-400/20 grid grid-cols-2 gap-3 text-left">
                        <div>
                          <span className="text-xs text-amber-300/80 block uppercase tracking-wider font-semibold">Eco Score</span>
                          <span className="text-3xl font-black text-amber-400">{top3[0].score}</span>
                        </div>
                        <div>
                          <span className="text-xs text-amber-300/80 block uppercase tracking-wider font-semibold">Reliability</span>
                          <span className="text-3xl font-black text-emerald-400">{top3[0].reliability_rate}%</span>
                        </div>
                        <div className="col-span-2 text-xs text-stone-300 mt-1 bg-amber-400/10 p-2.5 rounded-xl border border-amber-400/20">
                          🏆 <strong>{top3[0].meals_skipped}</strong> meals skipped in advance &bull; <strong>{top3[0].food_saved_kg} kg</strong> waste saved
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-gradient-to-b from-stone-900 to-stone-950 rounded-2xl border border-amber-700/40 shadow-xl relative order-3"
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm shadow-lg border-2 border-white">
                      3
                    </div>
                    <div className="text-center pt-2">
                      <div className="w-14 h-14 mx-auto rounded-full bg-amber-700/20 border-2 border-amber-600 flex items-center justify-center text-amber-300 font-bold text-lg mb-3">
                        {top3[2].name.slice(0, 2).toUpperCase()}
                      </div>
                      <h3 className="text-lg font-bold text-white m-0 truncate">{top3[2].name}</h3>
                      <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-700/20 text-amber-400 border border-amber-700/30">
                        {top3[2].badge}
                      </span>

                      <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-left">
                        <div>
                          <span className="text-[11px] text-stone-400 block">Eco Points</span>
                          <span className="text-xl font-black text-amber-300">{top3[2].score}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-400 block">Reliability</span>
                          <span className="text-xl font-bold text-emerald-400">{top3[2].reliability_rate}%</span>
                        </div>
                        <div className="col-span-2 text-xs text-stone-400 mt-1">
                          🌿 <strong>{top3[2].meals_skipped}</strong> meals skipped ahead ({top3[2].food_saved_kg} kg saved)
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="bg-stone-900/60 rounded-2xl border border-white/10 p-6 mb-8 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  All Resident Rankings
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">Updated dynamically from real meal attendances and cart order approvals</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search resident..."
                  aria-label="Search resident by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 min-h-[44px] bg-stone-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-3 text-center">Advance Skips</th>
                    <th className="py-3 px-3 text-center">Food Saved</th>
                    <th className="py-3 px-3 text-center">Order Reliability</th>
                    <th className="py-3 px-3 text-right">Zero Waste Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                        No residents found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const isCurrentUser = user && user.user_id === item.user_id;

                      return (
                        <tr 
                          key={item.user_id}
                          className={`transition-colors hover:bg-white/[0.02] ${
                            isCurrentUser ? "bg-emerald-500/10 border-l-4 border-l-emerald-400 font-semibold" : ""
                          }`}
                        >
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2">
                              {item.rank === 1 ? (
                                <span className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-extrabold text-xs">
                                  1
                                </span>
                              ) : item.rank === 2 ? (
                                <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-xs">
                                  2
                                </span>
                              ) : item.rank === 3 ? (
                                <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
                                  3
                                </span>
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 flex items-center justify-center font-medium text-xs">
                                  {item.rank}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{item.name}</span>
                                {isCurrentUser && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400 text-stone-950">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-400 block mt-0.5">{item.badge}</span>
                            </div>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              {item.meals_skipped} skips
                            </div>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <span className="text-stone-300 font-medium text-xs">
                              {item.food_saved_kg} kg
                            </span>
                            <span className="text-[10px] text-stone-500 block">
                              {(item.food_saved_kg * 2.5).toFixed(1)} kg CO₂e
                            </span>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                <span className={item.reliability_rate >= 85 ? "text-emerald-400" : item.reliability_rate >= 60 ? "text-amber-400" : "text-red-400"}>
                                  {item.reliability_rate}%
                                </span>
                                <span className="text-[10px] text-stone-500 font-normal">
                                  ({item.approved_carts}✓ / {item.rejected_carts}✗)
                                </span>
                              </div>
                              <div className="w-20 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.reliability_rate >= 85 ? "bg-emerald-400" : item.reliability_rate >= 60 ? "bg-amber-400" : "bg-red-400"
                                  }`} 
                                  style={{ width: `${item.reliability_rate}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3 text-right">
                            <span className="text-lg font-black text-amber-400">
                              {item.score}
                            </span>
                            <span className="text-[10px] text-stone-500 block uppercase tracking-wider">PTS</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack View (< 768px) */}
            <div className="block md:hidden space-y-3">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-stone-500 text-xs">
                  No residents found matching your search.
                </div>
              ) : (
                filtered.map((item) => {
                  const isCurrentUser = user && user.user_id === item.user_id;

                  return (
                    <div 
                      key={item.user_id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrentUser 
                          ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                          : "bg-stone-950/60 border-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-stone-800 text-stone-300 font-bold text-xs flex items-center justify-center border border-white/10">
                            #{item.rank}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-bold text-sm">{item.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-400 text-stone-950">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400">{item.badge}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-black text-amber-400 leading-tight">{item.score}</div>
                          <span className="text-[9px] text-stone-500 uppercase tracking-widest font-semibold">ECO PTS</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-lg border border-white/5 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 block uppercase">Skips</span>
                          <span className="text-emerald-400 font-bold">{item.meals_skipped}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block uppercase">Food Saved</span>
                          <span className="text-stone-300 font-bold">{item.food_saved_kg} kg</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block uppercase">Reliability</span>
                          <span className={item.reliability_rate >= 85 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                            {item.reliability_rate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Scoring Rules Explanation Card */}
          <div className="p-6 bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm">
              <Info className="w-4 h-4" />
              How Zero Waste Hero Points are Calculated
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> +35 Eco Points
                </div>
                <p className="text-stone-300 m-0">
                  <strong>Advance Meal Skip Notice:</strong> Logged in the planner so the mess team doesn't prepare unneeded food batches.
                </p>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> +20 Eco Points
                </div>
                <p className="text-stone-300 m-0">
                  <strong>Approved Cart Request:</strong> Fulfilled requests for mess food that are responsibly planned and picked up.
                </p>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="text-red-400 font-bold mb-1 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> -35 Eco Points
                </div>
                <p className="text-stone-300 m-0">
                  <strong>Rejected / Cancelled Order:</strong> Penalty for requests made that could not be approved due to stock limits or duplicates.
                </p>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> +15 Eco Points
                </div>
                <p className="text-stone-300 m-0">
                  <strong>Feedback & Suggestions:</strong> Submitting ratings and constructive feedback to optimize hostel mess operations.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

    </main>
  );
}
