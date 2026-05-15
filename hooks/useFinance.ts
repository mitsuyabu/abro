import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { FinancialAccount, FinancialTransaction, FinanceProvider, TransactionCategory } from '@/types';

export function useFinance() {
  const { user } = useAuthStore();

  const fetchAccounts = async (): Promise<FinancialAccount[]> => {
    if (!user) return [];
    const { data } = await (supabase as any)
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    return (data ?? []) as FinancialAccount[];
  };

  const addAccount = async (params: {
    provider: FinanceProvider;
    label: string;
    currency?: string;
  }): Promise<FinancialAccount | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('financial_accounts')
      .insert({ user_id: user.id, currency: 'JPY', ...params })
      .select()
      .single();
    if (error) return null;
    return data as FinancialAccount;
  };

  const deleteAccount = async (accountId: string): Promise<void> => {
    await (supabase as any).from('financial_accounts').delete().eq('id', accountId);
  };

  const fetchTransactions = async (accountId?: string, limit = 100): Promise<FinancialTransaction[]> => {
    if (!user) return [];
    let query = (supabase as any)
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit);
    if (accountId) query = query.eq('account_id', accountId);
    const { data } = await query;
    return (data ?? []) as FinancialTransaction[];
  };

  const addTransaction = async (params: {
    account_id: string;
    amount_local: number;
    currency: string;
    amount_jpy?: number;
    category: TransactionCategory;
    merchant?: string;
    note?: string;
    date: string;
  }): Promise<FinancialTransaction | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('transactions')
      .insert({ user_id: user.id, ...params })
      .select()
      .single();
    if (error) return null;
    return data as FinancialTransaction;
  };

  const deleteTransaction = async (txId: string): Promise<void> => {
    await (supabase as any).from('transactions').delete().eq('id', txId);
  };

  const fetchMonthlySummary = async (year: number, month: number): Promise<Record<TransactionCategory, number>> => {
    if (!user) return {} as Record<TransactionCategory, number>;
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const { data } = await (supabase as any)
      .from('transactions')
      .select('category, amount_jpy, amount_local, currency')
      .eq('user_id', user.id)
      .gte('date', from)
      .lt('date', nextMonth);

    const summary = {} as Record<TransactionCategory, number>;
    for (const tx of (data ?? []) as FinancialTransaction[]) {
      const jpy = tx.amount_jpy ?? tx.amount_local;
      summary[tx.category] = (summary[tx.category] ?? 0) + jpy;
    }
    return summary;
  };

  return { fetchAccounts, addAccount, deleteAccount, fetchTransactions, addTransaction, deleteTransaction, fetchMonthlySummary };
}
