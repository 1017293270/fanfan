# Kaifanli H5 Account And Store Library Design

## Goal

Build a mobile H5 version of Kaifanli that turns the current one-off nearby recommendation flow into a personal meal decision system. Users sign in with an invite-only account, maintain their own common places and store libraries, and get recommendations that adapt to whether they are at work, at home, or somewhere new.

The H5 should reuse the current Kaifanli brand direction: warm rice background, tomato CTA, bamboo green success/navigation accents, rounded food cards, and the red-panda mascot. The H5 can be clearer and more management-oriented than the mini program, but it should still feel cute, friendly, and lightweight.

## Product Scope

### In Scope For This Phase

- Mobile H5 app with full working flows.
- Username/account/password login.
- Invite-code-only registration.
- One built-in super administrator role.
- Super administrator can view user accounts and manage invite codes.
- Normal users can only see and manage their own data.
- Each user can create and manage common places, such as company, home, school, or gym.
- Each user has a private store library, with stores associated to one or more common places.
- Users can manually add, edit, and delete stores.
- Users can search AMap nearby/by keyword and import stores into their own library.
- Recommendation flow matches current location to a common place, then prioritizes that place's user store library.
- If the current location does not match a saved common place, prompt the user to add it as a common place.
- Existing AMap + AI recommendation backend remains the foundation.

### Out Of Scope For This Phase

- Social sharing, friend groups, team store libraries, or multi-user collaboration.
- WeChat native mini program conversion of the new H5 screens.
- Payment, subscriptions, public discovery, or restaurant owner features.
- Complex OAuth or phone/SMS login.
- Multi-admin hierarchy. Only one super admin role is needed for now.

## Users And Roles

### Guest

- Can view login and registration entry.
- Can register only with a valid invite code.
- Cannot access recommendation or store library data.

### Normal User

- Can log in with account and password.
- Can manage their own common places.
- Can manage their own store library.
- Can import stores from AMap search results.
- Can get recommendations using their current location, place context, preferences, and store history.
- Cannot view other accounts or other users' store libraries.

### Super Admin

- Has all normal user abilities for their own data.
- Can view account list.
- Can create, disable, and inspect invite codes.
- Can see basic account metadata: username, display name, role, created time, last login, status.
- Should not need to inspect user passwords or private store notes.

## Core Concepts

### Account

An account has:

- id
- username
- display name
- password hash
- role: `user` or `super_admin`
- status: `active` or `disabled`
- created at
- last login at

Passwords must never be stored as plain text. The backend should store a salted password hash.

### Invite Code

An invite code has:

- id
- code
- status: `unused`, `used`, or `disabled`
- created by admin id
- created at
- used by user id
- used at

Registration consumes one active unused invite code.

### Common Place

A common place is a user-owned location profile.

Fields:

- id
- user id
- name, such as company or home
- address text
- latitude
- longitude
- match radius meters, default 500
- sort order
- created at
- updated at

Location matching:

- When the user opens the app, the H5 asks for location permission.
- The backend or frontend computes distance between current location and saved places.
- If the nearest place is within its match radius, that place becomes the active place.
- If no place matches, show a gentle prompt: "This looks like a new regular spot. Add it?"

### Store

A store is a restaurant candidate, usually backed by an AMap POI.

Fields:

- id
- owner user id
- amap poi id, optional for manual stores
- name
- category
- address
- latitude
- longitude
- average price
- rating
- phone, optional
- source: `manual` or `amap`
- created at
- updated at

AMap POI id should be used to deduplicate imported stores for the same user.

### Store-Place Link

One store may belong to one or more of the user's common places.

Fields:

- user id
- store id
- place id
- personal status: `active`, `favorite`, `blocked`, `tired`
- tags, such as rice, noodles, light, spicy, team lunch
- note
- last eaten at
- eaten count
- created at
- updated at

The recommendation engine should use the store-place link for user-specific memory instead of treating all restaurants globally.

## H5 Information Architecture

### 1. Login And Registration

Screens:

- Login
- Register with invite code
- Forgot password unavailable state with a short message to contact the administrator

Login form:

- account
- password
- submit

Registration form:

- invite code
- username/account
- display name
- password
- confirm password

States:

- loading
- invalid account or password
- invalid/used invite code
- disabled account
- successful login redirects to recommendation home

### 2. Recommendation Home

Purpose:

Let the user get a meal decision quickly while the app quietly uses account, place, and store memory.

Main elements:

- Kaifanli hero with mascot.
- Active place pill, such as "Company" or "Home".
- If unmatched: "Current location is not in saved places" prompt with "Add as common place".
- Preference input and quick chips.
- Primary CTA: "Let FanFanLi decide".
- Recommendation result card.
- Alternatives.
- Actions: refresh, favorite, not this, navigate, mark eaten.

Recommendation order:

1. Identify active common place from location.
2. Pull stores linked to that place.
3. Exclude blocked stores.
4. Boost favorites, active stores, matching tags, recent positive choices.
5. Penalize tired stores and recently eaten stores.
6. If local store pool is too small, supplement with AMap results.
7. If the user picks/imports a new AMap store, save it to the active place library.

### 3. My Common Places

Purpose:

Let users manage the location contexts that drive recommendations.

List card fields:

- place name
- address
- match radius
- linked store count
- last used

Actions:

- add place from current location
- manually add place
- edit name/address/radius
- delete place
- view stores for this place

Delete behavior:

- Deleting a place removes store-place links for that place.
- It does not delete the underlying user-owned stores if they are linked to other places.

### 4. My Store Library

Purpose:

Give users a clear place to manage their personal restaurants.

Top controls:

- place switcher: Company, Home, All places, Current nearby
- search input
- filter chips: all, favorites, active, eaten recently, tired, blocked
- add button

Store card fields:

- store name
- category
- place badge
- average price
- distance from active/current place when available
- tags
- note preview
- status badge

Store actions:

- edit
- delete or unlink from place
- favorite/unfavorite
- mark blocked
- mark tired
- mark eaten
- restore to active

Manual add form:

- name
- category
- address
- price
- tags
- note
- linked places

Edit form:

- same as manual add
- status and place links can be changed

### 5. Add From AMap

Purpose:

Let users quickly seed a location-specific store library.

Entry points:

- From store library add button.
- From unmatched-location prompt.
- From recommendation result when a new store is chosen.

Search controls:

- keyword
- current location or selected common place
- radius
- category quick chips: meal, noodles, rice, light, spicy, cafe, dessert

Result card fields:

- name
- category
- distance
- price/rating when available
- address
- already added state

Actions:

- add to selected place
- add with tags
- ignore

Import behavior:

- If AMap POI id already exists for the user, link it to the selected place instead of creating a duplicate.
- Default imported status is `active`.
- Imported tags may be seeded from AMap category but can be edited.

### 6. Admin

Accessible only to the super admin.

Screens:

- Account list
- Invite code list
- Create invite code

Account list fields:

- username
- display name
- role
- status
- created at
- last login

Invite code fields:

- code
- status
- created at
- used by
- used at

Admin actions:

- create invite code
- disable invite code
- disable user
- enable user

## Backend API Shape

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Admin:

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/invite-codes`
- `POST /api/admin/invite-codes`
- `PATCH /api/admin/invite-codes/:id/status`

Places:

- `GET /api/places`
- `POST /api/places`
- `PATCH /api/places/:id`
- `DELETE /api/places/:id`
- `POST /api/places/match`

Stores:

- `GET /api/stores`
- `POST /api/stores`
- `PATCH /api/stores/:id`
- `DELETE /api/stores/:id`
- `POST /api/stores/:id/link-place`
- `DELETE /api/stores/:id/link-place/:placeId`
- `PATCH /api/store-place-links/:id`

AMap import:

- `GET /api/amap/search`
- `POST /api/stores/import-amap`

Recommendation:

- `POST /api/recommendations`

The existing recommendation endpoint should be extended with authenticated user context. It should accept current location and preferences, then infer or receive the active common place.

## Data Storage Recommendation

Use PostgreSQL for the deployable backend. SQLite is acceptable only for local development or a temporary prototype.

Reasoning:

- Account and invite-code flows need durable transactional writes.
- Store-place relations and recommendation history benefit from relational constraints.
- Later deployment behind HTTPS will likely run as an independent backend service.

## Security And Privacy

- Passwords must be salted and hashed.
- Registration requires a valid invite code.
- Session should use secure HTTP-only cookies in production.
- Every user-owned entity must be scoped by `user_id`.
- Admin routes must require `super_admin`.
- The backend must not expose password hashes.
- Location data is sensitive. Store only common places the user explicitly creates.
- When a new current location is detected, ask before saving it as a common place.

## Recommendation Behavior Details

When current location matches a common place:

- Use that place's linked stores as the primary pool.
- Use AMap only when the pool is empty or too small.
- Save accepted AMap choices into the active place library.

When current location does not match a common place:

- Show an add-place prompt.
- Still allow one-off recommendation from AMap.
- If the user adds the place, future recommendations use that new place library.

When user edits store status:

- Favorite increases rank.
- Blocked excludes.
- Tired lowers rank.
- Recently eaten lowers rank for a configurable period.
- Mark eaten updates last eaten time and count.

## Design System Notes

- Keep the current warm Kaifanli palette:
  - rice background `#FFF8EF`
  - tomato primary `#F24B3A`
  - bamboo green `#477F32`
  - muted brown text `#8A7469`
  - soft border `#F4E3D9`
  - peach selected chip `#FFE9DF`
- Use real mascot image assets from the existing project.
- H5 management screens should feel denser than the mini program home, but not enterprise-heavy.
- Cards should use modest rounded corners and clear scan hierarchy.
- No marketing landing page is needed. The app opens directly into login or recommendation home.

## Testing Strategy

Backend:

- Auth register/login/logout tests.
- Invite-code consumption tests.
- Role authorization tests.
- User data isolation tests.
- Place matching tests.
- Store CRUD and AMap import dedupe tests.
- Recommendation tests for place-specific store pools.

Frontend:

- Login and registration form state tests if frontend test tooling is added.
- Manual QA for mobile viewport, especially store library filters and AMap import.
- Design QA screenshots for login, recommendation home, store library, and add-from-AMap flow.

## Acceptance Criteria

- A user can register with an invite code and log in.
- A normal user cannot access admin account list.
- The super admin can see account list and manage invite codes.
- A user can create at least two common places.
- Current location can match a saved common place by radius.
- A user can manually add, edit, delete, and status-tag stores.
- A user can search AMap and import a store without duplicating an existing POI.
- Recommendation uses the matched place's store library before generic AMap results.
- Unmatched current location prompts the user to add it as a common place.
- User A cannot see or modify User B's places, stores, or store-place links.

## Implementation Decisions

- The initial super admin account will be bootstrapped from environment variables on first startup.
- The H5 frontend stack will be Vite + React + TypeScript.
- PostgreSQL is the target deployable database. A local development database may run in Docker or a local Postgres instance.
- Deployment domain and database hosting are out of scope for this design, but the backend must be written with HTTPS deployment and secure cookies in mind.
