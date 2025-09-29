/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FarmMeta } from '@/types/farm';

export interface MapData {
  center: [number, number];
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  boundary: number[][];
  screenshot?: string;
  tileUrls?: string[];
  savedAt?: string;
  pastures?: { [pastureId: string]: any };
}

export interface FarmData {
  metadata: FarmMeta | null;
  mapData?: MapData | null;
}

interface FarmContextType {
  activeFarmId: string | null;
  farmData: FarmData | null;
  farms: FarmMeta[];
  setActiveFarm: (farmId: string) => Promise<void>;
  updateFarmData: (updates: Partial<FarmData>) => Promise<void>;
  createFarm: (farm: Omit<FarmMeta, 'id' | 'createdAt'> & { mapData?: MapData }) => Promise<FarmMeta>;
  deleteFarm: (farmId: string) => Promise<void>;
  refreshFarms: () => Promise<void>;
  
  // Map-related functions
  getFarmMapData: (farmId?: string) => Promise<MapData | null>;
  saveFarmMapData: (mapData: MapData, farmId?: string) => Promise<boolean>;
  savePastureMapData: (pastureId: string, mapData: any, farmId?: string) => Promise<boolean>;
  getPastureMapData: (pastureId: string, farmId?: string) => Promise<any>;
  
  // Offline capabilities
  isMapAvailable: boolean;
  downloadMapTiles: (bounds: any, farmId?: string) => Promise<boolean>;
  
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
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [farms, setFarms] = useState<FarmMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapAvailable, setIsMapAvailable] = useState(false);

  const refreshFarms = async () => {
    try {
      setIsLoading(true);
      const farmList = await window.electronAPI!.listFarms();
      console.log("Farm List:", farmList);
      setFarms(farmList);
    } catch (error) {
      console.error('Failed to load farms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllFarmData = async (farmId: string, farmList: FarmMeta[]) => {
    try {
      const farmMeta = farmList.find(f => f.id === farmId) || null;
      let mapData: MapData | null = null;
      
      // Load map data if available
      try {
        mapData = await window.electronAPI!.getFarmMapData(farmId);
        setIsMapAvailable(!!mapData);
      } catch (error) {
        console.warn('Map data not available for farm:', farmId);
        setIsMapAvailable(false);
      }

      setFarmData({ 
        metadata: farmMeta,
        mapData 
      });
    } catch (error) {
      console.error('Failed to load all farm data:', error);
    }
  };

  const setActiveFarm = async (farmId: string, farmList?: FarmMeta[]) => {
    const currentFarms = farmList || farms;
    try {
      setIsLoading(true);
      await window.electronAPI!.setActiveFarmId(farmId);
      await window.electronAPI!.initializeFarmServices(farmId);
      setActiveFarmId(farmId);
      await loadAllFarmData(farmId, currentFarms);
      
      const updatedFarms = currentFarms.map(farm => 
        farm.id === farmId 
          ? { ...farm, lastOpenedAt: new Date().toISOString() }
          : farm
      );
      // setFarms(updatedFarms);
      
      const farmMeta = updatedFarms.find(f => f.id === farmId);
      if (farmMeta) {
        await window.electronAPI!.updateFarm(farmId, { lastOpenedAt: farmMeta.lastOpenedAt });
      }
    } catch (error) {
      console.error('Failed to set active farm:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFarmData = async (updates: Partial<FarmData>) => {
    if (!farmData || !activeFarmId) return;
    
    // Update local state immediately
    const updatedData = { ...farmData, ...updates };
    setFarmData(updatedData);
    
    // Save map data if it was updated
    if (updates.mapData) {
      await saveFarmMapData(updates.mapData, activeFarmId);
    }
    
    // Update farm metadata if changed
    if (updates.metadata) {
      await window.electronAPI!.updateFarm(activeFarmId, updates.metadata);
    }
  };

  const createFarm = async (farmInput: Omit<FarmMeta, 'id' | 'createdAt'> & { mapData?: MapData }): Promise<FarmMeta> => {
    try {
      const { mapData, ...farmMeta } = farmInput;
      const newFarm = await window.electronAPI!.createFarm(farmMeta);
      
      // Save map data if provided
      if (mapData) {
        await window.electronAPI!.saveFarmMapData(newFarm.id, mapData);
      }
      
      await refreshFarms();
      return newFarm;
    } catch (error) {
      console.error('Failed to create farm:', error);
      throw error;
    }
  };

  const deleteFarm = async (farmId: string) => {
    try {
      await window.electronAPI!.deleteFarm(farmId);
      if (activeFarmId === farmId) {
        setActiveFarmId(null);
        setFarmData(null);
        setIsMapAvailable(false);
      }
      await refreshFarms();
    } catch (error) {
      console.error('Failed to delete farm:', error);
      throw error;
    }
  };

  // Map-related functions
  const getFarmMapData = async (farmId?: string): Promise<MapData | null> => {
    try {
      const targetFarmId = farmId || activeFarmId;
      if (!targetFarmId) return null;
      
      return await window.electronAPI!.getFarmMapData(targetFarmId);
    } catch (error) {
      console.error('Failed to get farm map data:', error);
      return null;
    }
  };

  const saveFarmMapData = async (mapData: MapData, farmId?: string): Promise<boolean> => {
    try {
      const targetFarmId = farmId || activeFarmId;
      if (!targetFarmId) return false;
      
      const success = await window.electronAPI!.saveFarmMapData(targetFarmId, mapData);
      if (success && targetFarmId === activeFarmId) {
        setFarmData(prev => prev ? { ...prev, mapData } : null);
        setIsMapAvailable(true);
      }
      return success;
    } catch (error) {
      console.error('Failed to save farm map data:', error);
      return false;
    }
  };

  const savePastureMapData = async (pastureId: string, mapData: any, farmId?: string): Promise<boolean> => {
    try {
      const targetFarmId = farmId || activeFarmId;
      if (!targetFarmId) return false;
      
      return await window.electronAPI!.savePastureMapData(targetFarmId, pastureId, mapData);
    } catch (error) {
      console.error('Failed to save pasture map data:', error);
      return false;
    }
  };

  const getPastureMapData = async (pastureId: string, farmId?: string): Promise<any> => {
    try {
      const targetFarmId = farmId || activeFarmId;
      if (!targetFarmId) return null;
      
      return await window.electronAPI!.getPastureMapData(targetFarmId, pastureId);
    } catch (error) {
      console.error('Failed to get pasture map data:', error);
      return null;
    }
  };

  const downloadMapTiles = async (bounds: any, farmId?: string): Promise<boolean> => {
    try {
      const targetFarmId = farmId || activeFarmId;
      if (!targetFarmId) return false;
      
      // This would implement actual tile downloading logic
      console.log('Downloading map tiles for bounds:', bounds);
      
      // For now, just return true as a placeholder
      return true;
    } catch (error) {
      console.error('Failed to download map tiles:', error);
      return false;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const farmList = await window.electronAPI!.listFarms();
        setFarms(farmList);
        const activeId = await window.electronAPI!.getActiveFarmId();
        if (activeId) {
          await window.electronAPI!.initializeFarmServices(activeId);
          setActiveFarmId(activeId);
          await loadAllFarmData(activeId, farmList);
        }
      } catch (error) {
        console.error('Failed to initialize farm context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Update map availability when farm data changes
  useEffect(() => {
    setIsMapAvailable(!!(farmData?.mapData));
  }, [farmData?.mapData]);

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
        
        // Map functions
        getFarmMapData,
        saveFarmMapData,
        savePastureMapData,
        getPastureMapData,
        
        // Offline capabilities
        isMapAvailable,
        downloadMapTiles,
        
        isLoading,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}