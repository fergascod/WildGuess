import React, { useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from "react-native";

import { cardShadow, colors, fonts, radius, spacing } from "@/theme/theme";

export interface Taxon {
    id: number;
    name: string;
    preferred_common_name?: string;
    matched_term: string;
    default_photo?: { square_url: string };
    rank: string;
    observations_count: number;
}

interface AutocompleteResult {
    results: Taxon[];
    total_results: number;
}

function useDelayRequest<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): T {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => fn(...args), delay);
        },
        [fn, delay]
    ) as T;
}

export default function SpeciesSearchScreen({
    onSelect,
    locale = 'ca',
}: {
    onSelect: (species: Taxon[]) => void;
    locale?: string;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Taxon[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Taxon[]>([]);

    const fetchSuggestions = useCallback(async (text: string) => {
        if (!text.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(text)}&locale=${locale}&rank=species`,
                { headers: { Accept: "application/json" } }
            );

            const data: AutocompleteResult = await res.json();
            setResults(data.results ?? []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const delayedFetch = useDelayRequest(fetchSuggestions, 350);

    const handleChangeText = (text: string) => {
        setQuery(text);
        delayedFetch(text);
    };

    const handleSelect = (taxon: Taxon) => {
        setSelected((prev) => {
            const next = prev.some((t) => t.id === taxon.id)
                ? prev
                : [...prev, taxon];
            onSelect(next);
            return next;
        });
    };

    const handleDeselect = (taxon: Taxon) => {
        setSelected((prev) => {
            const next = prev.filter((t) => t.id !== taxon.id);
            onSelect(next);
            return next;
        });
    };

    const renderItem = ({ item }: { item: Taxon }) => {
        const isSelected = selected.some((t) => t.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.resultCard, isSelected && styles.resultCardSelected]}
                activeOpacity={0.8}
                onPress={() => isSelected ? handleDeselect(item) : handleSelect(item)}
            >
                {item.default_photo?.square_url ? (
                    <Image
                        source={{ uri: item.default_photo.square_url }}
                        style={styles.resultImage}
                    />
                ) : (
                    <View style={[styles.resultImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderText}>?</Text>
                    </View>
                )}

                <View style={styles.resultContent}>
                    <Text style={styles.resultTitle}>{item.matched_term}</Text>

                    {item.preferred_common_name && (
                        <Text style={styles.resultSubtitle}>
                            {item.preferred_common_name}
                        </Text>
                    )}

                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{item.rank}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>
                            {item.observations_count.toLocaleString()} obs.
                        </Text>
                    </View>
                </View>

                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Text style={styles.checkText}>✓</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderSelection = (taxon: Taxon) => (
        <TouchableOpacity
            key={taxon.id}
            style={styles.selectedCard}
            activeOpacity={0.8}
            onPress={() => handleDeselect(taxon)}
        >
            {taxon.default_photo?.square_url ? (
                <Image
                    source={{ uri: taxon.default_photo.square_url }}
                    style={styles.selectedImage}
                />
            ) : (
                <View style={[styles.selectedImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>?</Text>
                </View>
            )}

            <Text numberOfLines={1} style={styles.selectedText}>
                {taxon.matched_term}
            </Text>

            <View style={styles.removeBadge}>
                <Text style={styles.removeText}>×</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.wrapper}>
            {/* Selected species strip */}
            {selected.length > 0 && (
                <View style={styles.selectionSection}>
                    <Text style={styles.selectionTitle}>
                        Espècies seleccionades ({selected.length})
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.selectionScroll}
                    >
                        {selected.map(renderSelection)}
                    </ScrollView>
                </View>
            )}

            {/* Search card */}
            <View style={styles.searchCard}>
                <Text style={styles.subtitle}>
                    Cerca i selecciona espècies de iNaturalist
                </Text>

                <TextInput
                    value={query}
                    onChangeText={handleChangeText}
                    placeholder="Escriu el nom d'una espècie..."
                    placeholderTextColor={colors.muted}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                    style={styles.input}
                />

                {/* Results — fixed height, scrollable */}
                {(loading || query.trim().length > 0) && (
                    <View style={styles.resultsContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color={colors.accent} />
                            </View>
                        ) : (
                            <FlatList
                                data={results}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={renderItem}
                                keyboardShouldPersistTaps="handled"
                                scrollEnabled={true}
                                nestedScrollEnabled={true}
                                contentContainerStyle={
                                    results.length === 0
                                        ? styles.emptyContainer
                                        : styles.resultsList
                                }
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>Cap resultat</Text>
                                }
                            />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const RESULTS_MAX_HEIGHT = 320;

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing.lg,
    },

    searchCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.xl,
        gap: spacing.md,
        ...cardShadow,
    },

    subtitle: {
        fontSize: 15,
        color: colors.muted,
        lineHeight: 22,
    },

    input: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: 16,
        color: colors.text,
    },

    // Fixed-height scrollable results box
    resultsContainer: {
        maxHeight: RESULTS_MAX_HEIGHT,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: colors.bg,
    },

    resultsList: {
        padding: spacing.sm,
        gap: spacing.sm,
    },

    loadingContainer: {
        height: 100,
        justifyContent: "center",
        alignItems: "center",
    },

    emptyContainer: {
        height: 100,
        justifyContent: "center",
        alignItems: "center",
    },

    emptyText: {
        fontSize: 14,
        color: colors.muted,
        fontStyle: "italic",
    },

    resultCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing.sm,
        gap: spacing.md,
    },

    resultCardSelected: {
        borderColor: colors.accent,
        backgroundColor: colors.accentLight,
    },

    resultImage: {
        width: 48,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: colors.accentLight,
    },

    placeholderImage: {
        justifyContent: "center",
        alignItems: "center",
    },

    placeholderText: {
        color: colors.muted,
        fontWeight: "600",
    },

    resultContent: {
        flex: 1,
        gap: 2,
    },

    resultTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.text,
    },

    resultSubtitle: {
        fontSize: 13,
        color: colors.muted,
    },

    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },

    metaText: {
        fontSize: 11,
        color: colors.muted,
        textTransform: "capitalize",
    },

    metaDot: {
        marginHorizontal: 5,
        color: colors.muted,
        fontSize: 11,
    },

    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
    },

    checkText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },

    // Selected species strip
    selectionSection: {
        gap: spacing.sm,
    },

    selectionTitle: {
        fontFamily: fonts.display,
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
    },

    selectionScroll: {
        paddingBottom: spacing.xs,
        gap: spacing.sm,
    },

    selectedCard: {
        width: 88,
        marginRight: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.accent,
        borderRadius: radius.lg,
        padding: spacing.sm,
        alignItems: "center",
        gap: spacing.xs,
        ...cardShadow,
    },

    selectedImage: {
        width: 60,
        height: 60,
        borderRadius: radius.md,
        backgroundColor: colors.accentLight,
    },

    selectedText: {
        fontSize: 11,
        textAlign: "center",
        color: colors.text,
    },

    removeBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.muted,
        alignItems: "center",
        justifyContent: "center",
    },

    removeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 14,
    },
});