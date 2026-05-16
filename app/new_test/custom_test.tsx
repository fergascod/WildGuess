import React, { useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ScrollView,
} from "react-native";

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

function useDelayRequest<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    return useCallback(
        (...args: Parameters<T>) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => fn(...args), delay);
        },
        [fn, delay]
    ) as T;
}

export default function SpeciesSearchScreen() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Taxon[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Taxon[]>([]);

    const fetchSuggestions = useCallback(async (text: string) => {
        if (!text.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(text)}&locale=cat`,
                { headers: { Accept: "application/json" } }
            );
            const data: AutocompleteResult = await res.json();
            console.log(data);
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

    const renderItem = ({ item }: { item: Taxon }) => (
        <TouchableOpacity onPress={() => handleSelect(item)}>
            <Image source={{ uri: item.default_photo?.square_url }} style={{ width: 44, height: 44 }} />
            <Text>{item.matched_term}</Text>
        </TouchableOpacity>
    );

    const handleSelect = (taxon: Taxon) => {
        setSelected((prev) => prev.some((t) => t.id === taxon.id) ? prev : [...prev, taxon]);
    }

    const renderSelection = (taxon: Taxon) => (
        <TouchableOpacity key={taxon.id} style={{ marginRight: 8 }} onPress={() => setSelected((prev) => prev.filter((t) => t.id !== taxon.id))}>
            <Image source={{ uri: taxon.default_photo?.square_url }} style={{ width: 44, height: 44 }} />
            <Text>{taxon.matched_term}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text>Species Finder</Text>

            <TextInput
                value={query}
                onChangeText={handleChangeText}
                placeholder="Search species…"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
            />

            <FlatList
                data={results}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={!loading ? <Text>No results found.</Text> : null}
            />

            <View />

            {selected.length > 0 && (
                <View>
                    <Text>Selected species ({selected.length})</Text>
                    <ScrollView horizontal keyboardShouldPersistTaps="handled">
                        {selected.map(renderSelection)}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}