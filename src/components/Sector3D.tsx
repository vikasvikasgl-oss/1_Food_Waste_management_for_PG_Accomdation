import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { sectorData, foodLossData } from "../data/foodWasteData";
import { Building2, Home, ShoppingCart, Factory, Box } from "lucide-react";
import Scene3D from "./Scene3D";

const sectorIcons: Record<string, React.ReactNode> = {
  Households: <Home className="w-5 h-5" />,
  "Food Service": <Building2 className="w-5 h-5" />,
  Retail: <ShoppingCart className="w-5 h-5" />,
  "Post-Harvest Loss": <Factory className="w-5 h-5" />,
  "Consumer Waste": <Home className="w-5 h-5" />,
};

export default function Sector3D() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<"consumer" | "loss">("consumer");

  const data = activeTab === "consumer" ? sectorData : foodLossData;

  return (
    <section id="sectors" className="relative py-24 bg-stone-950 overflow-hidden" ref={ref}>
      {/* 3D Bars Background */}
      <div className="absolute inset-0 opacity-40">
        <Scene3D variant="bars" />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950/90 to-stone-950 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm text-amber-400 rounded-full text-sm font-semibold mb-4 border border-amber-500/30">
            <Box className="w-4 h-4" />
            3D Visualization + Charts
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Where Does Food Waste Happen?</h2>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            Households are the single largest contributor, responsible for 60% of all food waste globally.
          </p>
        </motion.div>

        <div className="flex justify-center gap-2 mb-10">
          {(["consumer", "loss"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                activeTab === tab
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              {tab === "consumer" ? "Consumer-Level Waste" : "Production & Loss"}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-[400px] bg-stone-900/50 backdrop-blur-sm rounded-2xl p-4 border border-stone-800"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={4}
                  dataKey="waste"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, _name: any, props: any) => [
                    `${value}M tonnes (${props.payload.percentage}%)`,
                    props.payload.sector,
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    background: "#1c1917",
                    color: "#fff",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  formatter={(value: string) => (
                    <span className="text-stone-300 font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              {activeTab === "consumer" ? "Consumer-Level Breakdown" : "Production & Supply Chain Loss"}
            </h3>
            {data.map((item, idx) => (
              <motion.div
                key={item.sector}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-stone-600 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {sectorIcons[item.sector]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{item.sector}</span>
                    <span className="font-bold text-stone-300">{item.waste}M tonnes</span>
                  </div>
                  <div className="w-full bg-stone-800 rounded-full h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${item.percentage}%` } : {}}
                      transition={{ duration: 1, delay: 0.6 + idx * 0.1 }}
                      className="h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-xs text-stone-500 mt-1">{item.percentage}% of total</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 bg-stone-900/50 backdrop-blur-sm rounded-2xl p-6 border border-stone-800"
        >
          <h3 className="text-xl font-bold text-white mb-6 text-center">Waste Volume by Sector (Million Tonnes)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#44403c" />
                <XAxis type="number" tickFormatter={(v) => `${v}M`} stroke="#78716c" />
                <YAxis type="category" dataKey="sector" width={100} stroke="#a8a29e" fontWeight={600} />
                <Tooltip
                  formatter={(value: number) => [`${value} million tonnes`, "Food Waste"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    background: "#1c1917",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="waste" radius={[0, 8, 8, 0]} animationDuration={1500}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
