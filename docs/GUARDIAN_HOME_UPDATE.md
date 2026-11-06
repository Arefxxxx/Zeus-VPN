# Home connection redesign — Guardian

The start area now uses an original inline, angular Greek-temple guardian shield instead of the Helios/lightning control. The old approved lightning logo and other artwork remain unchanged. The connection stage, call-to-action, status presentation and matching route/quota and traffic surfaces were restyled together. The existing bridge calls and state controller remain in place: only backend events produce the connected state. Connecting and reconnecting use restrained frame feedback; reduced-motion disables it. Existing EN/FA text, keyboard activation and live status remain.

The quota ring now disappears immediately when quota becomes zero or unavailable, avoiding a stale arc during the previous fade-out. All displayed quota and location values remain derived from the existing backend/snapshot; no unlimited quota is inferred from an unknown limit.

Changed in this pass: `frontend/dist/index.html`, `frontend/dist/style.css`, `frontend/dist/app.js`, `tests/helios-home.test.cjs`, `tests/connection-control.test.cjs`, this report and the supersession note in `docs/HELIOS_HOME_REPORT.md`. The test files were updated to reflect the user's replacement of the previous Helios icon.

## Review

Screenshots at `/home/user/zeus-guardian-review/` include disconnected, connecting, connected, error and Persian mobile views. They are watermarked **SYNTHETIC FIXTURE · NO VPN** and show fixture values, not a real connection. The mock browser tests passed state transitions and Connect/Disconnect calls, Argentina selection, live/zero/unknown quota, missing IP, keyboard activation, RTL, 320/390/1440 viewport bounds and reduced motion. Node syntax, PostCSS parsing and `git diff --check` passed. Screenshots were reviewed in headless Chromium with software rendering, not on real devices.

The two previously reported failures remain: `tests/frontend-bridge.test.cjs` fails the direct-login visibility assertion; `tests/frontend-redesign.test.cjs` expects the missing home chart. The same failures were reproduced against the base revision (the chart check was reached after removing only the base viewport zoom restriction in the scratch copy). No native build, actual VPN, screen-reader, or device test was performed. Migration changes in the working tree are not part of the home redesign.
