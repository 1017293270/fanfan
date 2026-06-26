import { useEffect, useMemo, useState } from 'react';
import { api, getStoredToken, setStoredToken } from './api/client';
import type { LocationPoint, Place, PublicUser, Store } from './api/types';
import { mascots, uiAssets } from './assets/visualAssets';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PlacesScreen } from './screens/PlacesScreen';
import { StoresScreen } from './screens/StoresScreen';
import { AmapImportScreen } from './screens/AmapImportScreen';
import { AdminScreen } from './screens/AdminScreen';
import type { LocationStatus } from './types/location';

const fallbackLocation: LocationPoint = {
  latitude: 31.2304,
  longitude: 121.4737
};

const fallbackLocationStatus: LocationStatus = {
  source: 'fallback',
  title: '当前使用兜底定位',
  detail: '还没读到浏览器定位，先按上海市中心附近处理。'
};

function formatLocationDetail(location: LocationPoint) {
  return `经纬度 ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

function formatLocationTime() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function App() {
  const [me, setMe] = useState<PublicUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [unmatched, setUnmatched] = useState(false);
  const [location, setLocation] = useState<LocationPoint>(fallbackLocation);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(fallbackLocationStatus);
  const [activeTab, setActiveTab] = useState('home');

  const navItems = useMemo(() => {
    const items = [
      { id: 'home', label: '开饭', iconSrc: uiAssets.navHome },
      { id: 'places', label: '地点', iconSrc: uiAssets.navPlaces },
      { id: 'stores', label: '店铺', iconSrc: uiAssets.navStores },
      { id: 'import', label: '导入', iconSrc: uiAssets.navImport }
    ];
    if (me?.role === 'super_admin') items.push({ id: 'admin', label: '管理', iconSrc: uiAssets.navAdmin });
    return items;
  }, [me?.role]);

  async function locate(): Promise<LocationPoint> {
    setLocationStatus({
      source: 'locating',
      title: '正在读取当前位置',
      detail: '请允许浏览器定位，饭饭狸会用它匹配公司或家。'
    });
    if (!navigator.geolocation) {
      setLocation(fallbackLocation);
      setLocationStatus({
        source: 'fallback',
        title: '浏览器不支持定位',
        detail: `${formatLocationDetail(fallbackLocation)} · 使用兜底位置`,
        updatedAt: formatLocationTime()
      });
      return fallbackLocation;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(next);
          setLocationStatus({
            source: 'browser',
            title: '已读取当前位置',
            detail: `${formatLocationDetail(next)} · 精度约 ${Math.round(position.coords.accuracy)}m`,
            updatedAt: formatLocationTime()
          });
          resolve(next);
        },
        () => {
          setLocation(fallbackLocation);
          setLocationStatus({
            source: 'fallback',
            title: '定位失败，使用兜底位置',
            detail: `${formatLocationDetail(fallbackLocation)} · 请检查浏览器定位权限`,
            updatedAt: formatLocationTime()
          });
          resolve(fallbackLocation);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  async function resolveAddress(point: LocationPoint): Promise<string> {
    try {
      const result = await api.reverseGeocode(point);
      return result.formattedAddress || '当前位置附近';
    } catch {
      return '当前位置附近';
    }
  }

  async function refreshDomain(nextLocation = location) {
    const [placeResult, storeResult] = await Promise.all([api.listPlaces(), api.listStores()]);
    setPlaces(placeResult.places);
    setStores(storeResult.stores);
    if (placeResult.places.length === 0) {
      setActivePlace(null);
      setUnmatched(true);
      return;
    }
    try {
      const match = await api.matchPlace(nextLocation);
      setActivePlace(match.matchedPlace || placeResult.places[0]);
      setUnmatched(match.unmatchedLocation);
    } catch {
      setActivePlace(placeResult.places[0]);
      setUnmatched(false);
    }
  }

  async function loadSession() {
    const token = getStoredToken();
    if (!token) {
      setBooting(false);
      return;
    }
    try {
      const [{ user }, nextLocation] = await Promise.all([api.me(), locate()]);
      setMe(user);
      await refreshDomain(nextLocation);
    } catch {
      setStoredToken(null);
      setMe(null);
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  async function handleAuth(user: PublicUser) {
    setMe(user);
    const nextLocation = await locate();
    await refreshDomain(nextLocation);
  }

  async function handleChanged() {
    await refreshDomain(location);
  }

  async function logout() {
    await api.logout().catch(() => undefined);
    setStoredToken(null);
    setMe(null);
    setActiveTab('home');
  }

  if (booting) {
    return (
      <main className="app app--loading">
        <img src={mascots.loading} alt="" />
        <span>饭饭狸醒醒中</span>
      </main>
    );
  }

  if (!me) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  return (
    <AppShell navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="account-bar">
        <span>{me.displayName}</span>
        <button type="button" onClick={logout}>
          退出
        </button>
      </div>
      {activeTab === 'home' ? (
        <HomeScreen
          places={places}
          activePlace={activePlace}
          locationStatus={locationStatus}
          unmatched={unmatched}
          onChanged={handleChanged}
          onLocate={locate}
          onResolveAddress={resolveAddress}
        />
      ) : null}
      {activeTab === 'places' ? (
        <PlacesScreen
          places={places}
          location={location}
          locationStatus={locationStatus}
          onChanged={handleChanged}
          onLocate={locate}
          onResolveAddress={resolveAddress}
        />
      ) : null}
      {activeTab === 'stores' ? <StoresScreen places={places} stores={stores} activePlace={activePlace} onChanged={handleChanged} /> : null}
      {activeTab === 'import' ? (
        <AmapImportScreen
          places={places}
          activePlace={activePlace}
          location={location}
          locationStatus={locationStatus}
          onChanged={handleChanged}
        />
      ) : null}
      {activeTab === 'admin' ? <AdminScreen currentUser={me} /> : null}
    </AppShell>
  );
}
