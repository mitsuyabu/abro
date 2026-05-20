'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
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
    const target = entries.find(e => e.id === hoveredSchoolId);
    if (target) map.flyTo(target.pos, 14, { duration: 0.5 });
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

export default function SidebarMap({
  cities,
  schools,
  onSelectCity,
  onSelectSchool,
  hoveredSchoolId,
}: Props) {
  const cityEntries = cities
    .map(city => ({ city, pos: LOCATION_COORDS[city.name] }))
    .filter((e): e is { city: CityItem; pos: [number, number] } => !!e.pos);

  const schoolEntries = schools
    .map((school, i) => {
      const base = LOCATION_COORDS[school.city];
      if (!base) return null;
      const offset = schools.slice(0, i).filter(s => s.city === school.city).length;
      return {
        school,
        pos: [base[0] + offset * 0.009, base[1] + offset * 0.009] as [number, number],
      };
    })
    .filter((e): e is { school: SchoolItem; pos: [number, number] } => !!e);

  const allPositions: [number, number][] = [
    ...cityEntries.map(e => e.pos),
    ...schoolEntries.map(e => e.pos),
  ];

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

      {/* 都市ピン */}
      {cityEntries.map(({ city, pos }) => (
        <CircleMarker
          key={city.name}
          center={pos}
          radius={13}
          pathOptions={{ color: 'white', fillColor: '#2563EB', fillOpacity: 0.92, weight: 2.5 }}
          eventHandlers={{ click: () => onSelectCity(city) }}
        >
          <Tooltip permanent direction="top" offset={[0, -16]} className="map-label-city">
            <span style={{ fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
              {city.flag} {city.name}
            </span>
          </Tooltip>
          <Popup>
            <div style={{ minWidth: '140px', fontFamily: 'sans-serif' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{city.flag} {city.name}</div>
              <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>{city.country}</div>
              <button
                onClick={() => onSelectCity(city)}
                style={{ marginTop: '8px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', width: '100%' }}
              >
                都市の詳細を見る
              </button>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* 語学学校ピン */}
      {schoolEntries.map(({ school, pos }) => {
        const isHovered = school.id === hoveredSchoolId;
        return (
          <CircleMarker
            key={school.id}
            center={pos}
            radius={isHovered ? 13 : 8}
            pathOptions={{
              color: 'white',
              fillColor: isHovered ? '#FF5A00' : '#1A1A1A',
              fillOpacity: 1,
              weight: isHovered ? 3 : 2,
            }}
            eventHandlers={{ click: () => onSelectSchool(school) }}
          >
            <Tooltip permanent direction="right" offset={[10, 0]} className="map-label-school">
              <span style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>🎓 {school.name}</span>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: '160px', fontFamily: 'sans-serif' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{school.name}</div>
                <div style={{ color: '#888', fontSize: '11px' }}>{school.city} · {school.type}</div>
                {school.fee_per_week && (
                  <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>
                    ¥{school.fee_per_week.toLocaleString()}/週
                  </div>
                )}
                <button
                  onClick={() => onSelectSchool(school)}
                  style={{ marginTop: '8px', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', width: '100%' }}
                >
                  詳細を見る
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
