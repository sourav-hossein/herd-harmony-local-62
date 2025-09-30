import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Edit, Save, X, User } from 'lucide-react';
import { Goat } from '@herd-harmony/shared-types/goat';
import GoatLifeTimeline from '../media/GoatLifeTimeline';

interface InteractiveGeneralTabProps {
  goat: Goat;
  onUpdate: (goat: Goat) => void;
}

export function InteractiveGeneralTab({ goat, onUpdate }: InteractiveGeneralTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoat, setEditedGoat] = useState<Goat>(goat);

  const handleSave = () => {
    onUpdate(editedGoat);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGoat(goat);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Edit General Information</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedGoat.name}
                onChange={(e) => setEditedGoat({ ...editedGoat, name: e.target.value })}
              />
            </div>
            {/* <div>
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={editedGoat.nickname || ''}
                onChange={(e) => setEditedGoat({ ...editedGoat, nickname: e.target.value })}
              />
            </div> */}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={editedGoat.breed}
                onChange={(e) => setEditedGoat({ ...editedGoat, breed: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={editedGoat.color}
                onChange={(e) => setEditedGoat({ ...editedGoat, color: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editedGoat.notes || ''}
              onChange={(e) => setEditedGoat({ ...editedGoat, notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>General Information</span>
          </CardTitle>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{goat.name}</p>
            </div>
            
            {/* {goat.nickname && (
              <div>
                <p className="text-sm text-muted-foreground">Nickname</p>
                <p className="font-medium">"{goat.nickname}"</p>
              </div>
            )} */}
            
            <div>
              <p className="text-sm text-muted-foreground">Tag Number</p>
              <p className="font-medium">#{goat.tagNumber}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Breed</p>
              <p className="font-medium">{goat.breed}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <Badge variant={goat.gender === 'male' ? 'default' : 'secondary'}>
                {goat.gender === 'male' ? 'Buck' : 'Doe'}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{new Date(goat.birthDate).toLocaleDateString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Color</p>
              <p className="font-medium">{goat.color}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={
                goat.status === 'active' ? 'default' : 
                goat.status === 'sold' ? 'secondary' : 
                'destructive'
              }>
                {goat.status}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Horn Status</p>
              <p className="font-medium capitalize">{goat.hornStatus}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Acquisition Type</p>
              <p className="font-medium capitalize">{goat.acquisitionType}</p>
            </div>
          </div>
        </div>
        
        {goat.notes && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-2">Notes</p>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{goat.notes}</p>
            </div>
          </div>
        )}
      </CardContent>
      <GoatLifeTimeline goat={goat} />
    </Card>
  );
}