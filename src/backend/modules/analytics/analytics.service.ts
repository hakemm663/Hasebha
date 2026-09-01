import { getSupabaseAdmin } from '../../common/supabase-admin';

export interface BusinessAnalyticsSummary {
  totalRevenue: number;
  totalCollected: number;
  totalExpenses: number;
  netIncome: number;
  totalOutstanding: number;
  totalOverdue: number;
  outstandingCount: number;
  overdueCount: number;
  paidInvoicesCount: number;
  collectionRate: number;
  avgDaysToGetPaid: number;
  currency: string;
  monthlyRevenueTrend: Array<{ month: string; invoiced: number; collected: number }>;
  monthlyExpenseTrend: Array<{ month: string; amount: number }>;
  categoryExpenseBreakdown: Array<{ category: string; amount: number; percentage: number }>;
}

export class AnalyticsService {
  private supabase = getSupabaseAdmin();

  async getBusinessSummary(businessId: string): Promise<BusinessAnalyticsSummary> {
    // 1. Fetch Invoices
    const { data: invoices, error: invError } = await this.supabase
      .from('invoices')
      .select('id, total, amount_paid, status, issue_date, due_date, paid_at, created_at')
      .eq('business_id', businessId);

    if (invError) {
      throw new Error(`Failed to fetch invoices for analytics: ${invError.message}`);
    }

    // 2. Fetch Expenses
    const { data: expenses, error: expError } = await this.supabase
      .from('expenses')
      .select('id, amount, category_name, expense_date')
      .eq('business_id', businessId)
      .eq('is_archived', false);

    if (expError) {
      throw new Error(`Failed to fetch expenses for analytics: ${expError.message}`);
    }

    const allInvoices = invoices || [];
    const allExpenses = expenses || [];
    const todayStr = new Date().toISOString().split('T')[0];

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let outstandingCount = 0;
    let overdueCount = 0;
    let paidInvoicesCount = 0;
    let totalDaysToPaid = 0;
    let paidCountWithDates = 0;

    const monthlyRevenueMap: Record<string, { invoiced: number; collected: number }> = {};

    allInvoices.forEach((inv) => {
      const invTotal = Number(inv.total || 0);
      const invPaid = Number(inv.amount_paid || 0);
      const invOutstanding = Math.max(0, invTotal - invPaid);

      totalRevenue += invTotal;
      totalCollected += invPaid;

      const isOverdue =
        (inv.status === 'OVERDUE' || (inv.status === 'SENT' && inv.due_date < todayStr)) &&
        invOutstanding > 0;

      if (invPaid >= invTotal && invTotal > 0) {
        paidInvoicesCount++;
        if (inv.issue_date && inv.paid_at) {
          const issueTime = new Date(inv.issue_date).getTime();
          const paidTime = new Date(inv.paid_at).getTime();
          const diffDays = Math.max(1, Math.round((paidTime - issueTime) / (1000 * 3600 * 24)));
          totalDaysToPaid += diffDays;
          paidCountWithDates++;
        }
      } else if (isOverdue) {
        overdueCount++;
        totalOverdue += invOutstanding;
        totalOutstanding += invOutstanding;
      } else if (invOutstanding > 0) {
        outstandingCount++;
        totalOutstanding += invOutstanding;
      }

      // Group by month
      const month = (inv.issue_date || inv.created_at || '').substring(0, 7);
      if (month) {
        if (!monthlyRevenueMap[month]) {
          monthlyRevenueMap[month] = { invoiced: 0, collected: 0 };
        }
        monthlyRevenueMap[month].invoiced += invTotal;
        monthlyRevenueMap[month].collected += invPaid;
      }
    });

    // 3. Expenses calculations
    let totalExpenses = 0;
    const categoryMap: Record<string, number> = {};
    const monthlyExpenseMap: Record<string, number> = {};

    allExpenses.forEach((exp) => {
      const amount = Number(exp.amount || 0);
      totalExpenses += amount;

      const cat = exp.category_name || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + amount;

      const month = (exp.expense_date || '').substring(0, 7);
      if (month) {
        monthlyExpenseMap[month] = (monthlyExpenseMap[month] || 0) + amount;
      }
    });

    const netIncome = totalCollected - totalExpenses;
    const collectionRate =
      totalRevenue > 0 ? Math.min(100, Math.round((totalCollected / totalRevenue) * 100)) : 100;
    const avgDaysToGetPaid =
      paidCountWithDates > 0 ? Math.round(totalDaysToPaid / paidCountWithDates) : 6;

    const monthlyRevenueTrend = Object.entries(monthlyRevenueMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, invoiced: data.invoiced, collected: data.collected }));

    const monthlyExpenseTrend = Object.entries(monthlyExpenseMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    const categoryExpenseBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }));

    return {
      totalRevenue,
      totalCollected,
      totalExpenses,
      netIncome,
      totalOutstanding,
      totalOverdue,
      outstandingCount,
      overdueCount,
      paidInvoicesCount,
      collectionRate,
      avgDaysToGetPaid,
      currency: 'EGP',
      monthlyRevenueTrend,
      monthlyExpenseTrend,
      categoryExpenseBreakdown,
    };
  }
}
