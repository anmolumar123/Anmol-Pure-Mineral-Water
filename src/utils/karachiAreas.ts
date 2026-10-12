export const CUSTOM_AREA_OPTION = 'Other / Enter Custom Area';

export const KARACHI_AREAS: string[] = [
  'Clifton',
  'DHA Phase 1',
  'DHA Phase 2',
  'DHA Phase 2 Extension',
  'DHA Phase 3',
  'DHA Phase 4',
  'DHA Phase 5',
  'DHA Phase 6',
  'DHA Phase 7',
  'DHA Phase 8',
  'Gizri',
  'Bath Island',
  'Zamzama',
  'PECHS',
  'PECHS Block 1',
  'PECHS Block 2',
  'PECHS Block 3',
  'PECHS Block 4',
  'PECHS Block 5',
  'PECHS Block 6',
  'PECHS Block 7',
  'PECHS Block 8',
  'Tariq Road',
  'Bahadurabad',
  'Jamshed Road',
  'Soldier Bazaar',
  'Garden',
  'Saddar',
  'Civil Lines',
  'Cantt',
  'Karachi Cantt',
  'M.A. Jinnah Road',
  'Shahrah-e-Faisal',
  'Gulshan-e-Iqbal',
  'Gulistan-e-Johar',
  'University Road',
  'Federal B Area',
  'North Nazimabad',
  'North Karachi',
  'New Karachi',
  'Nazimabad',
  'Buffer Zone',
  'Liaquatabad',
  'Gulberg',
  'Aisha Manzil',
  'Azizabad',
  'Karimabad',
  'Water Pump',
  'Surjani Town',
  'Orangi Town',
  'SITE Area',
  'Baldia Town',
  'Pak Colony',
  'Lyari',
  'Korangi',
  'Korangi Industrial Area',
  'Landhi',
  'Malir',
  'Model Colony',
  'Shah Faisal Colony',
  'Drigh Road',
  'Gulshan-e-Maymar',
  'Saadi Town',
  'Scheme 33',
  'Saadi Garden',
  'Askari',
  'Askari 1',
  'Askari 2',
  'Askari 3',
  'Askari 4',
  'Askari 5',
  'Bahria Town Karachi',
  'Bahria Apartments',
  'Gulzar-e-Hijri',
  'Safora Goth',
  'Johar Chowrangi',
  'Mosamiat',
  'Hasan Square',
  'NIPA',
  'Gulshan-e-Jamal',
  'Karsaz',
  'Faisal Cantonment',
  'Airport Area',
  'Jinnah International Airport Area',
  'Malir Cantt',
  'Memon Goth',
  'Quaidabad',
  'Bin Qasim',
  'Port Qasim',
  'Steel Town',
  'DHA City Karachi',
];

export function validatePakistaniPhone(input: string, fieldLabel = 'number'): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      normalized: '',
      error: `Please enter your ${fieldLabel}.`,
    };
  }

  let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      error: `Invalid characters in ${fieldLabel}. Please enter digits only.`,
    };
  }

  if (/^923\d{9}$/.test(cleaned)) {
    const normalized = '0' + cleaned.substring(2);
    return { isValid: true, normalized };
  }

  if (/^03\d{9}$/.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  if (/^3\d{9}$/.test(cleaned)) {
    return { isValid: true, normalized: '0' + cleaned };
  }

  return {
    isValid: false,
    normalized: '',
    error: `Please enter a valid Pakistani ${fieldLabel} (e.g. 03001234567, +923001234567).`,
  };
}

export function constructCompleteDeliveryAddress(params: {
  houseOffice: string;
  streetRoad: string;
  area: string;
  customArea?: string;
  gateBellFloor?: string;
}): string {
  const effectiveArea =
    params.area === CUSTOM_AREA_OPTION || params.area === 'Other'
      ? (params.customArea || '').trim()
      : (params.area || '').trim();

  const parts: string[] = [];
  if (params.houseOffice && params.houseOffice.trim()) {
    parts.push(params.houseOffice.trim());
  }
  if (params.streetRoad && params.streetRoad.trim()) {
    parts.push(params.streetRoad.trim());
  }
  if (effectiveArea) {
    parts.push(effectiveArea);
  }

  let address = parts.join(', ');
  if (params.gateBellFloor && params.gateBellFloor.trim()) {
    address += ` (Gate/Floor: ${params.gateBellFloor.trim()})`;
  }
  return address;
}
