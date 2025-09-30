import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Users, BarChart } from 'lucide-react';
import * as turf from '@turf/turf';
import { useFarm } from '@/context/FarmContext';
import type { Pasture } from '@/types/farm';
import 'leaflet/dist/leaflet.css';

// Helper to generate ID
function generateId() {
  return `pasture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Map click handler component
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PastureMap() {
  const { farmData } = useFarm();
  const [isCreating, setIsCreating] = useState(false);
  const [newPasture, setNewPasture] = useState({
    name: '',
    center: { lat: 0, lon: 0 },
    radiusMeters: 100,
  });

  const pastures = ((farmData as any)?.pastures || []) as Pasture[];
  const goats = (farmData as any)?.goats || [];
  const farmLocation = farmData?.metadata?.location;

  // Default map center
  const defaultCenter = farmLocation 
    ? [farmLocation.lat, farmLocation.lon] as [number, number]
    : [40.7128, -74.0060] as [number, number];

  const handleMapClick = (lat: number, lng: number) => {
    if (isCreating) {
      setNewPasture(prev => ({
        ...prev,
        center: { lat, lon: lng }
      }));
    }
  };

  const calculatePastureArea = (radiusMeters: number) => {
    const circle = turf.circle([0, 0], radiusMeters / 1000, { units: 'kilometers' });
    const area = turf.area(circle);
    return {
      hectares: area / 10000,
      acres: area * 0.000247105,
    };
  };

  const estimateCarryingCapacity = (radiusMeters: number) => {
    const area = calculatePastureArea(radiusMeters);
    // Rough estimate: 1 goat per 0.1 hectares (varies by forage quality)
    return Math.floor(area.hectares / 0.1);
  };

  const handleCreatePasture = async () => {
    if (!newPasture.name.trim() || !newPasture.center.lat) return;

    // Convert circle to polygon approximation
    const polygonPoints: number[][] = [];
    const numPoints = 32;
    const center = newPasture.center;
    const radius = newPasture.radiusMeters;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const latOffset = (radius / 111320) * Math.cos(angle);
      const lngOffset = (radius / (111320 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
      polygonPoints.push([center.lat + latOffset, center.lon + lngOffset]);
    }

    const pasture: Pasture = {
      id: generateId(),
      farmId: farmData?.metadata?.id || '',
      name: newPasture.name.trim(),
      polygon: polygonPoints,
      center: [center.lat, center.lon],
      radiusMeters: radius,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: Save pasture to database
    console.log('Creating pasture:', pasture);

    // Reset form
    setNewPasture({
      name: '',
      center: { lat: 0, lon: 0 },
      radiusMeters: 100,
    });
    setIsCreating(false);
  };

  const getGoatsInPasture = (pastureId: string) => {
    return goats.filter((g: any) => g.pastureId === pastureId);
  };

  return (
    <div className="space-y-6">
      {/* Map View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Pasture Map
            </CardTitle>
            <Button
              onClick={() => setIsCreating(!isCreating)}
              variant={isCreating ? "destructive" : "default"}
            >
              {isCreating ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" />Add Pasture</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isCreating && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <h4 className="font-semibold">Create New Pasture</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pasture-name">Pasture Name</Label>
                  <Input
                    id="pasture-name"
                    value={newPasture.name}
                    onChange={(e) => setNewPasture(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., North Field"
                  />
                </div>
                <div>
                  <Label htmlFor="pasture-radius">Radius (meters)</Label>
                  <Input
                    id="pasture-radius"
                    type="number"
                    value={newPasture.radiusMeters}
                    onChange={(e) => setNewPasture(prev => ({ ...prev, radiusMeters: parseInt(e.target.value) || 100 }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreatePasture}
                    disabled={!newPasture.name.trim() || !newPasture.center.lat}
                    className="w-full"
                  >
                    Create Pasture
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {newPasture.center.lat ? 
                  `Selected location: ${newPasture.center.lat.toFixed(5)}, ${newPasture.center.lon.toFixed(5)}` :
                  'Click on the map to select a location'}
              </p>
            </div>
          )}

          <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {isCreating && <MapClickHandler onClick={handleMapClick} />}

              {/* New pasture preview */}
              {isCreating && newPasture.center.lat !== 0 && (
                <Circle
                  center={[newPasture.center.lat, newPasture.center.lon]}
                  radius={newPasture.radiusMeters}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.3,
                    weight: 2,
                    dashArray: '5, 5',
                  }}
                />
              )}

              {/* Existing pastures */}
              {pastures.map(pasture => {
                const pastureGoats = getGoatsInPasture(pasture.id);
                const centerCoords = pasture.center || [0, 0];
                const radius = pasture.radiusMeters || 100;
                
                return (
                  <Circle
                    key={pasture.id}
                    center={centerCoords}
                    radius={radius}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="space-y-2">
                        <h4 className="font-semibold">{pasture.name}</h4>
                        <div className="text-sm space-y-1">
                          {pasture.radiusMeters && (
                            <>
                              <div>Area: {calculatePastureArea(pasture.radiusMeters).hectares.toFixed(2)} ha</div>
                              <div>Capacity: ~{estimateCarryingCapacity(pasture.radiusMeters)} goats</div>
                            </>
                          )}
                          <div>Current: {pastureGoats.length} goats</div>
                          {pastureGoats.length > 0 && (
                            <div>
                              {pastureGoats.map((goat: any) => (
                                <div key={goat.id} className="text-xs">
                                  • {goat.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pasture Analytics */}
      {pastures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Pasture Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold">{pastures.length}</div>
                <div className="text-sm text-muted-foreground">Total Pastures</div>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {pastures.reduce((sum, p) => {
                    const radius = p.radiusMeters || 0;
                    return sum + calculatePastureArea(radius).hectares;
                  }, 0).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Total Area (ha)</div>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {pastures.reduce((sum, p) => sum + getGoatsInPasture(p.id).length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Animals Grazing</div>
              </div>
              
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold">
                  {pastures.reduce((sum, p) => {
                    const radius = p.radiusMeters || 0;
                    return sum + estimateCarryingCapacity(radius);
                  }, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Capacity</div>
              </div>
            </div>

            {/* Utilization Overview */}
            <div className="mt-6">
              <h4 className="font-semibold mb-4">Pasture Utilization</h4>
              <div className="space-y-3">
                {pastures.map(pasture => {
                  const currentGoats = getGoatsInPasture(pasture.id).length;
                  const radius = pasture.radiusMeters || 0;
                  const capacity = estimateCarryingCapacity(radius);
                  const utilization = capacity > 0 ? (currentGoats / capacity) * 100 : 0;
                  
                  return (
                    <div key={pasture.id} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{pasture.name}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 relative">
                        <div 
                          className={`h-2 rounded-full ${
                            utilization > 100 ? 'bg-red-500' : 
                            utilization > 80 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground w-20">
                        {currentGoats}/{capacity} ({utilization.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
