import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, navbarHeight, spacing } from '@/theme/theme';
import { isSupabaseConfigured } from '@/lib/supabase';

import { useAuthContext } from '@/hooks/use-auth-context'

type NavItem = { label: string; href: '/' | '/explore' | '/new_test' | '/profile' | '/login' };


const ITEMS_BASE: NavItem[] = [
  { label: 'Inici', href: '/' },
  { label: 'Explora', href: '/explore' },
  { label: 'Test', href: '/new_test' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuthContext()

  const ITEMS = ITEMS_BASE.slice()
  if (isSupabaseConfigured) {
    ITEMS.push(
      isLoggedIn
        ? { label: 'Perfil', href: '/profile' }
        : { label: 'Login', href: '/login' }
    )
  }


  return (
    <View style={styles.nav}>
      <View style={styles.inner}>
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable style={styles.item}>
                <Text style={[styles.label, active && styles.labelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
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
    gap: spacing.xl,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
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
