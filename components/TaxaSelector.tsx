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

interface Taxon {
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
}: {
    onSelect: (species: Taxon[]) => void;
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
                `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(
                    text
                )}&locale=cat`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                }
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
            const next =
                prev.some((t) => t.id === taxon.id)
                    ? prev
                    : [...prev, taxon];

            onSelect(next);

            return next;
        });
    };
    const renderItem = ({ item }: { item: Taxon }) => (
        <TouchableOpacity
            style={styles.resultCard}
            activeOpacity={0.8}
            onPress={() => handleSelect(item)}
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
                <Text style={styles.resultTitle}>
                    {item.matched_term}
                </Text>

                {item.preferred_common_name && (
                    <Text style={styles.resultSubtitle}>
                        {item.preferred_common_name}
                    </Text>
                )}

                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                        {item.rank}
                    </Text>

                    <Text style={styles.metaDot}>•</Text>

                    <Text style={styles.metaText}>
                        {item.observations_count.toLocaleString()} obs.
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderSelection = (taxon: Taxon) => (
        <TouchableOpacity
            key={taxon.id}
            style={styles.selectedCard}
            activeOpacity={0.8}
            onPress={() => {
                setSelected((prev) => {
                    const next = prev.filter((t) => t.id !== taxon.id);
                    onSelect(next);
                    return next;
                });
            }}
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

            <Text
                numberOfLines={1}
                style={styles.selectedText}
            >
                {taxon.matched_term}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.page}>
            <View style={styles.container}>
                <View style={styles.headerCard}>
                    <Text style={styles.title}>
                        Cercador d'espècies
                    </Text>

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
                </View>

                <View style={styles.resultsCard}>
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
                            contentContainerStyle={
                                results.length === 0
                                    ? styles.emptyContainer
                                    : styles.resultsList
                            }
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>
                                    Cap resultat
                                </Text>
                            }
                        />
                    )}
                </View>

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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: colors.bg,
    },

    container: {
        flex: 1,
        padding: spacing.lg,
        gap: spacing.lg,
        maxWidth: 900,
        width: "100%",
        alignSelf: "center",
    },

    headerCard: {
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
        fontSize: 28,
        fontWeight: "700",
        color: colors.text,
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

    resultsCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        ...cardShadow,
    },

    resultsList: {
        padding: spacing.md,
        gap: spacing.sm,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        minHeight: 200,
    },

    emptyContainer: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
    },

    emptyText: {
        fontSize: 15,
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

    resultImage: {
        width: 56,
        height: 56,
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
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
    },

    resultSubtitle: {
        fontSize: 14,
        color: colors.muted,
    },

    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },

    metaText: {
        fontSize: 12,
        color: colors.muted,
        textTransform: "capitalize",
    },

    metaDot: {
        marginHorizontal: 6,
        color: colors.muted,
    },

    selectionSection: {
        gap: spacing.sm,
    },

    selectionTitle: {
        fontFamily: fonts.display,
        fontSize: 18,
        fontWeight: "600",
        color: colors.text,
    },

    selectionScroll: {
        paddingBottom: spacing.xs,
    },

    selectedCard: {
        width: 100,
        marginRight: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing.sm,
        alignItems: "center",
        gap: spacing.xs,
        ...cardShadow,
    },

    selectedImage: {
        width: 72,
        height: 72,
        borderRadius: radius.md,
        backgroundColor: colors.accentLight,
    },

    selectedText: {
        fontSize: 12,
        textAlign: "center",
        color: colors.text,
    },
});