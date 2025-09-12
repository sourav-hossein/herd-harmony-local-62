const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const SyncStateService = require('./SyncStateService.cjs');

class DatabaseService {
  constructor(farmPath) {
    this.dbPath = farmPath;
    this.ensureDatabaseDir();
    this.initDatabase();
  }

  ensureDatabaseDir() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  initDatabase() {
    const tables = ['goats', 'weightRecords', 'healthRecords', 'breedingRecords', 'financeRecords', 'feeds', 'feedPlans', 'feedLogs', 'media'];
    tables.forEach(table => {
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

  clearAll() {
    try {
      this.writeTable('goats', []);
      this.writeTable('weightRecords', []);
      this.writeTable('healthRecords', []);
      this.writeTable('breedingRecords', []);
      this.writeTable('financeRecords', []);
      this.writeTable('feeds', []);
      this.writeTable('feedPlans', []);
      this.writeTable('feedLogs', []);
      this.writeTable('media', []);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}

module.exports = DatabaseService;
