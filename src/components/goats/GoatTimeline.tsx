
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Weight, Stethoscope, Camera, FileText } from 'lucide-react';
import { Goat, WeightRecord, HealthRecord } from '@/types/goat';

interface GoatTimelineProps {
  goat: Goat;
  weightRecords: WeightRecord[];
  healthRecords: HealthRecord[];
}

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'birth' | 'weight' | 'health' | 'media' | 'note';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function GoatTimeline({ goat, weightRecords, healthRecords }: GoatTimelineProps) {
  const events: TimelineEvent[] = [
    {
      id: 'birth',
      date: goat.birthDate,
      type: 'birth',
      title: 'Born',
      description: `${goat.name} was born`,
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-primary'
    },
    ...weightRecords.map(record => ({
      id: record.id,
      date: record.date,
      type: 'weight' as const,
      title: 'Weight Recorded',
      description: `${record.weight}kg ${record.notes ? '- ' + record.notes : ''}`,
      icon: <Weight className="h-4 w-4" />,
      color: 'bg-primary'
    })),
    ...healthRecords.map(record => ({
      id: record.id,
      date: record.date,
      type: 'health' as const,
      title: record.type.charAt(0).toUpperCase() + record.type.slice(1),
      description: record.description,
      icon: <Stethoscope className="h-4 w-4" />,
      color: 'bg-primary'
    }))
  ];

  const sortedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Life Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-primary-foreground flex-shrink-0`}>
                {event.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{event.title}</h4>
                  <span className="text-sm text-muted-foreground">
                    {event.date.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
          {sortedEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No timeline events yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
