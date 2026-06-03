import SpeciesSearchScreen, { Taxon } from "@/components/TaxaSelector";
import { FormField, Card, NumberInput, Screen, Button, Title } from "@/components/ui";
import { router } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";

import { QUESTION_BOUNDS, rangeError } from '@/lib/utils';
import { colors, fonts, radius, spacing } from "@/theme/theme";

type TestType = 'image' | 'sound';

export default function CustomTest() {
    const { t } = useTranslation();
    const [speciesList, setSpeciesList] = useState<Taxon[]>([]);
    const [numQuestions, setNumQuestions] = useState<number | null>(null);
    const [testType, setTestType] = useState<TestType>('image');

    const questionsError = rangeError(numQuestions, QUESTION_BOUNDS);

    function start() {
        const pathname = testType === 'sound' ? '/sound_test' : '/test';
        router.push({
            pathname,
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

                <FormField label={t('newTest.testTypeLabel')}>
                    <View style={styles.toggle}>
                        {(['image', 'sound'] as TestType[]).map((type) => (
                            <Pressable
                                key={type}
                                style={[styles.toggleBtn, testType === type && styles.toggleBtnActive]}
                                onPress={() => setTestType(type)}
                            >
                                <Text style={styles.toggleIcon}>
                                    {type === 'image' ? '🖼️' : '🔊'}
                                </Text>
                                <Text style={[styles.toggleLabel, testType === type && styles.toggleLabelActive]}>
                                    {t(`newTest.testType.${type}`)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
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