import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { timelineData } from "../data/foodWasteData";
import { TrendingDown, Calendar } from "lucide-react";

export default function TimelineSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showLoss, setShowLoss] = useState(true);

  return (
    <section id="timeline" className="py-24 bg-stone-950" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm text-purple-400 rounded-full text-sm font-semibold mb-4 border border-purple-500/30">
            <Calendar className="w-4 h-4" />
            Historical Trends
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Food Waste Over Time</h2>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            While total food waste has been declining slowly since 2011, the pace is far too slow 
            to meet the UN SDG 12.3 target of halving food waste by 2030.
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showLoss}
              onChange={(e) => setShowLoss(e.target.checked)}
              className="w-5 h-5 rounded border-stone-600 bg-stone-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-stone-300 font-medium">Show Food Loss (Supply Chain)</span>
          </label>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-stone-900/50 backdrop-blur-sm rounded-2xl p-6 border border-stone-800"
        >
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHousehold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4A261" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F4A261" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#457B9D" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#457B9D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="year" stroke="#78716c" fontWeight={600} />
                <YAxis tickFormatter={(v) => `${v}M t`} stroke="#78716c" />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} million tonnes`, name]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    background: "#1c1917",
                    color: "#fff",
                  }}
                />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-stone-300 font-medium">{value}</span>
                  )}
                />
                <Area type="monotone" dataKey="totalWaste" name="Total Food Waste" stroke="#E63946" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} animationDuration={1500} />
                <Area type="monotone" dataKey="household" name="Household Waste" stroke="#F4A261" fillOpacity={1} fill="url(#colorHousehold)" strokeWidth={2} animationDuration={1500} />
                {showLoss && (
                  <Area type="monotone" dataKey="foodLoss" name="Food Loss (Supply Chain)" stroke="#457B9D" fillOpacity={1} fill="url(#colorLoss)" strokeWidth={2} strokeDasharray="6 4" animationDuration={1500} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl p-8 text-white"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">UN SDG 12.3 Target</h3>
              <p className="text-emerald-100 leading-relaxed">
                The UN aims to <strong>halve per capita food waste</strong> at the retail and consumer levels 
                by 2030. Currently, only <strong>12% of the global population</strong> lives in countries that track their food waste. 
                Accelerated action is needed across all sectors.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
