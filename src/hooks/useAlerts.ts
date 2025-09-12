
import { useState, useEffect } from 'react';
import { alertsEngine, Alert, FarmHealthMetrics } from '@/lib/alertsEngine';
import { useGoatContext } from '@/context/GoatContext';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<FarmHealthMetrics>({
    score: 100,
    completedTasks: 0,
    totalTasks: 0,
    details: {
      healthRecordsComplete: 0,
      weightRecordsUpToDate: 0,
      breedingRecordsComplete: 0,
      overdueTasks: 0
    }
  });

  const {
    goats,
    healthRecords,
    weightRecords,
    breedingRecords,
    financeRecords,
    loading
  } = useGoatContext();

  // Subscribe to alerts engine
  useEffect(() => {
    const unsubscribe = alertsEngine.subscribe(setAlerts);
    return unsubscribe;
  }, []);

  // Analyze farm data and generate alerts
  useEffect(() => {
    if (!loading && goats.length > 0) {
      // Generate alerts
      alertsEngine.analyzeAndGenerateAlerts(
        goats,
        healthRecords,
        weightRecords,
        breedingRecords,
        financeRecords
      );

      // Calculate health metrics
      const metrics = alertsEngine.calculateFarmHealthScore(
        goats,
        healthRecords,
        weightRecords,
        breedingRecords
      );
      setHealthMetrics(metrics);
    }
  }, [goats, healthRecords, weightRecords, breedingRecords, financeRecords, loading]);

  // Periodic analysis (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && goats.length > 0) {
        alertsEngine.analyzeAndGenerateAlerts(
          goats,
          healthRecords,
          weightRecords,
          breedingRecords,
          financeRecords
        );
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [goats, healthRecords, weightRecords, breedingRecords, financeRecords, loading]);

  const dismissAlert = (id: string) => {
    alertsEngine.dismissAlert(id);
  };

  const clearDismissedAlerts = () => {
    alertsEngine.clearDismissedAlerts();
  };

  const getActiveAlerts = () => {
    return alertsEngine.getActiveAlerts();
  };

  const getCriticalAlerts = () => {
    return alertsEngine.getActiveAlerts().filter(alert => alert.type === 'critical');
  };

  const getAlertsForGoat = (goatId: string) => {
    return alertsEngine.getActiveAlerts().filter(alert => alert.goatId === goatId);
  };

  return {
    alerts,
    healthMetrics,
    dismissAlert,
    clearDismissedAlerts,
    getActiveAlerts,
    getCriticalAlerts,
    getAlertsForGoat
  };
}
