
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SmartNotifications } from './SmartNotifications';
import { Bell, Archive, Trash2, CheckCircle, Filter } from 'lucide-react';
import { Alert } from '@/lib/alertsEngine';

interface NotificationCenterProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onAction?: (alert: Alert) => void;
  onClearDismissed?: () => void;
}

export function NotificationCenter({ 
  alerts, 
  onDismiss, 
  onAction, 
  onClearDismissed 
}: NotificationCenterProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const dismissedAlerts = alerts.filter(a => a.dismissed);

  const filteredActive = filterCategory === 'all' 
    ? activeAlerts 
    : activeAlerts.filter(a => a.category === filterCategory);

  const filteredDismissed = filterCategory === 'all' 
    ? dismissedAlerts 
    : dismissedAlerts.filter(a => a.category === filterCategory);

  const categories = ['all', ...Array.from(new Set(alerts.map(a => a.category)))];

  const getCriticalCount = () => activeAlerts.filter(a => a.type === 'critical').length;
  const getWarningCount = () => activeAlerts.filter(a => a.type === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">Notification Center</h2>
            <p className="text-muted-foreground">
              Manage your farm alerts and reminders
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getCriticalCount() > 0 && (
            <Badge variant="destructive">
              {getCriticalCount()} Critical
            </Badge>
          )}
          {getWarningCount() > 0 && (
            <Badge variant="secondary">
              {getWarningCount()} Warnings
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by category:</span>
              <div className="flex space-x-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={filterCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            {dismissedAlerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearDismissed}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Dismissed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Active</span>
            {activeAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="flex items-center space-x-2">
            <Archive className="w-4 h-4" />
            <span>Dismissed</span>
            {dismissedAlerts.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {dismissedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Notifications</span>
                {activeAlerts.length > 0 && (
                  <Badge variant="outline">
                    {filteredActive.length} of {activeAlerts.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SmartNotifications
                alerts={filteredActive}
                onDismiss={onDismiss}
                onAction={onAction}
                maxDisplay={20}
                showDismissed={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Dismissed Notifications</span>
                {dismissedAlerts.length > 0 && (
                  <Badge variant="outline">
                    {filteredDismissed.length} of {dismissedAlerts.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDismissed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                  <p>No dismissed notifications</p>
                  <p className="text-sm">Dismissed alerts will appear here</p>
                </div>
              ) : (
                <SmartNotifications
                  alerts={filteredDismissed}
                  onDismiss={onDismiss}
                  onAction={onAction}
                  maxDisplay={20}
                  showDismissed={true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
