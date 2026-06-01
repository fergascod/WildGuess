import SpeciesSearchScreen, { Taxon } from "@/components/TaxaSelector";
import { FormField, Card, NumberInput, Screen, Button, Title } from "@/components/ui";
import { router } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";

import { QUESTION_BOUNDS, rangeError } from '@/lib/utils';
import { colors, fonts, spacing } from "@/theme/theme";

export default function CustomTest() {
    const { t } = useTranslation()
    const [speciesList, setSpeciesList] = useState<Taxon[]>([]);
    const [numQuestions, setNumQuestions] = useState<number | null>(null);

    const questionsError = rangeError(numQuestions, QUESTION_BOUNDS);

    function start() {
        router.push({
            pathname: '/test',
            params: {
                num_questions: String(numQuestions ?? ''),
                species: speciesList.map(s => s.id).join(','),
            },
        });
    }

    let canStart = numQuestions != null && !questionsError && speciesList.length > 1;

    useEffect(() => console.log(speciesList), [speciesList]);

    return (
        <Screen maxWidth={520}>
            <Title>{t('customTest.title')}</Title>

            <Card>
                <FormField label={t('customTest.questionsLabel')} error={questionsError}>
                    <NumberInput
                        value={numQuestions == null ? '' : String(numQuestions)}
                        onChangeNumber={setNumQuestions}
                        placeholder={t('customTest.questionsPlaceholder')}
                    />
                </FormField>
            </Card>

            <SpeciesSearchScreen onSelect={setSpeciesList} />

            {speciesList.length <= 1 && (
                <Text style={styles.hint}>
                    {t('customTest.hint')}
                </Text>
            )}

            <Button label={t('customTest.start')} onPress={start} disabled={!canStart} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    hint: {
        textAlign: 'center',
        fontSize: 13,
        color: colors.muted,
        marginTop: -spacing.sm,
    },
});