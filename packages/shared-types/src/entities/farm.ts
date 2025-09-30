export interface Farm {
  id: string;
  name: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  size?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmMeta {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shed {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  farmId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Partition {
  id: string;
  shedId: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pasture {
  id: string;
  name: string;
  farmId: string;
  polygon: number[][]; // [ [lat, lng], [lat, lng], ... ] - PRIMARY geometry
  size?: number;
  capacity?: number;
  currentOccupancy?: number;
  status: 'active' | 'resting' | 'maintenance';
  grassType?: string;
  lastGrazed?: Date;
  restPeriod?: number;
  notes?: string;
  // Legacy support for circular pastures (deprecated in favor of polygon)
  center?: [number, number];
  radiusMeters?: number;
  coordinates?: Array<[number, number]>; // Alias for polygon
  screenshot?: string; // base64 screenshot for offline view
  createdAt: Date;
  updatedAt: Date;
}

export interface GrazingLog {
  id: string;
  pastureId: string;
  goatIds: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export interface PastureHealthLog {
  id: string;
  pastureId: string;
  date: string;
  grassHeight?: number;
  grassDensity?: number;
  soilMoisture?: number;
  notes?: string;
  issues?: string[];
  recommendations?: string[];
  createdAt: string;
}

export interface RotationPlan {
  id: string;
  pastureId: string;
  startDate: string;
  endDate: string;
  expectedGoatCount: number;
  notes?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface OccupancyLog {
  id: string;
  shedId?: string;
  partitionId?: string;
  goatIds: string[];
  timestamp: string;
  type: 'entry' | 'exit';
  notes?: string;
}

export interface FarmSettings {
  ai?: {
    geminiApiKey?: string;
    enabled?: boolean;
  };
  notifications?: {
    enabled: boolean;
    healthReminders: boolean;
    breedingAlerts: boolean;
  };
  backup?: {
    autoBackup: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    keepVersions: number;
  };
}

export interface FarmData {
  meta: FarmMeta;
  goats: any[];
  weightRecords: any[];
  healthRecords: any[];
  breedingRecords: any[];
  financeRecords: any[];
  feeds: any[];
  feedPlans: any[];
  feedLogs: any[];
  media: any[];
  sheds: Shed[];
  partitions: Partition[];
  pastures: Pasture[];
  pastureHealth: PastureHealthLog[];
  grazingLogs: GrazingLog[];
  rotationPlans: RotationPlan[];
  occupancyLogs: OccupancyLog[];
  settings?: FarmSettings;
}
