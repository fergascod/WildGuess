import SpeciesSearchScreen, { Taxon } from "@/components/TaxaSelector";
import { FormField, Card, NumberInput, Screen, Button, Title } from "@/components/ui";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import { QUESTION_BOUNDS, rangeError } from '@/lib/utils';

export default function CustomTest() {
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
    useEffect(() =>
        console.log(speciesList)
        , [speciesList])
    return (
        <Screen maxWidth={520}>
            <Title>Test personalitzat</Title>
            <Button label="Comença" onPress={start} disabled={!canStart} />
            <Card>
                <FormField label="Número de preguntes" error={questionsError}>
                    <NumberInput
                        value={numQuestions == null ? '' : String(numQuestions)}
                        onChangeNumber={setNumQuestions}
                        placeholder="Entre 1 i 20"
                    />
                </FormField>
            </Card >
            <SpeciesSearchScreen onSelect={setSpeciesList} />
        </Screen>
    );
}