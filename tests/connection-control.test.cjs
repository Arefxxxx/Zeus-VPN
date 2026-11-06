// Browser UI contract test: all bridge values are synthetic and do not connect a VPN.
// Serve frontend/dist at ZEUS_TEST_URL; dependencies are installed separately.
const { chromium } = require('playwright-core');
const binary = require('@sparticuz/chromium');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = process.env.ZEUS_SCREENSHOT_DIR || path.join(require('node:os').tmpdir(), 'zeus-control-review');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: await binary.executablePath(), args: [...binary.args, '--disable-gpu', '--disable-gpu-compositing'], headless: true });
  const errors = [];
  async function setup(width, height, locale) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({locale}) => {
      localStorage.setItem('zeus.locale', locale);
      localStorage.setItem('zeus.effects', 'on');
      const events = {}, calls = [];
      const state = { platform: 'windows', loggedIn: true, email: 'fixture@example.invalid', version: 'fixture', status: 'disconnected', settings: { mode: 'proxy', proxy_port: 10820, tls_split: 'auto', apps: [] }, features: { proxyMode: true }, accounts: [] };
      const backend = { GetSnapshot: async () => state, GetServers: async () => [], GetUsage: async () => [], GetAppUsage: async () => [], Connect: async () => calls.push('connect'), Disconnect: async () => calls.push('disconnect') };
      window.go = { main: { App: new Proxy(backend, { get: (obj, key) => obj[key] || (async () => null) }) } };
      window.runtime = { EventsOn: (name, fn) => { events[name] = fn; }, WindowMinimise() {}, Quit() {} };
      window.fixture = { events, state, calls };
    }, { locale });
    await page.goto(process.env.ZEUS_TEST_URL || 'http://127.0.0.1:8765/');
    await page.locator('#app-shell').waitFor({state:'visible'});
    await page.evaluate(() => { const badge=document.createElement('div'); badge.textContent='SYNTHETIC FIXTURE · NO VPN'; badge.style.cssText='position:fixed;z-index:99999;top:3px;left:50%;transform:translateX(-50%);background:#f6df83;color:#111;padding:3px 9px;font:700 10px sans-serif;border-radius:3px;pointer-events:none';document.body.appendChild(badge); });
    return page;
  }
  try {
    const page = await setup(1440, 900, 'en');
    const button = page.locator('#orb');
    const emit = async (status, error = '') => page.evaluate(({status,error}) => window.fixture.events.state({...window.fixture.state, status, error}), {status,error});
    assert.equal(await button.getAttribute('data-status'), 'disconnected');
    await page.screenshot({path: path.join(out, 'disconnected-desktop.png')});
    await button.focus();
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => window.fixture.calls), ['connect']);
    for (const [status, label, disabled] of [['connecting','Connecting',true], ['connected','Connected',false], ['disconnecting','Disconnecting',true], ['reconnecting','Reconnecting',false]]) {
      await emit(status);
      assert.equal(await button.getAttribute('data-status'), status);
      assert.equal(await page.locator('#status-text').textContent(), label);
      assert.equal(await button.isDisabled(), disabled);
      assert.equal(await button.locator('.guardian-frame').evaluate(el => getComputedStyle(el).animationName), (status === 'connecting' || status === 'reconnecting') ? 'guardian-attention' : 'none');
      if (status === 'reconnecting') {
        await button.click();
        assert.deepEqual(await page.evaluate(() => window.fixture.calls), ['connect', 'disconnect', 'disconnect']);
      }
      if (status === 'connected') {
        await page.mouse.move(20, 20);
        await page.screenshot({path: path.join(out, 'connected-desktop.png')});
        await button.click();
        assert.deepEqual(await page.evaluate(() => window.fixture.calls), ['connect', 'disconnect']);
      }
    }
    await emit('disconnected', 'Synthetic connection failure');
    assert.equal(await button.getAttribute('data-status'), 'error');
    assert.equal(await page.locator('#status-text').textContent(), 'Error');
    assert.equal(await page.locator('#status-sub').textContent(), 'Synthetic connection failure');
    await page.screenshot({path: path.join(out, 'error-desktop.png')});
    assert.equal(await button.locator('.guardian-crest').count(), 1);
    assert.equal(await button.locator('.guardian-frame').evaluate(el => getComputedStyle(el).animationName), 'none'); // error is restrained
    const fa = await setup(390, 844, 'fa');
    await fa.screenshot({path: path.join(out, 'disconnected-mobile-fa.png')});
    assert.equal(await fa.evaluate(() => document.documentElement.dir), 'rtl');
    await fa.evaluate(() => window.fixture.events.state({...window.fixture.state, status:'connected'}));
    await fa.screenshot({path: path.join(out, 'connected-mobile-fa.png')});
    const narrow = await setup(320, 700, 'en');
    for (const p of [page, fa, narrow]) {
      const rect = await p.locator('#orb').boundingBox();
      assert.ok(rect.x >= 0 && rect.x + rect.width <= p.viewportSize().width + 1, 'control fits viewport');
    }
    assert.deepEqual(errors, []);
    console.log('PASS fixture states, bridge actions, guardian control, RTL, desktop and mobile screenshots');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
