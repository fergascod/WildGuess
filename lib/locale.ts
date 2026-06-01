import * as Localization from 'expo-localization';

export const SUPPORTED_LOCALES = ['ca', 'es', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const INATURALIST_PREFERRED_PLACE_IDS: Partial<Record<SupportedLocale, number>> = {
  ca: 12997,
  es: 6774,
};

export function normalizeLocale(raw?: string | null): SupportedLocale {
  const value = String(raw ?? '').toLowerCase();
  const base = value.split(/[-_]/)[0];
  if (SUPPORTED_LOCALES.includes(base as SupportedLocale)) {
    return base as SupportedLocale;
  }
  return 'en';
}

export function getDeviceLocale(): SupportedLocale {
  const primary = Localization.getLocales()?.[0]?.languageCode ?? Localization.locale;
  return normalizeLocale(primary);
}

export function toDateLocale(locale: SupportedLocale): string {
  switch (locale) {
    case 'ca':
      return 'ca-ES';
    case 'es':
      return 'es-ES';
    default:
      return 'en';
  }
}

export function getInaturalistPreferredPlaceId(locale: string | null | undefined): number | undefined {
  return INATURALIST_PREFERRED_PLACE_IDS[normalizeLocale(locale)];
}

export function getInaturalistLocaleQuery(locale: string | null | undefined): string {
  const preferredPlaceId = getInaturalistPreferredPlaceId(locale);
  const normalizedLocale = normalizeLocale(locale);
  return preferredPlaceId == null
    ? `locale=${normalizedLocale}`
    : `locale=${normalizedLocale}&preferred_place_id=${preferredPlaceId}`;
}
