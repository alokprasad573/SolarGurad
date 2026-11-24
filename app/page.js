import SolarGuardApp from '@/components/SolarGuardApp';

export default function HomePage() {
  return (
    <>
       <nav className="w-full max-w-6xl px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600">
            <i className="fas fa-leaf text-2xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">SolarGuard</h1>
            <p className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-[0.2em]">
              Protecting Every Photon with AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest leading-none">
              AI Core
            </span>
            <span className="text-sm font-semibold">EffNetV2B0-Finetuned</span>
          </div>
          <div className="stats-badge p-3 rounded-2xl text-white flex items-center gap-3 shadow-lg shadow-emerald-900/20">
            <i className="fas fa-microchip text-emerald-300"></i>
            <div className="pr-2 border-r border-emerald-500/30">
              <p className="text-[8px] uppercase font-bold text-emerald-200 leading-none mb-1">
                Reliability
              </p>
              <p className="text-xs font-black">82.98%</p>
            </div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>

      <SolarGuardApp/>

      <footer className="py-12 text-emerald-800 text-[10px] font-bold uppercase tracking-[0.5em]">
        SolarGuard Neural Asset Protection · {new Date().getFullYear()}
      </footer>
    </>
  );
}
