import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Baby, Heart, Calendar, User, Plus, Eye } from 'lucide-react';
import { Goat } from '@/types/goat';
import { BreedingRecord, KiddingRecord } from '@/types/breeding';
import { useGoatContext } from '@/context/GoatContext';

interface GoatBreedingHistoryProps {
  goat: Goat;
}

export default function GoatBreedingHistory({ goat }: GoatBreedingHistoryProps) {
  const { goats } = useGoatContext();
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [kiddingRecords, setKiddingRecords] = useState<KiddingRecord[]>([]);
  const [offspring, setOffspring] = useState<Goat[]>([]);

  useEffect(() => {
    // Find breeding records where this goat is sire or dam
    // Note: This would need to be implemented in your data layer
    // For now, showing the structure
    const mockBreedingRecords: BreedingRecord[] = [];
    setBreedingRecords(mockBreedingRecords);

    // Find offspring (goats where this goat is parent)
    const goatOffspring = goats.filter(g => 
      g.fatherId === goat.id || g.motherId === goat.id
    );
    setOffspring(goatOffspring);
  }, [goat.id, goats]);

  const getParentName = (parentId?: string) => {
    const parent = goats.find(g => g.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  const getAge = (birthDate: Date) => {
    const today = new Date();
    const ageInMs = today.getTime() - birthDate.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 30) {
      return `${ageInDays} days`;
    } else if (ageInDays < 365) {
      const months = Math.floor(ageInDays / 30);
      return `${months} months`;
    } else {
      const years = Math.floor(ageInDays / 365);
      const remainingMonths = Math.floor((ageInDays % 365) / 30);
      return `${years}y ${remainingMonths}m`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breeding Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Current Breeding Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={
                goat.breedingStatus === 'pregnant' ? 'bg-purple-100 text-purple-800' :
                goat.breedingStatus === 'lactating' ? 'bg-blue-100 text-blue-800' :
                goat.breedingStatus === 'kid' ? 'bg-pink-100 text-pink-800' :
                goat.breedingStatus === 'active' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }>
                {goat.breedingStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{goat.gender}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parentage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Parentage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Father (Sire)</p>
              {goat.fatherId ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{getParentName(goat.fatherId)}</p>
                    <Badge variant="outline">Known</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-muted-foreground">Unknown</p>
                  <Badge variant="secondary">Missing</Badge>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mother (Dam)</p>
              {goat.motherId ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{getParentName(goat.motherId)}</p>
                    <Badge variant="outline">Known</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-muted-foreground">Unknown</p>
                  <Badge variant="secondary">Missing</Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breeding History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Breeding Records</span>
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Add Breeding
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {breedingRecords.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <p>No breeding records yet</p>
                <p className="text-sm">Breeding history will appear here</p>
              </div>
            ) : (
              breedingRecords.map(record => (
                <div key={record.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {goat.gender === 'male' ? 'Bred with' : 'Bred by'}: {
                          goat.gender === 'male' 
                            ? getParentName(record.damId)
                            : getParentName(record.sireId)
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Date: {record.breedingDate.toLocaleDateString()}
                      </p>
                      <Badge variant="outline">
                        {record.pregnancyStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offspring */}
      {(goat.gender === 'female' || offspring.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Baby className="h-5 w-5" />
                <span>Offspring</span>
                <Badge variant="outline">{offspring.length}</Badge>
              </CardTitle>
              {goat.gender === 'female' && (
                <Button variant="outline" size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  Record Kidding
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offspring.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <p>No offspring yet</p>
                  <p className="text-sm">Kids will appear here when born</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {offspring.map(kid => (
                    <div key={kid.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {kid.gender === 'male' ? '♂' : '♀'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{kid.name}</p>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Born: {kid.birthDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Age: {getAge(kid.birthDate)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {kid.status}
                            </Badge>
                            {kid.currentWeight && (
                              <Badge variant="secondary" className="text-xs">
                                {kid.currentWeight} lbs
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}