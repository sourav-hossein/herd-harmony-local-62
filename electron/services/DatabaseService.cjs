const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const SyncStateService = require('./SyncStateService.cjs');

class DatabaseService {
  constructor(farmData, basePath) {
    this.farmData = farmData;
    this.basePath = basePath;
    this.dbPath = this.generateDbPath();
    this.ensureDatabaseDir();
    this.initDatabase();
  }

  sanitizeDirectoryName(name) {
    return name
      .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '-') // Replace invalid characters
      .replace(/\s+/g, '-')                     // Replace spaces with hyphens
      .replace(/-+/g, '-')                      // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '')                    // Remove leading/trailing hyphens
      .slice(0, 64);                            // Limit length to avoid too long paths
  }

  generateDbPath() {
    const sanitizedName = this.sanitizeDirectoryName(this.farmData.name || 'Unknown-Farm');
    const dirName = `${sanitizedName}_${this.farmData.id}`;
    return path.join(String(this.basePath), dirName);
  }

  ensureDatabaseDir() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  initDatabase() {
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
      'sheds',           // Basic shed information
      'partitions',      // Shed partitions (separate for efficient querying)
      'pastures',        // Pasture basic info
      'pastureHealth',   // Pasture health tracking logs
      'grazingLogs',     // Detailed grazing history
      'rotationPlans',   // Pasture rotation schedules
      'occupancyLogs'    // Historical occupancy tracking for sheds/partitions
    ];

    // Create core data tables
    [...coreTables, ...facilityTables].forEach(table => {
      const tablePath = path.join(this.dbPath, `${table}.json`);
      if (!fs.existsSync(tablePath)) {
        fs.writeFileSync(tablePath, JSON.stringify([], null, 2));
      }
    });
  }

  readTable(tableName) {
    try {
      const tablePath = path.join(this.dbPath, `${tableName}.json`);
      const data = fs.readFileSync(tablePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading table ${tableName}:`, error);
      return [];
    }
  }

  writeTable(tableName, data) {
    try {
      const tablePath = path.join(this.dbPath, `${tableName}.json`);
      fs.writeFileSync(tablePath, JSON.stringify(data, null, 2));
      SyncStateService.invalidate();
      return true;
    } catch (error) {
      console.error(`Error writing table ${tableName}:`, error);
      return false;
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getAll(tableName) {
    return this.readTable(tableName);
  }

  add(tableName, item) {
    const data = this.readTable(tableName);
    const newItem = { ...item, id: this.generateId() };
    data.push(newItem);
    this.writeTable(tableName, data);

    if (tableName === 'healthRecords' && newItem.cost && newItem.cost > 0) {
      const financeRecord = {
        type: 'expense',
        category: newItem.type.charAt(0).toUpperCase() + newItem.type.slice(1), // Capitalize type
        amount: newItem.cost,
        date: newItem.date,
        description: `Health record: ${newItem.description}`,
        goatId: newItem.goatId,
        healthRecordId: newItem.id,
      };
      this.addFinanceRecord(financeRecord);
    }

    return newItem;
  }

  update(tableName, id, updates) {
    const data = this.readTable(tableName);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      const originalItem = data[index];
      data[index] = { ...data[index], ...updates };
      this.writeTable(tableName, data);

      if (tableName === 'healthRecords') {
        const updatedItem = data[index];
        const financeRecords = this.readTable('financeRecords');
        const existingFinanceRecord = financeRecords.find(fr => fr.healthRecordId === id);

        if (updatedItem.cost && updatedItem.cost > 0) {
          const financeRecordData = {
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

    delete(tableName, id) {
    const data = this.readTable(tableName);
    const itemToDelete = data.find(item => item.id === id);
    if (!itemToDelete) return null;

    const filteredData = data.filter(item => item.id !== id);
    this.writeTable(tableName, filteredData);

    if (tableName === 'healthRecords' && itemToDelete) {
      const financeRecords = this.readTable('financeRecords');
      const existingFinanceRecord = financeRecords.find(fr => fr.healthRecordId === id);
      if (existingFinanceRecord) {
        this.deleteFinanceRecord(existingFinanceRecord.id);
      }
    }

    return itemToDelete;
  }

  addFinanceRecord(record) {
    const data = this.readTable('financeRecords');
    const newRecord = { 
      ...record, 
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newRecord);
    this.writeTable('financeRecords', data);
    return newRecord;
  }

  updateFinanceRecord(id, updates) {
    const data = this.readTable('financeRecords');
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

  deleteFinanceRecord(id) {
    const data = this.readTable('financeRecords');
    const filteredData = data.filter(record => record.id !== id);
    this.writeTable('financeRecords', filteredData);
    return filteredData.length < data.length;
  }

  getFinanceRecords() {
    return this.readTable('financeRecords');
  }

  // Feed management methods
  addFeed(feed) {
    const data = this.readTable('feeds');
    const newFeed = { 
      ...feed, 
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newFeed);
    this.writeTable('feeds', data);

    if (newFeed.cost && newFeed.cost > 0) {
      const financeRecord = {
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

  updateFeed(id, updates) {
    const data = this.readTable('feeds');
    const index = data.findIndex(feed => feed.id === id);
    if (index !== -1) {
      data[index] = { 
        ...data[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      this.writeTable('feeds', data);
      
      const updatedFeed = data[index];
      const financeRecords = this.readTable('financeRecords');
      const existingFinanceRecord = financeRecords.find(fr => fr.feedId === id);

      if (updatedFeed.cost && updatedFeed.cost > 0) {
        const financeRecordData = {
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

  deleteFeed(id) {
    const data = this.readTable('feeds');
    const itemToDelete = data.find(item => item.id === id);
    const filteredData = data.filter(feed => feed.id !== id);
    this.writeTable('feeds', filteredData);

    if (itemToDelete) {
      const financeRecords = this.readTable('financeRecords');
      const existingFinanceRecord = financeRecords.find(fr => fr.feedId === id);
      if (existingFinanceRecord) {
        this.deleteFinanceRecord(existingFinanceRecord.id);
      }
    }

    return filteredData.length < data.length;
  }

  getFeeds() {
    return this.readTable('feeds');
  }

  // Feed plan methods
  addFeedPlan(plan) {
    const data = this.readTable('feedPlans');
    const newPlan = { 
      ...plan, 
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newPlan);
    this.writeTable('feedPlans', data);
    return newPlan;
  }

  updateFeedPlan(id, updates) {
    const data = this.readTable('feedPlans');
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

  deleteFeedPlan(id) {
    const data = this.readTable('feedPlans');
    const filteredData = data.filter(plan => plan.id !== id);
    this.writeTable('feedPlans', filteredData);
    return filteredData.length < data.length;
  }

  getFeedPlans() {
    return this.readTable('feedPlans');
  }

  // Feed log methods
  addFeedLog(log) {
    const data = this.readTable('feedLogs');
    const newLog = { 
      ...log, 
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    data.push(newLog);
    this.writeTable('feedLogs', data);
    return newLog;
  }

  updateFeedLog(id, updates) {
    const data = this.readTable('feedLogs');
    const index = data.findIndex(log => log.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      this.writeTable('feedLogs', data);
      return data[index];
    }
    return null;
  }

  deleteFeedLog(id) {
    const data = this.readTable('feedLogs');
    const filteredData = data.filter(log => log.id !== id);
    this.writeTable('feedLogs', filteredData);
    return filteredData.length < data.length;
  }

  getFeedLogs() {
    return this.readTable('feedLogs');
  }

  // Media management methods
  addMedia(media) {
    return this.add('media', media);
  }

  getMediaByGoatId(goatId) {
    const allMedia = this.readTable('media');
    return allMedia.filter(mediaItem => mediaItem.goatId === goatId);
  }

  updateMedia(id, updates) {
    return this.update('media', id, updates);
  }

  deleteMedia(id) {
    return this.delete('media', id);
  }

  exportData() {
    const data = {
      goats: this.readTable('goats'),
      weightRecords: this.readTable('weightRecords'),
      healthRecords: this.readTable('healthRecords'),
      breedingRecords: this.readTable('breedingRecords'),
      financeRecords: this.readTable('financeRecords'),
      feeds: this.readTable('feeds'),
      feedPlans: this.readTable('feedPlans'),
      feedLogs: this.readTable('feedLogs'),
      media: this.readTable('media'),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return data;
  }

  importData(data) {
    try {
      this.writeTable('goats', data.goats || []);
      this.writeTable('weightRecords', data.weightRecords || []);
      this.writeTable('healthRecords', data.healthRecords || []);
      this.writeTable('breedingRecords', data.breedingRecords || []);
      this.writeTable('financeRecords', data.financeRecords || []);
      this.writeTable('feeds', data.feeds || []);
      this.writeTable('feedPlans', data.feedPlans || []);
      this.writeTable('feedLogs', data.feedLogs || []);
      this.writeTable('media', data.media || []);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Shed Management Methods
  addShed(shed) {
    const sheds = this.readTable('sheds');
    const newShed = {
      ...shed,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    sheds.push(newShed);
    this.writeTable('sheds', sheds);
    return newShed;
  }

  updateShed(id, updates) {
    const sheds = this.readTable('sheds');
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

  deleteShed(id) {
    // Delete shed and its associated partitions
    const sheds = this.readTable('sheds');
    const filteredSheds = sheds.filter(s => s.id !== id);
    this.writeTable('sheds', filteredSheds);

    // Clean up related partitions
    const partitions = this.readTable('partitions');
    const filteredPartitions = partitions.filter(p => p.shedId !== id);
    this.writeTable('partitions', filteredPartitions);

    // Clean up occupancy logs
    const occupancyLogs = this.readTable('occupancyLogs');
    const filteredLogs = occupancyLogs.filter(log => log.shedId !== id);
    this.writeTable('occupancyLogs', filteredLogs);

    return true;
  }

  // Partition Management Methods
  addPartition(partition) {
    const partitions = this.readTable('partitions');
    const newPartition = {
      ...partition,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    partitions.push(newPartition);
    this.writeTable('partitions', partitions);
    return newPartition;
  }

  getPartitionsByShed(shedId) {
    const partitions = this.readTable('partitions');
    return partitions.filter(p => p.shedId === shedId);
  }

  updatePartition(id, updates) {
    const partitions = this.readTable('partitions');
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
  addPasture(pasture) {
    const pastures = this.readTable('pastures');
    const newPasture = {
      ...pasture,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    pastures.push(newPasture);
    this.writeTable('pastures', pastures);
    return newPasture;
  }

  updatePasture(id, updates) {
    const pastures = this.readTable('pastures');
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

  deletePasture(id) {
    // Delete pasture and its associated records
    const pastures = this.readTable('pastures');
    const filteredPastures = pastures.filter(p => p.id !== id);
    this.writeTable('pastures', filteredPastures);

    // Clean up related records
    ['pastureHealth', 'grazingLogs', 'rotationPlans'].forEach(table => {
      const records = this.readTable(table);
      const filtered = records.filter(r => r.pastureId !== id);
      this.writeTable(table, filtered);
    });

    return true;
  }

  // Grazing and Health Tracking Methods
  addGrazingLog(log) {
    const logs = this.readTable('grazingLogs');
    const newLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.writeTable('grazingLogs', logs);
    return newLog;
  }

  addPastureHealthLog(log) {
    const logs = this.readTable('pastureHealth');
    const newLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.writeTable('pastureHealth', logs);
    return newLog;
  }

  addRotationPlan(plan) {
    const plans = this.readTable('rotationPlans');
    const newPlan = {
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
  logOccupancy(log) {
    const logs = this.readTable('occupancyLogs');
    const newLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.writeTable('occupancyLogs', logs);
    return newLog;
  }

  getOccupancyHistory(shedId, partitionId, startDate, endDate) {
    const logs = this.readTable('occupancyLogs');
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

  clearAll() {
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
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Migrate an existing database from old path to new path structure
   * @param {string} oldPath - The old database path
   * @returns {boolean} - Success status
   */
  static async migrateDatabase(oldPath, farmData, newBasePath) {
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
      const tables = ['goats', 'weightRecords', 'healthRecords', 'breedingRecords', 
                     'financeRecords', 'feeds', 'feedPlans', 'feedLogs', 'media'];
      
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
    } catch (error) {
      console.error('Error during database migration:', error);
      return false;
    }
  }
}

module.exports = DatabaseService;
