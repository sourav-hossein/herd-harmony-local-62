
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Search, X } from 'lucide-react';
import { Goat } from '@/types/goat';
import { toast } from '@/components/ui/use-toast';

interface EnhancedParentSelectorProps {
  goats: Goat[];
  selectedFatherId?: string;
  selectedMotherId?: string;
  onFatherChange: (fatherId?: string) => void;
  onMotherChange: (motherId?: string) => void;
  excludeGoatId?: string;
  showManualInput?: boolean;
}

export default function EnhancedParentSelector({
  goats,
  selectedFatherId,
  selectedMotherId,
  onFatherChange,
  onMotherChange,
  excludeGoatId,
  showManualInput = true
}: EnhancedParentSelectorProps) {
  const [manualFatherId, setManualFatherId] = useState('');
  const [manualMotherId, setManualMotherId] = useState('');
  const [showFatherManual, setShowFatherManual] = useState(false);
  const [showMotherManual, setShowMotherManual] = useState(false);

  const maleGoats = goats.filter(g => 
    g.gender === 'male' && 
    g.id !== excludeGoatId
  );
  
  const femaleGoats = goats.filter(g => 
    g.gender === 'female' && 
    g.id !== excludeGoatId
  );

  const findGoatById = (id: string) => {
    return goats.find(g => g.id === id);
  };

  const handleManualFatherSearch = () => {
    const foundGoat = findGoatById(manualFatherId.trim());
    if (foundGoat) {
      if (foundGoat.gender === 'male') {
        onFatherChange(foundGoat.id);
        setShowFatherManual(false);
        setManualFatherId('');
        toast({
          title: "Father found",
          description: `Selected ${foundGoat.name} (${foundGoat.tagNumber})`,
        });
      } else {
        toast({
          title: "Invalid selection",
          description: "Selected goat is not male",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Goat not found",
        description: "No goat found with that ID",
        variant: "destructive"
      });
    }
  };

  const handleManualMotherSearch = () => {
    const foundGoat = findGoatById(manualMotherId.trim());
    if (foundGoat) {
      if (foundGoat.gender === 'female') {
        onMotherChange(foundGoat.id);
        setShowMotherManual(false);
        setManualMotherId('');
        toast({
          title: "Mother found",
          description: `Selected ${foundGoat.name} (${foundGoat.tagNumber})`,
        });
      } else {
        toast({
          title: "Invalid selection",
          description: "Selected goat is not female",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Goat not found",
        description: "No goat found with that ID",
        variant: "destructive"
      });
    }
  };

  const copyIdToClipboard = (id: string, name: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "ID copied",
      description: `Copied ${name}'s ID to clipboard`,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Father Selection */}
      <div className="space-y-2">
        <Label>Father (Sire)</Label>
        
        {!showFatherManual ? (
          <>
            <Select
              value={selectedFatherId || "unknown"}
              onValueChange={(value) => onFatherChange(value === "unknown" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select father" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown Sire</SelectItem>
                {maleGoats.map(goat => (
                  <SelectItem key={goat.id} value={goat.id}>
                    {goat.name} ({goat.tagNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {showManualInput && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFatherManual(true)}
                className="w-full text-xs"
              >
                <Search className="h-3 w-3 mr-1" />
                Manual ID Entry
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Father ID"
                value={manualFatherId}
                onChange={(e) => setManualFatherId(e.target.value)}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleManualFatherSearch}
                disabled={!manualFatherId.trim()}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowFatherManual(false);
                setManualFatherId('');
              }}
              className="w-full text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel Manual Entry
            </Button>
          </div>
        )}

        {selectedFatherId && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              ♂ {findGoatById(selectedFatherId)?.name}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyIdToClipboard(selectedFatherId, findGoatById(selectedFatherId)?.name || '')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Mother Selection */}
      <div className="space-y-2">
        <Label>Mother (Dam)</Label>
        
        {!showMotherManual ? (
          <>
            <Select
              value={selectedMotherId || "unknown"}
              onValueChange={(value) => onMotherChange(value === "unknown" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mother" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown Dam</SelectItem>
                {femaleGoats.map(goat => (
                  <SelectItem key={goat.id} value={goat.id}>
                    {goat.name} ({goat.tagNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {showManualInput && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMotherManual(true)}
                className="w-full text-xs"
              >
                <Search className="h-3 w-3 mr-1" />
                Manual ID Entry
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Mother ID"
                value={manualMotherId}
                onChange={(e) => setManualMotherId(e.target.value)}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleManualMotherSearch}
                disabled={!manualMotherId.trim()}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowMotherManual(false);
                setManualMotherId('');
              }}
              className="w-full text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel Manual Entry
            </Button>
          </div>
        )}

        {selectedMotherId && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
              ♀ {findGoatById(selectedMotherId)?.name}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyIdToClipboard(selectedMotherId, findGoatById(selectedMotherId)?.name || '')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
