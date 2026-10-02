import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Globe, MousePointerClick } from "lucide-react";
import Scene3D from "./Scene3D";

export default function GlobeSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="globe" className="relative min-h-screen bg-black overflow-hidden" ref={ref}>
      <Scene3D variant="globe" />
      
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 rounded-full text-sm font-semibold mb-4 border border-emerald-500/30">
            <Globe className="w-4 h-4" />
            Interactive 3D Globe
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Food Waste Around the World</h2>
          <p className="text-lg text-stone-400 max-w-2xl mx-auto">
            Red dots represent countries by total food waste volume. Hover to see details. 
            Drag to rotate the globe.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-stone-500 text-sm"
        >
          <MousePointerClick className="w-4 h-4" />
          <span>Drag to rotate &middot; Hover dots for data</span>
        </motion.div>
      </div>
    </section>
  );
}
