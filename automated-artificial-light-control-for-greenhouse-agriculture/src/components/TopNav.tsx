import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSyllabus: () => void;
  onOpenAiExpert: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSyllabus,
  onOpenAiExpert,
}) => {
  const navItems = [
    { id: 'digital_twin', label: 'Overview & Digital Twin' },
    { id: 'sensors_gis', label: 'Ground Sensors & GIS' },
    { id: 'light_control', label: 'Artificial Light Control' },
    { id: 'co2_model', label: 'CO₂ & Photosynthesis' },
    { id: 'plant_telemetry', label: 'Plant Growth Telemetry' },
    { id: 'expert_system', label: 'Horticultural Expert' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('digital_twin');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
            <span>AGROLIGHT PRECISION</span>
          </a>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap transition-colors py-1 relative ${
                  isActive
                    ? 'text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary action button + Unit 1 & 2 Syllabus alignment */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSyllabus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
            title="Inspect Unit 1 & 2 Curriculum Syllabus Alignment"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unit I & II Syllabus</span>
          </button>

          <button
            onClick={onOpenAiExpert}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Agronomic Copilot</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2 overflow-x-auto border-t border-slate-800/80 scrollbar-none text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === item.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
