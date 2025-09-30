import type { Goat, WeightRecord, HealthRecord, Feed, FeedPlan, FeedLog, KnownFarmer } from '../entities/goat.js';
import type { BreedingRecord, HeatCycle, KiddingRecord } from '../entities/breeding.js';
import type { FinanceRecord } from '../entities/finance.js';
import type { Shed, Partition, Pasture, GrazingLog, PastureHealthLog, RotationPlan, OccupancyLog } from '../entities/farm.js';

export type TableName = 
  | 'goats' 
  | 'weightRecords' 
  | 'healthRecords'
  | 'breedingRecords'
  | 'heatCycles'
  | 'kiddingRecords'
  | 'financeRecords'
  | 'feeds'
  | 'feedPlans'
  | 'feedLogs'
  | 'knownFarmers'
  | 'media'
  | 'sheds'
  | 'partitions'
  | 'pastures'
  | 'pastureHealth'
  | 'grazingLogs'
  | 'rotationPlans'
  | 'occupancyLogs';

export interface TableSchema {
  goats: Goat[];
  weightRecords: WeightRecord[];
  healthRecords: HealthRecord[];
  breedingRecords: BreedingRecord[];
  heatCycles: HeatCycle[];
  kiddingRecords: KiddingRecord[];
  financeRecords: FinanceRecord[];
  feeds: Feed[];
  feedPlans: FeedPlan[];
  feedLogs: FeedLog[];
  knownFarmers: KnownFarmer[];
  media: any[];
  sheds: Shed[];
  partitions: Partition[];
  pastures: Pasture[];
  pastureHealth: PastureHealthLog[];
  grazingLogs: GrazingLog[];
  rotationPlans: RotationPlan[];
  occupancyLogs: OccupancyLog[];
}
