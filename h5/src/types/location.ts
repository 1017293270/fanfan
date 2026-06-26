export type LocationStatus = {
  source: 'locating' | 'browser' | 'fallback';
  title: string;
  detail: string;
  updatedAt?: string;
};
