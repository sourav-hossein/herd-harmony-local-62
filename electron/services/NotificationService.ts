import { Notification, BrowserWindow } from 'electron';
import { DatabaseService } from './DatabaseService';
import { HealthRecord, Goat } from '@herd-harmony/shared-types/goat'; // Assuming types are here

class NotificationService {
  private enabled: boolean;
  private checkInterval: NodeJS.Timeout | null;
  private mainWindow: BrowserWindow | null;

  constructor(mainWindow: BrowserWindow | null) {
    this.enabled = false;
    this.checkInterval = null;
    this.mainWindow = mainWindow;
  }

  async requestPermission(): Promise<boolean> {
    // In Electron, notifications are available by default
    this.enabled = true;
    return true;
  }

  startHealthReminders(databaseService: DatabaseService): void {
    if (!this.enabled) return;

    // Check for health reminders every hour
    this.checkInterval = setInterval(() => {
      this.checkHealthReminders(databaseService);
    }, 60 * 60 * 1000); // 1 hour

    // Initial check
    this.checkHealthReminders(databaseService);
  }

  stopHealthReminders(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkHealthReminders(databaseService: DatabaseService): void {
    try {
      const healthRecords = databaseService.getAll<HealthRecord>('healthRecords');
      const now = new Date();

      const upcomingReminders = healthRecords.filter(record => {
        if (!record.nextDueDate) return false;

        const dueDate = new Date(record.nextDueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Show notification for tasks due in 3 days or overdue
        return daysUntilDue <= 3;
      });

      upcomingReminders.forEach(record => {
        const goats = databaseService.getAll<Goat>('goats');
        const goat = goats.find(g => g.id === record.goatId);

        if (goat) {
          const dueDate = new Date(record.nextDueDate);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let title: string, body: string;
          if (daysUntilDue <= 0) {
            title = 'Overdue Health Task';
            body = `${goat.name} has an overdue ${record.type}: ${record.description}`;
          } else {
            title = 'Upcoming Health Task';
            body = `${goat.name} needs ${record.type} in ${daysUntilDue} days: ${record.description}`;
          }

          this.showNotification(title, body);
        }
      });
    } catch (error) {
      console.error('Error checking health reminders:', error);
    }
  }

  showNotification(title: string, body: string): void {
    if (!this.enabled) return;

    try {
      new Notification({
        title,
        body,
        icon: 'public/favicon.ico', // Path to your app icon
        silent: false,
        timeoutType: 'default'
      }).show();
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  showVaccinationReminder(goatName: string, vaccinationType: string): void {
    this.showNotification(
      'Vaccination Due',
      `${goatName} is due for ${vaccinationType} vaccination`
    );
  }

  showTreatmentReminder(goatName: string, treatmentType: string): void {
    this.showNotification(
      'Treatment Required',
      `${goatName} requires ${treatmentType} treatment`
    );
  }
}

export { NotificationService };
