import { useState } from 'react';
import { api } from '../api/client';
import type { LocationPoint, Place, RecommendationResponse } from '../api/types';
import avatarUrl from '../assets/brand/kaifanli-avatar-144.png';
import bowlIcon from '../assets/icons/bowl-sparkle.png';
import dislikeIcon from '../assets/icons/paw-dislike.png';
import heartIcon from '../assets/icons/paw-heart.png';
import navIcon from '../assets/icons/chopsticks-nav.png';
import refreshIcon from '../assets/icons/paw-refresh.png';
import { BrandHeader } from '../components/BrandHeader';
import { IconButton } from '../components/IconButton';
import { PlacePill } from '../components/PlacePill';
import { Sheet } from '../components/Sheet';

type HomeScreenProps = {
  places: Place[];
  activePlace: Place | null;
  location: LocationPoint;
  unmatched: boolean;
  onChanged: () => Promise<void>;
  onLocate: () => Promise<LocationPoint>;
};

const distanceOptions = [800, 1500, 3000];
const budgetOptions = [30, 50, 100];
const cravingOptions = ['米饭', '热汤面', '清淡', '面食'];

export function HomeScreen({ activePlace, location, unmatched, onChanged, onLocate }: HomeScreenProps) {
  const [textPreference, setTextPreference] = useState('想吃热乎的，不太辣，别太远');
  const [distanceMeters, setDistanceMeters] = useState(1500);
  const [budgetPerPerson, setBudgetPerPerson] = useState(30);
  const [craving, setCraving] = useState('米饭');
  const [spicyPreference, setSpicyPreference] = useState<'none' | 'mild' | 'medium' | 'spicy'>('mild');
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('附近好吃的正在赶来');
  const [placeSheet, setPlaceSheet] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('常用地点');

  async function recommend() {
    setBusy(true);
    setMessage('饭饭狸先看看距离、口味和预算。');
    try {
      const nextLocation = await onLocate();
      const response = await api.recommend({
        location: nextLocation,
        activePlaceId: activePlace?.id,
        textPreference,
        quickFilters: {
          distanceMeters,
          budgetPerPerson,
          spicyPreference,
          craving,
          openNow: true
        }
      });
      setResult(response);
      setMessage('饭饭狸拍板啦');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '推荐服务暂时不可用');
    } finally {
      setBusy(false);
    }
  }

  async function addCurrentPlace() {
    await api.createPlace({
      name: newPlaceName,
      address: '当前位置',
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMeters: 500
    });
    setPlaceSheet(false);
    await onChanged();
  }

  const primary = result?.primaryRecommendation;

  return (
    <div className="screen-flow">
      <div className="home-topline">
        <BrandHeader title="今天想吃什么？" subtitle="说给饭饭狸听，少纠结，快开饭。" />
        <PlacePill place={activePlace} unmatched={unmatched} />
      </div>
      {unmatched ? (
        <section className="notice-card">
          <span>当前位置还不是常用地点</span>
          <button type="button" onClick={() => setPlaceSheet(true)}>
            加一下
          </button>
        </section>
      ) : null}
      <textarea className="preference-input" value={textPreference} onChange={(event) => setTextPreference(event.target.value)} />
      <div className="chips">
        {distanceOptions.map((item) => (
          <button className={`chip ${distanceMeters === item ? 'is-on' : ''}`} type="button" key={item} onClick={() => setDistanceMeters(item)}>
            {item >= 1000 ? `${item / 1000}km 内` : `${item}m 内`}
          </button>
        ))}
        {budgetOptions.map((item) => (
          <button className={`chip ${budgetPerPerson === item ? 'is-on' : ''}`} type="button" key={item} onClick={() => setBudgetPerPerson(item)}>
            人均 {item}
          </button>
        ))}
        <button className={`chip ${spicyPreference === 'mild' ? 'is-on' : ''}`} type="button" onClick={() => setSpicyPreference('mild')}>
          少辣
        </button>
        <button className={`chip ${spicyPreference === 'none' ? 'is-on' : ''}`} type="button" onClick={() => setSpicyPreference('none')}>
          不辣
        </button>
        {cravingOptions.map((item) => (
          <button className={`chip ${craving === item ? 'is-on' : ''}`} type="button" key={item} onClick={() => setCraving(item)}>
            {item}
          </button>
        ))}
      </div>
      <button className="primary-button" type="button" disabled={busy} onClick={recommend}>
        {busy ? '饭饭狸在看' : '让饭饭狸拍板'}
      </button>
      <section className="state-card">
        <img src={avatarUrl} alt="" />
        <div>
          <strong>{message}</strong>
          <span>{activePlace ? `按「${activePlace.name}」的常用店铺优先。` : '饭饭狸会先看看附近。'}</span>
        </div>
      </section>
      {primary ? (
        <>
          <article className="recommend-card">
            <div className="recommend-card__badge">
              <img src={bowlIcon} alt="" />
              饭饭狸推荐
            </div>
            <h2>{primary.name}</h2>
            <p className="meta">
              {primary.category} · {primary.distanceMeters}m · {primary.avgPrice ? `人均${primary.avgPrice}元` : '价格待补'}
            </p>
            <div className="tag-row">
              {primary.tags.slice(0, 4).map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <p className="reason">{primary.reason || '这家离你近，口味也合适。'}</p>
          </article>
          {result?.alternatives.length ? (
            <section className="list-card">
              <h2>备选也不错</h2>
              {result.alternatives.map((item) => (
                <button className="restaurant-row" key={item.poiId} type="button">
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.category} · {item.distanceMeters}m · {item.avgPrice ? `人均${item.avgPrice}元` : '价格待补'}
                    </small>
                  </span>
                  <em>看看</em>
                </button>
              ))}
            </section>
          ) : null}
          <div className="action-grid">
            <IconButton iconSrc={refreshIcon} label="换一批" onClick={recommend} />
            <IconButton iconSrc={heartIcon} label="收藏" />
            <IconButton iconSrc={dislikeIcon} label="不喜欢" />
            <IconButton iconSrc={navIcon} label="带我去" variant="green" />
          </div>
        </>
      ) : null}
      <Sheet title="添加常用地点" open={placeSheet} onClose={() => setPlaceSheet(false)}>
        <label>
          名称
          <input value={newPlaceName} onChange={(event) => setNewPlaceName(event.target.value)} />
        </label>
        <button className="primary-button" type="button" onClick={addCurrentPlace}>
          保存地点
        </button>
      </Sheet>
    </div>
  );
}
