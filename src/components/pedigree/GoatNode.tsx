import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Mars, Venus, ShieldQuestion, Award, Calendar, Tag } from 'lucide-react';
import { Goat } from '@/types/goat';
import { Badge } from '@/components/ui/badge';
import { useGoatContext } from '@/context/GoatContext';

interface GoatNodeProps {
  data: {
    goat?: Goat; // The goat data might be nested
    isRoot?: boolean;
    isUnknown?: boolean;
    // Additional properties that might be spread from the Goat type
    name?: string;
    gender?: string;
    breed?: string;
    birthDate?: string;
    status?: string;
    tagNumber?: string;
    genetics?: {
      coatColor?: string;
      [key: string]: unknown;
    };
  };
}

const GoatNode: React.FC<GoatNodeProps> = ({ data }) => {
  // THE FIX: Handle both nested `data.goat` and spread `data` properties.
  const goat = (data.goat || data) as Goat;
  const { isRoot, isUnknown } = data;
  const { thumbnails } = useGoatContext();
  
  if (!goat || !goat.gender) {
    // Render a fallback or null if essential goat data is missing
    // This prevents the crash if the goat object is malformed.
    return null; 
  }

  const isMale = goat.gender === 'male';

  // Enhanced Color Scheme
  const genderColor = isMale ? 'bg-blue-50' : 'bg-pink-50';
  const borderColor = isRoot ? 'border-blue-400' : isMale ? 'border-blue-400' : 'border-pink-400';
  const gradientColor = isRoot ? 'from-blue-500' : isMale ? 'from-blue-500' : 'from-pink-500';

  // Icons
  const genderIcon = isUnknown ? (
    <ShieldQuestion className="h-4 w-4 text-gray-500" />
  ) : isMale ? (
    <Mars className="h-4 w-4 text-blue-600" />
  ) : (
    <Venus className="h-4 w-4 text-pink-600" />
  );

  const getPhotoSrc = () => {
    if (isUnknown || !goat) return '';
    const thumbnail = thumbnails?.find((thumb) => thumb.goatId === goat.id);
    return thumbnail?.url || '';
  };


  const photoSrc = getPhotoSrc();
  const birthDate = goat?.birthDate ? new Date(goat.birthDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
    >
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Card className={`w-56 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden ${borderColor} border-2 ${isUnknown ? 'bg-gray-50' : genderColor}`}>
            <div className={`h-1.5 bg-gradient-to-r ${gradientColor} to-transparent`} />
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={photoSrc} alt={goat.name || 'Unknown goat'} className="object-cover" />
                  <AvatarFallback className={`${isUnknown ? 'bg-gray-200' : ''}`}>
                    {isUnknown ? '?' : goat.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-base truncate text-gray-800">
                      {isUnknown ? 'Unknown' : goat.name}
                    </p>
                    {genderIcon}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Tag className="h-3 w-3 mr-1" />
                    <span className="truncate">{isUnknown ? 'N/A' : goat.tagNumber}</span>
                  </div>
                </div>
              </div>
              {!isUnknown && (
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center text-gray-600">
                    <Award className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span>{goat.breed || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span>{birthDate}</span>
                  </div>
                </div>
              )}
              {goat.status && !isUnknown && (
                <Badge variant={goat.status === 'active' ? 'secondary' : 'outline'} className="mt-2 text-xs font-mono">
                  {goat.status}
                </Badge>
              )}
            </CardContent>
          </Card>
        </HoverCardTrigger>
        
        {!isUnknown && (
          <HoverCardContent className="w-80" side="top">
            <div className="flex space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={photoSrc} alt={goat.name} />
                <AvatarFallback>{goat.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-lg font-semibold">{goat.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {goat.breed} - {goat.gender}
                </p>
                <div className="pt-2">
                  <p className="text-sm">
                    <span className="font-semibold">DOB:</span> {birthDate}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Status:</span> {goat.status}
                  </p>
                  {goat.genetics?.coatColor && (
                    <p className="text-sm">
                      <span className="font-semibold">Color:</span> {goat.genetics.coatColor}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors" />
    </motion.div>
  );
};

export default memo(GoatNode)