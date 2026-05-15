import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { DEFAULT_CATEGORIES } from '@/lib/bookmark/defaults';
import { useBookmarkStore } from '@/stores/bookmark';
import type { Bookmark, BookmarkCategory, BookmarkSourceType } from '@/types';

export function useBookmarks() {
  const store = useBookmarkStore();

  const ensureCategories = useCallback(async (userId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('bookmark_categories') as any)
      .select('*')
      .eq('user_id', userId)
      .order('order_index');

    if (data && (data as BookmarkCategory[]).length > 0) {
      store.setCategories(data as BookmarkCategory[]);
      return;
    }

    // 既存ユーザー用: デフォルトカテゴリを挿入
    const inserts = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted } = await (supabase.from('bookmark_categories') as any)
      .insert(inserts)
      .select();
    if (inserted) store.setCategories(inserted as BookmarkCategory[]);
  }, [store]);

  const fetchBookmarks = useCallback(async (categoryKey?: string) => {
    store.setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { store.setIsLoading(false); return; }

    await ensureCategories(user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('bookmarks') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (categoryKey) query = query.eq('category', categoryKey);

    const { data } = await query;
    if (data) store.setBookmarks(data as Bookmark[]);
    store.setIsLoading(false);
  }, [store, ensureCategories]);

  const createFromUrl = useCallback(async (url: string): Promise<Bookmark | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Edge Function でメタ情報取得
    let meta: {
      title?: string;
      description?: string;
      thumbnail_url?: string;
      source_type?: BookmarkSourceType;
    } = { source_type: 'url' };

    try {
      const { data } = await supabase.functions.invoke('extract-url', { body: { url } });
      if (data) meta = { ...meta, ...data };
    } catch {
      // フォールバック: URL のままを保存
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookmark, error } = await (supabase.from('bookmarks') as any)
      .insert({
        user_id: user.id,
        source_type: meta.source_type ?? 'url',
        source_url: url,
        title: meta.title ?? url,
        description: meta.description ?? null,
        thumbnail_url: meta.thumbnail_url ?? null,
        category: 'others',
        ai_classified: false,
      })
      .select()
      .single();

    if (error || !bookmark) return null;
    const bm = bookmark as Bookmark;
    store.addBookmark(bm);

    // バックグラウンドで AI 分類
    classifyInBackground(bm, store.categories, user.id).then((updated) => {
      if (updated) store.updateBookmark(bm.id, updated);
    });

    return bm;
  }, [store]);

  const createFromNote = useCallback(async (title: string, content: string): Promise<Bookmark | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookmark, error } = await (supabase.from('bookmarks') as any)
      .insert({
        user_id: user.id,
        source_type: 'note',
        title,
        content_text: content,
        category: 'others',
        ai_classified: false,
      })
      .select()
      .single();

    if (error || !bookmark) return null;
    const bm = bookmark as Bookmark;
    store.addBookmark(bm);

    classifyInBackground(bm, store.categories, user.id).then((updated) => {
      if (updated) store.updateBookmark(bm.id, updated);
    });

    return bm;
  }, [store]);

  const createFromImage = useCallback(async (imageUri: string, note?: string): Promise<Bookmark | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookmark, error } = await (supabase.from('bookmarks') as any)
      .insert({
        user_id: user.id,
        source_type: 'image',
        thumbnail_url: imageUri,
        title: note ?? '画像メモ',
        content_text: note ?? null,
        category: 'others',
        ai_classified: false,
      })
      .select()
      .single();

    if (error || !bookmark) return null;
    const bm = bookmark as Bookmark;
    store.addBookmark(bm);
    return bm;
  }, [store]);

  const updateCategory = useCallback(async (id: string, category: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('bookmarks') as any).update({ category }).eq('id', id);
    store.updateBookmark(id, { category });
  }, [store]);

  const deleteBookmark = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('bookmarks') as any).delete().eq('id', id);
    store.removeBookmark(id);
  }, [store]);

  return {
    ...store,
    fetchBookmarks,
    createFromUrl,
    createFromNote,
    createFromImage,
    updateCategory,
    deleteBookmark,
    ensureCategories,
  };
}

async function classifyInBackground(
  bookmark: Bookmark,
  categories: BookmarkCategory[],
  _userId: string,
): Promise<Partial<Bookmark> | null> {
  try {
    const { data } = await supabase.functions.invoke('classify-bookmark', {
      body: {
        bookmark_id: bookmark.id,
        title: bookmark.title,
        description: bookmark.description,
        content_text: bookmark.content_text,
        source_type: bookmark.source_type,
        categories: categories.map((c) => ({ key: c.key, label: c.label })),
      },
    });
    if (!data) return null;
    return {
      category: data.category ?? 'others',
      ai_classified: true,
      ai_confidence: data.confidence ?? null,
      tags: data.tags ?? [],
      description: bookmark.description ?? data.summary ?? null,
    };
  } catch {
    return null;
  }
}
