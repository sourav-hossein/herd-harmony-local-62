import * as fs from 'fs';
import * as fsp from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import { SyncStateService } from './SyncStateService';
import {
  Goat,
  WeightRecord,
  HealthRecord,
  BreedingRecord,
  FinanceRecord,
  Feed,
  FeedPlan,
  FeedLog,
  MediaFile,
  Shed,
  Partition,
  Pasture,
  PastureHealthLog,
  GrazingLog,
  RotationPlan,
  OccupancyLog,
  OccupancyQueryParams,
  FarmMeta
} from '@herd-harmony/shared-types/goat'; // Assuming all types are in goat for now, will refine

class DatabaseService {
  private farmData: FarmMeta;
  private basePath: string;
  private dbPath: string;

  constructor(farmData: FarmMeta, basePath: string) {
    this.farmData = farmData;
    this.basePath = basePath;
    this.dbPath = this.generateDbPath();
    this.ensureDatabaseDir();
    this.initDatabase();
  }

  private sanitizeDirectoryName(name: string): string {
    return name
      .replace(/[<>:"\\/|?*\x00-\x1F]/g, '-') // Replace invalid characters
      .replace(/\s+/g, '-')                     // Replace spaces with hyphens
      .replace(/-+/g, '-')                      // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '')                    // Remove leading/trailing hyphens
      .slice(0, 64);                            // Limit length to avoid too long paths
  }

  private generateDbPath(): string {
    const sanitizedName = this.sanitizeDirectoryName(this.farmData.name || 'Unknown-Farm');
    const dirName = `${sanitizedName}_${this.farmData.id}`;
    return path.join(String(this.basePath), dirName);
  }

  private ensureDatabaseDir(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  private initDatabase(): void {
    const coreTables = [
      'goats',
      'weightRecords',
      'healthRecords',
      'breedingRecords',
      'financeRecords',
      'feeds',
      'feedPlans',
      'feedLogs',
      'media'
    ];

    const facilityTables = [
      'sheds',
      'partitions',
      'pastures',
      'pastureHealth',
      'grazingLogs',
      'rotationPlans',
      'occupancyLogs'
    ];

    // Create core data tables
    [...coreTables, ...facilityTables].forEach(table => {
      const tablePath = path.join(this.dbPath, `${table}.json`);
      if (!fs.existsSync(tablePath)) {
        fs.writeFileSync(tablePath, JSON.stringify([], null, 2));
      }
    });
  }

  private readTable<T>(tableName: string): T[] {
    try {
      const tablePath = path.join(this.dbPath, `${tableName}.json`);
      const data = fs.readFileSync(tablePath, 'utf8');
      return JSON.parse(data);
    } catch (error: any) {
      console.error(`Error reading table ${tableName}:`, error);
      return [];
    }
  }

  private writeTable<T>(tableName: string, data: T[]): boolean {
    try {
      const tablePath = path.join(this.dbPath, `${tableName}.json`);
      fs.writeFileSync(tablePath, JSON.stringify(data, null, 2));
      SyncStateService.invalidate();
      return true;
    } catch (error: any) {
      console.error(`Error writing table ${tableName}:`, error);
      return false;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getAll<T>(tableName: string): T[] {
    return this.readTable<T>(tableName);
  }

  add<T extends { id?: string }>(tableName: string, item: Omit<T, 'id'>): T {
    const data = this.readTable<T>(tableName);
    const newItem = { ...item, id: this.generateId() } as T;
    data.push(newItem);
    this.writeTable(tableName, data);

    if (tableName === 'healthRecords' && (newItem as HealthRecord).cost && (newItem as HealthRecord).cost > 0) {
      const healthRecord = newItem as HealthRecord;
      const financeRecord: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'expense',
        category: healthRecord.type.charAt(0).toUpperCase() + healthRecord.type.slice(1),
        amount: healthRecord.cost,
        date: healthRecord.date,
        description: `Health record: ${healthRecord.description}`,
        goatId: healthRecord.goatId,
        healthRecordId: healthRecord.id,
      };
      this.addFinanceRecord(financeRecord);
    }

    return newItem;
  }

  update<T extends { id: string }>(tableName: string, id: string, updates: Partial<T>): T | null {
    const data = this.readTable<T>(tableName);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      const originalItem = data[index];
      data[index] = { ...data[index], ...updates };
      this.writeTable(tableName, data);

      if (tableName === 'healthRecords') {
        const updatedItem = data[index] as HealthRecord;
        const financeRecords = this.readTable<FinanceRecord>('financeRecords');
        const existingFinanceRecord = financeRecords.find(fr => fr.healthRecordId === id);

        if (updatedItem.cost && updatedItem.cost > 0) {
          const financeRecordData: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
            type: 'expense',
            category: updatedItem.type.charAt(0).toUpperCase() + updatedItem.type.slice(1),
            amount: updatedItem.cost,
            date: updatedItem.date,
            description: `Health record: ${updatedItem.description}`,
            goatId: updatedItem.goatId,
            healthRecordId: updatedItem.id,
          };

          if (existingFinanceRecord) {
            this.updateFinanceRecord(existingFinanceRecord.id, financeRecordData);
          } else {
            this.addFinanceRecord(financeRecordData);
          }
        } else if (existingFinanceRecord) {
          this.deleteFinanceRecord(existingFinanceRecord.id);
        }
      }

      return data[index];
    }
    return null;
  }

  delete<T extends { id: string }>(tableName: string, id: string): T | null {
    const data = this.readTable<T>(tableName);
    const itemToDelete = data.find(item => item.id === id);
    if (!itemToDelete) return null;

    const filteredData = data.filter(item => item.id !== id);
    this.writeTable(tableName, filteredData);

    if (tableName === 'healthRecords' && itemToDelete) {
      const financeRecords = this.readTable<FinanceRecord>('financeRecords');
      const existingFinanceRecord = financeRecords.find(fr => fr.healthRecordId === id);
      if (existingFinanceRecord) {
        this.deleteFinanceRecord(existingFinanceRecord.id);
      }
    }

    return itemToDelete;
  }

  addFinanceRecord(record: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>): FinanceRecord {
    const data = this.readTable<FinanceRecord>('financeRecords');
    const newRecord: FinanceRecord = {
      ...record,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newRecord);
    this.writeTable('financeRecords', data);
    return newRecord;
  }

  updateFinanceRecord(id: string, updates: Partial<Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>>): FinanceRecord | null {
    const data = this.readTable<FinanceRecord>('financeRecords');
    const index = data.findIndex(record => record.id === id);
    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.writeTable('financeRecords', data);
      return data[index];
    }
    return null;
  }

  deleteFinanceRecord(id: string): boolean {
    const data = this.readTable<FinanceRecord>('financeRecords');
    const filteredData = data.filter(record => record.id !== id);
    this.writeTable('financeRecords', filteredData);
    return filteredData.length < data.length;
  }

  getFinanceRecords(): FinanceRecord[] {
    return this.readTable<FinanceRecord>('financeRecords');
  }

  // Feed management methods
  addFeed(feed: Omit<Feed, 'id' | 'createdAt' | 'updatedAt'>): Feed {
    const data = this.readTable<Feed>('feeds');
    const newFeed: Feed = {
      ...feed,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newFeed);
    this.writeTable('feeds', data);

    if (newFeed.cost && newFeed.cost > 0) {
      const financeRecord: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'expense',
        category: 'Feed',
        amount: newFeed.cost,
        date: newFeed.purchaseDate || new Date().toISOString().split('T')[0],
        description: `Purchased ${newFeed.quantity || ''} of ${newFeed.type}`,
        feedId: newFeed.id,
      };
      this.addFinanceRecord(financeRecord);
    }

    return newFeed;
  }

  updateFeed(id: string, updates: Partial<Omit<Feed, 'id' | 'createdAt' | 'updatedAt'>>): Feed | null {
    const data = this.readTable<Feed>('feeds');
    const index = data.findIndex(feed => feed.id === id);
    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.writeTable('feeds', data);

      const updatedFeed = data[index];
      const financeRecords = this.readTable<FinanceRecord>('financeRecords');
      const existingFinanceRecord = financeRecords.find(fr => fr.feedId === id);

      if (updatedFeed.cost && updatedFeed.cost > 0) {
        const financeRecordData: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'expense',
          category: 'Feed',
          amount: updatedFeed.cost,
          date: updatedFeed.purchaseDate || new Date().toISOString().split('T')[0],
          description: `Purchased ${updatedFeed.quantity || ''} of ${updatedFeed.type}`,
          feedId: updatedFeed.id,
        };

        if (existingFinanceRecord) {
          this.updateFinanceRecord(existingFinanceRecord.id, financeRecordData);
        } else {
          this.addFinanceRecord(financeRecordData);
        }
      } else if (existingFinanceRecord) {
        this.deleteFinanceRecord(existingFinanceRecord.id);
      }

      return data[index];
    }
    return null;
  }

  deleteFeed(id: string): boolean {
    const data = this.readTable<Feed>('feeds');
    const itemToDelete = data.find(item => item.id === id);
    const filteredData = data.filter(feed => feed.id !== id);
    this.writeTable('feeds', filteredData);

    if (itemToDelete) {
      const financeRecords = this.readTable<FinanceRecord>('financeRecords');
      const existingFinanceRecord = financeRecords.find(fr => fr.feedId === id);
      if (existingFinanceRecord) {
        this.deleteFinanceRecord(existingFinanceRecord.id);
      }
    }

    return filteredData.length < data.length;
  }

  getFeeds(): Feed[] {
    return this.readTable<Feed>('feeds');
  }

  // Feed plan methods
  addFeedPlan(plan: Omit<FeedPlan, 'id' | 'createdAt' | 'updatedAt'>): FeedPlan {
    const data = this.readTable<FeedPlan>('feedPlans');
    const newPlan: FeedPlan = {
      ...plan,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newPlan);
    this.writeTable('feedPlans', data);
    return newPlan;
  }

  updateFeedPlan(id: string, updates: Partial<Omit<FeedPlan, 'id' | 'createdAt' | 'updatedAt'>>): FeedPlan | null {
    const data = this.readTable<FeedPlan>('feedPlans');
    const index = data.findIndex(plan => plan.id === id);
    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.writeTable('feedPlans', data);
      return data[index];
    }
    return null;
  }

  deleteFeedPlan(id: string): boolean {
    const data = this.readTable<FeedPlan>('feedPlans');
    const filteredData = data.filter(plan => plan.id !== id);
    this.writeTable('feedPlans', filteredData);
    return filteredData.length < data.length;
  }

  getFeedPlans(): FeedPlan[] {
    return this.readTable<FeedPlan>('feedPlans');
  }

  // Feed log methods
  addFeedLog(log: Omit<FeedLog, 'id' | 'createdAt'>): FeedLog {
    const data = this.readTable<FeedLog>('feedLogs');
    const newLog: FeedLog = {
      ...log,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    data.push(newLog);
    this.writeTable('feedLogs', data);
    return newLog;
  }

  updateFeedLog(id: string, updates: Partial<Omit<FeedLog, 'id' | 'createdAt'>>): FeedLog | null {
    const data = this.readTable<FeedLog>('feedLogs');
    const index = data.findIndex(log => log.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      this.writeTable('feedLogs', data);
      return data[index];
    }
    return null;
  }

  deleteFeedLog(id: string): boolean {
    const data = this.readTable<FeedLog>('feedLogs');
    const filteredData = data.filter(log => log.id !== id);
    this.writeTable('feedLogs', filteredData);
    return filteredData.length < data.length;
  }

  getFeedLogs(): FeedLog[] {
    return this.readTable<FeedLog>('feedLogs');
  }

  // Media management methods
  addMedia(media: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>): MediaFile {
    return this.add<MediaFile>('media', media);
  }

  getMediaByGoatId(goatId: string): MediaFile[] {
    const allMedia = this.readTable<MediaFile>('media');
    return allMedia.filter(mediaItem => mediaItem.goatId === goatId);
  }

  updateMedia(id: string, updates: Partial<Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>>): MediaFile | null {
    return this.update<MediaFile>('media', id, updates);
  }

  deleteMedia(id: string): MediaFile | null {
    return this.delete<MediaFile>('media', id);
  }

  exportData(): any {
    const data = {
      goats: this.readTable<Goat>('goats'),
      weightRecords: this.readTable<WeightRecord>('weightRecords'),
      healthRecords: this.readTable<HealthRecord>('healthRecords'),
      breedingRecords: this.readTable<BreedingRecord>('breedingRecords'),
      financeRecords: this.readTable<FinanceRecord>('financeRecords'),
      feeds: this.readTable<Feed>('feeds'),
      feedPlans: this.readTable<FeedPlan>('feedPlans'),
      feedLogs: this.readTable<FeedLog>('feedLogs'),
      media: this.readTable<MediaFile>('media'),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return data;
  }

  importData(data: any): boolean {
    try {
      this.writeTable<Goat>('goats', data.goats || []);
      this.writeTable<WeightRecord>('weightRecords', data.weightRecords || []);
      this.writeTable<HealthRecord>('healthRecords', data.healthRecords || []);
      this.writeTable<BreedingRecord>('breedingRecords', data.breedingRecords || []);
      this.writeTable<FinanceRecord>('financeRecords', data.financeRecords || []);
      this.writeTable<Feed>('feeds', data.feeds || []);
      this.writeTable<FeedPlan>('feedPlans', data.feedPlans || []);
      this.writeTable<FeedLog>('feedLogs', data.feedLogs || []);
      this.writeTable<MediaFile>('media', data.media || []);
      return true;
    } catch (error: any) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Shed Management Methods
  addShed(shed: Omit<Shed, 'id' | 'createdAt' | 'updatedAt'>): Shed {
    const sheds = this.readTable<Shed>('sheds');
    const newShed: Shed = {
      ...shed,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    sheds.push(newShed);
    this.writeTable('sheds', sheds);
    return newShed;
  }

  updateShed(id: string, updates: Partial<Omit<Shed, 'id' | 'createdAt' | 'updatedAt'>>): Shed | null {
    const sheds = this.readTable<Shed>('sheds');
    const index = sheds.findIndex(s => s.id === id);
    if (index !== -1) {
      sheds[index] = {
        ...sheds[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.writeTable('sheds', sheds);
      return sheds[index];
    }
    return null;
  }

  deleteShed(id: string): boolean {
    // Delete shed and its associated partitions
    const sheds = this.readTable<Shed>('sheds');
    const filteredSheds = sheds.filter(s => s.id !== id);
    this.writeTable('sheds', filteredSheds);

    // Clean up related partitions
    const partitions = this.readTable<Partition>('partitions');
    const filteredPartitions = partitions.filter(p => p.shedId !== id);
    this.writeTable('partitions', filteredPartitions);

    // Clean up occupancy logs
    const occupancyLogs = this.readTable<OccupancyLog>('occupancyLogs');
    const filteredLogs = occupancyLogs.filter(log => log.shedId !== id);
    this.writeTable('occupancyLogs', filteredLogs);

    return true;
  }

  // Partition Management Methods
  addPartition(partition: Omit<Partition, 'id' | 'createdAt' | 'updatedAt'>): Partition {
    const partitions = this.readTable<Partition>('partitions');
    const newPartition: Partition = {
      ...partition,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    partitions.push(newPartition);
    this.writeTable('partitions', partitions);
    return newPartition;
  }

  getPartitionsByShed(shedId: string): Partition[] {
    const partitions = this.readTable<Partition>('partitions');
    return partitions.filter(p => p.shedId === shedId);
  }

  updatePartition(id: string, updates: Partial<Omit<Partition, 'id' | 'createdAt' | 'updatedAt'>>): Partition | null {
    const partitions = this.readTable<Partition>('partitions');
    const index = partitions.findIndex(p => p.id === id);
    if (index !== -1) {
      partitions[index] = {
        ...partitions[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.writeTable('partitions', partitions);
      return partitions[index];
    }
    return null;
  }

  // Pasture Management Methods
  addPasture(pasture: Omit<Pasture, 'id' | 'createdAt' | 'updatedAt'>): Pasture {
    const pastures = this.readTable<Pasture>('pastures');
    const newPasture: Pasture = {
      ...pasture,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    pastures.push(newPasture);
    this.writeTable('pastures', pastures);
    return newPasture;
  }

  updatePasture(id: string, updates: Partial<Omit<Pasture, 'id' | 'createdAt' | 'updatedAt'>>): Pasture | null {
    const pastures = this.readTable<Pasture>('pastures');
    const index = pastures.findIndex(p => p.id === id);
    if (index !== -1) {
      pastures[index] = {
        ...pastures[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.writeTable('pastures', pastures);
      return pastures[index];
    }
    return null;
  }

  deletePasture(id: string): boolean {
    // Delete pasture and its associated records
    const pastures = this.readTable<Pasture>('pastures');
    const filteredPastures = pastures.filter(p => p.id !== id);
    this.writeTable('pastures', filteredPastures);

    // Clean up related records
    ['pastureHealth', 'grazingLogs', 'rotationPlans'].forEach(table => {
      const records = this.readTable<any>(table);
      const filtered = records.filter((r: any) => r.pastureId !== id);
      this.writeTable(table, filtered);
    });

    return true;
  }

  // Grazing and Health Tracking Methods
  addGrazingLog(log: Omit<GrazingLog, 'id' | 'timestamp'>): GrazingLog {
    const logs = this.readTable<GrazingLog>('grazingLogs');
    const newLog: GrazingLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.writeTable('grazingLogs', logs);
    return newLog;
  }

  addPastureHealthLog(log: Omit<PastureHealthLog, 'id' | 'timestamp'>): PastureHealthLog {
    const logs = this.readTable<PastureHealthLog>('pastureHealth');
    const newLog: PastureHealthLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.writeTable('pastureHealth', logs);
    return newLog;
  }

  addRotationPlan(plan: Omit<RotationPlan, 'id' | 'createdAt' | 'updatedAt'>): RotationPlan {
    const plans = this.readTable<RotationPlan>('rotationPlans');
    const newPlan: RotationPlan = {
      ...plan,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    plans.push(newPlan);
    this.writeTable('rotationPlans', plans);
    return newPlan;
  }

  // Occupancy Tracking
  logOccupancy(log: Omit<OccupancyLog, 'id' | 'timestamp'>): OccupancyLog {
    const logs = this.readTable<OccupancyLog>('occupancyLogs');
    const newLog: OccupancyLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.writeTable('occupancyLogs', logs);
    return newLog;
  }

  getOccupancyHistory(shedId?: string, partitionId?: string, startDate?: string, endDate?: string): OccupancyLog[] {
    const logs = this.readTable<OccupancyLog>('occupancyLogs');
    return logs.filter(log => {
      const timestamp = new Date(log.timestamp);
      return (
        (!shedId || log.shedId === shedId) &&
        (!partitionId || log.partitionId === partitionId) &&
        (!startDate || timestamp >= new Date(startDate)) &&
        (!endDate || timestamp <= new Date(endDate))
      );
    });
  }

  clearAll(): boolean {
    try {
      const allTables = [
        'goats', 'weightRecords', 'healthRecords', 'breedingRecords',
        'financeRecords', 'feeds', 'feedPlans', 'feedLogs', 'media',
        'sheds', 'partitions', 'pastures', 'pastureHealth',
        'grazingLogs', 'rotationPlans', 'occupancyLogs'
      ];

      allTables.forEach(table => {
        this.writeTable(table, []);
      });
      return true;
    } catch (error: any) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Migrate an existing database from old path to new path structure
   * @param {string} oldPath - The old database path
   * @returns {boolean} - Success status
   */
  static async migrateDatabase(oldPath: string, farmData: FarmMeta, newBasePath: string): Promise<boolean> {
    try {
      // Create new database instance with new path structure
      const newDb = new DatabaseService(farmData, newBasePath);

      // If old path is same as new path, no migration needed
      if (oldPath === newDb.dbPath) {
        return true;
      }

      // Check if old database exists
      if (!fs.existsSync(oldPath)) {
        console.error('Old database path does not exist:', oldPath);
        return false;
      }

      // Create new directory structure
      if (!fs.existsSync(newDb.dbPath)) {
        fs.mkdirSync(newDb.dbPath, { recursive: true });
      }

      // Copy all database files
      const tables = [
        'goats', 'weightRecords', 'healthRecords', 'breedingRecords',
        'financeRecords', 'feeds', 'feedPlans', 'feedLogs', 'media',
        'sheds', 'partitions', 'pastures', 'pastureHealth',
        'grazingLogs', 'rotationPlans', 'occupancyLogs'
      ];

      for (const table of tables) {
        const oldTablePath = path.join(oldPath, `${table}.json`);
        const newTablePath = path.join(newDb.dbPath, `${table}.json`);

        if (fs.existsSync(oldTablePath)) {
          fs.copyFileSync(oldTablePath, newTablePath);
        } else {
          // Initialize empty table if it doesn't exist
          fs.writeFileSync(newTablePath, JSON.stringify([], null, 2));
        }
      }

      // Delete old directory if migration successful
      if (fs.existsSync(oldPath)) {
        fs.rmSync(oldPath, { recursive: true, force: true });
      }

      return true;
    } catch (error: any) {
      console.error('Error during database migration:', error);
      return false;
    }
  }
}

export { DatabaseService };
