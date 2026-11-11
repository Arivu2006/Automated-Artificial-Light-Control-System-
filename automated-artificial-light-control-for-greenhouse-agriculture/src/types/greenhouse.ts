export type CropType = 'tomato' | 'lettuce' | 'strawberry' | 'cucumber' | 'pepper';

export interface CropProfile {
  id: CropType;
  name: string;
  scientificName: string;
  cultivar: string;
  targetDliMin: number; // mol/m²/day
  targetDliMax: number; // mol/m²/day
  optimalPpfd: number; // µmol/m²/s
  maxPpfd: number; // saturation point
  photoperiodHours: number; // optimal photoperiod
  optimalCo2Ppm: number; // 800 - 1200
  optimalTempDay: number; // °C
  optimalTempNight: number; // °C
  optimalVpdMin: number; // kPa
  optimalVpdMax: number; // kPa
  lightUseEfficiency: number; // g fresh weight / mol PAR
  spectrumPreference: {
    deepRed: number; // % (660nm)
    royalBlue: number; // % (450nm)
    farRed: number; // % (730nm)
    white: number; // % (400-700nm)
  };
  growthStages: string[];
}

export interface SensorReading {
  id: string;
  name: string;
  type: 'quantum_par' | 'pyranometer' | 'ir_canopy_temp' | 'air_temp_rh' | 'co2' | 'dendrometer' | 'chlorophyll_fvm' | 'substrate_vwc';
  unit: string;
  currentValue: number;
  nominalMin: number;
  nominalMax: number;
  status: 'nominal' | 'warning' | 'critical';
  location: string;
  history: { time: string; value: number }[];
}

export interface SpectrumSettings {
  deepRed: number; // 0 - 100%
  royalBlue: number; // 0 - 100%
  farRed: number; // 0 - 100%
  white: number; // 0 - 100%
}

export type LightControlMode = 'dli_auto' | 'constant_ppfd' | 'tariff_optimized' | 'manual';

export interface LightSystemState {
  fixtureType: 'led_toplight' | 'led_interlight' | 'hps_hybrid';
  mode: LightControlMode;
  powerState: boolean;
  dimmingPercent: number; // 0 - 100%
  supplementalPpfd: number; // µmol/m²/s delivered at canopy
  totalPowerKw: number; // kW consumption
  efficacyUmolJ: number; // µmol/Joule
  spectrum: SpectrumSettings;
  photoperiodStart: number; // hour (e.g. 5 = 05:00)
  photoperiodEnd: number; // hour (e.g. 21 = 21:00)
}

export interface GreenhouseBay {
  id: string;
  name: string;
  crop: CropType;
  stage: string;
  areaM2: number;
  currentNaturalPpfd: number;
  currentSupplementalPpfd: number;
  accumulatedDli: number;
  targetDli: number;
  canopyTemp: number;
  airTemp: number;
  rhPercent: number;
  vpdKpa: number;
  co2Ppm: number;
  lai: number; // Leaf Area Index
  canopyCoverPercent: number;
  ndvi: number; // Normalized Difference Vegetation Index (0.6 - 0.9)
  predictedYieldKgM2: number;
  lightStatus: 'on' | 'off' | 'dimmed';
}

export interface PhotosynthesisKinetics {
  ppfd: number;
  co2Ppm: number;
  tempC: number;
  assimilationRate: number; // µmol CO2 / m² / s
  co2ConsumptionKgHectareHr: number;
  lightSaturationPoint: number;
  lightCompensationPoint: number;
  quantumYield: number;
}

export interface DiurnalTimeStep {
  hour: number;
  solarPpfd: number; // natural sunlight
  supplementalPpfd: number;
  totalPpfd: number;
  cumulativeDli: number;
  co2Ppm: number;
  tariffPerKwh: number; // $/kWh
  netPhotosynthesis: number;
}
