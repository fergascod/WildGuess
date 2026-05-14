import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapProps } from '@/components/LocationPicker.types';

const LEAFLET_VERSION = '1.9.4';

function ensureLeafletCss() {
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
  document.head.appendChild(link);
}

export default function LocationPickerMap({
  lat,
  lng,
  radiusKm,
  onPick,
}: MapProps) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Initialise Leaflet once the container is mounted.
  useEffect(() => {
    ensureLeafletCss();
    const el = containerRef.current as unknown as HTMLElement | null;
    if (!el || mapRef.current) return;

    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled || mapRef.current || !el) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon-2x.png`,
        iconUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon.png`,
        shadowUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-shadow.png`,
      });

      const map = L.map(el, { zoomControl: true }).setView([lat, lng], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      const circle = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#3a6b35',
        fillColor: '#3a6b35',
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map);

      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onPickRef.current(p.lat, p.lng);
      });
      map.on('click', (e: any) => {
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // The container may have been sized after mount (collapsible panel).
      setTimeout(() => map.invalidateSize(), 60);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker, circle and view in sync with props.
  useEffect(() => {
    if (!mapRef.current) return;
    markerRef.current?.setLatLng([lat, lng]);
    circleRef.current?.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng]);
  }, [lat, lng]);

  useEffect(() => {
    circleRef.current?.setRadius(radiusKm * 1000);
  }, [radiusKm]);

  return <View ref={containerRef} style={StyleSheet.absoluteFill} />;
}
