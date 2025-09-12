import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Palette, User, FileText } from 'lucide-react';
import { FarmMeta } from '@/types/farm';

interface FarmWizardProps {
  onSubmit: (farm: Omit<FarmMeta, 'id' | 'createdAt'>) => void;
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
    settings: {
      autoBackup: true,
      backupInterval: 30,
      maxBackups: 10
    }
  });

  const colors = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' }
  ];

  const farmTypes = [
    { label: 'Dairy', value: 'dairy', description: 'Focus on milk production' },
    { label: 'Meat', value: 'meat', description: 'Focus on meat production' },
    { label: 'Mixed', value: 'mixed', description: 'Both dairy and meat' },
    { label: 'Breeding', value: 'breeding', description: 'Focus on breeding and genetics' }
  ];

  const handleSubmit = () => {
    if (!formData.name) return;
    
    onSubmit({
      name: formData.name,
      description: formData.description,
      ownerName: formData.ownerName,
      farmType: formData.farmType as any,
      currency: formData.currency,
      timezone: formData.timezone,
      color: formData.color,
      location: formData.location,
      settings: formData.settings,
      passcodeEnabled: false
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
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
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sunny Meadows Farm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmType">Farm Type</Label>
              <Select 
                value={formData.farmType} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, farmType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {farmTypes.map(type => (
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your farm..."
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-semibold">Location & Settings</h3>
              <p className="text-sm text-muted-foreground">Configure your farm location and preferences</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.location?.lat || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      lat: parseFloat(e.target.value) || 0,
                      lon: prev.location?.lon || 0
                    }
                  }))}
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      lat: prev.location?.lat || 0,
                      lon: parseFloat(e.target.value) || 0
                    }
                  }))}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address/Location Label</Label>
              <Input
                id="address"
                value={formData.location?.label || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    lat: prev.location?.lat || 0,
                    lon: prev.location?.lon || 0,
                    label: e.target.value
                  }
                }))}
                placeholder="e.g., New York, NY"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  placeholder="Auto-detected"
                  readOnly
                />
              </div>
            </div>
          </div>
        );

      case 3:
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
                {colors.map(color => (
                  <Card 
                    key={color.value}
                    className={`cursor-pointer transition-all border-2 ${
                      formData.color === color.value 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${color.class}`} />
                      <div className="text-sm font-medium">{color.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="text-sm space-y-1">
                <div><strong>Farm:</strong> {formData.name || 'Your Farm Name'}</div>
                <div><strong>Type:</strong> {farmTypes.find(t => t.value === formData.farmType)?.label}</div>
                <div><strong>Owner:</strong> {formData.ownerName || 'Not specified'}</div>
                {formData.location?.label && (
                  <div><strong>Location:</strong> {formData.location.label}</div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map(num => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === num 
                ? 'bg-primary text-primary-foreground' 
                : step > num 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {num}
            </div>
            {num < 3 && (
              <div className={`w-12 h-px mx-2 ${
                step > num ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Previous
        </Button>

        {step < 3 ? (
          <Button 
            onClick={() => setStep(step + 1)}
            disabled={!formData.name}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={!formData.name}
          >
            Create Farm
          </Button>
        )}
      </div>
    </div>
  );
}