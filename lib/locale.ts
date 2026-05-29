import * as Localization from 'expo-localization';

export const SUPPORTED_LOCALES = ['ca', 'es', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

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
