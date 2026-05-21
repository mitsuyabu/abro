"use client";

import { RecommendationPanel } from "@/components/home/RecommendationPanel";
import { useState } from "react";
import dynamic from "next/dynamic";

const SchoolMap = dynamic(() => import("./SchoolMap"), { ssr: false });
const SidebarMap = dynamic(() => import("./SidebarMap"), { ssr: false });

export interface CountryItem {
  name: string;
  flag: string;
  images: string[];
  mapQuery: string;
}

export interface CityItem {
  name: string;
  country: string;
  flag: string;
  images: string[];
  mapQuery: string;
}

export interface GoogleReview {
  author: string;
  author_photo: string | null;
  rating: number;
  text: string;
  time: string;
}

export interface SchoolItem {
  id: string;
  name: string;
  city: string;
  country: string;
  type: string;
  fee_per_week: number | null;
  description: string | null;
  website: string | null;
  is_partner: boolean;
  images: string[];
  rating?: number | null;
  review_count?: number | null;
  google_place_id?: string | null;
  google_reviews?: GoogleReview[] | null;
  google_photos?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SidebarContext {
  countries: CountryItem[];
  cities: CityItem[];
  schools: SchoolItem[];
  showAgents: boolean;
}

export const COUNTRY_DATA: CountryItem[] = [
  {
    name: "オーストラリア",
    flag: "🇦🇺",
    images: ["/シドニー.png"],
    mapQuery: "Australia",
  },
  { name: "カナダ", flag: "🇨🇦", images: ["/トロント.png"], mapQuery: "Canada" },
  {
    name: "イギリス",
    flag: "🇬🇧",
    images: ["/ロンドン.png"],
    mapQuery: "United Kingdom",
  },
  {
    name: "ニュージーランド",
    flag: "🇳🇿",
    images: ["/オークランド.png"],
    mapQuery: "New Zealand",
  },
  {
    name: "フィリピン",
    flag: "🇵🇭",
    images: ["/セブ.png"],
    mapQuery: "Philippines",
  },
  { name: "マルタ", flag: "🇲🇹", images: ["/マルタ.png"], mapQuery: "Malta" },
  {
    name: "アメリカ",
    flag: "🇺🇸",
    images: ["/シドニー.png"],
    mapQuery: "United States",
  },
  {
    name: "アイルランド",
    flag: "🇮🇪",
    images: ["/ロンドン.png"],
    mapQuery: "Ireland",
  },
];

export const CITY_DATA: CityItem[] = [
  {
    name: "シドニー",
    country: "オーストラリア",
    flag: "🇦🇺",
    images: [
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1530276371031-2511efff9d5a.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTMwMjc2MzcxMDMxLTI1MTFlZmZmOWQ1YS5hdmlmIiwiaWF0IjoxNzc5MTc4MjM4LCJleHAiOjE4MTA3MTQyMzh9.7YZmpSpH8gMXHh3huHJabFDu4gshODOwZnCBvNEYn2U",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1598948485421-33a1655d3c18.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTk4OTQ4NDg1NDIxLTMzYTE2NTVkM2MxOC5hdmlmIiwiaWF0IjoxNzc5MTc4NDcxLCJleHAiOjE4MTA3MTQ0NzF9.GBddv1v8S2u_AxdDKHfUuqF7HqXNJgQfXoCa60THTLY",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1634201429366-a3f4dbf05544.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNjM0MjAxNDI5MzY2LWEzZjRkYmYwNTU0NC5hdmlmIiwiaWF0IjoxNzc5MTc4NTMwLCJleHAiOjE4MTA3MTQ1MzB9.FzENBoYeRMC4o2zRMLoyzahJ9KIrRZ0lM9ym2fASn-g",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/premium_photo-1697730262092-03c94e7dd8fa.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9wcmVtaXVtX3Bob3RvLTE2OTc3MzAyNjIwOTItMDNjOTRlN2RkOGZhLmF2aWYiLCJpYXQiOjE3NzkxNzg2MTUsImV4cCI6MTgxMDcxNDYxNX0.Ahy92hUAoA7lJ1i_ciGOc_O6EF6oS0E60mmGImU9MRA",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1695142887255-2ce7c1b33dda.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNjk1MTQyODg3MjU1LTJjZTdjMWIzM2RkYS5hdmlmIiwiaWF0IjoxNzc5MTc4NTg4LCJleHAiOjE4MTA3MTQ1ODh9.DmGxKGvoNP-cPdJsHSPpyovJzp52Kn46Wb-sNh0HSKg",
    ],
    mapQuery: "Sydney, Australia",
  },
  {
    name: "メルボルン",
    country: "オーストラリア",
    flag: "🇦🇺",
    images: [
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1514395462725-fb4566210144.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTE0Mzk1NDYyNzI1LWZiNDU2NjIxMDE0NC5hdmlmIiwiaWF0IjoxNzc5MTc3NjY1LCJleHAiOjE4MTA3MTM2NjV9.7yvlYrUzHDAAD_AQACsL6DpgLVJvvZTdUgZzNBvibLA",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1545044846-351ba102b6d5.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTQ1MDQ0ODQ2LTM1MWJhMTAyYjZkNS5hdmlmIiwiaWF0IjoxNzc5MTc4Mjc1LCJleHAiOjE4MTA3MTQyNzV9.uAnMYHtaZrGLWSKI-7PXFMVWltcBdIpAyfBbM47Ywi4",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1494236472818-d35e50e604cf.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNDk0MjM2NDcyODE4LWQzNWU1MGU2MDRjZi5hdmlmIiwiaWF0IjoxNzc5MTc3NjQ2LCJleHAiOjE4MTA3MTM2NDZ9.hBcFZM1lMir6vkRhWGmEKld96qKb_fDSGoK-xLjAF1s",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1594300070414-34b8021779bf.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTk0MzAwMDcwNDE0LTM0YjgwMjE3NzliZi5hdmlmIiwiaWF0IjoxNzc5MTc4NDUxLCJleHAiOjE4MTA3MTQ0NTF9.VYXhmZER0D5oRtjSnq1C5rt1efKyPFtvzryt-vsSR5g",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1562162315-823bc0b8a3dd.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTYyMTYyMzE1LTgyM2JjMGI4YTNkZC5hdmlmIiwiaWF0IjoxNzc5MTc4MzIzLCJleHAiOjE4MTA3MTQzMjN9.iSjSWBRV79kb-MlSSwFHX8JyW3mBW8rQqHO4vyH5jV4",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1587968916653-f52a46826407.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTg3OTY4OTE2NjUzLWY1MmE0NjgyNjQwNy5hdmlmIiwiaWF0IjoxNzc5MTc4Mzg4LCJleHAiOjE4MTA3MTQzODh9.X5IxjLdUXL3eBPJPfBdUQgzoxDP08FrbB_lk9oHeTqQ",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1686052183140-088f1bd9a49b.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNjg2MDUyMTgzMTQwLTA4OGYxYmQ5YTQ5Yi5hdmlmIiwiaWF0IjoxNzc5MTc4NTUxLCJleHAiOjE4MTA3MTQ1NTF9.C4UFJnbr0MTpHBmijyFmYUyMZGkQPj0zY8hbu7OGYVs",
    ],
    mapQuery: "Melbourne, Australia",
  },
  {
    name: "ブリスベン",
    country: "オーストラリア",
    flag: "🇦🇺",
    images: [
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1589976567749-2f011d95ffec.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTg5OTc2NTY3NzQ5LTJmMDExZDk1ZmZlYy5hdmlmIiwiaWF0IjoxNzc5MTc4NDA3LCJleHAiOjE4MTA3MTQ0MDd9.Sf2jZikB9GAEzeWI6Yx0iaGH7KSRWeiSuEejGIyPA1s",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1452859030887-bb96ef08d051.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNDUyODU5MDMwODg3LWJiOTZlZjA4ZDA1MS5hdmlmIiwiaWF0IjoxNzc5MTc3NjA5LCJleHAiOjE4MTA3MTM2MDl9.dc0kY-C6z_i6N33SM5CQNQMrk1xgwiK2G_Sj2XRWEr0",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1623027535342-d6df91eb216c.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNjIzMDI3NTM1MzQyLWQ2ZGY5MWViMjE2Yy5hdmlmIiwiaWF0IjoxNzc5MTc4NTA5LCJleHAiOjE4MTA3MTQ1MDl9.ignln9jQvT2p4B5_OMyDWlR3S_PMEUmkDbF-tR1LcYc",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1566734904496-9309bb1798ae.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTY2NzM0OTA0NDk2LTkzMDliYjE3OThhZS5hdmlmIiwiaWF0IjoxNzc5MTc4MzYzLCJleHAiOjE4MTA3MTQzNjN9.aASZvRgaZIJI4Gm7kHMx92iVhMRdXe5OtT2SqAbl0gc",
    ],
    mapQuery: "Brisbane, Australia",
  },
  {
    name: "パース",
    country: "オーストラリア",
    flag: "🇦🇺",
    images: ["/シドニー.png"],
    mapQuery: "Perth, Australia",
  },
  {
    name: "ゴールドコースト",
    country: "オーストラリア",
    flag: "🇦🇺",
    images: [
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1591701729564-3b5325d5a4bd.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTkxNzAxNzI5NTY0LTNiNTMyNWQ1YTRiZC5hdmlmIiwiaWF0IjoxNzc5MTc4NDI2LCJleHAiOjE4MTA3MTQ0MjZ9.dmCHZgfLr6uBg7RayDNFjybtBDTRiwXRfH6vrV0x7Is",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1599097653069-bf45de660b69.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTk5MDk3NjUzMDY5LWJmNDVkZTY2MGI2OS5hdmlmIiwiaWF0IjoxNzc5MTc4NDkwLCJleHAiOjE4MTA3MTQ0OTB9._fv6vUlcVBrmx9iAU7FJmP50tQai0lT3aKcYOCsMZPw",
      "https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1688350257158-8777cf0ba6d3.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNjg4MzUwMjU3MTU4LTg3NzdjZjBiYTZkMy5hdmlmIiwiaWF0IjoxNzc5MTc4NTY5LCJleHAiOjE4MTA3MTQ1Njl9.mSujW8LbMKrYlyHbQb-JMPIH0ZDDN4oYGyKugS7Fdos",
    ],
    mapQuery: "Gold Coast, Australia",
  },
  {
    name: "ケアンズ",
    country: "オーストラリア",
    flag: "🇦🇺",
    images: ["/シドニー.png"],
    mapQuery: "Cairns, Australia",
  },
  {
    name: "トロント",
    country: "カナダ",
    flag: "🇨🇦",
    images: ["/トロント.png"],
    mapQuery: "Toronto, Canada",
  },
  {
    name: "バンクーバー",
    country: "カナダ",
    flag: "🇨🇦",
    images: ["/トロント.png"],
    mapQuery: "Vancouver, Canada",
  },
  {
    name: "ロンドン",
    country: "イギリス",
    flag: "🇬🇧",
    images: ["/ロンドン.png"],
    mapQuery: "London, UK",
  },
  {
    name: "エジンバラ",
    country: "イギリス",
    flag: "🇬🇧",
    images: ["/ロンドン.png"],
    mapQuery: "Edinburgh, UK",
  },
  {
    name: "オークランド",
    country: "ニュージーランド",
    flag: "🇳🇿",
    images: ["/オークランド.png"],
    mapQuery: "Auckland, New Zealand",
  },
  {
    name: "セブ",
    country: "フィリピン",
    flag: "🇵🇭",
    images: ["/セブ.png"],
    mapQuery: "Cebu, Philippines",
  },
  {
    name: "マニラ",
    country: "フィリピン",
    flag: "🇵🇭",
    images: ["/セブ.png"],
    mapQuery: "Manila, Philippines",
  },
  {
    name: "マルタ",
    country: "マルタ",
    flag: "🇲🇹",
    images: ["/マルタ.png"],
    mapQuery: "Valletta, Malta",
  },
];

const AGENTS = [
  {
    id: 1,
    name: "スタディ留学センター",
    specialty: "語学留学・大学進学サポート",
    rating: 4.8,
    reviews: 1240,
    badge: "実績No.1",
  },
  {
    id: 2,
    name: "ワーホリプロ",
    specialty: "ワーキングホリデー専門",
    rating: 4.7,
    reviews: 892,
    badge: "専門特化",
  },
  {
    id: 3,
    name: "グローバルEdge",
    specialty: "コスパ重視・初心者向け",
    rating: 4.6,
    reviews: 567,
    badge: "初心者向け",
  },
];

const AVATAR_STYLE: React.CSSProperties = {};

interface Props {
  context: SidebarContext;
  focusedSchool?: SchoolItem | null;
  onFocusedSchoolChange?: (school: SchoolItem | null) => void;
}

function ImageGallery({
  images,
  cityName,
}: {
  images: string[];
  cityName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 1) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={images[0]}
        alt={cityName}
        className="w-full flex-shrink-0 object-cover"
        style={{ height: "260px" }}
      />
    );
  }

  return (
    <div className="flex-shrink-0" style={{ height: "260px" }}>
      <div className="relative w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`${cityName} ${activeIndex + 1}`}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() =>
            setActiveIndex((i) => (i - 1 + images.length) % images.length)
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-sm"
        >
          ‹
        </button>
        <button
          onClick={() => setActiveIndex((i) => (i + 1) % images.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-sm"
        >
          ›
        </button>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="text-amber-400">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ opacity: i < Math.round(rating) ? 1 : 0.25 }}>★</span>
      ))}
    </span>
  );
}

function SchoolDetailPanel({ school, onBack }: { school: SchoolItem; onBack: () => void }) {
  const [tab, setTab] = useState<'overview' | 'reviews' | 'location'>('overview');
  const photos = school.google_photos?.length ? school.google_photos : (school.images ?? []);
  const reviews = school.google_reviews ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* スティッキーヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button onClick={onBack} className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
            ← 戻る
          </button>
          {school.website && (
            <a href={school.website} target="_blank" rel="noopener noreferrer"
              className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:opacity-80 transition-opacity whitespace-nowrap">
              公式サイトを見る →
            </a>
          )}
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h2 className="text-[15px] font-bold text-primary leading-snug">{school.name}</h2>
              <p className="text-xs text-muted mt-0.5">{school.city} · {school.type}</p>
            </div>
            {school.is_partner && (
              <span className="flex-shrink-0 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full mt-0.5">提携校</span>
            )}
          </div>
          {/* 評価バー */}
          {school.rating != null && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-bold text-primary">{Number(school.rating).toFixed(1)}</span>
              <StarRating rating={Number(school.rating)} />
              {school.review_count != null && (
                <span className="text-xs text-muted">({Number(school.review_count).toLocaleString()}件)</span>
              )}
            </div>
          )}
        </div>

        {/* タブ */}
        <div className="flex">
          {(['overview', 'reviews', 'location'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              {t === 'overview' ? '概要' : t === 'reviews' ? `レビュー${reviews.length ? ` (${reviews.length})` : ''}` : '場所'}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {/* ===== 概要タブ ===== */}
        {tab === 'overview' && (
          <div>
            {/* 写真グリッド (1大 + 右に2小) */}
            {photos.length > 0 && (
              <div className="flex gap-0.5 bg-gray-100" style={{ height: '180px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[0]} alt={school.name}
                  className="object-cover flex-shrink-0" style={{ width: photos.length > 1 ? '60%' : '100%', height: '180px' }} />
                {photos.length > 1 && (
                  <div className="flex flex-col gap-0.5 flex-1">
                    {photos.slice(1, 3).map((url, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={i} src={url} alt="" className="object-cover w-full" style={{ height: '89px' }} />
                    ))}
                  </div>
                )}
              </div>
            )}
            {photos.length > 3 && (
              <div className="flex gap-0.5 overflow-x-auto scrollbar-hide px-0 pt-0.5">
                {photos.slice(3).map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt="" className="h-20 w-28 object-cover flex-shrink-0" />
                ))}
              </div>
            )}

            <div className="p-4 flex flex-col gap-4">
              {/* 学費 */}
              {school.fee_per_week && (
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-border">
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wide">週あたり学費の目安</p>
                    <p className="text-xl font-bold text-primary mt-0.5">
                      ¥{school.fee_per_week.toLocaleString()}
                      <span className="text-xs font-normal text-muted ml-1">/週</span>
                    </p>
                  </div>
                  <span className="text-2xl">💰</span>
                </div>
              )}

              {/* 説明 */}
              {school.description && (
                <div>
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">学校について</h3>
                  <p className="text-sm text-primary leading-relaxed">{school.description}</p>
                </div>
              )}

              {/* 基本情報チップ */}
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">基本情報</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-primary px-3 py-1.5 rounded-full">📍 {school.city}</span>
                  <span className="text-xs bg-gray-100 text-primary px-3 py-1.5 rounded-full">🎓 {school.type}</span>
                  {school.country && (
                    <span className="text-xs bg-gray-100 text-primary px-3 py-1.5 rounded-full">🌏 {school.country}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== レビュータブ ===== */}
        {tab === 'reviews' && (
          <div className="p-4">
            {school.rating != null && (
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">{Number(school.rating).toFixed(1)}</div>
                  <StarRating rating={Number(school.rating)} />
                  {school.review_count != null && (
                    <div className="text-[10px] text-muted mt-1">{Number(school.review_count).toLocaleString()}件</div>
                  )}
                </div>
                <div className="flex-1 text-xs text-muted leading-relaxed">
                  Googleビジネスプロフィールの口コミを表示しています。
                </div>
              </div>
            )}
            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      {r.author_photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={r.author_photo} alt={r.author} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {r.author[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-primary">{r.author}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StarRating rating={r.rating} />
                          <span className="text-[10px] text-muted">{r.time}</span>
                        </div>
                      </div>
                    </div>
                    {r.text && <p className="text-xs text-primary leading-relaxed">{r.text}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-muted">まだレビューがありません</p>
              </div>
            )}
          </div>
        )}

        {/* ===== 場所タブ ===== */}
        {tab === 'location' && (
          <div>
            <iframe
              src={
                school.latitude != null && school.longitude != null
                  ? `https://www.google.com/maps?q=${school.latitude},${school.longitude}&output=embed`
                  : `https://www.google.com/maps?q=${encodeURIComponent(school.name + ' ' + school.city)}&output=embed`
              }
              className="w-full"
              style={{ height: '320px', border: 'none' }}
              loading="lazy"
              title={school.name}
            />
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">📍</span>
                <div>
                  <p className="text-sm font-semibold text-primary">{school.name}</p>
                  <p className="text-xs text-muted">{school.city}{school.country ? `, ${school.country}` : ''}</p>
                </div>
              </div>
              {school.website && (
                <a href={school.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <span>🔗</span> {school.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DynamicSidebar({ context, focusedSchool: externalFocusedSchool, onFocusedSchoolChange }: Props) {
  const [focusedCity, setFocusedCity] = useState<CityItem | null>(null);
  const [internalFocusedSchool, setInternalFocusedSchool] = useState<SchoolItem | null>(null);
  const [hoveredSchool, setHoveredSchool] = useState<SchoolItem | null>(null);
  const { countries, cities, schools, showAgents } = context;
  const hasContext = countries.length > 0 || cities.length > 0 || schools.length > 0 || showAgents;

  const focusedSchool = externalFocusedSchool ?? internalFocusedSchool;
  const setFocusedSchool = (school: SchoolItem | null) => {
    setInternalFocusedSchool(school);
    onFocusedSchoolChange?.(school);
  };

  if (!hasContext && !focusedSchool) return <RecommendationPanel />;

  if (focusedSchool) {
    return <SchoolDetailPanel school={focusedSchool} onBack={() => setFocusedSchool(null)} />;
  }

  if (focusedCity) {
    return (
      <div className="flex flex-col h-full">
        <button
          onClick={() => setFocusedCity(null)}
          className="flex items-center gap-1 px-4 py-3 text-sm text-muted hover:text-primary transition-colors"
        >
          ← 戻る
        </button>
        <ImageGallery images={focusedCity.images} cityName={focusedCity.name} />
        <iframe
          src={`https://www.google.com/maps?q=${encodeURIComponent(focusedCity.mapQuery)}&output=embed`}
          className="w-full flex-shrink-0"
          style={{ height: "200px", border: "none" }}
          loading="lazy"
          title={focusedCity.name}
        />
        <div className="p-4 border-t border-border">
          <div className="text-lg font-bold text-primary">
            {focusedCity.flag} {focusedCity.name}
          </div>
          <div className="text-sm text-muted">{focusedCity.country}</div>
        </div>
      </div>
    );
  }

  // 都市または学校がある場合：全面マップ + 下部カード
  const hasLocationContext = cities.length > 0 || schools.length > 0;

  if (hasLocationContext) {
    return (
      <div className="flex flex-col h-full">
        {/* 全面マップ */}
        <div className="flex-1 min-h-0">
          <SidebarMap
            cities={cities}
            schools={schools}
            onSelectCity={setFocusedCity}
            onSelectSchool={setFocusedSchool}
            hoveredSchoolId={hoveredSchool?.id}
          />
        </div>

        {/* 下部カードエリア */}
        <div className="flex-shrink-0 border-t border-border bg-background overflow-y-auto" style={{ maxHeight: '260px' }}>
          {/* 都市カード（横スクロール） */}
          {cities.length > 0 && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">候補の都市</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {cities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => setFocusedCity(city)}
                    className="flex-shrink-0 w-28 rounded-xl overflow-hidden border border-border/60 hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    <div className="relative h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={city.images[0]} alt={city.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                      <div className="absolute bottom-1 left-1.5 text-white text-[10px] font-bold">{city.flag} {city.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 学校カード */}
          {schools.length > 0 && (
            <div className="px-3 pt-2 pb-3 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">語学学校</p>
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => setFocusedSchool(school)}
                  onMouseEnter={() => setHoveredSchool(school)}
                  onMouseLeave={() => setHoveredSchool(null)}
                  className={`border rounded-xl px-3 py-2 transition-all text-left w-full ${
                    hoveredSchool?.id === school.id
                      ? 'bg-primary/5 border-primary/40 shadow-sm'
                      : 'bg-white border-border hover:border-primary/30 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-primary truncate">{school.name}</span>
                        {school.is_partner && (
                          <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">提携</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted">{school.city} · {school.type}</div>
                      {school.rating != null && (
                        <div className="text-[10px] text-amber-500 mt-0.5">★ {Number(school.rating).toFixed(1)} <span className="text-muted">{school.review_count ? `(${Number(school.review_count).toLocaleString()})` : ''}</span></div>
                      )}
                    </div>
                    {school.fee_per_week && (
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">¥{school.fee_per_week.toLocaleString()}</span>
                        <span className="text-[10px] text-muted">/週</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* エージェント（ロケーションと同時表示） */}
          {showAgents && (
            <div className="px-3 pb-3">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">おすすめエージェント</p>
              {AGENTS.map((agent) => (
                <div key={agent.id} className="bg-white border border-border rounded-xl p-2.5 mb-1.5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-primary">{agent.name}</div>
                      <div className="text-[10px] text-muted">{agent.specialty}</div>
                    </div>
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">{agent.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {showAgents && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            おすすめエージェント
          </p>
          <div className="flex flex-col gap-2">
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="bg-white border border-border rounded-xl p-3 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-primary">{agent.name}</div>
                    <div className="text-xs text-muted mt-0.5">{agent.specialty}</div>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">{agent.badge}</span>
                </div>
                <div className="text-xs text-amber-500 mt-1.5">★ {agent.rating} <span className="text-muted">({agent.reviews.toLocaleString()}件)</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {countries.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            候補の国
          </p>
          <div className="grid grid-cols-2 gap-2">
            {countries.slice(0, 4).map((country) => (
              <div
                key={country.name}
                className="relative overflow-hidden rounded-xl group cursor-pointer"
                style={{ aspectRatio: "247 / 164" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={country.images[0]}
                  alt={country.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-2">
                  <div className="text-white text-xs font-bold leading-tight">
                    {country.flag} {country.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { AVATAR_STYLE };
