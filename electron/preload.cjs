const { contextBridge, ipcRenderer } = require('electron');

console.log('Exposing APIs to renderer ...');

contextBridge.exposeInMainWorld('electronAPI', {
  isReady: () => ipcRenderer.invoke('app:isReady'),
  isElectron: true,

  // Farm Management
  listFarms: () => ipcRenderer.invoke('farm:list'),
  createFarm: (farmInput) => ipcRenderer.invoke('farm:create', farmInput),
  updateFarm: (farmId, updates) => ipcRenderer.invoke('farm:update', farmId, updates),
  deleteFarm: (farmId) => ipcRenderer.invoke('farm:delete', farmId),
  getActiveFarmId: () => ipcRenderer.invoke('farm:getActiveId'),
  setActiveFarmId: (farmId) => ipcRenderer.invoke('farm:setActiveId', farmId),
  initializeFarmServices: (farmId) => ipcRenderer.invoke('farm:initializeServices', farmId),

  // Farm Map Management
  getFarmMapData: (farmId) => ipcRenderer.invoke('farm:getFarmMapData', farmId),
  saveFarmMapData: (farmId, mapData) => ipcRenderer.invoke('farm:saveFarmMapData', farmId, mapData),
  savePastureMapData: (farmId, pastureId, mapData) => ipcRenderer.invoke('farm:savePastureMapData', farmId, pastureId, mapData),
  getPastureMapData: (farmId, pastureId) => ipcRenderer.invoke('farm:getPastureMapData', farmId, pastureId),
  getFarmMapBounds: (farmId) => ipcRenderer.invoke('farm:getFarmMapBounds', farmId),
  isFarmMapAvailable: (farmId) => ipcRenderer.invoke('farm:isFarmMapAvailable', farmId),

  // Map Tile Caching
  cacheTileForFarm: (farmId, tileKey, tileData) => ipcRenderer.invoke('farm:cacheTile', farmId, tileKey, tileData),
  getCachedTile: (farmId, tileKey) => ipcRenderer.invoke('farm:getCachedTile', farmId, tileKey),
  cleanupFarmTiles: (farmId) => ipcRenderer.invoke('farm:cleanupFarmTiles', farmId),

  // Farm Data Export/Import
  exportFarmData: (farmId) => ipcRenderer.invoke('farm:exportFarmData', farmId),
  importFarmData: (farmData) => ipcRenderer.invoke('farm:importFarmData', farmData),
  // Shed Management
  getSheds: () => ipcRenderer.invoke('db:getSheds'),
  addShed: (shed) => ipcRenderer.invoke('db:addShed', shed),
  updateShed: (id, updates) => ipcRenderer.invoke('db:updateShed', id, updates),
  deleteShed: (id) => ipcRenderer.invoke('db:deleteShed', id),

  // Partition Management
  getPartitions: (shedId) => ipcRenderer.invoke('db:getPartitions', shedId),
  addPartition: (partition) => ipcRenderer.invoke('db:addPartition', partition),
  updatePartition: (id, updates) => ipcRenderer.invoke('db:updatePartition', id, updates),
  deletePartition: (id) => ipcRenderer.invoke('db:deletePartition', id),

  // Pasture Management
  getPastures: () => ipcRenderer.invoke('db:getPastures'),
  addPasture: (pasture) => ipcRenderer.invoke('db:addPasture', pasture),
  updatePasture: (id, updates) => ipcRenderer.invoke('db:updatePasture', id, updates),
  deletePasture: (id) => ipcRenderer.invoke('db:deletePasture', id),

  // Tracking and Logs
  addGrazingLog: (log) => ipcRenderer.invoke('db:addGrazingLog', log),
  getGrazingLogs: (pastureId) => ipcRenderer.invoke('db:getGrazingLogs', pastureId),
  addPastureHealthLog: (log) => ipcRenderer.invoke('db:addPastureHealthLog', log),
  getPastureHealthLogs: (pastureId) => ipcRenderer.invoke('db:getPastureHealthLogs', pastureId),
  addRotationPlan: (plan) => ipcRenderer.invoke('db:addRotationPlan', plan),
  getRotationPlans: (pastureId) => ipcRenderer.invoke('db:getRotationPlans', pastureId),
  getOccupancyHistory: (params) => ipcRenderer.invoke('db:getOccupancyHistory', params),

  // Database - Goats
  getGoats: () => ipcRenderer.invoke('db:getGoats'),
  addGoat: (goat) => ipcRenderer.invoke('db:addGoat', goat),
  updateGoat: (id, updates) => ipcRenderer.invoke('db:updateGoat', id, updates),
  deleteGoat: (id) => ipcRenderer.invoke('db:deleteGoat', id),

  // Database - Weight Records
  getWeightRecords: () => ipcRenderer.invoke('db:getWeightRecords'),
  addWeightRecord: (record) => ipcRenderer.invoke('db:addWeightRecord', record),
  updateWeightRecord: (id, updates) => ipcRenderer.invoke('db:updateWeightRecord', id, updates),
  deleteWeightRecord: (id) => ipcRenderer.invoke('db:deleteWeightRecord', id),

  // Database - Health Records
  getHealthRecords: () => ipcRenderer.invoke('db:getHealthRecords'),
  addHealthRecord: (record) => ipcRenderer.invoke('db:addHealthRecord', record),
  updateHealthRecord: (id, updates) => ipcRenderer.invoke('db:updateHealthRecord', id, updates),
  deleteHealthRecord: (id) => ipcRenderer.invoke('db:deleteHealthRecord', id),

  // Database - Breeding Records
  getBreedingRecords: () => ipcRenderer.invoke('db:getBreedingRecords'),
  addBreedingRecord: (record) => ipcRenderer.invoke('db:addBreedingRecord', record),
  updateBreedingRecord: (id, updates) => ipcRenderer.invoke('db:updateBreedingRecord', id, updates),
  deleteBreedingRecord: (id) => ipcRenderer.invoke('db:deleteBreedingRecord', id),

  // Database - Heat Cycles
  getHeatCycles: () => ipcRenderer.invoke('db:getHeatCycles'),
  addHeatCycle: (record) => ipcRenderer.invoke('db:addHeatCycle', record),
  updateHeatCycle: (id, updates) => ipcRenderer.invoke('db:updateHeatCycle', id, updates),
  deleteHeatCycle: (id) => ipcRenderer.invoke('db:deleteHeatCycle', id),

  // Database - Kidding Records
  getKiddingRecords: () => ipcRenderer.invoke('db:getKiddingRecords'),
  addKiddingRecord: (record) => ipcRenderer.invoke('db:addKiddingRecord', record),
  updateKiddingRecord: (id, updates) => ipcRenderer.invoke('db:updateKiddingRecord', id, updates),
  deleteKiddingRecord: (id) => ipcRenderer.invoke('db:deleteKiddingRecord', id),

  // Database - Finance Records
  getFinanceRecords: () => ipcRenderer.invoke('db:getFinanceRecords'),
  addFinanceRecord: (record) => ipcRenderer.invoke('db:addFinanceRecord', record),
  updateFinanceRecord: (id, updates) => ipcRenderer.invoke('db:updateFinanceRecord', id, updates),
  deleteFinanceRecord: (id) => ipcRenderer.invoke('db:deleteFinanceRecord', id),

  // Database - Feeds
  getFeeds: () => ipcRenderer.invoke('db:getFeeds'),
  addFeed: (feed) => ipcRenderer.invoke('db:addFeed', feed),
  updateFeed: (id, updates) => ipcRenderer.invoke('db:updateFeed', id, updates),
  deleteFeed: (id) => ipcRenderer.invoke('db:deleteFeed', id),

  // Database - Feed Plans
  getFeedPlans: () => ipcRenderer.invoke('db:getFeedPlans'),
  addFeedPlan: (plan) => ipcRenderer.invoke('db:addFeedPlan', plan),
  updateFeedPlan: (id, updates) => ipcRenderer.invoke('db:updateFeedPlan', id, updates),
  deleteFeedPlan: (id) => ipcRenderer.invoke('db:deleteFeedPlan', id),

  // Database - Feed Logs
  getFeedLogs: () => ipcRenderer.invoke('db:getFeedLogs'),
  addFeedLog: (log) => ipcRenderer.invoke('db:addFeedLog', log),
  updateFeedLog: (id, updates) => ipcRenderer.invoke('db:updateFeedLog', id, updates),
  deleteFeedLog: (id) => ipcRenderer.invoke('db:deleteFeedLog', id),

  // Pedigree
  getPedigreeTree: (goatId, generations) => ipcRenderer.invoke('pedigree:getTree', goatId, generations),
  calculateInbreedingRisk: (sireId, damId) => ipcRenderer.invoke('pedigree:calculateInbreedingRisk', sireId, damId),

  // Data Management
  exportData: () => ipcRenderer.invoke('db:exportData'),
  importData: (data) => ipcRenderer.invoke('db:importData', data),
  clearAll: () => ipcRenderer.invoke('db:clearAll'),

  // Backup
  createBackup: (password) => ipcRenderer.invoke('backup:create', password),
  restoreBackup: (backupId, password) => ipcRenderer.invoke('backup:restore', backupId, password),
  getBackupFiles: () => ipcRenderer.invoke('backup:getFiles'),
  deleteBackup: (backupId) => ipcRenderer.invoke('backup:delete', backupId),
  getBackupSettings: () => ipcRenderer.invoke('backup:getSettings'),
  saveBackupSettings: (settings) => ipcRenderer.invoke('backup:saveSettings', settings),
  selectBackupPath: () => ipcRenderer.invoke('backup:selectPath'),

  // Media Management
  getMediaByGoatId: (goatId) => ipcRenderer.invoke('media:getByGoatId', goatId),
  getThumbnails: () => ipcRenderer.invoke('media:get-thumbnails'),
  addMediaViaDialog: (goatId, category, description, tags) => ipcRenderer.invoke('media:add-via-dialog', goatId, category, description, tags),
  uploadStart: (meta) => ipcRenderer.invoke('media:upload-start', meta),
  uploadChunk: (uploadId, chunk) => ipcRenderer.send('media:upload-chunk', uploadId, chunk),
  uploadComplete: (uploadId) => ipcRenderer.invoke('media:upload-complete', uploadId),
  updateMedia: (id, updates) => ipcRenderer.invoke('media:update', id, updates),
  deleteMedia: (id) => ipcRenderer.invoke('media:delete', id),
  setPrimaryMedia: (goatId, mediaId) => ipcRenderer.invoke('media:set-primary', goatId, mediaId),
  downloadMedia: (mediaId) => ipcRenderer.invoke('media:download', mediaId),
  getMediaFilePath: (mediaId) => ipcRenderer.invoke('media:get-file-path', mediaId),
  openMediaFile: (mediaId) => ipcRenderer.invoke('media:open-file', mediaId),
  revealMediaFileInFolder: (mediaId) => ipcRenderer.invoke('media:reveal-file', mediaId),

  // File Operations
  showSaveDialog: (opts) => ipcRenderer.invoke('file:showSaveDialog', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('file:showOpenDialog', opts),
  writeFile: (p, data) => ipcRenderer.invoke('file:write', p, data),
  readFile: (p) => ipcRenderer.invoke('file:read', p),
  deleteFile: (p) => ipcRenderer.invoke('file:delete', p),

  // Drive operations
  startAuth: () => ipcRenderer.invoke('drive:oauth-start'),
  restoreAuth: () => ipcRenderer.invoke('drive:oauth-restore'),
  disconnectDrive: () => ipcRenderer.invoke('drive:disconnect'),
  syncNow: (deviceId) => ipcRenderer.invoke('drive:sync-now', deviceId),
  onProgress: (callback) => {
    const channel = 'drive-sync-progress';
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    return () => ipcRenderer.removeAllListeners(channel);
  },
});


