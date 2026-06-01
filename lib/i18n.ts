import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ca from '@/lib/locales/ca.json';
import en from '@/lib/locales/en.json';
import es from '@/lib/locales/es.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      ca: { translation: ca },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'en',
    supportedLngs: ['ca', 'en', 'es'],
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;
