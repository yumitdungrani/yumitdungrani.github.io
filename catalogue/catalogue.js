/* Ark Diamond online catalogue. Opened from a shop's own link (#t=<token>, &p=1 for the price list, &o=1 to open at
   its quotes and orders), or as the customer view a shop shows its own customers (#c=<token>): the same designs with
   the shop's name, no trade prices and no supplier details.
   It reads everything from the app's link service, tells it which designs the shop opened, and sends what the shop
   chooses to send: a quote request, accepting a quote, an answer on a CAD drawing, which pieces sold, and its
   customer-view settings. In English or French: the shop's campaign language decides, or on a link without a shop
   &l=fr or &l=en (the French website adds it), else the visitor's browser; the button in the bar switches. */
(() => {
  'use strict';
  const FN = 'https://uhfpoduakpsagoecszpt.supabase.co/functions/v1/open';
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const custToken = (hash.get('c') || '').replace(/[^A-Za-z0-9]/g, '');
  const token = custToken || (hash.get('t') || '').replace(/[^A-Za-z0-9]/g, '');
  const isCustomer = !!custToken;
  const wantPrices = !isCustomer && hash.get('p') === '1';
  const wantMine = !isCustomer && hash.get('o') === '1';
  const askLang = ['fr', 'en'].includes(hash.get('l')) ? hash.get('l') : '';
  const $ = (id) => document.getElementById(id);
  let data = null; let cat = 'all'; let lang = ''; let open = null; let scrolled = false;
  const ui = { accept: '', cad: '', note: {}, busy: '', msg: {} };

  const T = {
    en: {
      title: 'Laboratory-grown diamond jewellery', opening: 'Opening the catalogue…', catalogue: 'Catalogue', priceList: 'Price list', collection: 'Collection', other: 'Français', otherLabel: 'Lire en français',
      prepared: 'Prepared for {shop}', all: 'All {n}', photoLater: 'Photo to follow', openIt: '{label}. Open',
      cats: { ring: 'Rings', earrings: 'Earrings', pendant: 'Pendants', necklace: 'Necklaces', bracelet: 'Bracelets', other: 'Other pieces' },
      design: (n) => (n === 1 ? 'design' : 'designs'), piece: (n) => (n === 1 ? 'piece' : 'pieces'),
      inBoth: ' in silver and gold', inSilver: ' in silver', inGold: ' in gold',
      lede: '{n} {designs}{metal}, set with laboratory-grown diamonds and made in India.', ledePrices: ' Wholesale prices in {cur}.', ledeTap: ' Tap a design to see it larger and add it to a quote request.',
      ledeCust: '{n} {designs}{metal}, set with laboratory-grown diamonds.', ledeUnpub: 'Our catalogue is being updated. Your quotes and orders are below.',
      cur: { GBP: 'pounds', USD: 'US dollars', EUR: 'euros', CAD: 'Canadian dollars', AED: 'dirhams', INR: 'rupees' },
      notePrices: 'Wholesale prices per piece, excluding {tax} and delivery{rates}.', noteRates: ', at our rates of {date}', noteRetail: ' Suggested shop prices use a {m}× mark-up plus {v}% VAT; your own prices are up to you.',
      taxNames: { INR: 'GST', other: 'VAT' }, noteCust: 'Prices in {cur}{tax}.', noteCustTax: ', including {p}% {w}', custTax: { GBP: 'VAT', EUR: 'VAT', AED: 'VAT', INR: 'GST', other: 'tax' },
      noteAsk: 'Tap a design, choose a quantity and add it to your request: we reply with prices and delivery time.',
      empty: 'The catalogue is being updated. Please message us and we will send you our latest designs.',
      shopAbout: 'Shop price about {p}', facts: { metal: 'Metal', weight: 'Metal weight', stones: 'Diamonds', details: 'Details', ready: 'Ready to ship' }, stonesValue: '{ct} ct laboratory-grown',
      wholesale: '{p} wholesale', perPiece: 'Per piece, excluding {tax} and delivery.', shopSuggested: 'Suggested UK shop price about {p} including VAT',
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
      ready: 'Ready to ship: {n}', readyChip: 'Ready to ship {n}', readyFact: '{n} {pieces}, sent within a week', best: 'Best seller', video: 'Video', playVideo: 'Video of {code}',
      mineTitle: 'Your quotes and orders', quote: 'Quote {n}', order: 'Order {n}', sentOn: 'Sent {d}', validTo: 'valid until {d}',
      th: { item: 'Item', qty: 'Qty', price: 'Price', amount: 'Amount' }, shipping: 'Shipping and insurance', discount: 'Discount', total: 'Total',
      landed: 'Your full cost, delivered (estimate)', duty: 'Import duty {p}%', importTax: 'Import tax {p}%', clearance: 'Customs clearance', inAll: 'In all',
      igst: 'IGST {p}%', cgst: 'CGST {h}% + SGST {h}%', withGst: 'Total with GST',
      accept: 'Accept this quote', acceptAsk: 'Accept quote {n} for {total}? We then send you the proforma invoice for the advance.', acceptNote: 'A note for us (optional)', acceptYes: 'Yes, accept it', cancel: 'Cancel',
      accepted: 'You accepted this quote on {d}. We will send your proforma invoice.', acceptedPlain: 'Accepted on {d}.', expired: 'This quote has passed its date. Ask us for a new one.',
      tryAgain: "That didn't go through. Try again in a moment.", gone: 'This has changed in the meantime. Here is the latest.',
      steps: ['Proforma', 'Making', 'Ready', 'Shipped', 'Delivered'],
      stPi: 'We start as soon as the advance of {a} arrives{by}.', stPiPaid: 'Advance received. Production starts now.', by: ', by {d}',
      stProd: 'In production{ready}.', readyBy: ', ready by {d}', stReady: 'Ready. The balance of {a} is due{by}; we ship once it arrives.', stReadyPaid: 'Ready and paid. We ship it next.',
      stShipped: 'Shipped{with}{on}.', with: ' with {c}', on: ' on {d}', track: 'Track the parcel', trackNo: 'Tracking number {t}', stDelivered: 'Delivered on {d}.',
      paid: 'Paid', due: 'Still to pay',
      cadTitle: 'Drawings to approve', cadDone: 'Drawings', cadOpen: 'Open the drawing (PDF)', cadImg: 'CAD drawing {n}', approve: 'Approve', askChange: 'Ask for a change', changeL: 'What should we change?', sendIt: 'Send',
      approvedOn: 'You approved this on {d}.', changeOn: 'You asked for a change on {d}: “{c}”', usOk: 'Approved on {d}.', usChange: 'Change asked on {d}: “{c}”', needComment: 'Tell us what to change.',
      photosTitle: 'Your finished pieces', photoN: 'Finished piece, photo {n}',
      soldTitle: 'How are the pieces selling?', soldText: 'Tell us how many of each have sold, and we can suggest what to reorder.', soldOf: 'of {n}', soldThanks: 'Thank you. You told us on {d}: {s} of {n} pieces sold.',
      cvTitle: 'Show it to your customers', cvText: "A copy of this catalogue for your own customers: your shop's name on it, no trade prices and no supplier details. Open it on a tablet in your shop, or send the link.",
      cvOpen: 'Open the customer view', cvCopy: 'Copy the link', cvCopied: 'Link copied.', cvPrices: 'Prices in the customer view', cvNone: 'No prices', cvShow: 'Show my prices',
      cvMarkup: 'Your mark-up, × the trade price', cvTax: 'Tax included, %', cvSave: 'Save', cvSaved: 'Saved. The customer view now shows {what}.', cvNo: 'no prices', cvYes: 'your prices', cvExample: 'At these settings, {a} wholesale shows as {b}.',
      custFoot: 'Ask us about any piece.',
    },
    fr: {
      title: 'Bijoux en diamants créés en laboratoire', opening: 'Ouverture du catalogue…', catalogue: 'Catalogue', priceList: 'Liste de prix', collection: 'Collection', other: 'English', otherLabel: 'Read in English',
      prepared: 'Préparé pour {shop}', all: 'Tous ({n})', photoLater: 'Photo à venir', openIt: '{label}. Ouvrir',
      cats: { ring: 'Bagues', earrings: "Boucles d'oreilles", pendant: 'Pendentifs', necklace: 'Colliers', bracelet: 'Bracelets', other: 'Autres pièces' },
      design: (n) => (n === 1 ? 'modèle' : 'modèles'), piece: (n) => (n === 1 ? 'pièce' : 'pièces'),
      inBoth: ' en argent et en or', inSilver: ' en argent', inGold: ' en or',
      lede: '{n} {designs}{metal}, sertis de diamants créés en laboratoire et fabriqués en Inde.', ledePrices: ' Prix de gros en {cur}.', ledeTap: " Touchez un modèle pour l'agrandir et l'ajouter à une demande de soumission.",
      ledeCust: '{n} {designs}{metal}, sertis de diamants créés en laboratoire.', ledeUnpub: 'Notre catalogue est en cours de mise à jour. Vos soumissions et commandes sont ci-dessous.',
      cur: { GBP: 'livres sterling', USD: 'dollars américains', EUR: 'euros', CAD: 'dollars canadiens', AED: 'dirhams', INR: 'roupies' },
      notePrices: 'Prix de gros à la pièce, hors {tax} et livraison{rates}.', noteRates: ', selon nos taux du {date}', noteRetail: ' Les prix suggérés en magasin comprennent une majoration de {m} fois et {v} % de TVA ; vos prix restent votre choix.',
      taxNames: { INR: 'GST', other: 'taxes' }, noteCust: 'Prix en {cur}{tax}.', noteCustTax: ', taxes de {p} % comprises', custTax: { other: 'taxes' },
      noteAsk: 'Touchez un modèle, choisissez la quantité et ajoutez-le à votre demande : nous répondrons avec les prix et le délai de livraison.',
      empty: 'Le catalogue est en cours de mise à jour. Écrivez-nous et nous vous enverrons nos derniers modèles.',
      shopAbout: 'Prix en magasin environ {p}', facts: { metal: 'Métal', weight: 'Poids du métal', stones: 'Diamants', details: 'Détails', ready: 'Prête à expédier' }, stonesValue: '{ct} ct, créés en laboratoire',
      wholesale: 'Prix de gros : {p}', perPiece: 'À la pièce, hors {tax} et livraison.', shopSuggested: 'Prix suggéré en magasin au Royaume-Uni : environ {p}, TVA comprise',
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
      ready: 'Prête à expédier : {n}', readyChip: 'Prêtes à expédier ({n})', readyFact: '{n} {pieces}, envoyée(s) sous une semaine', best: 'Meilleure vente', video: 'Vidéo', playVideo: 'Vidéo du modèle {code}',
      mineTitle: 'Vos soumissions et commandes', quote: 'Soumission {n}', order: 'Commande {n}', sentOn: 'Envoyée le {d}', validTo: "valable jusqu'au {d}",
      th: { item: 'Article', qty: 'Qté', price: 'Prix', amount: 'Montant' }, shipping: 'Expédition et assurance', discount: 'Remise', total: 'Total',
      landed: 'Votre coût total, livré (estimation)', duty: 'Droits de douane {p} %', importTax: "Taxe à l'importation {p} %", clearance: 'Dédouanement', inAll: 'En tout',
      igst: 'IGST {p} %', cgst: 'CGST {h} % + SGST {h} %', withGst: 'Total avec GST',
      accept: 'Accepter cette soumission', acceptAsk: "Accepter la soumission {n} pour {total} ? Nous vous enverrons ensuite la facture proforma pour l'acompte.", acceptNote: 'Un mot pour nous (facultatif)', acceptYes: "Oui, j'accepte", cancel: 'Annuler',
      accepted: 'Vous avez accepté cette soumission le {d}. Nous vous enverrons votre facture proforma.', acceptedPlain: 'Acceptée le {d}.', expired: 'Cette soumission a expiré. Demandez-nous-en une nouvelle.',
      tryAgain: "Cela n'a pas fonctionné. Réessayez dans un moment.", gone: 'Ceci a changé entre-temps. Voici la dernière version.',
      steps: ['Proforma', 'En production', 'Prête', 'Expédiée', 'Livrée'],
      stPi: "Nous commençons dès réception de l'acompte de {a}{by}.", stPiPaid: 'Acompte reçu. La production commence.', by: ', au plus tard le {d}',
      stProd: 'En production{ready}.', readyBy: ', prête le {d}', stReady: 'Prête. Le solde de {a} est dû{by} ; nous expédions dès sa réception.', stReadyPaid: 'Prête et payée. Nous l’expédions.',
      stShipped: 'Expédiée{with}{on}.', with: ' par {c}', on: ' le {d}', track: 'Suivre le colis', trackNo: 'Numéro de suivi {t}', stDelivered: 'Livrée le {d}.',
      paid: 'Payé', due: 'Reste à payer',
      cadTitle: 'Dessins à approuver', cadDone: 'Dessins', cadOpen: 'Ouvrir le dessin (PDF)', cadImg: 'Dessin CAO {n}', approve: 'Approuver', askChange: 'Demander une modification', changeL: 'Que faut-il modifier ?', sendIt: 'Envoyer',
      approvedOn: "Vous l'avez approuvé le {d}.", changeOn: 'Vous avez demandé une modification le {d} : « {c} »', usOk: 'Approuvé le {d}.', usChange: 'Modification demandée le {d} : « {c} »', needComment: 'Dites-nous quoi modifier.',
      photosTitle: 'Vos pièces terminées', photoN: 'Pièce terminée, photo {n}',
      soldTitle: 'Comment se vendent les pièces ?', soldText: 'Dites-nous combien de chaque pièce se sont vendues, et nous vous suggérerons quoi recommander.', soldOf: 'sur {n}', soldThanks: 'Merci. Vous nous avez indiqué le {d} : {s} pièces vendues sur {n}.',
      cvTitle: 'Montrez-le à vos clients', cvText: 'Une copie de ce catalogue pour vos clients : au nom de votre magasin, sans prix de gros ni coordonnées du fournisseur. Ouvrez-la sur une tablette en magasin ou envoyez le lien.',
      cvOpen: 'Ouvrir la vue client', cvCopy: 'Copier le lien', cvCopied: 'Lien copié.', cvPrices: 'Prix dans la vue client', cvNone: 'Sans prix', cvShow: 'Afficher mes prix',
      cvMarkup: 'Votre majoration (× le prix de gros)', cvTax: 'Taxes comprises (%)', cvSave: 'Enregistrer', cvSaved: 'Enregistré. La vue client affiche maintenant {what}.', cvNo: 'aucun prix', cvYes: 'vos prix', cvExample: 'Avec ces réglages, {a} en gros s’affiche à {b}.',
      custFoot: 'Demandez-nous plus de détails sur une pièce.',
    },
  };
  const L = () => T[lang || 'en'];
  const t = (k, vars) => { let s = L()[k]; if (typeof s !== 'string') return s; for (const [a, b] of Object.entries(vars || {})) s = s.split(`{${a}}`).join(String(b)); return s; };
  const locale = () => (lang === 'fr' ? 'fr-CA' : 'en-GB');
  // metal names the app writes, so the page can show them in French and keep the metal on a request line
  const METAL_KEY = { '925 sterling silver': 'silver925', '9k gold': 'gold9', '10k gold': 'gold10', '14k gold': 'gold14', '18k gold': 'gold18', '22k gold': 'gold22' };
  const metalKey = (d) => d.mk || METAL_KEY[String(d.metal || '').toLowerCase()] || '';
  const metalName = (d) => { const k = metalKey(d); return k ? L().metals[k] : d.metal || ''; };

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const money = (n, cur) => {
    if (!n) return ''; const d = Math.round(n * 100) % 100 ? 2 : 0; const loc = cur === 'INR' && lang !== 'fr' ? 'en-IN' : locale();
    try { return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d }).format(n); } catch { return `${cur} ${n}`; }
  };
  const amount = (n, cur) => { if (n) return money(n, cur); try { return new Intl.NumberFormat(locale(), { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(0); } catch { return `${cur} 0`; } };
  const num = (n) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(Number(n) || 0);
  const img = (id) => `${FN}/i/${token}/${encodeURIComponent(id)}`;
  const mediaUrl = (id) => `${FN}/m/${token}/${encodeURIComponent(id)}`;
  const day = (iso) => { const d = new Date(String(iso || '').length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) || !iso ? '' : d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }); };
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const beacon = (path) => { try { if (navigator.sendBeacon) navigator.sendBeacon(`${FN}/${path}`); else fetch(`${FN}/${path}`, { method: 'POST', keepalive: true, mode: 'no-cors' }); } catch { /* not needed to show the page */ } };
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fine without */ } } };
  const taxWord = (cur) => (L().taxNames[cur] || L().taxNames.other);
  async function post(path, body) {
    const r = await fetch(`${FN}/${path}`, { method: 'POST', headers: { 'content-type': 'text/plain;charset=UTF-8' }, credentials: 'omit', body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({})); return { ok: r.ok, status: r.status, body: j };
  }

  // the request: design id -> { qty, metal }, kept on this device until it is sent
  const REQ_KEY = `ark-request:${token}`;
  let req = new Map(isCustomer ? [] : Object.entries(store.get(REQ_KEY) || {}));
  const saveReq = () => store.set(REQ_KEY, Object.fromEntries(req));
  const reqDesigns = () => [...req.keys()].map((id) => data.designs.find((d) => d.id === id)).filter(Boolean);

  // what a shop sends when it taps a contact button: the company's WhatsApp and email, with the message written
  function hello(extra) { const shop = data.shop && data.shop.name; return t('hello', { co: data.company.name ? ` ${data.company.name}` : '', shop: shop ? t('thisIs', { shop }) : '', extra }); }
  function askButtons(text, subject, onAsk) {
    const co = data.company || {}; const out = [];
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
  function videoBox(d, eager) {
    const v = h('video', { src: mediaUrl(d.video.id), muted: true, loop: true, playsinline: true, autoplay: eager, controls: eager, preload: eager ? 'auto' : 'metadata', 'aria-label': t('playVideo', { code: d.code }) });
    v.muted = true; return h('div', { class: 'ph vid' }, v);
  }
  // in English the app's own description; in French one written from the same facts
  function descOf(d) {
    if (lang !== 'fr') return d.desc || '';
    const parts = [metalName(d)]; if (Number(d.weight)) parts.push(`${num(d.weight)} g`); if (Number(d.ct)) parts.push(`${num(d.ct)} ct de diamants créés en laboratoire`);
    const s = parts.filter(Boolean).join(', '); return s ? s[0].toUpperCase() + s.slice(1) : '';
  }
  const label = (d) => `${d.code}${descOf(d) ? `, ${descOf(d)}` : ''}`;
  const custPrice = (d) => (isCustomer && data.prices && d.price ? money(d.price, data.currency) : '');

  function card(d) {
    const priceRow = isCustomer ? (custPrice(d) ? [h('span', { class: 'price', text: custPrice(d) })] : [])
      : data.prices && d.price ? [h('span', { class: 'price', text: money(d.price, data.currency) }), d.shop ? h('span', { class: 'shopprice', text: t('shopAbout', { p: money(d.shop, 'GBP') }) }) : null] : [];
    const r = req.get(d.id); const first = (d.photos || [])[0];
    const badges = [!isCustomer && d.best ? h('span', { class: 'badge best', text: t('best') }) : null, !isCustomer && d.ready ? h('span', { class: 'badge ready', text: t('ready', { n: d.ready }) }) : null, d.video ? h('span', { class: 'badge vid', text: `▶ ${t('video')}` }) : null].filter(Boolean);
    return h('button', { type: 'button', class: 'card', 'aria-label': t('openIt', { label: label(d) }), onclick: () => openDesign(d) },
      !first && d.video ? videoBox(d, false) : photoBox(first, label(d), false),
      h('span', { class: 'card-in' }, badges.length ? h('span', { class: 'badges' }, ...badges) : null, h('span', { class: 'code', text: d.code }), descOf(d) ? h('span', { class: 'desc', text: descOf(d) }) : null, ...priceRow, r ? h('span', { class: 'inreq', text: t('inReq', { n: r.qty }) }) : null));
  }

  function renderGrid() {
    const grid = $('grid'); grid.replaceChildren(); const nav = $('cats'); nav.replaceChildren(); nav.hidden = true;
    if (data.unpublished) { grid.hidden = true; return; }
    grid.hidden = false;
    if (!data.designs.length) { grid.append(h('p', { class: 'empty', text: t('empty') })); return; }
    const ready = isCustomer ? [] : data.designs.filter((d) => d.ready > 0);
    if (cat === 'ready' && !ready.length) cat = 'all';
    const list = data.designs.filter((d) => cat === 'all' || (cat === 'ready' ? d.ready > 0 : (d.category || 'other') === cat));
    list.forEach((d) => grid.append(card(d)));
    const cats = [...new Set(data.designs.map((d) => d.category || 'other'))];
    if (cats.length > 1 || ready.length) {
      nav.hidden = false; const names = L().cats;
      const chip = (k, text) => h('button', { type: 'button', class: `cat${k === 'ready' ? ' readychip' : ''}`, 'aria-pressed': String(cat === k), onclick: () => { cat = k; renderGrid(); } }, text);
      nav.append(chip('all', t('all', { n: data.designs.length })), ready.length ? chip('ready', t('readyChip', { n: ready.length })) : null, ...(cats.length > 1 ? cats.map((k) => chip(k, `${names[k] || names.other} ${data.designs.filter((x) => (x.category || 'other') === k).length}`)) : []));
    }
  }

  // the metals a shop can ask for: as shown, or another standard (9K only for the UK, 10K only elsewhere)
  function metalChoices() {
    const uk = data.currency === 'GBP';
    return ['shown', 'silver925', uk ? 'gold9' : 'gold10', 'gold14', 'gold18', 'gold22'];
  }
  function addBox(d) {
    const cur = req.get(d.id) || { qty: 1, metal: 'shown' };
    const sel = h('select', { id: 'add-metal' }, ...metalChoices().map((k) => h('option', { value: k, selected: cur.metal === k }, k === 'shown' ? `${t('asShown')}${metalName(d) ? ` (${metalName(d)})` : ''}` : L().metals[k])));
    const qty = h('input', { id: 'add-qty', type: 'number', min: '1', max: '1000', step: '1', inputmode: 'numeric', value: String(cur.qty) });
    const btn = h('button', { type: 'button', class: 'btn mail', onclick: () => {
      const q = Math.max(1, Math.min(1000, Math.round(Number(qty.value) || 1))); req.set(d.id, { qty: q, metal: sel.value }); saveReq(); renderBar(); renderGrid(); $('sheet').close();
    } }, req.has(d.id) ? t('update') : t('add'));
    return [h('label', { class: 'fld', for: 'add-metal' }, t('metal'), sel), h('label', { class: 'fld', for: 'add-qty' }, t('qty'), qty), btn];
  }

  function openDesign(d) {
    open = d; const sheet = $('sheet');
    $('sheet-title').textContent = d.code; $('sheet-desc').textContent = descOf(d);
    const slides = (d.photos || []).map((p, i) => photoBox(p, `${label(d)}, photo ${i + 1}`, true));
    if (d.video) slides.unshift(videoBox(d, true));
    $('sheet-shots').replaceChildren(...(slides.length ? slides : [photoBox(null, label(d), true)]));
    const facts = $('sheet-facts'); facts.replaceChildren(); const F = L().facts;
    const fact = (k, v) => { if (v) facts.append(h('dt', { text: k }), h('dd', { text: v })); };
    fact(F.metal, metalName(d)); fact(F.weight, d.weight ? `${num(d.weight)} g` : ''); fact(F.stones, d.ct ? t('stonesValue', { ct: num(d.ct) }) : ''); fact(F.details, d.note);
    if (!isCustomer && d.ready) fact(F.ready, t('readyFact', { n: d.ready, pieces: L().piece(d.ready) }));
    const pr = $('sheet-price'); pr.replaceChildren();
    if (isCustomer) { if (custPrice(d)) pr.append(h('p', { class: 'price', text: custPrice(d) })); }
    else if (data.prices && d.price) {
      pr.append(h('p', { class: 'price', text: t('wholesale', { p: money(d.price, data.currency) }) }), h('p', { class: 'count', text: t('perPiece', { tax: taxWord(data.currency) }) }));
      if (d.shop) pr.append(h('p', { class: 'shopprice', text: t('shopSuggested', { p: money(d.shop, 'GBP') }) }));
    }
    $('sheet-add').replaceChildren(...(isCustomer ? [] : addBox(d))); $('sheet-add').hidden = isCustomer;
    const ask = $('sheet-ask'); ask.replaceChildren(...(isCustomer ? [] : askButtons(hello(data.prices ? t('askPrice', { code: d.code }) : t('askCat', { code: d.code })), data.prices ? t('subjPrice', { code: d.code }) : t('subjCat', { code: d.code }))));
    $('sheet-close').setAttribute('aria-label', t('close'));
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    if (data.shop && !isCustomer) beacon(`v/${token}/${encodeURIComponent(d.id)}`);
  }
  function closeSheet() { const v = $('sheet-shots').querySelector('video'); if (v) v.pause(); $('sheet').close(); }

  function renderKit() {
    const k = data.kit; const box = $('kit'); if (isCustomer || !k || !k.n) { box.hidden = true; return; }
    const pieces = k.ids.map((id) => data.designs.find((d) => d.id === id)).filter(Boolean);
    const price = k.price ? money(k.price, k.currency || data.currency) : '';
    const asked = () => { if (data.shop) beacon(`k/${token}`); };
    box.replaceChildren(
      h('div', null,
        h('h2', { text: t('kitTitle') }),
        h('p', { text: t('kitText', { n: k.n, pieces: L().piece(k.n), price: price ? t('kitFor', { p: price }) : '', credit: k.credit && price ? t('kitCredit') : '' }) }),
        price ? h('p', { class: 'kit-price', text: price }) : null,
        h('div', { class: 'row' }, ...askButtons(hello(t('kitAsk')), t('kitSubj'), asked).map((a) => { a.classList.remove('wa', 'mail'); a.classList.add('light'); return a; }))),
      h('div', { class: 'kit-shots' }, ...pieces.slice(0, 6).map((d) => photoBox((d.photos || [])[0], label(d), false))));
    box.hidden = false;
  }

  function renderContact() {
    const co = data.company || {}; const box = $('contact');
    if (isCustomer) { box.hidden = true; return; }
    const buttons = askButtons(hello(data.prices ? t('helloPrices') : t('helloCat')), data.prices ? L().priceList : L().catalogue);
    if (!buttons.length) { box.hidden = true; return; }
    box.replaceChildren(h('h2', { text: data.prices ? t('contactPrices') : t('contactCat') }), h('p', { text: t('contactText', { co: co.name || t('us') }) }), h('div', { class: 'row' }, ...buttons), co.address ? h('p', { class: 'addr', text: co.address }) : null);
    box.hidden = false;
  }

  /* ---------- the shop's own quotes and orders ---------- */
  function linesTable(doc, withAmounts) {
    const H = L().th; const cur = doc.currency;
    return h('div', { class: 'tablewrap' }, h('table', { class: 'lines' },
      h('thead', null, h('tr', null, h('th', { text: H.item }), h('th', { class: 'n', text: H.qty }), withAmounts ? h('th', { class: 'n', text: H.price }) : null, h('th', { class: 'n', text: H.amount }))),
      h('tbody', null, ...doc.lines.map((l) => h('tr', null, h('td', { text: l.desc }), h('td', { class: 'n', text: num(l.qty) }), withAmounts ? h('td', { class: 'n', text: money(l.price, cur) }) : null, h('td', { class: 'n', text: amount(l.amount, cur) }))))));
  }
  function sums(rows) { return h('dl', { class: 'sums' }, ...rows.filter(Boolean).flatMap(([k, v, tot]) => [h('dt', { class: tot ? 'tot' : null, text: k }), h('dd', { class: tot ? 'tot' : null, text: v })])); }
  function msgLine(key) { const m = ui.msg[key]; return m ? h('p', { class: `req-msg ${m.tone || ''}`, role: 'status', text: m.text }) : null; }
  async function act(key, path, body) {
    ui.busy = key; ui.msg[key] = null; renderMine();
    try {
      const r = await post(path, body);
      if (r.ok) { ui.busy = ''; ui.accept = ''; ui.cad = ''; await load(true); return true; }
      ui.msg[key] = { tone: 'bad', text: r.status === 400 && r.body.error === 'comment' ? t('needComment') : [404, 409, 410].includes(r.status) ? t('gone') : t('tryAgain') };
      if ([404, 409, 410].includes(r.status)) await load(true);
    } catch { ui.msg[key] = { tone: 'bad', text: t('tryAgain') }; }
    ui.busy = ''; renderMine(); return false;
  }

  function quoteCard(q) {
    const cur = q.currency; const key = 'q:' + q.id;
    const head = h('header', { class: 'doc-head' }, h('h3', { text: t('quote', { n: q.number }) }), h('span', { class: 'count', text: [q.date ? t('sentOn', { d: day(q.date) }) : '', q.validUntil && q.status === 'sent' ? t('validTo', { d: day(q.validUntil) }) : ''].filter(Boolean).join(', ') }));
    const rows = [q.shipping ? [L().shipping, money(q.shipping, cur)] : null, [L().total, amount(q.total, cur), true]];
    if (q.gst) rows.push([q.gst.local ? t('cgst', { h: num(q.gst.pct / 2) }) : t('igst', { p: num(q.gst.pct) }), money(q.gst.tax, cur)], [L().withGst, money(q.gst.total, cur), true]);
    const landed = q.landed ? h('div', { class: 'landed' }, h('h4', { text: t('landed') }), sums([[t('duty', { p: num(q.landed.dutyPct) }), amount(q.landed.duty, cur)], [t('importTax', { p: num(q.landed.vatPct) }), amount(q.landed.vat, cur)], q.landed.clearance ? [L().clearance, money(q.landed.clearance, cur)] : null, [L().inAll, money(q.landed.total, cur), true]])) : null;
    let foot;
    if (q.status === 'accepted') foot = h('p', { class: 'done-line', text: q.byLink ? t('accepted', { d: day(q.acceptedAt) }) : t('acceptedPlain', { d: day(q.acceptedAt) }) });
    else if (q.expired) foot = h('div', null, h('p', { class: 'count', text: t('expired') }), h('div', { class: 'row' }, ...askButtons(hello(`${t('quote', { n: q.number })}.`), t('quote', { n: q.number }))));
    else if (ui.accept === q.id) {
      const note = h('textarea', { id: `an-${q.id}`, rows: '2', maxlength: '1000' }); note.value = ui.note[key] || ''; note.addEventListener('input', () => { ui.note[key] = note.value; });
      foot = h('div', { class: 'confirm' }, h('p', { text: t('acceptAsk', { n: q.number, total: money(q.gst ? q.gst.total : q.total, cur) }) }), h('label', { class: 'fld', for: `an-${q.id}` }, t('acceptNote'), note),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn mail', disabled: ui.busy === key, onclick: () => act(key, `a/${token}/${encodeURIComponent(q.id)}`, { note: note.value.trim() }) }, ui.busy === key ? t('sending') : t('acceptYes')), h('button', { type: 'button', class: 'btn line', onclick: () => { ui.accept = ''; renderMine(); } }, t('cancel'))));
    } else foot = h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn mail', onclick: () => { ui.accept = q.id; renderMine(); const f = $(`an-${q.id}`); if (f) f.focus(); } }, t('accept')));
    return h('article', { class: 'doc', id: `quote-${q.id}` }, head, linesTable(q, true), sums(rows), landed, q.notes ? h('p', { class: 'notes', text: q.notes }) : null, foot, msgLine(key));
  }

  function orderState(o) {
    const cur = o.currency; const due = o.due;
    if (o.status === 'pi') return o.advance > 0 && o.paid + 0.005 >= o.advance ? t('stPiPaid') : t('stPi', { a: money(Math.max(0, o.advance - o.paid) || o.due, cur), by: o.advanceDueAt ? t('by', { d: day(o.advanceDueAt) }) : '' });
    if (o.status === 'production') return t('stProd', { ready: o.readyBy ? t('readyBy', { d: day(o.readyBy) }) : '' });
    if (o.status === 'ready') return due > 0.005 ? t('stReady', { a: money(due, cur), by: o.balanceDueAt ? t('by', { d: day(o.balanceDueAt) }) : '' }) : t('stReadyPaid');
    if (o.status === 'shipped') { const s = o.ship || {}; const names = { dhl: 'DHL', fedex: 'FedEx', ups: 'UPS', aramex: 'Aramex', malca: 'Malca-Amit', brinks: "Brink's", bvc: 'BVC' }; return t('stShipped', { with: names[s.courier] ? t('with', { c: names[s.courier] }) : '', on: s.at ? t('on', { d: day(s.at) }) : '' }); }
    return t('stDelivered', { d: day(o.deliveredAt || o.statusAt.delivered) });
  }
  function cadItem(o, c, i) {
    const key = `c:${o.id}:${c.id}`; const a = c.answer;
    const pic = c.photo ? h('a', { class: 'cadpic', href: img(c.photo.id), target: '_blank', rel: 'noopener' }, h('img', { src: img(c.photo.thumb || c.photo.id), alt: t('cadImg', { n: i + 1 }), loading: 'lazy' })) : null;
    const file = c.file ? h('a', { class: 'btn line', href: mediaUrl(c.file.id), target: '_blank', rel: 'noopener' }, t('cadOpen')) : null;
    let foot;
    if (a) foot = h('p', { class: a.decision === 'ok' ? 'done-line' : 'count', text: a.by === 'you' ? (a.decision === 'ok' ? t('usOk', { d: day(a.at) }) : t('usChange', { d: day(a.at), c: a.comment })) : a.decision === 'ok' ? t('approvedOn', { d: day(a.at) }) : t('changeOn', { d: day(a.at), c: a.comment }) });
    else if (ui.cad === key) {
      const box = h('textarea', { id: `cc-${c.id}`, rows: '3', maxlength: '1000' }); box.value = ui.note[key] || ''; box.addEventListener('input', () => { ui.note[key] = box.value; });
      foot = h('div', null, h('label', { class: 'fld', for: `cc-${c.id}` }, t('changeL'), box), h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn mail', disabled: ui.busy === key, onclick: () => { if (box.value.trim().length < 2) { ui.msg[key] = { tone: 'bad', text: t('needComment') }; renderMine(); return; } act(key, `cad/${token}/${encodeURIComponent(o.id)}`, { cadId: c.id, decision: 'change', comment: box.value.trim() }); } }, ui.busy === key ? t('sending') : t('sendIt')), h('button', { type: 'button', class: 'btn line', onclick: () => { ui.cad = ''; renderMine(); } }, t('cancel'))));
    } else foot = h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn mail', disabled: ui.busy === key, onclick: () => act(key, `cad/${token}/${encodeURIComponent(o.id)}`, { cadId: c.id, decision: 'ok' }) }, t('approve')), h('button', { type: 'button', class: 'btn line', onclick: () => { ui.cad = key; renderMine(); const f = $(`cc-${c.id}`); if (f) f.focus(); } }, t('askChange')));
    return h('li', { class: 'cad' }, pic, h('div', { class: 'cad-in' }, c.note ? h('p', { class: 'notes', text: c.note }) : null, file, foot, msgLine(key)));
  }
  function soldBox(o) {
    const key = 's:' + o.id;
    if (o.sold) { const s = o.sold.lines.reduce((x, y) => x + y, 0); const n = o.lines.reduce((x, l) => x + l.qty, 0); return h('p', { class: 'done-line', text: t('soldThanks', { d: day(o.sold.at), s, n }) }); }
    if (!o.askSold) return null;
    const inputs = o.lines.map((l, i) => h('input', { type: 'number', min: '0', max: String(l.qty), step: '1', inputmode: 'numeric', value: '0', id: `sd-${o.id}-${i}`, 'aria-label': `${l.desc}, ${t('soldOf', { n: num(l.qty) })}` }));
    return h('div', { class: 'soldbox' }, h('h4', { text: t('soldTitle') }), h('p', { class: 'count', text: t('soldText') }),
      ...o.lines.map((l, i) => h('div', { class: 'soldline' }, h('span', { text: l.desc }), h('span', { class: 'soldn' }, inputs[i], h('span', { class: 'count', text: t('soldOf', { n: num(l.qty) }) })))),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn mail', disabled: ui.busy === key, onclick: () => act(key, `sold/${token}/${encodeURIComponent(o.id)}`, { lines: inputs.map((x, i) => Math.max(0, Math.min(o.lines[i].qty, Math.round(Number(x.value) || 0)))) }) }, ui.busy === key ? t('sending') : t('sendIt'))), msgLine(key));
  }
  function orderCard(o) {
    const cur = o.currency; const idx = ['pi', 'production', 'ready', 'shipped', 'delivered'].indexOf(o.status);
    const track = h('ol', { class: 'track' }, ...L().steps.map((s, i) => h('li', { class: i < idx || o.status === 'delivered' ? 'done' : i === idx ? 'now' : null, 'aria-current': i === idx ? 'step' : null, text: s })));
    const ship = o.ship && (o.ship.url || o.ship.tracking) ? h('p', { class: 'count' }, o.ship.url ? h('a', { href: o.ship.url, target: '_blank', rel: 'noopener' }, `${t('track')}: ${o.ship.tracking}`) : t('trackNo', { t: o.ship.tracking })) : null;
    const rows = [o.shipping ? [L().shipping, money(o.shipping, cur)] : null, o.discount ? [L().discount, `−${money(o.discount, cur)}`] : null, [L().total, amount(o.total, cur), true], o.paid ? [L().paid, money(o.paid, cur)] : null, o.due > 0.005 && o.paid ? [L().due, money(o.due, cur)] : null];
    const open = (o.cad || []).some((c) => !c.answer);
    const cad = (o.cad || []).length ? h('div', { class: 'cadbox' }, h('h4', { text: open ? t('cadTitle') : t('cadDone') }), h('ul', { class: 'cads' }, ...o.cad.map((c, i) => cadItem(o, c, i)))) : null;
    const pics = (o.photos || []).length ? h('div', { class: 'finished' }, h('h4', { text: t('photosTitle') }), h('div', { class: 'thumbs' }, ...o.photos.map((p, i) => h('a', { href: img(p.id), target: '_blank', rel: 'noopener' }, h('img', { src: img(p.thumb || p.id), alt: t('photoN', { n: i + 1 }), loading: 'lazy' }))))) : null;
    return h('article', { class: 'doc', id: `order-${o.id}` },
      h('header', { class: 'doc-head' }, h('h3', { text: t('order', { n: o.number }) }), h('span', { class: 'count', text: day(o.date) })),
      track, h('p', { class: 'state', text: orderState(o) }), ship, cad, pics, soldBox(o), linesTable(o, false), sums(rows));
  }
  function renderMine() {
    const box = $('mine'); const m = data && data.mine;
    if (isCustomer || !m || !(m.quotes.length || m.orders.length)) { box.hidden = true; box.replaceChildren(); return; }
    const focus = document.activeElement && document.activeElement.id; const sel = focus && document.activeElement.selectionStart;
    box.replaceChildren(h('h2', { text: t('mineTitle') }), ...m.orders.filter((o) => o.status !== 'delivered' || o.askSold).map(orderCard), ...m.quotes.map(quoteCard), ...m.orders.filter((o) => o.status === 'delivered' && !o.askSold).map(orderCard));
    box.hidden = false;
    if (focus) { const f = $(focus); if (f) { f.focus(); try { if (sel != null && f.setSelectionRange) f.setSelectionRange(sel, sel); } catch { /* not a text field */ } } }
  }

  /* ---------- the customer view, set up by the shop ---------- */
  const custLink = () => (data && data.mine && data.mine.customer && data.mine.customer.token ? `${location.origin}${location.pathname}#c=${data.mine.customer.token}` : '');
  function renderCview() {
    const box = $('cview'); const c = data && data.mine && data.mine.customer;
    if (isCustomer || !c || !c.token || data.unpublished || !data.designs.length) { box.hidden = true; return; }
    const key = 'cv'; const link = custLink();
    const yes = h('input', { type: 'radio', name: 'cvp', id: 'cvp-yes', value: 'yes', checked: c.prices }); const no = h('input', { type: 'radio', name: 'cvp', id: 'cvp-no', value: 'no', checked: !c.prices });
    const mk = h('input', { type: 'number', id: 'cv-markup', min: '1', max: '10', step: '0.1', inputmode: 'decimal', value: String(c.markup) });
    const tx = h('input', { type: 'number', id: 'cv-tax', min: '0', max: '30', step: '0.5', inputmode: 'decimal', value: String(c.tax) });
    const sample = data.prices && data.designs.find((d) => d.price);
    const example = () => { if (!sample || !yes.checked) return ''; const step = data.currency === 'INR' ? 100 : 5; const v = Math.max(step, Math.round((sample.price * (Number(mk.value) || 1) * (1 + (Number(tx.value) || 0) / 100)) / step) * step); return t('cvExample', { a: money(sample.price, data.currency), b: money(v, data.currency) }); };
    const ex = h('p', { class: 'count', text: example() }); const set = h('div', { class: 'cv-nums', hidden: !c.prices }, h('label', { class: 'fld', for: 'cv-markup' }, t('cvMarkup'), mk), h('label', { class: 'fld', for: 'cv-tax' }, t('cvTax'), tx));
    const refresh = () => { set.hidden = !yes.checked; ex.textContent = example(); };
    [yes, no, mk, tx].forEach((x) => x.addEventListener('input', refresh));
    const copied = h('span', { class: 'count', role: 'status' });
    const copy = async () => {
      try { await navigator.clipboard.writeText(link); copied.textContent = t('cvCopied'); }
      catch { const f = h('input', { value: link, readonly: true, class: 'linkfield', 'aria-label': t('cvCopy') }); copied.replaceChildren(f); f.select(); }
    };
    box.replaceChildren(h('h2', { text: t('cvTitle') }), h('p', { text: t('cvText') }),
      h('div', { class: 'row' }, h('a', { class: 'btn mail', href: link, target: '_blank', rel: 'noopener' }, t('cvOpen')), h('button', { type: 'button', class: 'btn line', onclick: copy }, t('cvCopy')), copied),
      h('fieldset', { class: 'cv-set' }, h('legend', { text: t('cvPrices') }), h('div', { class: 'radios' }, h('label', { for: 'cvp-no' }, no, t('cvNone')), h('label', { for: 'cvp-yes' }, yes, t('cvShow'))), set, ex,
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn line', disabled: ui.busy === key, onclick: async () => {
          const ok = await act(key, `cv/${token}`, { prices: yes.checked, markup: Math.min(10, Math.max(1, Number(mk.value) || 2.5)), tax: Math.min(30, Math.max(0, Number(tx.value) || 0)) });
          if (ok) { ui.msg[key] = { tone: 'good', text: t('cvSaved', { what: yes.checked ? t('cvYes') : t('cvNo') }) }; renderCview(); }
        } }, t('cvSave'))), msgLine(key)));
    box.hidden = false;
  }

  /* ---------- the quote request ---------- */
  function renderBar() {
    const bar = $('reqbar'); const ds = isCustomer ? [] : reqDesigns();
    if (!ds.length) { bar.hidden = true; document.body.classList.remove('has-req'); return; }
    const pcs = ds.reduce((a, d) => a + (Number((req.get(d.id) || {}).qty) || 0), 0);
    $('reqbar-text').textContent = t('bar', { d: ds.length, designs: L().design(ds.length), p: pcs, pieces: L().piece(pcs) });
    $('reqbar-open').textContent = t('review'); bar.hidden = false; document.body.classList.add('has-req');
  }
  function field(id, labelText, attrs) { return h('label', { class: 'fld', for: id }, labelText, h('input', { id, ...attrs })); }
  function renderReq() {
    $('req-title').textContent = t('reqTitle'); $('req-intro').textContent = t('reqIntro'); $('req-note-l').firstChild.textContent = t('noteL'); $('req-note').placeholder = t('noteP');
    $('req-close').setAttribute('aria-label', t('close')); $('req-send').textContent = t('send');
    const lines = $('req-lines'); lines.replaceChildren();
    for (const d of reqDesigns()) {
      const r = req.get(d.id);
      const sel = h('select', { 'aria-label': `${t('metal')}, ${d.code}`, onchange: (e) => { r.metal = e.target.value; saveReq(); } }, ...metalChoices().map((k) => h('option', { value: k, selected: r.metal === k }, k === 'shown' ? t('asShown') : L().metals[k])));
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
    const co = data.company || {}; const shopName = data.shop && data.shop.name;
    const name = isCustomer ? shopName || L().collection : co.name || L().catalogue;
    const kind = isCustomer ? L().collection : data.prices ? L().priceList : L().catalogue;
    document.documentElement.lang = lang === 'fr' ? 'fr-CA' : 'en-GB';
    document.title = `${name} – ${kind}`;
    $('word').textContent = name; $('kind').textContent = kind; $('title').textContent = t('title');
    const sw = $('lang'); sw.textContent = t('other'); sw.setAttribute('aria-label', t('otherLabel')); sw.lang = lang === 'fr' ? 'en' : 'fr'; sw.hidden = false;
    if (!isCustomer && shopName) { $('for').textContent = t('prepared', { shop: shopName }); $('for').hidden = false; } else $('for').hidden = true;
    const n = data.designs.length;
    const metals = data.designs.map((d) => metalKey(d) || String(d.metal || '').toLowerCase()); const silver = metals.some((m) => m.includes('silver')), gold = metals.some((m) => m.includes('gold'));
    const inMetal = silver && gold ? t('inBoth') : silver ? t('inSilver') : gold ? t('inGold') : '';
    $('lede').textContent = data.unpublished ? t('ledeUnpub') : isCustomer ? t('ledeCust', { n, designs: L().design(n), metal: inMetal })
      : t('lede', { n, designs: L().design(n), metal: inMetal }) + (data.prices ? t('ledePrices', { cur: L().cur[data.currency] || data.currency }) : t('ledeTap'));
    const note = $('note'); const r = data.retail;
    if (data.unpublished) note.hidden = true;
    else if (isCustomer) {
      const w = L().custTax[data.currency] || L().custTax.other;
      note.textContent = data.prices ? t('noteCust', { cur: L().cur[data.currency] || data.currency, tax: data.tax ? t('noteCustTax', { p: num(data.tax), w }) : '' }) : ''; note.hidden = !data.prices;
    } else {
      note.textContent = data.prices ? t('notePrices', { tax: taxWord(data.currency), rates: data.ratesAt ? t('noteRates', { date: day(data.ratesAt) }) : '' }) + (r && r.markup ? t('noteRetail', { m: num(r.markup), v: num(r.vat) }) : '') : t('noteAsk');
      note.hidden = false;
    }
    renderMine(); renderGrid(); renderCview(); renderKit(); renderContact(); renderBar();
    $('foot').replaceChildren(...(isCustomer ? [h('p', { text: [shopName, t('custFoot')].filter(Boolean).join('. ') })] : [h('p', { text: [co.name, co.address].filter(Boolean).join(', ') }), data.publishedAt ? h('p', { text: t('published', { date: day(data.publishedAt) }) }) : null]));
    if ($('req').open) renderReq();
    if ($('sheet').open && open) openDesign(open);
    if (wantMine && !scrolled && !$('mine').hidden) { scrolled = true; requestAnimationFrame(() => $('mine').scrollIntoView({ block: 'start' })); }
  }

  function problem(key, retry) {
    $('lede').textContent = t(key);
    $('grid').replaceChildren(retry ? h('button', { type: 'button', class: 'btn line', onclick: () => { $('lede').textContent = t('opening'); load(); } }, t('retry')) : '');
  }

  async function load(again) {
    if (!lang) lang = askLang || (/^fr\b/i.test(navigator.language || '') ? 'fr' : 'en');
    if (!again) { $('title').textContent = t('title'); $('lede').textContent = t('opening'); }
    if (!token) { problem('incomplete'); return; }
    try {
      const r = await fetch(`${FN}/d/${token}${wantPrices ? '?p=1' : ''}`, { credentials: 'omit', cache: 'no-store' });
      const body = await r.json().catch(() => ({}));
      if (r.status === 404) { problem(body.error === 'not_published' ? 'updating' : 'inactive'); return; }
      if (!r.ok) throw new Error(String(r.status));
      if (isCustomer && !body.customer) { problem('inactive'); return; }
      data = body; data.designs = Array.isArray(data.designs) ? data.designs : []; data.company = data.company || {};
      if (!again) { if (data.lang === 'fr' || data.lang === 'en') lang = store.get('ark-lang') || data.lang; else lang = store.get('ark-lang') || lang; }
      for (const id of [...req.keys()]) if (!data.designs.some((d) => d.id === id)) req.delete(id);
      render();
    } catch { if (!again) problem('failed', true); }
  }

  $('lang').addEventListener('click', () => { lang = lang === 'fr' ? 'en' : 'fr'; store.set('ark-lang', lang); if (data) render(); });
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
  $('sheet').addEventListener('close', () => { const v = $('sheet-shots').querySelector('video'); if (v) v.pause(); });
  $('reqbar-open').addEventListener('click', () => { renderReq(); msg(''); const d = $('req'); if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); });
  $('req-close').addEventListener('click', () => $('req').close());
  $('req').addEventListener('click', (e) => { if (e.target === $('req')) $('req').close(); });
  $('req-form').addEventListener('submit', sendReq);
  load();
})();
