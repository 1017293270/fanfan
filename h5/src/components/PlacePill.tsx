import locationIcon from '../assets/icons/bamboo-location.png';
import type { Place } from '../api/types';

type PlacePillProps = {
  place?: Place | null;
  unmatched?: boolean;
};

export function PlacePill({ place, unmatched = false }: PlacePillProps) {
  return (
    <div className={`place-pill ${unmatched ? 'place-pill--unmatched' : ''}`}>
      <img src={locationIcon} alt="" />
      <span>{place ? place.name : unmatched ? '新位置' : '定位中'}</span>
    </div>
  );
}
