import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// 開発・確認用エンドポイント
// GET /api/debug-prompt でSupabaseから取得できているデータを確認する
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [schoolsRes, costRes, visaRes, safetyRes, climateRes] = await Promise.all([
    supabase.from("schools").select("name, city, type, fee_per_week, is_partner"),
    supabase.from("city_cost_of_living").select("city, city_en, rent_1br_city_aud, avg_monthly_salary_aud, meal_cheap_aud, fetched_at"),
    supabase.from("visa_info").select("visa_code, visa_name_ja, application_fee_aud, age_restriction, work_restriction, fetched_at"),
    supabase.from("city_safety").select("city, city_en, safety_index, crime_index, safety_daytime, safety_nighttime, fetched_at"),
    supabase.from("city_climate").select("city_id, city, city_en, temp_avg_c, temp_summer_c, temp_winter_c, rainfall_mm, sunshine_hours, climate_type, fetched_at"),
  ]);

  return Response.json({
    schools: {
      count: schoolsRes.data?.length ?? 0,
      error: schoolsRes.error?.message ?? null,
      sample: schoolsRes.data?.slice(0, 3) ?? [],
    },
    cost_of_living: {
      count: costRes.data?.length ?? 0,
      error: costRes.error?.message ?? null,
      sample: costRes.data ?? [],
    },
    visa_info: {
      count: visaRes.data?.length ?? 0,
      error: visaRes.error?.message ?? null,
      sample: visaRes.data ?? [],
    },
    city_safety: {
      count: safetyRes.data?.length ?? 0,
      error: safetyRes.error?.message ?? null,
      sample: safetyRes.data ?? [],
    },
    city_climate: {
      count: climateRes.data?.length ?? 0,
      error: climateRes.error?.message ?? null,
      sample: climateRes.data ?? [],
    },
  }, { headers: { "Content-Type": "application/json" } });
}
