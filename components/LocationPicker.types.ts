export interface Location {
  lat: number;
  lng: number;
  radius: number; // km
}

export interface LocationPickerProps {
  defaultLocation?: { lat: number; lng: number };
  defaultRadius?: number;
  onChange: (loc: Location) => void;
}

export interface MapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  onPick: (lat: number, lng: number) => void;
}

export const DEFAULT_LAT = 41.3874;
export const DEFAULT_LNG = 2.1686;
export const DEFAULT_RADIUS = 40;
export const MIN_RADIUS = 5;
export const MAX_RADIUS = 200;
