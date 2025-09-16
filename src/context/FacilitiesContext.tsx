
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shed, Pasture, Partition } from '@/types/farm';
import { useFarm } from '@/context/FarmContext';
import { GrazingLog, PastureHealthLog, RotationPlan } from '@/types/grazing';

interface FacilitiesContextType {
  sheds: Shed[];
  pastures: Pasture[];
  pastureHealthLogs: PastureHealthLog[];
  rotationPlans: RotationPlan[];
  loading: boolean;
  error: string | null;
  addShed: (shed: Omit<Shed, 'id' | 'createdAt'>) => Promise<Shed>;
  updateShed: (id: string, updates: Partial<Shed>) => Promise<Shed>;
  deleteShed: (id: string) => Promise<boolean>;
  addPartition: (partition: Partition) => Promise<Partition>;
  updatePartition: (id: string, updates: Partial<Partition>) => Promise<Partition>;
  addPasture: (pasture: Omit<Pasture, 'id' | 'createdAt'>) => Promise<Pasture>;
  updatePasture: (id: string, updates: Partial<Pasture>) => Promise<Pasture>;
  deletePasture: (id: string) => Promise<boolean>;
  addGrazingLog: (log: GrazingLog) => Promise<GrazingLog>;
  addPastureHealthLog: (log: PastureHealthLog) => Promise<PastureHealthLog>;
  addRotationPlan: (plan: RotationPlan) => Promise<RotationPlan>;
  updateRotationPlan: (id: string, updates: Partial<RotationPlan>) => Promise<RotationPlan>;
  refresh: () => void;
}

const FacilitiesContext = createContext<FacilitiesContextType | undefined>(undefined);

export function FacilitiesProvider({ children }: { children: ReactNode }) {
  const { activeFarmId } = useFarm();
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [pastures, setPastures] = useState<Pasture[]>([]);
  const [pastureHealthLogs, setPastureHealthLogs] = useState<PastureHealthLog[]>([]);
  const [rotationPlans, setRotationPlans] = useState<RotationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeFarmId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [shedsData, pasturesData, healthLogsData, rotationPlansData] = await Promise.all([
        window.electronAPI?.getSheds(),
        window.electronAPI?.getPastures(),
        window.electronAPI?.getPastureHealthLogs(),
        window.electronAPI?.getRotationPlans(),
      ]);

      setSheds(shedsData || []);
      setPastures(pasturesData || []);
      setPastureHealthLogs(healthLogsData || []);
      setRotationPlans(rotationPlansData || []);
    } catch (err) {
      console.error('Error loading facilities data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load facilities data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFarmId]);

  const addShed = async (shed: Omit<Shed, 'id' | 'createdAt'>) => {
    const newShed = await window.electronAPI?.addShed(shed);
    setSheds(prev => [...prev, newShed]);
    return newShed;
  };

  const updateShed = async (id: string, updates: Partial<Shed>) => {
    const updatedShed = await window.electronAPI?.updateShed(id, updates);
    setSheds(prev => prev.map(shed => shed.id === id ? updatedShed : shed));
    return updatedShed;
  };

  const deleteShed = async (id: string) => {
    await window.electronAPI?.deleteShed(id);
    setSheds(prev => prev.filter(shed => shed.id !== id));
    return true;
  };

  const addPartition = async (partition: Partition) => {
    const newPartition = await window.electronAPI?.addPartition(partition);
    const shedId = partition.shedId;
    setSheds(prev => prev.map(shed => {
      if (shed.id === shedId) {
        return {
          ...shed,
          partitions: [...(shed.partitions || []), newPartition]
        };
      }
      return shed;
    }));
    return newPartition;
  };

  const updatePartition = async (id: string, updates: Partial<Partition>) => {
    const updatedPartition = await window.electronAPI?.updatePartition(id, updates);
    setSheds(prev => prev.map(shed => {
      if (shed.partitions?.some(p => p.id === id)) {
        return {
          ...shed,
          partitions: shed.partitions.map(p => p.id === id ? updatedPartition : p)
        };
      }
      return shed;
    }));
    return updatedPartition;
  };

  const addPasture = async (pasture: Omit<Pasture, 'id' | 'createdAt'>) => {
    const newPasture = await window.electronAPI?.addPasture(pasture);
    setPastures(prev => [...prev, newPasture]);
    return newPasture;
  };

  const updatePasture = async (id: string, updates: Partial<Pasture>) => {
    const updatedPasture = await window.electronAPI?.updatePasture(id, updates);
    setPastures(prev => prev.map(p => p.id === id ? updatedPasture : p));
    return updatedPasture;
  };

  const deletePasture = async (id: string) => {
    await window.electronAPI?.deletePasture(id);
    setPastures(prev => prev.filter(p => p.id !== id));
    return true;
  };
  
  const addGrazingLog = async (log: GrazingLog) => {
    const newLog = await window.electronAPI?.addGrazingLog(log);
    // Assuming grazing logs are not stored in this context, just sent to backend
    return newLog;
  };

  const addPastureHealthLog = async (log: PastureHealthLog) => {
    const newLog = await window.electronAPI?.addPastureHealthLog(log);
    setPastureHealthLogs(prev => [...prev, newLog]);
    return newLog;
  };

  const addRotationPlan = async (plan: RotationPlan) => {
    const newPlan = await window.electronAPI?.addRotationPlan(plan);
    setRotationPlans(prev => [...prev, newPlan]);
    return newPlan;
  };

  const updateRotationPlan = async (id: string, updates: Partial<RotationPlan>) => {
    const updatedPlan = await window.electronAPI?.updateRotationPlan(id, updates);
    setRotationPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
    return updatedPlan;
  };

  const value = {
    sheds,
    pastures,
    pastureHealthLogs,
    rotationPlans,
    loading,
    error,
    addShed,
    updateShed,
    deleteShed,
    addPartition,
    updatePartition,
    addPasture,
    updatePasture,
    deletePasture,
    addGrazingLog,
    addPastureHealthLog,
    addRotationPlan,
    updateRotationPlan,
    refresh: loadData,
  };

  return (
    <FacilitiesContext.Provider value={value}>
      {children}
    </FacilitiesContext.Provider>
  );
}

export function useFacilities() {
  const context = useContext(FacilitiesContext);
  if (context === undefined) {
    throw new Error('useFacilities must be used within a FacilitiesProvider');
  }
  return context;
}
