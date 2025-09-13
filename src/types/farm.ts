export interface FarmMeta {
  id: string; // uuid
  name: string;
  location?: { 
    lat: number; 
    lon: number; 
    label?: string; 
    address?: string;
  };
  timezone?: string;
  currency?: string;
  farmType?: 'dairy' | 'meat' | 'mixed' | 'breeding';
  description?: string;
  ownerName?: string;
  createdAt: string;
  lastOpenedAt?: string;
  color?: string; // accent color for farm
  passcodeEnabled?: boolean;
  settings?: {
    autoBackup?: boolean;
    backupInterval?: number; // minutes
    maxBackups?: number;
    ai?: {
      geminiApiKey?: string;
      enabled?: boolean;
      lastValidated?: string;
    };
  };
}

export interface Shed {
  id: string;
  farmId?: string;
  name: string;
  capacity?: number;
  location?: string;
  notes?: string;
  partitions?: Partition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Partition {
  id: string;
  shedId?: string;
  name: string;
  capacity?: number;
  purpose?: 'breeding' | 'quarantine' | 'kids' | 'milking' | 'general';
  notes?: string;
  occupancy?: number;
}

export interface Pasture {
  id: string;
  farmId: string;
  name: string;
  center: { lat: number; lon: number };
  radiusMeters: number;
  notes?: string;
  grassType?: string;
  carryingCapacity?: number; // animals per hectare
  rotationSchedule?: {
    daysPerRotation: number;
    restPeriod: number;
  };
  currentlyGrazing?: string[]; // goat IDs
  lastGrazedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FarmContext {
  currentFarmId: string | null;
  farms: FarmMeta[];
  selectedFarm: FarmMeta | null;
  isLoading: boolean;
  error: string | null;
}

export interface FarmStats {
  totalGoats: number;
  activeGoats: number;
  totalSheds: number;
  totalPastures: number;
  averageWeight?: number;
  upcomingReminders: number;
  monthlyProfit?: number;
  feedCosts?: number;
  healthCosts?: number;
}