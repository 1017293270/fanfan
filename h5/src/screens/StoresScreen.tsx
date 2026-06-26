import { useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Place, Store, StorePlaceLink, StorePlaceStatus } from '../api/types';
import { mascots, uiAssets } from '../assets/visualAssets';
import { BrandHeader } from '../components/BrandHeader';
import { Sheet } from '../components/Sheet';
import { StoreCard } from '../components/StoreCard';

type StoresScreenProps = {
  places: Place[];
  stores: Store[];
  activePlace: Place | null;
  onChanged: () => Promise<void>;
};

const categoryOptions = [
  { value: '中餐', icon: uiAssets.chipRice },
  { value: '面馆', icon: uiAssets.chipNoodle },
  { value: '火锅', icon: uiAssets.chipHotpot },
  { value: '轻食', icon: uiAssets.chipSalad },
  { value: '甜品', icon: uiAssets.chipDessert }
];

const tagOptions = ['米饭', '家常菜', '不辣', '少辣', '清淡', '排队少'];

const statusFilterOptions: Array<{ value: 'all' | StorePlaceStatus; label: string; icon: string }> = [
  { value: 'all', label: '全部', icon: uiAssets.navStores },
  { value: 'active', label: '常吃', icon: uiAssets.actionEat },
  { value: 'favorite', label: '喜欢', icon: uiAssets.actionFavorite },
  { value: 'tired', label: '吃腻', icon: uiAssets.actionSpicy },
  { value: 'blocked', label: '拉黑', icon: uiAssets.actionDislike }
];

export function StoresScreen({ places, stores, activePlace, onChanged }: StoresScreenProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | StorePlaceStatus>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [name, setName] = useState('巷口小厨');
  const [category, setCategory] = useState('中餐');
  const [address, setAddress] = useState('常用地点附近');
  const [avgPrice, setAvgPrice] = useState(35);
  const [tags, setTags] = useState('米饭,家常菜');
  const [selectedPlaceId, setSelectedPlaceId] = useState(activePlace?.id || places[0]?.id || '');

  const selectedPlace = places.find((place) => place.id === selectedPlaceId) || activePlace || places[0] || null;

  const filtered = useMemo(() => {
    return stores.filter((store) => {
      const text = `${store.name} ${store.category} ${store.address}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus = status === 'all' || store.links.some((link) => link.status === status);
      return matchesQuery && matchesStatus;
    });
  }, [query, status, stores]);

  function addressForPlace(place: Place | null) {
    return place ? `${place.address}附近` : '先添加一个常用地点';
  }

  function toggleTag(nextTag: string) {
    const currentTags = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    const nextTags = currentTags.includes(nextTag)
      ? currentTags.filter((tag) => tag !== nextTag)
      : [...currentTags, nextTag];
    setTags(nextTags.join(','));
  }

  function changeSelectedPlace(placeId: string) {
    setSelectedPlaceId(placeId);
    const place = places.find((item) => item.id === placeId) || null;
    if (!editing) setAddress(addressForPlace(place));
  }

  function openCreate() {
    const nextPlace = activePlace || places[0] || null;
    setEditing(null);
    setName('巷口小厨');
    setCategory('中餐');
    setAddress(addressForPlace(nextPlace));
    setAvgPrice(35);
    setTags('米饭,家常菜');
    setSelectedPlaceId(nextPlace?.id || '');
    setOpen(true);
  }

  function openEdit(store: Store) {
    setEditing(store);
    setName(store.name);
    setCategory(store.category);
    setAddress(store.address);
    setAvgPrice(store.avgPrice || 35);
    setTags(store.links[0]?.tags.join(',') || '');
    setSelectedPlaceId(store.links[0]?.placeId || activePlace?.id || places[0]?.id || '');
    setOpen(true);
  }

  async function save() {
    if (editing) {
      await api.updateStore(editing.id, { name, category, address, avgPrice });
    } else {
      const linkedPlace = places.find((place) => place.id === selectedPlaceId);
      if (!linkedPlace) return;
      await api.createStore({
        name: name.trim() || '未命名店铺',
        category: category.trim() || '餐饮',
        address: address.trim() || addressForPlace(linkedPlace),
        latitude: linkedPlace.latitude,
        longitude: linkedPlace.longitude,
        avgPrice,
        placeIds: [selectedPlaceId],
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        status: 'active'
      });
    }
    setOpen(false);
    await onChanged();
  }

  async function changeStatus(link: StorePlaceLink, nextStatus: StorePlaceStatus) {
    await api.updateLink(link.id, {
      status: nextStatus,
      lastEatenAt: nextStatus === 'tired' ? new Date().toISOString() : undefined,
      eatenCount: nextStatus === 'tired' ? link.eatenCount + 1 : link.eatenCount
    });
    await onChanged();
  }

  async function remove(store: Store) {
    await api.deleteStore(store.id);
    await onChanged();
  }

  return (
    <div className="screen-flow">
      <BrandHeader compact mascotSrc={mascots.riceBowl} title="我的店铺库" subtitle="每个账号都有自己的常吃、喜欢、吃腻和拉黑。" />
      <div className="toolbar">
        <input placeholder="搜店名、分类、地址" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" onClick={openCreate}>
          添加
        </button>
      </div>
      <div className="chips">
        {statusFilterOptions.map((item) => (
          <button className={`chip ${status === item.value ? 'is-on' : ''}`} type="button" key={item.value} onClick={() => setStatus(item.value)}>
            <img src={item.icon} alt="" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="card-list">
        {filtered.length === 0 ? (
          <section className="empty-state">
            <img src={mascots.empty} alt="" />
            <strong>这里还没有店</strong>
            <span>手动添加，或者从高德导入附近餐厅。</span>
          </section>
        ) : null}
        {filtered.map((store) => (
          <StoreCard key={store.id} store={store} places={places} onEdit={openEdit} onDelete={remove} onStatus={changeStatus} />
        ))}
      </div>
      <Sheet title={editing ? '编辑店铺' : '添加店铺'} open={open} onClose={() => setOpen(false)}>
        {!editing ? (
          <section className="store-origin-card">
            <img src={uiAssets.navStores} alt="" />
            <div>
              <strong>{selectedPlace ? `先记到「${selectedPlace.name}」` : '先添加常用地点'}</strong>
              <span>
                {selectedPlace
                  ? `${selectedPlace.address} · 手动店铺会先使用该地点坐标，精确店铺地址可之后从高德导入。`
                  : '没有常用地点时，暂时不能创建手动店铺。'}
              </span>
            </div>
          </section>
        ) : null}
        <label>
          店名
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          分类
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
        {!editing ? (
          <div className="sheet-chip-row" aria-label="常用分类">
            {categoryOptions.map((item) => (
              <button className={category === item.value ? 'is-on' : ''} type="button" key={item.value} onClick={() => setCategory(item.value)}>
                <img src={item.icon} alt="" />
                {item.value}
              </button>
            ))}
          </div>
        ) : null}
        <label>
          地址
          <input value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        <label>
          人均
          <input type="number" value={avgPrice} onChange={(event) => setAvgPrice(Number(event.target.value))} />
        </label>
        {!editing ? (
          <label>
            关联地点
            <select value={selectedPlaceId} onChange={(event) => changeSelectedPlace(event.target.value)}>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          标签
          <input value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        {!editing ? (
          <div className="sheet-chip-row sheet-chip-row--compact" aria-label="常用标签">
            {tagOptions.map((tag) => (
              <button
                className={tags.split(',').map((item) => item.trim()).includes(tag) ? 'is-on' : ''}
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}
        <button className="primary-button" type="button" disabled={!selectedPlaceId && !editing} onClick={save}>
          保存
        </button>
      </Sheet>
    </div>
  );
}
