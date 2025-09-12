import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FarmMeta } from '@/types/farm';
import { Feed, Goat, HealthRecord } from '@/types/goat';
import { Shed, Pasture } from '@/types/farm';
import { FinanceRecord } from '@/types/finance';



interface FarmData {
  goats: Goat[];
  sheds: Shed[];
  pastures: Pasture[];
  finance: FinanceRecord[];
  health: HealthRecord[];
  feeds: Feed[];
  metadata: FarmMeta | null;
}

interface FarmContextType {
  activeFarmId: string | null;
  farmData: FarmData | null;
  farms: FarmMeta[];
  setActiveFarm: (farmId: string) => Promise<void>;
  updateFarmData: (updates: Partial<FarmData>) => Promise<void>; // This might need rethinking
  createFarm: (farm: Omit<FarmMeta, 'id' | 'createdAt'>) => Promise<FarmMeta>;
  deleteFarm: (farmId: string) => Promise<void>;
  refreshFarms: () => Promise<void>;
  isLoading: boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function useFarm() {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}

interface FarmProviderProps {
  children: ReactNode;
}

export function FarmProvider({ children }: FarmProviderProps) {
  const [activeFarmId, setActiveFarmId] = useState<string | null>(localStorage.getItem('activeFarmId')|| null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [farms, setFarms] = useState<FarmMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFarms = async () => {
    try {
      setIsLoading(true);
      const farmList = await window.electronAPI.listFarms();
      setFarms(farmList);
    } catch (error) {
      console.error('Failed to load farms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllFarmData = async (farmId: string) => {
    try {
      // This is a simplified example. You'd fetch all your data here.
      // For now, we just fetch goats as a placeholder for loading data.
      const goats = await window.electronAPI.getGoats();
      const farmMeta = farms.find(f => f.id === farmId) || null;
      
      // In a real scenario, you would fetch sheds, pastures, etc.
      setFarmData({
        goats,
        sheds: [], // await window.electronAPI.getSheds(),
        pastures: [], // await window.electronAPI.getPastures(),
        finance: [],
        health: [],
        feeds: [],
        metadata: farmMeta,
      });

    } catch (error) {
        console.error('Failed to load all farm data:', error);
        // Handle error appropriately
    }
  };

  const setActiveFarm = async (farmId: string) => {
    try {
      setIsLoading(true);
      await window.electronAPI.setActiveFarm(farmId);
      setActiveFarmId(farmId);
      localStorage.setItem('activeFarmId', farmId);
      await loadAllFarmData(farmId);
      
      // Update last opened timestamp locally for immediate UI feedback
      const updatedFarms = farms.map(farm => 
        farm.id === farmId 
          ? { ...farm, lastOpenedAt: new Date().toISOString() }
          : farm
      );
      setFarms(updatedFarms);
      
      // Persist the last opened time
      const farmMeta = updatedFarms.find(f => f.id === farmId);
      if (farmMeta) {
        await window.electronAPI.updateFarm(farmId, { lastOpenedAt: farmMeta.lastOpenedAt });
      }

    } catch (error) {
      console.error('Failed to set active farm:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFarmData = async (updates: Partial<FarmData>) => {
    // This function needs to be adapted. Instead of saving the whole blob,
    // you should now call specific update functions for each data type.
    // For example: window.electronAPI.updateGoat(goat.id, changes)
    console.warn('updateFarmData is not fully implemented for backend storage yet.');
    if (!farmData) return;
    setFarmData({ ...farmData, ...updates });
  };

  const createFarm = async (farmInput: Omit<FarmMeta, 'id' | 'createdAt'>): Promise<FarmMeta> => {
    try {
      const newFarm = await window.electronAPI.createFarm(farmInput);
      await refreshFarms();
      return newFarm;
    } catch (error) {
      console.error('Failed to create farm:', error);
      throw error;
    }
  };

  const deleteFarm = async (farmId: string) => {
    try {
      await window.electronAPI.deleteFarm(farmId);
      
      if (activeFarmId === farmId) {
        setActiveFarmId(null);
        localStorage.removeItem('activeFarmId');
        setFarmData(null);
      }
      
      await refreshFarms();
    } catch (error) {
      console.error('Failed to delete farm:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshFarms();
  }, []);

  return (
    <FarmContext.Provider
      value={{
        activeFarmId,
        farmData,
        farms,
        setActiveFarm,
        updateFarmData,
        createFarm,
        deleteFarm,
        refreshFarms,
        isLoading,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}
