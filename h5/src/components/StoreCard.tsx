import type { Place, Store, StorePlaceLink } from '../api/types';

type StoreCardProps = {
  store: Store;
  places: Place[];
  onStatus?: (link: StorePlaceLink, status: StorePlaceLink['status']) => void;
  onEdit?: (store: Store) => void;
  onDelete?: (store: Store) => void;
};

const statusText: Record<StorePlaceLink['status'], string> = {
  active: '常吃',
  favorite: '喜欢',
  blocked: '拉黑',
  tired: '吃腻'
};

export function StoreCard({ store, places, onStatus, onEdit, onDelete }: StoreCardProps) {
  const primaryLink = store.links[0];
  const placeNames = store.links
    .map((link) => places.find((place) => place.id === link.placeId)?.name)
    .filter(Boolean)
    .join(' / ');

  return (
    <article className="store-card">
      <div className="store-card__top">
        <div>
          <h3>{store.name}</h3>
          <p>
            {store.category} · {store.avgPrice ? `人均${store.avgPrice}元` : '价格待补'} · {placeNames || '未关联地点'}
          </p>
        </div>
        {primaryLink ? <span className={`status-badge status-badge--${primaryLink.status}`}>{statusText[primaryLink.status]}</span> : null}
      </div>
      <div className="tag-row">
        {(primaryLink?.tags.length ? primaryLink.tags : ['待标记']).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      {primaryLink?.note ? <p className="store-card__note">{primaryLink.note}</p> : null}
      <div className="compact-actions">
        {primaryLink ? (
          <>
            <button type="button" onClick={() => onStatus?.(primaryLink, 'favorite')}>
              喜欢
            </button>
            <button type="button" onClick={() => onStatus?.(primaryLink, 'tired')}>
              吃腻
            </button>
            <button type="button" onClick={() => onStatus?.(primaryLink, 'blocked')}>
              拉黑
            </button>
          </>
        ) : null}
        <button type="button" onClick={() => onEdit?.(store)}>
          编辑
        </button>
        <button type="button" onClick={() => onDelete?.(store)}>
          删除
        </button>
      </div>
    </article>
  );
}
