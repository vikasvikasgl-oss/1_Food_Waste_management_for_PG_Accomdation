import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { countryData } from "../data/foodWasteData";
import { ArrowUpDown, Globe } from "lucide-react";

type SortKey = "totalWaste" | "perCapita";

export default function CountrySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [sortBy, setSortBy] = useState<SortKey>("totalWaste");
  const [regionFilter, setRegionFilter] = useState<string>("All");

  const regions = ["All", ...Array.from(new Set(countryData.map((c) => c.region)))];

  const filtered = countryData
    .filter((c) => regionFilter === "All" || c.region === regionFilter)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const colors = ["#E63946", "#F4A261", "#2A9D8F", "#457B9D", "#E76F51", "#8B5CF6", "#06B6D4", "#F59E0B"];

  return (
    <section id="countries" className="py-24 bg-black" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-400 rounded-full text-sm font-semibold mb-4 border border-blue-500/30">
            <Globe className="w-4 h-4" />
            Global Comparison
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Food Waste by Country</h2>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            China leads in total food waste volume, while smaller nations like the Maldives 
            have the highest per-capita waste.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  regionFilter === r
                    ? "bg-white text-stone-900"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortBy(sortBy === "totalWaste" ? "perCapita" : "totalWaste")}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 border border-stone-700 rounded-full text-sm font-medium text-stone-400 hover:bg-stone-700 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort by: {sortBy === "totalWaste" ? "Total Waste" : "Per Capita"}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-stone-900/50 backdrop-blur-sm rounded-2xl border border-stone-800 p-6"
        >
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered} layout="vertical" margin={{ left: 80, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#292524" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => (sortBy === "totalWaste" ? `${v}M t` : `${v} kg`)}
                  stroke="#78716c"
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  width={70}
                  stroke="#a8a29e"
                  fontWeight={600}
                  fontSize={13}
                />
                <Tooltip
                  formatter={(value: any, _name: any, props: any) => [
                    sortBy === "totalWaste" ? `${value} million tonnes` : `${value} kg per person`,
                    `${props.payload.country} (${props.payload.region})`,
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    background: "#1c1917",
                    color: "#fff",
                  }}
                />
                <Bar dataKey={sortBy} radius={[0, 8, 8, 0]} animationDuration={1200}>
                  {filtered.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          {[
            { label: "Highest Total", value: "China", sub: "109M tonnes/year", color: "bg-red-500/10 text-red-400 border-red-500/20" },
            { label: "Highest Per Capita", value: "Maldives", sub: "207 kg/person/year", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { label: "Lowest Per Capita", value: "Mongolia", sub: "18 kg/person/year", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
          ].map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`rounded-2xl p-6 border ${card.color}`}
            >
              <div className="text-sm font-semibold opacity-80 mb-1">{card.label}</div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm opacity-70 mt-1">{card.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
