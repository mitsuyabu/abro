-- ビザ情報テーブル
CREATE TABLE IF NOT EXISTS public.visa_info (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_code             TEXT NOT NULL UNIQUE,   -- '417', '500', '590'
  visa_name_ja          TEXT NOT NULL,
  visa_name_en          TEXT NOT NULL,
  target_user_ja        TEXT,                   -- 対象者説明
  age_restriction       TEXT,
  stay_duration         TEXT,
  work_restriction      TEXT,
  application_fee_aud   NUMERIC,
  required_documents    TEXT,
  application_method    TEXT,
  second_third_info     TEXT,                   -- セカンド・サード条件（ワーホリのみ）
  notes                 TEXT,
  source_url            TEXT,
  fetched_at            DATE NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS（参照は全ユーザー可）
ALTER TABLE public.visa_info ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'visa_info' AND policyname = 'Anyone can read visa info'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Anyone can read visa info"
      ON public.visa_info FOR SELECT
      USING (true);
    $p$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS visa_info_updated_at ON public.visa_info;
CREATE TRIGGER visa_info_updated_at
  BEFORE UPDATE ON public.visa_info
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- シードデータ（2026-05取得）
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO public.visa_info (
  visa_code, visa_name_ja, visa_name_en,
  target_user_ja, age_restriction, stay_duration, work_restriction,
  application_fee_aud, required_documents, application_method,
  second_third_info, notes, source_url, fetched_at
) VALUES
(
  '417',
  'ワーキングホリデービザ',
  'Working Holiday visa (subclass 417)',
  'オーストラリアでの就労・旅行・語学習得を組み合わせて楽しみたい18〜30歳（一部国は35歳）の方',
  '18〜30歳（英国・アイルランド・カナダ・フランス等の対象国は35歳まで）。申請時に年齢条件を満たしていること',
  '最長12ヶ月。オーストラリア国内での申請・延長不可（国外から申請）',
  '同一雇用主での就労は最長6ヶ月。ただし指定地域（地方・農村部）での医療・建設・農業・観光業等の特定業種は例外あり。就学は最長4ヶ月',
  670,
  '有効パスポート（残存12ヶ月以上推奨）、資金証明（約A$5,000以上）、帰国便の資金または購入済みチケット、健康診断（必要な場合）、無犯罪証明書（必要な場合）',
  'オンライン申請（ImmiAccount）のみ。パスポート国籍により申請可能かどうか異なる。日本国籍は申請可能',
  'セカンドワーホリ（2年目）：指定地域での特定業種（農業・漁業・林業・建設・鉱業・観光業など）を3ヶ月以上行うことで取得可能。サードワーホリ（3年目）：さらに指定地域で6ヶ月以上の特定業種従事が条件',
  '被扶養の子供の同伴不可。健康保険の加入推奨（OVHC）。申請後ビザ番号が発行されるまでオーストラリア入国可能',
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417',
  '2026-05-01'
),
(
  '500',
  '学生ビザ',
  'Student visa (subclass 500)',
  'オーストラリアのCRICOS登録教育機関（語学学校・大学・専門学校など）で学ぶ方',
  '原則年齢制限なし。6歳以上（義務教育年齢）が対象。18歳未満は保護者の同伴またはビザ590が必要な場合あり',
  'コース期間に準じる。コース修了後28日〜60日の猶予期間あり（コース長による）',
  '就学中（学期中）は2週間で48時間まで（約週24時間）。大学院の研究課程（修士研究・博士）は就労時間の上限なし。学校の公式休暇期間中は就労時間の上限なし',
  2000,
  'CoE（Confirmation of Enrolment：入学許可書）、有効パスポート、資金証明（年間約A$29,710以上）、OSHC（海外留学生保険）、健康診断証明書、無犯罪証明書（必要な場合）、GS（Genuine Student）質問への回答',
  'オンライン申請（ImmiAccount）。CoE取得後に申請。処理期間：75%が28日〜4ヶ月、90%が5ヶ月以内（高等教育の場合）',
  NULL,
  '2026年より申請費用がA$1,600からA$2,000に値上がり。英語力要件：IELTS 6.0以上（旧5.5から引き上げ）。GS（Genuine Student）要件：オンライン申請フォーム内で学習目的・帰国意思等に関する質問に回答が必須',
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500',
  '2026-05-01'
),
(
  '590',
  '学生保護者ビザ',
  'Student Guardian visa (subclass 590)',
  '18歳未満の学生ビザ（500）保持者の保護者・後見人としてオーストラリアに滞在したい方',
  '学生が18歳未満であることが原則条件。申請者（保護者）は21歳以上の親・法定後見人・親族であること。例外的に18歳以上の学生でも特別な事情がある場合は申請可能',
  '最長5年（学生のビザ期間に準じる）',
  '就労不可。オーストラリア国内での就労は認められていない',
  2000,
  '有効パスポート、学生との続柄証明書（戸籍謄本等）、資金証明（学生・保護者両方の生活費をカバーできること）、学生のCoE（入学許可書）、OSHC（海外留学生保険）、健康診断証明書、Form 157N（学生保護者手配フォーム）、GTS（Genuine Temporary Stay）質問への回答',
  'オンライン申請（ImmiAccount）。学生のビザ申請と同時または後に申請。処理期間：90%が6ヶ月以内',
  NULL,
  '同伴する18歳未満の扶養家族1人あたり追加でA$400が必要。就労不可のため渡航前に十分な資金準備が必要。GTE（以前の要件）はGTS（Genuine Temporary Stay）に変更され、フォーム内質問形式での回答が必要',
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-590',
  '2026-05-01'
)
ON CONFLICT (visa_code) DO UPDATE SET
  stay_duration         = EXCLUDED.stay_duration,
  work_restriction      = EXCLUDED.work_restriction,
  application_fee_aud   = EXCLUDED.application_fee_aud,
  required_documents    = EXCLUDED.required_documents,
  application_method    = EXCLUDED.application_method,
  second_third_info     = EXCLUDED.second_third_info,
  notes                 = EXCLUDED.notes,
  fetched_at            = EXCLUDED.fetched_at,
  updated_at            = now();
