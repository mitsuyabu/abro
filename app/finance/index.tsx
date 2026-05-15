import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MonthlyReport } from '@/components/finance/MonthlyReport';
import { TransactionCard, CATEGORY_META } from '@/components/finance/TransactionCard';
import { useFinance } from '@/hooks/useFinance';
import type { FinancialAccount, FinancialTransaction, FinanceProvider, TransactionCategory } from '@/types';

const PROVIDERS: Array<{ value: FinanceProvider; emoji: string; label: string }> = [
  { value: 'wise', emoji: '💚', label: 'Wise' },
  { value: 'revolut', emoji: '🔵', label: 'Revolut' },
  { value: 'manual', emoji: '📝', label: '手動入力' },
  { value: 'other', emoji: '🏦', label: 'その他' },
];

const TX_CATEGORIES = Object.entries(CATEGORY_META) as [TransactionCategory, { emoji: string; label: string }][];

export default function FinanceScreen() {
  const router = useRouter();
  const { fetchAccounts, addAccount, deleteAccount, fetchTransactions, addTransaction, deleteTransaction, fetchMonthlySummary } = useFinance();

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<Partial<Record<TransactionCategory, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);

  const now = new Date();
  const [reportYear] = useState(now.getFullYear());
  const [reportMonth] = useState(now.getMonth() + 1);

  const load = useCallback(async () => {
    const [accs, txs, sum] = await Promise.all([
      fetchAccounts(),
      fetchTransactions(selectedAccountId),
      fetchMonthlySummary(reportYear, reportMonth),
    ]);
    setAccounts(accs);
    setTransactions(txs);
    setSummary(sum);
  }, [fetchAccounts, fetchTransactions, fetchMonthlySummary, selectedAccountId, reportYear, reportMonth]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const handleDeleteAccount = (acc: FinancialAccount) => {
    Alert.alert('削除', `「${acc.label}」を削除しますか？\n紐付く取引もすべて削除されます。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: async () => {
          await deleteAccount(acc.id);
          setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
          if (selectedAccountId === acc.id) setSelectedAccountId(undefined);
        },
      },
    ]);
  };

  const handleDeleteTx = async (txId: string) => {
    await deleteTransaction(txId);
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">家計簿</Text>
        <Pressable
          className="px-3 py-1.5 bg-primary rounded-full active:opacity-80"
          onPress={() => accounts.length > 0 ? setShowAddTx(true) : setShowAddAccount(true)}
          accessibilityLabel="追加"
        >
          <Text className="text-white text-xs font-semibold">+ 追加</Text>
        </Pressable>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4 gap-3"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View className="gap-4 mb-2">
            {/* 口座一覧 */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-primary">口座・ウォレット</Text>
                <Pressable onPress={() => setShowAddAccount(true)} className="active:opacity-70">
                  <Text className="text-primary text-xs font-medium">+ 追加</Text>
                </Pressable>
              </View>
              {accounts.length === 0 ? (
                <Pressable
                  className="bg-white border border-dashed border-border rounded-2xl p-4 items-center gap-1 active:opacity-70"
                  onPress={() => setShowAddAccount(true)}
                >
                  <Text className="text-muted text-sm">口座を追加しましょう</Text>
                  <Text className="text-muted text-xs">Wise・Revolut・手動入力に対応</Text>
                </Pressable>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2">
                  <Pressable
                    className={`px-3 py-2 rounded-xl border ${!selectedAccountId ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                    onPress={() => setSelectedAccountId(undefined)}
                  >
                    <Text className={`text-xs font-medium ${!selectedAccountId ? 'text-white' : 'text-primary'}`}>すべて</Text>
                  </Pressable>
                  {accounts.map((acc) => {
                    const prov = PROVIDERS.find((p) => p.value === acc.provider);
                    const active = selectedAccountId === acc.id;
                    return (
                      <Pressable
                        key={acc.id}
                        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${active ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                        onPress={() => setSelectedAccountId(acc.id)}
                        onLongPress={() => handleDeleteAccount(acc)}
                      >
                        <Text className="text-sm">{prov?.emoji ?? '🏦'}</Text>
                        <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-primary'}`}>{acc.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* 月次レポート */}
            <View className="bg-white border border-border rounded-2xl p-4">
              <MonthlyReport summary={summary} />
            </View>

            <Text className="text-sm font-semibold text-primary">取引一覧</Text>
          </View>
        }
        ListEmptyComponent={
          <View className="py-12 items-center gap-2">
            <Text className="text-3xl">📒</Text>
            <Text className="text-muted text-sm">取引がありません</Text>
            {accounts.length > 0 && (
              <Pressable className="mt-2 bg-primary rounded-xl px-5 py-2.5 active:opacity-80" onPress={() => setShowAddTx(true)}>
                <Text className="text-white text-sm font-semibold">取引を追加する</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TransactionCard tx={item} onDelete={() => handleDeleteTx(item.id)} />
        )}
      />

      {/* 口座追加モーダル */}
      <AddAccountModal
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAdded={(acc) => { setAccounts((prev) => [...prev, acc]); setShowAddAccount(false); }}
      />

      {/* 取引追加モーダル */}
      {accounts.length > 0 && (
        <AddTransactionModal
          visible={showAddTx}
          accounts={accounts}
          onClose={() => setShowAddTx(false)}
          onAdded={(tx) => { setTransactions((prev) => [tx, ...prev]); setShowAddTx(false); }}
        />
      )}
    </SafeAreaView>
  );
}

/* ── 口座追加モーダル ── */
function AddAccountModal({ visible, onClose, onAdded }: {
  visible: boolean;
  onClose: () => void;
  onAdded: (acc: FinancialAccount) => void;
}) {
  const { addAccount } = useFinance();
  const [provider, setProvider] = useState<FinanceProvider>('manual');
  const [label, setLabel] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = label.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    const acc = await addAccount({ provider, label: label.trim(), currency: currency.trim() || 'JPY' });
    setIsSaving(false);
    if (acc) { setLabel(''); setCurrency('JPY'); onAdded(acc); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={onClose}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">口座を追加</Text>
            <Pressable className={`px-4 py-1.5 rounded-full ${canSave && !isSaving ? 'bg-primary' : 'bg-border'}`} onPress={handleSave} disabled={!canSave || isSaving}>
              <Text className={`text-xs font-semibold ${canSave && !isSaving ? 'text-white' : 'text-muted'}`}>{isSaving ? '保存中...' : '保存'}</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            <Text className="text-xs font-semibold text-muted mb-2">種別</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {PROVIDERS.map((p) => (
                <Pressable key={p.value} className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${provider === p.value ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => setProvider(p.value)}>
                  <Text className="text-xs">{p.emoji}</Text>
                  <Text className={`text-xs font-medium ${provider === p.value ? 'text-white' : 'text-primary'}`}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-xs font-semibold text-muted mb-1.5">名前 *</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: Wiseメイン口座" placeholderTextColor="#A0A0A0" value={label} onChangeText={setLabel} maxLength={50} />
            <Text className="text-xs font-semibold text-muted mb-1.5">通貨</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="JPY / AUD / GBP..." placeholderTextColor="#A0A0A0" value={currency} onChangeText={setCurrency} maxLength={10} autoCapitalize="characters" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/* ── 取引追加モーダル ── */
function AddTransactionModal({ visible, accounts, onClose, onAdded }: {
  visible: boolean;
  accounts: FinancialAccount[];
  onClose: () => void;
  onAdded: (tx: FinancialTransaction) => void;
}) {
  const { addTransaction } = useFinance();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [amountText, setAmountText] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  const canSave = amountText.trim().length > 0 && accountId;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    const amount = parseFloat(amountText.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) return;
    setIsSaving(true);
    const acc = accounts.find((a) => a.id === accountId);
    const tx = await addTransaction({
      account_id: accountId,
      amount_local: amount,
      currency: acc?.currency ?? 'JPY',
      amount_jpy: acc?.currency === 'JPY' ? amount : undefined,
      category,
      merchant: merchant.trim() || undefined,
      note: note.trim() || undefined,
      date,
    });
    setIsSaving(false);
    if (tx) { setAmountText(''); setMerchant(''); setNote(''); onAdded(tx); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={onClose}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">取引を追加</Text>
            <Pressable className={`px-4 py-1.5 rounded-full ${canSave && !isSaving ? 'bg-primary' : 'bg-border'}`} onPress={handleSave} disabled={!canSave || isSaving}>
              <Text className={`text-xs font-semibold ${canSave && !isSaving ? 'text-white' : 'text-muted'}`}>{isSaving ? '保存中...' : '保存'}</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            {/* 口座 */}
            <Text className="text-xs font-semibold text-muted mb-2">口座</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {accounts.map((acc) => (
                <Pressable key={acc.id} className={`px-3 py-1.5 rounded-full border ${accountId === acc.id ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => setAccountId(acc.id)}>
                  <Text className={`text-xs font-medium ${accountId === acc.id ? 'text-white' : 'text-primary'}`}>{acc.label}</Text>
                </Pressable>
              ))}
            </View>
            {/* カテゴリ */}
            <Text className="text-xs font-semibold text-muted mb-2">カテゴリ</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {TX_CATEGORIES.map(([cat, meta]) => (
                <Pressable key={cat} className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${category === cat ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => setCategory(cat)}>
                  <Text className="text-xs">{meta.emoji}</Text>
                  <Text className={`text-xs font-medium ${category === cat ? 'text-white' : 'text-primary'}`}>{meta.label}</Text>
                </Pressable>
              ))}
            </View>
            {/* 金額 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">金額 *</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: 1500" placeholderTextColor="#A0A0A0" value={amountText} onChangeText={setAmountText} keyboardType="numeric" maxLength={12} />
            {/* 店名 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">店名・支払先</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: Woolworths" placeholderTextColor="#A0A0A0" value={merchant} onChangeText={setMerchant} maxLength={100} />
            {/* 日付 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">日付</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="YYYY-MM-DD" placeholderTextColor="#A0A0A0" value={date} onChangeText={setDate} maxLength={10} />
            {/* メモ */}
            <Text className="text-xs font-semibold text-muted mb-1.5">メモ</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="任意メモ" placeholderTextColor="#A0A0A0" value={note} onChangeText={setNote} maxLength={200} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
