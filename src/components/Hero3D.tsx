import { motion } from "motion/react";
import { ArrowDown, TrendingDown, Globe, AlertTriangle } from "lucide-react";
import { globalStats } from "../data/foodWasteData";
import Scene3D from "./Scene3D";

export default function Hero3D() {
  return (
    <section id="overview" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-black">
      {/* 3D Background */}
      <Scene3D variant="hero" />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 rounded-full text-sm font-semibold mb-6 border border-emerald-500/30">
            <AlertTriangle className="w-4 h-4" />
            Global Crisis Alert
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              1.05 Billion Tonnes
            </span>
            <br />
            <span className="text-stone-300">of Food Wasted Every Year</span>
          </h1>
          <p className="text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            That is <strong className="text-emerald-400">19% of all food produced</strong> globally — enough to feed billions, 
            yet 300 million people go hungry. Explore the data in 3D.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12"
        >
          {[
            { icon: Globe, value: `${globalStats.percentageOfFood}%`, label: "of all food wasted", color: "text-emerald-400" },
            { icon: TrendingDown, value: `$${globalStats.economicCost}B`, label: "annual economic loss", color: "text-amber-400" },
            { icon: AlertTriangle, value: globalStats.ghgEmissions, label: "of global GHG emissions", color: "text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-stone-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.a
          href="#globe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
        >
          Explore in 3D <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.a>
      </div>
    </section>
  );
}
