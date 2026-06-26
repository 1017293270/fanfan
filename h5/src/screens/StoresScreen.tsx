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

export function StoresScreen({ places, stores, activePlace, onChanged }: StoresScreenProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | StorePlaceStatus>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [name, setName] = useState('巷口小厨');
  const [category, setCategory] = useState('中餐');
  const [address, setAddress] = useState('幸福路 1 号');
  const [avgPrice, setAvgPrice] = useState(35);
  const [tags, setTags] = useState('米饭,家常菜');
  const [selectedPlaceId, setSelectedPlaceId] = useState(activePlace?.id || places[0]?.id || '');

  const filtered = useMemo(() => {
    return stores.filter((store) => {
      const text = `${store.name} ${store.category} ${store.address}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus = status === 'all' || store.links.some((link) => link.status === status);
      return matchesQuery && matchesStatus;
    });
  }, [query, status, stores]);

  function openCreate() {
    setEditing(null);
    setName('巷口小厨');
    setCategory('中餐');
    setAddress('幸福路 1 号');
    setAvgPrice(35);
    setTags('米饭,家常菜');
    setSelectedPlaceId(activePlace?.id || places[0]?.id || '');
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
      await api.createStore({
        name,
        category,
        address,
        latitude: activePlace?.latitude || 31.2304,
        longitude: activePlace?.longitude || 121.4737,
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
        <button className="toolbar__image-button" type="button" onClick={openCreate}>
          <img src={uiAssets.actionEat} alt="" />
          添加
        </button>
      </div>
      <div className="chips">
        {(['all', 'active', 'favorite', 'tired', 'blocked'] as const).map((item) => (
          <button className={`chip ${status === item ? 'is-on' : ''}`} type="button" key={item} onClick={() => setStatus(item)}>
            <img
              src={
                item === 'favorite'
                  ? uiAssets.actionFavorite
                  : item === 'tired'
                    ? uiAssets.actionEat
                    : item === 'blocked'
                      ? uiAssets.actionDislike
                      : uiAssets.badgeKaifanliRecommend
              }
              alt=""
            />
            {item === 'all' ? '全部' : item === 'active' ? '常吃' : item === 'favorite' ? '喜欢' : item === 'tired' ? '吃腻' : '拉黑'}
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
        <label>
          店名
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          分类
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
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
            <select value={selectedPlaceId} onChange={(event) => setSelectedPlaceId(event.target.value)}>
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
        <button className="primary-button" type="button" disabled={!selectedPlaceId && !editing} onClick={save}>
          保存
        </button>
      </Sheet>
    </div>
  );
}
