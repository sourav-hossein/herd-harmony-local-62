
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const presetColors = [
  { name: 'Sage Green', value: 'sage', hsl: '120 25% 35%', preview: '#4a7c59' },
  { name: 'Ocean Blue', value: 'blue', hsl: '221 83% 53%', preview: '#3b82f6' },
  { name: 'Forest Green', value: 'green', hsl: '142 76% 36%', preview: '#16a34a' },
  { name: 'Sunset Orange', value: 'orange', hsl: '25 95% 53%', preview: '#f97316' },
  { name: 'Royal Purple', value: 'purple', hsl: '262 83% 58%', preview: '#8b5cf6' },
  { name: 'Rose Pink', value: 'pink', hsl: '330 81% 60%', preview: '#ec4899' },
  { name: 'Cherry Red', value: 'red', hsl: '0 84% 60%', preview: '#ef4444' },
  { name: 'Golden Yellow', value: 'yellow', hsl: '48 96% 53%', preview: '#eab308' },
  { name: 'Slate Gray', value: 'slate', hsl: '215 28% 17%', preview: '#334155' },
  { name: 'Emerald', value: 'emerald', hsl: '160 84% 39%', preview: '#10b981' },
  { name: 'Indigo', value: 'indigo', hsl: '239 84% 67%', preview: '#6366f1' },
  { name: 'Teal', value: 'teal', hsl: '173 80% 40%', preview: '#14b8a6' }
];

export function AccentColorPicker() {
  const { accentColor, setAccentColor, customAccentColor, setCustomAccentColor } = useTheme();
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hexColor = event.target.value;
    setCustomAccentColor(hexColor);
    
    // Convert hex to HSL and apply
    const hsl = hexToHsl(hexColor);
    setAccentColor('custom');
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

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
                onClick={() => setAccentColor(color.value as any)}
                title={color.name}
              >
                <div
                  className="w-full h-full rounded-md border-2 transition-all"
                  style={{
                    backgroundColor: color.preview,
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
                  value={customAccentColor}
                  onChange={handleCustomColorChange}
                  className="w-12 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={customAccentColor}
                  onChange={(e) => setCustomAccentColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const hsl = hexToHsl(customAccentColor);
                    setAccentColor('custom');
                  }}
                  disabled={!customAccentColor.match(/^#[0-9A-F]{6}$/i)}
                >
                  Apply
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: customAccentColor }}
                />
                <span>Preview: {customAccentColor}</span>
              </div>
            </div>
          )}
        </div>

        {/* Current Selection Info */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-1">Current Selection</h4>
          <p className="text-sm text-muted-foreground">
            {accentColor === 'custom' 
              ? `Custom: ${customAccentColor}` 
              : presetColors.find(c => c.value === accentColor)?.name || 'Unknown'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
