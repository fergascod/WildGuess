import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, navbarHeight, spacing } from '@/theme/theme';
import { isSupabaseConfigured } from '@/lib/supabase';

import { useAuthContext } from '@/hooks/use-auth-context'

type NavItem = { labelKey: string; href: '/' | '/explore' | '/new_test' | '/profile' | '/login' };


const ITEMS_BASE: NavItem[] = [
  { labelKey: 'navbar.home', href: '/' },
  { labelKey: 'navbar.explore', href: '/explore' },
  { labelKey: 'navbar.test', href: '/new_test' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
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
        {authItem && (
          <View style={styles.right}>
            {(() => {
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
        )}
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
});
