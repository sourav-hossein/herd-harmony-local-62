
import React, { useState } from 'react';
import { Plus, BarChart3, TrendingUp, Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Feed, FeedPlan, FeedLog, Goat } from '@/types/goat';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface FeedUsageProps {
  feeds: Feed[];
  feedPlans: FeedPlan[];
  feedLogs: FeedLog[];
  goats: Goat[];
  onAddFeedLog: (log: Omit<FeedLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateFeedLog: (id: string, updates: Partial<FeedLog>) => void;
  onDeleteFeedLog: (id: string) => void;
}

export const FeedUsage: React.FC<FeedUsageProps> = ({
  feeds,
  feedPlans,
  feedLogs,
  goats,
  onAddFeedLog,
  onUpdateFeedLog,
  onDeleteFeedLog
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    goatId: '',
    feedId: '',
    date: new Date().toISOString().split('T')[0],
    amountUsed: 0,
    unit: 'kg',
    notes: ''
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFeedLog, setSelectedFeedLog] = useState<FeedLog | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FeedLog>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const feed = feeds.find(f => f.id === formData.feedId);
    const cost = feed ? feed.costPerKg * formData.amountUsed : 0;
    
    await onAddFeedLog({
      ...formData,
      date: new Date(formData.date),
      cost,
      notes: formData.notes
    });

    setShowForm(false);
    setFormData({
      goatId: '',
      feedId: '',
      date: new Date().toISOString().split('T')[0],
      amountUsed: 0,
      unit: 'kg',
      notes: ''
    });
  };

  const handleEditFeedLog = (log: FeedLog) => {
    setSelectedFeedLog(log);
    setEditFormData({
      goatId: log.goatId,
      feedId: log.feedId,
      date: new Date(log.date)[0],
      amountUsed: log.amountUsed, // Use 'amount' from FeedLog type
      notes: log.notes
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateFeedLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedLog) return;

    const feed = feeds.find(f => f.id === editFormData.feedId);
    const cost = feed ? feed.costPerKg * (editFormData.amountUsed || 0) : 0;

    await onUpdateFeedLog(selectedFeedLog.id, {
      ...editFormData,
      date: editFormData.date ? new Date(editFormData.date) : undefined,
      amountUsed: editFormData.amountUsed,
      cost,
    });
    setIsEditDialogOpen(false);
    setSelectedFeedLog(null);
    setEditFormData({});
  };

  const handleDeleteFeedLog = (id: string) => {
    onDeleteFeedLog(id);
  };

  // Calculate analytics data
  const monthlyUsage = feedLogs.reduce((acc, log) => {
    const month = new Date(log.date).toISOString().substring(0, 7);
    if (!acc[month]) {
      acc[month] = { month, amount: 0, cost: 0 };
    }
    acc[month].amount += log.amountUsed;
    acc[month].cost += log.cost;
    return acc;
  }, {} as Record<string, { month: string; amount: number; cost: number }>);

  const monthlyData = Object.values(monthlyUsage).sort((a, b) => a.month.localeCompare(b.month));

  const feedUsageByType = feeds.map(feed => {
    const usage = feedLogs
      .filter(log => log.feedId === feed.id)
      .reduce((sum, log) => sum + log.amountUsed, 0);
    
    return {
      name: feed.name,
      usage,
      cost: usage * feed.costPerKg
    };
  }).filter(item => item.usage > 0);

  const totalMonthlyUsage = feedLogs
    .filter(log => {
      const logDate = new Date(log.date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    })
    .reduce((sum, log) => sum + log.amountUsed, 0);

  const totalMonthlyCost = feedLogs
    .filter(log => {
      const logDate = new Date(log.date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    })
    .reduce((sum, log) => sum + log.cost, 0);

  const averageDailyUsage = totalMonthlyUsage / new Date().getDate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Feed Usage & Analytics</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Usage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Feed Usage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goatId">Goat</Label>
                  <Select 
                    value={formData.goatId} 
                    onValueChange={(value) => setFormData({...formData, goatId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select goat" />
                    </SelectTrigger>
                    <SelectContent>
                      {goats.filter(g => g.status === 'active').map(goat => (
                        <SelectItem key={goat.id} value={goat.id}>
                          {goat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="feedId">Feed</Label>
                  <Select 
                    value={formData.feedId} 
                    onValueChange={(value) => setFormData({...formData, feedId: value})}
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
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amountUsed">Amount Used (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.amountUsed}
                    onChange={(e) => setFormData({...formData, amountUsed: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Log Usage</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonthlyUsage.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Total feed consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total feed cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDailyUsage.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Average daily usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Usage Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Amount (kg)" />
                <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed Usage by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feedUsageByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#8884d8" name="Usage (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage Logs */}
      {/* Recent Usage Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Usage Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedLogs.slice(-10).reverse().map((log) => {
              const goat = goats.find(g => g.id === log.goatId);
              const feed = feeds.find(f => f.id === log.feedId);
              return (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{goat?.name || 'Unknown Goat'}</p>
                      <p className="text-sm text-muted-foreground">
                        {feed?.name || 'Unknown Feed'} • {new Date(log.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <div>
                      <p className="font-medium">{log.amountUsed} kg</p>
                      <p className="text-sm text-muted-foreground">${log.cost.toFixed(2)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditFeedLog(log)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteFeedLog(log.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Feed Usage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feed Usage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateFeedLog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editGoatId">Goat</Label>
                <Select 
                  value={editFormData.goatId} 
                  onValueChange={(value) => setEditFormData({...editFormData, goatId: value})}
                >
                  <SelectTrigger id="editGoatId">
                    <SelectValue placeholder="Select goat" />
                  </SelectTrigger>
                  <SelectContent>
                    {goats.filter(g => g.status === 'active').map(goat => (
                      <SelectItem key={goat.id} value={goat.id}>
                        {goat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editFeedId">Feed</Label>
                <Select 
                  value={editFormData.feedId} 
                  onValueChange={(value) => setEditFormData({...editFormData, feedId: value})}
                >
                  <SelectTrigger id="editFeedId">
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
              <div>
                <Label htmlFor="editDate">Date</Label>
                <Input
                  type="date"
                  id="editDate"
                  value={editFormData.date ? format(new Date(editFormData.date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEditFormData({...editFormData, date: new Date(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editAmount">Amount Used (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  id="editAmount"
                  value={editFormData.amountUsed || 0}
                  onChange={(e) => setEditFormData({...editFormData, amountUsed: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="editNotes">Notes (Optional)</Label>
                <Input
                  id="editNotes"
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Usage</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
