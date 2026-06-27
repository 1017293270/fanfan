import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AmapPoi, LocationPoint } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';

type PlaceAddressPickerProps = {
  value: string;
  searchLocation?: LocationPoint | null;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelect: (suggestion: AmapPoi) => void;
};

export function PlaceAddressPicker({ value, searchLocation, disabled = false, onChange, onSelect }: PlaceAddressPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AmapPoi[]>([]);
  const [message, setMessage] = useState('');
  const keyword = value.trim();

  useEffect(() => {
    if (!open || keyword.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setMessage('');
      return;
    }
    if (!searchLocation) {
      setSuggestions([]);
      setLoading(false);
      setMessage('先刷新定位，再搜索附近地点。');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMessage('');
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.searchPlaceSuggestions({
          keyword,
          location: searchLocation,
          radiusMeters: 5000
        });
        if (cancelled) return;
        setSuggestions(result.pois.slice(0, 6));
        setMessage(result.pois.length ? '' : '没有搜到候选，可以继续手填。');
      } catch (error) {
        if (cancelled) return;
        setSuggestions([]);
        setMessage(error instanceof Error ? error.message : '地点候选暂时不可用。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, open, searchLocation?.latitude, searchLocation?.longitude]);

  function selectSuggestion(suggestion: AmapPoi) {
    onSelect(suggestion);
    setOpen(false);
    setSuggestions([]);
    setMessage('');
  }

  const showPanel = open && keyword.length > 0;

  return (
    <label className="address-picker-field">
      地址
      <div className="address-picker">
        <input
          value={value}
          disabled={disabled}
          placeholder="输入地名、楼宇、小区"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
        />
        {showPanel ? (
          <div className="address-suggestions">
            {keyword.length < 2 ? (
              <div className="address-suggestions__hint">再输入一个字，饭饭狸帮你找附近地点。</div>
            ) : null}
            {loading ? (
              <div className="address-suggestions__hint">
                <img src={mascots.peek} alt="" />
                正在找地点
              </div>
            ) : null}
            {!loading && suggestions.length
              ? suggestions.map((suggestion) => (
                  <button type="button" key={suggestion.amapPoiId} onClick={() => selectSuggestion(suggestion)}>
                    <img src={uiAssets.actionNearby} alt="" />
                    <span>
                      <strong>{suggestion.name}</strong>
                      <small>
                        {[suggestion.address, suggestion.distanceMeters ? `${suggestion.distanceMeters}m` : ''].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                  </button>
                ))
              : null}
            {!loading && message ? <div className="address-suggestions__hint">{message}</div> : null}
            {keyword.length >= 2 ? (
              <button className="address-suggestions__manual" type="button" onClick={() => setOpen(false)}>
                <img src={uiAssets.chipLeaf} alt="" />
                <span>
                  <strong>继续使用手填地址</strong>
                  <small>{keyword}</small>
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </label>
  );
}
