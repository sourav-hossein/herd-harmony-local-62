
export class SystemValidator {
  static validateElectronEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!window.electronAPI) {
      errors.push('Electron API not available');
      return { isValid: false, errors };
    }

    if (!window.electronAPI.isElectron) {
      errors.push('Not running in Electron environment');
    }

    // Check required Electron APIs
    const requiredAPIs = [
      'getGoats', 'addGoat', 'updateGoat', 'deleteGoat',
      'getWeightRecords', 'addWeightRecord', 'updateWeightRecord', 'deleteWeightRecord',
      'getHealthRecords', 'addHealthRecord', 'updateHealthRecord', 'deleteHealthRecord',
      'getBreedingRecords', 'addBreedingRecord', 'updateBreedingRecord', 'deleteBreedingRecord',
      'getFinanceRecords', 'addFinanceRecord', 'updateFinanceRecord', 'deleteFinanceRecord',
      'getFeeds', 'addFeed', 'updateFeed', 'deleteFeed',
      'getFeedPlans', 'addFeedPlan', 'updateFeedPlan', 'deleteFeedPlan',
      'getFeedLogs', 'addFeedLog',
      'exportData', 'importData', 'clearAll',
      'getPedigreeTree', 'calculateInbreedingRisk',
      'createBackup', 'restoreBackup', 'getBackupFiles'
    ];

    for (const api of requiredAPIs) {
      if (typeof (window.electronAPI as any)[api] !== 'function') {
        errors.push(`Missing required API: ${api}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static async validateDatabaseConnection(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test basic database operations
      await window.electronAPI!.getGoats();
      await window.electronAPI!.getWeightRecords();
      await window.electronAPI!.getHealthRecords();
      await window.electronAPI!.getBreedingRecords();
      await window.electronAPI!.getFinanceRecords();
      await window.electronAPI!.getFeeds();
      await window.electronAPI!.getFeedPlans();
      await window.electronAPI!.getFeedLogs();
    } catch (error) {
      errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static async runFullSystemCheck(): Promise<{
    isValid: boolean;
    electronCheck: { isValid: boolean; errors: string[] };
    databaseCheck: { isValid: boolean; errors: string[] };
  }> {
    const electronCheck = this.validateElectronEnvironment();
    const databaseCheck = electronCheck.isValid ? await this.validateDatabaseConnection() : { isValid: false, errors: ['Skipped due to Electron environment issues'] };

    return {
      isValid: electronCheck.isValid && databaseCheck.isValid,
      electronCheck,
      databaseCheck
    };
  }
}
