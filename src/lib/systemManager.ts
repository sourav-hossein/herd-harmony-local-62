
import { DataIntegrityManager } from './dataIntegrity';
import { Goat, WeightRecord, HealthRecord, BreedingRecord } from '@/types/goat';

export class GoatFarmSystemManager {
  private static instance: GoatFarmSystemManager;
  private dataBackupInterval: number | null = null;

  static getInstance(): GoatFarmSystemManager {
    if (!GoatFarmSystemManager.instance) {
      GoatFarmSystemManager.instance = new GoatFarmSystemManager();
    }
    return GoatFarmSystemManager.instance;
  }

  // Auto-backup system for Electron
  startAutoBackup(intervalMinutes: number = 30) {
    if (this.dataBackupInterval) {
      clearInterval(this.dataBackupInterval);
    }

    this.dataBackupInterval = window.setInterval(() => {
      this.performBackup();
    }, intervalMinutes * 60 * 1000);

    console.log(`Auto-backup started: every ${intervalMinutes} minutes`);
  }

  stopAutoBackup() {
    if (this.dataBackupInterval) {
      clearInterval(this.dataBackupInterval);
      this.dataBackupInterval = null;
      console.log('Auto-backup stopped');
    }
  }

  async performBackup(): Promise<boolean> {
    try {
      if (window.electronAPI?.isElectron) {
        // Electron backup
        const result = await window.electronAPI.exportData();
        if (result.success) {
          console.log('Backup completed successfully');
          return true;
        }
      } else {
        // Browser backup to localStorage with timestamp
        const timestamp = new Date().toISOString();
        const backupKey = `goat_farm_backup_${timestamp}`;
        
        const data = {
          timestamp,
          goats: JSON.parse(localStorage.getItem('goats') || '[]'),
          weightRecords: JSON.parse(localStorage.getItem('weightRecords') || '[]'),
          healthRecords: JSON.parse(localStorage.getItem('healthRecords') || '[]'),
          breedingRecords: JSON.parse(localStorage.getItem('breedingRecords') || '[]'),
          financeRecords: JSON.parse(localStorage.getItem('financeRecords') || '[]')
        };
        
        localStorage.setItem(backupKey, JSON.stringify(data));
        console.log('Browser backup completed');
        return true;
      }
    } catch (error) {
      console.error('Backup failed:', error);
      return false;
    }
    return false;
  }

  // Performance optimization for large datasets
  optimizeImageStorage() {
    try {
      // Compress and optimize stored images
      const goats = JSON.parse(localStorage.getItem('goats') || '[]');
      let optimized = false;

      const optimizedGoats = goats.map((goat: Goat) => {
        if (goat.imageId && typeof goat.imageId === 'string' && goat.imageId.startsWith('data:image')) {
          // Image is too large, compress it
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            const maxWidth = 800;
            const maxHeight = 600;
            
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
              optimized = true;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            goat.imageId = canvas.toDataURL('image/jpeg', 0.8);
          };
          
          img.src = goat.imageId;
        }
        return goat;
      });

      if (optimized) {
        localStorage.setItem('goats', JSON.stringify(optimizedGoats));
        console.log('Image storage optimized');
      }
    } catch (error) {
      console.error('Image optimization failed:', error);
    }
  }

  // Data integrity checks and repairs
  async runDataIntegrityCheck(
    goats: Goat[],
    weightRecords: WeightRecord[],
    healthRecords: HealthRecord[],
    breedingRecords: BreedingRecord[]
  ) {
    const report = DataIntegrityManager.generateDataReport(
      goats,
      weightRecords,
      healthRecords,
      breedingRecords
    );

    // Auto-fix some common issues
    if (report.issues.length > 0) {
      console.warn('Data integrity issues found:', report.issues);
      
      // Sync pedigree data
      const { updatedGoats, orphanedRecords } = DataIntegrityManager.syncPedigreeData(
        goats,
        breedingRecords
      );

      if (orphanedRecords.length > 0) {
        console.warn('Orphaned breeding records found:', orphanedRecords);
      }

      return {
        report,
        fixesApplied: updatedGoats.length !== goats.length,
        updatedGoats: updatedGoats
      };
    }

    return { report, fixesApplied: false, updatedGoats: goats };
  }

  // Memory and performance monitoring
  monitorPerformance() {
    if ('performance' in window) {
      const memory = (performance as any).memory;
      if (memory) {
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };

        console.log('Memory usage:', memoryUsage);

        // Warn if memory usage is high
        if (memoryUsage.used / memoryUsage.limit > 0.8) {
          console.warn('High memory usage detected. Consider optimizing data storage.');
          this.optimizeImageStorage();
        }
      }
    }
  }

  // Health check for the entire system
  async runSystemHealthCheck() {
    const healthStatus = {
      timestamp: new Date(),
      electron: {
        available: Boolean(window.electronAPI?.isElectron),
        working: false
      },
      localStorage: {
        available: typeof Storage !== 'undefined',
        working: false
      },
      performance: {
        memoryUsage: null as any,
        storageUsage: null as any
      },
      dataIntegrity: {
        issues: [] as string[],
        recommendations: [] as string[]
      }
    };

    // Test Electron API
    if (healthStatus.electron.available) {
      try {
        await window.electronAPI.getGoats();
        healthStatus.electron.working = true;
      } catch (error) {
        console.error('Electron API test failed:', error);
      }
    }

    // Test localStorage
    if (healthStatus.localStorage.available) {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        healthStatus.localStorage.working = true;
      } catch (error) {
        console.error('localStorage test failed:', error);
      }
    }

    // Performance monitoring
    this.monitorPerformance();

    return healthStatus;
  }

  // Cleanup old backups to save space
  cleanupOldBackups(maxBackups: number = 10) {
    const keys = Object.keys(localStorage);
    const backupKeys = keys
      .filter(key => key.startsWith('goat_farm_backup_'))
      .sort()
      .reverse();

    if (backupKeys.length > maxBackups) {
      const toDelete = backupKeys.slice(maxBackups);
      toDelete.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log(`Cleaned up ${toDelete.length} old backups`);
    }
  }
}

// Initialize system manager
export const systemManager = GoatFarmSystemManager.getInstance();
