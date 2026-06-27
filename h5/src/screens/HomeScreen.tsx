import { useState } from 'react';
import { api } from '../api/client';
import type { LocationPoint, Place, RecommendationResponse, RestaurantCandidate } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';
import { BrandHeader } from '../components/BrandHeader';
import { IconButton } from '../components/IconButton';
import { PlacePill } from '../components/PlacePill';
import { Sheet } from '../components/Sheet';
import type { LocationStatus } from '../types/location';
import { openAmapNavigation } from '../utils/maps';

type HomeScreenProps = {
  places: Place[];
  activePlace: Place | null;
  locationStatus: LocationStatus;
  unmatched: boolean;
  onChanged: () => Promise<void>;
  onLocate: () => Promise<LocationPoint>;
  onResolveAddress: (location: LocationPoint) => Promise<string>;
};

const distanceOptions = [
  { value: 800, label: '800m 内', icon: uiAssets.chipTime },
  { value: 1500, label: '1.5km 内', icon: uiAssets.actionNearby },
  { value: 3000, label: '3km 内', icon: uiAssets.actionNavigate }
];

const budgetOptions = [
  { value: 30, icon: uiAssets.chipWallet },
  { value: 50, icon: uiAssets.actionBudget },
  { value: 100, icon: uiAssets.actionBudget }
];

const cravingOptions = [
  { value: '米饭', icon: uiAssets.chipRice },
  { value: '热汤面', icon: uiAssets.chipNoodle },
  { value: '清淡', icon: uiAssets.chipLeaf },
  { value: '面食', icon: uiAssets.chipNoodle },
  { value: '火锅', icon: uiAssets.chipHotpot },
  { value: '轻食', icon: uiAssets.chipSalad },
  { value: '烧烤', icon: uiAssets.chipSkewer },
  { value: '甜品', icon: uiAssets.chipDessert }
];

const moodOptions = [
  {
    label: '开心',
    image: mascots.happy,
    preference: '想吃让人开心的家常菜，不要等太久',
    craving: '米饭',
    spicy: 'mild' as const
  },
  {
    label: '好饿',
    image: mascots.hungry,
    preference: '好饿，想吃饱一点，米饭或者热汤都行',
    craving: '米饭',
    spicy: 'mild' as const
  },
  {
    label: '思考',
    image: mascots.thinking,
    preference: '我还没想好，你根据距离、预算和常吃店帮我拍板',
    craving: '清淡',
    spicy: 'none' as const
  },
  {
    label: '惊讶',
    image: mascots.surprised,
    preference: '今天想换个新鲜的，但不要太辣',
    craving: '面食',
    spicy: 'none' as const
  }
];

export function HomeScreen({ activePlace, locationStatus, unmatched, onChanged, onLocate, onResolveAddress }: HomeScreenProps) {
  const [textPreference, setTextPreference] = useState('想吃热乎的，不太辣，别太远');
  const [distanceMeters, setDistanceMeters] = useState(1500);
  const [budgetPerPerson, setBudgetPerPerson] = useState(30);
  const [craving, setCraving] = useState('米饭');
  const [spicyPreference, setSpicyPreference] = useState<'none' | 'mild' | 'medium' | 'spicy'>('mild');
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RestaurantCandidate | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('附近好吃的正在赶来');
  const [placeSheet, setPlaceSheet] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('新地点');
  const [newPlaceAddress, setNewPlaceAddress] = useState('当前位置');
  const [newPlaceRadius, setNewPlaceRadius] = useState(500);
  const [draftLocation, setDraftLocation] = useState<LocationPoint | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [placeSheetMessage, setPlaceSheetMessage] = useState('');

  function coordinateText(point: LocationPoint) {
    return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
  }

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
      setSelectedCandidate(response.primaryRecommendation);
      setMessage('饭饭狸拍板啦');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '推荐服务暂时不可用');
    } finally {
      setBusy(false);
    }
  }

  async function refreshPlacePreview(forceReplaceAddress = false) {
    setResolvingPlace(true);
    setPlaceSheetMessage('饭饭狸正在确认当前位置...');
    const previousResolvedAddress = resolvedAddress;
    try {
      const currentLocation = await onLocate();
      const address = await onResolveAddress(currentLocation);
      setDraftLocation(currentLocation);
      setResolvedAddress(address);
      setNewPlaceAddress((current) => {
        const clean = current.trim();
        if (forceReplaceAddress || !clean || clean === '当前位置' || clean === '当前位置附近' || clean === previousResolvedAddress) {
          return address;
        }
        return current;
      });
      setPlaceSheetMessage('已解析当前位置，可按需改名称、地址或识别半径。');
    } catch {
      setDraftLocation(null);
      setResolvedAddress('');
      setPlaceSheetMessage('定位或地址解析暂时失败，稍后可以再刷新。');
    } finally {
      setResolvingPlace(false);
    }
  }

  function openPlaceSheet() {
    setNewPlaceName('新地点');
    setNewPlaceAddress('当前位置');
    setNewPlaceRadius(500);
    setDraftLocation(null);
    setResolvedAddress('');
    setPlaceSheetMessage('');
    setPlaceSheet(true);
    void refreshPlacePreview(true);
  }

  async function addCurrentPlace() {
    const currentLocation = draftLocation || (await onLocate());
    const cleanAddress = newPlaceAddress.trim();
    const shouldResolveAddress = !cleanAddress || cleanAddress === '当前位置';
    const address = shouldResolveAddress ? resolvedAddress || (await onResolveAddress(currentLocation)) : cleanAddress;
    await api.createPlace({
      name: newPlaceName.trim() || '常用地点',
      address: address || '当前位置附近',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radiusMeters: newPlaceRadius
    });
    setPlaceSheet(false);
    await onChanged();
  }

  const primary = selectedCandidate ?? result?.primaryRecommendation;
  const alternativeCandidates = result
    ? [result.primaryRecommendation, ...result.alternatives].filter((item) => item.poiId !== primary?.poiId)
    : [];
  const stateMascot = busy ? mascots.loading : primary ? mascots.recommend : unmatched ? mascots.noIdea : mascots.recommend;

  return (
    <div className="screen-flow">
        <div className="home-topline">
          <BrandHeader mascotSrc={primary ? mascots.recommend : mascots.happy} title="今天想吃什么？" subtitle="说给饭饭狸听，少纠结，快开饭。" />
          <PlacePill place={activePlace} unmatched={unmatched} />
        </div>
        <section className={`location-card location-card--${locationStatus.source}`}>
          <img src={locationStatus.source === 'browser' ? uiAssets.actionNearby : mascots.location} alt="" />
          <div>
            <strong>{locationStatus.title}</strong>
            <span>
              {locationStatus.detail}
              {locationStatus.updatedAt ? ` · ${locationStatus.updatedAt}` : ''}
            </span>
          </div>
          <button type="button" onClick={() => void onLocate()}>
            刷新
          </button>
        </section>
        <div className="mood-strip" aria-label="心情快捷入口">
        {moodOptions.map((option) => (
          <button
            type="button"
            key={option.label}
            onClick={() => {
              setTextPreference(option.preference);
              setCraving(option.craving);
              setSpicyPreference(option.spicy);
            }}
          >
            <img src={option.image} alt="" />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      {unmatched ? (
        <section className="notice-card">
          <img src={mascots.noIdea} alt="" />
          <span>当前位置还不是常用地点</span>
          <button type="button" onClick={openPlaceSheet}>
            加一下
          </button>
        </section>
      ) : null}
      <textarea className="preference-input" value={textPreference} onChange={(event) => setTextPreference(event.target.value)} />
      <div className="chips">
        {distanceOptions.map((item) => (
          <button className={`chip ${distanceMeters === item.value ? 'is-on' : ''}`} type="button" key={item.value} onClick={() => setDistanceMeters(item.value)}>
            <img src={item.icon} alt="" />
            {item.label}
          </button>
        ))}
        {budgetOptions.map((item) => (
          <button className={`chip ${budgetPerPerson === item.value ? 'is-on' : ''}`} type="button" key={item.value} onClick={() => setBudgetPerPerson(item.value)}>
            <img src={item.icon} alt="" />
            人均 {item.value}
          </button>
        ))}
        <button className={`chip ${spicyPreference === 'mild' ? 'is-on' : ''}`} type="button" onClick={() => setSpicyPreference('mild')}>
          <img src={uiAssets.chipChili} alt="" />
          少辣
        </button>
        <button className={`chip ${spicyPreference === 'none' ? 'is-on' : ''}`} type="button" onClick={() => setSpicyPreference('none')}>
          <img src={uiAssets.chipLeaf} alt="" />
          不辣
        </button>
        {cravingOptions.map((item) => (
          <button className={`chip ${craving === item.value ? 'is-on' : ''}`} type="button" key={item.value} onClick={() => setCraving(item.value)}>
            <img src={item.icon} alt="" />
            {item.value}
          </button>
        ))}
      </div>
      <button className="primary-button" type="button" disabled={busy} onClick={recommend}>
        {busy ? '饭饭狸在看' : '让饭饭狸拍板'}
      </button>
      <section className="state-card state-card--illustrated">
        <img src={stateMascot} alt="" />
        <div>
          <strong>{message}</strong>
          <span>{activePlace ? `按「${activePlace.name}」的常用店铺优先。` : '饭饭狸会先看看附近。'}</span>
        </div>
      </section>
      {primary ? (
        <>
          <article className="recommend-card">
            <div className="recommend-card__visual-row">
              <img className="recommend-card__mascot" src={mascots.riceBowl} alt="" />
              <div>
                <img className="recommend-card__badge-image" src={uiAssets.badgeAiRecommend} alt="AI 推荐" />
                <img className="recommend-card__match-image" src={uiAssets.badgeMatch} alt="92% 匹配" />
              </div>
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
          {alternativeCandidates.length ? (
            <section className="list-card">
              <h2>备选也不错</h2>
              {alternativeCandidates.map((item) => (
                <button className="restaurant-row" key={item.poiId} type="button" onClick={() => setSelectedCandidate(item)}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.category} · {item.distanceMeters}m · {item.avgPrice ? `人均${item.avgPrice}元` : '价格待补'}
                    </small>
                  </span>
                  <em>查看</em>
                </button>
              ))}
            </section>
          ) : null}
          <div className="action-grid">
            <IconButton iconSrc={uiAssets.actionRefresh} label="换一批" onClick={recommend} />
            <IconButton iconSrc={uiAssets.actionFavorite} label="收藏" />
            <IconButton iconSrc={uiAssets.actionDislike} label="不喜欢" />
            <IconButton iconSrc={uiAssets.actionNavigate} label="带我去" variant="green" onClick={() => openAmapNavigation(primary)} />
          </div>
        </>
      ) : null}
      <Sheet title="添加常用地点" open={placeSheet} onClose={() => setPlaceSheet(false)}>
        <section className={`location-preview location-preview--${locationStatus.source}`}>
          <img src={locationStatus.source === 'browser' ? uiAssets.actionNearby : mascots.location} alt="" />
          <div>
            <strong>{resolvingPlace ? '正在确认地点' : '将保存为常用地点'}</strong>
            <span>
              {draftLocation ? `${newPlaceAddress || resolvedAddress || '当前位置附近'} · ${coordinateText(draftLocation)}` : locationStatus.detail}
            </span>
          </div>
          <button type="button" disabled={resolvingPlace} onClick={() => void refreshPlacePreview(true)}>
            {resolvingPlace ? '处理中' : '刷新'}
          </button>
        </section>
        {placeSheetMessage ? <div className="field-hint">{placeSheetMessage}</div> : null}
        <label>
          名称
          <input value={newPlaceName} onChange={(event) => setNewPlaceName(event.target.value)} />
        </label>
        <label>
          地址
          <input value={newPlaceAddress} onChange={(event) => setNewPlaceAddress(event.target.value)} />
        </label>
        <label>
          匹配半径
          <input type="number" value={newPlaceRadius} onChange={(event) => setNewPlaceRadius(Number(event.target.value))} />
        </label>
        <div className="radius-options" aria-label="匹配半径快捷选择">
          {[300, 500, 800, 1200].map((value) => (
            <button className={newPlaceRadius === value ? 'is-on' : ''} type="button" key={value} onClick={() => setNewPlaceRadius(value)}>
              {value}m
            </button>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={addCurrentPlace}>
          保存地点
        </button>
      </Sheet>
    </div>
  );
}
