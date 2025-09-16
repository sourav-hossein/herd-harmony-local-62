/* eslint-disable @typescript-eslint/no-explicit-any */
import { FarmData } from '@/context/FarmContext';
import { OccupancyLog, OccupancyQueryParams } from '@/types/facilityTypes';
import { FarmDataExport, FarmInput, FarmMeta, MapData, Partition, Pasture, Shed } from '@/types/farm';
import { MediaFile } from '@/types/goat';
import { GrazingLog, PastureHealthLog, RotationPlan } from '@/types/grazing';
interface Progress {
  status: string;
  details?: string;
  file?: string;
  percent?: number;
}
declare global {

  interface Window {
    electronAPI?: {
      isReady: () => Promise<boolean>;
      // Goat operations
      getGoats: () => Promise<any[]>;
      addGoat: (goat: any) => Promise<any>;
      updateGoat: (id: string, updates: any) => Promise<any>;
      deleteGoat: (id: string) => Promise<boolean>;

      // Weight records
      getWeightRecords: () => Promise<any[]>;
      addWeightRecord: (record: any) => Promise<any>;
      updateWeightRecord: (id: string, updates: any) => Promise<any>;
      deleteWeightRecord: (id: string) => Promise<boolean>;

      // Health records
      getHealthRecords: () => Promise<any[]>;
      addHealthRecord: (record: any) => Promise<any>;
      updateHealthRecord: (id: string, updates: any) => Promise<any>;
      deleteHealthRecord: (id: string) => Promise<boolean>;

      // Breeding records
      getBreedingRecords: () => Promise<any[]>;
      addBreedingRecord: (record: any) => Promise<any>;
      updateBreedingRecord: (id: string, updates: any) => Promise<any>;
      deleteBreedingRecord: (id: string) => Promise<boolean>;

      // Finance records
      getFinanceRecords: () => Promise<any[]>;
      addFinanceRecord: (record: any) => Promise<any>;
      updateFinanceRecord: (id: string, updates: any) => Promise<any>;
      deleteFinanceRecord: (id: string) => Promise<boolean>;

      // Feed operations
      getFeeds: () => Promise<any[]>;
      addFeed: (feed: any) => Promise<any>;
      updateFeed: (id: string, updates: any) => Promise<any>;
      deleteFeed: (id: string) => Promise<boolean>;

      // Feed plan operations
      getFeedPlans: () => Promise<any[]>;
      addFeedPlan: (plan: any) => Promise<any>;
      updateFeedPlan: (id: string, updates: any) => Promise<any>;
      deleteFeedPlan: (id: string) => Promise<boolean>;

      // Feed log operations
      getFeedLogs: () => Promise<any[]>;
      addFeedLog: (log: any) => Promise<any>;
      updateFeedLog: (id: string, updates: any) => Promise<any>;
      deleteFeedLog: (id: string) => Promise<boolean>;

      // Data management
      exportData: () => Promise<any>;
      importData: (data: any) => Promise<boolean>;
      clearAll: () => Promise<boolean>;

      // Pedigree operations
      getPedigreeTree: (goatId: string, generations: number) => Promise<any>;
      calculateInbreedingRisk: (sireId: string, damId: string) => Promise<any>;
      // Media operations
      getMediaByGoatId: (goatId: string) => Promise<MediaFile[]>;
      getThumbnails: () => Promise<{ goatId: string; thumbnailUrl: string | null }[]>;

      addMediaViaDialog: (goatId: string, category: string, description?: string, tags?: string[]) => Promise<MediaFile[]>;
      uploadStart: (meta: { goatId: string; filename: string; totalSize: number; category: string; description?: string; tags?: string[] }) => Promise<{ uploadId: string }>;
      uploadChunk: (uploadId: string, chunk: ArrayBuffer) => Promise<boolean>;
      uploadComplete: (uploadId: string) => Promise<MediaFile | null>;
      updateMedia: (mediaId: string, updates: Partial<MediaFile>) => Promise<MediaFile | null>;
      deleteMedia: (mediaId: string) => Promise<boolean>;
      downloadMedia: (mediaId: string) => Promise<{ success: boolean; error?: string }>;
      setPrimaryMedia: (goatId: string, mediaId: string) => Promise<MediaFile | null>;

      // File operations for UI
      getMediaFilePath: (mediaId: string) => Promise<string | null>;
      openMediaFile: (mediaId: string) => Promise<boolean>;
      revealMediaFileInFolder: (mediaId: string) => Promise<boolean>;


      // File operations
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      writeFile: (filePath: string, data: string) => Promise<boolean>;
      readFile: (filePath: string) => Promise<string | null>;
      deleteFile: (filePath: string) => Promise<boolean>;


      // Backup operations
      createBackup: (password: string) => Promise<{ success: boolean; filename?: string; error?: string }>;
      restoreBackup: (backupId: string, password: string) => Promise<{ success: boolean; error?: string }>;
      getBackupFiles: () => Promise<any[]>;
      deleteBackup: (backupId: string) => Promise<boolean>;
      getBackupSettings: () => Promise<any>;
      saveBackupSettings: (settings: any) => Promise<boolean>;
      selectBackupPath: () => Promise<{ path?: string; canceled?: boolean }>;

      // Drive Sync operations 
      startAuth: () => Promise<{ success: boolean; email?: string; error?: string }>;
      restoreAuth: () => Promise<{ success: boolean; email?: string; error?: string }>;
      disconnectDrive: () => Promise<void>;
      syncNow: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
      // listBackups: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      // uploadZip: (passphrase?: string) => Promise<{ success: boolean; error?: string }>;
      // downloadBackup: (fileId: string) => Promise<{ success: boolean; path?: string; error?: string }>; 
      onSyncProgress: (callback: (event: any, progress: { status: string; percentage?: number }) => void) => void;
      getDeviceId: () => string;
      onDriveAuthStatus: (callback: (event: any, status: { connected: boolean; email?: string }) => void) => void;
      onProgress: (callback: (progress: Progress) => void) => () => void;

      // Farm Management
  listFarms: () => Promise<FarmMeta[]>;
  createFarm: (farmInput: FarmInput) => Promise<FarmMeta>;
  updateFarm: (farmId: string, updates: Partial<FarmMeta>) => Promise<FarmMeta | null>;
  deleteFarm: (farmId: string) => Promise<boolean>;
  getActiveFarmId: () => Promise<string | null>;
  setActiveFarmId: (farmId: string) => Promise<boolean>;
  initializeFarmServices: (farmId: string) => Promise<boolean>;

  // Farm Map Management
  getFarmMapData: (farmId: string) => Promise<MapData | null>;
  saveFarmMapData: (farmId: string, mapData: MapData) => Promise<boolean>;
  savePastureMapData: (farmId: string, pastureId: string, mapData: any) => Promise<boolean>;
  getPastureMapData: (farmId: string, pastureId: string) => Promise<any>;
  getFarmMapBounds: (farmId: string) => Promise<MapData['bounds'] | null>;
  isFarmMapAvailable: (farmId: string) => Promise<boolean>;

  // Map Tile Caching
  cacheTileForFarm: (farmId: string, tileKey: string, tileData: Buffer) => Promise<boolean>;
  getCachedTile: (farmId: string, tileKey: string) => Promise<Buffer | null>;
  cleanupFarmTiles: (farmId: string) => Promise<void>;

  // Farm Data Export/Import
  exportFarmData: (farmId: string) => Promise<FarmDataExport | null>;
  importFarmData: (farmData: FarmDataExport) => Promise<FarmMeta | null>;
      isElectron: boolean;

        getSheds: () => Promise<Shed[]>;
        addShed: (shed: Omit<Shed, 'id' | 'createdAt'>) => Promise<Shed>;
        updateShed: (id: string, updates: Partial<Shed>) => Promise<Shed>;
        deleteShed: (id: string) => Promise<boolean>;
      
        // Partition Management
        getPartitions: (shedId: string) => Promise<Partition[]>;
        addPartition: (partition: Omit<Partition, 'id'>) => Promise<Partition>;
        updatePartition: (id: string, updates: Partial<Partition>) => Promise<Partition>;
        deletePartition: (id: string) => Promise<boolean>;
      
        // Pasture Management
        getPastures: () => Promise<Pasture[]>;
        addPasture: (pasture: Omit<Pasture, 'id' | 'createdAt'>) => Promise<Pasture>;
        updatePasture: (id: string, updates: Partial<Pasture>) => Promise<Pasture>;
        deletePasture: (id: string) => Promise<boolean>;
      
        // Tracking and Logs
        addGrazingLog: (log: GrazingLog) => Promise<GrazingLog>;
        updateRotationPlan: (id: string, updates: Partial<RotationPlan>) => Promise<RotationPlan>;
        getGrazingLogs: (pastureId: string) => Promise<GrazingLog[]>;
        addPastureHealthLog: (log: PastureHealthLog) => Promise<PastureHealthLog>;
        getPastureHealthLogs: () => Promise<PastureHealthLog[]>;
        addRotationPlan: (plan: RotationPlan) => Promise<RotationPlan>;
        getRotationPlans: () => Promise<RotationPlan[]>;
        getOccupancyHistory: (params: OccupancyQueryParams) => Promise<OccupancyLog[]>;
    };

  }
}