
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Camera, 
  Video, 
  Filter, 
  Eye, 
  Download,
  Clock,
  Milestone,
  Heart,
  Activity
} from 'lucide-react';
import { MediaFile } from '@herd-harmony/shared-types/goat';
import { Goat } from '@herd-harmony/shared-types/goat';
import { get } from 'http';
import { useGoatContext } from '@/context/GoatContext';

interface GoatLifeTimelineProps {
  goat: Goat;
  className?: string;
}

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'media' | 'milestone';
  title: string;
  description?: string;
  media?: MediaFile;
  category: MediaFile['category'] | 'birth' | 'weaning' | 'breeding';
  icon: React.ReactNode;
}

export default function GoatLifeTimeline({ goat, className = "" }: GoatLifeTimelineProps) {
  const {getMediaByGoatId}= useGoatContext()
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('timeline');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  React.useEffect(() => {
    async function fetchMedia() {
      const media = await getMediaByGoatId(goat.id);
      setMediaFiles(media);
    }
    fetchMedia();
  }, [goat.id, getMediaByGoatId]);

  // Generate timeline events from media files and key milestones
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add media events
    mediaFiles.forEach(media => {
      events.push({
        id: `media-${media.id}`,
        date: typeof media.timestamp === 'string' ? new Date(media.timestamp) : media.timestamp,
        type: 'media',
        title: media.filename,
        description: media.description,
        media,
        category: media.category,
        icon: media.type === 'video' ? <Video className="w-4 h-4" /> : <Camera className="w-4 h-4" />
      });
    });

    // Add key milestones
    events.push({
      id: 'birth',
      date: goat.birthDate,
      type: 'milestone',
      title: 'Birth',
      description: `${goat.name} was born`,
      category: 'birth',
      icon: <Heart className="w-4 h-4" />
    });

    // Add weaning milestone (typically 8-12 weeks after birth)
    const weaningDate = new Date(goat.birthDate);
    weaningDate.setDate(weaningDate.getDate() + 70); // ~10 weeks
    events.push({
      id: 'weaning',
      date: weaningDate,
      type: 'milestone',
      title: 'Weaning Age',
      description: 'Typical weaning period',
      category: 'weaning',
      icon: <Milestone className="w-4 h-4" />
    });

    // Sort by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [goat, mediaFiles]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = timelineEvents;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      filtered = filtered.filter(event =>new Date(new Date(event.date)).getFullYear() === year);
    }

    return filtered;
  }, [timelineEvents, selectedCategory, selectedYear]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = [...new Set(timelineEvents.map(event =>new Date(new Date(event.date)).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [timelineEvents]);

  const getCategoryColor = (category: string) => {
    const colors = {
      birth: 'bg-pink-100 text-pink-800',
      weaning: 'bg-blue-100 text-blue-800',
      breeding: 'bg-purple-100 text-purple-800',
      health: 'bg-red-100 text-red-800',
      milestone: 'bg-green-100 text-green-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getAgeAtEvent = (eventDate: Date) => {
    const ageMs = new Date(eventDate).getTime() - new Date(goat.birthDate).getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    
    if (ageMonths > 12) {
      const years = Math.floor(ageMonths / 12);
      const remainingMonths = ageMonths % 12;
      return `${years}y ${remainingMonths}m`;
    } else if (ageMonths > 0) {
      return `${ageMonths} months`;
    } else {
      return `${ageDays} days`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>{goat.name}'s Life Timeline</span>
              <Badge variant="outline">{filteredEvents.length} events</Badge>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="birth">Birth</SelectItem>
                  <SelectItem value="weaning">Weaning</SelectItem>
                  <SelectItem value="breeding">Breeding</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className="rounded-r-none"
                >
                  Timeline
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No events found for the selected filters</p>
            </div>
          ) : viewMode === 'timeline' ? (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
              
              <div className="space-y-6">
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="flex items-start space-x-4">
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0 w-16 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        {event.icon}
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        {getAgeAtEvent(new Date(event.date))}
                      </div>
                    </div>
                    
                    {/* Event Content */}
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold flex items-center space-x-2">
                              <span>{event.title}</span>
                              <Badge className={getCategoryColor(event.category)}>
                                {event.category}
                              </Badge>
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {event.description && (
                          <p className="text-sm mb-3">{event.description}</p>
                        )}
                        
                        {event.media && (
                          <div className="flex items-center space-x-2">
                            {event.media.type === 'image' ? (
                              <img
                                src={event.media.url}
                                alt={event.media.filename}
                                className="w-20 h-20 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center">
                                <Video className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.media.filename}</p>
                              <div className="flex space-x-2 mt-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  {event.media && (
                    <div className="aspect-square">
                      {event.media.type === 'image' ? (
                        <img
                          src={event.media.url}
                          alt={event.media.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-1 mb-1">
                      {event.icon}
                      <h4 className="font-medium text-sm truncate">{event.title}</h4>
                    </div>
                    <Badge className={`${getCategoryColor(event.category)} text-xs mb-2`}>
                      {event.category}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Age: {getAgeAtEvent(new Date(event.date))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
