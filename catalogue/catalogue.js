/* Ark Diamond online catalogue. Opened from a shop's own link (#t=<token>, and &p=1 for the price list).
   It reads the designs from the app's link service and tells it which designs the shop opened, nothing else. */
(() => {
  'use strict';
  const FN = 'https://uhfpoduakpsagoecszpt.supabase.co/functions/v1/open';
  const CATS = { ring: 'Rings', earrings: 'Earrings', pendant: 'Pendants', necklace: 'Necklaces', bracelet: 'Bracelets', other: 'Other pieces' };
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const token = (hash.get('t') || '').replace(/[^A-Za-z0-9]/g, '');
  const wantPrices = hash.get('p') === '1';
  const $ = (id) => document.getElementById(id);
  let data = null; let cat = 'all';

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const money = (n, cur) => { if (!n) return ''; const d = Math.round(n * 100) % 100 ? 2 : 0; return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d }).format(n); };
  const img = (id) => `${FN}/i/${token}/${encodeURIComponent(id)}`;
  const day = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const beacon = (path) => { try { if (navigator.sendBeacon) navigator.sendBeacon(`${FN}/${path}`); else fetch(`${FN}/${path}`, { method: 'POST', keepalive: true, mode: 'no-cors' }); } catch { /* not needed to show the page */ } };

  // what a shop sends when it taps a contact button: the company's WhatsApp and email, with the message written
  function hello(extra) { const shop = data.shop && data.shop.name; return `Hello${data.company.name ? ` ${data.company.name}` : ''}, ${shop ? `this is ${shop}. ` : ''}${extra}`; }
  function askButtons(text, subject, onAsk) {
    const co = data.company; const out = [];
    if (digits(co.whatsapp)) out.push(h('a', { class: 'btn wa', href: `https://wa.me/${digits(co.whatsapp)}?text=${encodeURIComponent(text)}`, target: '_blank', rel: 'noopener', onclick: onAsk }, 'Message on WhatsApp'));
    if (co.email) out.push(h('a', { class: 'btn mail', href: `mailto:${co.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, onclick: onAsk }, 'Email us'));
    return out;
  }

  function photoBox(p, label, full) {
    const box = h('div', { class: 'ph' });
    if (p) box.append(h('img', { src: img(full ? p.id : p.thumb || p.id), alt: label, loading: full ? 'eager' : 'lazy', decoding: 'async' }));
    else box.append(h('span', { class: 'none', text: 'Photo to follow' }));
    return box;
  }
  const label = (d) => `${d.code}${d.desc ? `, ${d.desc}` : ''}`;

  function card(d) {
    const priceRow = data.prices && d.price ? [h('span', { class: 'price', text: money(d.price, data.currency) }), d.shop ? h('span', { class: 'shopprice', text: `Shop price about ${money(d.shop, 'GBP')}` }) : null] : [];
    return h('button', { type: 'button', class: 'card', 'aria-label': `${label(d)}. Open`, onclick: () => openDesign(d) },
      photoBox((d.photos || [])[0], label(d), false),
      h('span', { class: 'card-in' }, h('span', { class: 'code', text: d.code }), d.desc ? h('span', { class: 'desc', text: d.desc }) : null, ...priceRow));
  }

  function renderGrid() {
    const grid = $('grid'); grid.replaceChildren();
    const list = data.designs.filter((d) => cat === 'all' || (d.category || 'other') === cat);
    if (!data.designs.length) { grid.append(h('p', { class: 'empty', text: 'The catalogue is being updated. Please message us and we will send you our latest designs.' })); return; }
    list.forEach((d) => grid.append(card(d)));
    const cats = [...new Set(data.designs.map((d) => d.category || 'other'))];
    const nav = $('cats'); nav.replaceChildren();
    if (cats.length > 1) {
      nav.hidden = false;
      const chip = (k, text) => h('button', { type: 'button', class: 'cat', 'aria-pressed': String(cat === k), onclick: () => { cat = k; renderGrid(); } }, text);
      nav.append(chip('all', `All ${data.designs.length}`), ...cats.map((k) => chip(k, `${CATS[k] || CATS.other} ${data.designs.filter((d) => (d.category || 'other') === k).length}`)));
    }
  }

  function openDesign(d) {
    const sheet = $('sheet');
    $('sheet-title').textContent = d.code; $('sheet-desc').textContent = d.desc || '';
    const shots = $('sheet-shots'); shots.replaceChildren(...((d.photos || []).length ? d.photos.map((p, i) => photoBox(p, `${label(d)}, photo ${i + 1}`, true)) : [photoBox(null, label(d), true)]));
    const facts = $('sheet-facts'); facts.replaceChildren();
    const fact = (k, v) => { if (v) facts.append(h('dt', { text: k }), h('dd', { text: v })); };
    fact('Metal', d.metal); fact('Metal weight', d.weight ? `${d.weight} g` : ''); fact('Diamonds', d.ct ? `${d.ct} ct laboratory-grown` : ''); fact('Details', d.note);
    const pr = $('sheet-price'); pr.replaceChildren();
    if (data.prices && d.price) {
      pr.append(h('p', { class: 'price', text: `${money(d.price, data.currency)} wholesale` }), h('p', { class: 'count', text: 'Per piece, excluding VAT and delivery.' }));
      if (d.shop) pr.append(h('p', { class: 'shopprice', text: `Suggested UK shop price about ${money(d.shop, 'GBP')} including VAT` }));
    }
    const ask = $('sheet-ask'); ask.replaceChildren(...askButtons(hello(data.prices ? `I'm interested in ${d.code} from your price list.` : `Could you send me the price of ${d.code} from your catalogue?`), `${d.code} from your ${data.prices ? 'price list' : 'catalogue'}`));
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    if (data.shop) beacon(`v/${token}/${encodeURIComponent(d.id)}`);
  }

  function renderKit() {
    const k = data.kit; const box = $('kit'); if (!k || !k.n) { box.hidden = true; return; }
    const pieces = k.ids.map((id) => data.designs.find((d) => d.id === id)).filter(Boolean);
    const price = k.price ? money(k.price, k.currency || data.currency) : '';
    const asked = () => { if (data.shop) beacon(`k/${token}`); };
    box.replaceChildren(
      h('div', null,
        h('h2', { text: 'See the quality first: our sample kit' }),
        h('p', { text: `${k.n} ${k.n === 1 ? 'piece' : 'pieces'} from this catalogue${price ? `, for ${price}` : ''}${k.credit && price ? ', taken off your first order' : ''}.` }),
        price ? h('p', { class: 'kit-price', text: price }) : null,
        h('div', { class: 'row' }, ...askButtons(hello("We'd like your sample kit."), 'Your sample kit', asked).map((a) => { a.classList.remove('wa', 'mail'); a.classList.add('light'); return a; }))),
      h('div', { class: 'kit-shots' }, ...pieces.slice(0, 6).map((d) => photoBox((d.photos || [])[0], label(d), false))));
    box.hidden = false;
  }

  function renderContact() {
    const co = data.company; const box = $('contact');
    const buttons = askButtons(hello(data.prices ? "I'm looking at your price list." : "I'm looking at your catalogue."), data.prices ? 'Your price list' : 'Your catalogue');
    if (!buttons.length) { box.hidden = true; return; }
    box.replaceChildren(h('h2', { text: data.prices ? 'Questions or an order?' : 'Prices, samples or an order?' }), h('p', { text: `Message ${co.name || 'us'} with any question, or to order.` }), h('div', { class: 'row' }, ...buttons), co.address ? h('p', { class: 'addr', text: co.address }) : null);
    box.hidden = false;
  }

  function render() {
    const co = data.company || {}; const name = co.name || 'Catalogue';
    document.title = `${name} ${data.prices ? 'price list' : 'catalogue'}`;
    $('word').textContent = name; $('kind').textContent = data.prices ? 'Price list' : 'Catalogue';
    if (data.shop && data.shop.name) { $('for').textContent = `Prepared for ${data.shop.name}`; $('for').hidden = false; }
    const n = data.designs.length;
    const metals = data.designs.map((d) => String(d.metal || '').toLowerCase()); const silver = metals.some((m) => m.includes('silver')), gold = metals.some((m) => m.includes('gold'));
    const inMetal = silver && gold ? ' in silver and gold' : silver ? ' in silver' : gold ? ' in gold' : '';
    $('lede').textContent = `${n} ${n === 1 ? 'design' : 'designs'}${inMetal}, set with laboratory-grown diamonds and made in India.${data.prices ? ` Wholesale prices in ${data.currency === 'GBP' ? 'pounds' : data.currency}.` : ' Tap a design to see it larger.'}`;
    const note = $('note'); const r = data.retail;
    note.textContent = data.prices
      ? `Wholesale prices per piece, excluding VAT and delivery${data.ratesAt ? `, at our rates of ${day(data.ratesAt)}` : ''}.${r && r.markup ? ` Suggested shop prices use a ${r.markup}× mark-up plus ${r.vat}% VAT; your own prices are up to you.` : ''}`
      : 'For prices, tap a design and message us, or use the buttons below.';
    note.hidden = false;
    renderGrid(); renderKit(); renderContact();
    $('foot').replaceChildren(h('p', { text: [co.name, co.address].filter(Boolean).join(', ') }), data.publishedAt ? h('p', { text: `Catalogue of ${day(data.publishedAt)}.` }) : null);
  }

  function problem(msg, retry) {
    $('lede').textContent = msg;
    $('grid').replaceChildren(retry ? h('button', { type: 'button', class: 'btn line', onclick: () => { $('lede').textContent = 'Opening the catalogue…'; load(); } }, 'Try again') : '');
  }

  async function load() {
    if (!token) { problem('This link is not complete. Please ask us for your catalogue link again.'); return; }
    try {
      const r = await fetch(`${FN}/d/${token}${wantPrices ? '?p=1' : ''}`, { credentials: 'omit', cache: 'no-store' });
      const body = await r.json().catch(() => ({}));
      if (r.status === 404) { problem(body.error === 'not_published' ? 'The catalogue is being updated. Please try again in a little while.' : 'This link is no longer active. Please ask us for a new one.'); return; }
      if (!r.ok) throw new Error(String(r.status));
      data = body; data.designs = Array.isArray(data.designs) ? data.designs : []; data.company = data.company || {};
      render();
    } catch { problem("The catalogue didn't open. Check your connection and try again.", true); }
  }

  $('sheet-close').addEventListener('click', () => $('sheet').close());
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet').close(); });
  load();
})();
