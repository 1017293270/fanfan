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

const fallbackLocation: LocationPoint = {
  latitude: 31.2304,
  longitude: 121.4737
};

export default function App() {
  const [me, setMe] = useState<PublicUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [unmatched, setUnmatched] = useState(false);
  const [location, setLocation] = useState<LocationPoint>(fallbackLocation);
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
    if (!navigator.geolocation) {
      setLocation(fallbackLocation);
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
          resolve(next);
        },
        () => {
          setLocation(fallbackLocation);
          resolve(fallbackLocation);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
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
          location={location}
          unmatched={unmatched}
          onChanged={handleChanged}
          onLocate={locate}
        />
      ) : null}
      {activeTab === 'places' ? <PlacesScreen places={places} location={location} onChanged={handleChanged} onLocate={locate} /> : null}
      {activeTab === 'stores' ? <StoresScreen places={places} stores={stores} activePlace={activePlace} onChanged={handleChanged} /> : null}
      {activeTab === 'import' ? (
        <AmapImportScreen places={places} activePlace={activePlace} location={location} onChanged={handleChanged} />
      ) : null}
      {activeTab === 'admin' ? <AdminScreen currentUser={me} /> : null}
    </AppShell>
  );
}
