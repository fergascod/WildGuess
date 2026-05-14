import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
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
      <Title>Nou joc</Title>

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

        <FormField label="Mode de joc">
          <Picker
            selectedValue={mode}
            onValueChange={(v) => setMode(String(v))}
            style={styles.picker}
            dropdownIconColor={colors.muted}
            mode="dropdown"
          >
            <Picker.Item label="Selecciona un mode de joc" value="" />
            {Object.entries(gameModes).map(([name, id]) => (
              <Picker.Item key={id} label={name} value={String(id)} />
            ))}
          </Picker>
        </FormField>

        <FormField label="Zona geogràfica">
          <LocationPicker defaultRadius={40} onChange={setLocation} />
        </FormField>

        <View style={styles.divider} />

        <Button label="Comença" onPress={start} disabled={!canStart} />
      </Card>

      <Card style={styles.hintCard}>
        <Text style={styles.hint}>
          Aquí pots jugar a identificar espècies dels grups taxonòmics que més
          t&apos;agradin. Selecciona el nombre d&apos;espècies que vols incloure
          al test: quantes més n&apos;escullis més difícil serà!
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
