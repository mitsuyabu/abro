import { addDays, format } from 'date-fns';
import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { TASK_TEMPLATES } from '@/lib/task/defaults';
import { useTaskStore } from '@/stores/task';
import type { Task } from '@/types';

export function useTasks() {
  const store = useTaskStore();

  const fetchTasks = useCallback(async (planId?: string) => {
    store.setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { store.setIsLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('tasks') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (planId) query = query.eq('plan_id', planId);

    const { data } = await query;
    if (data) store.setTasks(data as Task[]);
    store.setIsLoading(false);
  }, [store]);

  const generateTasksForPlan = useCallback(async (
    planId: string,
    startDate: string | null,
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // 既にタスクがあれば生成しない
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('tasks') as any)
      .select('id')
      .eq('plan_id', planId)
      .limit(1);
    if (existing && existing.length > 0) return false;

    const base = startDate ? new Date(startDate) : null;

    const inserts = TASK_TEMPLATES.map((tmpl) => ({
      user_id: user.id,
      plan_id: planId,
      title: tmpl.title,
      description: tmpl.description ?? null,
      category: tmpl.category,
      due_date: base ? format(addDays(base, tmpl.offsetDays), 'yyyy-MM-dd') : null,
      is_milestone: tmpl.isMilestone,
      auto_generated: true,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('tasks') as any).insert(inserts).select();
    if (data) {
      store.setTasks([...store.tasks, ...(data as Task[])]);
    }
    return true;
  }, [store]);

  const toggleComplete = useCallback(async (task: Task) => {
    const completedAt = task.completed_at ? null : new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('tasks') as any).update({ completed_at: completedAt }).eq('id', task.id);
    store.updateTask(task.id, { completed_at: completedAt });
  }, [store]);

  const deleteTask = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('tasks') as any).delete().eq('id', id);
    store.removeTask(id);
  }, [store]);

  const addTask = useCallback(async (data: {
    planId?: string;
    title: string;
    description?: string;
    dueDate?: string;
    isMilestone?: boolean;
  }): Promise<Task | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task } = await (supabase.from('tasks') as any)
      .insert({
        user_id: user.id,
        plan_id: data.planId ?? null,
        title: data.title,
        description: data.description ?? null,
        due_date: data.dueDate ?? null,
        is_milestone: data.isMilestone ?? false,
      })
      .select()
      .single();

    if (task) store.addTask(task as Task);
    return task as Task | null;
  }, [store]);

  return {
    ...store,
    fetchTasks,
    generateTasksForPlan,
    toggleComplete,
    deleteTask,
    addTask,
  };
}
