import React, { useState, useEffect, useMemo } from 'react';
import { TopNav } from './components/TopNav';
import { GreenhouseDigitalTwin } from './components/GreenhouseDigitalTwin';
import { GroundSensorsGisView } from './components/GroundSensorsGisView';
import { ArtificialLightControlView } from './components/ArtificialLightControlView';
import { Co2PhotosynthesisView } from './components/Co2PhotosynthesisView';
import { PlantTelemetryView } from './components/PlantTelemetryView';
import { ExpertSystemView } from './components/ExpertSystemView';
import { SyllabusMappingModal } from './components/SyllabusMappingModal';
import { CROP_PROFILES, INITIAL_BAYS, GROUND_SENSORS, HOURLY_WEATHER_PROFILES, ELECTRICITY_TARIFF_HOURLY } from './data/mockGreenhouseData';
import { CropType, LightControlMode, SpectrumSettings, GreenhouseBay } from './types/greenhouse';
import { calculateRequiredSupplementalPpfd, calculateVpd, ppfdToDli } from './models/agronomicModels';
import { 
  Sun, Zap, Wind, Droplets, Thermometer, ShieldCheck, 
  HelpCircle, Sparkles, Sprout, ArrowRight, BookOpen 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('digital_twin');
  const [selectedCrop, setSelectedCrop] = useState<CropType>('tomato');
  const [selectedBayId, setSelectedBayId] = useState<string>('BAY-A');
  const [currentHour, setCurrentHour] = useState<number>(12.0); // 12:00 midday
  const [weatherPreset, setWeatherPreset] = useState<string>('variable_spring');
  const [controlMode, setControlMode] = useState<LightControlMode>('dli_auto');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [co2Ppm, setCo2Ppm] = useState<number>(850);
  const [targetDli, setTargetDli] = useState<number>(26.0);
  const [dimmingPercent, setDimmingPercent] = useState<number>(65);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState<boolean>(false);

  const [spectrum, setSpectrum] = useState<SpectrumSettings>({
    deepRed: 65,
    royalBlue: 18,
    farRed: 10,
    white: 7,
  });

  const cropProfile = CROP_PROFILES[selectedCrop] || CROP_PROFILES.tomato;

  // Compute solar PPFD from weather preset and hour
  const hourIndex = Math.min(23, Math.max(0, Math.floor(currentHour)));
  const solarPpfd = HOURLY_WEATHER_PROFILES[weatherPreset]?.solarCurve[hourIndex] ?? 350;

  // Maximum fixture supplemental PPFD capacity at 100% is 450 µmol/m²/s
  const maxFixturePpfd = 450;
  
  // Calculate accumulated DLI so far up to currentHour
  const accumulatedDli = useMemo(() => {
    let acc = 0;
    const curve = HOURLY_WEATHER_PROFILES[weatherPreset]?.solarCurve || [];
    for (let h = 0; h < currentHour; h++) {
      const nat = curve[Math.floor(h)] || 0;
      // Photoperiod is 05:00 - 21:00
      const supp = h >= 5 && h <= 21 ? (dimmingPercent / 100) * maxFixturePpfd : 0;
      acc += ppfdToDli(nat + supp, 1);
    }
    return Number(acc.toFixed(1));
  }, [currentHour, weatherPreset, dimmingPercent]);

  // Automated closed-loop DLI tracking logic
  useEffect(() => {
    if (controlMode === 'dli_auto') {
      const remainingPhotoperiodHours = Math.max(0, 21 - Math.floor(currentHour));
      if (currentHour < 5 || currentHour > 21) {
        // Darkness period (skotoperiod)
        setDimmingPercent(0);
      } else {
        const requiredPpfd = calculateRequiredSupplementalPpfd(targetDli, accumulatedDli, remainingPhotoperiodHours);
        const requiredSupplemental = Math.max(0, requiredPpfd - solarPpfd);
        const calculatedDim = Math.min(100, Math.max(10, Math.round((requiredSupplemental / maxFixturePpfd) * 100)));
        setDimmingPercent(calculatedDim);
      }
    } else if (controlMode === 'tariff_optimized') {
      const tariff = ELECTRICITY_TARIFF_HOURLY[hourIndex] || 0.18;
      // Dim during peak pricing (> $0.25/kWh), boost during cheap electricity
      if (tariff > 0.25) {
        setDimmingPercent(25);
      } else if (tariff < 0.12) {
        setDimmingPercent(90);
      } else {
        setDimmingPercent(55);
      }
    }
  }, [controlMode, currentHour, solarPpfd, targetDli, accumulatedDli, hourIndex]);

  const supplementalPpfd = Math.round((dimmingPercent / 100) * maxFixturePpfd);
  const totalPpfd = solarPpfd + supplementalPpfd;

  // Active bay
  const currentBay: GreenhouseBay = useMemo(() => {
    const base = INITIAL_BAYS.find((b) => b.id === selectedBayId) || INITIAL_BAYS[0];
    return {
      ...base,
      crop: selectedCrop,
      currentNaturalPpfd: solarPpfd,
      currentSupplementalPpfd: supplementalPpfd,
      accumulatedDli: accumulatedDli,
      targetDli: targetDli,
      co2Ppm: co2Ppm,
      lightStatus: dimmingPercent === 0 ? 'off' : dimmingPercent === 100 ? 'on' : 'dimmed',
    };
  }, [selectedBayId, selectedCrop, solarPpfd, supplementalPpfd, accumulatedDli, targetDli, co2Ppm, dimmingPercent]);

  const currentVpd = calculateVpd(currentBay.airTemp, currentBay.rhPercent);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Bar Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSyllabus={() => setIsSyllabusOpen(true)}
        onOpenAiExpert={() => setActiveTab('expert_system')}
      />

      {/* Global Status Bar (Science & Biotech Console Layout §3) */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>CONTROL: {controlMode.toUpperCase().replace('_', ' ')}</span>
            </span>
            <span className="text-slate-500" aria-hidden="true">|</span>
            <span className="text-slate-400">
              BAY: <strong className="text-white font-mono">{currentBay.id}</strong>
            </span>
            <span className="text-slate-500" aria-hidden="true">|</span>
            <span className="text-slate-400">
              CROP: <strong className="text-white font-mono">{cropProfile.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-400">
              SOLAR PPFD: <strong className="text-amber-400 tabular-nums">{solarPpfd} µmol</strong>
            </span>
            <span className="text-slate-500" aria-hidden="true">|</span>
            <span className="text-slate-400">
              SUPPLEMENTAL: <strong className="text-pink-400 tabular-nums">{supplementalPpfd} µmol ({dimmingPercent}%)</strong>
            </span>
            <span className="text-slate-500" aria-hidden="true">|</span>
            <span className="text-slate-400">
              DLI: <strong className="text-emerald-400 tabular-nums">{accumulatedDli.toFixed(1)} / {targetDli.toFixed(1)} mol</strong>
            </span>
            <span className="text-slate-500" aria-hidden="true">|</span>
            <span className="text-slate-400">
              CO₂: <strong className="text-cyan-400 tabular-nums">{co2Ppm} ppm</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'digital_twin' && (
          <div className="space-y-6">
            {/* Visual Hero Split Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                      <span>AUTOMATED GREENHOUSE AGRICULTURE</span>
                      <span aria-hidden="true">·</span>
                      <span>UNIT I & II SYLLABUS ALIGNED</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5 leading-snug">
                      Automated Artificial Light Control System
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      Closed-loop precision greenhouse environment controller. Integrates ground sensors, GIS spatial zoning, CO₂-light photosynthesis modeling, on-line growth phenotyping, and AI horticultural decision support.
                    </p>
                  </div>

                  {/* Crop Selector Ribbon */}
                  <div className="pt-2">
                    <span className="text-xs font-medium text-slate-400 block mb-2">
                      Active Cultivar & Prescription Profile:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['tomato', 'lettuce', 'strawberry', 'cucumber', 'pepper'] as CropType[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setSelectedCrop(c);
                            const p = CROP_PROFILES[c];
                            setTargetDli((p.targetDliMin + p.targetDliMax) / 2);
                            setSpectrum(p.spectrumPreference);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                            selectedCrop === c
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {CROP_PROFILES[c].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Image Showcase Card */}
                <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-slate-800">
                  <img
                    src="/src/assets/images/greenhouse_led_crop_1794394927458.jpg"
                    alt="Commercial greenhouse high-wire crop with automated LED toplighting"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <div className="text-xs text-white font-mono">
                      <span>High-Wire Hydroponic Facility · Venlo Glasshouse</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Greenhouse Digital Twin Simulation Stage */}
            <GreenhouseDigitalTwin
              currentBay={currentBay}
              cropProfile={cropProfile}
              currentHour={currentHour}
              setCurrentHour={setCurrentHour}
              weatherPreset={weatherPreset}
              setWeatherPreset={setWeatherPreset}
              solarPpfd={solarPpfd}
              supplementalPpfd={supplementalPpfd}
              dimmingPercent={dimmingPercent}
              setDimmingPercent={setDimmingPercent}
              spectrum={spectrum}
              co2Ppm={co2Ppm}
              setCo2Ppm={setCo2Ppm}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
            />
          </div>
        )}

        {activeTab === 'sensors_gis' && (
          <GroundSensorsGisView
            bays={INITIAL_BAYS}
            selectedBayId={selectedBayId}
            setSelectedBayId={setSelectedBayId}
            groundSensors={GROUND_SENSORS}
          />
        )}

        {activeTab === 'light_control' && (
          <ArtificialLightControlView
            cropProfile={cropProfile}
            spectrum={spectrum}
            setSpectrum={setSpectrum}
            dimmingPercent={dimmingPercent}
            setDimmingPercent={setDimmingPercent}
            controlMode={controlMode}
            setControlMode={setControlMode}
            naturalPpfd={solarPpfd}
            supplementalPpfd={supplementalPpfd}
            accumulatedDli={accumulatedDli}
            targetDli={targetDli}
            setTargetDli={setTargetDli}
            currentHour={currentHour}
          />
        )}

        {activeTab === 'co2_model' && (
          <Co2PhotosynthesisView
            currentPpfd={totalPpfd}
            co2Ppm={co2Ppm}
            setCo2Ppm={setCo2Ppm}
            airTemp={currentBay.airTemp}
          />
        )}

        {activeTab === 'plant_telemetry' && (
          <PlantTelemetryView
            currentBay={currentBay}
            cropProfile={cropProfile}
          />
        )}

        {activeTab === 'expert_system' && (
          <ExpertSystemView
            currentBay={currentBay}
            cropProfile={cropProfile}
            spectrum={spectrum}
            dimmingPercent={dimmingPercent}
            totalPpfd={totalPpfd}
            co2Ppm={co2Ppm}
            vpd={currentVpd}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Automated Artificial Light Control for Greenhouse Agriculture</span>
            <span aria-hidden="true">·</span>
            <span>Unit I: Precision Farming</span>
            <span aria-hidden="true">·</span>
            <span>Unit II: Environment Control Systems</span>
          </div>
          <button
            onClick={() => setIsSyllabusOpen(true)}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curriculum Topic Coverage</span>
          </button>
        </div>
      </footer>

      {/* Syllabus Modal */}
      <SyllabusMappingModal
        isOpen={isSyllabusOpen}
        onClose={() => setIsSyllabusOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
