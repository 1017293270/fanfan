import type { AmapPoi, LocationPoint } from '../api/types';

type ApplyPlaceSuggestionInput = {
  currentName: string;
  defaultNames: string[];
  suggestion: Pick<AmapPoi, 'name' | 'address' | 'latitude' | 'longitude'>;
};

type PlaceSuggestionDraft = {
  name: string;
  address: string;
  location: LocationPoint;
};

export function applyPlaceSuggestionToDraft(input: ApplyPlaceSuggestionInput): PlaceSuggestionDraft {
  const cleanName = input.currentName.trim();
  const shouldUseSuggestionName = !cleanName || input.defaultNames.includes(cleanName);

  return {
    name: shouldUseSuggestionName ? input.suggestion.name : input.currentName,
    address: input.suggestion.address || input.suggestion.name,
    location: {
      latitude: input.suggestion.latitude,
      longitude: input.suggestion.longitude
    }
  };
}
