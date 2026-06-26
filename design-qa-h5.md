**Source Visual Truth**
- Home reference image: `E:\fanzainai\assets\design\kaifanli-home-reference.png`
- Home reference HTML: `E:\fanzainai\assets\design\kaifanli-home-reference.html`
- Brand kit sheet: `E:\fanzainai\assets\design\kaifanli-brand-kit-sheet.png`
- Icon contact sheet: `E:\fanzainai\assets\design\kaifanli-icon-contact-sheet.png`
- Complete asset board: `E:\fanzainai\assets\design\kaifanli-complete-asset-board.png`
- Image2 uniform icon sheet: `E:\fanzainai\assets\design\kaifanli-image2-uniform-icon-sheet.png`
- Image2 navigation icon sheet: `E:\fanzainai\assets\design\kaifanli-image2-nav-icon-sheet.png`
- Image2 filter icon sheet: `E:\fanzainai\assets\design\kaifanli-image2-filter-icon-sheet.png`

**Implementation Evidence**
- Login: `E:\fanzainai\assets\design\qa\h5-login.png`
- Home idle: `E:\fanzainai\assets\design\qa\h5-home.png`
- Home result: `E:\fanzainai\assets\design\qa\h5-home-result.png`
- Store library: `E:\fanzainai\assets\design\qa\h5-stores.png`
- AMap import: `E:\fanzainai\assets\design\qa\h5-import.png`
- Admin: `E:\fanzainai\assets\design\qa\h5-admin.png`
- Image2 login: `E:\fanzainai\assets\design\qa\h5-image2-login.png`
- Image2 home idle: `E:\fanzainai\assets\design\qa\h5-image2-home.png`
- Image2 home result: `E:\fanzainai\assets\design\qa\h5-image2-home-result.png`
- Image2 places: `E:\fanzainai\assets\design\qa\h5-image2-places.png`
- Image2 store library: `E:\fanzainai\assets\design\qa\h5-image2-stores.png`
- Image2 AMap import: `E:\fanzainai\assets\design\qa\h5-image2-import.png`
- Image2 admin: `E:\fanzainai\assets\design\qa\h5-image2-admin.png`

**Viewport**
- H5 screenshots captured at 390x844.
- The H5 shell is constrained to a mobile app surface and uses the same warm rice background, tomato primary action, bamboo accent, soft card borders, and compact rounded chips from the approved visual direction.

**States Checked**
- Login and invite registration entry.
- Authenticated recommendation home with current-place context.
- Recommendation result using a personal place/store-library context.
- Store list, manual store form, and favorite state controls.
- AMap import list with add-to-library action.
- Super-admin account and invite-code management.
- Bad-request/error-message mapping for H5 API failures.

**Visual Checks**
- Mascot/avatar assets are real PNG files copied from the approved brand materials.
- Header hierarchy follows the approved pattern: small red brand label, bold screen title, muted helper line.
- Form controls, chips, primary CTA, result card, alternate card, action grid, and bottom nav preserve the source palette and radius language.
- Primary H5 action, navigation, food, and filter icons now use image2-generated 256x256 PNGs with matching circular bases.
- Mascot expressions and state illustrations use real PNG assets from the approved complete asset board.
- Bottom navigation uses icon+label tabs and sits in normal document flow so long recommendation content is never covered.

**Finding Fixed**
- [P1] The first H5 result capture had the bottom nav fixed over the recommendation actions on tall content. Updated the H5 shell and bottom nav CSS to use a flex/flow layout, then recaptured `h5-home-result.png`.
- [P1] Directly cropped chip/action icons carried source-board label text into the UI. Replaced primary H5 icons with image2-generated uniform 256x256 icon sheets, then recaptured `h5-image2-*.png`.
- [P1] API errors such as `{"detail":"Bad Request"}` could appear directly in UI. Added H5 error normalization for `detail`, stringified JSON, known English server messages, and endpoint-specific fallbacks.

**Residual Notes**
- [P3] H5 management pages are denser than the original mini-program home reference because they include account, place, store, import, and admin workflows. They still reuse the same tokens, avatar treatment, cards, chips, and button language.
- [P3] The H5 bottom nav is static rather than fixed. This differs from many native mobile shells, but it prevents content overlap during browser testing and keeps the visual system intact.
- [P3] Some mascot sticker crops from the complete board remain intentionally irregular because they are used as expressive illustrations, while UI controls use the normalized image2 icon set.

**Final Result**
- final result: passed
