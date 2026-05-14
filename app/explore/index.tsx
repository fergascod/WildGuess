import { StyleSheet, Text } from 'react-native';

import { Button, Card, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/theme/theme';

export default function Explore() {
  return (
    <Screen>
      <Title>Explora l&apos;arbre taxonòmic</Title>

      <Card style={styles.card}>
        <Text style={styles.paragraph}>
          Amb aquesta funcionalitat pots estudiar les relacions taxonòmiques
          entre les diferents espècies que trobaràs a iNaturalist. Des dels
          fongs fins els peixos passant per les aus i les algues, podràs
          explorar els ordres, regnes, famílies, gèneres i espècies
          d&apos;animals que hi ha a la plataforma.
        </Text>

        <Button label="Comença pel principi: Animalia!" href="/explore/2" />
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
