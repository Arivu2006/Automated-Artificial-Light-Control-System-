import React, { useState } from 'react';
import { 
  Camera, TrendingUp, Activity, CheckCircle, 
  AlertCircle, Leaf, Sparkles, Scale 
} from 'lucide-react';
import { CropProfile, GreenhouseBay } from '../types/greenhouse';
import { calculatePredictedYield } from '../models/agronomicModels';

interface PlantTelemetryProps {
  currentBay: GreenhouseBay;
  cropProfile: CropProfile;
}

export const PlantTelemetryView: React.FC<PlantTelemetryProps> = ({
  currentBay,
  cropProfile,
}) => {
  const [selectedCropStage, setSelectedCropStage] = useState<number>(2);

  // 30-Day Growth Progression Simulation Data (fresh biomass g/plant, LAI, cumulative yield)
  const growthCurve30Days = Array.from({ length: 30 }).map((_, day) => {
    const d = day + 1;
    const simulatedDliAvg = 24.5;
    const cumulativeDli = d * simulatedDliAvg;
    const lai = Math.min(4.2, 0.8 + Math.pow(d / 12, 1.6));
    const canopyCover = Math.min(96, Math.round(20 + Math.pow(d / 8, 1.8) * 6));
    const biomassGrams = Math.round(d * 18.5 * (1 + (lai / 4.2) * 0.4));
    const yieldKgM2 = calculatePredictedYield(cumulativeDli, cropProfile.lightUseEfficiency);
    return {
      day: d,
      lai: Number(lai.toFixed(1)),
      canopyCover,
      biomassGrams,
      yieldKgM2,
    };
  });

  return (
    <div className="space-y-6">
      {/* Unit II 2.4 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>UNIT II.4</span>
            <span aria-hidden="true">·</span>
            <span>ON-LINE MEASUREMENT OF PLANT GROWTH</span>
            <span aria-hidden="true">·</span>
            <span>DIGITAL PHENOTYPING</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Real-Time Plant Bio-Telemetry & Continuous Growth Sensing
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">Monitored Cultivar:</span>
          <span className="font-mono font-bold text-white">{cropProfile.cultivar}</span>
        </div>
      </div>

      {/* 4 In-Situ Non-Destructive Sensing Modalities Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Modality 1: Machine Vision Canopy Cover & LAI */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">OVERHEAD VISION</span>
            <span className="text-xs font-mono text-emerald-400">AI CAMERA 03</span>
          </div>

          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Canopy Fractional Cover</h4>
              <span className="text-[11px] text-slate-400">Computer Vision Segmentation</span>
            </div>
          </div>

          <div className="pt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                {currentBay.canopyCoverPercent}%
              </span>
              <span className="text-xs text-slate-400 block font-mono">CANOPY CLOSURE</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {currentBay.lai}
              </span>
              <span className="text-xs text-slate-400 block font-mono">LAI (m²/m²)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Overhead RGB-D cameras segment green leaf pixels vs background gutters continuously every 15 minutes.
          </div>
        </div>

        {/* Modality 2: Stem Micro-Dendrometer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">DISPLACEMENT SENSOR</span>
            <span className="text-xs font-mono text-emerald-400">±1 µm ACCURACY</span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Digital Stem Dendrometer</h4>
              <span className="text-[11px] text-slate-400">Micro-Expansion & Water Status</span>
            </div>
          </div>

          <div className="pt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
                +48.2
              </span>
              <span className="text-xs text-slate-400 block font-mono">µm / DAY GROWTH</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                14.2
              </span>
              <span className="text-xs text-slate-400 block font-mono">STEM DIA (mm)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Measures diurnal contraction during peak transpiration (noon) and nocturnal cell expansion in darkness.
          </div>
        </div>

        {/* Modality 3: Chlorophyll Fluorescence Fv/Fm */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">CHLOROPHYLL TELEMETRY</span>
            <span className="text-xs font-mono text-emerald-400">NO PHOTOINHIBITION</span>
          </div>

          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white">PSII Efficiency (Fv/Fm)</h4>
              <span className="text-[11px] text-slate-400">Photochemical Quantum Yield</span>
            </div>
          </div>

          <div className="pt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold font-mono text-amber-300 tabular-nums">
                0.832
              </span>
              <span className="text-xs text-slate-400 block font-mono">RATIO (OPTIMAL &gt;0.80)</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-emerald-400">STRESS FREE</span>
              <span className="text-[10px] text-slate-400 block font-mono">LIGHT TOLERANCE</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Detects light-induced photoinhibition. If Fv/Fm drops below 0.78, the automated system dims supplemental LEDs automatically.
          </div>
        </div>

        {/* Modality 4: Continuous Crop Load Cell */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">GRAVIMETRIC LYSIMETER</span>
            <span className="text-xs font-mono text-emerald-400">CONTINUOUS LOG</span>
          </div>

          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Continuous Plant Weight</h4>
              <span className="text-[11px] text-slate-400">Live Fresh Biomass Gain</span>
            </div>
          </div>

          <div className="pt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold font-mono text-purple-400 tabular-nums">
                +42.6
              </span>
              <span className="text-xs text-slate-400 block font-mono">g / PLANT / DAY</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                1,420
              </span>
              <span className="text-xs text-slate-400 block font-mono">TOTAL MASS (g)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Hanging strain-gauge load cells weigh representative plants continuously to track transpirational water loss and dry matter accumulation.
          </div>
        </div>
      </div>

      {/* 30-Day Growth Modeling & Biomass Projection Table / Visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>UNIT 1.6 & 2.4</span>
              <span aria-hidden="true">·</span>
              <span>BIOMASS ACCUMULATION & YIELD MODEL</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Cumulative Biomass Progression under Automated Lighting Regime
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            LUE = {cropProfile.lightUseEfficiency} g/mol PAR
          </span>
        </div>

        {/* Growth Curve Visual Progression Bar Chart */}
        <div className="h-44 w-full flex items-end gap-1.5 pt-4 select-none">
          {growthCurve30Days.map((step) => {
            const heightPercent = (step.biomassGrams / 800) * 100;
            return (
              <div
                key={step.day}
                className="flex-1 flex flex-col items-center group relative h-full justify-end"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 p-1.5 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none z-10">
                  <div>Day {step.day}: {step.biomassGrams}g/plant</div>
                  <div className="text-emerald-400">LAI: {step.lai} | Yield: {step.yieldKgM2} kg/m²</div>
                </div>

                <div
                  className="w-full bg-slate-800 group-hover:bg-emerald-400 rounded-t transition-all"
                  style={{ height: `${heightPercent}%` }}
                />

                {step.day % 5 === 0 && (
                  <span className="text-[10px] font-mono text-slate-500 mt-2">D{step.day}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Growth Stages Navigator */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-medium">Phenological Growth Stages:</span>
          <div className="flex items-center gap-1.5">
            {cropProfile.growthStages.map((stg, idx) => (
              <button
                key={stg}
                onClick={() => setSelectedCropStage(idx)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                  selectedCropStage === idx
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Stage {idx + 1}: {stg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
