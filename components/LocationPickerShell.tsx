import { ComponentType, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

import {
  DEFAULT_LAT,
  DEFAULT_LNG,
  DEFAULT_RADIUS,
  LocationPickerProps,
  MAX_RADIUS,
  MapProps,
  MIN_RADIUS,
} from '@/components/LocationPicker.types';
import { colors, radius as r, spacing } from '@/theme/theme';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      const a = data.address ?? {};
      return (
        a.city || a.town || a.village || a.county || a.state || a.country ||
        fallback
      );
    }
    const ExpoLocation = await import('expo-location');
    const results = await ExpoLocation.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    const a = results[0];
    if (!a) return fallback;
    return a.city || a.subregion || a.region || a.country || fallback;
  } catch {
    return fallback;
  }
}

async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) return null;
      return await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
        );
      });
    }
    const ExpoLocation = await import('expo-location');
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await ExpoLocation.getCurrentPositionAsync({});
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

export default function LocationPickerShell({
  defaultLocation,
  defaultRadius = DEFAULT_RADIUS,
  onChange,
  MapComponent,
}: LocationPickerProps & { MapComponent: ComponentType<MapProps> }) {
  const [open, setOpen] = useState(false);
  const [radius, setRadius] = useState(defaultRadius);
  const [coords, setCoords] = useState({
    lat: defaultLocation?.lat ?? DEFAULT_LAT,
    lng: defaultLocation?.lng ?? DEFAULT_LNG,
  });
  const [locationName, setLocationName] = useState<string | null>(null);
  const located = useRef(false);

  function updateCoords(lat: number, lng: number) {
    setCoords({ lat, lng });
    reverseGeocode(lat, lng).then(setLocationName);
  }

  // Resolve an initial location once.
  useEffect(() => {
    if (located.current) return;
    located.current = true;
    if (defaultLocation) {
      reverseGeocode(defaultLocation.lat, defaultLocation.lng).then(
        setLocationName,
      );
      return;
    }
    getCurrentPosition().then((pos) => {
      if (pos) updateCoords(pos.lat, pos.lng);
      else reverseGeocode(coords.lat, coords.lng).then(setLocationName);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange({ lat: coords.lat, lng: coords.lng, radius });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, radius]);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.toggle, open && styles.toggleOpen]}
        onPress={() => setOpen((o) => !o)}
      >
        <Text style={styles.pin}>📍</Text>
        <Text style={styles.toggleLabel} numberOfLines={1}>
          {locationName
            ? `Zona: ${locationName}, ${radius} km`
            : 'Filtra per zona geogràfica'}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open && (
        <View style={styles.panel}>
          <View style={styles.mapWrap}>
            <MapComponent
              lat={coords.lat}
              lng={coords.lng}
              radiusKm={radius}
              onPick={updateCoords}
            />
          </View>

          <Text style={styles.hint}>
            {locationName
              ? `📍 ${locationName} — toca el mapa per canviar`
              : 'Carregant ubicació...'}
          </Text>

          <View style={styles.radiusRow}>
            <Text style={styles.radiusLabel}>Radi</Text>
            <Slider
              style={styles.slider}
              minimumValue={MIN_RADIUS}
              maximumValue={MAX_RADIUS}
              step={5}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
            <Text style={styles.radiusValue}>{radius} km</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Toggle and panel sit flush: the toggle's bottom border doubles as the
    // panel's top edge.
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: r.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  toggleOpen: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  pin: {
    fontSize: 14,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.muted,
  },
  chevron: {
    fontSize: 10,
    color: colors.muted,
  },
  panel: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
    borderTopWidth: 0,
    borderBottomLeftRadius: r.sm,
    borderBottomRightRadius: r.sm,
  },
  mapWrap: {
    width: '100%',
    height: 240,
    borderRadius: r.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radiusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  radiusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    minWidth: 56,
    textAlign: 'right',
  },
});
