// Synthetic frontend-only regression checks; install jsdom separately and set NODE_PATH.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync('frontend/dist/index.html', 'utf8');
const app = fs.readFileSync('frontend/dist/app.js', 'utf8');
const wait = () => new Promise(resolve => setTimeout(resolve, 40));

(async () => {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, { url: 'https://app.example/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: console });
  const w = dom.window;
  w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const events = {}, calls = [];
  const state = { platform: 'windows', loggedIn: true, status: 'disconnected', elevated: false, settings: { mode: 'proxy', tls_split: 'auto', apps: [] }, features: { proxyMode: true, appFilter: true }, accounts: [] };
  const backend = { GetSnapshot: async () => state, GetServers: async () => [], GetUsage: async () => [], GetAppUsage: async () => [], GetApps: async () => [{ id: 'fixture', name: 'Fixture' }], SetMode: async mode => calls.push(['mode', mode]), ResetUsage: async () => calls.push(['reset']) };
  w.go = { main: { App: new Proxy(backend, { get: (obj, key) => obj[key] || (async () => null) }) } };
  w.runtime = { EventsOn: (name, fn) => { events[name] = fn; }, WindowMinimise() {}, Quit() {} };
  const $ = selector => w.document.querySelector(selector);
  const key = (key, shiftKey = false) => w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }));
  try {
    w.eval(app);
    await wait();
    assert.equal($('#orb .connect-crest').getAttribute('src'), 'zeus-winged-connect.png');
    assert.equal(w.document.querySelectorAll('img[src="zeus-royal-mark-324.png"]').length, 4);
    assert.ok(fs.existsSync('frontend/dist/zeus-royal-mark.png'), 'retain original artwork');
    assert.ok(fs.existsSync('frontend/dist/zeus-royal-mark-324.png'), 'include resized artwork');
    assert.ok(!html.includes('user-scalable=no'));
    assert.equal($('button.nav-link[data-screen="home"]').getAttribute('aria-current'), 'page');
    assert.equal($('#home-chart-empty').hidden, false);
    assert.equal($('#home-chart-line').hasAttribute('hidden'), true);
    events.state({ ...state, status: 'connected' });
    let now = 1000;
    w.Date.now = () => now;
    events.stats({ up: 10, down: 20, upRate: 10, downRate: 20 });
    assert.equal($('#home-chart-line').hasAttribute('hidden'), true);
    now = 2000; events.stats({ up: 20, down: 40, upRate: 20, downRate: 30 });
    now = 5000; events.stats({ up: 30, down: 60, upRate: 30, downRate: 40 });
    const path = $('#home-chart-line').getAttribute('d');
    assert.match(path, /^M0\.0 .*L180\.0 .*L720\.0 /, 'chart spacing follows receipt timestamps');
    assert.equal(path, $('#chart-line').getAttribute('d'));
    assert.equal($('#home-chart-line').hasAttribute('hidden'), false);
    assert.equal($('#chart-area').hasAttribute('hidden'), false);
    now = 6000; events.stats({ up: 1, down: 1, upRate: 1, downRate: 1 });
    assert.equal($('#home-chart-line').hasAttribute('hidden'), true, 'counter reset clears previous samples');
    now = 7000; events.stats({ up: 2, down: 2, upRate: 1, downRate: 1 });
    assert.equal($('#home-chart-line').hasAttribute('hidden'), false);
    events.state({ ...state, status: 'disconnected' });
    assert.equal($('#home-chart-line').hasAttribute('hidden'), true);
    assert.equal($('#chart-line').hasAttribute('hidden'), true);
    assert.equal($('#home-chart-empty').hidden, false);

    $('button.nav-link[data-screen="statistics"]').click(); await wait();
    assert.equal($('button.nav-link[data-screen="statistics"]').getAttribute('aria-current'), 'page');
    const reset = $('#btn-usage-reset'); reset.focus(); reset.click();
    assert.equal($('#modal-confirm').getAttribute('role'), 'dialog');
    assert.equal(w.document.activeElement.id, 'btn-confirm-no');
    key('Tab'); assert.equal(w.document.activeElement.id, 'btn-confirm-yes');
    key('Tab', true); assert.equal(w.document.activeElement.id, 'btn-confirm-no');
    key('Escape'); await wait();
    assert.equal($('#modal-confirm').hidden, true); assert.equal(w.document.activeElement, reset);
    assert.ok(!calls.some(call => call[0] === 'reset'));

    $('button.nav-link[data-screen="settings"]').click(); await wait();
    const apps = $('#btn-choose-apps'); apps.focus(); apps.click(); await wait();
    assert.equal(w.document.activeElement.id, 'app-search');
    key('Escape'); assert.equal($('#panel-apps').hidden, true); assert.equal(w.document.activeElement, apps);

    $('button.nav-link[data-screen="home"]').click();
    events.state({ ...state, status: 'connected' });
    const tun = $('#mode-switch button[data-mode="tun"]'); tun.focus(); tun.click(); await wait();
    assert.equal($('#modal-admin').getAttribute('role'), 'dialog');
    assert.equal(w.document.activeElement.id, 'btn-use-proxy');
    key('Tab'); assert.equal(w.document.activeElement.id, 'btn-elevate');
    key('Escape'); assert.equal($('#modal-admin').hidden, true); assert.equal(w.document.activeElement, tun);
    assert.deepEqual(calls.filter(call => call[0] === 'mode'), [['mode', 'tun']]);

    $('#set-language').value = 'fa'; $('#set-language').dispatchEvent(new w.Event('change'));
    assert.equal(w.document.documentElement.dir, 'rtl');
    assert.match($('#home-chart-caption').textContent, /مجموع/);
    assert.deepEqual(errors, []);
    process.stdout.write('PASS synthetic home chart, timestamps, reset, dialogs, navigation, RTL and winged crest\n');
  } finally { w.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
