import React, { useState } from 'react';
import { 
  Wind, TrendingUp, Sliders, Info, 
  Flame, Gauge, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { calculatePhotosynthesisRate } from '../models/agronomicModels';

interface Co2PhotosynthesisProps {
  currentPpfd: number;
  co2Ppm: number;
  setCo2Ppm: (co2: number) => void;
  airTemp: number;
}

export const Co2PhotosynthesisView: React.FC<Co2PhotosynthesisProps> = ({
  currentPpfd,
  co2Ppm,
  setCo2Ppm,
  airTemp,
}) => {
  const [ventilationRateAirChangesPerHour, setVentilationRate] = useState<number>(1.5);
  const [co2InjectionKgPerHour, setCo2Injection] = useState<number>(45);
  const [simTemp, setSimTemp] = useState<number>(airTemp);

  // Calculate current point
  const currentKinetics = calculatePhotosynthesisRate(currentPpfd, co2Ppm, simTemp);

  // Generate Light Response Curves at 3 CO2 concentrations: 400 ppm (ambient), 800 ppm (enriched), 1200 ppm (saturation)
  const ppfdSteps = [0, 100, 200, 400, 600, 800, 1000, 1200, 1500, 1800];
  const curveAmbient400 = ppfdSteps.map((p) => ({
    ppfd: p,
    rate: calculatePhotosynthesisRate(p, 400, simTemp).netPhotosynthesis,
  }));
  const curveEnriched800 = ppfdSteps.map((p) => ({
    ppfd: p,
    rate: calculatePhotosynthesisRate(p, 800, simTemp).netPhotosynthesis,
  }));
  const curveEnriched1200 = ppfdSteps.map((p) => ({
    ppfd: p,
    rate: calculatePhotosynthesisRate(p, 1200, simTemp).netPhotosynthesis,
  }));

  // Greenhouse Mass Balance Simulation:
  // Greenhouse volume: 2400 m² * 5m avg height = 12,000 m³
  // Air density: 1.2 kg/m³ => 14,400 kg air
  // Sink = currentKinetics.co2ConsumptionKgHaHr * 0.24 ha = kg/hr
  const canopySinkKgHr = Number((currentKinetics.co2ConsumptionKgHaHr * 0.24).toFixed(1));
  const ventLossFactor = ventilationRateAirChangesPerHour * (co2Ppm - 400) * 0.026;
  const netCo2Balance = Number((co2InjectionKgPerHour - canopySinkKgHr - ventLossFactor).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Unit II 2.3 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>UNIT II.3</span>
            <span aria-hidden="true">·</span>
            <span>SIMULATION OF CO₂ CONSUMPTION</span>
            <span aria-hidden="true">·</span>
            <span>PHOTOSYNTHETIC KINETICS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            CO₂ - Light Synergy & Photosynthetic Mass Balance Engine
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">Current Light Saturation Point:</span>
          <span className="font-mono font-bold text-cyan-400">
            {currentKinetics.lightSaturationPoint} µmol/m²/s
          </span>
        </div>
      </div>

      {/* Main Interactive Light Response Curve Canvas (SVG) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">
              Canopy Photosynthetic Light Response Curves ($P_n$ vs PPFD)
            </h3>
            <p className="text-xs text-slate-400">
              Notice how elevating CO₂ lifts the curve asymptote (A_max) and pushes the saturation threshold higher.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 bg-slate-400 inline-block" /> Ambient 400 ppm
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Enriched 800 ppm
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> High 1200 ppm
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="w-full aspect-[21/9] min-h-[280px]">
            <svg viewBox="0 0 800 320" className="w-full h-full select-none">
              <defs>
                <linearGradient id="activePointGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 5, 10, 15, 20, 25, 30].map((yVal) => {
                const yPos = 270 - (yVal / 32) * 230;
                return (
                  <g key={yVal}>
                    <line x1="60" y1={yPos} x2="760" y2={yPos} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                    <text x="50" y={yPos + 4} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">
                      {yVal}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Ticks */}
              {[0, 300, 600, 900, 1200, 1500, 1800].map((xVal) => {
                const xPos = 60 + (xVal / 1800) * 700;
                return (
                  <g key={xVal}>
                    <line x1={xPos} y1="270" x2={xPos} y2="275" stroke="#64748b" strokeWidth="1" />
                    <text x={xPos} y="292" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                      {xVal}
                    </text>
                  </g>
                );
              })}

              {/* Axis Titles */}
              <text x="410" y="312" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">
                PHOTOSYNTHETIC PHOTON FLUX DENSITY - PPFD (µmol/m²/s)
              </text>
              <text x="20" y="160" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono" transform="rotate(-90 20 160)" textAnchor="middle">
                NET ASSIMILATION Pn (µmol CO₂/m²/s)
              </text>

              {/* Curve 1: 400 ppm (Ambient) */}
              <path
                d={curveAmbient400.reduce((acc, pt, i) => {
                  const x = 60 + (pt.ppfd / 1800) * 700;
                  const y = 270 - (pt.rate / 32) * 230;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              {/* Curve 2: 800 ppm (Enriched) */}
              <path
                d={curveEnriched800.reduce((acc, pt, i) => {
                  const x = 60 + (pt.ppfd / 1800) * 700;
                  const y = 270 - (pt.rate / 32) * 230;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />

              {/* Curve 3: 1200 ppm (High) */}
              <path
                d={curveEnriched1200.reduce((acc, pt, i) => {
                  const x = 60 + (pt.ppfd / 1800) * 700;
                  const y = 270 - (pt.rate / 32) * 230;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* Current Operating Point Pin */}
              {(() => {
                const currentX = 60 + (Math.min(1800, currentPpfd) / 1800) * 700;
                const currentY = 270 - (currentKinetics.netPhotosynthesis / 32) * 230;
                return (
                  <g>
                    {/* Dropline to axes */}
                    <line x1={currentX} y1="270" x2={currentX} y2={currentY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="60" y1={currentY} x2={currentX} y2={currentY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    
                    {/* Glowing point */}
                    <circle cx={currentX} cy={currentY} r="14" fill="url(#activePointGlow)" />
                    <circle cx={currentX} cy={currentY} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />

                    {/* Annotation Flag */}
                    <rect x={Math.min(620, currentX + 10)} y={currentY - 30} width="140" height="26" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <text x={Math.min(620, currentX + 10) + 70} y={currentY - 13} fill="#38bdf8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600" textAnchor="middle">
                      {currentKinetics.netPhotosynthesis} µmol @ {currentPpfd} PPFD
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* CO2 Controls & Mass Balance Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dynamic CO2 & Environmental Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>CO₂ Concentration & Microclimate Setpoints</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">CO₂ Concentration:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{co2Ppm} ppm</span>
              </div>
              <input
                type="range"
                min="400"
                max="1400"
                step="25"
                value={co2Ppm}
                onChange={(e) => setCo2Ppm(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                <span>Ambient (400)</span>
                <span>Commercial Optimal (800 - 1000)</span>
                <span>Saturation (1400)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Canopy Temperature:</span>
                <span className="font-mono font-bold text-white text-sm">{simTemp.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="16"
                max="32"
                step="0.5"
                value={simTemp}
                onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Warmer temperatures increase Rubisco activation rate but also accelerate photorespiration and dark respiration.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Ventilation Air Changes (ACH):</span>
                <span className="font-mono font-bold text-purple-400 text-sm">
                  {ventilationRateAirChangesPerHour.toFixed(1)} / hr
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="8.0"
                step="0.2"
                value={ventilationRateAirChangesPerHour}
                onChange={(e) => setVentilationRate(parseFloat(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                High summer roof ventilation discharges injected CO₂ into the atmosphere, reducing enrichment economic efficiency.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Greenhouse CO2 Mass Balance Accounting */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Mass Balance Accounting (Unit 2.3)</span>
            </h3>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                netCo2Balance >= 0
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              }`}
            >
              {netCo2Balance >= 0 ? 'CO₂ ACCUMULATING' : 'CO₂ DEPLETING'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-300">CO₂ Burner / Liquid Injection Rate:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                +{co2InjectionKgPerHour} kg / hr
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-300">Canopy Photosynthetic Sink (Consumption):</span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                -{canopySinkKgHr} kg / hr
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-300">Ventilation / Infiltration Loss:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                -{ventLossFactor.toFixed(1)} kg / hr
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-700 flex justify-between items-center font-bold">
              <span className="text-white">Net Hourly Differential (d[CO₂]/dt):</span>
              <span
                className={`font-mono text-base ${
                  netCo2Balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netCo2Balance >= 0 ? `+${netCo2Balance}` : netCo2Balance} kg / hr
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            <strong>Key Agronomic Finding:</strong> Supplemental artificial lighting without simultaneous CO₂ dosing is economically inefficient. Under 800 µmol/m²/s PPFD, increasing CO₂ from 400 to 900 ppm boosts net crop photosynthesis by <strong className="text-emerald-400">+29.4%</strong> without increasing fixture electrical power!
          </p>
        </div>
      </div>
    </div>
  );
};
