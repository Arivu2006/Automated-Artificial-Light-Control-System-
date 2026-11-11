import React, { useState } from 'react';
import { 
  Zap, Sliders, Sun, Clock, DollarSign, 
  Flame, Leaf, BarChart2, Check, RefreshCw 
} from 'lucide-react';
import { CropProfile, LightControlMode, SpectrumSettings } from '../types/greenhouse';
import { 
  calculateSpectrumMetrics, compareFixtureEfficiency, 
  calculateRequiredSupplementalPpfd, ppfdToDli 
} from '../models/agronomicModels';

interface LightControlProps {
  cropProfile: CropProfile;
  spectrum: SpectrumSettings;
  setSpectrum: (s: SpectrumSettings) => void;
  dimmingPercent: number;
  setDimmingPercent: (dim: number) => void;
  controlMode: LightControlMode;
  setControlMode: (mode: LightControlMode) => void;
  naturalPpfd: number;
  supplementalPpfd: number;
  accumulatedDli: number;
  targetDli: number;
  setTargetDli: (dli: number) => void;
  currentHour: number;
}

export const ArtificialLightControlView: React.FC<LightControlProps> = ({
  cropProfile,
  spectrum,
  setSpectrum,
  dimmingPercent,
  setDimmingPercent,
  controlMode,
  setControlMode,
  naturalPpfd,
  supplementalPpfd,
  accumulatedDli,
  targetDli,
  setTargetDli,
  currentHour,
}) => {
  const [selectedPresetRecipe, setSelectedPresetRecipe] = useState<string>('custom');
  const [areaM2, setAreaM2] = useState<number>(2400); // 1 Bay = 2400 m²

  // Calculate photobiology metrics
  const specMetrics = calculateSpectrumMetrics(
    spectrum.deepRed,
    spectrum.royalBlue,
    spectrum.farRed,
    spectrum.white
  );

  // Compare LED vs HPS
  const comparison = compareFixtureEfficiency(supplementalPpfd, areaM2, 0.20, 16);

  // Preset spectral recipes
  const applyPresetRecipe = (recipeKey: string) => {
    setSelectedPresetRecipe(recipeKey);
    if (recipeKey === 'vegetative') {
      setSpectrum({ deepRed: 50, royalBlue: 35, farRed: 5, white: 10 });
    } else if (recipeKey === 'fruiting') {
      setSpectrum({ deepRed: 70, royalBlue: 15, farRed: 10, white: 5 });
    } else if (recipeKey === 'flowering_induction') {
      // High Far-Red triggers shade avoidance & fast flowering
      setSpectrum({ deepRed: 55, royalBlue: 15, farRed: 25, white: 5 });
    } else if (recipeKey === 'balanced_broad') {
      setSpectrum({ deepRed: 55, royalBlue: 20, farRed: 5, white: 20 });
    }
  };

  const remainingHours = Math.max(1, 21 - Math.floor(currentHour));
  const autoRequiredPpfd = calculateRequiredSupplementalPpfd(targetDli, accumulatedDli, remainingHours);

  return (
    <div className="space-y-6">
      {/* Unit II 2.1 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-pink-400">
            <span>UNIT II.1</span>
            <span aria-hidden="true">·</span>
            <span>ENVIRONMENT CONTROL SYSTEMS</span>
            <span aria-hidden="true">·</span>
            <span>ARTIFICIAL LIGHT SYSTEMS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Automated Artificial Light & Dynamic Spectrum Engine
          </h2>
        </div>

        {/* Operating Control Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs self-start">
          {[
            { id: 'dli_auto', label: 'DLI Target Auto-Track' },
            { id: 'tariff_optimized', label: 'Time-of-Use Tariff' },
            { id: 'constant_ppfd', label: 'Constant PPFD' },
            { id: 'manual', label: 'Manual Override' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setControlMode(mode.id as LightControlMode)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                controlMode === mode.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary 2-Column Split: Spectrum Synthesizer & Closed Loop Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multichannel Spectrum Tuner (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Multichannel Spectral Power Distribution (SPD)
              </h3>
              <p className="text-xs text-slate-400">
                Tune photosynthetic action spectra: Chlorophyll absorption, Cryptochromes, and Phytochromes.
              </p>
            </div>

            {/* Quick Recipe Buttons */}
            <div className="flex items-center gap-1 text-xs">
              {[
                { id: 'vegetative', label: 'Vegetative' },
                { id: 'fruiting', label: 'Fruiting / Yield' },
                { id: 'flowering_induction', label: 'Floral Induction' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => applyPresetRecipe(btn.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    selectedPresetRecipe === btn.id
                      ? 'bg-slate-800 text-pink-300 border-pink-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Spectral Wavelength Curve (SVG Visualizer) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-mono text-slate-400 text-[11px]">PAR SPECTRUM (380 - 780 nm)</span>
              <span className="font-mono text-emerald-400 text-[11px]">
                R:FR RATIO: {specMetrics.redToFarRedRatio} · PSS: {specMetrics.pssPhytochromeRatio}
              </span>
            </div>

            <div className="h-32 w-full flex items-end gap-1 relative select-none">
              {/* Spectral wavelength bars representation */}
              {Array.from({ length: 40 }).map((_, i) => {
                const wl = 380 + i * 10;
                let height = 10;
                let color = '#38bdf8';

                // Blue peak (430-470nm)
                if (wl >= 430 && wl <= 470) {
                  height = Math.max(15, (spectrum.royalBlue / 100) * 85);
                  color = '#3b82f6';
                }
                // Green/Yellow (500-580nm, from White LEDs)
                else if (wl >= 500 && wl <= 580) {
                  height = Math.max(8, (spectrum.white / 100) * 55);
                  color = '#22c55e';
                }
                // Orange/Red (600-640nm)
                else if (wl >= 600 && wl <= 640) {
                  height = Math.max(12, ((spectrum.white * 0.4 + spectrum.deepRed * 0.4) / 100) * 75);
                  color = '#f97316';
                }
                // Deep Red peak (650-680nm) - Main Photosystem II driver
                else if (wl >= 650 && wl <= 680) {
                  height = Math.max(20, (spectrum.deepRed / 100) * 98);
                  color = '#ef4444';
                }
                // Far-Red peak (710-740nm) - Emerson enhancement & shade avoidance
                else if (wl >= 710 && wl <= 740) {
                  height = Math.max(10, (spectrum.farRed / 100) * 88);
                  color = '#dc2626';
                }

                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div
                      className="w-full rounded-t transition-all duration-300 opacity-90 group-hover:opacity-100"
                      style={{
                        height: `${height}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}33`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
              <span>380nm (UV)</span>
              <span>450nm (Royal Blue)</span>
              <span>550nm (Green PAR)</span>
              <span>660nm (Deep Red)</span>
              <span>730nm (Far-Red)</span>
            </div>
          </div>

          {/* 4 Spectral Channel Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Channel 1: Deep Red */}
            <div className="p-3 bg-slate-950 rounded-lg border border-red-900/30 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-red-400 font-semibold flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Deep Red (660 nm)
                </span>
                <span className="font-mono font-bold text-white">{spectrum.deepRed}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={spectrum.deepRed}
                onChange={(e) => {
                  setSelectedPresetRecipe('custom');
                  setSpectrum({ ...spectrum, deepRed: parseInt(e.target.value) });
                }}
                className="w-full accent-red-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Primary Photosystem II driver. Maximum photon conversion efficiency.
              </span>
            </div>

            {/* Channel 2: Royal Blue */}
            <div className="p-3 bg-slate-950 rounded-lg border border-blue-900/30 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Royal Blue (450 nm)
                </span>
                <span className="font-mono font-bold text-white">{spectrum.royalBlue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={spectrum.royalBlue}
                onChange={(e) => {
                  setSelectedPresetRecipe('custom');
                  setSpectrum({ ...spectrum, royalBlue: parseInt(e.target.value) });
                }}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Activates cryptochromes & phototropins. Controls stomatal opening.
              </span>
            </div>

            {/* Channel 3: Far-Red */}
            <div className="p-3 bg-slate-950 rounded-lg border border-rose-900/30 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-600" />
                  Far-Red (730 nm)
                </span>
                <span className="font-mono font-bold text-white">{spectrum.farRed}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={spectrum.farRed}
                onChange={(e) => {
                  setSelectedPresetRecipe('custom');
                  setSpectrum({ ...spectrum, farRed: parseInt(e.target.value) });
                }}
                className="w-full accent-rose-600 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Emerson Enhancement Effect (+8-12% Pn) and flowering induction.
              </span>
            </div>

            {/* Channel 4: Full Spectrum White */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  Broad White PAR (4000K)
                </span>
                <span className="font-mono font-bold text-white">{spectrum.white}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={spectrum.white}
                onChange={(e) => {
                  setSelectedPresetRecipe('custom');
                  setSpectrum({ ...spectrum, white: parseInt(e.target.value) });
                }}
                className="w-full accent-slate-300 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Penetrates deep into lower leaves; allows human crop scouting without colored glasses.
              </span>
            </div>
          </div>

          {/* Photobiological Diagnostics Strip */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-slate-400">Emerson Enhancement Factor:</span>
              <span className="font-mono font-bold text-emerald-400 ml-1.5">
                {specMetrics.emersonEnhancementFactor}×
              </span>
            </div>
            <div>
              <span className="text-slate-400">Plant Morphology Signal:</span>
              <span className="text-slate-200 font-medium ml-1.5">{specMetrics.morphologyEffect}</span>
            </div>
          </div>
        </div>

        {/* Right Column: DLI Automation Controller & Dimmer Logic (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Closed-Loop Dimming Controller</h3>
            <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              {controlMode.toUpperCase().replace('_', ' ')}
            </span>
          </div>

          {/* DLI Target Setting */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Daily Light Integral (DLI) Target:</span>
              <span className="font-mono font-bold text-lg text-emerald-400">
                {targetDli.toFixed(1)} <span className="text-xs text-slate-400">mol/m²/d</span>
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="0.5"
              value={targetDli}
              onChange={(e) => setTargetDli(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Lettuce: 14-17 mol</span>
              <span>Strawberry: 18-22 mol</span>
              <span>Tomato: 24-28 mol</span>
            </div>
          </div>

          {/* Automated Dimmer Output Display */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">PID DIMMER COMMAND:</span>
              <span className="text-2xl font-bold font-mono text-pink-400 tabular-nums">
                {dimmingPercent}%
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-pink-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${dimmingPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">SUPPLEMENTAL PPFD</span>
                <span className="text-sm font-bold font-mono text-white">
                  {supplementalPpfd} µmol/m²/s
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">SOLAR CONTRIBUTION</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {naturalPpfd} µmol/m²/s
                </span>
              </div>
            </div>

            {controlMode === 'manual' && (
              <div className="pt-2">
                <span className="text-xs text-slate-400 block mb-1">Manual Dimming Slider:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dimmingPercent}
                  onChange={(e) => setDimmingPercent(parseInt(e.target.value))}
                  className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Photoperiod Schedule */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Photoperiod Schedule:
              </span>
              <span className="font-mono font-bold text-white">05:00 - 21:00 (16 hrs)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Provides 8 hours uninterrupted skotoperiod (darkness) required for starch remobilization and avoiding chlorotic leaf mottling.
            </p>
          </div>
        </div>
      </div>

      {/* Fixture Technology Benchmark (LED Toplight vs Legacy High Pressure Sodium HPS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>UNIT 2.1.1</span>
              <span aria-hidden="true">·</span>
              <span>ENGINEERING COMPARISON</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Dynamic LED Toplighting vs Legacy High-Pressure Sodium (HPS)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {comparison.energyReductionPercent}% ENERGY SAVINGS WITH LED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* LED Fixture Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Modern LED Toplighting</span>
              </h4>
              <span className="font-mono text-emerald-400 font-bold">{comparison.led.efficacy} µmol/J</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Electrical Power Load:</span>
                <span className="font-mono font-bold text-white">{comparison.led.powerKw} kW</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Daily Electricity Cost:</span>
                <span className="font-mono font-bold text-emerald-400">${comparison.led.dailyCost}/day</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Downward Radiant Heat:</span>
                <span className="font-mono font-bold text-slate-300">{comparison.led.heatLoadKw} kW (Low)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Top heatsinks convect warmth upwards away from foliage. Can be safely positioned 0.8m from canopy without burning leaf tips.
            </p>
          </div>

          {/* Legacy HPS Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 opacity-80">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Legacy 1000W HPS</span>
              </h4>
              <span className="font-mono text-amber-400 font-bold">{comparison.hps.efficacy} µmol/J</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Electrical Power Load:</span>
                <span className="font-mono font-bold text-white">{comparison.hps.powerKw} kW</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Daily Electricity Cost:</span>
                <span className="font-mono font-bold text-amber-400">${comparison.hps.dailyCost}/day</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Downward Radiant Heat:</span>
                <span className="font-mono font-bold text-rose-400">{comparison.hps.heatLoadKw} kW (Extreme)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              High thermal infrared beam causes leaf scorching if mounted within 2.2m. Requires heavy ventilation fans in summer.
            </p>
          </div>

          {/* Economic ROI Summary */}
          <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>Commercial Greenhouse Savings</span>
            </h4>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Daily Cost Reduction:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +${comparison.dailySavingsDollar} / day
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Annual Operating Savings:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +${(comparison.dailySavingsDollar * 210).toLocaleString()} / year
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>CO₂ Emissions Avoided:</span>
                <span className="font-mono font-bold text-white">
                  {(comparison.hps.powerKw - comparison.led.powerKw) * 16 * 0.42 * 210 / 1000 | 0} metric tons/yr
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Payback period for solid-state horticultural LEDs is approximately 2.3 commercial growing seasons under current EU/US agricultural tariffs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
