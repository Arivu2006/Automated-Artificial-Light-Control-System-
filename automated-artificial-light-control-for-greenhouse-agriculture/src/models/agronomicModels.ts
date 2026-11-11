/**
 * Precision Agriculture & Environment Control Scientific Models
 * Units I & II:
 * - Beer-Lambert Canopy Light Interception (Unit 1.6)
 * - Daily Light Integral (DLI) Integration (Unit 2.1)
 * - FvCB & Hyperbolic Photosynthesis Kinetics & CO2 Consumption (Unit 2.3)
 * - Vapor Pressure Deficit (VPD) (Unit 2.2.1)
 * - Yield Mapping & Biomass Accumulation (Unit 1.5, 1.6)
 * - Spectrum Photobiology & Phytochrome Equilibrium (Unit 2.1.1)
 */

/**
 * Calculates Saturated Vapor Pressure (SVP) in kPa using Tetens formula
 */
export function calculateSvp(tempCelsius: number): number {
  return 0.61078 * Math.exp((17.27 * tempCelsius) / (tempCelsius + 237.3));
}

/**
 * Calculates Vapor Pressure Deficit (VPD) in kPa
 */
export function calculateVpd(tempCelsius: number, relativeHumidityPercent: number): number {
  const svp = calculateSvp(tempCelsius);
  const avp = svp * (Math.max(5, Math.min(100, relativeHumidityPercent)) / 100);
  return Math.max(0, svp - avp);
}

/**
 * Beer-Lambert Law for canopy light extinction (Unit 1.6)
 * I_absorbed = I_incident * (1 - exp(-k * LAI))
 * @param incidentPpfd Incoming PPFD at top of canopy (µmol/m²/s)
 * @param lai Leaf Area Index (m² leaf / m² ground)
 * @param extinctionCoeff Canopy light extinction coefficient k (default 0.65 for high-wire crops)
 */
export function calculateCanopyLightAbsorption(
  incidentPpfd: number,
  lai: number,
  extinctionCoeff: number = 0.65
): { absorbedPpfd: number; transmittedPpfd: number; fractionAbsorbed: number } {
  const fractionAbsorbed = 1 - Math.exp(-extinctionCoeff * lai);
  const absorbedPpfd = incidentPpfd * fractionAbsorbed;
  const transmittedPpfd = incidentPpfd - absorbedPpfd;
  return { absorbedPpfd, transmittedPpfd, fractionAbsorbed };
}

/**
 * Farquhar-von Caemmerer-Berry & Non-Rectangular Hyperbola Photosynthesis Model (Unit 2.3)
 * Models net carbon assimilation A_net (µmol CO2 / m² / s) as a coupled function
 * of PPFD (µmol/m²/s) and CO2 (ppm)
 */
export function calculatePhotosynthesisRate(
  ppfd: number,
  co2Ppm: number,
  tempCelsius: number = 24
): {
  netPhotosynthesis: number; // µmol CO2 / m² / s
  grossPhotosynthesis: number;
  darkRespiration: number;
  co2ConsumptionKgHaHr: number; // kg CO2 / hectare / hour
  lightSaturationPoint: number; // µmol/m²/s
  quantumYield: number; // mol CO2 / mol photons
} {
  // Temperature modifier for Rubisco kinetics (Q10 = 2.0)
  const tempFactor = Math.pow(2.0, (tempCelsius - 25) / 10);
  
  // As CO2 increases from 400 to 1200 ppm, maximum assimilation capacity A_max increases
  // Rubisco saturation kinetics (Michaelis-Menten)
  const kmCo2 = 460; // affinity constant
  const co2Factor = (co2Ppm * 0.7) / ((co2Ppm * 0.7) + kmCo2);
  
  // Maximum photosynthetic capacity (A_max) in µmol CO2 / m² / s
  const aMax = 32 * co2Factor * tempFactor;
  
  // Dark respiration rate (increases with temperature)
  const darkRespiration = 1.6 * Math.pow(2.1, (tempCelsius - 20) / 10);
  
  // Apparent quantum yield alpha (mol CO2 / mol PAR photon)
  const alpha = 0.052 * (1 + 0.15 * (co2Ppm / 1000));
  
  // Convexity parameter theta (smoothness of saturation transition, 0.7 - 0.85)
  const theta = 0.8;
  
  // Non-rectangular hyperbola equation:
  // theta * A_gross^2 - (alpha * PPFD + A_max) * A_gross + alpha * PPFD * A_max = 0
  const b = (alpha * ppfd) + aMax;
  const discriminant = Math.max(0, Math.pow(b, 2) - (4 * theta * alpha * ppfd * aMax));
  const grossPhotosynthesis = (b - Math.sqrt(discriminant)) / (2 * theta);
  const netPhotosynthesis = Math.max(-darkRespiration, grossPhotosynthesis - darkRespiration);
  
  // Calculate dynamic Light Saturation Point (PPFD where rate reaches 92% of A_max)
  const lightSaturationPoint = Math.round(750 + (co2Ppm - 400) * 0.75);
  
  // Convert net assimilation to CO2 consumption per hectare:
  // 1 µmol CO2 / m² / s = 10^-6 mol * 44.01 g/mol = 4.401 * 10^-5 g/m²/s
  // * 10,000 m²/ha * 3600 s/hr / 1000 g/kg = 1.58436 kg CO2 / ha / hr
  const co2ConsumptionKgHaHr = Math.max(0, netPhotosynthesis * 1.58436);
  
  return {
    netPhotosynthesis: Number(netPhotosynthesis.toFixed(2)),
    grossPhotosynthesis: Number(grossPhotosynthesis.toFixed(2)),
    darkRespiration: Number(darkRespiration.toFixed(2)),
    co2ConsumptionKgHaHr: Number(co2ConsumptionKgHaHr.toFixed(2)),
    lightSaturationPoint,
    quantumYield: Number(alpha.toFixed(3)),
  };
}

/**
 * Converts PPFD over a duration to Daily Light Integral (DLI in mol/m²/day) (Unit 2.1)
 * DLI = PPFD (µmol/m²/s) * seconds * 10^-6
 */
export function ppfdToDli(ppfd: number, durationHours: number): number {
  return (ppfd * durationHours * 3600) / 1000000;
}

/**
 * Calculates required supplemental PPFD to meet a target DLI given current accumulated DLI (Unit 2.1.1)
 */
export function calculateRequiredSupplementalPpfd(
  targetDli: number,
  currentAccumulatedDli: number,
  remainingPhotoperiodHours: number
): number {
  const deficitDli = Math.max(0, targetDli - currentAccumulatedDli);
  if (remainingPhotoperiodHours <= 0) return 0;
  // required PPFD = (deficitDli * 10^6) / (remainingHours * 3600)
  return Math.round((deficitDli * 1000000) / (remainingPhotoperiodHours * 3600));
}

/**
 * Yield Mapping & Crop Production Model (Unit 1.5, 1.6)
 * Calculates predicted yield accumulation based on cumulative DLI and Light-Use Efficiency (LUE)
 */
export function calculatePredictedYield(
  cumulativeDli: number,
  lightUseEfficiency: number, // g fresh weight / mol PAR
  harvestIndex: number = 0.68,
  plantDensityPerM2: number = 2.5
): number {
  // Yield in kg/m² = (cumulative DLI * LUE * harvestIndex) / 1000
  return Number(((cumulativeDli * lightUseEfficiency * harvestIndex) / 1000).toFixed(2));
}

/**
 * Spectrum Photobiology & Phytochrome Equilibrium (Unit 2.1.1)
 * Evaluates Red-to-Far-Red ratio (R:FR) and Phytochrome Photostationary State (PSS / Pfr:Ptot)
 */
export function calculateSpectrumMetrics(
  deepRedPercent: number, // 660nm
  royalBluePercent: number, // 450nm
  farRedPercent: number, // 730nm
  whitePercent: number
): {
  redToFarRedRatio: number;
  pssPhytochromeRatio: number; // 0.55 - 0.88
  bluePercentage: number;
  emersonEnhancementFactor: number;
  morphologyEffect: string;
} {
  const total = Math.max(1, deepRedPercent + royalBluePercent + farRedPercent + whitePercent);
  const rFraction = (deepRedPercent + (whitePercent * 0.25)) / total;
  const frFraction = (farRedPercent + (whitePercent * 0.08)) / total;
  const bFraction = (royalBluePercent + (whitePercent * 0.22)) / total;

  const redToFarRedRatio = frFraction > 0.01 ? rFraction / frFraction : 12.0;

  // Empirical estimation of Pfr/Ptot based on R:FR
  const pss = Math.min(0.88, Math.max(0.55, 0.85 * (redToFarRedRatio / (redToFarRedRatio + 0.18))));
  
  // Emerson enhancement: Simultaneous excitation of PSII (660nm) and PSI (730nm)
  const emersonEnhancementFactor = frFraction > 0.05 && rFraction > 0.3 ? 1.08 + (frFraction * 0.25) : 1.0;

  let morphologyEffect = 'Balanced vegetative growth with standard internode length';
  if (redToFarRedRatio < 1.2) {
    morphologyEffect = 'Shade-avoidance triggered: Stem elongation, accelerated flowering induction, expanded leaf lamina';
  } else if (bFraction > 0.25) {
    morphologyEffect = 'High cryptochrome stimulation: Compact bushy stature, thick leaves, elevated anthocyanin synthesis';
  } else if (rFraction > 0.65) {
    morphologyEffect = 'Maximum photosynthetic photon efficiency, high biomass partition to fruits/heads';
  }

  return {
    redToFarRedRatio: Number(redToFarRedRatio.toFixed(2)),
    pssPhytochromeRatio: Number(pss.toFixed(3)),
    bluePercentage: Number((bFraction * 100).toFixed(1)),
    emersonEnhancementFactor: Number(emersonEnhancementFactor.toFixed(2)),
    morphologyEffect,
  };
}

/**
 * Fixture Technology Comparison (Unit 2.1.1):
 * High Efficiency Dynamic LED vs Legacy High-Pressure Sodium (HPS)
 */
export function compareFixtureEfficiency(
  targetPpfd: number,
  areaM2: number = 1000,
  electricityPricePerKwh: number = 0.18,
  operatingHoursPerDay: number = 14
): {
  led: { powerKw: number; dailyCost: number; heatLoadKw: number; efficacy: number };
  hps: { powerKw: number; dailyCost: number; heatLoadKw: number; efficacy: number };
  dailySavingsDollar: number;
  energyReductionPercent: number;
} {
  // Total photon flux needed: targetPpfd * areaM2 in µmol/s
  const totalPhotonFlux = targetPpfd * areaM2;

  // LED Efficacy: 3.2 µmol/J (Power = totalPhotonFlux / 3.2 / 1000 kW)
  const ledEfficacy = 3.2;
  const ledPowerKw = totalPhotonFlux / ledEfficacy / 1000;
  const ledDailyCost = ledPowerKw * operatingHoursPerDay * electricityPricePerKwh;
  // LEDs emit ~52% convective heat (at heat sinks, not beamed at canopy)
  const ledHeatLoadKw = ledPowerKw * 0.48;

  // HPS Efficacy: 1.7 µmol/J
  const hpsEfficacy = 1.7;
  const hpsPowerKw = totalPhotonFlux / hpsEfficacy / 1000;
  const hpsDailyCost = hpsPowerKw * operatingHoursPerDay * electricityPricePerKwh;
  // HPS radiates ~82% as high thermal infrared directly down into crop canopy
  const hpsHeatLoadKw = hpsPowerKw * 0.82;

  const dailySavingsDollar = Math.max(0, hpsDailyCost - ledDailyCost);
  const energyReductionPercent = Math.round(((hpsPowerKw - ledPowerKw) / hpsPowerKw) * 100);

  return {
    led: {
      powerKw: Number(ledPowerKw.toFixed(1)),
      dailyCost: Number(ledDailyCost.toFixed(2)),
      heatLoadKw: Number(ledHeatLoadKw.toFixed(1)),
      efficacy: ledEfficacy,
    },
    hps: {
      powerKw: Number(hpsPowerKw.toFixed(1)),
      dailyCost: Number(hpsDailyCost.toFixed(2)),
      heatLoadKw: Number(hpsHeatLoadKw.toFixed(1)),
      efficacy: hpsEfficacy,
    },
    dailySavingsDollar: Number(dailySavingsDollar.toFixed(2)),
    energyReductionPercent,
  };
}
