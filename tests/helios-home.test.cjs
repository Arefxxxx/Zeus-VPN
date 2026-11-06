// Synthetic mock-bridge UI tests only. Serve frontend/dist at ZEUS_TEST_URL.
const { chromium } = require('playwright-core');
const binary = require('@sparticuz/chromium');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = process.env.ZEUS_SCREENSHOT_DIR || path.join(require('node:os').tmpdir(), 'zeus-helios-review');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: await binary.executablePath(), args: [...binary.args, '--disable-gpu', '--disable-gpu-compositing'], headless: true });
  const errors = [];
  async function setup(width, height, language, motion = 'no-preference') {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: motion });
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({language}) => {
      localStorage.setItem('zeus.locale', language);
      const events = {}, calls = [], unit = 1024 ** 3;
      const state = {platform:'windows',loggedIn:true,email:'fixture@example.invalid',account:'fixture@example.invalid',version:'fixture',status:'disconnected',elevated:true,settings:{mode:'tun',proxy_port:10820,tls_split:'auto',apps:[],country_code:'REC',city_code:''},features:{proxyMode:true},accounts:[{email:'fixture@example.invalid',active:true,quotaLimit:50*unit,quotaLeft:50*unit}]};
      const backend = { GetSnapshot:async()=>state, GetServers:async()=>[{code:'AR',name:'Argentina',cities:[{code:'BUE',name:'Buenos Aires'}]}], SetLocation:async(country,city)=>{calls.push(['location',country,city]);state.settings.country_code=country;state.settings.city_code=city;}, GetUsage:async()=>[],GetAppUsage:async()=>[],Connect:async()=>calls.push(['connect']),Disconnect:async()=>calls.push(['disconnect']) };
      window.go={main:{App:new Proxy(backend,{get:(obj,key)=>obj[key]||(async()=>null)})}};
      window.runtime={EventsOn:(name,fn)=>events[name]=fn,WindowMinimise(){},Quit(){}};
      window.fixture={events,state,calls,unit};
    }, {language});
    await page.goto(process.env.ZEUS_TEST_URL || 'http://127.0.0.1:8765/');
    await page.locator('#app-shell').waitFor({state:'visible'});
    await page.evaluate(() => { const badge=document.createElement('div');badge.textContent='SYNTHETIC FIXTURE · NO VPN';badge.style.cssText='position:fixed;z-index:99999;top:3px;left:50%;transform:translateX(-50%);background:#f6df83;color:#111;padding:3px 9px;font:700 10px sans-serif;border-radius:3px;pointer-events:none';document.body.appendChild(badge); });
    return page;
  }
  try {
    const en = await setup(1440,900,'en');
    await en.locator('#btn-location').click();
    await en.locator('#server-list [data-map-country="AR"]').click();
    await en.locator('[data-map-use-location]').click();
    await en.locator('#screen-home').waitFor({state:'visible'});
    assert.deepEqual(await en.evaluate(()=>window.fixture.calls), [['location','AR','']]);
    assert.equal(await en.locator('#loc-name').textContent(), 'Argentina · Any city');
    assert.equal(await en.locator('#home-route-mode').textContent(), 'Full VPN');
    assert.equal(await en.locator('#exit-ip').textContent(), '—');
    assert.equal(await en.locator('#quota-text').textContent(), '50 GB');
    assert.equal(await en.locator('#quota-limit').textContent(), '50 GB');
    assert.equal(await en.locator('#quota-used').textContent(), '0 B');
    assert.equal(await en.locator('#quota-meter').getAttribute('aria-valuenow'), '100');
    await en.waitForTimeout(3300);
    await en.screenshot({path:path.join(out,'home-disconnected-en.png')});
    const orb=en.locator('#orb'); await orb.focus(); await en.keyboard.press('Enter');
    assert.deepEqual(await en.evaluate(()=>window.fixture.calls), [['location','AR',''],['connect']]);
    for (const [status,label,disabled] of [['connecting','Connecting',true],['connected','Connected',false],['disconnecting','Disconnecting',true],['reconnecting','Reconnecting',false]]) {
      await en.evaluate(status=>window.fixture.events.state({...window.fixture.state,status,exitIp:''}),status);
      assert.equal(await orb.getAttribute('data-status'),status);
      assert.equal(await en.locator('#status-text').textContent(),label);
      assert.equal(await orb.isDisabled(),disabled);
      if (status==='connecting') {
        assert.equal(await en.locator('.guardian-frame').evaluate(el=>getComputedStyle(el).animationName), 'guardian-attention');
        await en.screenshot({path:path.join(out,'home-connecting-en.png')});
      }
      if (status==='connected') {
        assert.equal(await en.locator('#exit-ip').textContent(),'—');
        await en.evaluate(()=>window.fixture.events.stats({up:1,down:2,upRate:1,downRate:2,quotaLimit:50*window.fixture.unit,quotaLeft:25*window.fixture.unit}));
        assert.equal(await en.locator('#quota-text').textContent(),'25 GB');
        assert.equal(await en.locator('#quota-used').textContent(),'25 GB');
        assert.equal(await en.locator('#quota-meter').getAttribute('aria-valuenow'),'50');
        await en.waitForTimeout(800);
        await en.screenshot({path:path.join(out,'home-connected-en.png')});
        await en.evaluate(()=>window.fixture.events.stats({up:1,down:2,upRate:0,downRate:0,quotaLimit:50*window.fixture.unit,quotaLeft:0}));
        assert.equal(await en.locator('#quota-text').textContent(),'0 B');
        assert.equal(await en.locator('#quota-meter').getAttribute('aria-valuenow'),'0');
        assert.equal(await en.locator('#quota-ring').evaluate(el=>el.style.opacity),'0');
        await en.evaluate(()=>window.fixture.events.stats({up:1,down:2,upRate:0,downRate:0,quotaLimit:0,quotaLeft:0}));
        assert.equal(await en.locator('#quota-text').textContent(),'50 GB'); // snapshot fallback
      }
    }
    await en.evaluate(()=>window.fixture.events.state({...window.fixture.state,status:'disconnected',error:'Fixture error',accounts:[]}));
    assert.equal(await orb.getAttribute('data-status'),'error');
    assert.equal(await en.locator('#status-text').textContent(),'Error');
    assert.equal(await en.locator('#quota-text').textContent(),'Quota unavailable');
    assert.equal(await en.locator('#quota-meter').getAttribute('role'),'group');
    assert.equal(await en.locator('#quota-ring').evaluate(el=>getComputedStyle(el).opacity),'0');
    await en.screenshot({path:path.join(out,'home-error-en.png')});
    await en.evaluate(()=>window.fixture.events.state({...window.fixture.state,status:'disconnected',accounts:[{active:true,quotaLimit:50*window.fixture.unit}]}));
    assert.equal(await en.locator('#quota-text').textContent(),'Quota unavailable');
    const fa=await setup(390,844,'fa');
    await fa.evaluate(()=>{window.fixture.state.settings.country_code='AR';window.fixture.events.state(window.fixture.state)});
    assert.equal(await fa.evaluate(()=>document.documentElement.dir),'rtl');
    await fa.screenshot({path:path.join(out,'home-disconnected-fa-mobile.png')});
    await fa.locator('.home-side').scrollIntoViewIfNeeded();
    await fa.screenshot({path:path.join(out,'home-instruments-fa-mobile.png')});
    await fa.evaluate(()=>window.fixture.events.state({...window.fixture.state,status:'connected'}));
    await fa.locator('#orb').scrollIntoViewIfNeeded();
    await fa.screenshot({path:path.join(out,'home-connected-fa-mobile.png')});
    const reduced=await setup(320,700,'en','reduce');
    assert.equal(await reduced.locator('.guardian-frame').evaluate(el=>getComputedStyle(el).animationName),'none');
    assert.equal(await reduced.locator('.route-orbit').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
    assert.equal(await reduced.locator('#quota-ring').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    for (const p of [en,fa,reduced]) {
      const rect=await p.locator('#orb').boundingBox(); assert.ok(rect.x >= 0 && rect.x+rect.width <= p.viewportSize().width+1);
      const viewport = await p.evaluate(() => ({screen: innerWidth, document: document.documentElement.scrollWidth}));
      assert.ok(viewport.document <= viewport.screen + 1, `document overflow ${JSON.stringify(viewport)}`);
    }
    await en.evaluate(() => window.fixture.events.state({...window.fixture.state, status:'connected'}));
    const frameTimes = await en.evaluate(() => new Promise(resolve => {
      const times=[]; let start; function frame(now) { if (!start) start=now; times.push(now); if(now-start < 1500) requestAnimationFrame(frame); else resolve(times); } requestAnimationFrame(frame);
    }));
    console.log(`Animation smoke check: ${frameTimes.length} frames over ${(frameTimes.at(-1)-frameTimes[0]).toFixed(0)} ms in headless software Chromium`);
    assert.deepEqual(errors,[]);
    console.log('PASS synthetic location selection, all connection states, keyboard, live/zero/unknown quota, exit IP, RTL and reduced motion');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
