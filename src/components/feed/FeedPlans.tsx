import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Save, X, Calendar } from 'lucide-react';
import { Feed, FeedPlan, FeedPlanItem } from '@/types/goat';
import { toast } from 'sonner';

interface FeedPlansProps {
  feeds: Feed[];
  feedPlans: FeedPlan[];
  onAddFeedPlan: (plan: Omit<FeedPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateFeedPlan: (id: string, updates: Partial<FeedPlan>) => void;
  onDeleteFeedPlan: (id: string) => void;
}

export default function FeedPlans({ feeds, feedPlans, onAddFeedPlan, onUpdateFeedPlan, onDeleteFeedPlan }: FeedPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<FeedPlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<FeedPlan, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    goatIds: [],
    feeds: [],
    feeds: [],
    groupType: 'adults',
    isActive: true,
    startDate: new Date(),
    totalCostPerDay: 0
  });

  const [newFeedItem, setNewFeedItem] = useState({
    feedId: '',
    amountPerDay: 0,
    frequency: 1
  });

  // Calculate total cost when feed items change
  useEffect(() => {
    const totalCost = formData.feeds.reduce((sum, item) => {
      const feed = feeds.find(f => f.id === item.feedId);
      return sum + (feed ? feed.costPerKg * item.amountPerDay : 0);
    }, 0);
    
    setFormData(prev => ({ ...prev, totalCostPerDay: totalCost }));
  }, [formData.feeds, feeds]);

  const addFeedToList = () => {
    if (!newFeedItem.feedId || newFeedItem.amountPerDay <= 0) {
      toast.error('Please select a feed and enter valid amount');
      return;
    }

    const feed = feeds.find(f => f.id === newFeedItem.feedId);
    if (!feed) return;

    const feedItem: FeedPlanItem = {
      feedId: newFeedItem.feedId,
      amount: newFeedItem.amountPerDay,
      amountPerDay: newFeedItem.amountPerDay,
      unit: 'kg',
      frequency: 'daily' as const,
      timesPerDay: newFeedItem.frequency
    };

    setFormData(prev => ({
      ...prev,
      feeds: [...prev.feeds, feedItem]
    }));

    setNewFeedItem({ feedId: '', amountPerDay: 0, frequency: 1 });
    toast.success('Feed added to plan');
  };

  const removeFeedFromList = (index: number) => {
    setFormData(prev => ({
      ...prev,
      feeds: prev.feeds.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedPlan) {
        await onUpdateFeedPlan(selectedPlan.id, formData);
        toast.success('Feed plan updated successfully');
      } else {
        await onAddFeedPlan(formData);
        toast.success('Feed plan created successfully');
      }
      
      resetForm();
    } catch (error) {
      toast.error('Failed to save feed plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      goatIds: [],
      feeds: [],
      feeds: [],
      groupType: 'adults',
      isActive: true,
      startDate: new Date(),
      totalCostPerDay: 0
    });
    setNewFeedItem({ feedId: '', amountPerDay: 0, frequency: 1 });
    setSelectedPlan(null);
    setIsFormOpen(false);
  };

  const handleEdit = (plan: FeedPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      goatIds: plan.goatIds,
      feeds: plan.feeds,
      feeds: plan.feeds || plan.feeds,
      groupType: plan.groupType || 'adults',
      isActive: plan.isActive,
      startDate: plan.startDate,
      endDate: plan.endDate,
      totalCostPerDay: plan.totalCostPerDay || 0
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this feed plan?')) {
      try {
        await onDeleteFeedPlan(planId);
        toast.success('Feed plan deleted successfully');
      } catch (error) {
        toast.error('Failed to delete feed plan');
      }
    }
  };

  const groupTypeColors = {
    kids: 'bg-blue-100 text-blue-800',
    adults: 'bg-green-100 text-green-800',
    lactating: 'bg-pink-100 text-pink-800',
    bucks: 'bg-purple-100 text-purple-800',
    pregnant: 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Feed Plans</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage feeding schedules for different goat groups
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Feed Plan
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPlan ? 'Edit Feed Plan' : 'Create New Feed Plan'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Lactating Does Summer Plan"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groupType">Group Type</Label>
                  <Select
                    value={formData.groupType}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, groupType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kids">Kids</SelectItem>
                      <SelectItem value="adults">Adults</SelectItem>
                      <SelectItem value="lactating">Lactating Does</SelectItem>
                      <SelectItem value="bucks">Bucks</SelectItem>
                      <SelectItem value="pregnant">Pregnant Does</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Feed Items</h4>
                
                {/* Add new feed item */}
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div className="space-y-2">
                    <Label>Feed</Label>
                    <Select
                      value={newFeedItem.feedId}
                      onValueChange={(value) => setNewFeedItem(prev => ({ ...prev, feedId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select feed" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeds.map(feed => (
                          <SelectItem key={feed.id} value={feed.id}>
                            {feed.name} (${feed.costPerKg}/kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Amount (kg/day)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newFeedItem.amountPerDay}
                      onChange={(e) => setNewFeedItem(prev => ({ ...prev, amountPerDay: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={newFeedItem.frequency.toString()}
                      onValueChange={(value) => setNewFeedItem(prev => ({ ...prev, frequency: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x daily</SelectItem>
                        <SelectItem value="2">2x daily</SelectItem>
                        <SelectItem value="3">3x daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button type="button" onClick={addFeedToList}>
                    Add
                  </Button>
                </div>

                {/* Current feed items */}
                {formData.feeds.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Current Feed Items:</h5>
                    {formData.feeds.map((item, index) => {
                      const feed = feeds.find(f => f.id === item.feedId);
                      const dailyCost = feed ? feed.costPerKg * item.amountPerDay : 0;
                      
                      return (
                        <div
                          key={`${item.feedId}-${index}`}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{feed?.name || 'Unknown Feed'}</span>
                            <div className="text-sm text-muted-foreground">
                              {item.amountPerDay}kg/day • {item.frequency}x daily • ${dailyCost.toFixed(2)}/day
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeedFromList(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                    
                    <div className="text-right">
                      <span className="font-medium">
                        Total Cost: ${formData.totalCostPerDay.toFixed(2)}/day
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={formData.feeds.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  {selectedPlan ? 'Update' : 'Create'} Plan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">All Plans</TabsTrigger>
          <TabsTrigger value="calendar">Schedule View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {feedPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Feed Plans Yet</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Create your first feed plan to organize feeding schedules
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Feed Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {feedPlans.map(plan => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={groupTypeColors[plan.groupType]}>
                            {plan.groupType.charAt(0).toUpperCase() + plan.groupType.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ${plan.totalCostPerDay.toFixed(2)}/day
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feed</TableHead>
                          <TableHead>Amount/Day</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Cost/Day</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.feeds.map((item, index) => {
                          const feed = feeds.find(f => f.id === item.feedId);
                          const dailyCost = feed ? feed.costPerKg * item.amountPerDay : 0;
                          
                          return (
                            <TableRow key={`${item.feedId}-${index}`}>
                              <TableCell className="font-medium">
                                {feed?.name || 'Unknown Feed'}
                              </TableCell>
                              <TableCell>{item.amountPerDay} kg</TableCell>
                              <TableCell>{item.frequency}x daily</TableCell>
                              <TableCell>${dailyCost.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Schedule View Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Calendar view for feed schedules will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}