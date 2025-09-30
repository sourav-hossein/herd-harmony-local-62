import * as fs from 'fs';
import * as fsp from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import { DatabaseService } from './DatabaseService';
import { FarmMeta, FarmMapData, PastureMapData } from '@herd-harmony/shared-types/farm';

class FarmService {
  private userDataPath: string;
  private basePath: string;
  private farmsMetaPath: string;
  private activeFarmMetaPath: string;
  private mapsPath: string;
  private tilesPath: string;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.basePath = path.join(this.userDataPath, 'farm-data');
    this.farmsMetaPath = path.join(this.basePath, 'farms.json');
    this.activeFarmMetaPath = path.join(this.basePath, 'active-farm.json');
    this.mapsPath = path.join(this.basePath, 'maps');
    this.tilesPath = path.join(this.basePath, 'cached-tiles');
    this.ensureBaseDir();
  }

  private ensureBaseDir(): void {
    const dirs = [this.basePath, this.mapsPath, this.tilesPath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    if (!fs.existsSync(this.farmsMetaPath)) {
      fs.writeFileSync(this.farmsMetaPath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.activeFarmMetaPath)) {
      fs.writeFileSync(this.activeFarmMetaPath, JSON.stringify({ activeFarmId: null }, null, 2));
    }
  }

  private listFarms(): FarmMeta[] {
    try {
      const data = fs.readFileSync(this.farmsMetaPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading farms metadata:', error);
      return [];
    }
  }

  private getFarmDataPath(farmId: string): string {
    const farm = this.listFarms().find(f => f.id === farmId);
    if (!farm) {
      return path.join(this.basePath, farmId);
    }

    const tempDb = new DatabaseService(farm, this.basePath);
    return tempDb.dbPath;
  }

  private getFarmMapPath(farmId: string): string {
    return path.join(this.mapsPath, `${farmId}.json`);
  }

  createFarm(farmInput: Omit<FarmMeta, 'id' | 'createdAt'> & { mapData?: FarmMapData }): FarmMeta {
    const farms = this.listFarms();
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newFarm: FarmMeta = {
      ...farmInput,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    farms.push(newFarm);
    fs.writeFileSync(this.farmsMetaPath, JSON.stringify(farms, null, 2));

    // Save map data if provided
    if (farmInput.mapData) {
      this.saveFarmMapData(newId, farmInput.mapData);
    }

    // Initialize database with farm metadata
    const dbService = new DatabaseService(newFarm, this.basePath);

    return newFarm;
  }

  updateFarm(farmId: string, updates: Partial<FarmMeta> & { mapData?: FarmMapData }): FarmMeta | null {
    const farms = this.listFarms();
    const index = farms.findIndex(f => f.id === farmId);
    if (index !== -1) {
      farms[index] = { ...farms[index], ...updates };
      fs.writeFileSync(this.farmsMetaPath, JSON.stringify(farms, null, 2));

      // Update map data if provided
      if (updates.mapData) {
        this.saveFarmMapData(farmId, updates.mapData);
      }

      return farms[index];
    }
    return null;
  }

  deleteFarm(farmId: string): boolean {
    const farms = this.listFarms();
    const farmToDelete = farms.find(f => f.id === farmId);
    const updatedFarms = farms.filter(f => f.id !== farmId);

    fs.writeFileSync(this.farmsMetaPath, JSON.stringify(updatedFarms, null, 2));

    // Delete farm directory and map data
    if (farmToDelete) {
      const farmDataPath = this.getFarmDataPath(farmId);
      if (fs.existsSync(farmDataPath)) {
        fs.rmSync(farmDataPath, { recursive: true, force: true });
      }

      // Delete map data
      const mapPath = this.getFarmMapPath(farmId);
      if (fs.existsSync(mapPath)) {
        fs.unlinkSync(mapPath);
      }

      // Clean up cached tiles for this farm
      this.cleanupFarmTiles(farmId);
    }

    const activeFarmId = this.getActiveFarmId();
    if (activeFarmId === farmId) {
      this.setActiveFarmId(null);
    }

    return true;
  }

  // Map data management
  saveFarmMapData(farmId: string, mapData: FarmMapData): boolean {
    try {
      const mapPath = this.getFarmMapPath(farmId);
      const mapDataToSave: FarmMapData = {
        farmId,
        center: mapData.center,
        zoom: mapData.zoom,
        bounds: mapData.bounds,
        boundary: mapData.boundary,
        screenshot: mapData.screenshot,
        savedAt: new Date().toISOString(),
        tileUrls: mapData.tileUrls || []
      };
      fs.writeFileSync(mapPath, JSON.stringify(mapDataToSave, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving farm map data:', error);
      return false;
    }
  }

  getFarmMapData(farmId: string): FarmMapData | null {
    try {
      const mapPath = this.getFarmMapPath(farmId);
      if (fs.existsSync(mapPath)) {
        const data = fs.readFileSync(mapPath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error reading farm map data:', error);
      return null;
    }
  }

  // Tile caching for offline maps
  cacheTileForFarm(farmId: string, tileKey: string, tileData: Buffer): boolean {
    try {
      const farmTilesDir = path.join(this.tilesPath, farmId);
      if (!fs.existsSync(farmTilesDir)) {
        fs.mkdirSync(farmTilesDir, { recursive: true });
      }

      const tilePath = path.join(farmTilesDir, `${tileKey}.png`);
      fs.writeFileSync(tilePath, tileData);
      return true;
    } catch (error) {
      console.error('Error caching tile:', error);
      return false;
    }
  }

  getCachedTile(farmId: string, tileKey: string): Buffer | null {
    try {
      const tilePath = path.join(this.tilesPath, farmId, `${tileKey}.png`);
      if (fs.existsSync(tilePath)) {
        return fs.readFileSync(tilePath);
      }
      return null;
    } catch (error) {
      console.error('Error reading cached tile:', error);
      return null;
    }
  }

  cleanupFarmTiles(farmId: string): void {
    try {
      const farmTilesDir = path.join(this.tilesPath, farmId);
      if (fs.existsSync(farmTilesDir)) {
        fs.rmSync(farmTilesDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error cleaning up farm tiles:', error);
    }
  }

  // Pasture-related map operations
  savePastureMapData(farmId: string, pastureId: string, mapData: PastureMapData): boolean {
    try {
      const farmMapData = this.getFarmMapData(farmId) || { pastures: {} };
      if (!farmMapData.pastures) {
        farmMapData.pastures = {};
      }

      farmMapData.pastures[pastureId] = {
        ...mapData,
        savedAt: new Date().toISOString()
      };

      return this.saveFarmMapData(farmId, farmMapData);
    } catch (error) {
      console.error('Error saving pasture map data:', error);
      return false;
    }
  }

  getPastureMapData(farmId: string, pastureId: string): PastureMapData | null {
    try {
      const farmMapData = this.getFarmMapData(farmId);
      return farmMapData?.pastures?.[pastureId] || null;
    } catch (error) {
      console.error('Error reading pasture map data:', error);
      return null;
    }
  }

  // Utility methods
  getFarmMapBounds(farmId: string): any | null {
    const mapData = this.getFarmMapData(farmId);
    return mapData?.bounds || null;
  }

  isFarmMapAvailable(farmId: string): boolean {
    const mapPath = this.getFarmMapPath(farmId);
    return fs.existsSync(mapPath);
  }

  getActiveFarmId(): string | null {
    try {
      const data = fs.readFileSync(this.activeFarmMetaPath, 'utf8');
      return JSON.parse(data).activeFarmId;
    } catch (error) {
      console.error('Error reading active farm metadata:', error);
      return null;
    }
  }

  setActiveFarmId(farmId: string | null): boolean {
    try {
      fs.writeFileSync(this.activeFarmMetaPath, JSON.stringify({ activeFarmId: farmId }, null, 2));
      return true;
    } catch (error) {
      console.error('Error setting active farm:', error);
      return false;
    }
  }

  // Export/Import functionality for farm data including maps
  exportFarmData(farmId: string): any | null {
    try {
      const farms = this.listFarms();
      const farm = farms.find(f => f.id === farmId);
      if (!farm) return null;

      const mapData = this.getFarmMapData(farmId);

      // Get database data
      const dbService = new DatabaseService(farm, this.basePath);
      // Add database export logic here if needed

      return {
        farm,
        mapData,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting farm data:', error);
      return null;
    }
  }

  importFarmData(farmData: { farm: FarmMeta, mapData?: FarmMapData }): FarmMeta | null {
    try {
      // Create farm
      const importedFarm = this.createFarm(farmData.farm);

      // Import map data
      if (farmData.mapData) {
        this.saveFarmMapData(importedFarm.id, farmData.mapData);
      }

      return importedFarm;
    } catch (error) {
      console.error('Error importing farm data:', error);
      return null;
    }
  }
}

export { FarmService };
