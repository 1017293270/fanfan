import { describe, expect, it } from 'vitest';
import { applyPlaceSuggestionToDraft } from '../src/utils/placeSuggestionDraft';

const suggestion = {
  amapPoiId: 'B0PLACE',
  name: '人民广场',
  category: '地名地址信息;热点地名',
  address: '上海市黄浦区人民大道',
  latitude: 31.2301,
  longitude: 121.4736,
  distanceMeters: 360,
  tags: ['地名地址信息', '热点地名']
};

describe('place suggestion draft helpers', () => {
  it('fills address and coordinates from the selected suggestion', () => {
    const draft = applyPlaceSuggestionToDraft({
      currentName: '公司',
      defaultNames: ['公司', '新地点'],
      suggestion
    });

    expect(draft).toEqual({
      name: '人民广场',
      address: '上海市黄浦区人民大道',
      location: { latitude: 31.2301, longitude: 121.4736 }
    });
  });

  it('keeps a custom place name while updating the address and coordinates', () => {
    const draft = applyPlaceSuggestionToDraft({
      currentName: '我的办公室',
      defaultNames: ['公司', '新地点'],
      suggestion
    });

    expect(draft.name).toBe('我的办公室');
    expect(draft.address).toBe('上海市黄浦区人民大道');
    expect(draft.location).toEqual({ latitude: 31.2301, longitude: 121.4736 });
  });
});
