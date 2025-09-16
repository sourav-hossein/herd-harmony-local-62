/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FarmMeta {
  id: string; // uuid
  name: string;
  location?: { 
    lat: number; 
    lon: number; 
    label?: string; 
    address?: string;
  };
  farmBoundary?: number[][]; // [ [lat, lng], [lat, lng], ... ]
  mapScreenshot?: string; // base64 screenshot of the farm map
  timezone?: string;
  currency?: string;
  farmType?: 'dairy' | 'meat' | 'mixed' | 'breeding';
  description?: string;
  ownerName?: string;
  createdAt: string;
  lastOpenedAt?: string;
  color?: string;
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
export interface MapData {
  center: [number, number];
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  boundary: number[][];
  screenshot?: string;
  tileUrls?: string[];
  savedAt?: string;
  pastures?: { [pastureId: string]: any };
}

export interface FarmDataExport {
  farm: FarmMeta;
  mapData: MapData | null;
  exportedAt: string;
}
export interface FarmInput extends Omit<FarmMeta, 'id' | 'createdAt'> {
  mapData?: MapData;
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
  polygon: number[][]; // [ [lat, lng], [lat, lng], ... ]
  notes?: string;
  grassType?: string;
  carryingCapacity?: number; // animals per hectare
  rotationSchedule?: {
    daysPerRotation: number;
    restPeriod: number;
  };
  currentlyGrazing?: string[]; // goat IDs
  lastGrazedAt?: string;
  screenshot?: string; // base64 screenshot for offline view
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
  activeGoats: number;
  totalSheds: number;
  totalPastures: number;
  averageWeight?: number;
  upcomingReminders?: number;
  monthlyProfit?: number;
  feedCosts?: number;
  healthCosts?: number;
}