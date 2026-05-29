import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import i18n from '@/lib/i18n';
import { getDeviceLocale, normalizeLocale, type SupportedLocale } from '@/lib/locale';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthContext } from '@/hooks/use-auth-context';
import { LocaleContext } from '@/hooks/use-locale';

export default function LocaleProvider({ children }: PropsWithChildren) {
    const { claims } = useAuthContext();
    const deviceLocale = useMemo(() => getDeviceLocale(), []);
    const [locale, setLocaleState] = useState<SupportedLocale>(() =>
        normalizeLocale(claims?.user_metadata?.locale ?? deviceLocale),
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const next = normalizeLocale(claims?.user_metadata?.locale ?? deviceLocale);
        setLocaleState((prev) => (prev === next ? prev : next));
    }, [claims?.user_metadata?.locale, deviceLocale]);

    useEffect(() => {
        if (i18n.language !== locale) {
            i18n.changeLanguage(locale).catch(() => { });
        }
    }, [locale]);

    const setLocale = useCallback(async (code: SupportedLocale) => {
        const next = normalizeLocale(code);
        if (next === locale) return;
        setIsSaving(true);
        try {
            if (isSupabaseConfigured) {
                await supabase.auth.updateUser({ data: { locale: next } });
            }
            setLocaleState(next);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [locale]);

    return (
        <LocaleContext.Provider value={{ locale, isSaving, setLocale }}>
            {children}
        </LocaleContext.Provider>
    );
}
