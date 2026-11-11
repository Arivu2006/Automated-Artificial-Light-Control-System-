import React, { useState } from 'react';
import { X, CheckCircle, BookOpen, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
}

export const SyllabusMappingModal: React.FC<SyllabusModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const [activeUnit, setActiveUnit] = useState<'unit1' | 'unit2' | 'scan'>('unit1');

  if (!isOpen) return null;

  const unit1Topics = [
    {
      code: '1.1',
      title: 'Precision Agriculture & Agricultural Management',
      syllabusText: 'Precision agriculture principles, management zones, closed-loop feedback and resource optimization.',
      appFeature: 'Closed-loop DLI tracking, spatial greenhouse bay zoning, microclimate regulation.',
      targetTab: 'sensors_gis',
    },
    {
      code: '1.2',
      title: 'Ground-Based Sensors',
      syllabusText: 'PAR quantum sensors, pyranometers, canopy infrared temperature, substrate tensiometers.',
      appFeature: 'Live telemetry rack with Apogee quantum PAR, solar pyranometer, IR radiometer, and coaxial TDR.',
      targetTab: 'sensors_gis',
    },
    {
      code: '1.3',
      title: 'Remote Sensing',
      syllabusText: 'Multispectral canopy indices, NDVI (Normalized Difference Vegetation Index), vegetative vigor.',
      appFeature: 'GIS spatial heatmap layer showing canopy NDVI index across the 4 greenhouse bays.',
      targetTab: 'sensors_gis',
    },
    {
      code: '1.4',
      title: 'GPS, GIS and Mapping Software',
      syllabusText: 'Geographic Information System grid layout, coordinate-based microclimate zones.',
      appFeature: 'Interactive greenhouse GIS coordinate map (Bays A-D) with Christiansen Uniformity calculations.',
      targetTab: 'sensors_gis',
    },
    {
      code: '1.5',
      title: 'Yield Mapping Systems',
      syllabusText: 'Spatial yield monitoring, biomass prediction, cumulative light-yield correlation.',
      appFeature: 'Spatial yield projection per bay (kg/m²) correlated with accumulated Daily Light Integral (DLI).',
      targetTab: 'sensors_gis',
    },
    {
      code: '1.6',
      title: 'Crop Production Modeling',
      syllabusText: 'Biomass accumulation, Beer-Lambert light extinction law, Light-Use Efficiency (LUE).',
      appFeature: 'Interactive Beer-Lambert model simulator with adjustable LAI (Leaf Area Index) and k extinction.',
      targetTab: 'sensors_gis',
    },
  ];

  const unit2Topics = [
    {
      code: '2.1',
      title: 'Artificial Light Systems',
      syllabusText: '2.1.1 Artificial light systems in greenhouse agriculture (LED vs HPS, dynamic spectrum tuning: Deep Red 660nm, Royal Blue 450nm, Far-Red 730nm; DLI tracking). 2.1.2 Need for artificial light systems in agriculture (off-season winter production, photoperiod extension, tariff optimization).',
      appFeature: 'Multichannel spectrum tuner with wavelength curves, DLI auto-dimmer, and LED vs HPS engineering benchmark.',
      targetTab: 'light_control',
    },
    {
      code: '2.2',
      title: 'Greenhouse Crop Growth Management',
      syllabusText: 'Management of crop growth in greenhouses (temperature setpoints, relative humidity, VPD, thermal screens).',
      appFeature: 'Digital Twin with motorized thermal screens, VPD monitoring, and environmental coupling.',
      targetTab: 'digital_twin',
    },
    {
      code: '2.3',
      title: 'Simulation of CO₂ Consumption in Greenhouses',
      syllabusText: 'Photosynthetic kinetics (FvCB model), light saturation points, CO₂ enrichment mass balance.',
      appFeature: 'Dynamic Pn vs PPFD curves showing saturation shift under 400-1200 ppm CO₂ and hourly mass balance calculator.',
      targetTab: 'co2_model',
    },
    {
      code: '2.4',
      title: 'On-Line Measurement of Plant Growth',
      syllabusText: 'Machine vision canopy cover %, digital stem dendrometers, chlorophyll fluorescence Fv/Fm, load-cell lysimeters.',
      appFeature: 'Dedicated plant telemetry dashboard with real-time micron dendrometer and Fv/Fm stress sensors.',
      targetTab: 'plant_telemetry',
    },
    {
      code: '2.5',
      title: 'Horticulture & Expert Systems',
      syllabusText: 'Modern horticulture (high-wire hydroponics, NFT), models of plant production, and expert systems in horticulture.',
      appFeature: 'Rule-based invariant verification matrix coupled with Gemini AI horticultural decision support copilot.',
      targetTab: 'expert_system',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Syllabus & Curricular Alignment Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Detailed mapping of Unit I (Precision Farming) and Unit II (Environment Control Systems).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Selector Tabs */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950/50 text-xs">
          <button
            onClick={() => setActiveUnit('unit1')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeUnit === 'unit1'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unit I: Precision Farming (1.1 - 1.6)
          </button>
          <button
            onClick={() => setActiveUnit('unit2')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeUnit === 'unit2'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unit II: Environment Control Systems (2.1 - 2.5)
          </button>
          <button
            onClick={() => setActiveUnit('scan')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeUnit === 'scan'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>View Attached Syllabus Document</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeUnit === 'scan' ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Attached Syllabus Source:</span>
                <span className="font-mono text-slate-400">Unit 1 & 2 Table of Contents</span>
              </div>
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 p-2 flex justify-center">
                <img
                  src="/public/assets/aistudio/Screenshot_2026-11-11_155621_d1a7253e.png"
                  alt="Syllabus Unit 1 and 2 Table of Contents"
                  referrerPolicy="no-referrer"
                  className="max-h-[500px] object-contain rounded"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(activeUnit === 'unit1' ? unit1Topics : unit2Topics).map((item) => (
                <div
                  key={item.code}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="font-mono text-emerald-400">{item.code}</span>
                      <span>{item.title}</span>
                    </span>
                    <button
                      onClick={() => {
                        onSelectTab(item.targetTab);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white rounded-md flex items-center gap-1 transition-colors"
                    >
                      <span>Jump to View</span>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </button>
                  </div>

                  <div className="text-slate-400 leading-relaxed text-[11px]">
                    <strong className="text-slate-300">Syllabus Scope:</strong> {item.syllabusText}
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] text-emerald-300 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-white">Implemented Feature:</strong> {item.appFeature}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Project: Automated Artificial Light Control for Greenhouse Agriculture
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
