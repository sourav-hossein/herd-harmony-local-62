
import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Activity, Weight, Image } from 'lucide-react';
import { Goat } from '@/types/goat';
import { toast } from '@/components/ui/use-toast';
import { useImageStorage } from '@/hooks/useImageStorage';

interface EnhancedPedigreeNodeData {
  goat: Goat | null;
  generation: number;
  isUnknown?: boolean;
  onGoatSelect: (goat: Goat) => void;
  onShowHealth: (goatId: string) => void;
  onShowWeight: (goatId: string) => void;
}

function EnhancedPedigreeNode({ data }: { data: EnhancedPedigreeNodeData }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { getImage } = useImageStorage();

  React.useEffect(() => {
    if (data.goat?.imageId) {
      getImage(data.goat.imageId).then(setImageUrl);
    }
  }, [data.goat?.imageId, getImage]);

  const copyId = (id: string, name: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "ID copied",
      description: `Copied ${name}'s ID to clipboard`,
    });
  };

  if (data.isUnknown || !data.goat) {
    return (
      <Card className="w-48 border-dashed border-2 border-muted">
        <CardContent className="p-3 text-center">
          <div className="text-sm text-muted-foreground">Unknown</div>
          <div className="text-xs text-muted-foreground mt-1">
            Generation {data.generation + 1}
          </div>
        </CardContent>
        <Handle type="target" position={Position.Right} />
        <Handle type="source" position={Position.Left} />
      </Card>
    );
  }

  const age = Math.floor(
    (new Date().getTime() - data.goat.birthDate.getTime()) / 
    (1000 * 60 * 60 * 24 * 365)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'deceased': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-52 hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={data.goat.name}
                className="w-8 h-8 object-cover rounded-full border"
              />
            ) : (
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Image className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{data.goat.name}</div>
              <div className="text-xs text-muted-foreground">#{data.goat.tagNumber}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              copyId(data.goat!.id, data.goat!.name);
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">{data.goat.breed}</span>
            <Badge className={`text-xs ${getStatusColor(data.goat.status)}`}>
              {data.goat.status}
            </Badge>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.goat.gender === 'male' ? '♂' : '♀'}</span>
            <span>{age}y</span>
          </div>
          
          {data.goat.color && (
            <div className="text-xs text-muted-foreground truncate">
              {data.goat.color}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Gen {data.generation + 1}
          </div>
        </div>

        <div className="flex justify-between mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              data.onGoatSelect(data.goat!);
            }}
            className="h-6 px-2 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              data.onShowHealth(data.goat!.id);
            }}
            className="h-6 px-2 text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            Health
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              data.onShowWeight(data.goat!.id);
            }}
            className="h-6 px-2 text-xs"
          >
            <Weight className="h-3 w-3 mr-1" />
            Weight
          </Button>
        </div>
      </CardContent>
      
      <Handle type="target" position={Position.Right} />
      <Handle type="source" position={Position.Left} />
    </Card>
  );
}

export default memo(EnhancedPedigreeNode);
