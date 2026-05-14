import LocationPickerShell from '@/components/LocationPickerShell';
import LocationPickerMap from '@/components/LocationPickerMap';
import { LocationPickerProps } from '@/components/LocationPicker.types';

export type { Location } from '@/components/LocationPicker.types';

export default function LocationPicker(props: LocationPickerProps) {
  return <LocationPickerShell {...props} MapComponent={LocationPickerMap} />;
}
