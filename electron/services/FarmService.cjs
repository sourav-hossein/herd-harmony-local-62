const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class FarmService {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.basePath = path.join(this.userDataPath, 'farm-data');
    this.farmsMetaPath = path.join(this.basePath, 'farms.json');
    this.ensureBaseDir();
  }

  ensureBaseDir() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
    if (!fs.existsSync(this.farmsMetaPath)) {
      fs.writeFileSync(this.farmsMetaPath, JSON.stringify([], null, 2));
    }
  }

  listFarms() {
    try {
      const data = fs.readFileSync(this.farmsMetaPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading farms metadata:', error);
      return [];
    }
  }

  getFarmDataPath(farmId) {
    return path.join(this.basePath, farmId);
  }

  createFarm(farmInput) {
    const farms = this.listFarms();
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newFarm = {
      ...farmInput,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    farms.push(newFarm);
    fs.writeFileSync(this.farmsMetaPath, JSON.stringify(farms, null, 2));

    const farmDataPath = this.getFarmDataPath(newId);
    if (!fs.existsSync(farmDataPath)) {
      fs.mkdirSync(farmDataPath, { recursive: true });
    }

    return newFarm;
  }

  updateFarm(farmId, updates) {
    const farms = this.listFarms();
    const index = farms.findIndex(f => f.id === farmId);
    if (index !== -1) {
      farms[index] = { ...farms[index], ...updates };
      fs.writeFileSync(this.farmsMetaPath, JSON.stringify(farms, null, 2));
      return farms[index];
    }
    return null;
  }

  deleteFarm(farmId) {
    const farms = this.listFarms();
    const updatedFarms = farms.filter(f => f.id !== farmId);
    fs.writeFileSync(this.farmsMetaPath, JSON.stringify(updatedFarms, null, 2));

    const farmDataPath = this.getFarmDataPath(farmId);
    if (fs.existsSync(farmDataPath)) {
      fs.rmSync(farmDataPath, { recursive: true, force: true });
    }

    return true;
  }
}

module.exports = FarmService;
