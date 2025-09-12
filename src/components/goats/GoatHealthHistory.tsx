/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Calendar, AlertCircle, CheckCircle, Clock, Brain, Lightbulb } from 'lucide-react';
import { Goat, HealthRecord } from '@/types/goat';
import { healthAI } from '@/lib/healthAI';

interface GoatHealthHistoryProps {
  goat: Goat;
  healthRecords: HealthRecord[];
}

export default function GoatHealthHistory({ goat, healthRecords }: GoatHealthHistoryProps) {
  const [activeTab, setActiveTab] = useState('records');
  const [symptomInput, setSymptomInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const sortedRecords = healthRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vaccination': return 'bg-primary/10 text-primary';
      case 'treatment': return 'bg-destructive/10 text-destructive';
      case 'checkup': return 'bg-success/10 text-success';
      case 'deworming': return 'bg-secondary/10 text-secondary';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-primary" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <CheckCircle className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-primary/10 text-primary';
      case 'scheduled': return 'bg-secondary/10 text-secondary';
      case 'overdue': return 'bg-destructive/10 text-destructive';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const handleSymptomAnalysis = () => {
    if (symptomInput.trim()) {
      const aiSuggestions = healthAI.getSuggestions(symptomInput);
      setSuggestions(aiSuggestions);
    }
  };

  const calculateAge = (birthDate: Date): number => {
    const now = new Date();
    const ageMs = now.getTime() - new Date(birthDate).getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44)); // months
  };

  const vaccinationSchedule = healthAI.getVaccinationSchedule(calculateAge(goat.birthDate));
  const healthReport = healthAI.generateHealthReport(goat.id, healthRecords);

  // Group records by year/month
  const groupedRecords = sortedRecords.reduce((acc, record) => {
    const date = new Date(record.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!acc[key]) {
      acc[key] = { monthYear, records: [] };
    }
    acc[key].records.push(record);
    return acc;
  }, {} as Record<string, { monthYear: string; records: HealthRecord[] }>);

  return (
    <div className="space-y-6">
      {/* Health Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {healthRecords.filter(r => r.type === 'vaccination').length}
            </p>
            <p className="text-xs text-muted-foreground">Vaccinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {healthRecords.filter(r => r.type === 'treatment').length}
            </p>
            <p className="text-xs text-muted-foreground">Treatments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {healthRecords.filter(r => r.type === 'checkup').length}
            </p>
            <p className="text-xs text-muted-foreground">Checkups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {healthReport.healthScore}
            </p>
            <p className="text-xs text-muted-foreground">Health Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrated Health & AI Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="records">Health Records</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="schedule">Vaccination Schedule</TabsTrigger>
          <TabsTrigger value="insights">Health Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5" />
                <span>Health Timeline</span>
                <Badge variant="outline">{healthRecords.length} records</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedRecords).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedRecords).map(([key, group]) => (
                    <div key={key} className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{group.monthYear}</span>
                      </h4>
                      <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                        {group.records.map((record) => (
                          <div key={record.id} className="bg-card border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className={getTypeColor(record.type)}>
                                  {record.type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className={getStatusColor(record.status)}>
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(record.status)}
                                    <span>{record.status || 'completed'}</span>
                                  </div>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <p className="font-medium mb-2">{record.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              {record.medicine && (
                                <p><span className="font-medium">Medicine:</span> {record.medicine}</p>
                              )}
                              {record.veterinarian && (
                                <p><span className="font-medium">Vet:</span> {record.veterinarian}</p>
                              )}
                            </div>
                            
                            {record.nextDueDate && (
                              <div className="mt-2 p-2 bg-primary/5 rounded">
                                <p className="text-sm">
                                  <span className="font-medium">Next Due:</span> {new Date(record.nextDueDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            
                            {record.notes && (
                              <div className="mt-2 p-2 bg-muted/50 rounded">
                                <p className="text-sm italic">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No health records found</p>
                  <p className="text-sm">Start tracking {goat.name}'s health to maintain proper care</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Health Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe symptoms or concerns:</label>
                <Textarea
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="e.g., coughing, loss of appetite, diarrhea..."
                  className="min-h-[100px]"
                />
                <Button onClick={handleSymptomAnalysis} className="w-full">
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Symptoms
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>AI Recommendations</span>
                  </h4>
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      suggestion.urgency === 'high' ? 'border-destructive bg-destructive/5' :
                      suggestion.urgency === 'medium' ? 'border-primary bg-primary/5' :
                      'border-muted bg-muted/5'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{suggestion.condition}</h5>
                        <Badge variant={
                          suggestion.urgency === 'high' ? 'destructive' :
                          suggestion.urgency === 'medium' ? 'default' : 'secondary'
                        }>
                          {suggestion.urgency} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Matching symptoms:</strong> {suggestion.symptoms.join(', ')}
                      </p>
                      <p className="text-sm mb-2">{suggestion.recommendation}</p>
                      {suggestion.recommendedTreatment && (
                        <p className="text-sm text-primary">
                          <strong>Treatment:</strong> {suggestion.recommendedTreatment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Vaccination Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vaccinationSchedule.map((vaccine, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{vaccine.name}</h4>
                      <p className="text-sm text-muted-foreground">{vaccine.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{vaccine.ageRecommendation}</p>
                      <p className="text-xs text-muted-foreground">{vaccine.frequency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Insights for {goat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-medium mb-2">Health Score: {healthReport.healthScore}/100</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on vaccination history, treatment frequency, and checkup regularity
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-card border rounded">
                    <p className="text-sm text-muted-foreground">Last Vaccination</p>
                    <p className="font-medium">
                      {healthReport.lastVaccination ? 
                        new Date(healthReport.lastVaccination.date).toLocaleDateString() : 
                        'No records'
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-card border rounded">
                    <p className="text-sm text-muted-foreground">Recent Treatments</p>
                    <p className="font-medium">{healthReport.recentTreatments.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
