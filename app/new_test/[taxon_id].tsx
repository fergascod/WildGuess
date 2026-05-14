import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LocationPicker, { type Location } from '@/components/LocationPicker';
import { Button, Card, FormField, NumberInput, Screen, Title } from '@/components/ui';
import {
  QUESTION_BOUNDS,
  SPECIES_BOUNDS,
  rangeError,
  returnName,
} from '@/lib/utils';
import { colors } from '@/theme/theme';

const DEFAULT_LOCATION: Location = { lat: 41.3874, lng: 2.1686, radius: 40 };

function normalizeId(raw: string | string[] | undefined): string {
  const id = Array.isArray(raw) ? raw[0] : raw;
  return id && /^\+?(0|[1-9]\d*)$/.test(id) ? id : '1';
}

export default function NewTestForTaxon() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taxon_id: string }>();
  const mode = normalizeId(params.taxon_id);

  const [taxonName, setTaxonName] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number | null>(null);
  const [numSpecies, setNumSpecies] = useState<number | null>(null);
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);

  useEffect(() => {
    setTaxonName(null);
    fetch(
      `https://api.inaturalist.org/v1/taxa?id=${mode}&locale=ca&per_page=1`,
    )
      .then((r) => r.json())
      .then((json) => setTaxonName(returnName(json.results[0])))
      .catch(console.error);
  }, [mode]);

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
    numQuestions != null &&
    numSpecies != null &&
    !questionsError &&
    !speciesError;

  return (
    <Screen maxWidth={520}>
      <Title>
        Nou joc:{' '}
        <Text style={styles.titleAccent}>
          {taxonName ?? 'carregant...'}
        </Text>
      </Title>

      <Card>
        <FormField label="Número de preguntes" error={questionsError}>
          <NumberInput
            value={numQuestions == null ? '' : String(numQuestions)}
            onChangeNumber={setNumQuestions}
            placeholder="Entre 1 i 20"
          />
        </FormField>

        <FormField label="Número d'espècies" error={speciesError}>
          <NumberInput
            value={numSpecies == null ? '' : String(numSpecies)}
            onChangeNumber={setNumSpecies}
            placeholder="Entre 2 i 100"
          />
        </FormField>

        <FormField label="Zona geogràfica">
          <LocationPicker defaultRadius={40} onChange={setLocation} />
        </FormField>

        <View style={styles.divider} />

        <Button label="Comença" onPress={start} disabled={!canStart} />
      </Card>

      <Card>
        <Text style={styles.hint}>
          Selecciona la zona geogràfica, el nombre de preguntes i el nombre
          d&apos;espècies: quantes més espècies escullis més difícil serà!
        </Text>
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
});
