import { create } from 'zustand';
import type { Bookmark, BookmarkCategory } from '@/types';

interface BookmarkState {
  bookmarks: Bookmark[];
  categories: BookmarkCategory[];
  selectedCategory: string | null;
  isLoading: boolean;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setCategories: (categories: BookmarkCategory[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  removeBookmark: (id: string) => void;
  setSelectedCategory: (key: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useBookmarkStore = create<BookmarkState>((set) => ({
  bookmarks: [],
  categories: [],
  selectedCategory: null,
  isLoading: false,

  setBookmarks: (bookmarks) => set({ bookmarks }),
  setCategories: (categories) => set({ categories }),
  addBookmark: (bookmark) => set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] })),
  updateBookmark: (id, updates) =>
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
  removeBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
