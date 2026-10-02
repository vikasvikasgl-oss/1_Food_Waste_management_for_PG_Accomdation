import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { impactData, foodTypeData } from "../data/foodWasteData";
import { Cloud, DollarSign, MapPin, Droplets, UtensilsCrossed, Heart, type LucideIcon } from "lucide-react";
import Scene3D from "./Scene3D";

const iconMap: Record<string, LucideIcon> = {
  Cloud, DollarSign, MapPin, Droplets, UtensilsCrossed, Heart,
};

export default function Impact3D() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="impact" className="relative py-24 bg-black overflow-hidden" ref={ref}>
      {/* 3D Floating Food Background */}
      <div className="absolute inset-0 opacity-30">
        <Scene3D variant="food" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">The True Cost of Food Waste</h2>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            Beyond the staggering volume of wasted food, the environmental, economic, and social 
            consequences ripple across every corner of our planet.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {impactData.map((item, idx) => {
            const Icon = iconMap[item.icon];
            return (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-stone-900/60 backdrop-blur-md rounded-2xl p-8 border border-stone-800 hover:border-stone-500 transition-all hover:-translate-y-1"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}15, transparent 70%)` }}
                />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="text-4xl font-extrabold mb-2" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-lg font-semibold text-white mb-2">{item.metric}</div>
                  <p className="text-stone-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20"
        >
          <h3 className="text-2xl font-bold text-center text-white mb-10">Most Wasted Food Categories</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {foodTypeData.slice(0, 4).map((item, idx) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="bg-stone-900/60 backdrop-blur-sm rounded-xl p-6 border border-stone-800"
              >
                <div className="w-full h-2 rounded-full mb-4" style={{ backgroundColor: item.color }} />
                <div className="text-2xl font-bold text-white">{item.percentage}%</div>
                <div className="text-sm font-medium text-stone-300 mt-1">{item.type}</div>
                <div className="text-xs text-stone-500 mt-1">{item.waste}M tonnes</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
