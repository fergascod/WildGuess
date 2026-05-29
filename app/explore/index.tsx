import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/theme/theme';

export default function Explore() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Title>{t('explore.title')}</Title>

      <Card style={styles.card}>
        <Text style={styles.paragraph}>
          {t('explore.paragraph')}
        </Text>

        <Button label={t('explore.start')} href="/explore/48460" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
  },
  paragraph: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 26,
  },
});
