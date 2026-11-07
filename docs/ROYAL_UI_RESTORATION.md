# Royal UI restoration

This UI-only change preserves the existing winged connection control and restores the home live-traffic graph and keyboard dialog improvements described in the earlier redesign review. The home graph uses the same real session samples as the observatory, spaces them by receipt time, needs two samples, and clears after disconnect or counter reset. It does not invent traffic or historical data. The two SVG graphs now toggle the actual `hidden` attribute.

Confirmation, administrator and app-picker dialogs receive focus on entry, wrap Tab/Shift+Tab, close on Escape, and return focus to their opener. Confirmation initially focuses Cancel. Current navigation exposes `aria-current`. Existing scalable viewport, RTL, reduced-motion behavior, responsive metrics, backend bridge and connection handling remain in place.

The original royal-mark artwork remains unchanged. Small UI placements use a 324px derivative of it, generated with `convert frontend/dist/zeus-royal-mark.png -resize 324x324 -strip -define png:compression-level=9 frontend/dist/zeus-royal-mark-324.png`. The original is still packaged. The winged crest is unchanged.

## Checks and boundaries

- `tests/royal-restoration.test.cjs` exercises synthetic samples, timing, reset, all three dialogs, navigation and RTL using a separately installed `jsdom`; run with `NODE_PATH=/path/to/node_modules node tests/royal-restoration.test.cjs`.
- Existing synthetic browser suites cover connection states, bridge calls, crest rendering, keyboard, RTL, reduced motion and sampled viewport sizes. They require `playwright-core` and `@sparticuz/chromium`, installed separately, and an HTTP server for `frontend/dist`.
- These fixtures are not a real VPN connection or an actual native app. Native Windows/Wails, Android/iOS WebViews, real authentication, assistive technology, and release packaging require separate testing.
- The separate, uncommitted upstream migration and its migration-specific frontend test are not included in this UI change. The latter expects desktop direct login and network-compatibility controls that do not exist on the fork's current base; it is not evidence that this UI-only branch includes that migration.
