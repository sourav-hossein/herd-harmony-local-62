import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFarm } from '@/context/FarmContext';
import { FarmMeta } from '@herd-harmony/shared-types/farm';
import { useTheme } from '@/context/ThemeContext';
import OfflineMapComponent from '../multifarm/OfflineMapComponent';

export default function FarmSettingsTab() {
  const { farmData, activeFarmId, refreshFarms } = useFarm();
  const { toast } = useToast();
  const { setAccentColor } = useTheme();

  const [currentFarm, setCurrentFarm] = useState<Partial<FarmMeta>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (farmData?.metadata) {
      setCurrentFarm(farmData.metadata);
      // Set the theme accent color to the farm's color when the tab is loaded
      setAccentColor(farmData.metadata.color || '#3b82f6');
    }
  }, [farmData, setAccentColor]);

  const farmTypes = [
    { label: 'Dairy', value: 'dairy', description: 'Focus on milk production' },
    { label: 'Meat', value: 'meat', description: 'Focus on meat production' },
    { label: 'Mixed', value: 'mixed', description: 'Both dairy and meat' },
    { label: 'Breeding', value: 'breeding', description: 'Focus on breeding and genetics' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setCurrentFarm(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof FarmMeta, value: string) => {
    setCurrentFarm(prev => ({ ...prev, [id]: value }));
  };

  const handleColorChange = (color: string) => {
    setCurrentFarm(prev => ({ ...prev, color }));
  };

  const handleSave = async () => {
    if (!activeFarmId || !currentFarm.name) {
      toast({
        title: 'Error',
        description: 'Farm name is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await window.electronAPI!.updateFarm(activeFarmId, currentFarm);
      await refreshFarms(); // Refresh farm list to update any changes
      toast({
        title: 'Success',
        description: 'Farm settings updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update farm settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update farm settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!farmData?.metadata) {
    return <div className="text-center py-8">No active farm selected or farm data not loaded.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Farm Details</h2>
      <p className="text-muted-foreground">Manage your farm's basic information and preferences.</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Farm Name</Label>
          <Input
            id="name"
            value={currentFarm.name || ''}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner Name</Label>
          <Input
            id="ownerName"
            value={currentFarm.ownerName || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="farmType">Farm Type</Label>
          <Select
            value={currentFarm.farmType}
            onValueChange={(value) => handleSelectChange('farmType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select farm type" />
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
            value={currentFarm.description || ''}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={currentFarm.currency}
              onValueChange={(value) => handleSelectChange('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
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
              value={currentFarm.timezone || ''}
              onChange={handleInputChange}
              readOnly
            />
          </div>
        </div>

        {/* <FarmColorPicker
          color={currentFarm.color || '#3b82f6'}
          onChange={handleColorChange}
        /> */}

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
