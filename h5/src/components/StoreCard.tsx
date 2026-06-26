import type { Place, Store, StorePlaceLink } from '../api/types';
import { uiAssets } from '../assets/visualAssets';

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

const statusIcon: Record<StorePlaceLink['status'], string> = {
  active: uiAssets.actionEat,
  favorite: uiAssets.actionFavorite,
  blocked: uiAssets.actionDislike,
  tired: uiAssets.actionSpicy
};

function cleanParts(value: string) {
  const parts = value
    .split(/[;；,，]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== '餐饮服务');
  return Array.from(new Set(parts));
}

export function StoreCard({ store, places, onStatus, onEdit, onDelete }: StoreCardProps) {
  const primaryLink = store.links[0];
  const primaryIcon = primaryLink ? statusIcon[primaryLink.status] : uiAssets.actionEat;
  const categoryParts = cleanParts(store.category);
  const categoryLabel = categoryParts[categoryParts.length - 1] || store.category || '餐饮';
  const displayTags = Array.from(new Set(primaryLink?.tags.flatMap(cleanParts) || [])).slice(0, 4);
  const placeNames = store.links
    .map((link) => places.find((place) => place.id === link.placeId)?.name)
    .filter(Boolean)
    .join(' / ');

  return (
    <article className="store-card">
      <div className="store-card__top">
        <div className="store-card__avatar">
          <img src={primaryIcon} alt="" />
        </div>
        <div className="store-card__summary">
          <h3>{store.name}</h3>
          <p>
            {categoryLabel} · {store.avgPrice ? `人均${store.avgPrice}元` : '价格待补'} · {placeNames || '未关联地点'}
          </p>
          <div className="tag-row store-card__tags">
            {(displayTags.length ? displayTags : ['待标记']).map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        {primaryLink ? (
          <span className={`status-badge status-badge--${primaryLink.status}`}>
            <img src={statusIcon[primaryLink.status]} alt="" />
            {statusText[primaryLink.status]}
          </span>
        ) : null}
      </div>
      {primaryLink?.note ? <p className="store-card__note">{primaryLink.note}</p> : null}
      <div className="store-card__actions">
        {primaryLink ? (
          <>
            <button className="store-card__action store-card__action--favorite" type="button" onClick={() => onStatus?.(primaryLink, 'favorite')}>
              喜欢
            </button>
            <button className="store-card__action store-card__action--tired" type="button" onClick={() => onStatus?.(primaryLink, 'tired')}>
              吃腻
            </button>
            <button className="store-card__action store-card__action--blocked" type="button" onClick={() => onStatus?.(primaryLink, 'blocked')}>
              拉黑
            </button>
          </>
        ) : null}
        <button className="store-card__action store-card__action--ghost" type="button" onClick={() => onEdit?.(store)}>
          编辑
        </button>
        <button className="store-card__action store-card__action--ghost" type="button" onClick={() => onDelete?.(store)}>
          删除
        </button>
      </div>
    </article>
  );
}
