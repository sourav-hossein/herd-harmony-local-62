
export interface RotationScheduleItem {
  id: string;
  pastureId: string;
  goatIds: string[];
  startDate: Date;
  endDate: Date;
  duration: number; // days
  status: 'planned' | 'active' | 'completed' | 'skipped';
  actualStartDate?: Date;
  actualEndDate?: Date;
  notes?: string;
}

export interface PastureUtilization {
  pastureId: string;
  currentStockingRate: number;
  optimalStockingRate: number;
  utilizationStatus: 'understocked' | 'optimal' | 'overstocked' | 'severely_overstocked';
  daysInUse: number;
  daysSinceRest: number;
  restPeriodNeeded: number;
  foragePressure: 'low' | 'moderate' | 'high' | 'excessive';
  lastCalculated: Date;
}

export interface GrazingAlert {
  id: string;
  type: 'rest_period_ended' | 'overstocked' | 'poor_condition' | 'rotation_due' | 'weather_concern';
  pastureId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionRequired?: string;
  dueDate?: Date;
  isRead: boolean;
  createdAt: Date;
}

export interface PastureReport {
  farmId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalPastures: number;
  totalArea: number;
  averageUtilization: number;
  rotationCompliance: number; // percentage
  pastureHealth: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };
  topPerformingPastures: { pastureId: string; score: number }[];
  underperformingPastures: { pastureId: string; issues: string[] }[];
  recommendations: string[];
  generatedAt: Date;
}