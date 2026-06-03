import { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { returnName } from '@/lib/utils';
import { useAuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';
import { cardShadow, colors, fonts, radius, spacing } from '@/theme/theme';
import { useState, useEffect } from 'react';

import {
  useTestGame,
  type MediaInfo,
  type QuestionState,
  type AnsweredQuestion,
  type SavedTest,
} from '@/lib/use-test-game';

// ---------------------------------------------------------------------------
// SaveTestModal
// ---------------------------------------------------------------------------

function SaveTestModal({
  visible,
  speciesIds,
  onClose,
}: {
  visible: boolean;
  speciesIds: number[];
  onClose: () => void;
}) {
  const { claims } = useAuthContext();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setError(null);
      setSaved(false);
    }
  }, [visible]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('test.save.nameRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const existing: SavedTest[] = claims?.user_metadata?.saved_tests ?? [];
      const newTest: SavedTest = {
        name: trimmed,
        speciesIds,
        savedAt: new Date().toISOString(),
      };
      const updated = [...existing, newTest];
      const { error: supabaseError } = await supabase.auth.updateUser({
        data: { saved_tests: updated },
      });
      if (supabaseError) throw supabaseError;
      setSaved(true);
    } catch (e: any) {
      setError(e?.message ?? t('test.save.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={saveStyles.backdrop}>
        <View style={saveStyles.dialog}>
          {saved ? (
            <>
              <Text style={saveStyles.title}>{t('test.save.savedTitle')}</Text>
              <Text style={saveStyles.subtitle}>{t('test.save.savedSubtitle')}</Text>
              <Button label={t('test.save.close')} onPress={onClose} style={saveStyles.btn} />
            </>
          ) : (
            <>
              <Text style={saveStyles.title}>{t('test.save.title')}</Text>
              <Text style={saveStyles.subtitle}>{t('test.save.subtitle')}</Text>
              <TextInput
                style={saveStyles.input}
                placeholder={t('test.save.namePlaceholder')}
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={60}
              />
              {error && <Text style={saveStyles.error}>{error}</Text>}
              <View style={saveStyles.row}>
                <Button
                  label={t('test.save.cancel')}
                  variant="secondary"
                  onPress={onClose}
                  style={saveStyles.btn}
                />
                <Button
                  label={saving ? t('test.save.saving') : t('test.save.save')}
                  onPress={handleSave}
                  style={saveStyles.btn}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const saveStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    ...cardShadow,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: { fontSize: 14, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  error: { fontSize: 13, color: colors.wrong },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  btn: { width: 'auto', paddingHorizontal: spacing.xl },
});

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

function Lightbox({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.lightboxBackdrop} onPress={onClose}>
        {uri && <Image source={{ uri }} style={styles.lightboxImage} resizeMode="contain" />}
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Question
// ---------------------------------------------------------------------------

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
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 640;

  if (!question.media) {
    return (
      <View style={styles.page}>
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>{t('test.question.noData')}</Text>
        </View>
      </View>
    );
  }

  const imageUrl = question.media.url.replace('square', 'medium');

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
            <Image source={{ uri: imageUrl }} style={styles.questionImage} resizeMode="cover" />
            <Text style={styles.zoomHint}>{t('test.question.zoomHint')}</Text>
          </Pressable>

          <View style={[styles.options, wide && styles.optionsWide]}>
            <Text style={styles.optionsLabel}>{t('test.question.optionsLabel')}</Text>
            {question.species!.map((species, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.optionBtn, pressed && styles.optionBtnPressed]}
                onPress={() => handleAnswer(i)}
              >
                <Text style={styles.optionText}>{returnName(species)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {question.media.attribution && (
          <Text style={styles.attribution}>{question.media.attribution}</Text>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function Results({
  points,
  numQuestions,
  answeredQuestions,
  onRestart,
  speciesList,
}: {
  points: number;
  numQuestions: number;
  answeredQuestions: AnsweredQuestion[];
  onRestart: () => void;
  speciesList: number[];
}) {
  const { isLoggedIn } = useAuthContext();
  const { t } = useTranslation();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const pct = Math.round((points / numQuestions) * 100);

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.resultsPage}>
      <Lightbox uri={activeImage} onClose={() => setActiveImage(null)} />
      <SaveTestModal
        visible={saveModalVisible}
        speciesIds={speciesList}
        onClose={() => setSaveModalVisible(false)}
      />

      <View style={styles.resultsWrap}>
        <View style={styles.resultsScore}>
          <Text style={styles.resultsScoreTitle}>{t('test.results.completedTitle')}</Text>
          <Text style={styles.resultsStat}>
            {t('test.results.scorePrefix')}{' '}
            <Text style={styles.resultsNum}>{points}</Text> {t('test.results.scoreMiddle')}{' '}
            <Text style={styles.resultsNum}>{numQuestions}</Text> ({pct}%)
          </Text>
        </View>

        <View style={styles.resultsActions}>
          <Button label={t('test.results.newTest')} href="/new_test" style={styles.actionBtn} />
          <Button
            label={t('test.results.repeatTest')}
            variant="secondary"
            onPress={onRestart}
            style={styles.actionBtn}
          />
          {isLoggedIn && speciesList.length > 0 && (
            <Button
              label={t('test.results.saveTest')}
              variant="secondary"
              style={styles.actionBtn}
              onPress={() => setSaveModalVisible(true)}
            />
          )}
        </View>

        <Text style={styles.resultsHeading}>{t('test.results.answersHeading')}</Text>

        <View style={styles.resultsGrid}>
          {answeredQuestions.map((item, index) => {
            const imgUrl = item.question.media!.url.replace('square', 'original');
            const correctName = returnName(item.question.species![item.question.correct!]);
            const userAnswerName = returnName(item.question.species![item.userResponse]);
            return (
              <View key={index} style={styles.resultsItem}>
                <Pressable
                  style={styles.resultsItemImgWrap}
                  onPress={() => setActiveImage(imgUrl)}
                >
                  <Image source={{ uri: imgUrl }} style={styles.resultsItemImg} resizeMode="cover" />
                  <View style={[styles.badge, item.isCorrect ? styles.badgeCorrect : styles.badgeWrong]}>
                    <Text style={styles.badgeText}>{item.isCorrect ? '✓' : '✗'}</Text>
                  </View>
                </Pressable>
                <View style={styles.resultsItemBody}>
                  <Text style={styles.resultsItemCorrect}>{correctName}</Text>
                  {!item.isCorrect && (
                    <>
                      <Text style={styles.resultsItemWrongLabel}>{t('test.results.yourAnswer')}</Text>
                      <Text style={styles.resultsItemWrong}>{userAnswerName}</Text>
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function Test() {
  const extractMedia = useCallback(
    (obs: any) => (obs?.photos?.[0] ? { url: obs.photos[0].url, attribution: obs.photos[0].attribution } : null),
    [],
  );

  const {
    taxonName,
    question,
    questionIndex,
    numQuestions,
    points,
    answeredQuestions,
    customSpeciesIds,
    handleAnswer,
    restart,
  } = useTestGame('photo_license', extractMedia);

  if (questionIndex >= numQuestions) {
    return (
      <Results
        points={points}
        numQuestions={numQuestions}
        answeredQuestions={answeredQuestions}
        onRestart={restart}
        speciesList={customSpeciesIds}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  pageScroll: { flex: 1, backgroundColor: colors.bg },
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
  emptyCard: { maxWidth: 480, padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.muted, fontStyle: 'italic' },
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
  progress: { fontSize: 13, fontWeight: '600', color: colors.muted },
  cardBody: { flexDirection: 'column' },
  cardBodyWide: { flexDirection: 'row', alignItems: 'stretch' },
  imageWrap: { width: '100%', backgroundColor: '#000', position: 'relative' },
  imageWrapWide: { width: '55%' },
  questionImage: { width: '100%', height: 340 },
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
  optionsWide: { borderTopWidth: 0, borderLeftWidth: 1, borderLeftColor: colors.border },
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
  optionBtnPressed: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  optionText: { fontSize: 14, fontWeight: '500', color: colors.text },
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
  lightboxImage: { width: '100%', height: '90%' },
  resultsPage: { backgroundColor: colors.bg, padding: spacing.xl, paddingVertical: 40 },
  resultsWrap: {
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  resultsScore: { alignItems: 'center', gap: spacing.sm },
  resultsScoreTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  resultsStat: { fontSize: 18, color: colors.muted },
  resultsNum: { fontWeight: '700', color: colors.accent },
  resultsActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  actionBtn: { width: 'auto', paddingHorizontal: spacing.xl },
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
  resultsItemImgWrap: { position: 'relative', backgroundColor: '#000' },
  resultsItemImg: { width: '100%', height: 160 },
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
  badgeCorrect: { backgroundColor: colors.correct },
  badgeWrong: { backgroundColor: colors.wrong },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resultsItemBody: { padding: spacing.md, gap: spacing.xs },
  resultsItemCorrect: { fontSize: 14, fontWeight: '600', color: colors.text },
  resultsItemWrongLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    color: colors.muted,
  },
  resultsItemWrong: { fontSize: 13, color: colors.wrong },
});