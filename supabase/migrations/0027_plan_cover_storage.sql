-- plan-covers バケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-covers', 'plan-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 誰でも閲覧可
CREATE POLICY "plan_covers_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plan-covers');

-- 自分のフォルダ（user_id/）にのみアップロード可
CREATE POLICY "plan_covers_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'plan-covers'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- 上書き更新
CREATE POLICY "plan_covers_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'plan-covers'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- 削除
CREATE POLICY "plan_covers_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'plan-covers'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
