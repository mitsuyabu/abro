import { create } from 'zustand';
import type { CostSimulation, CostItem } from '@/types';

interface CostState {
  simulation: CostSimulation | null;
  items: CostItem[];
  isSheetVisible: boolean;
  isLoading: boolean;
  setSimulation: (sim: CostSimulation | null) => void;
  setItems: (items: CostItem[]) => void;
  addItem: (item: CostItem) => void;
  updateItem: (id: string, updates: Partial<CostItem>) => void;
  removeItem: (id: string) => void;
  showSheet: () => void;
  hideSheet: () => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useCostStore = create<CostState>((set) => ({
  simulation: null,
  items: [],
  isSheetVisible: false,
  isLoading: false,

  setSimulation: (simulation) => set({ simulation }),
  setItems: (items) => set({ items }),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),

  updateItem: (id, updates) =>
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),

  removeItem: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),

  showSheet: () => set({ isSheetVisible: true }),
  hideSheet: () => set({ isSheetVisible: false }),
  setIsLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ simulation: null, items: [], isSheetVisible: false }),
}));
