import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LocationPicker, { type Location } from '@/components/LocationPicker';
import { Button, Card, FormField, NumberInput, Screen, Title } from '@/components/ui';
import gameModes from '@/lib/game_modes.json';
import { QUESTION_BOUNDS, SPECIES_BOUNDS, rangeError } from '@/lib/utils';
import { colors, radius, spacing } from '@/theme/theme';

const DEFAULT_LOCATION: Location = { lat: 41.3874, lng: 2.1686, radius: 40 };

export default function NewTest() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number | null>(null);
  const [numSpecies, setNumSpecies] = useState<number | null>(null);
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);

  function start() {
    router.push({
      pathname: '/test',
      params: {
        taxon_id: mode,
        num_questions: String(numQuestions ?? ''),
        num_species: String(numSpecies ?? ''),
        lat: location.lat.toFixed(5),
        lng: location.lng.toFixed(5),
        radius: String(location.radius),
      },
    });
  }

  const questionsError = rangeError(numQuestions, QUESTION_BOUNDS);
  const speciesError = rangeError(numSpecies, SPECIES_BOUNDS);
  const canStart =
    !!mode &&
    numQuestions != null &&
    numSpecies != null &&
    !questionsError &&
    !speciesError;

  return (
    <Screen maxWidth={520}>
      <Title>{t('newTest.title')}</Title>

      <Card>
        <FormField label={t('newTest.questionsLabel')} error={questionsError}>
          <NumberInput
            value={numQuestions == null ? '' : String(numQuestions)}
            onChangeNumber={setNumQuestions}
            placeholder={t('newTest.questionsPlaceholder')}
          />
        </FormField>

        <FormField label={t('newTest.speciesLabel')} error={speciesError}>
          <NumberInput
            value={numSpecies == null ? '' : String(numSpecies)}
            onChangeNumber={setNumSpecies}
            placeholder={t('newTest.speciesPlaceholder')}
          />
        </FormField>

        <FormField label={t('newTest.modeLabel')}>
          <Picker
            selectedValue={mode}
            onValueChange={(v) => setMode(String(v))}
            style={styles.picker}
            dropdownIconColor={colors.muted}
            mode="dropdown"
          >
            <Picker.Item label={t('newTest.modePlaceholder')} value="" />
            {Object.entries(gameModes).map(([name, id]) => (
              <Picker.Item key={id} label={t(`gameModes.${name}`)} value={String(id)} />
            ))}
          </Picker>
        </FormField>

        <FormField label={t('newTest.locationLabel')}>
          <LocationPicker defaultRadius={40} onChange={setLocation} />
        </FormField>

        <View style={styles.divider} />

        <Button label={t('newTest.start')} onPress={start} disabled={!canStart} />
      </Card>
      <Button label={t('newTest.custom')} onPress={() => router.push('/new_test/custom_test')} />

      <Card style={styles.hintCard}>
        <Text style={styles.hint}>
          {t('newTest.hint')}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  picker: {
    width: '100%',
    minHeight: 38,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  hintCard: {
    backgroundColor: colors.surface,
  },
  hint: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.muted,
  },
});
