import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useLocale } from '@/hooks/use-locale';
import { getInaturalistLocaleQuery } from '@/lib/locale';
import { returnName } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MediaInfo = { url: string; attribution?: string };
export type Species = { id: number; observations_count: number;[key: string]: any };

export interface QuestionState {
    media: MediaInfo | null;
    species: Species[] | null;
    correct: number | null;
}

export interface AnsweredQuestion {
    question: QuestionState;
    userResponse: number;
    isCorrect: boolean;
}

export type SavedTest = {
    name: string;
    speciesIds: number[];
    savedAt: string;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function filterZeros(arr: Species[]): Species[] {
    let n = 1;
    while (n < arr.length && arr[n].observations_count > 0) n++;
    return arr.slice(0, n);
}

export function getRandomCombination<T>(arr: T[], k: number): T[] {
    const tmp = [...arr];
    const out: T[] = [];
    for (let i = 0; i < k && tmp.length > 0; i++) {
        const idx = Math.floor(Math.random() * tmp.length);
        out.push(tmp[idx]);
        tmp.splice(idx, 1);
    }
    return out;
}

export function first<T>(v: T | T[] | undefined): T | undefined {
    return Array.isArray(v) ? v[0] : v;
}

export function parseIdList(value: string | undefined): number[] {
    if (!value) return [];
    const out = value
        .split(',')
        .map((chunk) => chunk.trim())
        .filter((chunk) => /^\+?(0|[1-9]\d*)$/.test(chunk))
        .map((chunk) => parseInt(chunk, 10))
        .filter((id) => id > 0);
    return Array.from(new Set(out));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * licenseParam: the iNaturalist query-param name for the license filter.
 *   Photo test  → 'photo_license'
 *   Sound test  → 'sound_license'
 *
 * extractMedia: given a single observation result, return a MediaInfo or null.
 */
export function useTestGame(
    licenseParam: 'photo_license' | 'sound_license',
    extractMedia: (obs: any) => MediaInfo | null,
) {
    const params = useLocalSearchParams<{
        taxon_id?: string;
        num_questions?: string;
        num_species?: string;
        species?: string;
        lat?: string;
        lng?: string;
        radius?: string;
    }>();

    const { locale } = useLocale();
    const { t } = useTranslation();

    const customSpeciesIds = useMemo(
        () => parseIdList(first(params.species)),
        [params.species],
    );
    const isCustomTest = customSpeciesIds.length > 0;

    const taxonId = (() => {
        const id = first(params.taxon_id);
        return id && /^\+?(0|[1-9]\d*)$/.test(id) ? id : '1';
    })();
    const numQuestions = params.num_questions
        ? parseInt(first(params.num_questions)!, 10)
        : 5;
    const numSpecies = params.num_species
        ? parseInt(first(params.num_species)!, 10)
        : 10;
    const coords = {
        lat: params.lat ? parseFloat(first(params.lat)!) : 41.3874,
        lng: params.lng ? parseFloat(first(params.lng)!) : 2.1686,
        radius: params.radius ? parseInt(first(params.radius)!, 10) : 40,
    };

    const [taxonName, setTaxonName] = useState('');
    const [data, setData] = useState<{ total_results: number; results: Species[] } | null>(null);
    const [question, setQuestion] = useState<QuestionState | null>(null);
    const [questionIndex, setQuestionIndex] = useState(-1);
    const [points, setPoints] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);

    const dataRef = useRef(data);
    dataRef.current = data;

    /* Fetch taxon name */
    useEffect(() => {
        if (isCustomTest) {
            setTaxonName(t('test.customTitle'));
            return;
        }
        fetch(
            `https://api.inaturalist.org/v1/taxa?id=${taxonId}&${getInaturalistLocaleQuery(locale)}&per_page=1`,
        )
            .then((r) => r.json())
            .then((json) => setTaxonName(returnName(json.results[0])))
            .catch(console.error);
    }, [taxonId, isCustomTest, locale, t]);

    /* Fetch species pool */
    useEffect(() => {
        if (isCustomTest) {
            if (customSpeciesIds.length === 0) {
                setData({ total_results: 0, results: [] });
                return;
            }
            fetch(
                `https://api.inaturalist.org/v1/taxa?id=${customSpeciesIds.join(',')}&${getInaturalistLocaleQuery(locale)}&per_page=${customSpeciesIds.length}`,
            )
                .then((r) => r.json())
                .then((json) =>
                    setData({
                        total_results: json.total_results ?? (Array.isArray(json.results) ? json.results.length : 0),
                        results: Array.isArray(json.results)
                            ? json.results.map((taxon: any) => ({ ...taxon, observations_count: 1 }))
                            : [],
                    }),
                )
                .catch(console.error);
            return;
        }

        fetch(
            `https://api.inaturalist.org/v1/observations/species_counts?taxon_id=${taxonId}&lat=${coords.lat}&lng=${coords.lng}&radius=${coords.radius}&per_page=${numSpecies}&${getInaturalistLocaleQuery(locale)}`,
        )
            .then((r) => r.json())
            .then((json) =>
                setData({
                    total_results: json.total_results ?? 0,
                    results: Array.isArray(json.results)
                        ? json.results.map((row: any) => ({ ...row.taxon, observations_count: row.count }))
                        : [],
                }),
            )
            .catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taxonId, numSpecies, coords.lat, coords.lng, coords.radius, isCustomTest, customSpeciesIds, locale]);

    const generateQuestion = useCallback(() => {
        const d = dataRef.current;
        if (!d) return;
        setQuestionIndex((i) => i + 1);

        if (d.total_results === 0) {
            setQuestion({ media: null, species: null, correct: null });
            return;
        }

        const species = isCustomTest ? d.results : filterZeros(d.results);
        const numOpts = Math.min(species.length, 5);
        if (numOpts === 0) {
            setQuestion({ media: null, species: null, correct: null });
            return;
        }
        const options = getRandomCombination(species, numOpts);
        const correctIdx = Math.floor(Math.random() * numOpts);

        fetch(
            `https://api.inaturalist.org/v1/observations?${licenseParam}=cc-by-nc&taxon_id=${options[correctIdx].id}&quality_grade=research&order=desc&order_by=created_at&${getInaturalistLocaleQuery(locale)}`,
        )
            .then((r) => r.json())
            .then((json) => {
                const results: any[] = json.results ?? [];
                const obs = results[Math.floor(Math.random() * results.length)];
                setQuestion({
                    media: obs ? extractMedia(obs) : null,
                    species: options,
                    correct: correctIdx,
                });
            })
            .catch(console.error);
    }, [isCustomTest, locale, licenseParam, extractMedia]);

    /* Start when data arrives */
    useEffect(() => {
        if (data) generateQuestion();
    }, [data, generateQuestion]);

    const handleAnswer = (userResponse: number) => {
        const isCorrect = question?.correct === userResponse;
        setPoints((p) => p + (isCorrect ? 1 : 0));
        setAnsweredQuestions((prev) => [
            ...prev,
            { question: question!, userResponse, isCorrect },
        ]);
        generateQuestion();
    };

    const restart = () => {
        setPoints(0);
        setAnsweredQuestions([]);
        setQuestion(null);
        setQuestionIndex(-1);
        generateQuestion();
    };

    return {
        taxonName,
        question,
        questionIndex,
        numQuestions,
        points,
        answeredQuestions,
        customSpeciesIds,
        handleAnswer,
        restart,
        isReady: !!data,
    };
}