import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/ui';
import { returnName } from '@/lib/utils';
import { cardShadow, colors, fonts, radius, spacing } from '@/theme/theme';

type PhotoInfo = { url: string; attribution?: string };
type Species = { id: number; observations_count: number; [key: string]: any };

interface QuestionState {
  url: PhotoInfo | null;
  species: Species[] | null;
  correct: number | null;
}

interface AnsweredQuestion {
  question: QuestionState;
  userResponse: number;
  isCorrect: boolean;
}

function filterZeros(arr: Species[]): Species[] {
  let n = 1;
  while (n < arr.length && arr[n].observations_count > 0) n++;
  return arr.slice(0, n);
}

function getRandomCombination<T>(arr: T[], k: number): T[] {
  const tmp = [...arr];
  const out: T[] = [];
  for (let i = 0; i < k && tmp.length > 0; i++) {
    const idx = Math.floor(Math.random() * tmp.length);
    out.push(tmp[idx]);
    tmp.splice(idx, 1);
  }
  return out;
}

function first<T>(v: T | T[] | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function Lightbox({
  uri,
  onClose,
}: {
  uri: string | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.lightboxBackdrop} onPress={onClose}>
        {uri && (
          <Image source={{ uri }} style={styles.lightboxImage} resizeMode="contain" />
        )}
      </Pressable>
    </Modal>
  );
}

function Question({
  taxonName,
  question,
  questionIndex,
  numQuestions,
  handleAnswer,
}: {
  taxonName: string;
  question: QuestionState;
  questionIndex: number;
  numQuestions: number;
  handleAnswer: (userResponse: number) => void;
}) {
  const [zoom, setZoom] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 640;

  if (!question.url) {
    return (
      <View style={styles.page}>
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>No hi ha dades per a aquest taxó.</Text>
        </View>
      </View>
    );
  }

  const imageUrl = question.url.url.replace('square', 'original');

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.page}>
      <Lightbox uri={zoom ? imageUrl : null} onClose={() => setZoom(false)} />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{taxonName}</Text>
          <Text style={styles.progress}>
            {questionIndex + 1} / {numQuestions}
          </Text>
        </View>

        <View style={[styles.cardBody, wide && styles.cardBodyWide]}>
          <Pressable
            style={[styles.imageWrap, wide && styles.imageWrapWide]}
            onPress={() => setZoom(true)}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.questionImage}
              resizeMode="cover"
            />
            <Text style={styles.zoomHint}>🔍 Ampliar</Text>
          </Pressable>

          <View style={[styles.options, wide && styles.optionsWide]}>
            <Text style={styles.optionsLabel}>De quina espècie és?</Text>
            {question.species!.map((species, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.optionBtn,
                  pressed && styles.optionBtnPressed,
                ]}
                onPress={() => handleAnswer(i)}
              >
                <Text style={styles.optionText}>{returnName(species)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {question.url.attribution && (
          <Text style={styles.attribution}>{question.url.attribution}</Text>
        )}
      </View>
    </ScrollView>
  );
}

function Results({
  points,
  numQuestions,
  answeredQuestions,
  onRestart,
}: {
  points: number;
  numQuestions: number;
  answeredQuestions: AnsweredQuestion[];
  onRestart: () => void;
}) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const pct = Math.round((points / numQuestions) * 100);

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.resultsPage}>
      <Lightbox uri={activeImage} onClose={() => setActiveImage(null)} />

      <View style={styles.resultsWrap}>
        <View style={styles.resultsScore}>
          <Text style={styles.resultsScoreTitle}>Test completat!</Text>
          <Text style={styles.resultsStat}>
            Has encertat{' '}
            <Text style={styles.resultsNum}>{points}</Text> de{' '}
            <Text style={styles.resultsNum}>{numQuestions}</Text> ({pct}%)
          </Text>
        </View>

        <View style={styles.resultsActions}>
          <Button label="Fes un altre test" href="/new_test" style={styles.actionBtn} />
          <Button
            label="Repeteix aquest test"
            variant="secondary"
            onPress={onRestart}
            style={styles.actionBtn}
          />
        </View>

        <Text style={styles.resultsHeading}>Respostes</Text>

        <View style={styles.resultsGrid}>
          {answeredQuestions.map((item, index) => {
            const imgUrl = item.question.url!.url.replace('square', 'original');
            const correctName = returnName(
              item.question.species![item.question.correct!],
            );
            const userAnswerName = returnName(
              item.question.species![item.userResponse],
            );
            return (
              <View key={index} style={styles.resultsItem}>
                <Pressable
                  style={styles.resultsItemImgWrap}
                  onPress={() => setActiveImage(imgUrl)}
                >
                  <Image
                    source={{ uri: imgUrl }}
                    style={styles.resultsItemImg}
                    resizeMode="cover"
                  />
                  <View
                    style={[
                      styles.badge,
                      item.isCorrect ? styles.badgeCorrect : styles.badgeWrong,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {item.isCorrect ? '✓' : '✗'}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.resultsItemBody}>
                  <Text style={styles.resultsItemCorrect}>{correctName}</Text>
                  {!item.isCorrect && (
                    <>
                      <Text style={styles.resultsItemWrongLabel}>
                        La teva resposta
                      </Text>
                      <Text style={styles.resultsItemWrong}>
                        {userAnswerName}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

export default function Test() {
  const params = useLocalSearchParams<{
    taxon_id?: string;
    num_questions?: string;
    num_species?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  }>();

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
  const [data, setData] = useState<{
    total_results: number;
    results: Species[];
  } | null>(null);
  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [points, setPoints] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>(
    [],
  );
  const dataRef = useRef(data);
  dataRef.current = data;

  /* Fetch taxon name */
  useEffect(() => {
    fetch(
      `https://api.inaturalist.org/v1/taxa?id=${taxonId}&locale=ca&per_page=1`,
    )
      .then((r) => r.json())
      .then((json) => setTaxonName(returnName(json.results[0])))
      .catch(console.error);
  }, [taxonId]);

  /* Fetch species pool */
  useEffect(() => {
    fetch(
      `https://api.inaturalist.org/v1/observations/species_counts?taxon_id=${taxonId}&lat=${coords.lat}&lng=${coords.lng}&radius=${coords.radius}&per_page=${numSpecies}&locale=ca`,
    )
      .then((r) => r.json())
      .then((json) =>
        setData({
          total_results: json.total_results,
          results: json.results.map((row: any) => ({
            ...row.taxon,
            observations_count: row.count,
          })),
        }),
      )
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxonId, numSpecies]);

  const generateQuestion = useCallback(() => {
    const d = dataRef.current;
    if (!d) return;
    setQuestionIndex((i) => i + 1);

    if (d.total_results === 0) {
      setQuestion({ url: null, species: null, correct: null });
      return;
    }

    const species = filterZeros(d.results);
    const numOpts = Math.min(species.length, 5);
    if (numOpts === 0) {
      setQuestion({ url: null, species: null, correct: null });
      return;
    }
    const options = getRandomCombination(species, numOpts);
    const correctIdx = Math.floor(Math.random() * numOpts);

    fetch(
      `https://api.inaturalist.org/v1/observations?photo_license=cc-by-nc&taxon_id=${options[correctIdx].id}&quality_grade=research&order=desc&order_by=created_at`,
    )
      .then((r) => r.json())
      .then((json) => {
        const results: any[] = json.results ?? [];
        const obs = results[Math.floor(Math.random() * results.length)];
        // No observations / no photo for this species: show a "no data"
        // state instead of crashing on a missing dereference.
        setQuestion({
          url: obs?.photos?.[0] ?? null,
          species: options,
          correct: correctIdx,
        });
      })
      .catch(console.error);
  }, []);

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

  if (questionIndex >= numQuestions) {
    return (
      <Results
        points={points}
        numQuestions={numQuestions}
        answeredQuestions={answeredQuestions}
        onRestart={restart}
      />
    );
  }

  if (!question) {
    return (
      <View style={styles.page}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Question
      taxonName={taxonName}
      question={question}
      questionIndex={questionIndex}
      numQuestions={numQuestions}
      handleAnswer={handleAnswer}
    />
  );
}

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  emptyCard: {
    maxWidth: 480,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
  },
  cardHeader: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  progress: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  cardBody: {
    flexDirection: 'column',
  },
  cardBodyWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  imageWrap: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  imageWrapWide: {
    width: '55%',
  },
  questionImage: {
    width: '100%',
    height: 340,
  },
  zoomHint: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
    color: '#fff',
    fontSize: 11,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  options: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionsWide: {
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  optionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  optionBtn: {
    width: '100%',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionBtnPressed: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  attribution: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    fontSize: 11,
    color: colors.muted,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  lightboxImage: {
    width: '100%',
    height: '90%',
  },
  /* results */
  resultsPage: {
    backgroundColor: colors.bg,
    padding: spacing.xl,
    paddingVertical: 40,
  },
  resultsWrap: {
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  resultsScore: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultsScoreTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  resultsStat: {
    fontSize: 18,
    color: colors.muted,
  },
  resultsNum: {
    fontWeight: '700',
    color: colors.accent,
  },
  resultsActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  actionBtn: {
    width: 'auto',
    paddingHorizontal: spacing.xl,
  },
  resultsHeading: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    alignSelf: 'flex-start',
  },
  resultsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  resultsItem: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  resultsItemImgWrap: {
    position: 'relative',
    backgroundColor: '#000',
  },
  resultsItemImg: {
    width: '100%',
    height: 160,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCorrect: {
    backgroundColor: colors.correct,
  },
  badgeWrong: {
    backgroundColor: colors.wrong,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultsItemBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  resultsItemCorrect: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  resultsItemWrongLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    color: colors.muted,
  },
  resultsItemWrong: {
    fontSize: 13,
    color: colors.wrong,
  },
});
