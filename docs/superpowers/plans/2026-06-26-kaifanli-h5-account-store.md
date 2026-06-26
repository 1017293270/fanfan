# Kaifanli H5 Account Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile H5 Kaifanli app with invite-only accounts, a super-admin account list, user-owned common places, user-owned store libraries, AMap import, and place-aware recommendations.

**Architecture:** Keep the existing Fastify recommendation backend and add a tested domain/data layer behind route modules. Add a Vite + React + TypeScript H5 workspace that consumes the backend APIs and reuses the current Kaifanli visual system and raster assets from `assets/design/` and `miniprogram/assets/`.

**Tech Stack:** Fastify, TypeScript, Zod, Vitest, Node `crypto`, file-backed development data store plus in-memory test store, Vite, React, TypeScript, CSS modules/plain CSS, Kaifanli PNG brand assets.

---

## Scope Check

This is one coherent vertical slice: accounts unlock per-user places and store libraries, and those stores change recommendation behavior. The implementation will avoid deployment hosting, HTTPS/domain setup, SMS/OAuth login, social features, and a production PostgreSQL adapter in this pass. The backend will use a `DataStore` interface so the local file-backed store can be replaced by PostgreSQL without changing H5 screens or route contracts.

## Visual Source Of Truth

- `E:\fanzainai\assets\design\kaifanli-home-reference.png`
- `E:\fanzainai\assets\design\kaifanli-home-reference.html`
- `E:\fanzainai\assets\design\kaifanli-brand-kit-sheet.png`
- `E:\fanzainai\assets\design\kaifanli-icon-contact-sheet.png`
- `E:\fanzainai\miniprogram\assets\brand\kaifanli-avatar-144.png`
- `E:\fanzainai\miniprogram\assets\icons\*.png`

H5 must keep the same warm rice background, tomato primary action, bamboo green success/navigation accent, peach chips, soft borders, rounded but compact cards, and red-panda mascot presence. No marketing landing page, no new palette, no decorative gradient background, and no generic placeholder art.

## File Structure

```text
E:\fanzainai
  package.json                         # Add h5 workspace and root scripts
  README.md                            # Add H5/account local dev guide
  server/
    package.json                       # Add @fastify/cookie if cookie sessions are used
    .env.example                       # Add auth/admin/data env values
    src/
      app.ts                           # Register auth/admin/place/store/amap routes
      config.ts                        # Load session/admin/data config
      server.ts                        # Compose data store and services
      data/
        types.ts                       # Domain entities and DataStore contract
        memoryStore.ts                 # Deterministic in-memory store for tests
        fileStore.ts                   # Local durable JSON store for dev
        seed.ts                        # Bootstrap super admin and initial invite code
      services/
        password.ts                    # Salted password hashing and verification
        sessions.ts                    # Session token creation and lookup
        places.ts                      # Distance and active-place matching
        storeLibrary.ts                # Store CRUD, place links, AMap import dedupe
        userRecommendationContext.ts   # Turn user library into ranking localContext/candidates
        recommendationService.ts       # Prefer active-place user stores before AMap
      routes/
        auth.ts
        admin.ts
        places.ts
        stores.ts
        amap.ts
        recommendations.ts             # Accept authenticated context without breaking existing tests
      schemas/
        auth.ts
        account.ts
        places.ts
        stores.ts
        recommendation.ts
    tests/
      auth.service.test.ts
      auth.routes.test.ts
      admin.routes.test.ts
      places.service.test.ts
      places.routes.test.ts
      stores.service.test.ts
      stores.routes.test.ts
      recommendation.user-library.test.ts
  h5/
    package.json
    index.html
    tsconfig.json
    vite.config.ts
    src/
      main.tsx
      App.tsx
      api/client.ts
      api/types.ts
      assets/                         # Copied Kaifanli PNG assets
      styles/tokens.css
      styles/app.css
      components/
        AppShell.tsx
        BrandHeader.tsx
        BottomNav.tsx
        IconButton.tsx
        PlacePill.tsx
        StoreCard.tsx
        Sheet.tsx
      screens/
        LoginScreen.tsx
        RegisterScreen.tsx
        HomeScreen.tsx
        PlacesScreen.tsx
        StoresScreen.tsx
        AmapImportScreen.tsx
        AdminScreen.tsx
```

## Task 1: Extend Runtime Config And Data Store Contracts

**Files:**
- Modify: `E:\fanzainai\server\src\config.ts`
- Modify: `E:\fanzainai\server\.env.example`
- Create: `E:\fanzainai\server\src\data\types.ts`
- Create: `E:\fanzainai\server\src\data\memoryStore.ts`
- Create: `E:\fanzainai\server\src\data\fileStore.ts`
- Create: `E:\fanzainai\server\src\data\seed.ts`
- Create: `E:\fanzainai\server\tests\data.store.test.ts`

- [ ] **Step 1: Write failing data-store tests**

Create `server/tests/data.store.test.ts` with tests for user isolation and AMap POI dedupe:

```ts
import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../src/data/memoryStore.js';

describe('DataStore', () => {
  it('keeps places scoped to the owning user', async () => {
    const store = createMemoryStore();
    const userA = await store.users.create({ username: 'a', displayName: 'A', passwordHash: 'hash', role: 'user' });
    const userB = await store.users.create({ username: 'b', displayName: 'B', passwordHash: 'hash', role: 'user' });

    await store.places.create({
      userId: userA.id,
      name: '公司',
      address: '人民广场',
      latitude: 31.2304,
      longitude: 121.4737,
      radiusMeters: 500
    });

    expect(await store.places.listByUser(userA.id)).toHaveLength(1);
    expect(await store.places.listByUser(userB.id)).toHaveLength(0);
  });

  it('deduplicates imported stores by owner and AMap poi id', async () => {
    const store = createMemoryStore();
    const user = await store.users.create({ username: 'fan', displayName: '饭饭', passwordHash: 'hash', role: 'user' });

    const first = await store.stores.upsertByAmapPoi(user.id, {
      amapPoiId: 'B001',
      name: '巷口小厨',
      category: '中餐',
      address: '幸福路 1 号',
      latitude: 31.2304,
      longitude: 121.4737,
      avgPrice: 35,
      rating: '4.7',
      source: 'amap'
    });
    const second = await store.stores.upsertByAmapPoi(user.id, {
      amapPoiId: 'B001',
      name: '巷口小厨',
      category: '中餐',
      address: '幸福路 1 号',
      latitude: 31.2304,
      longitude: 121.4737,
      avgPrice: 35,
      rating: '4.7',
      source: 'amap'
    });

    expect(second.id).toBe(first.id);
    expect(await store.stores.listByUser(user.id)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
npm --workspace server test -- tests/data.store.test.ts
```

Expected: FAIL because `src/data/memoryStore.ts` does not exist.

- [ ] **Step 3: Implement the domain types and memory store**

Implement `types.ts` with `User`, `InviteCode`, `CommonPlace`, `Store`, `StorePlaceLink`, and a `DataStore` interface with `users`, `inviteCodes`, `sessions`, `places`, `stores`, and `storePlaceLinks` repositories. Implement `memoryStore.ts` with generated ids like `usr_`, `inv_`, `plc_`, `sto_`, `lnk_`, deterministic arrays, and owner-scoped list/update/delete methods.

- [ ] **Step 4: Add file-backed persistence**

Implement `fileStore.ts` as a thin wrapper around the same repository behavior that loads and writes `server/.data/kaifanli-dev.json` after mutations. Use atomic writes through a temporary file and rename. The JSON shape must be `{ users: [], inviteCodes: [], sessions: [], places: [], stores: [], storePlaceLinks: [] }`.

- [ ] **Step 5: Extend config and seed helpers**

Add these optional values to `RuntimeConfig`: `sessionSecret`, `dataFilePath`, `adminUsername`, `adminPassword`, `adminDisplayName`, `initialInviteCode`. Update `.env.example` with concrete local example values that are safe to commit. Implement `seed.ts` so first startup creates the super admin and the initial invite code when configured.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm --workspace server test -- tests/data.store.test.ts
npm run build:server
git add server/src/config.ts server/.env.example server/src/data server/tests/data.store.test.ts
git commit -m "feat: add account data store foundation"
```

Expected: tests PASS, TypeScript build succeeds, commit succeeds.

## Task 2: Add Auth, Sessions, And Admin APIs

**Files:**
- Create: `E:\fanzainai\server\src\services\password.ts`
- Create: `E:\fanzainai\server\src\services\sessions.ts`
- Create: `E:\fanzainai\server\src\schemas\auth.ts`
- Create: `E:\fanzainai\server\src\schemas\account.ts`
- Create: `E:\fanzainai\server\src\routes\auth.ts`
- Create: `E:\fanzainai\server\src\routes\admin.ts`
- Modify: `E:\fanzainai\server\src\app.ts`
- Create: `E:\fanzainai\server\tests\auth.routes.test.ts`
- Create: `E:\fanzainai\server\tests\admin.routes.test.ts`

- [ ] **Step 1: Write failing auth route tests**

Cover these behaviors in `auth.routes.test.ts`: registration fails without invite code, registration consumes one unused invite code, login sets a session token response, `/api/auth/me` returns the current user, disabled accounts cannot log in, and duplicate usernames are rejected.

- [ ] **Step 2: Write failing admin route tests**

Cover these behaviors in `admin.routes.test.ts`: normal users receive 403 for `/api/admin/users`, super admin can list users without password hashes, super admin can create invite codes, and disabled invite codes cannot be used.

- [ ] **Step 3: Verify failures**

Run:

```powershell
npm --workspace server test -- tests/auth.routes.test.ts tests/admin.routes.test.ts
```

Expected: FAIL because auth/admin routes are not registered.

- [ ] **Step 4: Implement password and session services**

Use Node `crypto.scrypt` with per-password random salt. Store password hashes as `scrypt$<salt>$<key>`. Generate session tokens with `crypto.randomBytes(32).toString('base64url')`, store only token hashes in the data store, and expire sessions after 30 days.

- [ ] **Step 5: Implement auth/admin routes**

Register:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
GET /api/admin/users
PATCH /api/admin/users/:id/status
GET /api/admin/invite-codes
POST /api/admin/invite-codes
PATCH /api/admin/invite-codes/:id/status
```

Use `Authorization: Bearer <token>` for H5 development and also set an HTTP-only cookie when possible. Route responses must never include `passwordHash`.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm --workspace server test -- tests/auth.routes.test.ts tests/admin.routes.test.ts
npm test
npm run build:server
git add server/src/services/password.ts server/src/services/sessions.ts server/src/schemas/auth.ts server/src/schemas/account.ts server/src/routes/auth.ts server/src/routes/admin.ts server/src/app.ts server/tests/auth.routes.test.ts server/tests/admin.routes.test.ts
git commit -m "feat: add invite-only accounts and admin APIs"
```

Expected: tests PASS, existing recommendation tests still PASS, build succeeds.

## Task 3: Add Places, Store Library, And AMap Import APIs

**Files:**
- Create: `E:\fanzainai\server\src\services\places.ts`
- Create: `E:\fanzainai\server\src\services\storeLibrary.ts`
- Create: `E:\fanzainai\server\src\schemas\places.ts`
- Create: `E:\fanzainai\server\src\schemas\stores.ts`
- Create: `E:\fanzainai\server\src\routes\places.ts`
- Create: `E:\fanzainai\server\src\routes\stores.ts`
- Create: `E:\fanzainai\server\src\routes\amap.ts`
- Modify: `E:\fanzainai\server\src\app.ts`
- Create: `E:\fanzainai\server\tests\places.service.test.ts`
- Create: `E:\fanzainai\server\tests\places.routes.test.ts`
- Create: `E:\fanzainai\server\tests\stores.routes.test.ts`

- [ ] **Step 1: Write failing place matching tests**

`places.service.test.ts` must assert that a point inside a place radius returns that place, a point outside all radii returns `matchedPlace: null`, and the nearest matching place wins when radii overlap.

- [ ] **Step 2: Write failing route tests**

`places.routes.test.ts` and `stores.routes.test.ts` must assert authenticated CRUD, user isolation, place deletion unlinking stores without deleting shared stores, store status updates (`active`, `favorite`, `blocked`, `tired`), and AMap import dedupe.

- [ ] **Step 3: Verify failures**

Run:

```powershell
npm --workspace server test -- tests/places.service.test.ts tests/places.routes.test.ts tests/stores.routes.test.ts
```

Expected: FAIL because services/routes do not exist.

- [ ] **Step 4: Implement place matching**

Use a Haversine distance helper returning meters. Default radius is 500 meters. The response from `POST /api/places/match` must include `{ matchedPlace, distanceMeters, unmatchedLocation }`.

- [ ] **Step 5: Implement store library behavior**

Manual stores require `name`, `category`, and at least one linked place when created from a place context. Imported AMap stores use `amapPoiId` for per-user dedupe and then create or update the store-place link. Deleting a store removes only the owner user's store and links.

- [ ] **Step 6: Implement AMap search proxy**

Add `GET /api/amap/search?keyword=&latitude=&longitude=&radiusMeters=`. Reuse `createAmapClient`, normalize results into store import candidates, and require authentication.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm --workspace server test -- tests/places.service.test.ts tests/places.routes.test.ts tests/stores.routes.test.ts
npm test
npm run build:server
git add server/src/services/places.ts server/src/services/storeLibrary.ts server/src/schemas/places.ts server/src/schemas/stores.ts server/src/routes/places.ts server/src/routes/stores.ts server/src/routes/amap.ts server/src/app.ts server/tests/places.service.test.ts server/tests/places.routes.test.ts server/tests/stores.routes.test.ts
git commit -m "feat: add personal places and store library APIs"
```

Expected: tests PASS and build succeeds.

## Task 4: Make Recommendations Prefer User Store Libraries

**Files:**
- Create: `E:\fanzainai\server\src\services\userRecommendationContext.ts`
- Modify: `E:\fanzainai\server\src\services\recommendationService.ts`
- Modify: `E:\fanzainai\server\src\routes\recommendations.ts`
- Modify: `E:\fanzainai\server\src\schemas\recommendation.ts`
- Create: `E:\fanzainai\server\tests\recommendation.user-library.test.ts`

- [ ] **Step 1: Write failing recommendation tests**

Cover: active place favorites rank before generic AMap candidates, blocked linked stores are excluded, tired/recently eaten stores are penalized, AMap is used when the active place library is empty, and anonymous/legacy recommendation requests still work.

- [ ] **Step 2: Verify failures**

Run:

```powershell
npm --workspace server test -- tests/recommendation.user-library.test.ts
```

Expected: FAIL because user library context is not implemented.

- [ ] **Step 3: Implement user recommendation context**

Convert linked user stores into `RestaurantCandidate` objects and a local-context structure. Map `favorite` to favorite IDs, `blocked` to excluded IDs, and `tired`/recently eaten to a ranking penalty input.

- [ ] **Step 4: Extend ranking with user memory**

Keep existing meal-over-coffee behavior. Add small boosts for favorites and active linked stores, exclude blocked stores, and lower recently eaten/tired stores. Use AMap candidates only when the user pool has fewer than three usable stores.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm --workspace server test -- tests/recommendation.user-library.test.ts
npm test
npm run build:server
git add server/src/services/userRecommendationContext.ts server/src/services/recommendationService.ts server/src/routes/recommendations.ts server/src/schemas/recommendation.ts server/tests/recommendation.user-library.test.ts
git commit -m "feat: prefer personal store libraries in recommendations"
```

Expected: all backend tests PASS and build succeeds.

## Task 5: Scaffold H5 Workspace With Kaifanli Assets

**Files:**
- Modify: `E:\fanzainai\package.json`
- Create: `E:\fanzainai\h5\package.json`
- Create: `E:\fanzainai\h5\index.html`
- Create: `E:\fanzainai\h5\tsconfig.json`
- Create: `E:\fanzainai\h5\vite.config.ts`
- Create: `E:\fanzainai\h5\src\main.tsx`
- Create: `E:\fanzainai\h5\src\App.tsx`
- Create: `E:\fanzainai\h5\src\styles\tokens.css`
- Create: `E:\fanzainai\h5\src\styles\app.css`
- Copy: `E:\fanzainai\miniprogram\assets\brand\kaifanli-avatar-144.png` to `E:\fanzainai\h5\src\assets\brand\kaifanli-avatar-144.png`
- Copy: `E:\fanzainai\miniprogram\assets\icons\*.png` to `E:\fanzainai\h5\src\assets\icons\*.png`

- [ ] **Step 1: Add workspace dependencies**

Install:

```powershell
npm install -w h5 @vitejs/plugin-react vite typescript react react-dom lucide-react
npm install -w h5 -D @types/react @types/react-dom
```

Expected: `h5/package.json` and root lockfile update.

- [ ] **Step 2: Create H5 shell**

Create a mobile-first `App.tsx` that renders login when unauthenticated and app tabs when authenticated. The first screen must be the real app, not a landing page.

- [ ] **Step 3: Create visual tokens**

`tokens.css` must define these tokens exactly:

```css
:root {
  --kfl-rice: #fff8ef;
  --kfl-tomato: #f24b3a;
  --kfl-bamboo: #477f32;
  --kfl-ink: #2f2926;
  --kfl-muted: #8a7469;
  --kfl-line: #f4e3d9;
  --kfl-peach: #ffe9df;
  --kfl-green-soft: #e9f5df;
  --kfl-warm: #fff2e8;
  --kfl-orange: #f7b642;
}
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
npm --workspace h5 run build
git add package.json package-lock.json h5
git commit -m "feat: scaffold kaifanli h5 app shell"
```

Expected: H5 build succeeds.

## Task 6: Build H5 Auth, Home, Places, Stores, Import, And Admin Screens

**Files:**
- Create: `E:\fanzainai\h5\src\api\client.ts`
- Create: `E:\fanzainai\h5\src\api\types.ts`
- Create/modify: `E:\fanzainai\h5\src\components\*.tsx`
- Create/modify: `E:\fanzainai\h5\src\screens\*.tsx`
- Modify: `E:\fanzainai\h5\src\App.tsx`
- Modify: `E:\fanzainai\h5\src\styles\app.css`

- [ ] **Step 1: Implement API client**

Use a typed `requestJson` wrapper with `Authorization: Bearer <token>`, token persistence in `localStorage`, and readable error messages from backend `{ message }` responses.

- [ ] **Step 2: Implement login and registration**

Use the mascot avatar at the top, compact white forms, tomato primary buttons, peach secondary tabs, and a short unavailable forgot-password state that says to contact the administrator.

- [ ] **Step 3: Implement recommendation home**

Include `BrandHeader`, active place pill, unmatched-location add prompt, preference textarea, quick chips, tomato CTA, recommendation card, alternatives, and action buttons using the existing PNG icons for refresh/favorite/dislike/navigation.

- [ ] **Step 4: Implement common places screen**

List user places as compact cards with name, address, radius, linked store count, edit/delete actions, and add-from-current-location/manual-add sheet.

- [ ] **Step 5: Implement store library screen**

Add place switcher, search, status chips, store cards, manual add/edit sheet, delete/unlink, favorite, tired, blocked, and mark-eaten actions.

- [ ] **Step 6: Implement AMap import screen**

Add keyword/radius/category controls, selected place context, result cards, already-added state, and add-with-tags action. Use bamboo location icon and bowl/chili icons where relevant.

- [ ] **Step 7: Implement super admin screen**

Show account list and invite-code list only when `me.role === 'super_admin'`. Include create invite code and disable/enable controls. Normal users must not see this tab.

- [ ] **Step 8: Verify and commit**

Run:

```powershell
npm --workspace h5 run build
git add h5/src
git commit -m "feat: build kaifanli h5 account and store flows"
```

Expected: H5 build succeeds and commit succeeds.

## Task 7: Local Integration, Docs, And Design QA

**Files:**
- Modify: `E:\fanzainai\README.md`
- Create: `E:\fanzainai\design-qa-h5.md`
- Optional create: `E:\fanzainai\assets\design\qa\h5-*.png`

- [ ] **Step 1: Update documentation**

Document:

```text
npm run dev:server
npm --workspace h5 run dev -- --host 127.0.0.1 --port 5173
H5 local URL: http://127.0.0.1:5173
Initial admin env keys: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME, INITIAL_INVITE_CODE
```

- [ ] **Step 2: Run full automated verification**

Run:

```powershell
npm test
npm run build:server
npm --workspace h5 run build
```

Expected: all tests PASS and both builds succeed.

- [ ] **Step 3: Start local servers**

Start backend and H5 dev server:

```powershell
npm run dev:server
npm --workspace h5 run dev -- --host 127.0.0.1 --port 5173
```

Expected: backend health endpoint is OK and H5 is available at `http://127.0.0.1:5173`.

- [ ] **Step 4: Capture design QA evidence**

Capture mobile screenshots for login, recommendation home, store library, and AMap import. Compare them against `assets/design/kaifanli-home-reference.png` and the existing mini program QA screenshots. Save findings to `design-qa-h5.md`.

The QA report must include:

```text
final result: passed
source visual targets
prototype screenshots
P0/P1/P2 issues fixed
remaining P3 notes
```

- [ ] **Step 5: Commit docs and QA**

Run:

```powershell
git add README.md design-qa-h5.md assets/design/qa
git commit -m "docs: add h5 local run and design qa notes"
```

Expected: commit succeeds.

## Self-Review

- Spec coverage: The plan covers invite registration, username/password login, super admin account/invite management, private common places, private store libraries, AMap import, place matching, user-library recommendations, H5 screens, and design QA.
- Scope control: HTTPS deployment, production domain, phone/SMS auth, OAuth, social features, and production PostgreSQL hosting are excluded from this implementation pass.
- Visual consistency: The plan explicitly binds H5 UI to the current Kaifanli PNG references, palette, card rhythm, mascot, and icon assets.
- Type consistency: Domain entities live in `server/src/data/types.ts`; route schemas live in `server/src/schemas/`; frontend types mirror API responses in `h5/src/api/types.ts`.
- TDD coverage: Backend behavior starts with failing tests for data isolation, auth, admin, places, stores, import dedupe, and recommendation ranking before production code changes.
- Verification: Completion requires backend tests, backend build, H5 build, running local servers, and a passed H5 design QA report.
