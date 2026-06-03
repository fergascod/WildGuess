import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import LocationPicker, { type Location } from '@/components/LocationPicker';
import { Button, Card, FormField, NumberInput, Screen, Title } from '@/components/ui';
import {
  QUESTION_BOUNDS,
  SPECIES_BOUNDS,
  rangeError,
  returnName,
} from '@/lib/utils';
import { useLocale } from '@/hooks/use-locale';
import { getInaturalistLocaleQuery } from '@/lib/locale';
import { colors, radius, spacing } from '@/theme/theme';

const DEFAULT_LOCATION: Location = { lat: 41.3874, lng: 2.1686, radius: 40 };

type TestType = 'image' | 'sound';

function normalizeId(raw: string | string[] | undefined): string {
  const id = Array.isArray(raw) ? raw[0] : raw;
  return id && /^\+?(0|[1-9]\d*)$/.test(id) ? id : '1';
}

export default function NewTestForTaxon() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taxon_id: string }>();
  const mode = normalizeId(params.taxon_id);
  const { locale } = useLocale();
  const { t } = useTranslation();

  const [taxonName, setTaxonName] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number | null>(null);
  const [numSpecies, setNumSpecies] = useState<number | null>(null);
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [testType, setTestType] = useState<TestType>('image');

  useEffect(() => {
    setTaxonName(null);
    fetch(
      `https://api.inaturalist.org/v1/taxa?id=${mode}&${getInaturalistLocaleQuery(locale)}&per_page=1`,
    )
      .then((r) => r.json())
      .then((json) => setTaxonName(returnName(json.results[0])))
      .catch(console.error);
  }, [mode, locale]);

  function start() {
    const pathname = testType === 'sound' ? '/sound_test' : '/test';
    router.push({
      pathname,
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
    numQuestions != null &&
    numSpecies != null &&
    !questionsError &&
    !speciesError;

  return (
    <Screen maxWidth={520}>
      <Title>
        {t('newTestTaxon.titlePrefix')}{' '}
        <Text style={styles.titleAccent}>
          {taxonName ?? t('newTestTaxon.loading')}
        </Text>
      </Title>

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

        <FormField label={t('newTest.testTypeLabel')}>
          <View style={styles.toggle}>
            {(['image', 'sound'] as TestType[]).map((type) => (
              <Pressable
                key={type}
                style={[styles.toggleBtn, testType === type && styles.toggleBtnActive]}
                onPress={() => setTestType(type)}
              >
                <Text style={[styles.toggleIcon]}>
                  {type === 'image' ? '🖼️' : '🔊'}
                </Text>
                <Text style={[styles.toggleLabel, testType === type && styles.toggleLabelActive]}>
                  {t(`newTest.testType.${type}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField label={t('newTest.locationLabel')}>
          <LocationPicker defaultRadius={40} onChange={setLocation} />
        </FormField>

        <View style={styles.divider} />

        <Button label={t('newTest.start')} onPress={start} disabled={!canStart} />
      </Card>

      <Card>
        <Text style={styles.hint}>{t('newTestTaxon.hint')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleAccent: {
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  hint: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.muted,
  },
  toggle: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toggleIcon: {
    fontSize: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  toggleLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
});