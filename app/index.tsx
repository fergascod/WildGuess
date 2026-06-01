import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme/theme';

export default function Home() {
  const { t } = useTranslation();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heading}>{t('home.heading')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={t('home.exploreCta')}
          href="/explore/1"
        />
        <Button
          label={t('home.testCta')}
          variant="secondary"
          href="/new_test"
        />
      </View>


      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('home.footerDeveloped')}</Text>
        <Text
          style={styles.footerLink}
          onPress={() =>
            Linking.openURL('https://www.linkedin.com/in/fernando-gaston/')
          }
        >
          {t('home.footerLinkedIn')}
        </Text>
        <Text
          style={styles.footerLink}
          onPress={() => Linking.openURL('https://github.com/fergascod')}
        >
          {t('home.footerGitHub')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 28,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 13,
    color: colors.muted,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
