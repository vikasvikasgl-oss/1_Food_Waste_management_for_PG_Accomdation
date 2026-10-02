import { Leaf, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-stone-500 py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Leaf className="w-5 h-5 text-emerald-500" />
              <span>PG Food Waste</span>
            </div>
            <p className="text-sm leading-relaxed">
              An interactive 3D data visualization project exploring the global food waste crisis, 
              its impacts, and the solutions we can all contribute to.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Data Sources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://www.unep.org" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">UN Environment Programme</a></li>
              <li><a href="https://www.fao.org" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">FAO</a></li>
              <li><a href="https://www.oecd.org" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">OECD</a></li>
              <li><a href="https://wrap.org.uk" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">WRAP (UK)</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Connect</h4>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-xs">
          <p>Data sourced from UNEP, FAO, OECD, and national statistics. Built with React Three Fiber + Vite + Recharts.</p>
        </div>
      </div>
    </footer>
  );
}
