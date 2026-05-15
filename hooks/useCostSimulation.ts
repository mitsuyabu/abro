import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useCostStore } from '@/stores/cost';
import type { CostCategory, CostFrequency, CostItem, CostSimulation } from '@/types';

export function useCostSimulation() {
  const store = useCostStore();

  const createSimulation = useCallback(async (planId?: string): Promise<CostSimulation | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('cost_simulations') as any)
      .insert({ user_id: user.id, plan_id: planId ?? null })
      .select()
      .single();

    if (error || !data) return null;
    const sim = data as CostSimulation;
    store.setSimulation(sim);
    store.setItems([]);
    return sim;
  }, [store]);

  const fetchSimulation = useCallback(async (simulationId: string) => {
    store.setIsLoading(true);
    const [{ data: simData }, { data: itemsData }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('cost_simulations') as any).select('*').eq('id', simulationId).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('cost_items') as any)
        .select('*')
        .eq('simulation_id', simulationId)
        .order('order_index'),
    ]);

    if (simData) store.setSimulation(simData as CostSimulation);
    if (itemsData) store.setItems(itemsData as CostItem[]);
    store.setIsLoading(false);
  }, [store]);

  const fetchOrCreateByPlan = useCallback(async (planId: string): Promise<CostSimulation | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('cost_simulations') as any)
      .select('*')
      .eq('plan_id', planId)
      .maybeSingle();

    if (existing) {
      await fetchSimulation((existing as CostSimulation).id);
      return existing as CostSimulation;
    }
    return createSimulation(planId);
  }, [createSimulation, fetchSimulation]);

  const addItem = useCallback(async (
    simulationId: string,
    data: {
      category: CostCategory;
      label: string;
      amount_jpy: number;
      frequency: CostFrequency;
      duration: number;
      note?: string;
    },
    orderIndex = 0,
  ): Promise<CostItem | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: item, error } = await (supabase.from('cost_items') as any)
      .insert({
        simulation_id: simulationId,
        category: data.category,
        label: data.label,
        amount_jpy: data.amount_jpy,
        frequency: data.frequency,
        duration: data.duration,
        note: data.note ?? null,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (error || !item) return null;
    store.addItem(item as CostItem);
    return item as CostItem;
  }, [store]);

  const updateItem = useCallback(async (
    id: string,
    updates: Partial<Pick<CostItem, 'label' | 'amount_jpy' | 'frequency' | 'duration' | 'note'>>,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('cost_items') as any).update(updates).eq('id', id);
    store.updateItem(id, updates);
  }, [store]);

  const deleteItem = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('cost_items') as any).delete().eq('id', id);
    store.removeItem(id);
  }, [store]);

  return {
    ...store,
    createSimulation,
    fetchSimulation,
    fetchOrCreateByPlan,
    addItem,
    updateItem,
    deleteItem,
  };
}
