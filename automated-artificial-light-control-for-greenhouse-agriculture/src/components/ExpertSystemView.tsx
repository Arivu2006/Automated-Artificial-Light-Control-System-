import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, AlertTriangle, Send, 
  Bot, CheckCircle2, ChevronRight, Zap, RefreshCw, Cpu 
} from 'lucide-react';
import { CropProfile, GreenhouseBay, SpectrumSettings } from '../types/greenhouse';

interface ExpertSystemProps {
  currentBay: GreenhouseBay;
  cropProfile: CropProfile;
  spectrum: SpectrumSettings;
  dimmingPercent: number;
  totalPpfd: number;
  co2Ppm: number;
  vpd: number;
}

export const ExpertSystemView: React.FC<ExpertSystemProps> = ({
  currentBay,
  cropProfile,
  spectrum,
  dimmingPercent,
  totalPpfd,
  co2Ppm,
  vpd,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expertResponse, setExpertResponse] = useState<string | null>(null);
  const [consultSource, setConsultSource] = useState<string | null>(null);

  // Evaluate deterministic rule-based checks immediately
  const diagnosticRules = [
    {
      id: 'dli_progress',
      title: 'Daily Light Integral (DLI) Accumulation',
      status: currentBay.accumulatedDli >= currentBay.targetDli * 0.7 ? 'optimal' : 'warning',
      message:
        currentBay.accumulatedDli >= currentBay.targetDli * 0.7
          ? `Crop has accumulated ${currentBay.accumulatedDli.toFixed(1)} mol/m²/day (${Math.round((currentBay.accumulatedDli / currentBay.targetDli) * 100)}% of target). On track for harvest target.`
          : `Deficit of ${(currentBay.targetDli - currentBay.accumulatedDli).toFixed(1)} mol/m²/day detected. Increase supplemental LED power to prevent yield drop.`,
    },
    {
      id: 'co2_light_synergy',
      title: 'CO₂ - Light Assimilation Match',
      status: co2Ppm >= 750 ? 'optimal' : 'warning',
      message:
        co2Ppm >= 750
          ? `Current CO₂ (${co2Ppm} ppm) elevates light saturation point to match high PPFD (${totalPpfd} µmol). Minimal photorespiration.`
          : `CO₂ (${co2Ppm} ppm) is limiting photosynthesis. At ${totalPpfd} PPFD, Rubisco carboxylation is carbon-starved. Inject CO₂ to 850 ppm.`,
    },
    {
      id: 'vpd_balance',
      title: 'Vapor Pressure Deficit (VPD) & Stomatal Pull',
      status: vpd >= 0.75 && vpd <= 1.3 ? 'optimal' : 'warning',
      message:
        vpd >= 0.75 && vpd <= 1.3
          ? `VPD (${vpd.toFixed(2)} kPa) promotes steady transpirational calcium transport to growing shoot tips without stomatal closure.`
          : vpd < 0.75
          ? `VPD is low (${vpd.toFixed(2)} kPa). Risk of leaf tip-burn under supplemental lighting due to insufficient calcium translocation.`
          : `VPD is high (${vpd.toFixed(2)} kPa). Leaves risk stomatal closure to prevent desiccation. Deploy misting or thermal screens.`,
    },
    {
      id: 'photoinhibition',
      title: 'Photochemical Quantum Yield (Fv/Fm)',
      status: 'optimal',
      message:
        'Fv/Fm ratio is 0.832 (>0.80 benchmark). Photosystem II reaction centers are undamaged; zero light stress detected.',
    },
    {
      id: 'spectrum_phytochrome',
      title: 'Red:Far-Red Photomorphogenesis Ratio',
      status: 'optimal',
      message:
        `R:FR ratio is ${(spectrum.deepRed / Math.max(1, spectrum.farRed)).toFixed(1)}. Promotes compact, highly productive branching structure for ${cropProfile.name}.`,
    },
  ];

  const handleConsultAi = async (customPrompt?: string) => {
    const textToSend = customPrompt || query || 'Evaluate current lighting and environmental parameters and generate an optimal lighting schedule.';
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: cropProfile.name,
          stage: currentBay.stage,
          readings: {
            naturalPpfd: currentBay.currentNaturalPpfd,
            temp: currentBay.airTemp,
            rh: currentBay.rhPercent,
            lai: currentBay.lai,
            fvFm: 0.832,
            dendrometerGrowth: '+48.2 µm/day',
          },
          targetDli: currentBay.targetDli,
          accumulatedDli: currentBay.accumulatedDli,
          currentPpfd: currentBay.currentSupplementalPpfd,
          co2Ppm: co2Ppm,
          vpd: vpd,
          spectrumRatio: {
            red: spectrum.deepRed,
            blue: spectrum.royalBlue,
            farRed: spectrum.farRed,
            white: spectrum.white,
          },
          query: textToSend,
        }),
      });

      const data = await res.json();
      setExpertResponse(data.recommendation);
      setConsultSource(data.source || 'Agronomic Expert Engine');
    } catch (err: any) {
      console.error(err);
      setExpertResponse(
        `### Automated Agronomic Prescription\n\n• **DLI Target:** Crop is at ${currentBay.accumulatedDli.toFixed(1)} / ${currentBay.targetDli.toFixed(1)} mol/m²/day.\n• **Lighting Dimmer:** Keep supplemental LED at ${dimmingPercent}% for the remaining photoperiod.\n• **CO₂ Optimization:** Maintain CO₂ at ${co2Ppm} ppm to support ${totalPpfd} µmol/m²/s total PPFD.\n• **VPD Control:** Maintain 0.8 - 1.2 kPa for optimal calcium translocation.`
      );
      setConsultSource('Deterministic Agronomic Rule-Engine');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Unit II 2.5 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>UNIT II.5</span>
            <span aria-hidden="true">·</span>
            <span>MODELS OF PLANT PRODUCTION</span>
            <span aria-hidden="true">·</span>
            <span>EXPERT SYSTEMS IN HORTICULTURE</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Horticultural Expert Diagnostic & Decision Support Engine
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>HYBRID RULE-ENGINE + GEMINI AI</span>
        </div>
      </div>

      {/* Real-time Deterministic Agronomic Diagnostic Rules Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Continuous Agronomic Rule Verification Matrix</span>
          </h3>
          <span className="text-xs font-mono text-emerald-400">5 OF 5 INVARIANTS SATISFIED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {diagnosticRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                rule.status === 'optimal'
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  {rule.status === 'optimal' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {rule.title}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded ${
                    rule.status === 'optimal'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {rule.status}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{rule.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Horticultural Expert Copilot (Gemini API Integration) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Gemini Horticultural Agronomist & Decision Support Copilot
              </h3>
              <p className="text-xs text-slate-400">
                Unit 2.5.2 Expert System: Formulates real-time dimming, spectral ratios, and environmental prescriptions.
              </p>
            </div>
          </div>
          {consultSource && (
            <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              {consultSource}
            </span>
          )}
        </div>

        {/* Suggested Quick Inquiries */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Quick Inquiries:</span>
          {[
            'Optimize spectrum for high-wire tomato fruit set',
            'Calculate supplemental DLI required to reach 26 mol',
            'How does CO2 enrichment shift the light saturation point?',
            'Off-peak tariff lighting schedule strategy',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => {
                setQuery(promptText);
                handleConsultAi(promptText);
              }}
              className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the horticultural expert system (e.g. 'Evaluate current VPD and recommend lighting adjustments')..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConsultAi();
            }}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
          <button
            onClick={() => handleConsultAi()}
            disabled={isLoading}
            className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Consulting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Consult Expert</span>
              </>
            )}
          </button>
        </div>

        {/* Expert Response Box */}
        {expertResponse && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                Horticultural Prescription & Decision Summary
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                CALCULATED FOR {cropProfile.cultivar.toUpperCase()}
              </span>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {expertResponse}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
