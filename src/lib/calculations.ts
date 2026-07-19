// ==================================================
// BlueChain MRV — Carbon Calculation Utilities
// ==================================================

export type EcosystemType = "mangrove" | "seagrass" | "salt_marsh";

export interface CalculationResult {
  estimatedCo2eTons: number;
  potentialCredits: number;
  estimatedValueUsd: number;
  biomassDensity: number;
  carbonFraction: number;
}

export const ECOSYSTEM_PARAMS = {
  mangrove: {
    biomassDensity: 150.0, // t/ha
    carbonFraction: 0.47,
    co2Conversion: 3.67,
  },
  seagrass: {
    biomassDensity: 25.0, // t/ha
    carbonFraction: 0.43,
    co2Conversion: 3.67,
  },
  salt_marsh: {
    biomassDensity: 40.0, // t/ha
    carbonFraction: 0.45,
    co2Conversion: 3.67,
  },
};

/**
 * Calculates carbon sequestration, potential credits, and estimated value.
 * Formula: Area × Biomass Density × Carbon Fraction × CO₂ Conversion
 */
export function calculateCarbonMetrics(
  ecosystemType: EcosystemType,
  areaHectares: number
): CalculationResult {
  const params = ECOSYSTEM_PARAMS[ecosystemType];
  if (!params) {
    return {
      estimatedCo2eTons: 0,
      potentialCredits: 0,
      estimatedValueUsd: 0,
      biomassDensity: 0,
      carbonFraction: 0,
    };
  }

  const { biomassDensity, carbonFraction, co2Conversion } = params;
  
  // Area (ha) * Biomass Density (t/ha) * Carbon Fraction * CO2 Conversion Factor
  const sequestration = areaHectares * biomassDensity * carbonFraction * co2Conversion;
  
  const estimatedCo2eTons = Math.round(sequestration * 100) / 100;
  
  // Potential credits = 80% of estimated CO2e (conservative buffer)
  const potentialCredits = Math.round(estimatedCo2eTons * 0.8 * 100) / 100;
  
  // Estimated value = potential credits * $15 (indicative value per credit/ton)
  const estimatedValueUsd = Math.round(estimatedCo2eTons * 15 * 100) / 100;

  return {
    estimatedCo2eTons,
    potentialCredits,
    estimatedValueUsd,
    biomassDensity,
    carbonFraction,
  };
}
