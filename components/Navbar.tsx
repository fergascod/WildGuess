import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, navbarHeight, spacing } from '@/theme/theme';

type NavItem = { label: string; href: '/' | '/explore' | '/new_test' };

const ITEMS: NavItem[] = [
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
