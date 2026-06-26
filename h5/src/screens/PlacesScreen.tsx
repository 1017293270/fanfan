import { useState } from 'react';
import { api } from '../api/client';
import type { LocationPoint, Place } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';
import { BrandHeader } from '../components/BrandHeader';
import { Sheet } from '../components/Sheet';
import type { LocationStatus } from '../types/location';

type PlacesScreenProps = {
  places: Place[];
  location: LocationPoint;
  locationStatus: LocationStatus;
  onChanged: () => Promise<void>;
  onLocate: () => Promise<LocationPoint>;
  onResolveAddress: (location: LocationPoint) => Promise<string>;
};

export function PlacesScreen({ places, location, locationStatus, onChanged, onLocate, onResolveAddress }: PlacesScreenProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [name, setName] = useState('公司');
  const [address, setAddress] = useState('当前位置');
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [draftLocation, setDraftLocation] = useState<LocationPoint | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [sheetMessage, setSheetMessage] = useState('');

  function coordinateText(point: LocationPoint) {
    return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
  }

  async function refreshLocationPreview(forceReplaceAddress = false) {
    setResolving(true);
    setSheetMessage('饭饭狸正在确认当前位置...');
    const previousResolvedAddress = resolvedAddress;
    try {
      const loc = await onLocate().catch(() => location);
      const nextAddress = await onResolveAddress(loc);
      setDraftLocation(loc);
      setResolvedAddress(nextAddress);
      setAddress((current) => {
        const clean = current.trim();
        if (forceReplaceAddress || !clean || clean === '当前位置' || clean === '当前位置附近' || clean === previousResolvedAddress) {
          return nextAddress;
        }
        return current;
      });
      setSheetMessage('已解析当前位置，可按需改名称、地址或识别半径。');
    } catch {
      setDraftLocation(location);
      setResolvedAddress('');
      setSheetMessage('定位或地址解析暂时失败，会先按当前坐标保存。');
    } finally {
      setResolving(false);
    }
  }

  function edit(place: Place) {
    setEditing(place);
    setName(place.name);
    setAddress(place.address);
    setRadiusMeters(place.radiusMeters);
    setDraftLocation({ latitude: place.latitude, longitude: place.longitude });
    setResolvedAddress(place.address);
    setSheetMessage('正在编辑已保存地点，可刷新为当前位置。');
    setOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setName('公司');
    setAddress('当前位置');
    setRadiusMeters(500);
    setDraftLocation(null);
    setResolvedAddress('');
    setSheetMessage('');
    setOpen(true);
    void refreshLocationPreview(true);
  }

  async function save() {
    const loc = draftLocation || (await onLocate().catch(() => location));
    const cleanAddress = address.trim();
    const shouldResolveAddress = !cleanAddress || cleanAddress === '当前位置';
    const nextAddress = shouldResolveAddress ? resolvedAddress || (await onResolveAddress(loc)) : cleanAddress;
    const safeName = name.trim() || '常用地点';
    if (editing) {
      await api.updatePlace(editing.id, {
        name: safeName,
        address: nextAddress || '当前位置附近',
        latitude: loc.latitude,
        longitude: loc.longitude,
        radiusMeters
      });
    } else {
      await api.createPlace({
        name: safeName,
        address: nextAddress || '当前位置附近',
        latitude: loc.latitude,
        longitude: loc.longitude,
        radiusMeters
      });
    }
    setOpen(false);
    setEditing(null);
    await onChanged();
  }

  async function remove(place: Place) {
    await api.deletePlace(place.id);
    await onChanged();
  }

  return (
    <div className="screen-flow">
      <BrandHeader compact mascotSrc={mascots.location} title="常用地点" subtitle="公司、家、学校，都可以有自己的常吃店。" />
      <section className="visual-callout">
        <img src={mascots.location} alt="" />
        <div>
          <strong>饭饭狸会自动认地点</strong>
          <span>
            {locationStatus.source === 'browser'
              ? '已读取当前位置，添加地点时会自动反查附近地址。'
              : '还没读到真实定位，添加地点会先使用兜底坐标。'}
          </span>
        </div>
      </section>
      <button
        className="primary-button"
        type="button"
        onClick={openCreate}
      >
        添加地点
      </button>
      <div className="card-list">
        {places.length === 0 ? (
          <section className="empty-state">
            <img src={mascots.empty} alt="" />
            <strong>先加一个常用地点</strong>
            <span>公司、家、学校都可以，之后推荐会自动匹配。</span>
          </section>
        ) : null}
        {places.map((place) => (
          <article className="place-card" key={place.id}>
            <img className="place-card__asset" src={uiAssets.actionNearby} alt="" />
            <div>
              <h3>{place.name}</h3>
              <p>{place.address}</p>
              <span>{place.radiusMeters}m 范围内自动识别</span>
            </div>
            <div className="compact-actions">
              <button type="button" onClick={() => edit(place)}>
                编辑
              </button>
              <button type="button" onClick={() => remove(place)}>
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
      <Sheet title={editing ? '编辑地点' : '添加地点'} open={open} onClose={() => setOpen(false)}>
        <section className={`location-preview location-preview--${locationStatus.source}`}>
          <img src={locationStatus.source === 'browser' ? uiAssets.actionNearby : mascots.location} alt="" />
          <div>
            <strong>{resolving ? '正在确认地点' : editing ? '地点坐标' : '将保存为常用地点'}</strong>
            <span>
              {draftLocation ? `${address || resolvedAddress || '当前位置附近'} · ${coordinateText(draftLocation)}` : locationStatus.detail}
            </span>
          </div>
          <button type="button" disabled={resolving} onClick={() => void refreshLocationPreview(true)}>
            {resolving ? '处理中' : '刷新'}
          </button>
        </section>
        {sheetMessage ? <div className="field-hint">{sheetMessage}</div> : null}
        <label>
          名称
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          地址
          <input value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        <label>
          匹配半径
          <input type="number" value={radiusMeters} onChange={(event) => setRadiusMeters(Number(event.target.value))} />
        </label>
        <div className="radius-options" aria-label="匹配半径快捷选择">
          {[300, 500, 800, 1200].map((value) => (
            <button
              className={radiusMeters === value ? 'is-on' : ''}
              type="button"
              key={value}
              onClick={() => setRadiusMeters(value)}
            >
              {value}m
            </button>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={save}>
          保存
        </button>
      </Sheet>
    </div>
  );
}
