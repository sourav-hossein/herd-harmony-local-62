
const { Notification } = require('electron');

class NotificationService {
  constructor() {
    this.enabled = false;
    this.checkInterval = null;
  }

  async requestPermission() {
    // In Electron, notifications are available by default
    this.enabled = true;
    return true;
  }

  startHealthReminders(databaseService) {
    if (!this.enabled) return;

    // Check for health reminders every hour
    this.checkInterval = setInterval(() => {
      this.checkHealthReminders(databaseService);
    }, 60 * 60 * 1000); // 1 hour

    // Initial check
    this.checkHealthReminders(databaseService);
  }

  stopHealthReminders() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  checkHealthReminders(databaseService) {
    try {
      const healthRecords = databaseService.getAll('healthRecords');
      const now = new Date();
      
      const upcomingReminders = healthRecords.filter(record => {
        if (!record.nextDueDate) return false;
        
        const dueDate = new Date(record.nextDueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Show notification for tasks due in 3 days or overdue
        return daysUntilDue <= 3;
      });

      upcomingReminders.forEach(record => {
        const goats = databaseService.getAll('goats');
        const goat = goats.find(g => g.id === record.goatId);
        
        if (goat) {
          const dueDate = new Date(record.nextDueDate);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          let title, body;
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

  showNotification(title, body) {
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

  showVaccinationReminder(goatName, vaccinationType) {
    this.showNotification(
      'Vaccination Due',
      `${goatName} is due for ${vaccinationType} vaccination`
    );
  }

  showTreatmentReminder(goatName, treatmentType) {
    this.showNotification(
      'Treatment Required',
      `${goatName} requires ${treatmentType} treatment`
    );
  }
}

module.exports = NotificationService;
