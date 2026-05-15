import { create } from 'zustand';
import type { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, updates) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
