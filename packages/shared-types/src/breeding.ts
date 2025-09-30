
export interface HeatCycle {
  id: string;
  goatId: string;
  heatDate: Date;
  expectedNextHeat: Date;
  signs: string[];
  intensity: 'light' | 'moderate' | 'strong';
  notes?: string;
  createdAt: Date;
}


export interface KidDetail {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthWeight: number;
  status: 'alive' | 'deceased' | 'weak';
  notes?: string;
}

export interface KiddingRecord {
  id: string;
  breedingId: string;
  birthDate: Date;
  totalKids: number;
  kidDetails: KidDetail[];
  complications?: string;
  vetAssistance: boolean;
  notes?: string;
  createdAt: Date;
}

export interface BreedingRecord {
  id: string;
  damId: string;
  sireId: string;
  breedingDate: Date;
  method: 'natural' | 'artificial_insemination';
  pregnancyStatus: 'pending' | 'confirmed' | 'not_pregnant' | 'aborted';
  expectedDueDate?: Date;
  actualBirthDate?: Date;
  kidDetails?: KidDetail[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BreedingAlert {
  id: string;
  goatId: string;
  type: 'heat_expected' | 'breeding_window' | 'kidding_due' | 'pregnancy_check';
  alertDate: Date;
  message: string;
  isActive: boolean;
  createdAt: Date;
}

export interface BreedingAnalytics {
  totalBreedings: number;
  pregnancyRate: number;
  averageKiddingInterval: number;
  averageLitterSize: number;
  topSires: Array<{ sireId: string; successRate: number; totalBreedings: number }>;
  seasonalBreedingData: Array<{ month: string; breedings: number; success: number }>;
}
