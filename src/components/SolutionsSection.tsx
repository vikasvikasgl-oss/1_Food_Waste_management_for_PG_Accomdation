import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { reductionTargets } from "../data/foodWasteData";
import { Lightbulb, Target, Recycle, Users, ShoppingBag, ChefHat, CheckCircle2, ArrowRight } from "lucide-react";

const tips = [
  { icon: <ShoppingBag className="w-6 h-6" />, title: "Smart Shopping", desc: "Plan meals, make lists, and avoid impulse buys. Buy only what you need." },
  { icon: <ChefHat className="w-6 h-6" />, title: "Portion Control", desc: "Cook only what you will eat. The #1 reason for household waste is cooking too much." },
  { icon: <Recycle className="w-6 h-6" />, title: "Proper Storage", desc: "Store food correctly to extend freshness. Use your freezer for leftovers." },
  { icon: <Users className="w-6 h-6" />, title: "Community Sharing", desc: "Share surplus food with neighbors or donate to local food banks." },
];

const actions = [
  "Check your fridge before shopping",
  "Understand date labels (Best Before ≠ Use By)",
  "Use leftovers creatively in new meals",
  "Compost inedible scraps",
  "Support businesses that reduce waste",
  "Advocate for food waste policies",
];

export default function SolutionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="solutions" className="py-24 bg-gradient-to-b from-stone-950 to-emerald-950/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 rounded-full text-sm font-semibold mb-4 border border-emerald-500/30">
            <Lightbulb className="w-4 h-4" />
            Take Action
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Solutions & Targets</h2>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            Change is possible. Countries like Japan achieved a 31% reduction in food waste between 
            2008 and 2020.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="mb-16">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            National Reduction Targets
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reductionTargets.map((t, idx) => (
              <motion.div
                key={t.country}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-stone-900/60 backdrop-blur-sm rounded-xl p-5 border border-stone-800 hover:border-stone-600 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{t.country}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    t.status === "Achieved (2008-2020)" ? "bg-emerald-500/20 text-emerald-400" :
                    t.status === "Legally binding" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-sm text-stone-400">{t.target}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }}>
            <h3 className="text-xl font-bold text-white mb-6">How to Reduce Waste at Home</h3>
            <div className="space-y-4">
              {tips.map((tip, idx) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-start gap-4 p-5 bg-stone-900/60 backdrop-blur-sm rounded-xl border border-stone-800 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    {tip.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{tip.title}</h4>
                    <p className="text-sm text-stone-400">{tip.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }}>
            <h3 className="text-xl font-bold text-white mb-6">Quick Action Checklist</h3>
            <div className="bg-stone-900/60 backdrop-blur-sm rounded-2xl p-6 border border-stone-800">
              <div className="space-y-3">
                {actions.map((action, idx) => (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.6 + idx * 0.08 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-stone-300 font-medium text-sm">{action}</span>
                    <ArrowRight className="w-4 h-4 text-stone-600 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1 }}
              className="mt-6 bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-6 text-white border border-emerald-700/50"
            >
              <h4 className="font-bold text-lg mb-2">Did You Know?</h4>
              <p className="text-emerald-100 text-sm leading-relaxed">
                Every dollar saved from food waste results in an average of <strong>$14 in additional revenue</strong> 
                for restaurants. For households, the average four-person family loses around <strong>£1,000 per year</strong> 
                from edible food waste.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
