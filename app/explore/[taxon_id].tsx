import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

function TaxonCard({ taxonId, data }: { taxonId: string; data: TaxonData }) {
  const imageUrl = data.image?.url.replace('square', 'original');

  return (
    <View style={[styles.card, styles.mainCard]}>
      <Text style={styles.cardTitle}>{data.taxon_name}</Text>

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

function TaxonSidebar({ taxa, wide }: { taxa: ChildTaxon[]; wide: boolean }) {
  return (
    <View style={[styles.card, styles.sidebar, wide && styles.sidebarWide]}>
      <Text style={styles.sidebarTitle}>Subtaxons</Text>
      {taxa.length === 0 ? (
        <Text style={styles.emptyText}>Sense subtaxons</Text>
      ) : (
        <ScrollView style={styles.sidebarScroll}>
          {taxa.map((child) => (
            <Link key={child.id} href={`/explore/${child.id}`} asChild>
              <Pressable style={StyleSheet.flatten(styles.sidebarItem)}>
                <Text style={styles.sidebarItemText}>
                  {child.name}
                  <Text style={styles.sidebarId}> ({child.id})</Text>
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
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
});
