import { useEffect } from 'react';
import {
    useAudioPlayer,
    useAudioPlayerStatus,
    setAudioModeAsync,
} from 'expo-audio';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

import { Button } from '@/components/ui';
import { returnName } from '@/lib/utils';
import { useAuthContext } from '@/hooks/use-auth-context';
import { cardShadow, colors, fonts, radius, spacing } from '@/theme/theme';

import {
    useTestGame,
    type QuestionState,
    type AnsweredQuestion,
} from '@/lib/use-test-game';

// ---------------------------------------------------------------------------
// AudioPlayer
// ---------------------------------------------------------------------------

function AudioPlayer({ url }: { url: string }) {
    const { t } = useTranslation();

    // useAudioPlayer manages its own lifecycle — no manual cleanup needed.
    // We initialise it with the first URL; subsequent URL changes are handled
    // via player.replace() in the effect below.
    const player = useAudioPlayer({ uri: url });
    const status = useAudioPlayerStatus(player);

    // Keep silent-mode enabled once on mount
    useEffect(() => {
        setAudioModeAsync({ playsInSilentMode: true });
    }, []);

    // Swap the source whenever the URL changes (new question)
    useEffect(() => {
        player.replace({ uri: url });
    }, [url]);  // player identity is stable for the component lifetime

    const togglePlay = () => {
        if (status.playing) {
            player.pause();
        } else {
            // expo-audio doesn't auto-reset position after finishing — seek to start
            if (status.didJustFinish) {
                player.seekTo(0);
            }
            player.play();
        }
    };

    const isPlaying = status.playing;

    return (
        <Pressable
            style={({ pressed }) => [styles.playBtn, pressed && styles.playBtnPressed]}
            onPress={togglePlay}
        >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            <Text style={styles.playLabel}>
                {isPlaying ? t('sound_test.pause') : t('sound_test.play')}
            </Text>
        </Pressable>
    );
}

// ---------------------------------------------------------------------------
// SoundQuestion
// ---------------------------------------------------------------------------

function SoundQuestion({
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

    if (!question.media) {
        return (
            <View style={styles.page}>
                <View style={[styles.card, styles.emptyCard]}>
                    <Text style={styles.emptyText}>{t('test.question.noData')}</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.pageScroll} contentContainerStyle={styles.page}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{taxonName}</Text>
                    <Text style={styles.progress}>
                        {questionIndex + 1} / {numQuestions}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.audioWrap}>
                        <AudioPlayer url={question.media.url} />
                    </View>

                    <View style={styles.options}>
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
// SoundResults
// ---------------------------------------------------------------------------

function SoundResults({
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
    const { t } = useTranslation();
    const pct = Math.round((points / numQuestions) * 100);

    return (
        <ScrollView style={styles.pageScroll} contentContainerStyle={styles.resultsPage}>
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
                </View>

                <Text style={styles.resultsHeading}>{t('test.results.answersHeading')}</Text>

                <View style={styles.resultsGrid}>
                    {answeredQuestions.map((item, index) => {
                        const correctName = returnName(item.question.species![item.question.correct!]);
                        const userAnswerName = returnName(item.question.species![item.userResponse]);
                        return (
                            <View key={index} style={styles.resultsItem}>
                                <View
                                    style={[
                                        styles.resultsBadgeRow,
                                        item.isCorrect ? styles.resultsBadgeCorrect : styles.resultsBadgeWrong,
                                    ]}
                                >
                                    <Text style={styles.resultsBadgeText}>{item.isCorrect ? '✓' : '✗'}</Text>
                                    {item.question.media?.url && (
                                        <AudioPlayer url={item.question.media.url} />
                                    )}
                                </View>
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

export default function SoundTest() {
    const extractMedia = useCallback((obs: any) => {
        const sound = obs?.sounds?.[0];
        if (!sound) return null;
        return { url: sound.file_url ?? sound.file, attribution: sound.attribution };
    }, []);

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
    } = useTestGame('sound_license', extractMedia);

    if (questionIndex >= numQuestions) {
        return (
            <SoundResults
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
        <SoundQuestion
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
        maxWidth: 600,
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
    audioWrap: {
        padding: spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    playBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxl,
        backgroundColor: colors.accent,
        borderRadius: radius.pill,
    },
    playBtnPressed: { opacity: 0.75 },
    playIcon: { fontSize: 22, color: '#fff' },
    playLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
    options: {
        flex: 1,
        justifyContent: 'center',
        gap: 10,
        padding: spacing.xl,
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
    resultsGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
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
    resultsBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
    },
    resultsBadgeCorrect: { backgroundColor: colors.correct + '22' },
    resultsBadgeWrong: { backgroundColor: colors.wrong + '22' },
    resultsBadgeText: { fontSize: 18, fontWeight: '700' },
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