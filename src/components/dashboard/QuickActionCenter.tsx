
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Heart, DollarSign, FileText, Activity } from 'lucide-react';

interface QuickActionCenterProps {
  onAction: (action: string) => void;
}

export function QuickActionCenter({ onAction }: QuickActionCenterProps) {
  const quickActions = [
    {
      id: 'add-goat',
      label: 'Add Goat',
      icon: Plus,
      description: 'Register a new goat',
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'record-weight',
      label: 'Record Weight',
      icon: TrendingUp,
      description: 'Log weight measurement',
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      id: 'log-health',
      label: 'Health Event',
      icon: Heart,
      description: 'Log vaccination or checkup',
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-white'
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: DollarSign,
      description: 'Record farm expense',
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-white'
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: FileText,
      description: 'Create summary report',
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white'
    },
    {
      id: 'feed-management',
      label: 'Feed Management',
      icon: Activity,
      description: 'Manage feed inventory',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      textColor: 'text-white'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={`h-20 flex-col space-y-1 p-3 ${action.color} ${action.textColor} hover:${action.textColor}`}
              onClick={() => onAction(action.id)}
            >
              <action.icon className="h-6 w-6" />
              <div className="text-center">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
