import { createContext, useContext } from 'react';

import type { SupportedLocale } from '@/lib/locale';

export type LocaleData = {
    locale: SupportedLocale;
    isSaving: boolean;
    setLocale: (code: SupportedLocale) => Promise<void>;
};

export const LocaleContext = createContext<LocaleData>({
    locale: 'en',
    isSaving: false,
    setLocale: async () => { },
});

export const useLocale = () => useContext(LocaleContext);
