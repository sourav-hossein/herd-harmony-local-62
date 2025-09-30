import type { 
  Goat, 
  WeightRecord, 
  HealthRecord, 
  BreedingRecord,
  HeatCycle,
  KiddingRecord,
  Feed,
  FeedPlan,
  FeedLog,
  FinanceRecord,
  MediaFile
} from '@herd-harmony/types';
import type { OccupancyQueryParams } from '../../../src/types/facilityTypes';

export interface ElectronAPI {
  isReady: () => Promise<boolean>;
  
  // Goat operations
  getGoats: () => Promise<Goat[]>;
  addGoat: (goat: Omit<Goat, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Goat>;
  updateGoat: (id: string, updates: Partial<Goat>) => Promise<Goat>;
  deleteGoat: (id: string) => Promise<boolean>;
  
  // Weight operations
  getWeightRecords: () => Promise<WeightRecord[]>;
  addWeightRecord: (record: Omit<WeightRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WeightRecord>;
  updateWeightRecord: (id: string, updates: Partial<WeightRecord>) => Promise<WeightRecord>;
  deleteWeightRecord: (id: string) => Promise<boolean>;
  
  // Health operations
  getHealthRecords: () => Promise<HealthRecord[]>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HealthRecord>;
  updateHealthRecord: (id: string, updates: Partial<HealthRecord>) => Promise<HealthRecord>;
  deleteHealthRecord: (id: string) => Promise<boolean>;
  
  // Breeding operations
  getBreedingRecords: () => Promise<BreedingRecord[]>;
  addBreedingRecord: (record: Omit<BreedingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<BreedingRecord>;
  updateBreedingRecord: (id: string, updates: Partial<BreedingRecord>) => Promise<BreedingRecord>;
  deleteBreedingRecord: (id: string) => Promise<boolean>;
  
  // Heat cycle operations
  getHeatCycles: () => Promise<HeatCycle[]>;
  addHeatCycle: (cycle: Omit<HeatCycle, 'id' | 'createdAt'>) => Promise<HeatCycle>;
  updateHeatCycle: (id: string, updates: Partial<HeatCycle>) => Promise<HeatCycle>;
  deleteHeatCycle: (id: string) => Promise<boolean>;
  
  // Kidding operations
  getKiddingRecords: () => Promise<KiddingRecord[]>;
  addKiddingRecord: (record: Omit<KiddingRecord, 'id' | 'createdAt'>) => Promise<KiddingRecord>;
  updateKiddingRecord: (id: string, updates: Partial<KiddingRecord>) => Promise<KiddingRecord>;
  deleteKiddingRecord: (id: string) => Promise<boolean>;
  
  // Feed operations
  getFeeds: () => Promise<Feed[]>;
  addFeed: (feed: Omit<Feed, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Feed>;
  updateFeed: (id: string, updates: Partial<Feed>) => Promise<Feed>;
  deleteFeed: (id: string) => Promise<boolean>;
  
  // Finance operations
  getFinanceRecords: () => Promise<FinanceRecord[]>;
  addFinanceRecord: (record: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FinanceRecord>;
  updateFinanceRecord: (id: string, updates: Partial<FinanceRecord>) => Promise<FinanceRecord>;
  deleteFinanceRecord: (id: string) => Promise<boolean>;
  
  // Media operations
  getMediaByGoat: (goatId: string) => Promise<MediaFile[]>;
  addMedia: (media: FormData) => Promise<MediaFile>;
  deleteMedia: (id: string) => Promise<boolean>;
  
  // Farm operations
  listFarms: () => Promise<any[]>;
  createFarm: (farm: any) => Promise<any>;
  switchFarm: (farmId: string) => Promise<void>;
  
  // Occupancy operations
  getOccupancyHistory: (params: OccupancyQueryParams) => Promise<any[]>;
  
  // Sync & Backup
  syncWithDrive: (options: any) => Promise<any>;
  createBackup: (password?: string) => Promise<any>;
  restoreBackup: (backupId: string, password?: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}