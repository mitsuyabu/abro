export interface CountryEmergencyInfo {
  country: string;
  flag: string;
  police: string;
  ambulance: string;
  fire: string;
  japaneseEmbassy: string;
  embassyPhone: string;
}

export const COUNTRY_EMERGENCY: CountryEmergencyInfo[] = [
  {
    country: 'オーストラリア',
    flag: '🇦🇺',
    police: '000',
    ambulance: '000',
    fire: '000',
    japaneseEmbassy: '在オーストラリア日本国大使館',
    embassyPhone: '+61-2-6273-3244',
  },
  {
    country: 'カナダ',
    flag: '🇨🇦',
    police: '911',
    ambulance: '911',
    fire: '911',
    japaneseEmbassy: '在カナダ日本国大使館',
    embassyPhone: '+1-613-241-8541',
  },
  {
    country: 'イギリス',
    flag: '🇬🇧',
    police: '999',
    ambulance: '999',
    fire: '999',
    japaneseEmbassy: '在英国日本国大使館',
    embassyPhone: '+44-20-7465-6500',
  },
  {
    country: 'ニュージーランド',
    flag: '🇳🇿',
    police: '111',
    ambulance: '111',
    fire: '111',
    japaneseEmbassy: '在ニュージーランド日本国大使館',
    embassyPhone: '+64-4-473-1540',
  },
  {
    country: 'アイルランド',
    flag: '🇮🇪',
    police: '999',
    ambulance: '999',
    fire: '999',
    japaneseEmbassy: '在アイルランド日本国大使館',
    embassyPhone: '+353-1-202-8300',
  },
  {
    country: 'アメリカ',
    flag: '🇺🇸',
    police: '911',
    ambulance: '911',
    fire: '911',
    japaneseEmbassy: '在アメリカ合衆国日本国大使館',
    embassyPhone: '+1-202-238-6700',
  },
  {
    country: 'フィリピン',
    flag: '🇵🇭',
    police: '911',
    ambulance: '911',
    fire: '911',
    japaneseEmbassy: '在フィリピン日本国大使館',
    embassyPhone: '+63-2-8551-5710',
  },
  {
    country: 'マルタ',
    flag: '🇲🇹',
    police: '112',
    ambulance: '112',
    fire: '112',
    japaneseEmbassy: '在イタリア日本国大使館(管轄)',
    embassyPhone: '+39-06-487991',
  },
];

export const JAPAN_EMERGENCY_OVERSEAS = '+81-3-5501-8000'; // 外務省海外安全相談センター
