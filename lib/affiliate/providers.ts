import type { BookingType } from '@/types';

export interface AffiliateProvider {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: BookingType;
  url: string;
  color: string;
}

export const AFFILIATE_PROVIDERS: AffiliateProvider[] = [
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    emoji: '✈️',
    description: '格安航空券を比較',
    type: 'flight',
    url: 'https://www.skyscanner.jp',
    color: '#00B2F3',
  },
  {
    id: 'booking_com',
    name: 'Booking.com',
    emoji: '🏨',
    description: '世界中のホテルを予約',
    type: 'accommodation',
    url: 'https://www.booking.com',
    color: '#003580',
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    emoji: '🏠',
    description: '短期・長期の住まい',
    type: 'accommodation',
    url: 'https://www.airbnb.jp',
    color: '#FF5A5F',
  },
  {
    id: 'worldnomads',
    name: 'WorldNomads',
    emoji: '🛡️',
    description: '海外旅行・留学保険',
    type: 'insurance',
    url: 'https://www.worldnomads.com/jp',
    color: '#1B6FA8',
  },
  {
    id: 'wise',
    name: 'Wise',
    emoji: '💳',
    description: '手数料の安い国際送金',
    type: 'transfer',
    url: 'https://wise.com/jp',
    color: '#00B9A5',
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    emoji: '🎯',
    description: '現地体験・ツアー予約',
    type: 'activity',
    url: 'https://www.getyourguide.jp',
    color: '#FF7029',
  },
];

export const PROVIDERS_BY_TYPE: Partial<Record<BookingType, AffiliateProvider[]>> = AFFILIATE_PROVIDERS.reduce(
  (acc, p) => {
    if (!acc[p.type]) acc[p.type] = [];
    acc[p.type]!.push(p);
    return acc;
  },
  {} as Partial<Record<BookingType, AffiliateProvider[]>>
);
