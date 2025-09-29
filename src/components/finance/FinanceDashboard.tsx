import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Info,
  Plus,
  Download,
  Pencil,
  Trash2
} from 'lucide-react';
import { useGoatData } from '@/hooks/useDatabase';
import { FinanceAI } from '@/lib/financeAI';
import { FinanceRecord, FinanceStats, GoatProfitability } from '@/types/finance';
import { FinanceForm } from './FinanceForm';
import { useGoatContext } from '@/context/GoatContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from 'date-fns';

export default function FinanceDashboard() {
  const {addFinanceRecord,updateFinanceRecord,deleteFinanceRecord,financeRecords,setFinanceRecords}=useGoatContext()
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [goatProfitability, setGoatProfitability] = useState<GoatProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [currentTab, setCurrentTab] = useState('overview');

  const { goats } = useGoatData();

  const calculateStats = useCallback((records: FinanceRecord[]): FinanceStats => {
    const totalIncome = records
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpenses = records
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const netProfit = totalIncome - totalExpenses;
    
    // Calculate category totals
    const expenseCategories: { [key: string]: number } = {};
    const incomeCategories: { [key: string]: number } = {};
    
    records.forEach(record => {
      if (record.type === 'expense') {
        expenseCategories[record.category] = (expenseCategories[record.category] || 0) + record.amount;
      } else {
        incomeCategories[record.category] = (incomeCategories[record.category] || 0) + record.amount;
      }
    });
    
    const topExpenseCategories = Object.entries(expenseCategories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    const topIncomeCategories = Object.entries(incomeCategories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Calculate monthly trends
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    records.forEach(record => {
      const month = new Date(record.date).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      
      if (record.type === 'income') {
        monthlyData[month].income += record.amount;
      } else {
        monthlyData[month].expenses += record.amount;
      }
    });
    
    const monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      topExpenseCategories,
      topIncomeCategories,
      monthlyTrends
    };
  }, []);

  const calculateGoatProfitability = useCallback((records: FinanceRecord[]): GoatProfitability[] => {
    const goatData: { [key: string]: { costs: number; revenue: number } } = {};
    
    records.forEach(record => {
      if (record.goatId) {
        if (!goatData[record.goatId]) {
          goatData[record.goatId] = { costs: 0, revenue: 0 };
        }
        
        if (record.type === 'expense') {
          goatData[record.goatId].costs += record.amount;
        } else {
          goatData[record.goatId].revenue += record.amount;
        }
      }
    });
    
    return Object.entries(goatData).map(([goatId, data]) => {
      const goat = goats.find(g => g.id === goatId);
      const netProfit = data.revenue - data.costs;
      const profitMargin = data.revenue > 0 ? (netProfit / data.revenue) * 100 : 0;
      
      return {
        goatId,
        goatName: goat?.name || 'Unknown',
        totalCost: data.costs,
        totalRevenue: data.revenue,
        netProfit,
        profitMargin
      };
    }).sort((a, b) => b.netProfit - a.netProfit);
  }, [goats]);

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      const calculatedStats = calculateStats(financeRecords);
      setStats(calculatedStats);

      const profitability = calculateGoatProfitability(financeRecords);
      setGoatProfitability(profitability);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [financeRecords, calculateStats, calculateGoatProfitability]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);
  
  const insights = stats ? FinanceAI.generateInsights(financeRecords, stats) : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }
//  onSubmit: (record: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;

const handleOnSubmit = async (record: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    await addFinanceRecord(record);
    setShowAddForm(false);
    loadFinanceData(); // Refresh data after adding
  } catch (error) {
    console.error('Failed to add record:', error);
  }
};

  const handleEdit = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setShowEditDialog(true);
  };

  const handleDelete = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleEditSubmit = async (record: Omit<FinanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!selectedRecord?.id) return;
      await updateFinanceRecord(selectedRecord.id, record);
      setShowEditDialog(false);
      loadFinanceData(); // Refresh data
    } catch (error) {
      console.error('Failed to update record:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteFinanceRecord(selectedRecord.id);
      setShowDeleteDialog(false);
      loadFinanceData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const updatedTabs = (
    <TabsList>
      <TabsTrigger 
        value="overview" 
        onClick={() => setCurrentTab('overview')}
      >
        Overview
      </TabsTrigger>
      <TabsTrigger 
        value="trends" 
        onClick={() => setCurrentTab('trends')}
      >
        Trends
      </TabsTrigger>
      <TabsTrigger 
        value="profitability" 
        onClick={() => setCurrentTab('profitability')}
      >
        Goat Profitability
      </TabsTrigger>
      <TabsTrigger 
        value="transactions" 
        onClick={() => setCurrentTab('transactions')}
      >
        Transactions
      </TabsTrigger>
    </TabsList>
  );

  const transactionsTab = (
    <TabsContent value="transactions">
      <Card>
        <CardHeader>
          <CardTitle>Financial Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financeRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                  <TableCell>
                    <Badge variant={record.type === 'income' ? 'default' : 'destructive'}>
                      {record.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>{formatCurrency(record.amount)}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );

  const editDialog = (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <FinanceForm
          initialData={selectedRecord}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditDialog(false)}
        />
      </DialogContent>
    </Dialog>
  );

  const deleteDialog = (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>
      {showAddForm && (
        <div>
          <FinanceForm 
            onCancel={() => setShowAddForm(false)} 
            onSubmit={handleOnSubmit} 
          />
        </div>
      )}
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.totalIncome || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats?.totalExpenses || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats?.netProfit || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Financial Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.action && (
                      <Badge variant="outline" className="mt-2">
                        {insight.action}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        {updatedTabs}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.topExpenseCategories || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {(stats?.topExpenseCategories || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.topIncomeCategories || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#82ca9d"
                      dataKey="amount"
                    >
                      {(stats?.topIncomeCategories || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#82ca9d" name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ff7300" name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability">
          <Card>
            <CardHeader>
              <CardTitle>Goat Profitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goatProfitability.map((goat, index) => (
                  <div key={goat.goatId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{goat.goatName}</h4>
                        <p className="text-sm text-gray-600">
                          Revenue: {formatCurrency(goat.totalRevenue)} | 
                          Costs: {formatCurrency(goat.totalCost)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${goat.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(goat.netProfit)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {goat.profitMargin.toFixed(1)}% margin
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {transactionsTab}
      </Tabs>

      {editDialog}
      {deleteDialog}
    </div>
  );
}
