# Winged connection redesign

The complete `#orb` control was redesigned: a newly generated, winged lightning artwork sits in a faceted metallic medallion, surrounded by a new segmented orbital ring and a pill-shaped action. It replaces the previous shield-and-lock icon, circular dial and label. The new asset is `frontend/dist/zeus-winged-connect.png`; the generated image was isolated from its checkerboard background and downscaled. Previously approved logo and artwork files were not changed.

The crest gently breathes and the outer ring rotates while connecting or reconnecting. Both animations respect reduced-motion and the existing effects setting. Connection states, enablement, accessible label and Connect/Disconnect calls still come from the existing controller; no VPN, bridge or backend code was changed. The connected and error visuals follow real bridge state, never a simulated success.

Changed files: `frontend/dist/index.html`, `frontend/dist/style.css`, `frontend/dist/zeus-winged-connect.png`, `tests/helios-home.test.cjs`, `tests/connection-control.test.cjs`, and this report. The screenshots in `/home/user/zeus-wing-review/` and `/home/user/zeus-wing-control/` are labeled synthetic fixtures and do not show a real VPN connection.

Both fixture suites exercise connection states and calls, keyboard, location/quota, RTL, screen bounds and reduced motion; CSS parsing, JavaScript syntax and Git whitespace checks were also performed. Earlier failures remain in `frontend-bridge.test.cjs` (direct-login expectation) and `frontend-redesign.test.cjs` (missing home chart); see earlier reports for base reproduction. No Windows/native build, real VPN, physical device or screen reader was tested.
