-- school_labels テーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'school_labels'
ORDER BY ordinal_position;
