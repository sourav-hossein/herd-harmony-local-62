import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mars,
  Venus,
  Edit,
  Trash2,
  Eye,
  Scale,
  Stethoscope,
  Star,
  Calendar,
  Baby,
  Palette, // New icon for color
  Bone, // New icon for horn status
  CheckCircle, // New icon for active status
  PlusCircle, // For quick breeding
  Clock, // For last updated
  MapPin // Already there, but good to confirm
} from 'lucide-react';
import { Goat, MediaFile } from '@/types/goat';
import { motion } from 'framer-motion'; // Import motion

// Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { get } from 'http';
import { useGoatContext } from '@/context/GoatContext';

interface GoatCardProps {
  goat: Goat;
  onView: (goat: Goat) => void;
  onEdit: (goat: Goat) => void;
  onDelete: (goat: Goat) => void;
  onQuickWeight: (goat: Goat) => void;
  onQuickHealth: (goat: Goat) => void;
  onToggleFavorite: (goat: Goat) => void;
  onQuickBreeding: (goat: Goat) => void; // New prop
  viewMode: "grid" | "list";
  thumbnail?: string // New prop for thumbnails
}

export default function GoatCard({
  goat,
  onView,
  onEdit,
  onDelete,
  onQuickWeight,
  onQuickHealth,
  onToggleFavorite,
  onQuickBreeding,
  viewMode,
  thumbnail
}: GoatCardProps) {
  // const { getMediaByGoatId } = window.electronAPI;
  const [primaryMedia, setPrimaryMedia] = useState<MediaFile | null>(null);
  const calculateAge = (birthDate: Date): string => {
    const now = new Date();
    const ageMs = now.getTime() - new Date(birthDate).getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));

    if (ageMonths >= 12) {
      const years = Math.floor(ageMonths / 12);
      const remainingMonths = ageMonths % 12;
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
    }
    return `${ageMonths}m`;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'treatment': return 'bg-yellow-100 text-yellow-800';
      case 'checkup_due': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBreedingStatusColor = (status: string) => {
    switch (status) {
      case 'pregnant': return 'bg-purple-100 text-purple-800';
      case 'lactating': return 'bg-blue-100 text-blue-800';
      case 'kid': return 'bg-pink-100 text-pink-800';
      case 'active': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoatStatusColor = (status: string) => { // New helper
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-red-100 text-red-800';
      case 'deceased': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        className="relative"
      >
        <Card className="h-full flex flex-col">
          {/* Favorite Star */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.2 }}
            className="absolute top-2 right-2 z-10"
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={() => onToggleFavorite(goat)}
            >
              <Star className={`h-5 w-5 transition-colors ${goat.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
            </Button>
          </motion.div>

          <CardContent className="p-4 flex-1 flex flex-col space-y-3">
            {/* <div className={viewMode=="grid"?"flex-1 flex flex-col space-y-3":"flex justify-between"}> */}

            <div className=' flex flex-col space-y-3'>

            {/* Header with Image and Basic Info */}
            <div className="flex items-start space-x-4">
              <div className="relative flex-shrink-0">
                {thumbnail ? (
                  <img
                  src={thumbnail}
                  alt={goat.name}
                  className="w-20 h-20 object-cover rounded-full border-2 border-primary/20 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center border-2 border-primary/20 shadow-sm">
                    {goat.gender === 'female' ? (
                      <Mars className="h-10 w-10 text-pink-500" />
                    ) : (
                      <Venus className="h-10 w-10 text-blue-500" />
                    )}
                  </div>
                )}
                {/* Gender Icon Overlay */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 shadow-md border border-border">
                      {goat.gender === 'female' ? (
                        <Mars className="h-4 w-4 text-pink-500" />
                      ) : (
                        <Venus className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{goat.gender === 'female' ? 'Female' : 'Male'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl text-foreground truncate">{goat.name}</h3>
                <p className="text-sm text-muted-foreground">#{goat.tagNumber}</p>
                {/* {goat.nickname && <p className="text-sm text-muted-foreground italic">"{goat.nickname}"</p>} */}
                <p className="text-xs text-muted-foreground">ID: {goat.id.slice(0, 8)}...</p>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-1">
              <Badge className={getGoatStatusColor(goat.status)}>
                <CheckCircle className="h-3 w-3 mr-1" />
                {goat.status}
              </Badge>
              <Badge className={getHealthStatusColor('healthy')}> {/* Assuming 'healthy' for now, can be dynamic */}
                <Stethoscope className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
              <Badge className={getBreedingStatusColor(goat.breedingStatus)}>
                <Baby className="h-3 w-3 mr-1" />
                {goat.breedingStatus}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {goat.breed}
              </Badge>
            </div>
          </div>

            {/* Key Information Grid */}
            <div className={"grid grid-cols-2 gap-x-4 gap-y-2 text-sm"+(viewMode=="grid"?"":" gap-x-8")}>
              <div>
                <p className="text-muted-foreground flex items-center"><Calendar className="h-3 w-3 mr-1" /> Age</p>
                <p className="font-medium">{calculateAge(goat.birthDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center"><Scale className="h-3 w-3 mr-1" /> Weight</p>
                <p className="font-medium">{goat.currentWeight || '--'} kg</p>
              </div>
              {goat.color && (
                <div>
                  <p className="text-muted-foreground flex items-center"><Palette className="h-3 w-3 mr-1" /> Color</p>
                  <p className="font-medium capitalize">{goat.color}</p>
                </div>
              )}
              {goat.hornStatus && (
                <div>
                  <p className="text-muted-foreground flex items-center"><Bone className="h-3 w-3 mr-1" /> Horns</p>
                  <p className="font-medium capitalize">{goat.hornStatus}</p>
                </div>
              )}
            </div>

            {/* Custom Tags */}
            {goat.tags && goat.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {goat.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {goat.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{goat.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
              {/* </div> */}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(goat)}
                className="flex-1 min-w-[100px]"
                >
                <Eye className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuickWeight(goat)}
                  >
                    <Scale className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Weight</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuickHealth(goat)}
                  >
                    <Stethoscope className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Health Record</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuickBreeding(goat)} // New button
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Breeding Record</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(goat)}
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Goat</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(goat)}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Goat</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Additional Info Footer */}
            <div className="mt-auto border-t pt-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Born {new Date(goat.birthDate).toLocaleDateString()}</span>
                </div>
                {(goat.fatherId || goat.motherId) && (
                  <div className="flex items-center space-x-1">
                    <Baby className="h-3 w-3" />
                    <span>Parents known</span>
                  </div>
                )}
              </div>
              {goat.updatedAt && (
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Last Updated: {new Date(goat.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}