import SignOutButton from '@/components/auth/sign-out-button'
import { useAuthContext } from '@/hooks/use-auth-context'
import { Redirect, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { Screen, Card, Button } from '@/components/ui'
import type { SavedTest } from '@/app/test'
import { supabase } from '@/lib/supabase'

import { colors, spacing, radius, fonts, cardShadow } from '@/theme/theme'

type SpeciesInfo = { id: number; name: string }

function SavedTestCard({ test, onDelete }: { test: SavedTest; onDelete: () => void }) {
    const router = useRouter()
    const [expanded, setExpanded] = useState(false)
    const [numQuestions, setNumQuestions] = useState(String(Math.min(10, test.speciesIds.length)))
    const [species, setSpecies] = useState<SpeciesInfo[]>([])
    const [loadingSpecies, setLoadingSpecies] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const existing: SavedTest[] = user?.user_metadata?.saved_tests ?? []
            const updated = existing.filter(t => t.savedAt !== test.savedAt)
            await supabase.auth.updateUser({ data: { saved_tests: updated } })
            onDelete()
        } catch (e) {
            console.error(e)
            setDeleting(false)
        }
    }

    useEffect(() => {
        if (!expanded || species.length > 0) return
        setLoadingSpecies(true)
        fetch(
            `https://api.inaturalist.org/v1/taxa?id=${test.speciesIds.join(',')}&locale=ca&per_page=${test.speciesIds.length}`
        )
            .then(r => r.json())
            .then(json => {
                const results: any[] = json.results ?? []
                setSpecies(
                    results.map(t => ({
                        id: t.id,
                        name:
                            t.preferred_common_name ??
                            t.name ??
                            String(t.id),
                    }))
                )
            })
            .catch(console.error)
            .finally(() => setLoadingSpecies(false))
    }, [expanded])

    const handleStart = () => {
        const n = parseInt(numQuestions, 10)
        const validN = isNaN(n) || n < 1 ? 1 : n
        const speciesParam = test.speciesIds.join('%2C')
        router.push(`/test?num_questions=${validN}&species=${speciesParam}`)
    }

    const clampedN = (() => {
        const n = parseInt(numQuestions, 10)
        if (isNaN(n) || n < 1) return 1
        return Math.min(n, test.speciesIds.length)
    })()

    return (
        <View style={styles.testCard}>
            {/* Header — always visible, tap to expand/collapse */}
            <TouchableOpacity
                style={styles.testCardHeader}
                onPress={() => setExpanded(e => !e)}
                activeOpacity={0.7}
            >
                <View style={styles.testCardTitles}>
                    <Text style={styles.testName}>{test.name}</Text>
                    <Text style={styles.testMeta}>
                        {test.speciesIds.length} espècie{test.speciesIds.length !== 1 ? 's' : ''} · {new Date(test.savedAt).toLocaleDateString('ca-ES', {
                            day: 'numeric', month: 'short', year: 'numeric',
                        })}
                    </Text>
                </View>
                <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                    disabled={deleting}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.deleteBtnText}>{deleting ? '…' : '🗑️'}</Text>
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Expanded panel */}
            {expanded && (
                <View style={styles.testCardBody}>
                    {/* Species horizontal scroll */}
                    <Text style={styles.fieldLabel}>Espècies</Text>
                    {loadingSpecies ? (
                        <Text style={styles.loadingText}>Carregant espècies…</Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.speciesRow}
                        >
                            {species.map(sp => (
                                <View key={sp.id} style={styles.speciesChip}>
                                    <Text style={styles.speciesChipText}>{sp.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Number of questions */}
                    <Text style={styles.fieldLabel}>Nombre de preguntes</Text>
                    <View style={styles.numRow}>
                        <TouchableOpacity
                            style={styles.numBtn}
                            onPress={() => {
                                const n = parseInt(numQuestions, 10)
                                if (!isNaN(n) && n > 1) setNumQuestions(String(n - 1))
                            }}
                        >
                            <Text style={styles.numBtnText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.numInput}
                            value={numQuestions}
                            onChangeText={v => {
                                const cleaned = v.replace(/[^0-9]/g, '')
                                setNumQuestions(cleaned)
                            }}
                            onBlur={() => {
                                const n = parseInt(numQuestions, 10)
                                if (isNaN(n) || n < 1) setNumQuestions('1')
                                else if (n > test.speciesIds.length)
                                    setNumQuestions(String(test.speciesIds.length))
                            }}
                            keyboardType="number-pad"
                            maxLength={3}
                            selectTextOnFocus
                        />
                        <TouchableOpacity
                            style={styles.numBtn}
                            onPress={() => {
                                const n = parseInt(numQuestions, 10)
                                if (!isNaN(n) && n < test.speciesIds.length)
                                    setNumQuestions(String(n + 1))
                            }}
                        >
                            <Text style={styles.numBtnText}>+</Text>
                        </TouchableOpacity>
                        <Text style={styles.numMax}>
                            màx. {test.speciesIds.length}
                        </Text>
                    </View>

                    <Button
                        label={`Comença el test (${clampedN} preguntes)`}
                        onPress={handleStart}
                        style={styles.startBtn}
                    />
                </View>
            )}
        </View>
    )
}

export default function Profile() {
    const { claims, profile, isLoading, isLoggedIn } = useAuthContext()

    if (isLoading) return null
    if (!isLoggedIn) return <Redirect href="/login" />

    const username =
        profile?.username ?? claims?.user_metadata?.username ?? claims?.email

    const savedTests: SavedTest[] = claims?.user_metadata?.saved_tests ?? []
    const [localTests, setLocalTests] = useState<SavedTest[]>(savedTests)

    const handleDelete = (savedAt: string) => {
        setLocalTests(prev => prev.filter(t => t.savedAt !== savedAt))
    }

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Card>
                    <Text style={styles.heading}>Hola {username}!</Text>
                    {claims?.email && <Text style={styles.email}>{claims.email}</Text>}
                    <View style={styles.actions}>
                        <SignOutButton />
                    </View>
                </Card>

                {localTests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tests desats</Text>
                        <View style={styles.testList}>
                            {localTests.map((test, i) => (
                                <SavedTestCard key={test.savedAt} test={test} onDelete={() => handleDelete(test.savedAt)} />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </Screen>
    )
}

const styles = StyleSheet.create({
    scroll: {
        padding: spacing.xl,
        gap: spacing.xl,
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    email: {
        fontSize: 14,
        color: colors.muted,
    },
    actions: {
        marginTop: spacing.lg,
    },
    section: {
        gap: spacing.md,
    },
    sectionTitle: {
        fontFamily: fonts.display,
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    testList: {
        gap: spacing.md,
    },
    // Test card
    testCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...cardShadow,
    },
    testCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        gap: spacing.md,
    },
    testCardTitles: {
        flex: 1,
        gap: spacing.xs,
    },
    testName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    testMeta: {
        fontSize: 13,
        color: colors.muted,
    },
    chevron: {
        fontSize: 11,
        color: colors.muted,
    },
    deleteBtn: {
        padding: spacing.xs,
    },
    deleteBtnText: {
        fontSize: 16,
    },
    // Expanded body
    testCardBody: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: spacing.lg,
        gap: spacing.md,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: colors.muted,
    },
    loadingText: {
        fontSize: 13,
        color: colors.muted,
        fontStyle: 'italic',
    },
    speciesRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingBottom: spacing.xs,
    },
    speciesChip: {
        backgroundColor: colors.bg,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    speciesChipText: {
        fontSize: 13,
        color: colors.text,
        fontStyle: 'italic',
    },
    // Number stepper
    numRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    numBtn: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numBtnText: {
        fontSize: 18,
        color: colors.text,
        lineHeight: 22,
    },
    numInput: {
        width: 52,
        height: 36,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    numMax: {
        fontSize: 13,
        color: colors.muted,
        marginLeft: spacing.xs,
    },
    startBtn: {
        marginTop: spacing.xs,
    },
})