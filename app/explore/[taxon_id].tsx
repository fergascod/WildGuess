import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import type { ExternalPathString } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/ui';
import { returnName } from '@/lib/utils';
import { useAuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';
import Svg, { Path } from 'react-native-svg';
import { cardShadow, colors, fonts, radius, spacing } from '@/theme/theme';

interface TaxonData {
  taxon_name: string;
  parent_id: number | null;
  image: { url: string; attribution: string } | null;
}

interface ChildTaxon {
  id: number;
  name: string;
}

function parseTaxon(json: any): TaxonData {
  const result = json.results[0];
  return {
    taxon_name: returnName(result),
    parent_id: result.parent_id ?? null,
    image: result.default_photo ?? null,
  };
}

function parseChildren(json: any): ChildTaxon[] {
  const n = Math.min(json.total_results, json.per_page);
  return Array.from({ length: n }, (_, i) => ({
    id: json.results[i].id,
    name: returnName(json.results[i]),
  }));
}

function normalizeId(raw: string | string[] | undefined): string {
  const id = Array.isArray(raw) ? raw[0] : raw;
  return id && /^\+?(0|[1-9]\d*)$/.test(id) ? id : '1';
}

export type SavedTaxon = {
  id: number;
  name: string;
  imageUrl: string | null;
};

function BookmarkButton({ taxonId, taxonName, imageUrl }: { taxonId: string; taxonName: string; imageUrl: string | null }) {
  const { claims, isLoggedIn } = useAuthContext();
  const existing: SavedTaxon[] = claims?.user_metadata?.saved_taxons ?? [];
  const alreadySaved = existing.some(t => String(t.id) === taxonId);
  const [bookmarked, setBookmarked] = useState(alreadySaved);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    if (!isLoggedIn || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const current: SavedTaxon[] = user?.user_metadata?.saved_taxons ?? [];
      const updated = bookmarked
        ? current.filter(t => String(t.id) !== taxonId)
        : [...current, { id: Number(taxonId), name: taxonName, imageUrl }];
      await supabase.auth.updateUser({ data: { saved_taxons: updated } });
      setBookmarked(b => !b);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <TouchableOpacity
      onPress={handleToggle}
      disabled={saving}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={bookmarkStyles.btn}
      accessibilityLabel={bookmarked ? 'Elimina dels guardats' : 'Desa taxó'}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24">
        {bookmarked ? (
          <Path
            d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z"
            fill={colors.accent}
          />
        ) : (
          <Path
            d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z"
            fill="none"
            stroke={colors.muted}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        )}
      </Svg>
    </TouchableOpacity>
  );
}

const bookmarkStyles = StyleSheet.create({
  btn: {
    padding: spacing.xs,
  },
});

function TaxonCard({ taxonId, data }: { taxonId: string; data: TaxonData }) {
  const imageUrl = data.image?.url.replace('square', 'original') ?? null;
  const externalUrl = `https://www.inaturalist.org/taxa/${taxonId}` as ExternalPathString;

  return (
    <View style={[styles.card, styles.mainCard]}>
      <View style={styles.titleRow}>
        <BookmarkButton taxonId={taxonId} taxonName={data.taxon_name} imageUrl={imageUrl} />
        <Link href={externalUrl} asChild>
          <Text style={styles.cardTitle}>{data.taxon_name}</Text>
        </Link>
      </View>

      {data.parent_id != null && (
        <Link href={`/explore/${data.parent_id}`} asChild>
          <Pressable>
            <Text style={styles.parentLink}>← Ves al taxó pare</Text>
          </Pressable>
        </Link>
      )}

      <Button
        label="Fes un test d'aquest taxó"
        href={`/new_test/${taxonId}`}
        style={styles.cta}
      />

      {imageUrl ? (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>Sense imatge disponible</Text>
        </View>
      )}

      {data.image && (
        <Text style={styles.attribution}>{data.image.attribution}</Text>
      )}
    </View>
  );
}

interface SearchResult {
  id: number;
  name: string;

  preferred_common_name?: string;
  default_photo?: { square_url: string };
  rank: string;
  matched_term: string;
}

function TaxonSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (text: string) => {
    if (!text.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(text)}&locale=ca&per_page=10`,
        { headers: { Accept: 'application/json' } },
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchResults(text), 350);
  };

  const handlePick = (id: number) => {
    onClose();
    router.push(`/explore/${id}`);
  };

  return (
    <View style={styles.searchContainer}>
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder="Cerca un taxó..."
        placeholderTextColor={colors.muted}
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.searchInput}
      />
      {loading && (
        <View style={styles.searchLoading}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      )}
      {!loading && results.length > 0 && (
        <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled">
          {results.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.searchItem}
              activeOpacity={0.75}
              onPress={() => handlePick(item.id)}
            >
              {item.default_photo?.square_url ? (
                <Image
                  source={{ uri: item.default_photo.square_url }}
                  style={styles.searchItemImage}
                />
              ) : (
                <View style={[styles.searchItemImage, styles.searchItemImagePlaceholder]}>
                  <Text style={styles.placeholderText}>?</Text>
                </View>
              )}
              <View style={styles.searchItemContent}>
                <Text style={styles.searchItemName} numberOfLines={1}>{item.matched_term}</Text>
                {item.preferred_common_name && (
                  <Text style={styles.searchItemCommon} numberOfLines={1}>
                    {item.preferred_common_name}
                  </Text>
                )}
                <Text style={styles.searchItemRank}>{item.rank}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {!loading && query.trim().length > 0 && results.length === 0 && (
        <Text style={styles.emptyText}>Cap resultat</Text>
      )}
    </View>
  );
}

function TaxonSidebar({ taxa, wide }: { taxa: ChildTaxon[]; wide: boolean }) {
  const [searching, setSearching] = useState(false);

  return (
    <View style={[styles.card, styles.sidebar, wide && styles.sidebarWide]}>
      {/* Header row */}
      <View style={styles.sidebarHeader}>
        {searching ? (
          <Text style={[styles.sidebarTitle, styles.sidebarTitleRow]}>Cerca taxó</Text>
        ) : (
          <Text style={[styles.sidebarTitle, styles.sidebarTitleRow]}>Subtaxons</Text>
        )}
        <TouchableOpacity
          style={[styles.searchIconBtn, searching && styles.searchIconBtnActive]}
          activeOpacity={0.7}
          onPress={() => setSearching((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {searching ? (
            <Text style={styles.searchIconText}>✕</Text>
          ) : (
            <Text style={styles.searchIconText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {searching ? (
        <TaxonSearch onClose={() => setSearching(false)} />
      ) : taxa.length === 0 ? (
        <Text style={styles.emptyText}>Sense subtaxons</Text>
      ) : (
        <ScrollView style={styles.sidebarScroll}>
          {taxa.map((child) => (
            <Link key={child.id} href={`/explore/${child.id}`} asChild>
              <Pressable style={StyleSheet.flatten(styles.sidebarItem)}>
                <Text style={styles.sidebarItemText}>
                  {child.name}
                </Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function LoadingCard() {
  return (
    <View style={[styles.card, styles.mainCard, styles.loadingCard]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export default function Taxonomy() {
  const params = useLocalSearchParams<{ taxon_id: string }>();
  const taxonId = normalizeId(params.taxon_id);

  const [data, setData] = useState<TaxonData | null>(null);
  const [children, setChildren] = useState<ChildTaxon[] | null>(null);

  const { width } = useWindowDimensions();
  const wide = width >= 768;

  useEffect(() => {
    setData(null);
    setChildren(null);

    fetch(
      `https://api.inaturalist.org/v1/taxa?id=${taxonId}&per_page=1&locale=ca`,
    )
      .then((r) => r.json())
      .then((json) => setData(parseTaxon(json)))
      .catch(console.error);

    fetch(
      `https://api.inaturalist.org/v1/taxa?parent_id=${taxonId}&per_page=200&locale=ca`,
    )
      .then((r) => r.json())
      .then((json) => setChildren(parseChildren(json)))
      .catch(console.error);
  }, [taxonId]);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
    >
      <View style={[styles.layout, wide && styles.layoutWide]}>
        {data ? (
          <TaxonCard taxonId={taxonId} data={data} />
        ) : (
          <LoadingCard />
        )}
        {children !== null ? (
          <TaxonSidebar taxa={children} wide={wide} />
        ) : (
          <View
            style={[
              styles.card,
              styles.sidebar,
              wide && styles.sidebarWide,
              styles.loadingCard,
            ]}
          >
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pageContent: {
    padding: spacing.lg,
    paddingVertical: 40,
  },
  layout: {
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    flexDirection: 'column',
    gap: spacing.xl,
  },
  layoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  mainCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingCard: {
    minHeight: 360,
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  parentLink: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  cta: {
    width: 'auto',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
  },
  imageWrap: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  image: {
    width: '100%',
    height: 260,
  },
  noImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  noImageText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.muted,
  },
  attribution: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.xs,
  },
  sidebar: {
    width: '100%',
    padding: spacing.lg,
    height: 360,
  },
  sidebarWide: {
    width: 260,
    flexShrink: 0,
    height: 480,
  },
  sidebarTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xs + 2,
  },
  sidebarItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.link,
  },
  sidebarId: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.muted,
  },

  // Sidebar header with search icon
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sidebarTitleRow: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
    flex: 1,
  },
  searchIconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  searchIconBtnActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  searchIconText: {
    fontSize: 14,
    lineHeight: 18,
  },

  // TaxonSearch styles
  searchContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  searchLoading: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  searchResults: {
    flex: 1,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchItemImage: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    flexShrink: 0,
  },
  searchItemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  searchItemContent: {
    flex: 1,
    gap: 1,
  },
  searchItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  searchItemCommon: {
    fontSize: 11,
    color: colors.muted,
  },
  searchItemRank: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'capitalize',
  },
});