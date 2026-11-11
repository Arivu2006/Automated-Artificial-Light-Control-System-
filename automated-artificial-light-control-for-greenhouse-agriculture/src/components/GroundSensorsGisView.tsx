import React, { useState } from 'react';
import { 
  MapPin, Eye, Activity, BarChart3, AlertCircle, 
  Layers, CheckCircle2, TrendingUp, Sliders
} from 'lucide-react';
import { GreenhouseBay, SensorReading } from '../types/greenhouse';
import { calculateCanopyLightAbsorption, calculatePredictedYield } from '../models/agronomicModels';

interface GroundSensorsGisProps {
  bays: GreenhouseBay[];
  selectedBayId: string;
  setSelectedBayId: (id: string) => void;
  groundSensors: SensorReading[];
}

export const GroundSensorsGisView: React.FC<GroundSensorsGisProps> = ({
  bays,
  selectedBayId,
  setSelectedBayId,
  groundSensors,
}) => {
  const [heatmapLayer, setHeatmapLayer] = useState<'ppfd' | 'canopyTemp' | 'ndvi' | 'yield'>('ppfd');
  const [testLai, setTestLai] = useState<number>(3.4);
  const [testExtinctionK, setTestExtinctionK] = useState<number>(0.65);

  const selectedBay = bays.find((b) => b.id === selectedBayId) || bays[0];

  // Beer-Lambert calculation
  const beerLambert = calculateCanopyLightAbsorption(
    selectedBay.currentNaturalPpfd + selectedBay.currentSupplementalPpfd,
    testLai,
    testExtinctionK
  );

  return (
    <div className="space-y-6">
      {/* Unit I Header & Curricular Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>UNIT I</span>
            <span aria-hidden="true">·</span>
            <span>PRECISION FARMING</span>
            <span aria-hidden="true">·</span>
            <span>GROUND SENSORS & GIS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Spatial Greenhouse GIS & Ground-Based Sensor Network
          </h2>
        </div>

        {/* Heatmap Layer Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs self-start">
          {[
            { id: 'ppfd', label: 'PPFD Uniformity' },
            { id: 'canopyTemp', label: 'Canopy Temp ΔT' },
            { id: 'ndvi', label: 'Remote Sensing NDVI' },
            { id: 'yield', label: 'Spatial Yield Map' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setHeatmapLayer(layer.id as any)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                heatmapLayer === layer.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Split: GIS Spatial Map on Left, Selected Bay Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive GIS Spatial Grid (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Greenhouse Spatial Layout (Geo-Referenced Bays)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">COORDINATE GRID: 48°12'N 11°34'E</span>
          </div>

          <p className="text-xs text-slate-400">
            Click on any greenhouse bay zone to inspect local microclimate, ground sensor readings, and precision lighting prescriptions.
          </p>

          {/* GIS Visual Grid of 4 Bays */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {bays.map((bay) => {
              const isSelected = bay.id === selectedBayId;
              let metricValue = `${bay.currentNaturalPpfd + bay.currentSupplementalPpfd} µmol`;
              let metricLabel = 'Canopy PPFD';
              let badgeColor = 'text-cyan-400';

              if (heatmapLayer === 'canopyTemp') {
                const delta = (bay.canopyTemp - bay.airTemp).toFixed(1);
                metricValue = `${bay.canopyTemp}°C (ΔT ${delta > '0' ? '+' : ''}${delta}°C)`;
                metricLabel = 'Canopy Temp';
                badgeColor = 'text-amber-400';
              } else if (heatmapLayer === 'ndvi') {
                metricValue = `${bay.ndvi.toFixed(2)}`;
                metricLabel = 'Canopy NDVI';
                badgeColor = 'text-emerald-400';
              } else if (heatmapLayer === 'yield') {
                metricValue = `${bay.predictedYieldKgM2} kg/m²`;
                metricLabel = 'Projected Yield';
                badgeColor = 'text-purple-400';
              }

              return (
                <div
                  key={bay.id}
                  onClick={() => setSelectedBayId(bay.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all text-left relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Subtle Spatial Heatmap Gradient Overlay */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      background:
                        heatmapLayer === 'ppfd'
                          ? 'radial-gradient(circle at 50% 30%, #06b6d4, transparent)'
                          : heatmapLayer === 'canopyTemp'
                          ? 'radial-gradient(circle at 50% 30%, #f59e0b, transparent)'
                          : heatmapLayer === 'ndvi'
                          ? 'radial-gradient(circle at 50% 30%, #10b981, transparent)'
                          : 'radial-gradient(circle at 50% 30%, #a855f7, transparent)',
                    }}
                  />

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-white">{bay.id}</span>
                    <span className="text-[11px] font-mono text-slate-400">{bay.areaM2} m²</span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 truncate">{bay.name}</h4>
                  <div className="text-xs text-slate-400 mt-1 truncate">{bay.stage}</div>

                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        {metricLabel}
                      </span>
                      <span className={`text-base font-bold font-mono ${badgeColor}`}>
                        {metricValue}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">DLI Progress</span>
                      <span className="text-xs font-mono font-semibold text-slate-200">
                        {bay.accumulatedDli.toFixed(1)} / {bay.targetDli.toFixed(1)} mol
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spatial Uniformity Metric Strip */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Spatial Uniformity Coefficient (Christiansen CU):</span>
              <span className="font-mono font-bold text-emerald-400">93.4%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Production Area:</span>
              <span className="font-mono font-bold text-white">7,800 m² (0.78 ha)</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Bay Microclimate & Ground Sensor Inspection (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase">Selected Zone</span>
              <h3 className="text-base font-bold text-white">{selectedBay.name}</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              LIGHT: {selectedBay.lightStatus.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">NATURAL PAR</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {selectedBay.currentNaturalPpfd}{' '}
                <span className="text-xs text-slate-400 font-normal">µmol</span>
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">SUPPLEMENTAL LED</span>
              <span className="text-lg font-bold font-mono text-pink-400">
                {selectedBay.currentSupplementalPpfd}{' '}
                <span className="text-xs text-slate-400 font-normal">µmol</span>
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">AIR TEMP / RH</span>
              <span className="text-lg font-bold font-mono text-white">
                {selectedBay.airTemp}°C / {selectedBay.rhPercent}%
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">CANOPY TEMP (IR)</span>
              <span className="text-lg font-bold font-mono text-amber-300">
                {selectedBay.canopyTemp}°C{' '}
                <span className="text-xs text-slate-400">
                  (ΔT {(selectedBay.canopyTemp - selectedBay.airTemp).toFixed(1)}°C)
                </span>
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">VPD (VAPOR DEFICIT)</span>
              <span className="text-lg font-bold font-mono text-cyan-300">
                {selectedBay.vpdKpa.toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-normal">kPa</span>
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">CO₂ CONCENTRATION</span>
              <span className="text-lg font-bold font-mono text-purple-400">
                {selectedBay.co2Ppm}{' '}
                <span className="text-xs text-slate-400 font-normal">ppm</span>
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Daily Light Integral (DLI) Progress:</span>
              <span className="font-mono font-bold text-white">
                {((selectedBay.accumulatedDli / selectedBay.targetDli) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (selectedBay.accumulatedDli / selectedBay.targetDli) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Accumulated: {selectedBay.accumulatedDli.toFixed(1)} mol/m²</span>
              <span>Target: {selectedBay.targetDli.toFixed(1)} mol/m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ground-Based Sensors Telemetry Rack (Unit 1.2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Ground-Based Sensor Network (In-Situ Telemetry)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">SENSORS CALIBRATED & LOGGING</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {groundSensors.map((sensor) => (
            <div
              key={sensor.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{sensor.id}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>NOMINAL</span>
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1" title={sensor.name}>
                  {sensor.name}
                </h4>
                <div className="text-[11px] text-slate-400 truncate">{sensor.location}</div>
              </div>

              <div className="pt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  {sensor.currentValue}
                </span>
                <span className="text-xs font-mono text-slate-400">{sensor.unit}</span>
              </div>

              {/* Sparkline mini-graph */}
              <div className="pt-2 border-t border-slate-800 flex items-end gap-1 h-8">
                {sensor.history.map((pt, idx) => {
                  const maxVal = Math.max(...sensor.history.map((h) => h.value));
                  const heightPercent = Math.max(15, (pt.value / maxVal) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div
                        className="w-full bg-slate-700 group-hover:bg-emerald-400 rounded-t transition-colors"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unit 1.6 Crop Production Modeling & Beer-Lambert Interactive Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>UNIT 1.6</span>
              <span aria-hidden="true">·</span>
              <span>CROP PRODUCTION MODELING</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Canopy Light Interception (Beer-Lambert Law) & Yield Synthesis
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            FORMULA: I_absorbed = I₀ · (1 - e^(-k · LAI))
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Interactive Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Leaf Area Index (LAI):</span>
                <span className="font-mono font-bold text-emerald-400">{testLai.toFixed(1)} m²/m²</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.5"
                step="0.1"
                value={testLai}
                onChange={(e) => setTestLai(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Typical greenhouse high-wire tomato canopy ranges from 2.5 (vegetative) to 4.2 (dense fruiting canopy).
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Extinction Coefficient (k):</span>
                <span className="font-mono font-bold text-cyan-400">{testExtinctionK.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={testExtinctionK}
                onChange={(e) => setTestExtinctionK(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Reflects leaf angle distribution (erectophile leaves ~0.5, planophile flat leaves ~0.75).
              </span>
            </div>
          </div>

          {/* Right: Simulation Output Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Model Calculation Results
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">FRACTION ABSORBED</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {(beerLambert.fractionAbsorbed * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">ABSORBED PPFD</span>
                <span className="text-xl font-bold font-mono text-white">
                  {Math.round(beerLambert.absorbedPpfd)} µmol
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">TRANSMITTED TO FLOOR</span>
                <span className="text-xl font-bold font-mono text-slate-400">
                  {Math.round(beerLambert.transmittedPpfd)} µmol
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">ESTIMATED YIELD RATE</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {calculatePredictedYield(selectedBay.accumulatedDli, 28.5)} kg/m²
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              <strong>Horticultural Significance:</strong> At LAI &gt; 3.0, top leaves intercept &gt;88% of incoming photons. This empirical model proves the necessity of <em>sub-canopy LED interlighting</em> (Unit 2.1.1) to illuminate shaded lower fruit trusses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
