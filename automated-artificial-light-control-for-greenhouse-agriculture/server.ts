import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(apiKey),
  });
});

// Horticultural Expert System Copilot (Unit 2.5.2)
app.post('/api/gemini/consult', async (req: Request, res: Response) => {
  try {
    const { crop, stage, readings, targetDli, accumulatedDli, currentPpfd, co2Ppm, vpd, spectrumRatio, query } = req.body;

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        recommendation: generateRuleBasedExpertAdvice({ crop, stage, readings, targetDli, accumulatedDli, currentPpfd, co2Ppm, vpd, spectrumRatio }),
        source: 'Deterministic Agronomic Rule-Engine',
      });
    }

    const prompt = `
You are an expert greenhouse horticultural physiologist and lighting engineer specializing in:
- Precision Agriculture & Ground-based Sensors (Unit 1: Quantum PAR, NDVI, Pyranometers, Dendrometers, Fv/Fm)
- Environment Control Systems & Artificial Light Control (Unit 2: Supplemental LED/HPS, DLI target tracking, CO2 assimilation kinetics, VPD balance, spectral ratios).

Current Greenhouse State:
- Crop: ${crop || 'Tomato (High-Wire)'} (Growth Stage: ${stage || 'Fruit Development'})
- Current Natural Sunlight PAR: ${readings?.naturalPpfd ?? 320} µmol/m²/s
- Artificial Supplemental LED PAR: ${currentPpfd ?? 250} µmol/m²/s
- Total PPFD at Canopy: ${(readings?.naturalPpfd ?? 320) + (currentPpfd ?? 250)} µmol/m²/s
- Daily Light Integral (DLI) Target: ${targetDli ?? 25} mol/m²/day | Accumulated so far: ${accumulatedDli ?? 18.2} mol/m²/day
- Ambient CO2: ${co2Ppm ?? 800} ppm
- Temperature: ${readings?.temp ?? 23.5} °C | RH: ${readings?.rh ?? 68} % | VPD: ${vpd ?? 1.1} kPa
- Plant Health Metrics: Leaf Area Index (LAI): ${readings?.lai ?? 3.4}, Chlorophyll Fluorescence Fv/Fm: ${readings?.fvFm ?? 0.82}, Stem Dendrometer rate: ${readings?.dendrometerGrowth ?? '+0.04 mm/day'}
- Current LED Spectrum Ratio: Deep Red (660nm): ${spectrumRatio?.red ?? 65}%, Royal Blue (450nm): ${spectrumRatio?.blue ?? 20}%, Far-Red (730nm): ${spectrumRatio?.farRed ?? 10}%, White: ${spectrumRatio?.white ?? 5}%

User Question / Operational Goal:
"${query || 'Analyze current lighting efficiency, CO2 consumption synergy, and provide optimal supplemental lighting adjustment for the remaining photoperiod.'}"

Provide a concise, highly technical horticultural recommendation structured as:
1. Agronomic Assessment (Photosynthesis status, DLI deficit/surplus, CO2 light saturation point)
2. Lighting Prescription (Specific dimming %, Photoperiod extension hours, Spectrum tuning recommendation)
3. Microclimate & Energy Optimization (VPD adjustments, ventilation vs CO2 retention, off-peak tariff savings)
Keep formatting crisp and professional.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an authoritative agricultural science expert on greenhouse supplemental lighting and precision environment control systems. Provide practical, accurate, and scientifically sound calculations and recommendations.',
      },
    });

    return res.status(200).json({
      fallback: false,
      recommendation: response.text,
      source: 'Gemini 3.8 Flash Horticultural AI Engine',
    });
  } catch (error: any) {
    console.error('Gemini consultation error:', error);
    // Return graceful fallback so user never experiences an error
    const ruleBased = generateRuleBasedExpertAdvice(req.body);
    return res.status(200).json({
      fallback: true,
      recommendation: ruleBased,
      source: 'Deterministic Agronomic Rule-Engine (Fallback)',
      error: error?.message,
    });
  }
});

function generateRuleBasedExpertAdvice(data: any): string {
  const targetDli = data?.targetDli || 25;
  const accumulated = data?.accumulatedDli || 18;
  const deficit = Math.max(0, targetDli - accumulated);
  const co2 = data?.co2Ppm || 800;
  const vpd = data?.vpd || 1.1;

  let advice = `### Automated Agronomic Prescription\n\n`;
  advice += `**1. Daily Light Integral (DLI) Status:**\n`;
  if (deficit <= 1.0) {
    advice += `• Crop has accumulated ${accumulated.toFixed(1)} mol/m²/day, approaching target (${targetDli} mol/m²/day).\n• Recommendation: Dim supplemental LED toplighting to 15-25% to conserve electricity and avoid light-induced photoinhibition.\n\n`;
  } else {
    const hoursRemaining = 5;
    const requiredPpfd = Math.round((deficit * 1000000) / (hoursRemaining * 3600));
    advice += `• DLI Deficit is currently ${deficit.toFixed(1)} mol/m²/day. Over the remaining ${hoursRemaining} hours of photoperiod, maintain average supplemental PPFD at ~${requiredPpfd} µmol/m²/s.\n\n`;
  }

  advice += `**2. CO₂ - Light Assimilation Kinetics:**\n`;
  if (co2 < 600) {
    advice += `• Current CO₂ (${co2} ppm) is limiting photosynthesis under current PPFD. Increasing CO₂ injection to 800-900 ppm will raise light saturation point and enhance Light Use Efficiency (LUE) by 18-24%.\n\n`;
  } else {
    advice += `• Current CO₂ (${co2} ppm) is well-matched with canopy photon flux density. High Rubisco carboxylation velocity is maintained with minimal photorespiration.\n\n`;
  }

  advice += `**3. VPD & Canopy Microclimate Coupling:**\n`;
  if (vpd < 0.8) {
    advice += `• VPD (${vpd.toFixed(2)} kPa) is low (excess humidity). Increase slight heating or ventilation to prevent calcium deficiency (leaf tip-burn) under active lighting.\n`;
  } else if (vpd > 1.4) {
    advice += `• VPD (${vpd.toFixed(2)} kPa) is elevated; risk of stomatal closure reducing net CO₂ uptake. Deploy misting or adjust shade screens.\n`;
  } else {
    advice += `• VPD (${vpd.toFixed(2)} kPa) is in optimal horticultural range (0.8 - 1.2 kPa), promoting steady transpirational pull and nutrient transport.\n`;
  }

  return advice;
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Greenhouse Light Control System running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
