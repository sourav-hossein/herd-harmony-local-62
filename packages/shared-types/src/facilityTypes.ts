import { Shed, Partition, Pasture } from './farm';

export interface GrazingLog {
  id?: string;
  pastureId: string;
  goatIds: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface PastureHealthLog {
  id?: string;
  pastureId: string;
  date: string;
  grassHeight?: number;
  grassDensity?: number;
  soilMoisture?: number;
  notes?: string;
  issues?: string[];
  recommendations?: string[];
  createdAt?: string;
}

export interface RotationPlan {
  id?: string;
  pastureId: string;
  startDate: string;
  endDate: string;
  expectedGoatCount: number;
  notes?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
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

export interface OccupancyQueryParams {
  shedId?: string;
  partitionId?: string;
  startDate?: string;
  endDate?: string;
}