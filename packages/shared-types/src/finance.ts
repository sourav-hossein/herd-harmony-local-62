
export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: Date;
  description: string;
  receiptPath?: string;
  goatId?: string;
  healthRecordId?: string;
  feedLogId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
  topIncomeCategories: Array<{ category: string; amount: number }>;
  monthlyTrends: Array<{ month: string; income: number; expenses: number }>;
}

export interface GoatProfitability {
  goatId: string;
  goatName: string;
  totalCost: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
}

export interface FinanceInsight {
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  description: string;
  action?: string;
}
