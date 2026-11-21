/* Ark Diamond online catalogue. Opened from a shop's own link (#t=<token>, and &p=1 for the price list).
   It reads the designs from the app's link service, tells it which designs the shop opened, and sends the
   shop's quote request; nothing else. In English or French: the shop's campaign language decides, or on a link
   without a shop &l=fr or &l=en (the French website adds it), else the visitor's browser; the button in the bar switches. */
(() => {
  'use strict';
  const FN = 'https://uhfpoduakpsagoecszpt.supabase.co/functions/v1/open';
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const token = (hash.get('t') || '').replace(/[^A-Za-z0-9]/g, '');
  const wantPrices = hash.get('p') === '1';
  const askLang = ['fr', 'en'].includes(hash.get('l')) ? hash.get('l') : '';
  const $ = (id) => document.getElementById(id);
  let data = null; let cat = 'all'; let lang = ''; let open = null;

  const T = {
    en: {
      title: 'Laboratory-grown diamond jewellery', opening: 'Opening the catalogue…', catalogue: 'Catalogue', priceList: 'Price list', other: 'Français', otherLabel: 'Lire en français',
      prepared: 'Prepared for {shop}', all: 'All {n}', photoLater: 'Photo to follow', openIt: '{label}. Open',
      cats: { ring: 'Rings', earrings: 'Earrings', pendant: 'Pendants', necklace: 'Necklaces', bracelet: 'Bracelets', other: 'Other pieces' },
      design: (n) => (n === 1 ? 'design' : 'designs'), piece: (n) => (n === 1 ? 'piece' : 'pieces'),
      inBoth: ' in silver and gold', inSilver: ' in silver', inGold: ' in gold',
      lede: '{n} {designs}{metal}, set with laboratory-grown diamonds and made in India.', ledePrices: ' Wholesale prices in {cur}.', ledeTap: ' Tap a design to see it larger and add it to a quote request.',
      cur: { GBP: 'pounds', USD: 'US dollars', EUR: 'euros', AED: 'dirhams' },
      notePrices: 'Wholesale prices per piece, excluding VAT and delivery{rates}.', noteRates: ', at our rates of {date}', noteRetail: ' Suggested shop prices use a {m}× mark-up plus {v}% VAT; your own prices are up to you.',
      noteAsk: 'Tap a design, choose a quantity and add it to your request: we reply with prices and delivery time.',
      empty: 'The catalogue is being updated. Please message us and we will send you our latest designs.',
      shopAbout: 'Shop price about {p}', facts: { metal: 'Metal', weight: 'Metal weight', stones: 'Diamonds', details: 'Details' }, stonesValue: '{ct} ct laboratory-grown',
      wholesale: '{p} wholesale', perPiece: 'Per piece, excluding VAT and delivery.', shopSuggested: 'Suggested UK shop price about {p} including VAT',
      wa: 'Message on WhatsApp', mail: 'Email us', hello: 'Hello{co}, {shop}{extra}', thisIs: 'this is {shop}. ',
      askPrice: "I'm interested in {code} from your price list.", askCat: 'Could you send me the price of {code} from your catalogue?', subjPrice: '{code} from your price list', subjCat: '{code} from your catalogue',
      kitTitle: 'See the quality first: our sample kit', kitText: '{n} {pieces} from this catalogue{price}{credit}.', kitFor: ', for {p}', kitCredit: ', taken off your first order', kitAsk: "We'd like your sample kit.", kitSubj: 'Your sample kit',
      contactPrices: 'Questions or an order?', contactCat: 'Prices, samples or an order?', contactText: 'Message {co} with any question, or to order.', helloPrices: "I'm looking at your price list.", helloCat: "I'm looking at your catalogue.", us: 'us',
      published: 'Catalogue of {date}.', incomplete: 'This link is not complete. Please ask us for your catalogue link again.', updating: 'The catalogue is being updated. Please try again in a little while.',
      inactive: 'This link is no longer active. Please ask us for a new one.', failed: "The catalogue didn't open. Check your connection and try again.", retry: 'Try again', close: 'Close',
      add: 'Add to my request', update: 'Update my request', inReq: 'In your request: {n}', qty: 'Quantity', metal: 'Metal', asShown: 'As shown',
      metals: { silver925: '925 sterling silver', gold9: '9K gold', gold10: '10K gold', gold14: '14K gold', gold18: '18K gold', gold22: '22K gold' },
      bar: 'Your request: {d} {designs}, {p} {pieces}', review: 'Review and send', reqTitle: 'Ask for a quote', reqIntro: "Check the quantities and send. We'll reply with prices and the delivery time.",
      remove: 'Remove', noteL: 'A note for us (optional)', noteP: 'Ring sizes, finish, when you need them', shop: 'Shop name', name: 'Your name', email: 'Email', country: 'Country', city: 'City (optional)', phone: 'Phone (optional)',
      send: 'Send the request', sending: 'Sending…', sent: 'Thank you. We have your request and will reply with your quote.', fill: 'Fill in: {f}.', badEmail: 'Check the email address.',
      fail: "The request didn't go through. Try again in a moment.", tooMany: 'Too many requests from this link today. Please message us instead.', emptyReq: 'Your request is empty: add a design first.',
    },
    fr: {
      title: 'Bijoux en diamants créés en laboratoire', opening: 'Ouverture du catalogue…', catalogue: 'Catalogue', priceList: 'Liste de prix', other: 'English', otherLabel: 'Read in English',
      prepared: 'Préparé pour {shop}', all: 'Tous ({n})', photoLater: 'Photo à venir', openIt: '{label}. Ouvrir',
      cats: { ring: 'Bagues', earrings: "Boucles d'oreilles", pendant: 'Pendentifs', necklace: 'Colliers', bracelet: 'Bracelets', other: 'Autres pièces' },
      design: (n) => (n === 1 ? 'modèle' : 'modèles'), piece: (n) => (n === 1 ? 'pièce' : 'pièces'),
      inBoth: ' en argent et en or', inSilver: ' en argent', inGold: ' en or',
      lede: '{n} {designs}{metal}, sertis de diamants créés en laboratoire et fabriqués en Inde.', ledePrices: ' Prix de gros en {cur}.', ledeTap: " Touchez un modèle pour l'agrandir et l'ajouter à une demande de soumission.",
      cur: { GBP: 'livres sterling', USD: 'dollars américains', EUR: 'euros', AED: 'dirhams' },
      notePrices: 'Prix de gros à la pièce, hors taxes et livraison{rates}.', noteRates: ', selon nos taux du {date}', noteRetail: ' Les prix suggérés en magasin comprennent une majoration de {m} fois et {v} % de TVA ; vos prix restent votre choix.',
      noteAsk: 'Touchez un modèle, choisissez la quantité et ajoutez-le à votre demande : nous répondrons avec les prix et le délai de livraison.',
      empty: 'Le catalogue est en cours de mise à jour. Écrivez-nous et nous vous enverrons nos derniers modèles.',
      shopAbout: 'Prix en magasin environ {p}', facts: { metal: 'Métal', weight: 'Poids du métal', stones: 'Diamants', details: 'Détails' }, stonesValue: '{ct} ct, créés en laboratoire',
      wholesale: 'Prix de gros : {p}', perPiece: 'À la pièce, hors taxes et livraison.', shopSuggested: 'Prix suggéré en magasin au Royaume-Uni : environ {p}, TVA comprise',
      wa: 'Écrire sur WhatsApp', mail: 'Nous écrire par courriel', hello: 'Bonjour{co}, {shop}{extra}', thisIs: 'ici {shop}. ',
      askPrice: 'Le modèle {code} de votre liste de prix m’intéresse.', askCat: 'Pourriez-vous m’envoyer le prix du modèle {code} de votre catalogue ?', subjPrice: '{code}, de votre liste de prix', subjCat: '{code}, de votre catalogue',
      kitTitle: "Voyez la qualité d'abord : notre trousse d'échantillons", kitText: '{n} {pieces} de ce catalogue{price}{credit}.', kitFor: ', pour {p}', kitCredit: ', déduites de votre première commande', kitAsk: "Nous aimerions recevoir votre trousse d'échantillons.", kitSubj: "Votre trousse d'échantillons",
      contactPrices: 'Des questions ou une commande ?', contactCat: 'Prix, échantillons ou commande ?', contactText: 'Écrivez à {co} pour toute question ou pour commander.', helloPrices: 'Je consulte votre liste de prix.', helloCat: 'Je consulte votre catalogue.', us: 'nous',
      published: 'Catalogue du {date}.', incomplete: 'Ce lien est incomplet. Demandez-nous de nouveau le lien de votre catalogue.', updating: 'Le catalogue est en cours de mise à jour. Réessayez dans un moment.',
      inactive: "Ce lien n'est plus actif. Demandez-nous-en un nouveau.", failed: "Le catalogue ne s'est pas ouvert. Vérifiez votre connexion et réessayez.", retry: 'Réessayer', close: 'Fermer',
      add: 'Ajouter à ma demande', update: 'Mettre à jour ma demande', inReq: 'Dans votre demande : {n}', qty: 'Quantité', metal: 'Métal', asShown: 'Comme sur la photo',
      metals: { silver925: 'argent sterling 925', gold9: 'or 9 carats', gold10: 'or 10 carats', gold14: 'or 14 carats', gold18: 'or 18 carats', gold22: 'or 22 carats' },
      bar: 'Votre demande : {d} {designs}, {p} {pieces}', review: 'Vérifier et envoyer', reqTitle: 'Demander une soumission', reqIntro: 'Vérifiez les quantités et envoyez. Nous vous répondrons avec les prix et le délai de livraison.',
      remove: 'Retirer', noteL: 'Un mot pour nous (facultatif)', noteP: 'Tailles de bague, finition, date souhaitée', shop: 'Nom du magasin', name: 'Votre nom', email: 'Courriel', country: 'Pays', city: 'Ville (facultatif)', phone: 'Téléphone (facultatif)',
      send: 'Envoyer la demande', sending: 'Envoi…', sent: 'Merci. Nous avons bien reçu votre demande et vous répondrons avec votre soumission.', fill: 'Remplissez : {f}.', badEmail: "Vérifiez l'adresse courriel.",
      fail: "La demande n'a pas été envoyée. Réessayez dans un moment.", tooMany: "Trop de demandes à partir de ce lien aujourd'hui. Écrivez-nous plutôt.", emptyReq: "Votre demande est vide : ajoutez d'abord un modèle.",
    },
  };
  const t = (k, vars) => { let s = T[lang || 'en'][k]; if (typeof s !== 'string') return s; for (const [a, b] of Object.entries(vars || {})) s = s.split(`{${a}}`).join(String(b)); return s; };
  const locale = () => (lang === 'fr' ? 'fr-CA' : 'en-GB');
  // metal names the app writes, so the page can show them in French and keep the metal on a request line
  const METAL_KEY = { '925 sterling silver': 'silver925', '9k gold': 'gold9', '10k gold': 'gold10', '14k gold': 'gold14', '18k gold': 'gold18', '22k gold': 'gold22' };
  const metalKey = (d) => d.mk || METAL_KEY[String(d.metal || '').toLowerCase()] || '';
  const metalName = (d) => { const k = metalKey(d); return k ? T[lang || 'en'].metals[k] : d.metal || ''; };

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const money = (n, cur) => { if (!n) return ''; const d = Math.round(n * 100) % 100 ? 2 : 0; return new Intl.NumberFormat(locale(), { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d }).format(n); };
  const num = (n) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(Number(n) || 0);
  const img = (id) => `${FN}/i/${token}/${encodeURIComponent(id)}`;
  const day = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }); };
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const beacon = (path) => { try { if (navigator.sendBeacon) navigator.sendBeacon(`${FN}/${path}`); else fetch(`${FN}/${path}`, { method: 'POST', keepalive: true, mode: 'no-cors' }); } catch { /* not needed to show the page */ } };
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fine without */ } } };

  // the request: design id -> { qty, metal }, kept on this device until it is sent
  const REQ_KEY = `ark-request:${token}`;
  let req = new Map(Object.entries(store.get(REQ_KEY) || {}));
  const saveReq = () => store.set(REQ_KEY, Object.fromEntries(req));
  const reqDesigns = () => [...req.keys()].map((id) => data.designs.find((d) => d.id === id)).filter(Boolean);

  // what a shop sends when it taps a contact button: the company's WhatsApp and email, with the message written
  function hello(extra) { const shop = data.shop && data.shop.name; return t('hello', { co: data.company.name ? ` ${data.company.name}` : '', shop: shop ? t('thisIs', { shop }) : '', extra }); }
  function askButtons(text, subject, onAsk) {
    const co = data.company; const out = [];
    if (digits(co.whatsapp)) out.push(h('a', { class: 'btn wa', href: `https://wa.me/${digits(co.whatsapp)}?text=${encodeURIComponent(text)}`, target: '_blank', rel: 'noopener', onclick: onAsk }, t('wa')));
    if (co.email) out.push(h('a', { class: 'btn mail', href: `mailto:${co.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, onclick: onAsk }, t('mail')));
    return out;
  }

  function photoBox(p, label, full) {
    const box = h('div', { class: 'ph' });
    if (p) box.append(h('img', { src: img(full ? p.id : p.thumb || p.id), alt: label, loading: full ? 'eager' : 'lazy', decoding: 'async' }));
    else box.append(h('span', { class: 'none', text: t('photoLater') }));
    return box;
  }
  // in English the app's own description; in French one written from the same facts
  function descOf(d) {
    if (lang !== 'fr') return d.desc || '';
    const parts = [metalName(d)]; if (Number(d.weight)) parts.push(`${num(d.weight)} g`); if (Number(d.ct)) parts.push(`${num(d.ct)} ct de diamants créés en laboratoire`);
    const s = parts.filter(Boolean).join(', '); return s ? s[0].toUpperCase() + s.slice(1) : '';
  }
  const label = (d) => `${d.code}${descOf(d) ? `, ${descOf(d)}` : ''}`;

  function card(d) {
    const priceRow = data.prices && d.price ? [h('span', { class: 'price', text: money(d.price, data.currency) }), d.shop ? h('span', { class: 'shopprice', text: t('shopAbout', { p: money(d.shop, 'GBP') }) }) : null] : [];
    const r = req.get(d.id);
    return h('button', { type: 'button', class: 'card', 'aria-label': t('openIt', { label: label(d) }), onclick: () => openDesign(d) },
      photoBox((d.photos || [])[0], label(d), false),
      h('span', { class: 'card-in' }, h('span', { class: 'code', text: d.code }), descOf(d) ? h('span', { class: 'desc', text: descOf(d) }) : null, ...priceRow, r ? h('span', { class: 'inreq', text: t('inReq', { n: r.qty }) }) : null));
  }

  function renderGrid() {
    const grid = $('grid'); grid.replaceChildren();
    const list = data.designs.filter((d) => cat === 'all' || (d.category || 'other') === cat);
    if (!data.designs.length) { grid.append(h('p', { class: 'empty', text: t('empty') })); return; }
    list.forEach((d) => grid.append(card(d)));
    const cats = [...new Set(data.designs.map((d) => d.category || 'other'))];
    const nav = $('cats'); nav.replaceChildren();
    if (cats.length > 1) {
      nav.hidden = false; const names = T[lang || 'en'].cats;
      const chip = (k, text) => h('button', { type: 'button', class: 'cat', 'aria-pressed': String(cat === k), onclick: () => { cat = k; renderGrid(); } }, text);
      nav.append(chip('all', t('all', { n: data.designs.length })), ...cats.map((k) => chip(k, `${names[k] || names.other} ${data.designs.filter((x) => (x.category || 'other') === k).length}`)));
    }
  }

  // the metals a shop can ask for: as shown, or another standard (9K only for the UK, 10K only elsewhere)
  function metalChoices() {
    const uk = data.currency === 'GBP';
    return ['shown', 'silver925', uk ? 'gold9' : 'gold10', 'gold14', 'gold18', 'gold22'];
  }
  function addBox(d) {
    const cur = req.get(d.id) || { qty: 1, metal: 'shown' };
    const sel = h('select', { id: 'add-metal' }, ...metalChoices().map((k) => h('option', { value: k, selected: cur.metal === k }, k === 'shown' ? `${t('asShown')}${metalName(d) ? ` (${metalName(d)})` : ''}` : T[lang || 'en'].metals[k])));
    const qty = h('input', { id: 'add-qty', type: 'number', min: '1', max: '1000', step: '1', inputmode: 'numeric', value: String(cur.qty) });
    const btn = h('button', { type: 'button', class: 'btn mail', onclick: () => {
      const q = Math.max(1, Math.min(1000, Math.round(Number(qty.value) || 1))); req.set(d.id, { qty: q, metal: sel.value }); saveReq(); renderBar(); renderGrid(); $('sheet').close();
    } }, req.has(d.id) ? t('update') : t('add'));
    return [h('label', { class: 'fld', for: 'add-metal' }, t('metal'), sel), h('label', { class: 'fld', for: 'add-qty' }, t('qty'), qty), btn];
  }

  function openDesign(d) {
    open = d; const sheet = $('sheet');
    $('sheet-title').textContent = d.code; $('sheet-desc').textContent = descOf(d);
    const shots = $('sheet-shots'); shots.replaceChildren(...((d.photos || []).length ? d.photos.map((p, i) => photoBox(p, `${label(d)}, photo ${i + 1}`, true)) : [photoBox(null, label(d), true)]));
    const facts = $('sheet-facts'); facts.replaceChildren(); const F = T[lang || 'en'].facts;
    const fact = (k, v) => { if (v) facts.append(h('dt', { text: k }), h('dd', { text: v })); };
    fact(F.metal, metalName(d)); fact(F.weight, d.weight ? `${num(d.weight)} g` : ''); fact(F.stones, d.ct ? t('stonesValue', { ct: num(d.ct) }) : ''); fact(F.details, d.note);
    const pr = $('sheet-price'); pr.replaceChildren();
    if (data.prices && d.price) {
      pr.append(h('p', { class: 'price', text: t('wholesale', { p: money(d.price, data.currency) }) }), h('p', { class: 'count', text: t('perPiece') }));
      if (d.shop) pr.append(h('p', { class: 'shopprice', text: t('shopSuggested', { p: money(d.shop, 'GBP') }) }));
    }
    $('sheet-add').replaceChildren(...addBox(d));
    const ask = $('sheet-ask'); ask.replaceChildren(...askButtons(hello(data.prices ? t('askPrice', { code: d.code }) : t('askCat', { code: d.code })), data.prices ? t('subjPrice', { code: d.code }) : t('subjCat', { code: d.code })));
    $('sheet-close').setAttribute('aria-label', t('close'));
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
        h('h2', { text: t('kitTitle') }),
        h('p', { text: t('kitText', { n: k.n, pieces: T[lang || 'en'].piece(k.n), price: price ? t('kitFor', { p: price }) : '', credit: k.credit && price ? t('kitCredit') : '' }) }),
        price ? h('p', { class: 'kit-price', text: price }) : null,
        h('div', { class: 'row' }, ...askButtons(hello(t('kitAsk')), t('kitSubj'), asked).map((a) => { a.classList.remove('wa', 'mail'); a.classList.add('light'); return a; }))),
      h('div', { class: 'kit-shots' }, ...pieces.slice(0, 6).map((d) => photoBox((d.photos || [])[0], label(d), false))));
    box.hidden = false;
  }

  function renderContact() {
    const co = data.company; const box = $('contact');
    const buttons = askButtons(hello(data.prices ? t('helloPrices') : t('helloCat')), data.prices ? T[lang || 'en'].priceList : T[lang || 'en'].catalogue);
    if (!buttons.length) { box.hidden = true; return; }
    box.replaceChildren(h('h2', { text: data.prices ? t('contactPrices') : t('contactCat') }), h('p', { text: t('contactText', { co: co.name || t('us') }) }), h('div', { class: 'row' }, ...buttons), co.address ? h('p', { class: 'addr', text: co.address }) : null);
    box.hidden = false;
  }

  /* ---------- the quote request ---------- */
  function renderBar() {
    const bar = $('reqbar'); const ds = reqDesigns();
    if (!ds.length) { bar.hidden = true; document.body.classList.remove('has-req'); return; }
    const pcs = ds.reduce((a, d) => a + (Number((req.get(d.id) || {}).qty) || 0), 0); const L = T[lang || 'en'];
    $('reqbar-text').textContent = t('bar', { d: ds.length, designs: L.design(ds.length), p: pcs, pieces: L.piece(pcs) });
    $('reqbar-open').textContent = t('review'); bar.hidden = false; document.body.classList.add('has-req');
  }
  function field(id, labelText, attrs) { return h('label', { class: 'fld', for: id }, labelText, h('input', { id, ...attrs })); }
  function renderReq() {
    const L = T[lang || 'en'];
    $('req-title').textContent = t('reqTitle'); $('req-intro').textContent = t('reqIntro'); $('req-note-l').firstChild.textContent = t('noteL'); $('req-note').placeholder = t('noteP');
    $('req-close').setAttribute('aria-label', t('close')); $('req-send').textContent = t('send');
    const lines = $('req-lines'); lines.replaceChildren();
    for (const d of reqDesigns()) {
      const r = req.get(d.id);
      const sel = h('select', { 'aria-label': `${t('metal')}, ${d.code}`, onchange: (e) => { r.metal = e.target.value; saveReq(); } }, ...metalChoices().map((k) => h('option', { value: k, selected: r.metal === k }, k === 'shown' ? t('asShown') : L.metals[k])));
      const qty = h('input', { type: 'number', min: '1', max: '1000', step: '1', inputmode: 'numeric', value: String(r.qty), 'aria-label': `${t('qty')}, ${d.code}`, onchange: (e) => { r.qty = Math.max(1, Math.min(1000, Math.round(Number(e.target.value) || 1))); e.target.value = String(r.qty); saveReq(); renderBar(); } });
      lines.append(h('div', { class: 'rline' }, h('span', { class: 'rcode', text: d.code }), h('span', { class: 'count', text: descOf(d) }),
        h('div', { class: 'rctl' }, sel, qty, h('button', { type: 'button', class: 'linkish', onclick: () => { req.delete(d.id); saveReq(); renderBar(); renderGrid(); if (!req.size) $('req').close(); else renderReq(); } }, t('remove')))));
    }
    const who = $('req-who');
    if (!data.shop && !who.childElementCount) {
      who.append(h('div', { class: 'who' }, field('req-shop', t('shop'), { autocomplete: 'organization', maxlength: '120' }), field('req-name', t('name'), { autocomplete: 'name', maxlength: '120' }),
        field('req-email', t('email'), { type: 'email', autocomplete: 'email', maxlength: '160' }), field('req-country', t('country'), { autocomplete: 'country-name', maxlength: '80' }),
        field('req-city', t('city'), { autocomplete: 'address-level2', maxlength: '80' }), field('req-phone', t('phone'), { type: 'tel', autocomplete: 'tel', maxlength: '40' })));
    }
    who.hidden = !!data.shop;
  }
  function msg(text, tone) { const m = $('req-msg'); m.textContent = text || ''; m.className = `req-msg${tone ? ' ' + tone : ''}`; }
  async function sendReq(e) {
    e.preventDefault();
    const items = reqDesigns().map((d) => ({ designId: d.id, metal: (req.get(d.id) || {}).metal || 'shown', qty: (req.get(d.id) || {}).qty || 1 }));
    if (!items.length) { msg(t('emptyReq'), 'bad'); return; }
    let contact = null;
    if (!data.shop) {
      const v = (id) => String(($(id) || {}).value || '').trim();
      contact = { shop: v('req-shop'), name: v('req-name'), email: v('req-email'), country: v('req-country'), city: v('req-city'), phone: v('req-phone') };
      const missing = [[contact.shop, t('shop')], [contact.name, t('name')], [contact.email, t('email')], [contact.country, t('country')]].filter(([x]) => !x).map(([, l]) => l);
      if (missing.length) { msg(t('fill', { f: missing.join(', ') }), 'bad'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) { msg(t('badEmail'), 'bad'); return; }
    }
    const btn = $('req-send'); btn.disabled = true; btn.textContent = t('sending'); msg('');
    try {
      const r = await fetch(`${FN}/q/${token}`, { method: 'POST', headers: { 'content-type': 'text/plain;charset=UTF-8' }, credentials: 'omit', body: JSON.stringify({ items, note: $('req-note').value.trim().slice(0, 1000), contact, lang: lang || 'en', website: $('req-hp').value }) });
      if (r.status === 429) { msg(t('tooMany'), 'bad'); return; }
      if (!r.ok) throw new Error(String(r.status));
      req.clear(); saveReq(); $('req-note').value = ''; renderBar(); renderGrid(); $('req-lines').replaceChildren(); msg(t('sent'), 'good');
    } catch { msg(t('fail'), 'bad'); }
    finally { btn.disabled = false; btn.textContent = t('send'); }
  }

  function render() {
    const co = data.company || {}; const name = co.name || T[lang || 'en'].catalogue; const L = T[lang || 'en'];
    document.documentElement.lang = lang === 'fr' ? 'fr-CA' : 'en-GB';
    document.title = `${name} – ${data.prices ? L.priceList : L.catalogue}`;
    $('word').textContent = name; $('kind').textContent = data.prices ? L.priceList : L.catalogue; $('title').textContent = t('title');
    const sw = $('lang'); sw.textContent = t('other'); sw.setAttribute('aria-label', t('otherLabel')); sw.lang = lang === 'fr' ? 'en' : 'fr'; sw.hidden = false;
    if (data.shop && data.shop.name) { $('for').textContent = t('prepared', { shop: data.shop.name }); $('for').hidden = false; }
    const n = data.designs.length;
    const metals = data.designs.map((d) => metalKey(d) || String(d.metal || '').toLowerCase()); const silver = metals.some((m) => m.includes('silver')), gold = metals.some((m) => m.includes('gold'));
    const inMetal = silver && gold ? t('inBoth') : silver ? t('inSilver') : gold ? t('inGold') : '';
    $('lede').textContent = t('lede', { n, designs: L.design(n), metal: inMetal }) + (data.prices ? t('ledePrices', { cur: L.cur[data.currency] || data.currency }) : t('ledeTap'));
    const note = $('note'); const r = data.retail;
    note.textContent = data.prices ? t('notePrices', { rates: data.ratesAt ? t('noteRates', { date: day(data.ratesAt) }) : '' }) + (r && r.markup ? t('noteRetail', { m: num(r.markup), v: num(r.vat) }) : '') : t('noteAsk');
    note.hidden = false;
    renderGrid(); renderKit(); renderContact(); renderBar();
    $('foot').replaceChildren(h('p', { text: [co.name, co.address].filter(Boolean).join(', ') }), data.publishedAt ? h('p', { text: t('published', { date: day(data.publishedAt) }) }) : null);
    if ($('req').open) renderReq();
    if ($('sheet').open && open) openDesign(open);
  }

  function problem(key, retry) {
    $('lede').textContent = t(key);
    $('grid').replaceChildren(retry ? h('button', { type: 'button', class: 'btn line', onclick: () => { $('lede').textContent = t('opening'); load(); } }, t('retry')) : '');
  }

  async function load() {
    if (!lang) lang = askLang || (/^fr\b/i.test(navigator.language || '') ? 'fr' : 'en');
    $('title').textContent = t('title'); $('lede').textContent = t('opening');
    if (!token) { problem('incomplete'); return; }
    try {
      const r = await fetch(`${FN}/d/${token}${wantPrices ? '?p=1' : ''}`, { credentials: 'omit', cache: 'no-store' });
      const body = await r.json().catch(() => ({}));
      if (r.status === 404) { problem(body.error === 'not_published' ? 'updating' : 'inactive'); return; }
      if (!r.ok) throw new Error(String(r.status));
      data = body; data.designs = Array.isArray(data.designs) ? data.designs : []; data.company = data.company || {};
      if (data.lang === 'fr' || data.lang === 'en') lang = store.get('ark-lang') || data.lang; else lang = store.get('ark-lang') || lang;
      for (const id of [...req.keys()]) if (!data.designs.some((d) => d.id === id)) req.delete(id);
      render();
    } catch { problem('failed', true); }
  }

  $('lang').addEventListener('click', () => { lang = lang === 'fr' ? 'en' : 'fr'; store.set('ark-lang', lang); if (data) render(); });
  $('sheet-close').addEventListener('click', () => $('sheet').close());
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet').close(); });
  $('reqbar-open').addEventListener('click', () => { renderReq(); msg(''); const d = $('req'); if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); });
  $('req-close').addEventListener('click', () => $('req').close());
  $('req').addEventListener('click', (e) => { if (e.target === $('req')) $('req').close(); });
  $('req-form').addEventListener('submit', sendReq);
  load();
})();
