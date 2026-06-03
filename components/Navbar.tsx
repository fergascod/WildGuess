import { Link, usePathname } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { colors, navbarHeight, spacing } from '@/theme/theme';
import { isSupabaseConfigured } from '@/lib/supabase';

import { useAuthContext } from '@/hooks/use-auth-context'
import { useLocale } from '@/hooks/use-locale'
import type { SupportedLocale } from '@/lib/locale'

type NavItem = { labelKey: string; href: '/' | '/explore' | '/new_test' | '/profile' | '/login' };

type LocaleOption = { code: SupportedLocale; labelKey: string };

const LOCALES: LocaleOption[] = [
  { code: 'ca', labelKey: 'profile.locales.ca' },
  { code: 'es', labelKey: 'profile.locales.es' },
  { code: 'en', labelKey: 'profile.locales.en' },
];

const ITEMS_BASE: NavItem[] = [
  { labelKey: 'navbar.home', href: '/' },
  { labelKey: 'navbar.explore', href: '/explore' },
  { labelKey: 'navbar.test', href: '/new_test' },
];

const TEST_ROUTES = ['/test', '/sound_test'];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

function isTestRoute(pathname: string) {
  return TEST_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

function LocaleMenu() {
  const { locale, setLocale, isSaving } = useLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((item) => item.code === locale) ?? LOCALES[0];

  const handleSelect = (code: SupportedLocale) => {
    setOpen(false);
    if (code === locale) return;
    setLocale(code);
  };

  return (
    <View>
      <Pressable
        style={[styles.localeTrigger, isSaving && styles.localeTriggerDisabled]}
        onPress={() => !isSaving && setOpen(true)}
      >
        <Text style={styles.localeTriggerText}>
          {isSaving ? '...' : t(current.labelKey)}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.localeBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.localeSheet}>
            {LOCALES.map((item) => (
              <Pressable
                key={item.code}
                style={[
                  styles.localeOption,
                  item.code === locale && styles.localeOptionSelected,
                ]}
                onPress={() => handleSelect(item.code)}
              >
                <Text
                  style={[
                    styles.localeOptionText,
                    item.code === locale && styles.localeOptionTextSelected,
                  ]}
                >
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { claims, isLoggedIn } = useAuthContext()
  const { t } = useTranslation()

  const authItem = isSupabaseConfigured
    ? isLoggedIn
      ? { label: claims?.user_metadata?.username, href: '/profile' }
      : { label: t('navbar.login'), href: '/login' }
    : null

  return (
    <View style={styles.nav}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {ITEMS_BASE.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable style={styles.item}>
                  <Text style={[styles.label, active && styles.labelActive]}>
                    {t(item.labelKey)}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
        <View style={styles.right}>
          {!isTestRoute(pathname) && <LocaleMenu />}
          {authItem && (() => {
            const active = isActive(pathname, authItem.href);
            return (
              <Link href={authItem.href} asChild>
                <Pressable style={styles.item}>
                  <Text style={[styles.label, active && styles.labelActive]}>
                    {authItem.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: navbarHeight,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  item: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  localeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.bg,
  },
  localeTriggerDisabled: {
    opacity: 0.6,
  },
  localeTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  localeTriggerChevron: {
    fontSize: 10,
    color: colors.muted,
  },
  localeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  localeSheet: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  localeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  localeOptionSelected: {
    backgroundColor: colors.accentLight ?? colors.bg,
  },
  localeOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  localeOptionTextSelected: {
    fontWeight: '600',
    color: colors.accent ?? colors.text,
  },
  localeCheckmark: {
    fontSize: 12,
    color: colors.accent ?? colors.text,
    fontWeight: '700',
  },
});