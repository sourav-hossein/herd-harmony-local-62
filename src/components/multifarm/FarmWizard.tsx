/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Palette, User, FileText, Fence, Download, Upload } from 'lucide-react';
import { FarmMeta } from '@/types/farm';
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface FarmWizardProps {
  onSubmit: (farm: Omit<FarmMeta, 'id' | 'createdAt'>) => void;
}

interface MapData {
  center: [number, number];
  zoom: number;
  bounds?: L.LatLngBounds;
  boundary: number[][];
  screenshot?: string;
  tileUrls?: string[];
}

export default function FarmWizard({ onSubmit }: FarmWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FarmMeta>>({
    name: '',
    description: '',
    ownerName: '',
    farmType: 'mixed',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    color: 'blue',
    location: undefined,
    farmBoundary: [],
    mapScreenshot: '',
    settings: {
      autoBackup: true,
      backupInterval: 30,
      maxBackups: 10,
    },
  });

  const [mapData, setMapData] = useState<MapData>({
    center: [23.76, 90.38],
    zoom: 13,
    boundary: [],
    tileUrls: []
  });

  const [isCapturingMap, setIsCapturingMap] = useState(false);
  const [downloadingTiles, setDownloadingTiles] = useState(false);
  const mapRef = useRef<L.Map>(null);
  const tileLayerRef = useRef<L.TileLayer>(null);

  // --- Map Boundary ---
  const handleBoundaryCreated = (e: any) => {
    const polygon = e.layer
      .getLatLngs()[0]
      .map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);

    setFormData((prev) => ({ ...prev, farmBoundary: polygon }));
    setMapData((prev) => ({ ...prev, boundary: polygon }));

    // Update map bounds based on boundary
    if (mapRef.current) {
      const bounds = L.latLngBounds(polygon as L.LatLngExpression[]);
      setMapData((prev) => ({
        ...prev,
        bounds: bounds,
        center: [bounds.getCenter().lat, bounds.getCenter().lng]
      }));
    }
  };

  const handleMapMove = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      setMapData((prev) => ({
        ...prev,
        center: [center.lat, center.lng],
        zoom
      }));
    }
  };

  const handleScreenshot = async () => {
    if (!mapRef.current) return;

    try {
      setIsCapturingMap(true);

      // Wait for map to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mapContainer = mapRef.current.getContainer();
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f0f0f0'
      });

      const dataUrl = canvas.toDataURL('image/png');
      setFormData((prev) => ({ ...prev, mapScreenshot: dataUrl }));
      setMapData((prev) => ({ ...prev, screenshot: dataUrl }));

    } catch (error) {
      console.error('Error capturing map screenshot:', error);
    } finally {
      setIsCapturingMap(false);
    }
  };

  const downloadTilesForOffline = async () => {
    if (!mapRef.current || !formData.farmBoundary?.length) {
      alert('Please draw a farm boundary first');
      return;
    }

    try {
      setDownloadingTiles(true);
      const map = mapRef.current;
      const bounds = L.latLngBounds(formData.farmBoundary as L.LatLngExpression[]);

      // Expand bounds slightly for better coverage
      const expandedBounds = bounds.pad(0.1);

      const minZoom = Math.max(10, map.getZoom() - 2);
      const maxZoom = Math.min(18, map.getZoom() + 2);

      const tileUrls: string[] = [];

      for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
        const min = map.project(expandedBounds.getSouthWest(), zoom).divideBy(256).floor();
        const max = map.project(expandedBounds.getNorthEast(), zoom).divideBy(256).floor();

        for (let x = min.x; x <= max.x; x++) {
          for (let y = min.y; y <= max.y; y++) {
            const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
            tileUrls.push(tileUrl);
          }
        }
      }

      setMapData(prev => ({ ...prev, tileUrls }));

      // In a real implementation, you'd download these tiles to local storage
      console.log(`Would download ${tileUrls.length} tiles for offline use`);

    } catch (error) {
      console.error('Error downloading tiles:', error);
    } finally {
      setDownloadingTiles(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name) return;

    const finalFormData = {
      ...formData,
      mapData: {
        ...mapData,
        bounds: mapData.bounds ? {
          north: mapData.bounds.getNorth(),
          south: mapData.bounds.getSouth(),
          east: mapData.bounds.getEast(),
          west: mapData.bounds.getWest()
        } : undefined
      }
    };

    onSubmit({
      name: formData.name!,
      description: formData.description!,
      ownerName: formData.ownerName!,
      farmType: formData.farmType as any,
      currency: formData.currency!,
      timezone: formData.timezone!,
      color: formData.color!,
      location: formData.location,
      farmBoundary: formData.farmBoundary,
      mapScreenshot: formData.mapScreenshot,
      settings: formData.settings!,
      passcodeEnabled: false,
      mapData: finalFormData.mapData,
    } as any);
  };

  const colors = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
  ];

  const farmTypes = [
    { label: 'Dairy', value: 'dairy', description: 'Focus on milk production' },
    { label: 'Meat', value: 'meat', description: 'Focus on meat production' },
    { label: 'Mixed', value: 'mixed', description: 'Both dairy and meat' },
    { label: 'Breeding', value: 'breeding', description: 'Focus on breeding and genetics' },
  ];

  const renderStep = () => {
    switch (step) {
      case 1: // Basic Info
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <p className="text-sm text-muted-foreground">Tell us about your farm</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name *</Label>
              <Input
                id="farmName"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sunny Meadows Farm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, ownerName: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmType">Farm Type</Label>
              <Select
                value={formData.farmType}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, farmType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {farmTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of your farm..."
                rows={3}
              />
            </div>
          </div>
        );

      case 2: // Location & Boundary
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-semibold">Location & Boundary</h3>
              <p className="text-sm text-muted-foreground">
                Configure your farm location and draw its boundary for offline maps
              </p>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.location?.lat || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        lat: parseFloat(e.target.value) || 0,
                        lon: prev.location?.lon || 0,
                      },
                    }))
                  }
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.location?.lon || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        lat: prev.location?.lat || 0,
                        lon: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address/Location Label</Label>
              <Input
                id="address"
                value={formData.location?.label || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      lat: prev.location?.lat || 0,
                      lon: prev.location?.lon || 0,
                      label: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., New York, NY"
              />
            </div>

            {/* Boundary Map */}
            <div className="space-y-2">
              <Label>Farm Boundary & Offline Map Setup</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Draw your farm boundary to enable offline map features for pasture management
              </div>
              <div style={{ height: '400px', width: '100%' }} id="wizard-map-container">
                <MapContainer
                  ref={mapRef}
                  center={mapData.center}
                  zoom={mapData.zoom}
                  style={{ height: '100%', width: '100%' }}
                  whenReady={handleMapMove}
                  onMoveEnd={handleMapMove}
                  onZoomEnd={handleMapMove}
                >
                  <TileLayer
                    ref={tileLayerRef}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <FeatureGroup>
                    <EditControl
                      position="topright"
                      onCreated={handleBoundaryCreated}
                      draw={{
                        polygon: true,
                        polyline: false,
                        rectangle: false,
                        circle: false,
                        marker: false,
                        circlemarker: false,
                      }}
                      edit={{ edit: false, remove: false }}
                    />
                    {formData.farmBoundary && formData.farmBoundary.length > 0 && (
                      <Polygon
                        positions={formData.farmBoundary as L.LatLngExpression[]}
                        fillColor={formData.color || 'blue'}
                        fillOpacity={0.3}
                        color={formData.color || 'blue'}
                        weight={2}
                      />
                    )}
                  </FeatureGroup>
                </MapContainer>
              </div>

              {/* Map Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleScreenshot}
                  disabled={isCapturingMap}
                >
                  {isCapturingMap ? 'Capturing...' : 'Save Map Screenshot'}
                </Button>

                <Button
                  variant="outline"
                  onClick={downloadTilesForOffline}
                  disabled={downloadingTiles || !formData.farmBoundary?.length}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingTiles ? 'Preparing Offline Maps...' : 'Prepare Offline Maps'}
                </Button>
              </div>

              {formData.farmBoundary && formData.farmBoundary.length > 0 && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✓ Farm boundary set. This will enable offline pasture selection and management.
                </div>
              )}
            </div>

            {/* Currency & Timezone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="BDT">BDT (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  placeholder="Auto-detected"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Personalization
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Palette className="w-12 h-12 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-semibold">Personalization</h3>
              <p className="text-sm text-muted-foreground">Choose your farm's theme color</p>
            </div>

            <div className="space-y-2">
              <Label>Farm Color Theme</Label>
              <div className="grid grid-cols-5 gap-3">
                {colors.map((color) => (
                  <Card
                    key={color.value}
                    className={`cursor-pointer transition-all border-2 ${formData.color === color.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-muted hover:border-primary/50'
                      }`}
                    onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-8 h-8 rounded-full ${color.class} mx-auto mb-2`} />
                      <p className="text-xs font-medium">{color.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {formData.mapScreenshot && (
              <div className="space-y-2">
                <Label>Map Preview</Label>
                <div className="border rounded-lg p-2">
                  <img
                    src={formData.mapScreenshot}
                    alt="Farm map preview"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Settings & Backup
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-semibold">Settings & Backup</h3>
              <p className="text-sm text-muted-foreground">Configure backup and security settings</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackup">Auto Backup</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically backup your data at regular intervals
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="autoBackup"
                  checked={formData.settings?.autoBackup || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        autoBackup: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>

              {formData.settings?.autoBackup && (
                <div className="space-y-2 ml-4">
                  <Label htmlFor="backupInterval">Backup Interval (minutes)</Label>
                  <Input
                    id="backupInterval"
                    type="number"
                    value={formData.settings?.backupInterval || 30}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          backupInterval: parseInt(e.target.value) || 30,
                        },
                      }))
                    }
                    min="5"
                    max="1440"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="maxBackups">Max Backup Files</Label>
                <Input
                  id="maxBackups"
                  type="number"
                  value={formData.settings?.maxBackups || 10}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        maxBackups: parseInt(e.target.value) || 10,
                      },
                    }))
                  }
                  min="1"
                  max="50"
                />
              </div>
            </div>
          </div>
        );

      case 5: // Summary
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Fence className="w-12 h-12 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-semibold">Review & Create</h3>
              <p className="text-sm text-muted-foreground">Review your farm details before creating</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Farm Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {formData.name}</p>
                      <p><strong>Owner:</strong> {formData.ownerName || 'Not specified'}</p>
                      <p><strong>Type:</strong> {farmTypes.find(t => t.value === formData.farmType)?.label}</p>
                      <p><strong>Currency:</strong> {formData.currency}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Location & Map</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Location:</strong> {formData.location?.label || 'Not specified'}</p>
                      <p><strong>Boundary:</strong> {formData.farmBoundary?.length ? 'Set' : 'Not set'}</p>
                      <p><strong>Map Screenshot:</strong> {formData.mapScreenshot ? 'Captured' : 'Not captured'}</p>
                      <p><strong>Offline Maps:</strong> {mapData.tileUrls?.length ? `${mapData.tileUrls.length} tiles prepared` : 'Not prepared'}</p>
                    </div>
                  </div>
                </div>

                {formData.description && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{formData.description}</p>
                  </div>
                )}

                {formData.mapScreenshot && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Map Preview</h4>
                    <img
                      src={formData.mapScreenshot}
                      alt="Farm map"
                      className="w-full h-40 object-cover rounded border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.name.trim().length > 0;
      case 2:
        return true; // Location is optional
      case 3:
        return formData.color;
      case 4:
        return true; // Settings have defaults
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create New Farm</h2>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div key={stepNum} className="contents">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= stepNum
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }`}
              >
                {stepNum}
              </div>
              {stepNum < 5 && <div className="w-4 h-px bg-muted" />}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Previous
        </Button>

        {step < 5 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed()}
            className="bg-primary hover:bg-primary/90"
          >
            Create Farm
          </Button>
        )}
      </div>
    </div>
  );
}