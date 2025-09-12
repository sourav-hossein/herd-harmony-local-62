import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Target,
  Calculator,
  Users,
  Activity,
  RotateCcw,
  Zap
} from 'lucide-react';
import { Pasture } from '@/types/farm';
import { useFarm } from '@/context/FarmContext';
import { grazingService } from '@/services/grazingService';
import PastureHealthTracker from './PastureHealthTracker';
import RotationPlanner from './RotationPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  className: 'custom-div-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ClickHandler {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: ClickHandler) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PastureMap() {
  const { farmData, updateFarmData } = useFarm();
  const [isCreating, setIsCreating] = useState(false);
  const [newPasture, setNewPasture] = useState({
    name: '',
    center: { lat: 0, lon: 0 },
    radiusMeters: 100,
  });

  const pastures = farmData?.pastures || [];
  const goats = farmData?.goats || [];
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

    const pasture: Pasture = {
      id: `pasture_${Date.now()}`,
      farmId: farmData?.metadata?.id || '',
      name: newPasture.name.trim(),
      center: newPasture.center,
      radiusMeters: newPasture.radiusMeters,
      createdAt: new Date().toISOString(),
    };

    await updateFarmData({
      pastures: [...pastures, pasture],
    });

    setNewPasture({
      name: '',
      center: { lat: 0, lon: 0 },
      radiusMeters: 100,
    });
    setIsCreating(false);
  };

  const handleDeletePasture = async (pastureId: string) => {
    if (!confirm('Are you sure you want to delete this pasture? Goats will be moved to unassigned.')) {
      return;
    }

    // Remove pasture assignments from goats
    const updatedGoats = goats.map(goat =>
      goat.pastureId === pastureId
        ? { ...goat, pastureId: undefined }
        : goat
    );

    const updatedPastures = pastures.filter(p => p.id !== pastureId);

    await updateFarmData({
      pastures: updatedPastures,
      goats: updatedGoats,
    });
  };

  const getGoatsInPasture = (pastureId: string) => {
    return goats.filter(goat => goat.pastureId === pastureId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pastures & Grazing Management</h2>
          <p className="text-muted-foreground">
            Comprehensive grazing management with mapping, health tracking, and rotation planning
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(!isCreating)}
          variant={isCreating ? 'destructive' : 'default'}
        >
          {isCreating ? 'Cancel' : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Pasture
            </>
          )}
        </Button>
      </div>

      {/* Tabs for different management views */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Map & Pastures
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health Tracking
          </TabsTrigger>
          <TabsTrigger value="rotation" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Rotation Planning
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">

      {/* Creation Panel */}
      {isCreating && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Create New Pasture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pasture-name">Pasture Name *</Label>
                <Input
                  id="pasture-name"
                  value={newPasture.name}
                  onChange={(e) => setNewPasture(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., North Field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="10"
                  max="1000"
                  value={newPasture.radiusMeters}
                  onChange={(e) => setNewPasture(prev => ({ 
                    ...prev, 
                    radiusMeters: parseInt(e.target.value) || 100 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Area & Capacity</Label>
                <div className="text-sm text-muted-foreground">
                  {calculatePastureArea(newPasture.radiusMeters).hectares.toFixed(2)} ha
                  <br />
                  ~{estimateCarryingCapacity(newPasture.radiusMeters)} goats
                </div>
              </div>
            </div>

            {newPasture.center.lat !== 0 && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                Selected: {newPasture.center.lat.toFixed(6)}, {newPasture.center.lon.toFixed(6)}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleCreatePasture}
                disabled={!newPasture.name.trim() || newPasture.center.lat === 0}
              >
                Create Pasture
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Click on the map to set the pasture center point
            </p>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: '500px', width: '100%' }}>
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Map click handler for creating pastures */}
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Existing pastures */}
              {pastures.map(pasture => {
                const pastureGoats = getGoatsInPasture(pasture.id);
                return (
                  <Circle
                    key={pasture.id}
                    center={[pasture.center.lat, pasture.center.lon]}
                    radius={pasture.radiusMeters}
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
                          <div>Area: {calculatePastureArea(pasture.radiusMeters).hectares.toFixed(2)} ha</div>
                          <div>Capacity: ~{estimateCarryingCapacity(pasture.radiusMeters)} goats</div>
                          <div>Current: {pastureGoats.length} goats</div>
                          {pastureGoats.length > 0 && (
                            <div>
                              {pastureGoats.map(goat => (
                                <div key={goat.id} className="text-xs">
                                  • {goat.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePasture(pasture.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* New pasture preview */}
              {isCreating && newPasture.center.lat !== 0 && (
                <Circle
                  center={[newPasture.center.lat, newPasture.center.lon]}
                  radius={newPasture.radiusMeters}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 5',
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <h4 className="font-semibold">New Pasture Preview</h4>
                      <div className="text-sm">
                        Area: {calculatePastureArea(newPasture.radiusMeters).hectares.toFixed(2)} ha
                      </div>
                    </div>
                  </Popup>
                </Circle>
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pastures List */}
      {pastures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pasture Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastures.map(pasture => {
                const pastureGoats = getGoatsInPasture(pasture.id);
                const area = calculatePastureArea(pasture.radiusMeters);
                const capacity = estimateCarryingCapacity(pasture.radiusMeters);
                
                return (
                  <div key={pasture.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">{pasture.name}</h4>
                      <Badge variant="secondary">
                        {pastureGoats.length} / {capacity}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center">
                        <Calculator className="w-3 h-3 mr-1" />
                        {area.hectares.toFixed(2)} ha ({area.acres.toFixed(2)} acres)
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {pastureGoats.length} goats assigned
                      </div>
                    </div>

                    {pastureGoats.length > 0 && (
                      <div className="text-xs space-y-1">
                        {pastureGoats.slice(0, 3).map(goat => (
                          <div key={goat.id}>• {goat.name}</div>
                        ))}
                        {pastureGoats.length > 3 && (
                          <div>+ {pastureGoats.length - 3} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="health">
          <PastureHealthTracker pastures={pastures} />
        </TabsContent>

        <TabsContent value="rotation">
          <RotationPlanner pastures={pastures} goats={goats} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Pasture Analytics Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Pasture Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold">{pastures.length}</div>
                  <div className="text-sm text-muted-foreground">Total Pastures</div>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold">
                    {pastures.reduce((sum, p) => sum + calculatePastureArea(p.radiusMeters).hectares, 0).toFixed(1)}
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
                    {pastures.reduce((sum, p) => sum + estimateCarryingCapacity(p.radiusMeters), 0)}
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
                    const capacity = estimateCarryingCapacity(pasture.radiusMeters);
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

              {/* Recommendations */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4">Smart Recommendations</h4>
                <div className="space-y-2">
                  {pastures.map(pasture => {
                    const currentGoats = getGoatsInPasture(pasture.id).length;
                    const capacity = estimateCarryingCapacity(pasture.radiusMeters);
                    const utilization = capacity > 0 ? currentGoats / capacity : 0;
                    
                    if (utilization > 1.2) {
                      return (
                        <div key={pasture.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="font-medium text-red-800">⚠️ {pasture.name} is overstocked</div>
                          <div className="text-sm text-red-600">
                            Move {Math.ceil(currentGoats - capacity)} goats to prevent overgrazing
                          </div>
                        </div>
                      );
                    } else if (utilization < 0.5 && currentGoats > 0) {
                      return (
                        <div key={pasture.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="font-medium text-blue-800">💡 {pasture.name} has extra capacity</div>
                          <div className="text-sm text-blue-600">
                            Can accommodate {Math.floor(capacity - currentGoats)} more goats
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                  
                  {pastures.every(p => {
                    const util = getGoatsInPasture(p.id).length / estimateCarryingCapacity(p.radiusMeters);
                    return util >= 0.5 && util <= 1.2;
                  }) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-800">✅ All pastures are well-balanced</div>
                      <div className="text-sm text-green-600">
                        Current stocking rates are within optimal range
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
