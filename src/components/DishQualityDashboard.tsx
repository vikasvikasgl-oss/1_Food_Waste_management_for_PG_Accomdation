import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  AlertTriangle, 
  TrendingDown, 
  Sparkles, 
  Flame, 
  Search, 
  ChefHat, 
  RefreshCw, 
  MessageSquare 
} from 'lucide-react';
import { getDishQualityAnalytics, type DishQualityAnalytics, type DishQualityItem } from '../utils/db';

interface DishQualityDashboardProps {
  showToast?: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function DishQualityDashboard({ showToast }: DishQualityDashboardProps) {
  const [analytics, setAnalytics] = useState<DishQualityAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDishModal, setSelectedDishModal] = useState<DishQualityItem | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDishQualityAnalytics();
      setAnalytics(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dish quality analytics.';
      setError(msg);
      if (showToast) showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-white/5 my-6">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
        <p className="text-stone-300 font-medium text-sm">Analyzing dish ratings & waste correlations...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm my-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error || 'Failed to load analytics.'}</span>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-semibold cursor-pointer border-0"
        >
          Retry
        </button>
      </div>
    );
  }

  const { dishes, top3Best, top3Worst, reviewRecipeDishes, correlationSummary } = analytics;

  // Categories list
  const categories = ['all', ...Array.from(new Set(dishes.map(d => d.category)))];

  const filteredDishes = dishes.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <section className="mb-12">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight m-0 flex items-center gap-2">
                Dish Ratings & Waste <span className="text-amber-400">Correlation</span>
              </h2>
              <p className="text-stone-400 text-xs mt-0.5 m-0">
                Correlating resident satisfaction with waste logs to diagnose unpopular preparations and trigger recipe reviews.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-300 rounded-xl border border-white/10 text-xs font-medium transition-colors cursor-pointer self-start md:self-auto"
          style={{ boxShadow: 'none' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Ratings
        </button>
      </div>

      {/* Correlation Insight Callout Banner */}
      <div className="p-5 bg-gradient-to-r from-amber-950/30 via-stone-900/60 to-emerald-950/20 rounded-2xl border border-amber-500/20 mb-8 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-white m-0 flex items-center gap-2">
                Statistical Quality-to-Waste Correlation Insight
              </h4>
              <p className="text-xs text-stone-300 mt-1 m-0 leading-relaxed">
                {correlationSummary.insightText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5 flex-shrink-0">
            <div className="text-center">
              <span className="text-[10px] text-stone-400 block uppercase">Low Rated Waste</span>
              <span className="text-base font-extrabold text-red-400">{correlationSummary.lowRatedWasteAvg}%</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <span className="text-[10px] text-stone-400 block uppercase">High Rated Waste</span>
              <span className="text-base font-extrabold text-emerald-400">{correlationSummary.highRatedWasteAvg}%</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <span className="text-[10px] text-stone-400 block uppercase">Waste Multiplier</span>
              <span className="text-base font-extrabold text-amber-400">{correlationSummary.ratioMultiplier}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Recipe Reviews Section (Flagged: Rating < 3 AND Waste > 25%) */}
      {reviewRecipeDishes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 text-red-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            <span>Action Required: Dishes Flagged as "Review recipe" (Rating &lt; 3.0 &amp; Waste &gt; 25%)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewRecipeDishes.map((dish) => (
              <motion.div
                key={dish.food_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-gradient-to-br from-red-950/40 via-stone-900 to-stone-950 rounded-2xl border-2 border-red-500/50 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white m-0">{dish.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        ⚠️ Review recipe
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 mt-0.5 block">{dish.category}</span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{dish.average_rating > 0 ? dish.average_rating.toFixed(1) : 'N/A'}</span>
                      <span className="text-[10px] text-stone-400 font-normal">({dish.review_count} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-red-500/20 mb-3 text-center">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Waste Rate</span>
                    <span className="text-base font-black text-red-400">{dish.waste_percent}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Wasted Mass</span>
                    <span className="text-base font-bold text-white">{dish.wasted_kg} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Prepared</span>
                    <span className="text-base font-bold text-stone-300">{dish.prepared_kg} kg</span>
                  </div>
                </div>

                {/* Resident feedback excerpt */}
                {dish.recent_comments && dish.recent_comments.length > 0 && (
                  <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/5 text-xs text-stone-300 italic mb-3">
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                    "{dish.recent_comments[0].comment}"
                    <span className="not-italic text-[10px] text-stone-500 block mt-1">
                      &mdash; {dish.recent_comments[0].user_name} ({dish.recent_comments[0].rating}★)
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="text-stone-400 text-[11px]">
                    Recommendation: Re-adjust seasoning, portion sizes or cooking temperature.
                  </span>
                  <button
                    onClick={() => setSelectedDishModal(dish)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    View Feedback
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Best & Worst Rated Dishes Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Top 3 Best Rated Dishes */}
        <div className="p-6 bg-stone-900/60 rounded-2xl border border-emerald-500/20 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Top 3 Best Rated Dishes
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Highest Resident Satisfaction</span>
          </div>

          <div className="space-y-3">
            {top3Best.length === 0 ? (
              <p className="text-xs text-stone-500">No rated dishes yet.</p>
            ) : (
              top3Best.map((dish, idx) => (
                <div 
                  key={dish.food_id}
                  className="p-3.5 bg-gradient-to-r from-emerald-950/20 to-stone-900 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white m-0 truncate">{dish.title}</h4>
                      <span className="text-[11px] text-stone-400 block">{dish.category} &bull; {dish.waste_percent}% waste</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-amber-400 font-extrabold text-sm">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{dish.average_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">{dish.review_count} reviews</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top 3 Worst Rated Dishes */}
        <div className="p-6 bg-stone-900/60 rounded-2xl border border-rose-500/20 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              Top 3 Lowest Rated Dishes
            </h3>
            <span className="text-xs text-rose-400 font-semibold">Requires Kitchen Optimization</span>
          </div>

          <div className="space-y-3">
            {top3Worst.length === 0 ? (
              <p className="text-xs text-stone-500">No rated dishes yet.</p>
            ) : (
              top3Worst.map((dish, idx) => (
                <div 
                  key={dish.food_id}
                  className="p-3.5 bg-gradient-to-r from-rose-950/20 to-stone-900 rounded-xl border border-rose-500/20 flex items-center justify-between gap-3 hover:border-rose-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white m-0 truncate">{dish.title}</h4>
                        {dish.flag_review_recipe && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                            Review recipe
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400 block">{dish.category} &bull; <strong className="text-red-400">{dish.waste_percent}% waste</strong></span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-amber-400 font-extrabold text-sm">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{dish.average_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">{dish.review_count} reviews</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* All Dishes Quality & Waste Matrix Table */}
      <div className="bg-stone-900/60 rounded-2xl border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white m-0">
              All Dishes: Average Rating &amp; Waste Analysis Matrix
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">Comprehensive audit per dish comparing customer score vs actual plate waste</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-stone-950 border border-white/10 rounded-xl text-xs text-stone-300 focus:outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dish..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-stone-950 border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                <th className="py-3 px-3">Dish Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Avg Rating</th>
                <th className="py-3 px-3 text-center">Prepared / Wasted</th>
                <th className="py-3 px-3 text-center">Waste Rate %</th>
                <th className="py-3 px-3 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDishes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                    No dishes found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDishes.map((dish) => (
                  <tr key={dish.food_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-white text-xs block">{dish.title}</span>
                      <span className="text-[10px] text-stone-500">₹{dish.cost_per_kg}/kg</span>
                    </td>

                    <td className="py-3.5 px-3 text-xs text-stone-300">
                      {dish.category}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{dish.average_rating > 0 ? dish.average_rating.toFixed(1) : 'Unrated'}</span>
                        </div>
                        <span className="text-[10px] text-stone-500">({dish.review_count} reviews)</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center text-xs">
                      <span className="text-stone-300">{dish.prepared_kg} kg</span>
                      <span className="text-stone-500"> / </span>
                      <span className={dish.wasted_kg > 20 ? "text-red-400 font-semibold" : "text-stone-400"}>
                        {dish.wasted_kg} kg
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-xs font-bold ${
                          dish.waste_percent > 25 ? 'text-red-400' : dish.waste_percent > 12 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {dish.waste_percent}%
                        </span>
                        <div className="w-16 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              dish.waste_percent > 25 ? 'bg-red-500' : dish.waste_percent > 12 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, dish.waste_percent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {dish.flag_review_recipe ? (
                        <button
                          onClick={() => setSelectedDishModal(dish)}
                          aria-label={`Review recipe for ${dish.title}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40 cursor-pointer min-h-[36px]"
                        >
                          ⚠️ Review recipe
                        </button>
                      ) : dish.waste_percent <= 8 && dish.average_rating >= 4.0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Optimal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-800 text-stone-400">
                          Acceptable
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Stack View (< 768px) */}
        <div className="block md:hidden space-y-3">
          {filteredDishes.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-xs">
              No dishes found matching criteria.
            </div>
          ) : (
            filteredDishes.map((dish) => (
              <div 
                key={dish.food_id}
                className={`p-4 rounded-xl border ${
                  dish.flag_review_recipe 
                    ? "bg-red-950/20 border-red-500/30" 
                    : "bg-stone-950/60 border-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <h4 className="font-bold text-white text-sm m-0">{dish.title}</h4>
                    <span className="text-[11px] text-stone-400">{dish.category} &bull; ₹{dish.cost_per_kg}/kg</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{dish.average_rating > 0 ? dish.average_rating.toFixed(1) : 'N/A'}</span>
                    <span className="text-[10px] text-stone-500 font-normal">({dish.review_count})</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-lg border border-white/5 text-center text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Waste Rate</span>
                    <span className={`font-bold ${dish.waste_percent > 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {dish.waste_percent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Wasted Mass</span>
                    <span className="text-stone-300 font-bold">{dish.wasted_kg} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Prepared</span>
                    <span className="text-stone-300 font-bold">{dish.prepared_kg} kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  {dish.flag_review_recipe ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                      ⚠️ Review recipe
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">Normal status</span>
                  )}

                  <button
                    onClick={() => setSelectedDishModal(dish)}
                    aria-label={`View feedback for ${dish.title}`}
                    className="px-3 py-1.5 min-h-[44px] bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg text-xs font-semibold cursor-pointer border border-white/10"
                  >
                    View Feedback
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dish Reviews Modal */}
      <AnimatePresence>
        {selectedDishModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white m-0">{selectedDishModal.title}</h3>
                  <span className="text-xs text-stone-400">Resident Feedback &amp; Criticism</span>
                </div>
                <button
                  onClick={() => setSelectedDishModal(null)}
                  aria-label="Close dish audit modal"
                  className="w-11 h-11 flex items-center justify-center text-stone-400 hover:text-white bg-transparent border-0 cursor-pointer text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {selectedDishModal.recent_comments && selectedDishModal.recent_comments.length > 0 ? (
                  selectedDishModal.recent_comments.map((comm, idx) => (
                    <div key={idx} className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white">{comm.user_name}</span>
                        <div className="text-amber-400 text-xs font-bold">
                          {'★'.repeat(comm.rating)}{'☆'.repeat(5 - comm.rating)}
                        </div>
                      </div>
                      <p className="text-xs text-stone-300 m-0">"{comm.comment}"</p>
                      <span className="text-[10px] text-stone-500 block mt-1">{comm.date}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500">No written comments available for this dish.</p>
                )}
              </div>

              <button
                onClick={() => setSelectedDishModal(null)}
                aria-label="Close audit"
                className="w-full py-3 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold text-xs rounded-xl border-0 cursor-pointer"
              >
                Close Audit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
