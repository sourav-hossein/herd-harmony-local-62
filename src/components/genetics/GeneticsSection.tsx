import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dna, Star, Palette, Scissors } from 'lucide-react';
import { Goat } from '@/types/goat';

interface GeneticsSectionProps {
  genetics: Goat['genetics'];
  onGeneticsChange: (genetics: Goat['genetics']) => void;
  showPredictions?: boolean;
  predictions?: {
    hornStatus?: string;
    coatColor?: string;
    estimatedFertility?: number;
    estimatedMilkYield?: number;
  };
}

const GeneticsSection: React.FC<GeneticsSectionProps> = ({
  genetics,
  onGeneticsChange,
  showPredictions = false,
  predictions
}) => {
  const updateGenetics = <K extends keyof NonNullable<Goat['genetics']>>(
    field: K,
    value: NonNullable<Goat['genetics']>[K]
  ) => {
    onGeneticsChange({
      ...genetics,
      [field]: value
    });
  };

  const coatColors = [
    'Black', 'Brown', 'White', 'Gray', 'Red', 'Cream', 'Mixed', 'Spotted', 'Roan'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Dna className="h-5 w-5 text-primary" />
          <span>Genetic Traits</span>
          {showPredictions && (
            <Badge variant="secondary" className="ml-2">
              Auto-Predicted
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Horn Status & Genotype */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Scissors className="h-4 w-4" />
              <span>Horn Status</span>
            </Label>
            <Select 
              value={genetics?.hornStatus || 'horned'} 
              onValueChange={(value: 'horned' | 'polled' | 'disbudded') => updateGenetics('hornStatus', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horned">Horned</SelectItem>
                <SelectItem value="polled">Polled (Naturally Hornless)</SelectItem>
                <SelectItem value="disbudded">Disbudded</SelectItem>
              </SelectContent>
            </Select>
            {predictions?.hornStatus && (
              <p className="text-sm text-muted-foreground">
                Predicted: {predictions.hornStatus}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Horn Genotype</Label>
            <Select 
              value={genetics?.hornGenotype || 'hh'} 
              onValueChange={(value: 'PP' | 'Ph' | 'hh') => updateGenetics('hornGenotype', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PP">PP (Homozygous Polled)</SelectItem>
                <SelectItem value="Ph">Ph (Polled Carrier)</SelectItem>
                <SelectItem value="hh">hh (Horned)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Coat Color */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Coat Color</span>
          </Label>
          <Select 
            value={genetics?.coatColor || ''} 
            onValueChange={(value) => updateGenetics('coatColor', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select coat color" />
            </SelectTrigger>
            <SelectContent>
              {coatColors.map(color => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {predictions?.coatColor && (
            <p className="text-sm text-muted-foreground">
              Predicted: {predictions.coatColor}
            </p>
          )}
        </div>

        {/* Fertility Score */}
        <div className="space-y-3">
          <Label className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>Fertility Score</span>
            <Badge variant="outline">{genetics?.fertilityScore || 5}/10</Badge>
          </Label>
          <Slider
            value={[genetics?.fertilityScore || 5]}
            onValueChange={([value]) => updateGenetics('fertilityScore', value)}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>Average</span>
            <span>Excellent</span>
          </div>
          {predictions?.estimatedFertility && (
            <p className="text-sm text-muted-foreground">
              Estimated: {predictions.estimatedFertility}/10
            </p>
          )}
        </div>

        {/* Milk Yield Genetics */}
        <div className="space-y-2">
          <Label>Milk Yield Genetics (Index)</Label>
          <Input
            type="number"
            value={genetics?.milkYieldGenetics || ''}
            onChange={(e) => updateGenetics('milkYieldGenetics', Number(e.target.value))}
            placeholder="100 (base index)"
            min="50"
            max="200"
          />
          <p className="text-xs text-muted-foreground">
            100 = Average, Higher = Better milk production genetics
          </p>
          {predictions?.estimatedMilkYield && (
            <p className="text-sm text-muted-foreground">
              Estimated: {predictions.estimatedMilkYield} index
            </p>
          )}
        </div>

        {/* Genetic Summary */}
        {genetics && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium">Genetic Summary</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {genetics.hornStatus && (
                <Badge variant="secondary">
                  {genetics.hornStatus === 'horned' ? '🐐' : '⚪'} {genetics.hornStatus}
                </Badge>
              )}
              {genetics.coatColor && (
                <Badge variant="secondary">
                  🎨 {genetics.coatColor}
                </Badge>
              )}
              {genetics.fertilityScore && (
                <Badge variant="secondary">
                  ⭐ Fertility: {genetics.fertilityScore}/10
                </Badge>
              )}
              {genetics.milkYieldGenetics && (
                <Badge variant="secondary">
                  🥛 Milk: {genetics.milkYieldGenetics}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneticsSection;