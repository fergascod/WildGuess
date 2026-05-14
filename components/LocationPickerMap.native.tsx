import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';

import { MapProps } from '@/components/LocationPicker.types';
import { colors } from '@/theme/theme';

function regionForRadius(lat: number, lng: number, radiusKm: number): Region {
  // ~111 km per degree of latitude; pad so the circle fits comfortably.
  const delta = (radiusKm / 111) * 2.6;
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export default function LocationPickerMap({
  lat,
  lng,
  radiusKm,
  onPick,
}: MapProps) {
  const mapRef = useRef<MapView>(null);

  // `initialRegion` keeps the map freely pannable; we only re-center when the
  // picked location or radius actually changes.
  useEffect(() => {
    mapRef.current?.animateToRegion(regionForRadius(lat, lng, radiusKm), 300);
  }, [lat, lng, radiusKm]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={regionForRadius(lat, lng, radiusKm)}
      onPress={(e) =>
        onPick(
          e.nativeEvent.coordinate.latitude,
          e.nativeEvent.coordinate.longitude,
        )
      }
    >
      <Marker
        draggable
        coordinate={{ latitude: lat, longitude: lng }}
        onDragEnd={(e) =>
          onPick(
            e.nativeEvent.coordinate.latitude,
            e.nativeEvent.coordinate.longitude,
          )
        }
      />
      <Circle
        center={{ latitude: lat, longitude: lng }}
        radius={radiusKm * 1000}
        strokeColor={colors.accent}
        fillColor="rgba(58, 107, 53, 0.12)"
        strokeWidth={2}
      />
    </MapView>
  );
}
