
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Award, Star, Trophy } from 'lucide-react';

interface UsageStreaksProps {
  className?: string;
}

export function UsageStreaks({ className }: UsageStreaksProps) {
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  useEffect(() => {
    // Load streak data from localStorage
    const streakData = localStorage.getItem('usage-streak');
    if (streakData) {
      const data = JSON.parse(streakData);
      setStreak(data.current || 0);
      setTotalDays(data.total || 0);
      setLastActivity(data.lastActivity ? new Date(data.lastActivity) : null);
    }

    // Update activity for today
    updateActivityForToday();
  }, []);

  const updateActivityForToday = () => {
    const today = new Date().toDateString();
    const storedData = localStorage.getItem('usage-streak');
    let data = storedData ? JSON.parse(storedData) : { current: 0, total: 0, lastActivity: null };

    const lastActivityDate = data.lastActivity ? new Date(data.lastActivity).toDateString() : null;
    
    if (lastActivityDate !== today) {
      // Check if it's consecutive
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActivityDate === yesterday.toDateString()) {
        // Consecutive day
        data.current += 1;
      } else if (lastActivityDate) {
        // Streak broken, start over
        data.current = 1;
      } else {
        // First time
        data.current = 1;
      }
      
      data.total += 1;
      data.lastActivity = new Date().toISOString();
      
      localStorage.setItem('usage-streak', JSON.stringify(data));
      
      setStreak(data.current);
      setTotalDays(data.total);
      setLastActivity(new Date(data.lastActivity));
    }
  };

  const getBadge = () => {
    if (streak >= 30) return { icon: Trophy, label: 'Legend', color: 'bg-yellow-500' };
    if (streak >= 14) return { icon: Award, label: 'Gold', color: 'bg-yellow-400' };
    if (streak >= 7) return { icon: Star, label: 'Silver', color: 'bg-gray-400' };
    if (streak >= 3) return { icon: Flame, label: 'Bronze', color: 'bg-orange-400' };
    return null;
  };

  const badge = getBadge();
  const streakEmoji = streak > 0 ? '🔥' : '📊';
  const encouragementText = 
    streak === 0 ? 'Start your streak today!' :
    streak === 1 ? 'Great start! Keep it up!' :
    streak < 7 ? `${streak} days strong!` :
    streak < 14 ? `Amazing ${streak}-day streak!` :
    `Incredible ${streak}-day streak! 🎉`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span>Activity Streak</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary flex items-center justify-center space-x-2">
            <span>{streakEmoji}</span>
            <span>{streak}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{encouragementText}</p>
        </div>

        {badge && (
          <div className="flex justify-center">
            <Badge className={`${badge.color} text-white px-3 py-1`}>
              <badge.icon className="w-4 h-4 mr-1" />
              {badge.label}
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">{streak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">{totalDays}</div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </div>
        </div>

        {lastActivity && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Last activity: {lastActivity.toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Progress to next badge:</div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (streak % 7) * (100 / 7))}%` 
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {streak < 3 ? `${3 - streak} days to Bronze` :
             streak < 7 ? `${7 - streak} days to Silver` :
             streak < 14 ? `${14 - streak} days to Gold` :
             streak < 30 ? `${30 - streak} days to Legend` :
             'Max level reached! 🏆'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
