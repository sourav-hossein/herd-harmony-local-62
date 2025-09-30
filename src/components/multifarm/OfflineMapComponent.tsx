import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFarm } from '@/context/FarmContext';
import { MapPin, Wifi, WifiOff, Download, Eye, Edit3 } from 'lucide-react';

interface OfflineMapProps {
  onPastureCreated?: (pastureData: any) => void;
  onPastureSelected?: (pastureId: string) => void;
  selectedPastureId?: string;
  pastures?: any[];
  mode?: 'view' | 'edit' | 'select';
  height?: string;
}

export default function OfflineMapComponent({
  onPastureCreated,
  onPastureSelected,
  selectedPastureId,
  pastures = [],
  mode = 'view',
  height = '500px'
}: OfflineMapProps) {
  const { farmData, isMapAvailable, getFarmMapData, savePastureMapData } = useFarm();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mapData, setMapData] = useState(farmData?.mapData);
  const [selectedPasture, setSelectedPasture] = useState<string | null>(selectedPastureId || null);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setMapData(farmData?.mapData);
  }, [farmData?.mapData]);

  useEffect(() => {
    setSelectedPasture(selectedPastureId || null);
  }, [selectedPastureId]);

  const handlePastureCreated = async (e: any) => {
    if (!onPastureCreated) return;

    const polygon = e.layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
    
    const pastureData = {
      polygon,
      bounds: e.layer.getBounds(),
      area: L.GeometryUtil?.geodesicArea ? L.GeometryUtil.geodesicArea(e.layer.getLatLngs()[0]) : 0,
      createdAt: new Date().toISOString()
    };

    onPastureCreated(pastureData);
  };

  const handlePastureClick = (pastureId: string) => {
    if (mode === 'select' && onPastureSelected) {
      setSelectedPasture(pastureId);
      onPastureSelected(pastureId);
    }
  };

  const renderPastures = () => {
    return pastures.map((pasture) => (
      <Polygon
        key={pasture.id}
        positions={pasture.polygon as L.LatLngExpression[]}
        pathOptions={{
          color: selectedPasture === pasture.id ? '#10b981' : '#3b82f6',
          fillColor: selectedPasture === pasture.id ? '#10b981' : '#3b82f6',
          fillOpacity: selectedPasture === pasture.id ? 0.5 : 0.3,
          weight: selectedPasture === pasture.id ? 3 : 2,
        }}
        eventHandlers={{
          click: () => handlePastureClick(pasture.id),
        }}
      >
        {/* You can add popups or tooltips here */}
      </Polygon>
    ));
  };

  const getMapCenter = (): [number, number] => {
    if (mapData?.center) {
      return mapData.center;
    }
    if (farmData?.metadata?.location) {
      return [farmData.metadata.location.lat, farmData.metadata.location.lon];
    }
    return [23.76, 90.38]; // Default center (Dhaka)
  };

  const getMapZoom = (): number => {
    return mapData?.zoom || 13;
  };

  if (!isMapAvailable && !isOnline) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <WifiOff className="w-16 h-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold">Offline Map Not Available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connect to the internet to view the map or set up offline maps in farm settings.
            </p>
          </div>
          <Badge variant="secondary">
            <WifiOff className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          
          {isMapAvailable && (
            <Badge variant="outline">
              <MapPin className="w-3 h-3 mr-1" />
              Offline Map Ready
            </Badge>
          )}

          {mode === 'edit' && (
            <Badge variant="outline">
              <Edit3 className="w-3 h-3 mr-1" />
              Edit Mode
            </Badge>
          )}

          {mode === 'select' && (
            <Badge variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              Select Mode
            </Badge>
          )}
        </div>

        {farmData?.metadata?.name && (
          <div className="text-sm text-muted-foreground">
            {farmData.metadata.name}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
        <MapContainer
          ref={mapRef}
          center={getMapCenter()}
          zoom={getMapZoom()}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => {
            // Fit to farm boundary if available
            if (mapRef.current && farmData?.metadata?.farmBoundary && farmData.metadata.farmBoundary.length > 0) {
              const bounds = L.latLngBounds(farmData.metadata.farmBoundary as L.LatLngExpression[]);
              mapRef.current.fitBounds(bounds, { padding: [20, 20] });
            }
          }}
        >
          {/* Tile Layer - fallback to offline if available */}
          {isOnline ? (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          ) : (
            // In a real implementation, this would load cached tiles
            <TileLayer
              url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              attribution="Offline Map"
            />
          )}

          {/* Farm Boundary */}
          {farmData?.metadata?.farmBoundary && farmData.metadata.farmBoundary.length > 0 && (
            <Polygon
              positions={farmData.metadata.farmBoundary as L.LatLngExpression[]}
              pathOptions={{
                color: farmData.metadata.color || 'blue',
                fillColor: farmData.metadata.color || 'blue',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}

          {/* Pastures */}
          {renderPastures()}

          {/* Edit Controls for pasture creation */}
          {mode === 'edit' && (
            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={handlePastureCreated}
                draw={{
                  polygon: {
                    allowIntersection: false,
                    drawError: {
                      color: '#e1e100',
                      message: '<strong>Error:</strong> Pasture boundaries cannot intersect!'
                    },
                    shapeOptions: {
                      color: '#10b981',
                      fillOpacity: 0.3
                    }
                  },
                  polyline: false,
                  rectangle: false,
                  circle: false,
                  marker: false,
                  circlemarker: false,
                }}
                edit={{
                  edit: false,
                  remove: false
                }}
              />
            </FeatureGroup>
          )}
        </MapContainer>
      </div>

      {/* Map Info */}
      {farmData?.mapData && (
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>
            Map saved: {new Date(farmData.mapData.savedAt || '').toLocaleDateString()}
          </span>
          <span>
            Boundary points: {farmData.metadata?.farmBoundary?.length || 0}
          </span>
        </div>
      )}

      {/* Instructions */}
      {mode === 'edit' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <strong>Tip:</strong> Use the polygon tool to draw new pasture boundaries. 
          The map will work offline once you've set up your farm boundary.
        </div>
      )}

      {mode === 'select' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          <strong>Select Mode:</strong> Click on any pasture to select it for management tasks.
        </div>
      )}
    </div>
  );
}