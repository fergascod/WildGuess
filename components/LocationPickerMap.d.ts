import { ComponentType } from 'react';

import { MapProps } from './LocationPicker.types';

// Runtime implementation is resolved by Metro to LocationPickerMap.web.tsx
// or LocationPickerMap.native.tsx depending on the platform.
declare const LocationPickerMap: ComponentType<MapProps>;
export default LocationPickerMap;
