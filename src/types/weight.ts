
export interface WeightRecord {
  id: string;
  goatId: string;
  date: Date;
  weight: number; // in kg
  method: 'actual' | 'estimated';
  // For tape measurements
  chestGirth?: number; // in cm
  bodyLength?: number; // in cm
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightCalculation {
  estimatedWeight: number;
  girth: number;
  length: number;
}

export const calculateWeightFromTape = (girthCm: number, lengthCm: number): number => {
  // Convert cm to inches
  const girthInches = girthCm / 2.54;
  const lengthInches = lengthCm / 2.54;
  
  // Weight (kg) = (Girth × Girth × Length) / 660
  const weightPounds = (girthInches * girthInches * lengthInches) / 660;
  
  // Convert pounds to kg
  return Math.round(weightPounds ) ;
};
