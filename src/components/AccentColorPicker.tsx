
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const presetColors = [
  { name: 'Sage Green', hsl: '120 25% 35%', value: '#4a7c59' },
  { name: 'Ocean Blue',  hsl: '221 83% 53%', value: '#3b82f6' },
  { name: 'Forest Green', hsl: '142 76% 36%', value: '#16a34a' },
  { name: 'Sunset Orange',  hsl: '25 95% 53%', value: '#f97316' },
  { name: 'Royal Purple',  hsl: '262 83% 58%', value: '#8b5cf6' },
  { name: 'Rose Pink',  hsl: '330 81% 60%', value: '#ec4899' },
  { name: 'Cherry Red',  hsl: '0 84% 60%', value: '#ef4444' },
  { name: 'Golden Yellow',  hsl: '48 96% 53%', value: '#eab308' },
  { name: 'Slate Gray',  hsl: '215 28% 17%', value: '#334155' },
  { name: 'Emerald',  hsl: '160 84% 39%', value: '#10b981' },
  { name: 'Indigo',  hsl: '239 84% 67%', value: '#6366f1' },
  { name: 'Teal',  hsl: '173 80% 40%', value: '#14b8a6' }
];

export function AccentColorPicker() {
  const { accentColor, setAccentColor } = useTheme();
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hexColor = event.target.value;
    setAccentColor(hexColor);
    
    // Convert hex to HSL and apply
    const hsl = hexToHsl(hexColor);
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Accent Color</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Colors */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Preset Colors</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {presetColors.map((color) => (
              <Button
                key={color.value}
                variant="ghost"
                className="h-12 p-1 relative group"
                onClick={() => setAccentColor(color.value )}
                title={color.name}
              >
                <div
                  className="w-full h-full rounded-md border-2 transition-all"
                  style={{
                    backgroundColor: color.value,
                    borderColor: accentColor === color.value ? 'hsl(var(--foreground))' : 'transparent'
                  }}
                >
                  {accentColor === color.value && (
                    <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                  )}
                </div>
                <span className="sr-only">{color.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Color */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Custom Color</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
            >
              {showCustomPicker ? 'Hide' : 'Show'} Custom Picker
            </Button>
          </div>

          {showCustomPicker && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Input
                  type="color"
                  value={accentColor}
                  onChange={handleCustomColorChange}
                  className="w-12 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: accentColor }}
                />
                <span>Preview: {accentColor}</span>
              </div>
            </div>
          )}
        </div>

        {/* Current Selection Info */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-1">Current Selection</h4>
          <p className="text-sm text-muted-foreground">
            {accentColor === 'custom' 
              ? `Custom: ${accentColor}` 
              : presetColors.find(c => c.value === accentColor)?.name || 'Unknown'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
