import SignOutButton from '@/components/auth/sign-out-button'
import { useAuthContext } from '@/hooks/use-auth-context'
import { Redirect, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { Screen, Card, Button } from '@/components/ui'
import type { SavedTest } from '@/app/test'
import type { SavedTaxon } from '@/app/explore/[taxon_id]'
import { supabase } from '@/lib/supabase'

import { colors, spacing, radius, fonts, cardShadow } from '@/theme/theme'

type SpeciesInfo = { id: number; name: string }

const LOCALES = [
    { code: 'ca', label: 'Català' },
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' }
]

function LocalePicker({ currentLocale, onChange }: { currentLocale: string; onChange: (code: string) => void }) {
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const current = LOCALES.find(l => l.code === currentLocale) ?? LOCALES[0]

    const handleSelect = async (code: string) => {
        setOpen(false)
        if (code === currentLocale) return
        setSaving(true)
        try {
            await supabase.auth.updateUser({ data: { locale: code } })
            onChange(code)
        } catch (e) {
            console.error(e)
            setSaving(false)
        }
    }

    return (
        <View style={localeStyles.container}>
            <Text style={localeStyles.label}>Idioma</Text>
            <TouchableOpacity
                style={[localeStyles.trigger, saving && localeStyles.triggerDisabled]}
                onPress={() => !saving && setOpen(true)}
                activeOpacity={0.7}
            >
                <Text style={localeStyles.triggerText}>
                    {saving ? 'Desant…' : current.label}
                </Text>
                <Text style={localeStyles.triggerChevron}>▾</Text>
            </TouchableOpacity>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable style={localeStyles.backdrop} onPress={() => setOpen(false)}>
                    <View style={localeStyles.sheet}>
                        {LOCALES.map(locale => (
                            <TouchableOpacity
                                key={locale.code}
                                style={[
                                    localeStyles.option,
                                    locale.code === currentLocale && localeStyles.optionSelected,
                                ]}
                                onPress={() => handleSelect(locale.code)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    localeStyles.optionText,
                                    locale.code === currentLocale && localeStyles.optionTextSelected,
                                ]}>
                                    {locale.label}
                                </Text>
                                {locale.code === currentLocale && (
                                    <Text style={localeStyles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    )
}

const localeStyles = StyleSheet.create({
    container: {
        gap: spacing.sm,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: colors.muted,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.bg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    triggerDisabled: {
        opacity: 0.5,
    },
    triggerText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    triggerChevron: {
        fontSize: 14,
        color: colors.muted,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    sheet: {
        width: 220,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        overflow: 'hidden',
        ...cardShadow,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    optionSelected: {
        backgroundColor: colors.accentLight ?? colors.bg,
    },
    optionText: {
        fontSize: 15,
        color: colors.text,
    },
    optionTextSelected: {
        fontWeight: '600',
        color: colors.accent ?? colors.text,
    },
    checkmark: {
        fontSize: 14,
        color: colors.accent ?? colors.text,
        fontWeight: '700',
    },
})


function SavedTestCard({ test, onDelete, locale }: { test: SavedTest; onDelete: () => void; locale: string }) {
    const router = useRouter()
    const [expanded, setExpanded] = useState(false)
    const [numQuestions, setNumQuestions] = useState(String(10))
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
            `https://api.inaturalist.org/v1/taxa?id=${test.speciesIds.join(',')}&locale=${locale}&per_page=${test.speciesIds.length}`
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
                                if (!isNaN(n))
                                    setNumQuestions(String(n + 1))
                            }}
                        >
                            <Text style={styles.numBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <Button
                        label={`Comença el test`}
                        onPress={handleStart}
                        style={styles.startBtn}
                    />
                </View>
            )}
        </View>
    )
}


function useTaxonNames(taxons: SavedTaxon[], locale: string): Record<number, string> {
    const [names, setNames] = useState<Record<number, string>>({})

    useEffect(() => {
        if (taxons.length === 0) return
        const ids = taxons.map(t => t.id).join(',')
        fetch(
            `https://api.inaturalist.org/v1/taxa?id=${ids}&locale=${locale}&per_page=${taxons.length}`
        )
            .then(r => r.json())
            .then(json => {
                const result: Record<number, string> = {}
                for (const t of (json.results ?? [])) {
                    result[t.id] = t.preferred_common_name ?? t.name ?? String(t.id)
                }
                setNames(result)
            })
            .catch(console.error)
    }, [taxons.map(t => t.id).join(','), locale])

    return names
}

export default function Profile() {
    const { claims, profile, isLoading, isLoggedIn } = useAuthContext()
    const router = useRouter()

    if (isLoading) return null
    if (!isLoggedIn) return <Redirect href="/login" />

    const username =
        profile?.username ?? claims?.user_metadata?.username ?? claims?.email

    const savedTests: SavedTest[] = claims?.user_metadata?.saved_tests ?? []
    const [localTests, setLocalTests] = useState<SavedTest[]>(savedTests)

    const savedTaxons: SavedTaxon[] = claims?.user_metadata?.saved_taxons ?? []
    const [locale, setLocale] = useState<string>(claims?.user_metadata?.locale ?? 'ca')
    const taxonNames = useTaxonNames(savedTaxons, locale)

    const handleDelete = (savedAt: string) => {
        setLocalTests(prev => prev.filter(t => t.savedAt !== savedAt))
    }

    const handleLocaleChange = (code: string) => {
        setLocale(code)
        router.replace('/profile')
    }

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Card>
                    <Text style={styles.heading}>Hola {username}!</Text>
                    {claims?.email && <Text style={styles.email}>{claims.email}</Text>}
                    <View style={styles.divider} />
                    <LocalePicker currentLocale={locale} onChange={handleLocaleChange} />
                    <View style={styles.actions}>
                        <SignOutButton />
                    </View>
                </Card>

                {savedTaxons.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Taxons guardats</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.taxonRow}
                        >
                            {savedTaxons.map(taxon => (
                                <TouchableOpacity
                                    key={taxon.id}
                                    style={styles.taxonCard}
                                    activeOpacity={0.75}
                                    onPress={() => router.push(`/explore/${taxon.id}`)}
                                >
                                    {taxon.imageUrl ? (
                                        <Image
                                            source={{ uri: taxon.imageUrl }}
                                            style={styles.taxonImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={[styles.taxonImage, styles.taxonImagePlaceholder]}>
                                            <Text style={styles.taxonImagePlaceholderText}>?</Text>
                                        </View>
                                    )}
                                    <Text style={styles.taxonName} numberOfLines={2}>{taxonNames[taxon.id] ?? taxon.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {localTests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tests desats</Text>
                        <View style={styles.testList}>
                            {localTests.map((test, i) => (
                                <SavedTestCard key={test.savedAt} test={test} onDelete={() => handleDelete(test.savedAt)} locale={locale} />
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
    taxonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingBottom: spacing.xs,
    },
    taxonCard: {
        width: 100,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        ...cardShadow,
    },
    taxonImage: {
        width: '100%',
        height: 80,
    },
    taxonImagePlaceholder: {
        backgroundColor: colors.accentLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taxonImagePlaceholderText: {
        fontSize: 22,
        color: colors.muted,
    },
    taxonName: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.text,
        padding: spacing.xs,
        textAlign: 'center',
        fontStyle: 'italic',
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
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
})