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

  function edit(place: Place) {
    setEditing(place);
    setName(place.name);
    setAddress(place.address);
    setRadiusMeters(place.radiusMeters);
    setOpen(true);
  }

  async function save() {
    const loc = await onLocate().catch(() => location);
    const cleanAddress = address.trim();
    const shouldResolveAddress = !cleanAddress || cleanAddress === '当前位置';
    const nextAddress = !editing && shouldResolveAddress ? await onResolveAddress(loc) : cleanAddress;
    if (editing) {
      await api.updatePlace(editing.id, { name, address: cleanAddress || '当前位置附近', radiusMeters });
    } else {
      await api.createPlace({
        name,
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
        onClick={() => {
          setEditing(null);
          setName('公司');
          setAddress('当前位置');
          setRadiusMeters(500);
          setOpen(true);
        }}
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
        <button className="primary-button" type="button" onClick={save}>
          保存
        </button>
      </Sheet>
    </div>
  );
}
