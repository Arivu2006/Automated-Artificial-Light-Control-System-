import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Cloud, Zap, Droplets, Thermometer, Wind, 
  Play, Pause, RotateCcw, Eye, Info, Layers, Sliders
} from 'lucide-react';
import { CropProfile, GreenhouseBay, SpectrumSettings } from '../types/greenhouse';
import { calculatePhotosynthesisRate, calculateVpd, ppfdToDli } from '../models/agronomicModels';

interface DigitalTwinProps {
  currentBay: GreenhouseBay;
  cropProfile: CropProfile;
  currentHour: number;
  setCurrentHour: React.Dispatch<React.SetStateAction<number>>;
  weatherPreset: string;
  setWeatherPreset: (preset: string) => void;
  solarPpfd: number;
  supplementalPpfd: number;
  dimmingPercent: number;
  setDimmingPercent: (dim: number) => void;
  spectrum: SpectrumSettings;
  co2Ppm: number;
  setCo2Ppm: (co2: number) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
}

export const GreenhouseDigitalTwin: React.FC<DigitalTwinProps> = ({
  currentBay,
  cropProfile,
  currentHour,
  setCurrentHour,
  weatherPreset,
  setWeatherPreset,
  solarPpfd,
  supplementalPpfd,
  dimmingPercent,
  setDimmingPercent,
  spectrum,
  co2Ppm,
  setCo2Ppm,
  isSimulating,
  setIsSimulating,
}) => {
  const [shadeScreenClosed, setShadeScreenClosed] = useState(false);
  const [interlightActive, setInterlightActive] = useState(true);
  const [activeSensorView, setActiveSensorView] = useState<'all' | 'par' | 'co2' | 'temp'>('all');
  const [showRayTracing, setShowRayTracing] = useState(true);

  // Auto-step simulation timer
  useEffect(() => {
    let interval: any = null;
    if (isSimulating) {
      interval = setInterval(() => {
        setCurrentHour((prev) => (prev >= 23 ? 0 : Number((prev + 0.5).toFixed(1))));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isSimulating, setCurrentHour]);

  // Total canopy PPFD (accounting for shade screen)
  const screenTransmission = shadeScreenClosed ? 0.35 : 0.85;
  const effectiveNaturalPpfd = Math.round(solarPpfd * screenTransmission);
  const totalPpfd = effectiveNaturalPpfd + supplementalPpfd;

  // VPD calculation
  const vpd = calculateVpd(currentBay.airTemp, currentBay.rhPercent);

  // Photosynthesis kinetics
  const photo = calculatePhotosynthesisRate(totalPpfd, co2Ppm, currentBay.airTemp);

  // Compute RGB glow from spectrum ratio:
  // Deep Red: #ff1a53, Royal Blue: #2563eb, Far Red: #b91c1c, White: #f8fafc
  const rWeight = spectrum.deepRed / 100;
  const bWeight = spectrum.royalBlue / 100;
  const wWeight = spectrum.white / 100;
  const frWeight = spectrum.farRed / 100;

  // Spectrum hex representation
  const glowOpacity = (dimmingPercent / 100) * 0.75;
  const redComponent = Math.round(Math.min(255, (rWeight * 255 + frWeight * 220 + wWeight * 240)));
  const greenComponent = Math.round(Math.min(255, (wWeight * 220 + bWeight * 40)));
  const blueComponent = Math.round(Math.min(255, (bWeight * 255 + wWeight * 240 + rWeight * 60)));
  const spectrumColorRgb = `rgba(${redComponent}, ${greenComponent}, ${blueComponent}, ${glowOpacity})`;

  // Calculate sun position in sky for SVG
  // 0h: midnight, 6h: sunrise (x=60, y=140), 12h: noon (x=400, y=30), 18h: sunset (x=740, y=140)
  const isDaytime = currentHour >= 5.5 && currentHour <= 19.5;
  const sunProgress = (currentHour - 5.5) / 14; // 0 to 1
  const sunX = 80 + sunProgress * 640;
  const sunY = 160 - Math.sin(Math.max(0, Math.min(Math.PI, sunProgress * Math.PI))) * 130;

  return (
    <div className="space-y-6">
      {/* Top Telemetry & Global Controls Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Diurnal Time Scrubber & Controls */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-1.5 rounded-md transition-colors ${
                isSimulating ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
              title={isSimulating ? 'Pause Simulation' : 'Start Continuous Diurnal Run'}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCurrentHour(12)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset to Midday 12:00"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 pl-1">
              <span className="text-xs text-slate-400 font-mono">TIME:</span>
              <span className="font-mono font-bold text-sm text-white w-12 tabular-nums">
                {String(Math.floor(currentHour)).padStart(2, '0')}:
                {String(Math.round((currentHour % 1) * 60)).padStart(2, '0')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23.5"
              step="0.5"
              value={currentHour}
              onChange={(e) => setCurrentHour(parseFloat(e.target.value))}
              className="w-28 accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Weather Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="px-2 text-slate-400 font-medium">Weather:</span>
            {[
              { id: 'overcast_winter', label: 'Overcast Winter', icon: Cloud },
              { id: 'variable_spring', label: 'Variable Spring', icon: Wind },
              { id: 'sunny_summer', label: 'Clear Summer', icon: Sun },
            ].map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => setWeatherPreset(preset.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    weatherPreset === preset.id
                      ? 'bg-slate-800 text-white font-medium border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Viewport Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShadeScreenClosed(!shadeScreenClosed)}
            className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              shadeScreenClosed
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Thermal Screen: {shadeScreenClosed ? 'DEPLOYED (35% T)' : 'RETRACTED'}</span>
          </button>

          <button
            onClick={() => setShowRayTracing(!showRayTracing)}
            className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              showRayTracing
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Photon Rays: {showRayTracing ? 'VISIBLE' : 'HIDDEN'}</span>
          </button>
        </div>
      </div>

      {/* Main Digital Twin Visual Cross-Section Stage */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Dynamic Background Atmosphere */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
          style={{
            background: isDaytime
              ? weatherPreset === 'overcast_winter'
                ? 'linear-gradient(to bottom, #1e293b 0%, #0f172a 60%, #020617 100%)'
                : 'linear-gradient(to bottom, #0369a1 0%, #0284c7 25%, #0f172a 75%, #020617 100%)'
              : 'linear-gradient(to bottom, #020617 0%, #030712 100%)',
            opacity: 0.85,
          }}
        />

        {/* High-fidelity SVG Structural Cross Section */}
        <div className="relative w-full aspect-[16/9] min-h-[460px] flex items-center justify-center p-2">
          <svg
            viewBox="0 0 900 520"
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* LED Radiant Beam Gradient */}
              <radialGradient id="ledConeGlow" cx="50%" cy="0%" r="90%">
                <stop offset="0%" stopColor={spectrumColorRgb} stopOpacity={dimmingPercent > 0 ? 0.85 : 0} />
                <stop offset="45%" stopColor={spectrumColorRgb} stopOpacity={dimmingPercent > 0 ? 0.35 : 0} />
                <stop offset="100%" stopColor={spectrumColorRgb} stopOpacity="0" />
              </radialGradient>

              {/* Interlight sub-canopy glow */}
              <radialGradient id="interlightGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(244, 63, 94, 0.7)" />
                <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
              </radialGradient>

              {/* Sunlight Beam Gradient */}
              <linearGradient id="sunbeam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity={isDaytime ? 0.35 : 0} />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>

              {/* Tomato Foliage Leaf Pattern */}
              <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>

              {/* Ripe Tomato Fruit Gradient */}
              <radialGradient id="tomatoFruit" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="80%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
              </radialGradient>
            </defs>

            {/* Sky Background Elements: Celestial Body */}
            {isDaytime ? (
              <g transform={`translate(${sunX}, ${sunY})`}>
                <circle r="22" fill="#fef08a" className="filter drop-shadow-[0_0_16px_rgba(250,204,21,0.8)]" />
                <circle r="34" fill="#fde047" opacity="0.25" />
              </g>
            ) : (
              <g transform="translate(140, 60)">
                <circle r="16" fill="#e2e8f0" opacity="0.85" />
                <circle cx="6" cy="-4" r="14" fill="#030712" />
              </g>
            )}

            {/* Clouds if overcast or variable */}
            {weatherPreset !== 'sunny_summer' && isDaytime && (
              <g fill="#94a3b8" opacity={weatherPreset === 'overcast_winter' ? 0.75 : 0.45}>
                <path d="M 220 50 a 25 25 0 0 1 45 -10 a 35 35 0 0 1 65 10 a 25 25 0 0 1 10 35 l -120 0 z" />
                <path d="M 520 65 a 30 30 0 0 1 55 -15 a 45 45 0 0 1 80 15 a 30 30 0 0 1 15 45 l -150 0 z" />
              </g>
            )}

            {/* Greenhouse External Pyranometer Sensor on Glass Ridge */}
            <g transform="translate(450, 85)">
              <rect x="-3" y="0" width="6" height="25" fill="#64748b" />
              <ellipse cx="0" cy="0" rx="9" ry="5" fill="#0284c7" />
              <circle cx="0" cy="-2" r="4" fill="#38bdf8" />
              <text x="14" y="2" fill="#38bdf8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                PYRANOMETER: {solarPpfd} µmol/m²/s
              </text>
            </g>

            {/* Greenhouse Venlo Steel Frame & Glass Gables */}
            <g stroke="#475569" strokeWidth="2.5" fill="none">
              {/* Left Bay Ridge */}
              <line x1="80" y1="210" x2="260" y2="110" />
              <line x1="260" y1="110" x2="450" y2="210" />
              {/* Right Bay Ridge */}
              <line x1="450" y1="210" x2="640" y2="110" />
              <line x1="640" y1="110" x2="820" y2="210" />
              {/* Vertical Support Posts */}
              <line x1="80" y1="210" x2="80" y2="480" strokeWidth="4" stroke="#334155" />
              <line x1="450" y1="210" x2="450" y2="480" strokeWidth="5" stroke="#334155" />
              <line x1="820" y1="210" x2="820" y2="480" strokeWidth="4" stroke="#334155" />
              {/* Horizontal Trellis & Gutter Wire (y=210) */}
              <line x1="80" y1="210" x2="820" y2="210" stroke="#334155" strokeWidth="3" />
            </g>

            {/* Glass Panels Sheen */}
            <polygon points="80,210 260,110 450,210" fill="rgba(148, 163, 184, 0.08)" stroke="#64748b" strokeWidth="1" />
            <polygon points="450,210 640,110 820,210" fill="rgba(148, 163, 184, 0.08)" stroke="#64748b" strokeWidth="1" />

            {/* Retractable Thermal/Shading Screen Layer (y=215) */}
            {shadeScreenClosed ? (
              <g>
                <line x1="85" y1="215" x2="815" y2="215" stroke="#d97706" strokeWidth="6" strokeDasharray="8 3" opacity="0.9" />
                <text x="450" y="206" fill="#f59e0b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  THERMAL SCREEN DEPLOYED (-65% NATURAL LUX)
                </text>
              </g>
            ) : (
              <g>
                {/* Retracted Screen Bundles at Gutters */}
                <rect x="82" y="212" width="16" height="7" fill="#78350f" rx="2" />
                <rect x="442" y="212" width="16" height="7" fill="#78350f" rx="2" />
                <rect x="802" y="212" width="16" height="7" fill="#78350f" rx="2" />
              </g>
            )}

            {/* Overhead LED Toplighting Luminaires (Suspended at y=230) */}
            {/* Fixture 1 (Bay A, Left) */}
            <g transform="translate(190, 230)">
              {/* Radiant Light Cone */}
              {showRayTracing && dimmingPercent > 0 && (
                <polygon points="0,8 -160,240 160,240" fill="url(#ledConeGlow)" />
              )}
              {/* Light Fixture Housing */}
              <rect x="-45" y="-4" width="90" height="12" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              {/* Dynamic LED Emitter Strips */}
              <rect
                x="-40"
                y="5"
                width="80"
                height="4"
                fill={dimmingPercent > 0 ? spectrumColorRgb : '#334155'}
                className="transition-all duration-300"
              />
              <line x1="-30" y1="-20" x2="-30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
              <line x1="30" y1="-20" x2="30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
            </g>

            {/* Fixture 2 (Bay A, Center-Left) */}
            <g transform="translate(330, 230)">
              {showRayTracing && dimmingPercent > 0 && (
                <polygon points="0,8 -160,240 160,240" fill="url(#ledConeGlow)" />
              )}
              <rect x="-45" y="-4" width="90" height="12" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect
                x="-40"
                y="5"
                width="80"
                height="4"
                fill={dimmingPercent > 0 ? spectrumColorRgb : '#334155'}
              />
              <line x1="-30" y1="-20" x2="-30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
              <line x1="30" y1="-20" x2="30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
            </g>

            {/* Fixture 3 (Bay B, Center-Right) */}
            <g transform="translate(570, 230)">
              {showRayTracing && dimmingPercent > 0 && (
                <polygon points="0,8 -160,240 160,240" fill="url(#ledConeGlow)" />
              )}
              <rect x="-45" y="-4" width="90" height="12" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect
                x="-40"
                y="5"
                width="80"
                height="4"
                fill={dimmingPercent > 0 ? spectrumColorRgb : '#334155'}
              />
              <line x1="-30" y1="-20" x2="-30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
              <line x1="30" y1="-20" x2="30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
            </g>

            {/* Fixture 4 (Bay B, Right) */}
            <g transform="translate(710, 230)">
              {showRayTracing && dimmingPercent > 0 && (
                <polygon points="0,8 -160,240 160,240" fill="url(#ledConeGlow)" />
              )}
              <rect x="-45" y="-4" width="90" height="12" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect
                x="-40"
                y="5"
                width="80"
                height="4"
                fill={dimmingPercent > 0 ? spectrumColorRgb : '#334155'}
              />
              <line x1="-30" y1="-20" x2="-30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
              <line x1="30" y1="-20" x2="30" y2="-4" stroke="#64748b" strokeWidth="1.5" />
            </g>

            {/* Hydroponic Benches & Gutters (y=440 to 480) */}
            <rect x="70" y="470" width="760" height="40" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            {/* Rockwool slabs */}
            <rect x="140" y="450" width="140" height="20" fill="#334155" rx="3" stroke="#475569" />
            <rect x="300" y="450" width="140" height="20" fill="#334155" rx="3" stroke="#475569" />
            <rect x="520" y="450" width="140" height="20" fill="#334155" rx="3" stroke="#475569" />
            <rect x="680" y="450" width="140" height="20" fill="#334155" rx="3" stroke="#475569" />

            {/* Plant Canopies: High-Wire Vines (Leaves + Trusses) */}
            {/* Crop Row 1 (Center: x=210) */}
            <g transform="translate(210, 270)">
              {/* High-wire vertical support string */}
              <line x1="0" y1="-50" x2="0" y2="180" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
              {/* Tomato Vine Stem */}
              <path d="M 0 180 Q -10 130 5 90 Q -8 50 2 0" fill="none" stroke="#22c55e" strokeWidth="3" />
              
              {/* Foliage Clusters */}
              <ellipse cx="-20" cy="15" rx="24" ry="14" fill="url(#leafGrad)" />
              <ellipse cx="22" cy="35" rx="26" ry="15" fill="url(#leafGrad)" />
              <ellipse cx="-25" cy="65" rx="28" ry="16" fill="url(#leafGrad)" />
              <ellipse cx="28" cy="95" rx="28" ry="16" fill="url(#leafGrad)" />
              <ellipse cx="-22" cy="125" rx="25" ry="15" fill="url(#leafGrad)" />

              {/* Fruiting Trusses (Tomatoes) */}
              <circle cx="14" cy="80" r="7" fill="url(#tomatoFruit)" />
              <circle cx="22" cy="85" r="8" fill="url(#tomatoFruit)" />
              <circle cx="16" cy="94" r="6.5" fill="url(#tomatoFruit)" />
              <circle cx="-16" cy="140" r="7.5" fill="url(#tomatoFruit)" />
              <circle cx="-8" cy="145" r="7" fill="url(#tomatoFruit)" />

              {/* Sub-Canopy LED Interlighting Bar (Unit 2.1.1) */}
              {interlightActive && (
                <g transform="translate(-40, 85)">
                  <rect x="0" y="0" width="80" height="8" rx="2" fill="#1e293b" stroke="#e11d48" strokeWidth="1.5" />
                  <rect x="2" y="2" width="76" height="4" fill="#fb7185" />
                  <circle cx="40" cy="4" r="28" fill="url(#interlightGlow)" />
                </g>
              )}
            </g>

            {/* Crop Row 2 (Center: x=370) */}
            <g transform="translate(370, 270)">
              <line x1="0" y1="-50" x2="0" y2="180" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 0 180 Q 12 120 -6 80 Q 10 40 0 0" fill="none" stroke="#22c55e" strokeWidth="3" />
              <ellipse cx="20" cy="20" rx="24" ry="14" fill="url(#leafGrad)" />
              <ellipse cx="-22" cy="45" rx="26" ry="15" fill="url(#leafGrad)" />
              <ellipse cx="26" cy="75" rx="27" ry="16" fill="url(#leafGrad)" />
              <ellipse cx="-24" cy="110" rx="26" ry="15" fill="url(#leafGrad)" />
              <circle cx="-14" cy="90" r="7.5" fill="url(#tomatoFruit)" />
              <circle cx="-22" cy="95" r="7" fill="url(#tomatoFruit)" />
            </g>

            {/* Crop Row 3 (Center: x=590) */}
            <g transform="translate(590, 270)">
              <line x1="0" y1="-50" x2="0" y2="180" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 0 180 Q -10 120 8 70 Q -6 35 0 0" fill="none" stroke="#22c55e" strokeWidth="3" />
              <ellipse cx="-20" cy="18" rx="25" ry="14" fill="url(#leafGrad)" />
              <ellipse cx="24" cy="45" rx="27" ry="15" fill="url(#leafGrad)" />
              <ellipse cx="-26" cy="80" rx="26" ry="15" fill="url(#leafGrad)" />
              <ellipse cx="25" cy="115" rx="27" ry="16" fill="url(#leafGrad)" />
              <circle cx="16" cy="95" r="8" fill="url(#tomatoFruit)" />
              <circle cx="24" cy="100" r="7" fill="url(#tomatoFruit)" />
            </g>

            {/* Crop Row 4 (Center: x=750) */}
            <g transform="translate(750, 270)">
              <line x1="0" y1="-50" x2="0" y2="180" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 0 180 Q 8 130 -10 85 Q 6 40 0 0" fill="none" stroke="#22c55e" strokeWidth="3" />
              <ellipse cx="20" cy="22" rx="24" ry="14" fill="url(#leafGrad)" />
              <ellipse cx="-22" cy="50" rx="26" ry="15" fill="url(#leafGrad)" />
              <ellipse cx="24" cy="85" rx="27" ry="15" fill="url(#leafGrad)" />
              <circle cx="-12" cy="100" r="7.5" fill="url(#tomatoFruit)" />
            </g>

            {/* In-Situ Ground & Canopy Sensors Overlay */}
            {/* 1. Quantum PAR Sensor at Canopy Apex (x=210, y=260) */}
            <g transform="translate(245, 265)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="#06b6d4" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="8" y="-12" width="130" height="24" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
              <text x="14" y="4" fill="#38bdf8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                PAR: {totalPpfd} µmol
              </text>
            </g>

            {/* 2. Infrared Canopy Temperature Radiometer (x=370, y=290) */}
            <g transform="translate(405, 305)">
              <line x1="0" y1="0" x2="0" y2="30" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="8" y="-12" width="140" height="24" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
              <text x="14" y="4" fill="#fbbf24" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                CANOPY T: {currentBay.canopyTemp}°C
              </text>
            </g>

            {/* 3. High-Resolution Digital Stem Dendrometer (x=590, y=410) */}
            <g transform="translate(620, 415)">
              <circle cx="0" cy="0" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="8" y="-12" width="140" height="24" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              <text x="14" y="4" fill="#34d399" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                STEM: +48.2 µm/d
              </text>
            </g>

            {/* 4. CO2 Sniffer Inlet Tube (x=520, y=340) */}
            <g transform="translate(480, 360)">
              <circle cx="0" cy="0" r="4.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="-120" y="-12" width="112" height="24" rx="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
              <text x="-114" y="4" fill="#c084fc" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                CO₂: {co2Ppm} ppm
              </text>
            </g>
          </svg>
        </div>

        {/* Live HUD Floating Indicators */}
        <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-slate-400 block text-[11px] font-mono">NATURAL SOLAR</span>
              <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
                {effectiveNaturalPpfd} <span className="text-[10px] text-slate-400">µmol/m²/s</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-mono">SUPPLEMENTAL LED</span>
              <span className="font-mono font-bold text-sm text-pink-400 tabular-nums">
                {supplementalPpfd} <span className="text-[10px] text-slate-400">µmol/m²/s</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-mono">CANOPY TOTAL PPFD</span>
              <span className="font-mono font-bold text-base text-white tabular-nums">
                {totalPpfd} <span className="text-[10px] text-slate-400">µmol/m²/s</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-mono">DLI ACCUMULATED</span>
              <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                {currentBay.accumulatedDli.toFixed(1)} / {currentBay.targetDli.toFixed(1)}{' '}
                <span className="text-[10px] text-slate-400">mol/m²/d</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-mono">NET ASSIMILATION (Pn)</span>
              <span className="font-mono font-bold text-sm text-cyan-400 tabular-nums">
                {photo.netPhotosynthesis} <span className="text-[10px] text-slate-400">µmol CO₂/m²/s</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-mono">VPD</span>
              <span className="font-mono font-bold text-sm text-slate-200 tabular-nums">
                {vpd.toFixed(2)} <span className="text-[10px] text-slate-400">kPa</span>
              </span>
            </div>
          </div>

          {/* Quick Dimmer Slider */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-mono text-[11px]">LED DIM:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={dimmingPercent}
              onChange={(e) => setDimmingPercent(parseInt(e.target.value))}
              className="w-20 accent-pink-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <span className="font-mono font-semibold text-white w-8 text-right tabular-nums">
              {dimmingPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Analytical Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Closed-Loop Automation Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Closed-Loop Lighting Logic</h3>
            <span className="text-xs font-mono text-emerald-400">PID ACTIVE</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The automated controller reads external solar pyranometer data and internal quantum PAR sensors. When clouds roll in, the LED driver dynamically raises supplemental output to prevent daily light deficit.
          </p>
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Target Daily DLI:</span>
              <span className="font-mono font-semibold">{currentBay.targetDli} mol/m²/day</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Remaining Hours:</span>
              <span className="font-mono font-semibold">
                {Math.max(0, 21 - Math.floor(currentHour))} hours
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Required Avg PPFD:</span>
              <span className="font-mono font-semibold text-pink-400">
                {Math.round(
                  Math.max(0, (currentBay.targetDli - currentBay.accumulatedDli) * 1000000) /
                    (Math.max(1, 21 - Math.floor(currentHour)) * 3600)
                )}{' '}
                µmol/m²/s
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Spectrum Ratio Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Multichannel LED Spectrum</h3>
            <span className="text-xs font-mono text-slate-400">660nm / 450nm / 730nm</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dynamic ratio tuned for <strong className="text-slate-200">{cropProfile.name}</strong>. Deep red targets chlorophyll a/b absorption; royal blue drives stomatal aperture and prevents stretching.
          </p>
          <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
            <div className="p-2 bg-red-950/40 border border-red-800/40 rounded-lg">
              <span className="text-[10px] text-red-400 block">DEEP RED</span>
              <span className="font-bold text-red-300">{spectrum.deepRed}%</span>
            </div>
            <div className="p-2 bg-blue-950/40 border border-blue-800/40 rounded-lg">
              <span className="text-[10px] text-blue-400 block">ROYAL BLUE</span>
              <span className="font-bold text-blue-300">{spectrum.royalBlue}%</span>
            </div>
            <div className="p-2 bg-rose-950/40 border border-rose-800/40 rounded-lg">
              <span className="text-[10px] text-rose-400 block">FAR RED</span>
              <span className="font-bold text-rose-300">{spectrum.farRed}%</span>
            </div>
            <div className="p-2 bg-slate-800/60 border border-slate-700/50 rounded-lg">
              <span className="text-[10px] text-slate-400 block">WHITE PAR</span>
              <span className="font-bold text-slate-200">{spectrum.white}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: CO2 & Light Coupling */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">CO₂ Sink & Kinetics</h3>
            <span className="text-xs font-mono text-cyan-400">Unit 2.3 Model</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            At {totalPpfd} µmol/m²/s PPFD, canopy photosynthetic sink consumes CO₂ rapidly. Raising CO₂ to {co2Ppm} ppm shifts light saturation from 750 to {photo.lightSaturationPoint} µmol/m²/s.
          </p>
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Canopy Consumption:</span>
              <span className="font-mono font-semibold text-cyan-400">
                {photo.co2ConsumptionKgHaHr} kg CO₂ / ha / hr
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Light Saturation Point:</span>
              <span className="font-mono font-semibold">{photo.lightSaturationPoint} µmol/m²/s</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Quantum Yield (α):</span>
              <span className="font-mono font-semibold">{photo.quantumYield} mol/mol</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
