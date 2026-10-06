/*
  Ark Diamond app, phone version: sign-in screen, plus the small bridge the app talks to.

  The app was first built for Claude's artifact runtime, where it asks window.claude.use('db') for a document
  store. This file gives it the same interface, backed by the app's own Supabase project (one table,
  outreach_docs, that only the owner's login can read or change), and adds what a phone app needs:
  'device' (mail app links, the share sheet, sign out) and 'downloads' (save or share a file).
  It talks to Supabase's REST endpoints directly, so the app needs no other library.
*/
(() => {
  'use strict';
  const BUILD = '17ff1a7624';
  const CFG = window.OUTREACH_CONFIG || {};
  const BASE = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  const KEY = String(CFG.SUPABASE_KEY || '');
  const SESSION_KEY = 'ark-diamond-session';
  const CACHE_PREFIX = 'ark-diamond-cache:';
  const PREF_PREFIX = 'ark-diamond-pref:';
  const $ = (s) => document.querySelector(s);

  /* ---------------- small helpers ---------------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { /* nothing kept */ } },
    keys() { try { return Object.keys(localStorage); } catch { return []; } },
  };
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  function deepMerge(base, patch) {
    const out = { ...(base || {}) };
    for (const [k, v] of Object.entries(patch || {})) {
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = deepMerge(out[k], v);
      else out[k] = clone(v);
    }
    return out;
  }
  const newId = () => {
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(a, (x) => c[x % 36]).join('');
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const enc = encodeURIComponent;

  /* ---------------- session ---------------- */
  let session = null;
  try { session = JSON.parse(store.get(SESSION_KEY) || 'null'); } catch { session = null; }
  function setSession(s) {
    session = s && s.access_token ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: Number(s.expires_at) || Math.floor(Date.now() / 1000) + (Number(s.expires_in) || 3600), user: { id: (s.user || {}).id || '', email: (s.user || {}).email || '' } } : null;
    if (session) store.set(SESSION_KEY, JSON.stringify(session)); else store.del(SESSION_KEY);
  }
  function authError(status, data) {
    const msg = String((data && (data.error_description || data.msg || data.message || data.error)) || '');
    const code = String((data && (data.error_code || data.code)) || '');
    if (status === 429 || /rate limit|too many/i.test(msg)) return { code: 'rate_limited', message: msg };
    if (/invalid_credentials|invalid_grant/i.test(code + ' ' + (data && data.error)) || /invalid login credentials/i.test(msg)) return { code: 'bad_login', message: msg };
    if (/refresh token/i.test(msg) || /refresh_token/.test(code)) return { code: 'expired', message: msg };
    return { code: status >= 500 ? 'unavailable' : 'auth_failed', message: msg || 'Sign-in failed' };
  }
  async function authCall(path, body, bearer) {
    let res;
    const headers = { apikey: KEY, 'Content-Type': 'application/json' };
    if (bearer) headers.Authorization = 'Bearer ' + bearer;
    try { res = await fetch(BASE + '/auth/v1/' + path, { method: 'POST', headers, body: JSON.stringify(body || {}), cache: 'no-store' }); }
    catch { throw { code: 'unavailable', message: 'No connection' }; }
    const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!res.ok) throw authError(res.status, data);
    return data;
  }
  async function signIn(email, password) { setSession(await authCall('token?grant_type=password', { email, password })); }
  let refreshing = null;
  function refresh() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      // another tab may have refreshed already
      try { const s = JSON.parse(store.get(SESSION_KEY) || 'null'); if (s && session && s.access_token !== session.access_token && s.expires_at > Date.now() / 1000 + 60) { session = s; return; } } catch { /* use ours */ }
      if (!session || !session.refresh_token) throw { code: 'expired', message: 'Signed out' };
      try { setSession(await authCall('token?grant_type=refresh_token', { refresh_token: session.refresh_token })); }
      catch (e) { if (e.code !== 'unavailable') { setSession(null); signedOut(); } throw e; }
    })().finally(() => { refreshing = null; });
    return refreshing;
  }
  async function freshToken() { if (session && session.expires_at - 90 < Date.now() / 1000) await refresh(); }

  /* ---------------- REST ---------------- */
  function restError(status, data) {
    const code = String((data && data.code) || ''); const message = String((data && (data.message || data.msg || data.error)) || '');
    if (code === 'P0002') return { code: 'invalid_argument', message };
    if (code === '53400') return { code: 'quota_exceeded', message };
    if (status === 429) return { code: 'resource_exhausted', message };
    if (status === 401 || status === 403 || code === '42501') return { code: 'not_granted', message };
    if (status >= 500) return { code: 'unavailable', message };
    return { code: 'unknown', message: message || 'Request failed' };
  }
  async function rest(method, path, body, { anon = false, retried = false } = {}) {
    if (!anon) await freshToken();
    const headers = { apikey: KEY };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!anon && session) headers.Authorization = 'Bearer ' + session.access_token;
    let res;
    try { res = await fetch(BASE + '/rest/v1/' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' }); }
    catch { markOffline(true); throw { code: 'unavailable', message: 'No connection' }; }
    markOffline(false);
    if (res.status === 401 && !anon && !retried && session) { await refresh(); return rest(method, path, body, { anon, retried: true }); }
    const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) throw restError(res.status, data);
    return data;
  }
  const rpc = (fn, args, opts) => rest('POST', 'rpc/' + fn, args || {}, opts);

  /* ---------------- offline banner ---------------- */
  let offline = false;
  function markOffline(on) {
    if (offline === on) return;
    offline = on;
    const el = $('#offline-note'); if (el) el.hidden = !on || !signedIn;
    if (!on && signedIn) resync();
  }
  window.addEventListener('online', () => { if (signedIn) resync(); });

  /* ---------------- the document store the app expects ---------------- */
  const docs = new Map();      // collection -> Map(id -> record)
  const loaded = new Set();    // collections fetched at least once
  const loading = new Map();   // collection -> Promise
  const listSubs = new Map();  // collection -> Set of listeners
  const docSubs = new Map();   // 'collection/id' -> Set of listeners
  const inFlight = new Map();  // 'collection/id' -> writes not yet confirmed
  const dirty = new Set(); let flushTimer = 0;
  let cursor = '';             // newest updated_at seen from the database
  let signedIn = false;

  const mapFor = (coll) => { let m = docs.get(coll); if (!m) { m = new Map(); docs.set(coll, m); } return m; };
  function listSnap(coll) {
    const list = [...mapFor(coll).entries()].map(([id, d]) => ({ id, exists: true, data: () => clone(d) }));
    return { docs: list, size: list.length, empty: !list.length, forEach: (f) => list.forEach(f) };
  }
  function docSnap(coll, id) { const d = mapFor(coll).get(id); return { id, exists: d !== undefined, data: () => clone(d) }; }
  function changed(coll) { dirty.add(coll); if (!flushTimer) flushTimer = setTimeout(flush, 0); }
  function flush() {
    flushTimer = 0;
    const colls = [...dirty]; dirty.clear();
    for (const coll of colls) {
      if (!loaded.has(coll)) continue;
      const subs = listSubs.get(coll);
      if (subs && subs.size) { const snap = listSnap(coll); subs.forEach((s) => s.next(snap)); }
      for (const [key, set] of docSubs) {
        if (set.size && key.startsWith(coll + '/')) { const snap = docSnap(coll, key.slice(coll.length + 1)); set.forEach((s) => s.next(snap)); }
      }
    }
  }
  const bump = (ts) => { if (ts && ts > cursor) cursor = ts; };
  // the database gives microseconds, which some browsers will not parse
  const tsMs = (ts) => Date.parse(String(ts).replace(/(\.\d{3})\d+/, '$1')) || 0;
  // A copy of what was last loaded stays on the phone, so the app opens with a weak signal too.
  function saveCache(coll, rows) {
    const text = JSON.stringify(rows);
    if (text.length > 3e6) return;
    store.set(CACHE_PREFIX + coll, text);
  }
  function readCache(coll) { try { return JSON.parse(store.get(CACHE_PREFIX + coll) || 'null'); } catch { return null; } }
  function clearCache() { for (const k of store.keys()) if (k.startsWith(CACHE_PREFIX)) store.del(k); }

  async function fetchAll(coll) {
    const out = []; const page = 1000;
    for (let from = 0; ; from += page) {
      const rows = await rest('GET', `outreach_docs?select=id,data,updated_at&coll=eq.${enc(coll)}&order=id.asc&limit=${page}&offset=${from}`);
      out.push(...rows);
      if (rows.length < page) return out;
    }
  }
  function install(coll, rows) {
    const m = new Map();
    for (const r of rows) { m.set(r.id, r.data); bump(r.updated_at); }
    // writes still on their way keep their local version
    const old = docs.get(coll);
    if (old) for (const [key, n] of inFlight) if (n > 0 && key.startsWith(coll + '/')) { const id = key.slice(coll.length + 1); if (old.has(id)) m.set(id, old.get(id)); else m.delete(id); }
    docs.set(coll, m); loaded.add(coll); changed(coll);
  }
  function load(coll, force) {
    if (!force && loading.has(coll)) return loading.get(coll);
    const p = fetchAll(coll).then((rows) => { install(coll, rows); saveCache(coll, rows); }).catch((e) => {
      if (e && e.code === 'unavailable' && !loaded.has(coll)) { const rows = readCache(coll); if (rows) { install(coll, rows); return; } }
      throw e;
    });
    loading.set(coll, p);
    p.catch((e) => { loading.delete(coll); if (!loaded.has(coll)) { const subs = listSubs.get(coll); if (subs) subs.forEach((s) => s.error(e)); } });
    return p;
  }
  function listen(map, key, coll, next, error) {
    const sub = { next, error: error || (() => {}) };
    let set = map.get(key); if (!set) { set = new Set(); map.set(key, set); }
    set.add(sub);
    if (loaded.has(coll)) Promise.resolve().then(() => { if (set.has(sub)) sub.next(map === listSubs ? listSnap(coll) : docSnap(coll, key.slice(coll.length + 1))); });
    else load(coll).catch(() => {});
    return () => set.delete(sub);
  }
  async function write(coll, id, run, local) {
    const key = coll + '/' + id;
    inFlight.set(key, (inFlight.get(key) || 0) + 1);
    local(); changed(coll);
    try {
      await run();
    } catch (e) {
      load(coll, true).catch(() => {});   // put back what the database really has
      throw e;
    } finally {
      const n = (inFlight.get(key) || 1) - 1;
      if (n > 0) inFlight.set(key, n); else inFlight.delete(key);
    }
  }
  function docRef(coll, id) {
    return {
      id,
      set: (data) => write(coll, id, () => rpc('outreach_set', { p_coll: coll, p_id: id, p_data: data }), () => mapFor(coll).set(id, clone(data))),
      update: (patch) => {
        const m = mapFor(coll);
        if (loaded.has(coll) && !m.has(id)) return Promise.reject({ code: 'invalid_argument', message: 'missing document' });
        return write(coll, id, () => rpc('outreach_update', { p_coll: coll, p_id: id, p_patch: patch }), () => { if (m.has(id)) m.set(id, deepMerge(m.get(id), patch)); });
      },
      delete: () => write(coll, id, () => rest('DELETE', `outreach_docs?coll=eq.${enc(coll)}&id=eq.${enc(id)}`), () => mapFor(coll).delete(id)),
      onSnapshot: (next, error) => listen(docSubs, coll + '/' + id, coll, next, error),
    };
  }
  const dbApi = {
    collection: (coll) => ({ doc: (id) => docRef(coll, id || newId()), onSnapshot: (next, error) => listen(listSubs, coll, coll, next, error) }),
    doc: (p) => { const i = String(p).indexOf('/'); return docRef(String(p).slice(0, i), String(p).slice(i + 1)); },
  };

  // Changes from your other devices (and from Claude's background checks): a quick look every minute while
  // the app is open, and a full reload when you come back to it.
  let polling = false;
  async function poll() {
    if (!signedIn || polling || document.visibilityState === 'hidden' || !cursor) return;
    polling = true;
    try {
      // a little overlap, so a change saved while the last look was running is not missed
      const since = new Date(tsMs(cursor) - 120000).toISOString();
      const rows = await rest('GET', `outreach_docs?select=coll,id,data,updated_at&updated_at=gte.${enc(since)}&order=updated_at.asc&limit=1000`);
      for (const r of rows) {
        bump(r.updated_at);
        if (!loaded.has(r.coll) || inFlight.get(r.coll + '/' + r.id) > 0) continue;
        const m = mapFor(r.coll);
        if (JSON.stringify(m.get(r.id)) !== JSON.stringify(r.data)) { m.set(r.id, r.data); changed(r.coll); }
      }
    } catch { /* next time */ }
    finally { polling = false; }
  }
  function resync() { for (const coll of loaded) load(coll, true).catch(() => {}); }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!signedIn) return;
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
    if (Date.now() - hiddenAt > 60000) resync(); else poll();
  });
  setInterval(poll, 60000);

  /* ---------------- files: share sheet on a phone, download on a computer ---------------- */
  const typeOf = (name) => (/\.pdf$/i.test(name) ? 'application/pdf' : /\.csv$/i.test(name) ? 'text/csv' : /\.json$/i.test(name) ? 'application/json' : /\.html?$/i.test(name) ? 'text/html' : /\.svg$/i.test(name) ? 'image/svg+xml' : /\.png$/i.test(name) ? 'image/png' : 'text/plain');
  // phones and tablets get the share sheet (Save to Files, Mail, WhatsApp...); computers download the file
  const touch = () => { try { return matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && /iPhone|iPad|Android|Macintosh/.test(navigator.userAgent)); } catch { return false; } };
  function toFile(filename, data, mimeType) {
    const type = mimeType || (data instanceof Blob && data.type) || typeOf(filename || '');
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    return new File([blob], filename || 'file', { type });
  }
  function download(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = url; a.download = file.name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  // Must be called straight from a tap: phones only open the share sheet for one.
  function share({ filename, data, mimeType, title, text }, preferShare = true) {
    const file = toFile(filename, data, mimeType);
    if (preferShare && navigator.canShare && navigator.share) {
      let ok = false; try { ok = navigator.canShare({ files: [file] }); } catch { ok = false; }
      if (ok) {
        const payload = { files: [file] }; if (title) payload.title = title; if (text) payload.text = text;
        return navigator.share(payload).then(() => 'shared', (e) => {
          if (e && e.name === 'AbortError') throw { code: 'declined', message: 'Cancelled' };
          download(file); return 'saved';
        });
      }
    }
    download(file);
    return Promise.resolve('saved');
  }
  const downloads = {
    save({ filename, data, mimeType }) { return share({ filename, data, mimeType }, touch()).then(() => ({ ok: true })); },
  };

  /* ---------------- the phone bridge ---------------- */
  const pref = { get: (k) => store.get(PREF_PREFIX + k), set: (k, v) => store.set(PREF_PREFIX + k, v) };
  const plainAddress = (to) => (/^[^\s@<>"?&#,;]+@[^\s@<>"?&#,;]+$/.test(to) ? to : enc(to));
  const device = {
    standalone: true,
    account: () => (session && session.user && session.user.email) || '',
    mailApp: () => (pref.get('mailApp') === 'gmail' ? 'gmail' : 'mail'),
    setMailApp: (v) => { pref.set('mailApp', v === 'gmail' ? 'gmail' : 'mail'); },
    mailHref(to, subject, body) {
      const q = `subject=${enc(subject || '')}&body=${enc(String(body || '').replace(/\r?\n/g, '\r\n'))}`;
      if (device.mailApp() === 'gmail') return `googlegmail:///co?to=${plainAddress(to || '')}&${q}`;
      return `mailto:${plainAddress(to || '')}?${q}`;
    },
    share: (opts) => share(opts, true),
    signOut,
  };

  window.claude = { use: async (name) => (name === 'db' && signedIn ? dbApi : name === 'downloads' ? downloads : name === 'device' && signedIn ? device : null) };
  window.__arkBridge = { build: BUILD, poll, resync, session: () => session };

  /* ---------------- sign in ---------------- */
  const gate = $('#gate');
  const views = { login: $('#gate-login'), setup: $('#gate-setup'), offline: $('#gate-offline') };
  function showGate(view, note) {
    document.body.classList.remove('signed-in');
    $('#splash').hidden = true;
    gate.hidden = false;
    for (const [k, f] of Object.entries(views)) f.hidden = k !== view;
    if (view === 'setup') setupMode(note === 'reset' ? 'reset' : 'setup');
    const err = views[view] && views[view].querySelector('.gate-error');
    if (err) { err.textContent = note && note !== 'reset' ? note : ''; err.hidden = !(note && note !== 'reset'); }
    const first = views[view] && views[view].querySelector('input'); if (first && !('ontouchstart' in window)) setTimeout(() => first.focus(), 50);
  }
  function setupMode(mode) {
    const f = views.setup; f.dataset.mode = mode;
    f.querySelector('h1').textContent = mode === 'reset' ? 'Set a new password' : 'Set up your login';
    f.querySelector('.gate-intro').textContent = mode === 'reset'
      ? 'Enter the code Claude gave you, your email, and the new password you want.'
      : 'Enter the setup code Claude gave you, then choose the email and password you will sign in with.';
    f.querySelector('button[type="submit"]').textContent = mode === 'reset' ? 'Save new password' : 'Create login';
  }
  function showError(form, text) { const p = form.querySelector('.gate-error'); p.textContent = text; p.hidden = !text; }
  function busy(form, on) { const b = form.querySelector('button[type="submit"]'); b.disabled = on; b.setAttribute('aria-busy', on ? 'true' : 'false'); }
  const friendly = (e) => {
    const c = e && e.code;
    if (c === 'bad_login') return 'Wrong email or password.';
    if (c === 'unavailable') return 'No connection. Check the internet and try again.';
    if (c === 'rate_limited') return 'Too many tries. Wait a few minutes and try again.';
    return (e && e.message) || 'That did not work. Try again.';
  };
  const CLAIM_TEXT = {
    bad_code: 'That code is not right. Check it and try again.',
    closed: 'This code has already been used or has expired. Ask Claude for a new one.',
    bad_email: 'Enter a full email address.',
    weak_password: 'Use at least 10 characters for the password.',
    email_taken: 'That email belongs to another login. Use a different one.',
  };

  views.login.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.currentTarget; showError(f, ''); busy(f, true);
    try {
      await signIn(f.email.value.trim(), f.password.value);
      f.password.value = '';
      await afterSignIn();
    } catch (err) { setSession(null); showError(f, friendly(err)); }
    finally { busy(f, false); }
  });
  views.setup.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.currentTarget; showError(f, '');
    const email = f.email.value.trim(); const pw = f.password.value;
    if (pw.length < 10) { showError(f, CLAIM_TEXT.weak_password); return; }
    if (pw !== f.password2.value) { showError(f, 'The two passwords are not the same.'); return; }
    busy(f, true);
    try {
      const result = await rpc('outreach_claim', { p_code: f.code.value, p_email: email, p_password: pw }, { anon: true });
      if (result !== 'ok') throw { code: 'claim', message: CLAIM_TEXT[result] || 'Setup did not finish. Try again in a minute.' };
      await signIn(email, pw);
      f.password.value = ''; f.password2.value = ''; f.code.value = '';
      await afterSignIn();
    } catch (err) { showError(f, friendly(err)); }
    finally { busy(f, false); }
  });
  $('#gate-retry').addEventListener('click', () => boot());
  $('#to-reset').addEventListener('click', () => showGate('setup', 'reset'));
  $('#to-login').addEventListener('click', () => showGate('login'));

  async function signOut() {
    const token = session && session.access_token;
    setSession(null); clearCache();
    if (token) { try { await authCall('logout', {}, token); } catch { /* signed out here anyway */ } }
    location.hash = ''; location.reload();
  }
  function signedOut() {
    if (!signedIn) return;
    signedIn = false; clearCache();
    showGate('login', 'You were signed out. Sign in again.');
  }

  async function afterSignIn() {
    const owner = await rpc('outreach_is_owner');
    if (owner !== true) { setSession(null); throw { code: 'not_owner', message: 'This login is not the owner of this app.' }; }
    startApp();
  }

  let appLoaded = false;
  function startApp() {
    signedIn = true;
    gate.hidden = true; $('#splash').hidden = true;
    document.body.classList.add('signed-in');
    $('#offline-note').hidden = !offline;
    if (appLoaded) return;
    appLoaded = true;
    const s = document.createElement('script');
    s.src = 'app.js?v=' + BUILD;
    document.body.appendChild(s);
  }

  async function boot() {
    if (!BASE || !KEY) { showGate('offline'); $('#gate-offline h1').textContent = 'Almost ready'; $('#gate-offline .gate-intro').textContent = 'The app is not connected to its database yet. Claude is finishing the setup.'; return; }
    if (session) {
      try { await afterSignIn(); return; }
      catch (e) {
        if (e && e.code === 'unavailable') {
          // no signal: open with the copy saved on this phone
          if (readCache('businesses')) { offline = true; startApp(); return; }
          showGate('offline'); return;
        }
        setSession(null);
        if (e && e.code === 'not_owner') { showGate('login', e.message); return; }
      }
    }
    try {
      const st = await rpc('outreach_gate', {}, { anon: true });
      showGate(st === 'setup' ? 'setup' : 'login');
    } catch { showGate('offline'); }
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
  boot();
})();
