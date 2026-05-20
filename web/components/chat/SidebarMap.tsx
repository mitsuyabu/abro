'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CityItem, SchoolItem } from './DynamicSidebar';

const LOCATION_COORDS: Record<string, [number, number]> = {
  'シドニー':         [-33.8688, 151.2093],
  'メルボルン':       [-37.8136, 144.9631],
  'ブリスベン':       [-27.4698, 153.0251],
  'パース':           [-31.9505, 115.8605],
  'ゴールドコースト': [-28.0167, 153.4000],
  'ケアンズ':         [-16.9186, 145.7781],
  'オークランド':     [-36.8485, 174.7633],
  'ロンドン':         [51.5074,  -0.1278],
  'エジンバラ':       [55.9533,  -3.1883],
  'トロント':         [43.6532, -79.3832],
  'バンクーバー':     [49.2827, -123.1207],
  'セブ':             [10.3157,  123.8854],
  'マニラ':           [14.5995,  120.9842],
  'マルタ':           [35.9375,   14.3754],
};

function makePinIcon(emoji: string, name: string, dotColor: string, scale = 1) {
  const fs = Math.round(11 * scale);
  const py = Math.round(5 * scale);
  const px = Math.round(10 * scale);
  const dot = Math.round(8 * scale);
  const gap = Math.round(5 * scale);
  return L.divIcon({
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div style="
        position:absolute;
        transform:translate(-50%,-100%);
        display:flex;flex-direction:column;align-items:center;
        cursor:pointer;pointer-events:auto;
      ">
        <div style="
          background:white;
          border-radius:20px;
          padding:${py}px ${px}px;
          box-shadow:0 2px 10px rgba(0,0,0,0.22);
          display:flex;align-items:center;gap:${gap}px;
          white-space:nowrap;
          font-size:${fs}px;font-weight:700;
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          color:#111;
          border:1.5px solid rgba(0,0,0,0.07);
          max-width:180px;
        ">
          <span style="font-size:${fs + 1}px">${emoji}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;max-width:140px">${name}</span>
        </div>
        <div style="
          width:${dot}px;height:${dot}px;
          background:${dotColor};
          border-radius:50%;
          border:2px solid white;
          margin-top:3px;
          box-shadow:0 1px 4px rgba(0,0,0,0.35);
          flex-shrink:0;
        "></div>
      </div>`,
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [70, 70] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(positions)]);
  return null;
}

function FlyToSchool({
  entries,
  hoveredSchoolId,
}: {
  entries: Array<{ id: string; pos: [number, number] }>;
  hoveredSchoolId?: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!hoveredSchoolId) return;
    const t = entries.find(e => e.id === hoveredSchoolId);
    if (t) map.flyTo(t.pos, 14, { duration: 0.4 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredSchoolId]);
  return null;
}

interface Props {
  cities: CityItem[];
  schools: SchoolItem[];
  onSelectCity: (city: CityItem) => void;
  onSelectSchool: (school: SchoolItem) => void;
  hoveredSchoolId?: string;
}

export default function SidebarMap({ cities, schools, onSelectCity, onSelectSchool, hoveredSchoolId }: Props) {
  const cityEntries = useMemo(() =>
    cities
      .map(city => ({ city, pos: LOCATION_COORDS[city.name] }))
      .filter((e): e is { city: CityItem; pos: [number, number] } => !!e.pos),
    [cities]
  );

  const schoolEntries = useMemo(() =>
    schools
      .map((school) => {
        // 実座標があればそれを使用
        if (school.latitude != null && school.longitude != null) {
          return { school, pos: [school.latitude, school.longitude] as [number, number] };
        }
        // フォールバック：都市中心からオフセット
        const base = LOCATION_COORDS[school.city];
        if (!base) return null;
        const offset = schools.filter(s => s.city === school.city && s.id < school.id).length;
        return { school, pos: [base[0] + offset * 0.009, base[1] + offset * 0.009] as [number, number] };
      })
      .filter((e): e is { school: SchoolItem; pos: [number, number] } => !!e),
    [schools]
  );

  const allPositions = useMemo(
    () => [...cityEntries.map(e => e.pos), ...schoolEntries.map(e => e.pos)],
    [cityEntries, schoolEntries]
  );

  const cityIcons = useMemo(
    () => Object.fromEntries(cityEntries.map(({ city }) => [city.name, makePinIcon(city.flag, city.name, '#2563EB')])),
    [cityEntries]
  );

  const schoolIcons = useMemo(
    () => Object.fromEntries(
      schoolEntries.map(({ school }) => [
        school.id,
        makePinIcon('🎓', school.name, school.id === hoveredSchoolId ? '#FF5A00' : '#111', school.id === hoveredSchoolId ? 1.15 : 1),
      ])
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schoolEntries, hoveredSchoolId]
  );

  if (allPositions.length === 0) return null;

  const centerLat = allPositions.reduce((s, p) => s + p[0], 0) / allPositions.length;
  const centerLng = allPositions.reduce((s, p) => s + p[1], 0) / allPositions.length;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      />
      <FitBounds positions={allPositions} />
      <FlyToSchool
        entries={schoolEntries.map(e => ({ id: e.school.id, pos: e.pos }))}
        hoveredSchoolId={hoveredSchoolId}
      />

      {cityEntries.map(({ city, pos }) => (
        <Marker
          key={city.name}
          position={pos}
          icon={cityIcons[city.name]}
          eventHandlers={{ click: () => onSelectCity(city) }}
        >
          <Popup>
            <div style={{ minWidth: '140px', fontFamily: 'sans-serif' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{city.flag} {city.name}</div>
              <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>{city.country}</div>
              <button
                onClick={() => onSelectCity(city)}
                style={{ marginTop: '8px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', width: '100%' }}
              >
                都市の詳細を見る →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {schoolEntries.map(({ school, pos }) => (
        <Marker
          key={school.id}
          position={pos}
          icon={schoolIcons[school.id]}
          eventHandlers={{ click: () => onSelectSchool(school) }}
        >
          <Popup>
            <div style={{ minWidth: '160px', fontFamily: 'sans-serif' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{school.name}</div>
              <div style={{ color: '#888', fontSize: '11px' }}>{school.city} · {school.type}</div>
              {school.fee_per_week && (
                <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>¥{school.fee_per_week.toLocaleString()}/週</div>
              )}
              <button
                onClick={() => onSelectSchool(school)}
                style={{ marginTop: '8px', background: '#111', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', width: '100%' }}
              >
                詳細を見る →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
