'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { SchoolItem } from './DynamicSidebar';

const CITY_COORDS: Record<string, [number, number]> = {
  'シドニー':       [-33.8688, 151.2093],
  'メルボルン':     [-37.8136, 144.9631],
  'ブリスベン':     [-27.4698, 153.0251],
  'パース':         [-31.9505, 115.8605],
  'ゴールドコースト': [-28.0167, 153.4000],
  'ケアンズ':       [-16.9186, 145.7781],
  'オークランド':   [-36.8485, 174.7633],
  'ロンドン':       [51.5074, -0.1278],
  'トロント':       [43.6532, -79.3832],
  'バンクーバー':   [49.2827, -123.1207],
  'セブ':           [10.3157, 123.8854],
};

interface SchoolWithPos {
  school: SchoolItem;
  pos: [number, number];
}

function FlyToSchool({ schoolsWithPos, hoveredSchoolId }: { schoolsWithPos: SchoolWithPos[]; hoveredSchoolId?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!hoveredSchoolId) return;
    const target = schoolsWithPos.find(s => s.school.id === hoveredSchoolId);
    if (target) {
      map.flyTo(target.pos, 14, { duration: 0.5 });
    }
  }, [hoveredSchoolId, map, schoolsWithPos]);
  return null;
}

interface Props {
  schools: SchoolItem[];
  onSelect: (school: SchoolItem) => void;
  hoveredSchoolId?: string;
}

export default function SchoolMap({ schools, onSelect, hoveredSchoolId }: Props) {
  const schoolsWithPos: SchoolWithPos[] = schools.map((school, i) => {
    const base = CITY_COORDS[school.city] ?? [-25, 133];
    const sameCity = schools.slice(0, i).filter(s => s.city === school.city).length;
    return {
      school,
      pos: [base[0] + sameCity * 0.006, base[1] + sameCity * 0.006] as [number, number],
    };
  });

  const validCoords = schoolsWithPos.map(s => s.pos);
  const centerLat = validCoords.reduce((sum, c) => sum + c[0], 0) / validCoords.length;
  const centerLng = validCoords.reduce((sum, c) => sum + c[1], 0) / validCoords.length;
  const uniqueCities = new Set(schools.map(s => s.city)).size;
  const zoom = uniqueCities === 1 ? 12 : uniqueCities <= 3 ? 7 : 5;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={zoom}
      style={{ height: '220px', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      />
      <FlyToSchool schoolsWithPos={schoolsWithPos} hoveredSchoolId={hoveredSchoolId} />
      {schoolsWithPos.map(({ school, pos }) => {
        const isHovered = school.id === hoveredSchoolId;
        return (
          <CircleMarker
            key={school.id}
            center={pos}
            radius={isHovered ? 14 : 9}
            pathOptions={{
              color: 'white',
              fillColor: isHovered ? '#FF5A00' : '#1A1A1A',
              fillOpacity: 1,
              weight: isHovered ? 3 : 2,
            }}
            eventHandlers={{ click: () => onSelect(school) }}
          >
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
                  onClick={() => onSelect(school)}
                  style={{
                    marginTop: '8px',
                    background: '#1A1A1A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    width: '100%',
                  }}
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
