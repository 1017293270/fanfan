import { useState } from 'react';
import { api } from '../api/client';
import type { AmapPoi, LocationPoint, Place } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';
import { BrandHeader } from '../components/BrandHeader';

type AmapImportScreenProps = {
  places: Place[];
  activePlace: Place | null;
  location: LocationPoint;
  onChanged: () => Promise<void>;
};

export function AmapImportScreen({ places, activePlace, location, onChanged }: AmapImportScreenProps) {
  const [keyword, setKeyword] = useState('中餐');
  const [placeId, setPlaceId] = useState(activePlace?.id || places[0]?.id || '');
  const [results, setResults] = useState<AmapPoi[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function search() {
    setBusy(true);
    setMessage('');
    try {
      const selectedPlace = places.find((place) => place.id === placeId);
      const response = await api.searchAmap({
        keyword,
        location: selectedPlace
          ? { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude }
          : location,
        radiusMeters: 1500
      });
      setResults(response.pois);
      if (response.pois.length === 0) setMessage('这次没搜到，换个关键词试试。');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '高德搜索暂时不可用');
    } finally {
      setBusy(false);
    }
  }

  async function add(poi: AmapPoi) {
    if (!placeId) {
      setMessage('先添加一个常用地点。');
      return;
    }
    await api.importAmap({
      placeId,
      poi,
      tags: (poi.tags || [keyword]).slice(0, 3),
      status: 'active'
    });
    setMessage(`已加入：${poi.name}`);
    await onChanged();
  }

  return (
    <div className="screen-flow">
      <BrandHeader compact mascotSrc={mascots.location} title="从高德加店" subtitle="把公司或家附近的店，变成你的私人常用库。" />
      <section className="search-card">
        <div className="search-card__intro">
          <img src={mascots.location} alt="" />
          <span>饭饭狸会用当前位置或常用地点附近搜索。</span>
        </div>
        <label>
          关键词
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </label>
        <label>
          加到地点
          <select value={placeId} onChange={(event) => setPlaceId(event.target.value)}>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
        <div className="chips">
          {[
            { value: '中餐', icon: uiAssets.actionEat },
            { value: '面馆', icon: uiAssets.chipNoodle },
            { value: '米饭', icon: uiAssets.chipRice },
            { value: '清淡', icon: uiAssets.chipLeaf },
            { value: '火锅', icon: uiAssets.chipHotpot },
            { value: '甜品', icon: uiAssets.chipDessert }
          ].map((item) => (
            <button className={`chip ${keyword === item.value ? 'is-on' : ''}`} type="button" key={item.value} onClick={() => setKeyword(item.value)}>
              <img src={item.icon} alt="" />
              {item.value}
            </button>
          ))}
        </div>
        <button className="primary-button primary-button--with-icon" type="button" disabled={busy} onClick={search}>
          <img src={uiAssets.actionNearby} alt="" />
          {busy ? '搜索中' : '搜附近'}
        </button>
      </section>
      {message ? <div className="form-error form-error--soft">{message}</div> : null}
      <div className="card-list">
        {results.map((poi) => (
          <article className="poi-card" key={poi.amapPoiId}>
            <img src={uiAssets.actionNearby} alt="" />
            <div>
              <h3>{poi.name}</h3>
              <p>
                {poi.category} · {poi.distanceMeters ? `${poi.distanceMeters}m` : '附近'} · {poi.avgPrice ? `人均${poi.avgPrice}元` : '价格待补'}
              </p>
              <span>{poi.address}</span>
            </div>
            <button type="button" onClick={() => add(poi)}>
              <img src={uiAssets.actionEat} alt="" />
              加入
            </button>
          </article>
        ))}
        {results.length === 0 && !busy ? (
          <section className="empty-state">
            <img src={mascots.empty} alt="" />
            <strong>先搜一下附近餐厅</strong>
            <span>搜到喜欢的，就加入自己的店铺库。</span>
          </section>
        ) : null}
      </div>
    </div>
  );
}
