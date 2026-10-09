/* Ark Diamond: the app itself, built from the same file as the version inside Claude. */
(() => {
'use strict';

/* ================= constants ================= */
const BUYER_TYPES = [
  ['independent', 'Independent jeweller'],
  ['chain', 'Jewellery chain'],
  ['manufacturer', 'Manufacturer or brand'],
  ['wholesaler', 'Wholesaler or distributor'],
  ['online', 'Online jewellery brand'],
  ['bridal', 'Bridal or custom jeweller'],
  ['gift', 'Gift, fashion or department store'],
];
const TYPE_LABEL = Object.fromEntries(BUYER_TYPES);
const PRODUCT_LINES = [['silver', '925 silver + CVD, plain or gold-plated'], ['gold', 'Solid gold + CVD'], ['moissanite', 'Moissanite, by order']];
const LINE_LABEL = Object.fromEntries(PRODUCT_LINES);
const STAGES = [['new', 'New'], ['replied', 'Talking'], ['catalogue', 'Catalogue viewed'], ['quoted', 'Quote sent'], ['samples', 'Samples or memo'], ['first_order', 'First order'], ['repeat', 'Repeat buyer'], ['lost', 'Not now']];
const STAGE_ORDER = ['new', 'replied', 'catalogue', 'quoted', 'samples', 'first_order', 'repeat'];
const STAGE_LABEL = Object.fromEntries(STAGES);
const STAGE_TONE = { new: 'accent', replied: 'accent', catalogue: 'accent', quoted: 'gold', samples: 'gold', first_order: 'good', repeat: 'good', lost: '' };
const TAGS = [['interested', 'Interested'], ['price', 'Price question'], ['samples', 'Wants samples'], ['not_now', 'Not now'], ['not_interested', 'Not interested'], ['unsubscribe', 'Unsubscribe'], ['other', 'Other']];
const TAG_LABEL = Object.fromEntries(TAGS);
const TAG_TONE = { interested: 'good', price: 'good', samples: 'good', not_now: 'warn', not_interested: '', unsubscribe: 'bad', other: '' };
const STATUS_LABEL = { found: 'To review', approved: 'Approved', rejected: 'Rejected', active: 'In sequence', replied: 'Replied', closed: 'No reply', unsubscribed: 'Unsubscribed', bounced: 'Bounced' };
const STATUS_TONE = { found: 'gold', approved: 'accent', rejected: '', active: 'accent', replied: 'good', closed: '', unsubscribed: 'bad', bounced: 'warn' };
const CH_LABEL = { email: 'Email', whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', phone: 'Phone call', visit: 'Visit' };
const META_24H = ['whatsapp', 'instagram', 'facebook'];
const MSG_MAX = 3000; // characters kept per message
const MSG_KEEP = 50; // messages kept per buyer, so each record stays well under the 256 KB limit
const CAP = 25000; // records the shared database holds
// The app now lives outside Claude; this copy only points there.
const MOVED_TO = 'https://yumitdungrani.github.io/';
const PLACES = {
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Leeds', 'Edinburgh', 'Liverpool', 'Leicester', 'Bristol', 'Sheffield', 'Newcastle upon Tyne', 'Nottingham', 'Cardiff', 'Belfast', 'Brighton', 'Bradford', 'Coventry', 'Southampton', 'York', 'Harrogate', 'Chester', 'Bath', 'Cambridge', 'Oxford', 'Aberdeen'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'United States': ['New York', 'Los Angeles', 'Houston', 'Chicago', 'Miami', 'Dallas', 'San Francisco', 'Atlanta'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Pforzheim', 'Düsseldorf'],
  'Italy': ['Milan', 'Vicenza', 'Rome', 'Arezzo', 'Valenza'],
  'France': ['Paris', 'Lyon', 'Marseille'],
  'Netherlands': ['Amsterdam', 'Rotterdam'],
  'Belgium': ['Antwerp', 'Brussels'],
  'Spain': ['Madrid', 'Barcelona'],
  'Hong Kong': ['Hong Kong'],
  'Singapore': ['Singapore'],
  'Israel': ['Ramat Gan', 'Tel Aviv'],
  'Saudi Arabia': ['Riyadh', 'Jeddah'],
  'Qatar': ['Doha'],
  'Kuwait': ['Kuwait City'],
  'Japan': ['Tokyo', 'Osaka'],
  'South Africa': ['Johannesburg', 'Cape Town'],
  'India': ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur', 'Ahmedabad'],
};
const LANGS = ['English', 'German', 'French', 'Italian', 'Spanish', 'Dutch', 'Arabic', 'Japanese', 'Hebrew', 'Chinese'];
const LANG_BY_COUNTRY = { Germany: 'German', Italy: 'Italian', France: 'French', Netherlands: 'Dutch', Spain: 'Spanish', Japan: 'Japanese', 'Saudi Arabia': 'Arabic', Qatar: 'Arabic', Kuwait: 'Arabic' };

const DEFAULT_SEQUENCE = [
  { id: 's0', day: 0, channel: 'email', by: 'app', title: 'Intro and catalogue',
    subject: 'Lab-grown diamond jewellery for {{business}}',
    body: "Hello {{contact}},\n\nI'm {{sender}} from {{company}}. We manufacture jewellery set with CVD lab-grown diamonds in India: {{products}}.\n\nHere is our catalogue for jewellers in {{city}}: {{catalogue_link}}\n\nPrefer WhatsApp? Message us here: {{whatsapp_link}}\n\nBest regards,\n{{sender}}\n{{company}}" },
  { id: 's3', day: 1, channel: 'instagram', by: 'you', title: 'Follow, like two posts, then DM the catalogue', subject: '',
    body: "Hi! We're {{company}}, lab-grown diamond jewellery makers from India. We emailed you our catalogue, and here it is too: {{catalogue_link}}" },
  { id: 's1', day: 2, channel: 'email', by: 'app', title: 'Price list',
    subject: 'Wholesale prices for {{business}}',
    body: "Hello {{contact}},\n\nFollowing my email with our catalogue, here is our wholesale price list for {{country}}, with minimum order and delivery times: {{price_list_link}}\n\nWe can also arrange samples so you can check the quality first.\n\nBest regards,\n{{sender}}" },
  { id: 's5', day: 2, channel: 'linkedin', by: 'you', title: 'Connection note to the owner or buyer', subject: '',
    body: 'Hello {{contact}}, I make lab-grown diamond jewellery in India and work with jewellers in {{country}}. Happy to connect.' },
  { id: 's2', day: 4, channel: 'whatsapp', by: 'app', title: 'Catalogue on WhatsApp, or a call', subject: '',
    body: 'Hello {{contact}}, this is {{sender}} from {{company}}. Sharing our lab-grown diamond jewellery catalogue: {{catalogue_link}} Would you like prices for any pieces?',
    alt: 'Call {{business}} during shop hours. Introduce {{company}}, ask whether our catalogue and prices arrived, and offer samples.' },
  { id: 's7', day: 5, channel: 'instagram', by: 'you', title: 'DM the price list', subject: '',
    body: 'Hello again! Our wholesale prices for {{country}} are here: {{price_list_link}} Happy to send a few samples so you can see the quality.' },
  { id: 's8', day: 6, channel: 'whatsapp', by: 'app', optinOnly: true, title: 'Prices on WhatsApp (shops that opted in)', subject: '',
    body: 'Hello {{contact}}, here are our wholesale prices for {{country}}: {{price_list_link}} We can send a few sample pieces first if that helps. {{sender}}, {{company}}' },
  { id: 's4', day: 7, channel: 'email', by: 'app', title: 'Bestsellers and first-order offer',
    subject: 'Five bestsellers for {{business}}',
    body: "Hello {{contact}},\n\nHere are five of our best-selling lab-grown diamond pieces, with prices for {{country}}: {{catalogue_link}}\n\nFor a first order we can send a sample set so you can see the quality before you commit.\n\nBest regards,\n{{sender}}" },
  { id: 's9', day: 8, channel: 'linkedin', by: 'you', title: 'Message with the catalogue', subject: '',
    body: 'Thanks for connecting, {{contact}}. Here is our lab-grown diamond jewellery catalogue for jewellers in {{country}}: {{catalogue_link}} Samples are possible before a first order.' },
  { id: 's6', day: 10, channel: 'email', by: 'app', title: 'Last note',
    subject: 'Shall I close your file?',
    body: "Hello {{contact}},\n\nI haven't heard back, so I'll assume now isn't the right time. If you'd like our catalogue or prices later, just reply to this email.\n\nBest regards,\n{{sender}}" },
];
const DEFAULT_FAIR_SEQUENCE = [
  { id: 'f0', day: 0, channel: 'email', by: 'app', title: 'Thank-you note with the catalogue',
    subject: 'Great to meet you at {{fair}}',
    body: "Hello {{contact}},\n\nThank you for your time at {{fair}}. It was good to meet you.\n\nAs promised, here is our catalogue of lab-grown diamond jewellery in {{products}}: {{catalogue_link}}\n\nYou can also reach me on WhatsApp: {{whatsapp_link}}\n\nBest regards,\n{{sender}}\n{{company}}" },
  { id: 'f1', day: 1, channel: 'whatsapp', by: 'app', title: 'WhatsApp hello, or a call', subject: '',
    body: "Hello {{contact}}, this is {{sender}} from {{company}}. We met at {{fair}}. I've emailed you our catalogue: {{catalogue_link}} Which pieces should I price for you?",
    alt: 'Call {{business}} to thank them for their time at {{fair}}, check the catalogue arrived and ask which pieces to price.' },
  { id: 'f2', day: 3, channel: 'email', by: 'app', title: 'Price list',
    subject: 'Wholesale prices for {{business}}',
    body: "Hello {{contact}},\n\nHere is our wholesale price list for {{country}}, with minimum order and delivery times: {{price_list_link}}\n\nTell me which pieces you liked at {{fair}} and I'll prepare a quote.\n\nBest regards,\n{{sender}}" },
  { id: 'f3', day: 5, channel: 'linkedin', by: 'you', title: 'Connect on LinkedIn', subject: '',
    body: 'Hello {{contact}}, good to meet you at {{fair}}. Happy to stay in touch.' },
  { id: 'f4', day: 9, channel: 'email', by: 'app', title: 'Samples or a first order',
    subject: 'Samples for {{business}}?',
    body: "Hello {{contact}},\n\nWould a small sample set help you decide? We can send a few lab-grown diamond pieces from the catalogue so you can check the quality in your store.\n\nBest regards,\n{{sender}}" },
  { id: 'f5', day: 16, channel: 'email', by: 'app', title: 'Last note',
    subject: 'Shall I keep you on my list?',
    body: "Hello {{contact}},\n\nI haven't heard back since {{fair}}, so I'll leave it here for now. If you'd like prices or samples later, just reply to this email.\n\nBest regards,\n{{sender}}" },
];
const DEFAULT_RETRY_SEQUENCE = [
  { id: 'r0', day: 0, channel: 'email', by: 'app', title: 'New designs',
    subject: 'New lab-grown diamond designs for {{business}}',
    body: "Hello {{contact}},\n\nI wrote to you a few months ago. Since then we have added new lab-grown diamond designs in {{products}}: {{catalogue_link}}\n\nIf you are planning stock for the coming season, I'd be glad to send prices or a few samples.\n\nBest regards,\n{{sender}}\n{{company}}" },
  { id: 'r1', day: 4, channel: 'whatsapp', by: 'app', title: 'WhatsApp, or a call', subject: '',
    body: 'Hello {{contact}}, {{sender}} from {{company}} here. We have new lab-grown diamond designs this season: {{catalogue_link}} Shall I send prices?',
    alt: 'Call {{business}}, mention the new designs and ask who decides on new suppliers.' },
  { id: 'r2', day: 9, channel: 'email', by: 'app', title: 'Last note',
    subject: 'Closing your file, {{business}}',
    body: "Hello {{contact}},\n\nI won't write again unless you'd like me to. If lab-grown diamond jewellery becomes interesting for {{business}}, just reply to this email.\n\nBest regards,\n{{sender}}" },
];
const SEQ_KINDS = [['city', 'City outreach'], ['fair', 'After a fair'], ['retry', 'Second try']];
const SEQ_INTRO = {
  city: 'Every approved buyer in a city campaign gets these steps, counted from the day of the first email. Any reply stops the sequence.',
  fair: 'People you met or scanned at a fair get this warmer follow-up, counted from the day you start it, ideally the day after the fair.',
  retry: 'Buyers who never answered get one more try, a set number of days after their first sequence ended.',
};
const SEQ_SHORT = { city: '', fair: 'Fair · ', retry: 'Second try · ' };
const DEFAULT_RULES = { notNowDays: 60, reorderDays: 45, retryAfterDays: 90, sampleCheckDays: 7 };
const DEFAULT_ANSWERS = [
  { id: 'a1', title: 'Minimum order', text: 'The minimum depends on the designs and quantities you choose, and you can mix designs and metals in one order. Tell me what you have in mind and I\'ll confirm it for your order.' },
  { id: 'a2', title: 'Certificates', text: 'Our main stones can come with a grading report from IGI, GIA or SGL, whichever lab you prefer.' },
  { id: 'a3', title: 'Delivery time', text: 'Delivery time depends on the order: the designs, quantities and finish. I\'ll confirm the production time with your quote, and we ship to {{country}} by insured courier.' },
  { id: 'a4', title: 'Payment terms', text: 'For a first order we ask for 50% in advance by bank transfer. The balance is due before dispatch, after we send you photos of the finished pieces and their certificates.' },
  { id: 'a5', title: 'Lab-grown and mined', text: 'Lab-grown diamonds have the same chemical, physical and optical properties as mined diamonds. They are grown in a lab instead of mined, so they cost less for the same size and quality.' },
  { id: 'a6', title: 'Samples', text: 'The sample cost depends on the pieces you choose. Tell me which designs you\'d like and I\'ll send you the price for the sample set.' },
  { id: 'a7', title: 'Custom designs and private label', text: 'Yes, we make custom designs from your sketch or photo, with CAD approval before production, and we can stamp your brand on the pieces. The minimum for custom work is [MOQ].' },
  { id: 'a8', title: 'Import duty and shipping', text: 'We ship [Incoterm] with full insurance. Import duty and VAT in {{country}} are paid by [you / us], and I can add an estimate to the quote.' },
  { id: 'a9', title: 'UK import duty', text: 'Our jewellery is made in India, so under the UK–India trade agreement (in force since 15 July 2026) it enters the UK at 0% import duty instead of 2%. We send [an origin declaration on the invoice / a certificate of origin] so you can claim it. Import VAT of 20% still applies.' },
  { id: 'a10', title: 'UK hallmarking', text: 'In the UK, gold pieces over 1 g and silver pieces over 7.78 g need a UK hallmark before they are sold. [We send the pieces to a UK assay office for hallmarking before delivery / You hallmark them on arrival]. For the UK we make 925 silver and 14K, 18K or 22K gold, all legal UK standards.' },
];

/* Trade fairs from Oct 2026 to Sep 2027; dates checked on each organiser's site on 3 Oct 2026. */
const FAIRS = [
  { key: 'sajex-2026', name: 'SAJEX (GJEPC)', city: 'Jeddah', country: 'Saudi Arabia', start: '2026-10-06', end: '2026-10-08', venue: 'Jeddah Superdome', url: 'https://gjepc.org/sajex/', who: 'GCC wholesalers, retailers and chains meeting Indian exporters' },
  { key: 'jis-fall-2026', name: 'JIS Fall', city: 'Miami', country: 'United States', start: '2026-10-16', end: '2026-10-19', venue: 'Miami Beach Convention Center', url: 'https://www.jisshow.com', who: 'Trade only: retailers, dealers and wholesalers' },
  { key: 'ja-ny-fall-2026', name: 'JA New York Fall', city: 'New York', country: 'United States', start: '2026-10-25', end: '2026-10-27', venue: 'Javits Center', url: 'https://ja-newyork.com', who: 'Trade only: retailers, designers and wholesalers' },
  { key: 'jgtd-2026', name: 'Jewellery, Gem & Technology Dubai', city: 'Dubai', country: 'United Arab Emirates', start: '2026-10-27', end: '2026-10-29', venue: 'Dubai Exhibition Centre', url: 'https://www.jgtdubaijewelleryshow.com/en', who: 'Trade only: buyers from the Middle East, Europe and India' },
  { key: 'jewellery-arabia-2026', name: 'Jewellery Arabia', city: 'Sakhir', country: 'Bahrain', start: '2026-11-24', end: '2026-11-28', venue: 'Exhibition World Bahrain', url: 'https://www.jewelleryarabia.com', who: 'Mostly consumers, some trade' },
  { key: 'jba-2026', name: 'Jewellery & Bride Arabia', city: 'Dubai', country: 'United Arab Emirates', start: '2026-12-03', end: '2026-12-06', venue: 'Dubai World Trade Centre', url: 'https://jewellerybridearabia.com', who: 'Trade and public' },
  { key: 'iijs-signature-2027', name: 'IIJS Bharat Signature', city: 'Mumbai', country: 'India', start: '2027-01-07', end: '2027-01-11', venue: 'Jio World Convention Centre and Bombay Exhibition Centre', url: 'https://gjepc.org/iijs-signature/', who: 'Trade; free registration for international buyers' },
  { key: 'vicenzaoro-jan-2027', name: 'Vicenzaoro January', city: 'Vicenza', country: 'Italy', start: '2027-01-15', end: '2027-01-19', venue: 'Fiera di Vicenza', url: 'https://www.vicenzaoro.com/en', who: 'International trade' },
  { key: 'ijt-2027', name: 'International Jewellery Tokyo', city: 'Chiba', country: 'Japan', start: '2027-01-27', end: '2027-01-29', venue: 'Makuhari Messe', url: 'https://www.ijt.jp/tokyo/en-gb.html', who: 'Trade only' },
  { key: 'spring-fair-2027', name: 'Spring Fair', city: 'Birmingham', country: 'United Kingdom', start: '2027-02-07', end: '2027-02-10', venue: 'NEC Birmingham', url: 'https://www.springfair.com', who: 'Retail buyers of gifts, home and fashion' },
  { key: 'inhorgenta-2027', name: 'Inhorgenta Munich', city: 'Munich', country: 'Germany', start: '2027-02-19', end: '2027-02-22', venue: 'Messe München', url: 'https://inhorgenta.com', who: 'Trade only' },
  { key: 'bgjf-75', name: 'Bangkok Gems & Jewelry Fair', city: 'Bangkok', country: 'Thailand', start: '2027-02-23', end: '2027-02-27', venue: 'Queen Sirikit National Convention Center', url: 'https://www.bkkgems.com', who: 'Trade and public' },
  { key: 'hk-dgp-2027', name: 'Hong Kong International Diamond, Gem & Pearl Show', city: 'Hong Kong', country: 'Hong Kong', start: '2027-03-02', end: '2027-03-06', venue: 'AsiaWorld-Expo', url: 'https://www.hktdc.com/event/hkdgp/en', who: 'Buyers of loose diamonds, gems and pearls' },
  { key: 'hk-jewellery-2027', name: 'Hong Kong International Jewellery Show', city: 'Hong Kong', country: 'Hong Kong', start: '2027-03-04', end: '2027-03-08', venue: 'HKCEC, Wan Chai', url: 'https://www.hktdc.com/event/hkjewellery/en', who: 'Trade buyers only' },
  { key: 'ja-ny-spring-2027', name: 'JA New York Spring', city: 'New York', country: 'United States', start: '2027-03-14', end: '2027-03-16', venue: '', url: 'https://ja-newyork.com', who: 'Trade only' },
  { key: 'ijs-61', name: 'Istanbul Jewelry Show', city: 'Istanbul', country: 'Türkiye', start: '2027-03-31', end: '2027-04-03', venue: 'Istanbul Expo Center', url: 'https://www.istanbuljewelryshow.com', who: 'Trade only' },
  { key: 'wjmes-2027-04', name: 'Watch & Jewellery Middle East Show', city: 'Sharjah', country: 'United Arab Emirates', start: '2027-04-28', end: '2027-05-02', venue: 'Expo Centre Sharjah', url: 'https://mideastjewellery.com/en/', who: 'Trade buyers and the public' },
  { key: 'jck-2027', name: 'JCK Las Vegas', city: 'Las Vegas', country: 'United States', start: '2027-06-04', end: '2027-06-07', venue: 'The Venetian Expo', url: 'https://lasvegas.jckonline.com', who: 'Trade only' },
  { key: 'jga-2027', name: 'Jewellery & Gem ASIA Hong Kong', city: 'Hong Kong', country: 'Hong Kong', start: '2027-06-17', end: '2027-06-20', venue: 'HKCEC', url: 'https://jga.exhibitions.jewellerynet.com', who: 'Trade buyers' },
  { key: 'iijs-premiere-2027', name: 'IIJS Premiere', city: 'Mumbai', country: 'India', start: '2027-08-05', end: '2027-08-10', venue: 'Jio World Convention Centre and Bombay Exhibition Centre', url: 'https://gjepc.org/iijs-premiere/', who: 'Trade', unconfirmed: true },
  { key: 'jaa-ijf-2027', name: 'JAA International Jewellery Fair', city: 'Sydney', country: 'Australia', start: '2027-08-14', end: '2027-08-16', venue: 'ICC Sydney', url: 'https://jewelleryfair.com.au', who: 'Trade only' },
  { key: 'jewellery-show-2027', name: 'The Jewellery Show', city: 'London', country: 'United Kingdom', start: '2027-09-01', end: '2027-09-02', venue: 'Olympia London', url: 'https://www.thejewelleryshow.co.uk', who: 'Trade only' },
  { key: 'bgjf-76', name: 'Bangkok Gems & Jewelry Fair', city: 'Bangkok', country: 'Thailand', start: '2027-09-07', end: '2027-09-11', venue: 'Queen Sirikit National Convention Center', url: 'https://www.bkkgems.com', who: 'Trade and public' },
  { key: 'jgw-2027', name: 'Jewellery & Gem WORLD Hong Kong', city: 'Hong Kong', country: 'Hong Kong', start: '2027-09-14', end: '2027-09-20', venue: 'AsiaWorld-Expo and HKCEC', url: 'https://jgw.exhibitions.jewellerynet.com', who: 'International trade' },
];
const IN_COMMUNITY = ['India', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Saudi Arabia', 'United Kingdom', 'United States', 'Canada', 'Singapore', 'Australia', 'South Africa'];
const WEST = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'Italy', 'France', 'Netherlands', 'Belgium', 'Spain', 'South Africa'];
const GULF = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait'];
/* Retail seasons to Dec 2027. Islamic dates are expected dates that depend on the moon. */
const SEASONS = [
  { key: 'dhanteras-2026', name: 'Dhanteras', date: '2026-11-06', countries: IN_COMMUNITY, note: "India's biggest gold and jewellery buying day, two days before Diwali. Also big in Indian communities abroad." },
  { key: 'diwali-2026', name: 'Diwali', date: '2026-11-08', countries: IN_COMMUNITY, note: 'Gifting peak in India and Indian communities abroad.' },
  { key: 'black-friday-2026', name: 'Black Friday', date: '2026-11-27', countries: [...WEST, ...GULF], note: 'Starts the holiday sales. In the Gulf it runs as White Friday.' },
  { key: 'hanukkah-2026', name: 'Hanukkah', date: '2026-12-04', countries: ['Israel', 'United States', 'Canada', 'United Kingdom', 'France', 'Australia', 'South Africa'], note: 'Eight nights from 4 December.' },
  { key: 'christmas-2026', name: 'Christmas', date: '2026-12-25', countries: [...WEST, 'Hong Kong', 'Singapore', 'Japan'], note: 'The biggest jewellery season in most Western markets, and peak engagement season.' },
  { key: 'cny-2027', name: 'Chinese New Year', date: '2027-02-06', countries: ['Hong Kong', 'Singapore', 'United States', 'Canada', 'Australia', 'United Kingdom'], note: 'Gold and jewellery gifting in Chinese communities.' },
  { key: 'valentines-2027', name: "Valentine's Day", date: '2027-02-14', countries: [...WEST, 'Japan', 'Hong Kong', 'Singapore', 'India', 'United Arab Emirates'], note: 'The second-biggest jewellery season in many markets.' },
  { key: 'mothering-sunday-2027', name: 'Mothering Sunday (UK)', date: '2027-03-07', countries: ['United Kingdom'], note: '' },
  { key: 'eid-al-fitr-2027', name: 'Eid al-Fitr', date: '2027-03-10', approx: true, countries: [...GULF, 'United Kingdom', 'South Africa', 'Singapore', 'India'], note: 'Ramadan starts about 8 February, and jewellery gifting peaks before Eid.' },
  { key: 'arab-mothers-day-2027', name: "Mother's Day (Arab countries)", date: '2027-03-21', countries: GULF, note: '' },
  { key: 'spain-mothers-day-2027', name: "Mother's Day (Spain)", date: '2027-05-02', countries: ['Spain'], note: '' },
  { key: 'akshaya-tritiya-2027', name: 'Akshaya Tritiya', date: '2027-05-09', countries: IN_COMMUNITY, note: 'Auspicious gold buying day. Sources differ between 8 and 9 May.' },
  { key: 'mothers-day-2027', name: "Mother's Day", date: '2027-05-09', countries: ['United States', 'Canada', 'Australia', 'Germany', 'Italy', 'Netherlands', 'Belgium', 'Japan', 'Hong Kong', 'Singapore', 'South Africa', 'India'], note: 'Second Sunday of May in these countries.' },
  { key: 'eid-al-adha-2027', name: 'Eid al-Adha', date: '2027-05-16', approx: true, countries: GULF, note: '' },
  { key: 'france-mothers-day-2027', name: "Mother's Day (France)", date: '2027-05-30', countries: ['France'], note: '' },
  { key: 'dhanteras-2027', name: 'Dhanteras', date: '2027-10-27', countries: IN_COMMUNITY, note: "India's biggest gold and jewellery buying day." },
  { key: 'diwali-2027', name: 'Diwali', date: '2027-10-29', countries: IN_COMMUNITY, note: '' },
  { key: 'black-friday-2027', name: 'Black Friday', date: '2027-11-26', countries: [...WEST, ...GULF], note: '' },
  { key: 'hanukkah-2027', name: 'Hanukkah', date: '2027-12-24', countries: ['Israel', 'United States', 'Canada', 'United Kingdom', 'France', 'Australia', 'South Africa'], note: '' },
  { key: 'christmas-2027', name: 'Christmas', date: '2027-12-25', countries: [...WEST, 'Hong Kong', 'Singapore', 'Japan'], note: '' },
];
const PITCH_FROM = 84; // retailers start ordering about 12 weeks before a season
const PITCH_TO = 28; // and stop about 4 weeks before it
const TZ_CITY = { London: 'Europe/London', Birmingham: 'Europe/London', Manchester: 'Europe/London', Glasgow: 'Europe/London', Leeds: 'Europe/London', Edinburgh: 'Europe/London', Dubai: 'Asia/Dubai', 'Abu Dhabi': 'Asia/Dubai', Sharjah: 'Asia/Dubai', 'New York': 'America/New_York', 'Los Angeles': 'America/Los_Angeles', Houston: 'America/Chicago', Chicago: 'America/Chicago', Miami: 'America/New_York', Dallas: 'America/Chicago', 'San Francisco': 'America/Los_Angeles', Atlanta: 'America/New_York', 'Las Vegas': 'America/Los_Angeles', Toronto: 'America/Toronto', Vancouver: 'America/Vancouver', Montreal: 'America/Toronto', Calgary: 'America/Edmonton', Sydney: 'Australia/Sydney', Melbourne: 'Australia/Melbourne', Brisbane: 'Australia/Brisbane', Perth: 'Australia/Perth' };
const TZ_COUNTRY = { 'United Kingdom': 'Europe/London', 'United Arab Emirates': 'Asia/Dubai', 'United States': 'America/New_York', Canada: 'America/Toronto', Australia: 'Australia/Sydney', Germany: 'Europe/Berlin', Italy: 'Europe/Rome', France: 'Europe/Paris', Netherlands: 'Europe/Amsterdam', Belgium: 'Europe/Brussels', Spain: 'Europe/Madrid', 'Hong Kong': 'Asia/Hong_Kong', Singapore: 'Asia/Singapore', Israel: 'Asia/Jerusalem', 'Saudi Arabia': 'Asia/Riyadh', Qatar: 'Asia/Qatar', Kuwait: 'Asia/Kuwait', Bahrain: 'Asia/Bahrain', Japan: 'Asia/Tokyo', 'South Africa': 'Africa/Johannesburg', India: 'Asia/Kolkata', 'Türkiye': 'Europe/Istanbul', Turkey: 'Europe/Istanbul', Thailand: 'Asia/Bangkok' };
const LATE_SHOPS = [...GULF, 'Bahrain'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'CAD', 'AUD', 'HKD', 'SGD', 'JPY', 'ZAR', 'ILS', 'CHF', 'INR'];
const INCOTERMS = [['EXW', 'Ex works'], ['FOB', 'Free on board'], ['CIF', 'Cost, insurance and freight'], ['DAP', 'Delivered at place'], ['DDP', 'Delivered duty paid']];
const QUOTE_STATUS = [['draft', 'Draft'], ['sent', 'Sent'], ['accepted', 'Accepted'], ['declined', 'Declined']];
const QUOTE_LABEL = Object.fromEntries(QUOTE_STATUS);
const QUOTE_TONE = { draft: '', sent: 'accent', accepted: 'good', declined: '' };
const COURIERS = [['dhl', 'DHL'], ['fedex', 'FedEx'], ['ups', 'UPS'], ['aramex', 'Aramex'], ['malca', 'Malca-Amit'], ['brinks', "Brink's"], ['bvc', 'BVC'], ['post', 'Post'], ['other', 'Other']];
const COURIER_LABEL = Object.fromEntries(COURIERS);
const TRACK_URL = { dhl: 'https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=', fedex: 'https://www.fedex.com/fedextrack/?trknbr=', ups: 'https://www.ups.com/track?tracknum=' };
const SAMPLE_STATUS = [['sent', 'On the way'], ['delivered', 'Delivered'], ['kept', 'Kept, deciding'], ['returned', 'Returned'], ['ordered', 'Became an order']];
const SAMPLE_LABEL = Object.fromEntries(SAMPLE_STATUS);
const SAMPLE_TONE = { sent: 'accent', delivered: 'gold', kept: 'gold', returned: '', ordered: 'good' };
const ORDER_STATUS = [['pi', 'Proforma sent'], ['production', 'In production'], ['ready', 'Ready, balance due'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
const ORDER_LABEL = Object.fromEntries(ORDER_STATUS);
const ORDER_TONE = { pi: 'gold', production: 'accent', ready: 'warn', shipped: 'accent', delivered: 'good', cancelled: '' };
const ORDER_TRACK = [['pi', 'Proforma'], ['production', 'Production'], ['ready', 'Ready'], ['shipped', 'Shipped'], ['delivered', 'Delivered']];
const PAY_METHODS = [['bank', 'Bank transfer'], ['wise', 'Wise'], ['paypal', 'PayPal'], ['card', 'Card'], ['other', 'Other']];
const PAY_LABEL = Object.fromEntries(PAY_METHODS);
// Steps the owner ticks by hand. The rows marked uk only show for UK buyers.
const ORDER_CHECKS = [
  { k: 'cad', label: 'Designs or CAD approved by the buyer' },
  { k: 'photos', label: 'Photos and a video of the finished pieces sent' },
  { k: 'certs', label: 'Grading reports ready, each saying laboratory-grown' },
  { k: 'hallmark', label: 'UK hallmark arranged for gold over 1 g and silver over 7.78 g', uk: true },
  { k: 'invoice', label: 'Commercial invoice and packing list ready' },
  { k: 'origin', label: 'Proof of origin for 0% UK duty: origin declaration or certificate of origin', uk: true },
  { k: 'export', label: 'Export papers in India: IEC on the invoice, LUT for GST, shipping bill' },
  { k: 'insured', label: 'Insured courier booked and tracking sent to the buyer' },
];
// key, label in the calculator, fineness, short name for item descriptions
const METALS = [['silver925', '925 sterling silver', 0.925, '925 sterling silver'], ['gold9', '9K gold (375)', 0.375, '9K gold'], ['gold14', '14K gold (585)', 0.585, '14K gold'], ['gold18', '18K gold (750)', 0.75, '18K gold'], ['gold22', '22K gold (916)', 0.916, '22K gold'], ['gold10', '10K gold (417), not for the UK', 0.417, '10K gold']];
const PURITY = Object.fromEntries(METALS.map(([k, , p]) => [k, p]));
const METAL_SHORT = Object.fromEntries(METALS.map(([k, , , sh]) => [k, sh]));
const FX = [['GBP', '£'], ['USD', '$'], ['EUR', '€'], ['AED', 'AED ']];
const CUR_SYM = { GBP: '£', USD: '$', EUR: '€', INR: '₹' };
const EU = ['Germany', 'Italy', 'France', 'Netherlands', 'Belgium', 'Spain'];
const DEFAULT_TRADE = { iec: '', gstin: '', lut: '', beneficiary: '', bankName: '', bankBranch: '', accountNo: '', ifsc: '', swift: '', adCode: '', piPrefix: 'AD/PI', port: 'Mumbai, India', paymentTerms: '50% advance by bank transfer to confirm the order. Balance before dispatch, after we send photos and certificates of the finished pieces.' };
const DEFAULT_PRICING = { gold24: '', silver: '', wastage: 5, margin: 20, round: 5, rates: { GBP: '', USD: '', EUR: '', AED: '' }, ratesAt: '' };
const GMAIL = 'Gmail';
// Replies from Gmail: addresses on these free providers are matched one by one, never by domain
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'live.co.uk', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'btinternet.com', 'sky.com', 'virginmedia.com', 'talktalk.net', 'protonmail.com', 'proton.me', 'mail.com', 'gmx.com', 'gmx.co.uk', 'zoho.com']);
const SYNC_EVERY = 15 * 60000;
const AUTO_REPLY = /^\s*(auto(matic)?[\s-]*(reply|response)|out of (the )?office|away from (the )?office|on (annual )?leave|thank(s| you) for (your )?(e-?mail|message|enquiry|inquiry|contacting|getting in touch)|we('ve| have) received your)/i;
// Visits
const UK_ROUTE = ['London', 'Birmingham', 'Manchester', 'Leeds', 'Edinburgh', 'Glasgow'];
// Showrooms: OpenStreetMap's free services, called straight from the phone app (the copy inside Claude can't reach them)
const GEOCODER = 'https://nominatim.openstreetmap.org/search';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const POSTCODES_API = 'https://api.postcodes.io/postcodes';
const MAP_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_LIB = { js: 'vendor/leaflet/leaflet.js?v=1.9.4', css: 'vendor/leaflet/leaflet.css?v=1.9.4' };
// OpenStreetMap asks every app to say where its requests come from: this sends the app's address only, never the page
const OSM_REFERRER = 'strict-origin-when-cross-origin';
const CHAIN_NAMES = /^(the )?(pandora|goldsmiths|h\.? ?samuel|ernest jones|beaverbrooks|warren james|swarovski|mappin (&|and) webb|fraser hart|f\.? ?hinds|michael hill|tiffany|cartier|bulgari|bvlgari|chopard|van cleef|boodles|links of london|thomas sabo|clogau|fields|argento|claire'?s|lovisa|accessorize|astrid (&|and) miyu|monica vinader|missoma|abbott lyon|daisy london|laings|berry'?s|hugh rice|pragnell|david m\.? robinson|watches of switzerland|rolex|omega|tag heuer|chamilia|diamond store|77 diamonds|taylor (&|and) hart|steffans|john greed|t\.? ?h\.? baker|(mia by )?tanishq|caratlane|senco|p\.? ?c\.? chandra|b\.? ?c\.? sen jewel\w*|anjali jewel\w*|kalyan jewel\w*|malabar gold|joyalukkas|jos alukkas|giva|melorra|candere|reliance jewels|p\.? ?n\.? gadgil|png jewel\w*|tribhovandas bhimji|tbz|kirtilals|grt jewel\w*|lalithaa|khazana jewel\w*|bhima jewel\w*|manubhai|waman hari pethe|pc jewell?er\w*|chandrani pearls|damas|pure gold jewel\w*)\b/i;
const SHARED_HOSTS = /(^|\.)(facebook\.com|instagram\.com|linktr\.ee|google\.com|wixsite\.com|business\.site|square\.site|etsy\.com|ebay\.co\.uk|ebay\.com|amazon\.co\.uk|yell\.com|tiktok\.com|x\.com|twitter\.com)$/;
const SHOWN_STEP = 40;
// Claude's background look-ups: how often its scheduled check runs, and how many shops it does each time
const RESEARCH_EVERY_H = 1;
const RESEARCH_BATCH = 30;
const RESEARCH_KEYS = ['website', 'email', 'phone', 'instagram', 'facebook', 'person'];
const VISIT_OUTCOMES = [['interested', 'Interested'], ['samples', 'Wants samples'], ['not_now', 'Not now'], ['no', 'Not interested']];
const VISIT_LABEL = Object.fromEntries(VISIT_OUTCOMES);
const VISIT_TEMPLATE = { subject: 'Visiting {{city}} on {{visit_date}}', body: "Hello {{contact}},\n\nI'm {{sender}} from {{company}}. We make jewellery set with lab-grown diamonds in India: {{products}}.\n\nI'll be in {{city}} on {{visit_date}}. Could I stop by {{business}} for 15 minutes around {{visit_time}} to show you a few pieces? If another time suits you better, just reply with it.\n\nBest regards,\n{{sender}}\n{{company}}" };
const SEGMENTS = [['leads', 'Everyone who replied'], ['open', 'Leads without an order yet'], ['customers', 'Customers who ordered'], ['noreply', 'No reply after the follow-up'], ['all', 'Everyone you have contacted']];
const SEGMENT_LABEL = Object.fromEntries(SEGMENTS);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const QR_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.2/qrcode.min.js';
const DEFAULT_SETTINGS = {
  company: { name: '', senderName: '', senderEmail: '', whatsapp: '', website: '', address: '' },
  links: { catalogue: '', priceList: '' },
  sending: { dailyCap: 25 },
  sequence: DEFAULT_SEQUENCE,
  sequences: { fair: DEFAULT_FAIR_SEQUENCE, retry: DEFAULT_RETRY_SEQUENCE },
  rules: DEFAULT_RULES,
  answers: DEFAULT_ANSWERS,
  translations: {},
  trade: DEFAULT_TRADE,
  pricing: DEFAULT_PRICING,
};
const CONNECTIONS = [
  { key: 'email', name: 'Email sending', icon: 'mail', does: (days) => `Sends the ${days.email || 'campaign'} emails by itself, 25 new shops a day, and pulls replies into Leads.`, needs: ['The Gmail address the emails should come from', 'Your go-ahead to start sending'] },
  { key: 'whatsapp', name: 'WhatsApp Business', icon: 'bubble', does: (days) => `Sends the ${days.whatsapp || 'WhatsApp'} catalogue and prices to shops that said yes to WhatsApp, and brings every WhatsApp reply into Leads.`, needs: ['A Meta Business account for Ark Diamond (business.facebook.com), with the business verified', 'A phone number for WhatsApp Business that is not on the WhatsApp app', 'Two message templates approved by Meta: catalogue and prices', 'Then send Claude the WhatsApp Business account ID and a permanent access token'] },
  { key: 'instagram', name: 'Instagram', icon: 'camera', does: 'Brings the DMs shops send you into Leads, so you answer from the app. First messages to new shops stay a task for you: Instagram does not let apps send them.', needs: ['Switch your Instagram to a professional (business) account', 'Link it to your Facebook page', 'Then tell Claude, who connects it'] },
  { key: 'facebook', name: 'Facebook', icon: 'people', does: 'Brings messages to your Facebook page into Leads. First messages to shops stay a task for you.', needs: ['Your Facebook business page', 'Then tell Claude, who connects it'] },
  { key: 'linkedin', name: 'LinkedIn', icon: 'briefcase', does: 'Stays a task for you: LinkedIn does not let apps send messages. The campaign writes each note and reminds you on the day.', needs: ['The LinkedIn profile that will send the notes'] },
  { key: 'data', name: 'Showrooms and research', icon: 'pin', on: true, does: 'Finds every jewellery showroom in the city you choose (OpenStreetMap). Claude then adds emails, owners, company details and online sellers, about 30 shops an hour.', needs: ['Working now'] },
  { key: 'catalogue', name: 'Catalogue and prices', icon: 'gem', does: 'Fills the catalogue and price-list links in every message.', needs: ['Your catalogue link and price list link, in Your company below'] },
];

/* ================= utilities ================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const nowIso = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
function toDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
const todayStr = () => toDateStr(new Date());
function parseDate(s) { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return toDateStr(d); }
function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
const hoursSince = (iso) => (Date.now() - Date.parse(iso)) / 3600000;
function fmtDay(s) { if (!s) return '—'; const d = parseDate(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtDate(s) { if (!s) return '—'; const d = parseDate(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtRange(a, b) {
  if (!b || a === b) return fmtDate(a);
  const x = parseDate(a), y = parseDate(b);
  if (x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth()) return `${x.getDate()}–${y.getDate()} ${MONTHS[y.getMonth()]} ${y.getFullYear()}`;
  if (x.getFullYear() === y.getFullYear()) return `${x.getDate()} ${MONTHS[x.getMonth()]} – ${y.getDate()} ${MONTHS[y.getMonth()]} ${y.getFullYear()}`;
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}
const num2 = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (n, cur) => `${cur || 'USD'} ${num2(n)}`;
function countryList(list, n = 4) { return list.length > n ? `${list.slice(0, n).join(', ')} and ${list.length - n} more` : list.join(', '); }
function fmtWhen(iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function fmtTime(d) { return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
function fmtWait(h) { if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`; if (h < 48) return `${Math.round(h)} h`; return `${Math.round(h / 24)} days`; }
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; try { const x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') && x.hostname.includes('.') ? x.href : ''; } catch { return ''; } }
function igUrl(h) { h = String(h || '').trim(); if (!h) return ''; if (/^https?:/i.test(h) || h.includes('instagram.com')) return safeUrl(h); const name = h.replace(/^@/, '').replace(/[^\w.]/g, ''); return name ? `https://www.instagram.com/${name}/` : ''; }
function waUrl(num, text) { const d = String(num || '').replace(/\D/g, ''); return d.length >= 7 ? `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}` : ''; }

/* ================= icons ================= */
const ICONS = {
  inbox: '<path d="M3 13h5l1.5 2.5h5L16 13h5"/><path d="M5.5 5h13L21 13v6H3v-6z"/>',
  pin: '<path d="M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5M10 20v-5h4v5"/>',
  chat: '<path d="M4 5h16v11H9.5L4 20z"/>',
  bars: '<path d="M5 20v-8M12 20V5M19 20v-5"/>',
  route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h7.5a3 3 0 0 1 0 6h-7a3 3 0 0 0 0 6H16"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  bubble: '<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z"/>',
  camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.3"/><path d="M15.6 14.3A4.5 4.5 0 0 1 21 18.5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12.5h18"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
  gem: '<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17h.01"/>',
  spark: '<path d="M12 3.5l1.7 4.6 4.8 1.9-4.8 1.9L12 16.5l-1.7-4.6L5.5 10l4.8-1.9z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  download: '<path d="M12 4v11M7 10.5l5 4.5 5-4.5M5 20h14"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 10.5H5.5v10h13v-10H17"/>',
  upload: '<path d="M12 15V4M7 8.5 12 4l5 4.5M5 20h14"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  megaphone: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
  receipt: '<path d="M6 3.5h12V21l-2.4-1.5L13 21l-2.4-1.5L8 21l-2-1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
  map: '<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>',
  chev: '<path d="m7 10 5 5 5-5"/>',
  next: '<path d="m9.5 6 6 6-6 6"/>',
  meet: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7h7M9 11h.01M12 11h.01M15 11h.01M9 14.5h.01M12 14.5h.01M15 14.5h.01M9 18h.01M12 18h.01M15 18h.01"/>',
};
const ico = (n, cls = 'svg') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const CH_ICON = { email: 'mail', whatsapp: 'bubble', instagram: 'camera', facebook: 'people', linkedin: 'briefcase', phone: 'phone', visit: 'pin' };
const chIco = (c) => ico(CH_ICON[c] || 'chat');
const chLabel = (c) => `<span class="ch">${chIco(c)}${esc(CH_LABEL[c] || c || '')}</span>`;

/* ================= state ================= */
const S = {
  mode: 'loading',
  loaded: { campaigns: false, businesses: false, settings: false, places: false, research: false },
  campaigns: new Map(),
  businesses: new Map(),
  quotes: new Map(),
  samples: new Map(),
  broadcasts: new Map(),
  posts: new Map(),
  orders: new Map(),
  prices: new Map(),
  trips: new Map(),
  inbox: new Map(),
  places: new Map(),
  research: new Map(),
  meetings: new Map(),
  team: [],
  teamState: 'idle',
  me: null,
  researchBusy: false,
  settingsDoc: null,
  suppressDoc: null,
  route: { view: 'today', id: null },
  filters: { buyers: { q: '', country: '', city: '', type: '', status: '', lab: '' }, leads: { view: '', tab: 'needs', stage: '', shops: 'all', q: '' }, city: { tab: 'review' }, reports: { country: '', city: '', period: 'all' }, calendar: { country: null }, places: { q: '', tab: 'ind' }, orders: { q: '', tab: 'open' }, posts: 'idea' },
  selection: new Set(),
  layer: null,
  form: {},
  ui: { findOpen: {}, openPlaces: new Set(), placeShown: {}, histAll: {}, buyersShown: 100, calAll: false, orderPanel: '', visitOpen: '', tripMail: '', menu: '', placeSel: '', placePan: '', placesShown: SHOWN_STEP },
  find: { key: '', busy: false, step: '', error: '' },
  findTried: new Set(),
  ai: { sample: null, images: null, off: false, busy: '', ctl: null, advice: '' },
  downloads: null,
  device: null,
  mailOpened: new Set(),
  watchDoc: null,
  inboxBusy: false,
  confirmKey: '',
  seqTab: 'city',
  seqDraft: null,
  trDraft: null,
  quoteDraft: null,
  orderDraft: null,
  perm: null,
  pc: {},
  rt: {},
  gm: { api: null, state: 'off', account: '', note: '', checking: false, busy: '', confirm: '', batch: null, gap: 2500, used: false, sync: { running: false, at: '', added: 0, bounced: 0, error: '' } },
  ansEdit: '',
  qr: 'idle',
};
let DB = null;

function settings() {
  const s = S.settingsDoc || {};
  const seqs = s.sequences && typeof s.sequences === 'object' ? s.sequences : {};
  const list = (v, d) => (Array.isArray(v) && v.length ? v : d);
  return {
    company: { ...DEFAULT_SETTINGS.company, ...(s.company || {}) },
    links: { ...DEFAULT_SETTINGS.links, ...(s.links || {}) },
    sending: { ...DEFAULT_SETTINGS.sending, ...(s.sending || {}) },
    sequence: list(s.sequence, DEFAULT_SEQUENCE),
    sequences: { fair: list(seqs.fair, DEFAULT_FAIR_SEQUENCE), retry: list(seqs.retry, DEFAULT_RETRY_SEQUENCE) },
    rules: { ...DEFAULT_RULES, ...(s.rules || {}) },
    answers: Array.isArray(s.answers) ? s.answers : DEFAULT_ANSWERS,
    translations: s.translations && typeof s.translations === 'object' ? s.translations : {},
    trade: { ...DEFAULT_TRADE, ...(s.trade || {}) },
    gmailSync: s.gmailSync && typeof s.gmailSync === 'object' ? s.gmailSync : {},
    inboxSync: s.inboxSync && typeof s.inboxSync === 'object' ? s.inboxSync : {},
    pricing: { ...DEFAULT_PRICING, ...(s.pricing || {}), rates: { ...DEFAULT_PRICING.rates, ...((s.pricing || {}).rates || {}) } },
    focus: focusFrom(s.focus),
  };
}
function focusFrom(f) { return f && typeof f === 'object' && 'country' in f ? { country: String(f.country || ''), city: f.country ? String(f.city || '') : '' } : defaultFocus(); }
// Until you choose, the app starts on the one country all your buyers are in, or everywhere if they're spread out.
let focusGuess = { map: null, size: -1, country: '' };
function defaultFocus() {
  if (focusGuess.map !== S.businesses || focusGuess.size !== S.businesses.size) {
    const cs = new Set(); for (const b of S.businesses.values()) if (b.country) cs.add(b.country);
    focusGuess = { map: S.businesses, size: S.businesses.size, country: cs.size === 1 ? [...cs][0] : '' };
  }
  return { country: focusGuess.country, city: '' };
}
const allBiz = () => [...S.businesses.values()];
const bizOf = (cid) => allBiz().filter((b) => b.campaignId === cid);
const campOf = (b) => S.campaigns.get(b.campaignId);
const isPaused = (b) => !!(campOf(b) && campOf(b).paused);
const contactOf = (b) => b.contact || {};
const quotesOf = (bid) => [...S.quotes.values()].filter((q) => q.businessId === bid).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
const samplesOf = (bid) => [...S.samples.values()].filter((x) => x.businessId === bid).sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
/* ---------- where you're working: one country or one city. Every screen, and Claude's daily checks, keep to it ---------- */
const placeText = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+upon\s+tyne\b/, '').replace(/[^a-z0-9]+/g, '');
const focusNow = () => settings().focus;
function inFocus(x, f = focusNow()) { return !!x && (!f.country || placeText(x.country) === placeText(f.country)) && (!f.city || placeText(x.city) === placeText(f.city)); }
const focusBiz = () => { const f = focusNow(); return allBiz().filter((b) => inFocus(b, f)); };
const focusName = (f = focusNow()) => f.city || f.country || 'Everywhere';
function orderInFocus(o, f = focusNow()) { const b = S.businesses.get(o.businessId); return b ? inFocus(b, f) : !f.city && (!f.country || placeText((o.buyer || {}).country) === placeText(f.country)); }
const focusOrders = () => { const f = focusNow(); return [...S.orders.values()].filter((o) => orderInFocus(o, f)); };
function cityOptions(country) {
  const seen = new Map(); const add = (c) => { const k = placeText(c); if (c && k && !seen.has(k)) seen.set(k, String(c).trim()); };
  (PLACES[country] || []).forEach(add);
  for (const b of allBiz()) if (placeText(b.country) === placeText(country)) add(b.city);
  for (const d of S.places.values()) if (placeText(d.country) === placeText(country)) add(d.city);
  const f = focusNow(); if (placeText(f.country) === placeText(country)) add(f.city);
  return [...seen.values()];
}
const focusCountries = () => [...new Set([...Object.keys(PLACES), ...allBiz().map((b) => b.country).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
async function setFocus(next) {
  const f = { country: String(next.country || '').trim(), city: next.country ? String(next.city || '').trim() : '' };
  Object.assign(S.ui, { placeSel: '', placePan: '', placesShown: SHOWN_STEP, menu: '' }); S.filters.places.q = '';
  Object.assign(S.filters.buyers, { country: '', city: '' }); Object.assign(S.filters.reports, { country: '', city: '' }); S.filters.calendar.country = null;
  const ok = await write(() => saveSettings({ focus: f }));
  if (ok) toast(`Working on ${focusName(f)}`);
  return ok;
}

/* ================= data layer ================= */
function mapFor(coll) { return { campaigns: S.campaigns, businesses: S.businesses, quotes: S.quotes, samples: S.samples, broadcasts: S.broadcasts, posts: S.posts, orders: S.orders, prices: S.prices, trips: S.trips, inbox: S.inbox, places: S.places, research: S.research, meetings: S.meetings }[coll] || null; }
function deepMerge(base, patch) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = clone(v);
  }
  return out;
}
/* Every write lands in local state first, so the screen and follow-on logic see it at once;
   with the shared database, its snapshots then replace local state with the saved truth. */
function applyLocal(op, coll, id, obj) {
  if (coll === 'config') { const key = id === 'suppression' ? 'suppressDoc' : id === 'watch' ? 'watchDoc' : 'settingsDoc'; S[key] = op === 'set' ? clone(obj) : op === 'update' ? deepMerge(S[key], obj) : null; schedule(); return; }
  const m = mapFor(coll); if (!m) return;
  if (op === 'set') m.set(id, { ...clone(obj), id });
  else if (op === 'update') { const cur = m.get(id); if (cur) m.set(id, deepMerge(cur, obj)); }
  else m.delete(id);
  schedule();
}
const Data = {
  newId(coll) { return DB ? DB.collection(coll).doc().id : uid(); },
  async set(coll, id, obj) {
    applyLocal('set', coll, id, obj);
    if (DB) await DB.collection(coll).doc(id).set(obj);
  },
  async update(coll, id, patch) {
    const m = mapFor(coll);
    if (!DB && m && !m.get(id)) throw { code: 'invalid_argument', message: 'missing document' };
    applyLocal('update', coll, id, patch);
    if (DB) await DB.collection(coll).doc(id).update(patch);
  },
  async remove(coll, id) {
    applyLocal('remove', coll, id);
    if (DB) await DB.collection(coll).doc(id).delete();
  },
  // many records at once: one call on the phone app, one by one elsewhere
  async setMany(coll, items) {
    if (!items.length) return;
    for (const [id, obj] of items) applyLocal('set', coll, id, obj);
    if (DB && typeof DB.setMany === 'function') await DB.setMany(coll, items);
    else if (DB) for (const [id, obj] of items) await DB.collection(coll).doc(id).set(obj);
  },
  async updateMany(coll, items) {
    const m = mapFor(coll); items = items.filter(([id]) => !m || m.get(id)); if (!items.length) return;
    for (const [id, patch] of items) applyLocal('update', coll, id, patch);
    if (DB && typeof DB.updateMany === 'function') await DB.updateMany(coll, items);
    else if (DB) for (const [id, patch] of items) await DB.collection(coll).doc(id).update(patch);
  },
};
const saveSettings = (patch) => Data.set('config', 'settings', { ...(S.settingsDoc ? clone(S.settingsDoc) : {}), ...patch });
function errorText(e) {
  const c = e && e.code;
  if (c === 'quota_exceeded') return `The app is full (${CAP.toLocaleString('en-US')} records). Remove a finished city or the example data, then try again.`;
  if (c === 'resource_exhausted') return 'Too many changes at once. Wait a moment and try again.';
  if (c === 'revoked' || c === 'not_granted' || c === 'capability_disabled') return "This view can't save changes.";
  if (c === 'unavailable') return 'Saving paused for a moment. Try again.';
  return "That didn't save. Try again.";
}
async function write(fn) { try { await fn(); return true; } catch (e) { console.warn(e); toast(errorText(e)); return false; } }
const updateBiz = (id, patch) => Data.update('businesses', id, { ...patch, updatedAt: nowIso() });

// The name of whoever is signed in: a team member's own name, otherwise the sender name on your messages.
function myName() {
  if (S.me && String(S.me.name || '').trim()) return String(S.me.name).trim();
  const first = String(settings().company.senderName || '').trim().split(/\s+/)[0];
  if (first) return first;
  const email = S.device && typeof S.device.account === 'function' ? S.device.account() : '';
  return email ? email.split('@')[0] : 'You';
}
/* ================= sequence engine ================= */
function seqOf(kind, st) { st = st || settings(); return kind === 'fair' ? st.sequences.fair : kind === 'retry' ? st.sequences.retry : st.sequence; }
function stepsFor(kind, st) { return seqOf(kind || 'city', st).slice().sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0)); }
function allSteps(st) { st = st || settings(); return [...st.sequence, ...st.sequences.fair, ...st.sequences.retry]; }
function seqKindOf(b) { return b.seqKind || ((campOf(b) || {}).kind === 'fair' && b.source !== 'import' ? 'fair' : 'city'); }
function effectiveChannel(step, b) {
  const c = contactOf(b);
  if (step.channel === 'whatsapp' && !b.waOptIn) return 'phone';
  if (step.channel === 'instagram' && !c.instagram && c.facebook) return 'facebook';
  return step.channel;
}
// A step a shop can't receive is left out for that shop: no email, no Instagram, no phone, or (for the second
// WhatsApp) no opt-in. The campaign then finishes with the steps that can reach them.
function stepApplies(step, b) {
  const c = contactOf(b); const has = (v) => !!String(v || '').trim();
  if (step.optinOnly && !b.waOptIn) return false;
  const ch = effectiveChannel(step, b);
  if (ch === 'email') return has(c.email);
  if (ch === 'phone' || ch === 'whatsapp') return has(c.phone) || has(c.whatsapp);
  if (ch === 'instagram' || ch === 'facebook') return has(c.instagram) || has(c.facebook);
  if (ch === 'linkedin') return has(c.linkedin) || has(c.person);
  return true;
}
const reachable = (b) => stepsFor(seqKindOf(b)).some((step) => stepApplies(step, b));
function stepState(b, st) {
  const today = todayStr();
  return stepsFor(seqKindOf(b), st).map((step) => {
    const due = b.seqStart ? addDays(b.seqStart, Number(step.day) || 0) : null;
    const done = b.done && b.done[step.id]; const na = !done && !stepApplies(step, b);
    return { step, due, done, na, channel: effectiveChannel(step, b), isDue: !!(due && !done && !na && due <= today) };
  });
}
function dayList(ch) {
  const ds = stepsFor().filter((s) => s.channel === ch).map((s) => Number(s.day) || 0);
  if (!ds.length) return '';
  return 'day ' + (ds.length === 1 ? ds[0] : `${ds.slice(0, -1).join(', ')} and ${ds[ds.length - 1]}`);
}
function dueStepsFor(b, st) { if (b.status !== 'active' || !b.seqStart || isPaused(b)) return []; return stepState(b, st).filter((x) => x.isDue); }
function nextLabel(b) {
  if (b.status === 'active') {
    const nx = stepState(b, settings()).find((x) => !x.done && !x.na);
    if (!nx) return 'Finishing';
    const d = daysBetween(todayStr(), nx.due);
    return `${CH_LABEL[nx.channel]} ${d < 0 ? `overdue ${-d} d` : d === 0 ? 'today' : `in ${d} d`}`;
  }
  if (b.status === 'approved') return 'Ready to start';
  if (b.status === 'found') return 'Approve or reject';
  if (b.lead && b.lead.awaitingReply) return 'Reply to them';
  if (b.lead && b.lead.followUpAt) return `Follow up ${fmtDay(b.lead.followUpAt)}`;
  return '—';
}
function needsReply(b) { const l = b.lead; if (!l || !l.awaitingReply) return false; if (l.remindAt && Date.parse(l.remindAt) > Date.now()) return false; return true; }
function nextMorning(fromIso) { const d = new Date(fromIso); const m = new Date(d); m.setHours(9, 0, 0, 0); if (m <= d) m.setDate(m.getDate() + 1); return m; }
function nextReminder(l) {
  if (l.remindAt && Date.parse(l.remindAt) > Date.now()) return new Date(l.remindAt);
  const c = [new Date(Date.parse(l.lastInAt) + 2 * 3600000), nextMorning(l.lastInAt)].filter((d) => d > new Date());
  return c.length ? c.sort((a, b) => a - b)[0] : null;
}
function reminderText(l) {
  const r = nextReminder(l);
  if (!r) return 'reminding you now';
  const same = toDateStr(r) === todayStr();
  const tmr = toDateStr(r) === addDays(todayStr(), 1);
  return `next reminder ${same ? 'today' : tmr ? 'tomorrow' : fmtDay(toDateStr(r))} at ${fmtTime(r)}`;
}
function windowChip(lastInAt, channel) {
  if (!META_24H.includes(channel) || !lastInAt) return '';
  const left = 24 - hoursSince(lastInAt);
  if (left <= 0) return '<span class="chip bad">24-hour window closed</span>';
  return `<span class="chip ${left < 6 ? 'warn' : ''}">${Math.max(1, Math.floor(left))} h left in the 24-hour window</span>`;
}
function fitScore(b) {
  const c = contactOf(b); let s = 0;
  if (c.email) s += 30; if (c.website) s += 10; if (c.instagram || c.facebook) s += 15; if (c.phone || c.whatsapp) s += 10; if (c.person) s += 10; if (c.linkedin) s += 5;
  if (['independent', 'chain', 'online', 'bridal', 'wholesaler'].includes(b.type)) s += 10;
  if (b.labGrown) s += 20;
  return Math.min(100, s);
}
async function startSequence(ids, opts = {}) {
  const st = settings(); const cap = Math.max(1, Number(st.sending.dailyCap) || 40);
  const counts = {};
  for (const b of allBiz()) if (b.seqStart && (b.status === 'active' || b.status === 'replied')) counts[b.seqStart] = (counts[b.seqStart] || 0) + 1;
  let day = todayStr(); let started = 0, blocked = 0; const firstDay = day; let lastDay = day;
  for (const id of ids) {
    const b = S.businesses.get(id); if (!b) continue;
    if (opts.retry ? b.status !== 'closed' : b.status !== 'approved') continue;
    if (isSuppressed(contactOf(b).email)) { blocked++; await write(() => updateBiz(id, { status: 'unsubscribed' })); continue; }
    while ((counts[day] || 0) >= cap) day = addDays(day, 1);
    counts[day] = (counts[day] || 0) + 1; lastDay = day;
    let ok;
    if (opts.retry) {
      const { id: _drop, ...rest } = clone(b);
      const rounds = [...(b.rounds || []), { kind: seqKindOf(b), seqStart: b.seqStart, done: b.done || {}, endedAt: b.closedAt || nowIso() }].slice(-5);
      ok = await write(() => Data.set('businesses', id, { ...rest, status: 'active', seqKind: 'retry', round: (Number(b.round) || 1) + 1, rounds, seqStart: day, done: {}, closedAt: null, updatedAt: nowIso() }));
    } else {
      const kind = (campOf(b) || {}).kind === 'fair' && b.source !== 'import' ? 'fair' : 'city';
      ok = await write(() => updateBiz(id, { status: 'active', seqKind: kind, seqStart: day, done: {}, closedAt: null }));
    }
    if (ok) started++;
  }
  const what = opts.retry ? 'Second try' : 'Sequence';
  if (started) toast(started === 1 ? `${what} started` : `${what} started for ${started} buyers${lastDay !== firstDay ? `, spread to ${fmtDay(lastDay)} by your daily limit` : ''}`);
  else toast(blocked ? 'Those buyers are on your do-not-contact list.' : opts.retry ? 'No buyers are ready for a second try.' : 'Approve buyers first, then start the sequence.');
  return started;
}
// Starts the campaign for many shops at once. Best fits go first, and the daily limit decides each shop's first
// day. Shops already contacted, on the do-not-contact list, or with no way to reach them yet are left as they are.
function startable(b) { return !!b && ['found', 'approved'].includes(b.status) && !isSuppressed(contactOf(b).email); }
function campaignPlan(ids, cap) {
  cap = Math.max(1, Number(cap || settings().sending.dailyCap) || 25);
  const counts = {};
  for (const b of allBiz()) if (b.seqStart && b.status === 'active') counts[b.seqStart] = (counts[b.seqStart] || 0) + 1;
  const pick = ids.map((id) => S.businesses.get(id)).filter(startable);
  const go = pick.filter(reachable).sort((a, b) => fitScore(b) - fitScore(a) || a.name.localeCompare(b.name));
  let day = todayStr(); const days = [];
  for (const b of go) { while ((counts[day] || 0) >= cap) day = addDays(day, 1); counts[day] = (counts[day] || 0) + 1; days.push([b, day]); }
  return { cap, days, waiting: pick.filter((b) => !reachable(b)), first: days.length ? days[0][1] : '', last: days.length ? days[days.length - 1][1] : '' };
}
async function startCampaign(ids, cap) {
  const plan = campaignPlan(ids, cap); const at = nowIso(); const by = myName();
  const items = plan.days.map(([b, day]) => [b.id, { status: 'active', approvedAt: b.approvedAt || at, seqKind: (campOf(b) || {}).kind === 'fair' && b.source !== 'import' ? 'fair' : 'city', seqStart: day, done: {}, closedAt: null, startedBy: by, updatedAt: at }]);
  if (!items.length) return { ...plan, started: 0 };
  const ok = await write(() => Data.updateMany('businesses', items));
  return { ...plan, started: ok ? items.length : 0 };
}
async function markStep(b, stepId, how, extra) {
  const kind = seqKindOf(b); const steps = stepsFor(kind); const step = steps.find((x) => x.id === stepId);
  const done = { ...(b.done || {}) }; done[stepId] = { at: nowIso(), how, by: myName(), ...(extra || {}) };
  if (step && how === 'sent' && hasVariantB(step)) done[stepId].variant = variantFor(b, step);
  const patch = { done };
  if (how === 'bounced') patch.status = 'bounced';
  else if (steps.every((x) => done[x.id] || !stepApplies(x, b)) && b.status === 'active') { patch.status = 'closed'; patch.closedAt = nowIso(); }
  return write(() => updateBiz(b.id, patch));
}

/* ================= messages ================= */
const goldKarats = (country) => (country === 'United Kingdom' ? '14K, 18K and 22K' : '10K, 14K, 18K and 22K');
// Silver comes plain or plated with 10K, 14K or 18K gold; 10K is left out for the UK, where it isn't a legal gold standard.
const platingKarats = (country) => (country === 'United Kingdom' ? '14K or 18K' : '10K, 14K or 18K');
const UK = 'United Kingdom';
// UK trade guidance (NAJ, assured by Trading Standards; ASA agrees) wants "laboratory-grown" written in full, never the short "lab-grown".
const labTerm = (country) => (country === UK ? 'laboratory-grown' : 'lab-grown');
function localTerms(text, country) {
  const t = String(text || '');
  return country === UK ? t.replace(/\blab[- ](grown|created)\b/gi, (m, w) => (m[0] === 'L' ? 'Laboratory-' : 'laboratory-') + w.toLowerCase()) : t;
}
// UK email law (PECR): limited companies, PLCs and LLPs may get B2B offers by email without asking first, with an opt-out in every email.
// Sole traders and ordinary partnerships must agree first.
const LEGAL_FORMS = [['ltd', 'Limited company (Ltd)'], ['plc', 'PLC'], ['llp', 'LLP'], ['sole', 'Sole trader'], ['partnership', 'Partnership']];
const LEGAL_LABEL = Object.fromEntries(LEGAL_FORMS);
const UK_EMAIL_RULE = 'UK rule: you can email limited companies (Ltd, PLC, LLP) as long as every email has an opt-out. Sole traders and partnerships must agree first, so call them or use their contact form.';
const needsConsent = (b) => !!b && b.country === UK && !['ltd', 'plc', 'llp'].includes(b.legalForm || '');
function consentNote(b) {
  if (!needsConsent(b)) return '';
  return ['sole', 'partnership'].includes(b.legalForm) ? 'UK sole traders and partnerships must agree before you email them an offer' : 'Check this is a limited company before emailing (UK rule)';
}
function consentChip(b) {
  if (!needsConsent(b)) return '';
  return `<span class="chip warn">${['sole', 'partnership'].includes(b.legalForm) ? 'Needs a yes before email' : 'Company type not checked'}</span>`;
}
function companyHtml(b) {
  if (!b.legalForm && !b.companyNo) return b.country === UK ? 'Not checked' : '';
  const no = String(b.companyNo || '').trim();
  const link = no && b.country === UK ? `<a href="https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(no)}" target="_blank" rel="noopener">Companies House ${esc(no)}</a>` : esc(no);
  return [b.legalForm ? esc(LEGAL_LABEL[b.legalForm] || b.legalForm) : '', link].filter(Boolean).join(' · ');
}
function legalFrom(x) {
  const t = String(x || '').toLowerCase();
  if (/\bllp\b|limited liability partnership/.test(t)) return 'llp';
  if (/\bplc\b|public limited/.test(t)) return 'plc';
  if (/\bltd\b|limited/.test(t)) return 'ltd';
  if (/sole/.test(t)) return 'sole';
  if (/partner/.test(t)) return 'partnership';
  return '';
}
function productsText(lines, country) {
  const has = (k) => !Array.isArray(lines) || !lines.length || lines.includes(k);
  const metals = [has('silver') ? `925 sterling silver (plain, or plated with ${platingKarats(country)} gold)` : '', has('gold') ? `solid ${goldKarats(country)} gold` : ''].filter(Boolean);
  if (!metals.length) return has('moissanite') ? 'moissanite jewellery, made to order' : 'fine jewellery';
  return metals.join(' and ') + (has('moissanite') ? ', with moissanite made to order' : '');
}
function fillMap(b) {
  const st = settings(); const c = campOf(b) || {}; const co = st.company;
  const country = b.country || c.country || '';
  return {
    fair: c.kind === 'fair' ? (c.fairName || c.city || '') : '[fair name]',
    booth: c.booth || '[booth]',
    fair_dates: c.kind === 'fair' && c.startDate ? fmtRange(c.startDate, c.endDate) : '[fair dates]',
    products: productsText(c.productLines, country),
    business: b.name || 'your store',
    contact: (contactOf(b).person || '').trim() || 'there',
    city: b.city || c.city || '',
    country,
    sender: co.senderName || '[your name]',
    company: co.name || '[your company]',
    catalogue_link: st.links.catalogue || '[catalogue link]',
    price_list_link: st.links.priceList || '[price list link]',
    whatsapp_link: co.whatsapp ? waUrl(co.whatsapp) : '[WhatsApp link]',
    gold_karats: goldKarats(country),
  };
}
function fill(text, b, extra) { const m = { ...fillMap(b), ...(extra || {}) }; return localTerms(text, m.country).replace(/\{\{(\w+)\}\}/g, (all, k) => (k in m ? m[k] : all)); }
function translationFor(b, step) {
  const lang = (campOf(b) || {}).language || 'English';
  const tr = settings().translations[lang];
  return Array.isArray(tr) ? tr.find((x) => x && x.id === step.id) || null : null;
}
function localized(step, b) {
  const t = translationFor(b, step);
  return t ? { ...step, subject: t.subject || step.subject, body: t.body || step.body, alt: t.alt || step.alt } : step;
}
const hasVariantB = (step) => !!(step && step.channel === 'email' && String(step.subjectB || '').trim());
function hashStr(x) { let h = 0; for (let i = 0; i < x.length; i++) h = (Math.imul(h, 31) + x.charCodeAt(i)) | 0; return Math.abs(h); }
// Half the buyers get the second subject line, picked by a stable hash so a buyer always sees the same one.
function variantFor(b, step) { return hasVariantB(step) && !translationFor(b, step) && hashStr(`${b.id}:${step.id}`) % 2 ? 'B' : 'A'; }
function stepText(b, step, channel) {
  const s = localized(step, b);
  if (channel === 'phone') return fill(s.alt || 'Call {{business}} during shop hours and ask whether our catalogue arrived.', b);
  return fill(s.body, b);
}
function emailFooter() {
  const co = settings().company;
  return [co.name ? `${co.name}${co.address ? ' · ' + co.address : ''}` : '', 'If you\'d rather not hear from us, reply "stop" and we won\'t email you again.'].filter(Boolean).join('\n');
}
function emailText(b, step) {
  const s = localized(step, b); const v = variantFor(b, step);
  return { subject: fill(v === 'B' ? step.subjectB : s.subject, b), body: `${fill(s.body, b)}\n\n--\n${emailFooter()}`, variant: hasVariantB(step) ? v : null };
}
function complianceIssues(text, country) {
  const own = String(settings().company.name || '').trim();
  let t = String(text || ''); const out = [];
  if (own) t = t.replace(new RegExp(own.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  const re = /\bdiamonds?\b/gi; let m;
  while ((m = re.exec(t))) {
    const before = t.slice(Math.max(0, m.index - 24), m.index).toLowerCase();
    if (!/(lab-grown|lab grown|laboratory-grown|laboratory-created|lab-created|synthetic|simulated)\s*$/.test(before)) { out.push(`"diamond" needs "${labTerm(country)}" right before it`); break; }
  }
  if (/\b(eco-friendly|eco friendly|sustainable|carbon neutral|ethical|green)\b/i.test(t)) out.push('Green claims such as "eco-friendly" are banned without proof in the EU');
  if (/\b(real|natural|genuine) diamonds?\b/i.test(t)) out.push('Avoid "real", "natural" or "genuine" next to diamond');
  if (country === 'United Kingdom' && /\b10\s?(k|kt|ct|carat)\b/i.test(t)) out.push('10K is not a legal gold standard in the UK');
  if (country === UK && /\blab[- ](grown|created)\b/i.test(t)) out.push('In the UK write "laboratory-grown" in full, not "lab-grown"');
  if (/!{2,}/.test(t) || /\b(guaranteed|risk-free|act now|cheapest|100% free)\b/i.test(t)) out.push('Words like "guaranteed" or "!!" can send email to spam');
  return out;
}
function channelLink(b, channel, text) {
  const c = contactOf(b);
  if (channel === 'instagram') return igUrl(c.instagram);
  if (channel === 'facebook') return safeUrl(c.facebook);
  if (channel === 'linkedin') return safeUrl(c.linkedin) || `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${b.name} ${b.city || ''}`.trim())}`;
  if (channel === 'whatsapp') return waUrl(c.whatsapp || c.phone, text);
  return '';
}

/* ================= replies and leads ================= */
async function logReply(id, { channel, text, at, tag, gmail }) {
  const b = S.businesses.get(id); if (!b) return false;
  const rules = settings().rules;
  const msg = { id: uid(), dir: 'in', channel, at, text: String(text || '').slice(0, MSG_MAX), tag: tag || null, loggedBy: gmail ? 'Gmail' : myName(), ...(gmail ? { gmailId: gmail.id, threadId: gmail.threadId, url: gmail.url, subject: gmail.subject } : {}) };
  const messages = [...(b.messages || []), msg].slice(-MSG_KEEP);
  const lead = { stage: 'new', createdAt: at, ordersValue: 0, replyHours: [], ...(b.lead || {}) };
  lead.awaitingReply = true; lead.lastInAt = at; lead.lastChannel = channel; lead.remindAt = null;
  if (!lead.afterStep) { const last = lastStepDone(b); if (last) lead.afterStep = last; }
  let status = b.status === 'unsubscribed' ? 'unsubscribed' : 'replied';
  if (tag === 'unsubscribe') { status = 'unsubscribed'; lead.awaitingReply = false; lead.stage = 'lost'; }
  if (tag === 'not_interested') lead.stage = 'lost';
  if (tag === 'not_now') { lead.stage = 'lost'; if (!lead.followUpAt || lead.followUpAt < todayStr()) lead.followUpAt = addDays(todayStr(), Number(rules.notNowDays) || 60); }
  const patch = { messages, lead, status };
  if (channel === 'whatsapp') patch.waOptIn = true;
  const ok = await write(() => updateBiz(id, patch));
  if (ok && tag === 'unsubscribe' && contactOf(b).email) await addSuppression([contactOf(b).email]);
  return ok;
}
// The last step we sent before they replied: tells the report which message worked.
function lastStepDone(b) {
  const kind = seqKindOf(b); const steps = stepsFor(kind);
  const sent = Object.entries(b.done || {}).filter(([, x]) => x && (x.how === 'sent' || x.how === 'done'));
  if (!sent.length) return null;
  const pos = (sid) => steps.findIndex((x) => x.id === sid);
  sent.sort((a, c) => String(a[1].at || '').localeCompare(String(c[1].at || '')) || pos(a[0]) - pos(c[0]));
  const [sid, x] = sent[sent.length - 1]; const st = steps.find((y) => y.id === sid) || allSteps().find((y) => y.id === sid);
  return { kind, id: sid, title: st ? st.title : sid, channel: st ? effectiveChannel(st, b) : '', day: st ? Number(st.day) || 0 : null, variant: x.variant || null };
}
async function markAnswered(id, text) {
  const b = S.businesses.get(id); if (!b || !b.lead) return;
  const at = nowIso(); const l = b.lead;
  const messages = [...(b.messages || [])];
  messages.push({ id: uid(), dir: 'out', channel: l.lastChannel || 'email', at, by: myName(), text: String(text || '').trim().slice(0, MSG_MAX) || '(answered outside the app)' });
  const hrs = l.lastInAt ? Math.max(0, (Date.parse(at) - Date.parse(l.lastInAt)) / 3600000) : null;
  const lead = { ...l, awaitingReply: false, lastOutAt: at, remindAt: null, replyHours: [...(l.replyHours || []), ...(hrs != null ? [Math.round(hrs * 10) / 10] : [])].slice(-30) };
  if (lead.stage === 'new') lead.stage = 'replied';
  const ok = await write(() => updateBiz(id, { messages: messages.slice(-MSG_KEEP), lead }));
  if (ok) { delete S.form['draft.' + id]; toast('Marked as answered'); }
}
function snoozeTime(when) {
  const d = new Date();
  if (when === '1h') return new Date(Date.now() + 3600000);
  if (when === 'monday') { const m = new Date(d); m.setDate(m.getDate() + ((8 - m.getDay()) % 7 || 7)); m.setHours(9, 0, 0, 0); return m; }
  const t = new Date(d); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0); return t;
}
async function ensureLead(id, stage) {
  const b = S.businesses.get(id); if (!b) return false;
  const patch = {};
  if (!b.lead) patch.lead = { stage, createdAt: nowIso(), awaitingReply: false, ordersValue: 0, orders: 0, replyHours: [], lastChannel: 'email', followUpAt: null, remindAt: null };
  else if (STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(b.lead.stage)) patch.lead = { stage };
  if (['active', 'found', 'approved'].includes(b.status)) patch.status = 'replied';
  if (!Object.keys(patch).length) return true;
  return write(() => updateBiz(id, patch));
}
// Days until a client is likely to order again: their own average gap once they've ordered twice, otherwise your rule.
function reorderGap(b) {
  const rule = Number(settings().rules.reorderDays) || 45; if (!b) return rule;
  const days = ordersOf(b.id).filter((o) => o.status !== 'cancelled').map((o) => String(o.piDate || o.createdAt || '').slice(0, 10)).filter(Boolean).sort();
  const gaps = days.slice(1).map((d, i) => daysBetween(days[i], d)).filter((g) => g > 0);
  if (!gaps.length) return rule;
  return Math.max(14, Math.min(180, Math.round(gaps.reduce((a, g) => a + g, 0) / gaps.length)));
}
async function logOrder(id, v, quiet) {
  const b = S.businesses.get(id); if (!b || !(v > 0)) return false;
  if (!b.lead) await ensureLead(id, 'new');
  const cur = S.businesses.get(id); const l = cur.lead || {}; const first = !l.firstOrderAt;
  const follow = addDays(todayStr(), reorderGap(cur));
  const patch = { lead: { ordersValue: (Number(l.ordersValue) || 0) + v, firstOrderAt: l.firstOrderAt || todayStr(), orders: (Number(l.orders) || 0) + 1, stage: first ? 'first_order' : 'repeat', followUpAt: follow } };
  if (['active', 'found', 'approved'].includes(cur.status)) patch.status = 'replied';
  const ok = await write(() => updateBiz(id, patch));
  if (ok && !quiet) toast(`Order of ${money(v)} logged. Reorder check-in set for ${fmtDay(follow)}.`);
  return ok;
}

/* ---------- do-not-contact list ---------- */
const emailDomain = (e) => String(e || '').trim().toLowerCase().split('@')[1] || '';
function cleanDomain(v) { return String(v || '').trim().toLowerCase().replace(/^@/, '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''); }
function suppressSets() {
  const d = S.suppressDoc || {};
  return { emails: new Set((d.emails || []).map((x) => String(x).toLowerCase())), domains: new Set((d.domains || []).map((x) => String(x).toLowerCase())) };
}
function isSuppressed(email) {
  const e = String(email || '').trim().toLowerCase(); if (!e) return false;
  const s = suppressSets(); return s.emails.has(e) || s.domains.has(emailDomain(e));
}
async function addSuppression(items) {
  const d = S.suppressDoc || {}; const emails = new Set(d.emails || []); const domains = new Set(d.domains || []);
  let n = 0;
  for (const raw of items) {
    const v = String(raw || '').trim().toLowerCase(); if (!v) continue;
    if (v.includes('@') && !v.startsWith('@')) { if (!emails.has(v)) { emails.add(v); n++; } }
    else { const dm = cleanDomain(v); if (dm.includes('.') && !domains.has(dm)) { domains.add(dm); n++; } }
  }
  if (n) await write(() => Data.set('config', 'suppression', { emails: [...emails].slice(-6000), domains: [...domains].slice(-1000) }));
  return n;
}
async function removeSuppression(v) {
  const d = S.suppressDoc || {};
  return write(() => Data.set('config', 'suppression', { emails: (d.emails || []).filter((x) => x !== v), domains: (d.domains || []).filter((x) => x !== v) }));
}
function findByEmail(email, exceptId) {
  const e = String(email || '').trim().toLowerCase(); if (!e) return null;
  return allBiz().find((b) => b.id !== exceptId && String(contactOf(b).email || '').trim().toLowerCase() === e) || null;
}

/* ---------- the buyer's local time and shop hours ---------- */
function tzOf(b) { return TZ_CITY[b.city] || TZ_COUNTRY[b.country] || null; }
function zoned(tz, d) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', weekday: 'short', hourCycle: 'h23' }).formatToParts(d || new Date());
  const get = (t) => (parts.find((p) => p.type === t) || {}).value;
  return { h: Number(get('hour')) % 24, m: Number(get('minute')), wd: get('weekday') };
}
function localInfo(b) {
  const tz = tzOf(b); if (!tz) return null;
  let z; try { z = zoned(tz); } catch { return null; }
  const late = LATE_SHOPS.includes(b.country); const open = 10 * 60, close = (late ? 22 : 19) * 60; const closedDay = late ? '' : 'Sun';
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const mins = z.h * 60 + z.m; let day = WD.indexOf(z.wd);
  const isOpen = WD[day] !== closedDay && mins >= open && mins < close;
  let wait = 0;
  if (!isOpen) {
    if (mins < open && WD[day] !== closedDay) wait = open - mins;
    else { wait = 24 * 60 - mins + open; day = (day + 1) % 7; if (WD[day] === closedDay) wait += 24 * 60; }
  }
  let time; try { time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: tz }); } catch { time = `${String(z.h).padStart(2, '0')}:${String(z.m).padStart(2, '0')}`; }
  return { time, isOpen, opensAt: isOpen ? null : new Date(Date.now() + wait * 60000) };
}
function localChip(b) {
  const li = localInfo(b); if (!li) return '';
  if (li.isOpen) return `<span class="chip good" title="Their local time">${ico('clock')}${li.time} there · shop open</span>`;
  const d = toDateStr(li.opensAt); const when = d === todayStr() ? '' : d === addDays(todayStr(), 1) ? 'tomorrow ' : `${MONTHS[li.opensAt.getMonth()]} ${li.opensAt.getDate()} `;
  return `<span class="chip" title="Their local time">${ico('clock')}${li.time} there · opens ${when}${fmtTime(li.opensAt)} your time</span>`;
}

/* ---------- meetings ---------- */
const MEETING_KINDS = [['visit', 'Shop visit', 'pin'], ['video', 'Video call', 'camera'], ['call', 'Phone call', 'phone']];
const MEETING_LABEL = Object.fromEntries(MEETING_KINDS.map(([k, l]) => [k, l]));
const meetingsFor = (bid) => [...S.meetings.values()].filter((m) => m.businessId === bid).sort((a, b) => String(a.at).localeCompare(String(b.at)));
const meetingsToday = () => [...S.meetings.values()].filter((m) => m.status === 'planned' && S.businesses.get(m.businessId) && toDateStr(new Date(m.at)) === todayStr()).sort((a, b) => String(a.at).localeCompare(String(b.at)));
function defaultMeetingTime() { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(15, 0, 0, 0); return d; }
function theirTime(b, d) {
  const tz = b ? tzOf(b) : ''; if (!tz) return '';
  try { const there = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: tz }); return there === fmtTime(d) ? '' : there; } catch { return ''; }
}
function meetingWhen(d) { const day = toDateStr(d); const t = todayStr(); return `${day === t ? 'Today' : day === addDays(t, 1) ? 'Tomorrow' : fmtLongDay(day)}, ${fmtTime(d)}`; }
const calStamp = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function gcalUrl(m, b) {
  const d = new Date(m.at); const end = new Date(d.getTime() + 45 * 60000);
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: `${MEETING_LABEL[m.kind] || 'Meeting'}: ${b.name}`, dates: `${calStamp(d)}/${calStamp(end)}`, details: m.note || '', location: m.place || '' })}`;
}
function icsFor(m, b) {
  const d = new Date(m.at); const end = new Date(d.getTime() + 45 * 60000);
  const t = (x) => String(x || '').replace(/[\\;,]/g, (c) => '\\' + c).replace(/\r?\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ark Diamond//Outreach//EN', 'BEGIN:VEVENT', `UID:${m.id}@ark-diamond`, `DTSTAMP:${calStamp(new Date())}`, `DTSTART:${calStamp(d)}`, `DTEND:${calStamp(end)}`,
    `SUMMARY:${t(`${MEETING_LABEL[m.kind] || 'Meeting'}: ${b.name}`)}`, m.place ? `LOCATION:${t(m.place)}` : '', `DESCRIPTION:${t(m.note || '')}`, 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
}
function meetingItem(m) {
  const b = S.businesses.get(m.businessId); if (!b) return '';
  const d = new Date(m.at); const planned = m.status === 'planned'; const isToday = toDateStr(d) === todayStr();
  const past = planned && d.getTime() < Date.now() - 3600000; const there = theirTime(b, d);
  const kind = MEETING_KINDS.find(([k]) => k === m.kind) || MEETING_KINDS[0];
  const tag = m.status === 'done' ? '<span class="chip good">Done</span>' : m.status === 'cancelled' ? '<span class="chip">Cancelled</span>' : past ? '<span class="chip warn">How did it go?</span>' : isToday ? '<span class="chip accent">Today</span>' : '';
  const cal = `<a class="btn small${planned && !past && !isToday ? ' primary' : ''}" href="${esc(gcalUrl(m, b))}" target="_blank" rel="noopener">${ico('calendar')}Add to Google Calendar</a>`;
  const extra = `${planned && !past && !isToday ? '' : cal}<button type="button" class="btn small" data-act="meeting-ics" data-id="${esc(m.id)}">${ico('download')}Calendar file</button><button type="button" class="btn small" data-act="meeting-edit" data-id="${esc(m.id)}">Change</button>${planned ? `<button type="button" class="btn small quiet" data-act="meeting-cancel" data-id="${esc(m.id)}">Cancel meeting</button>` : ''}`;
  return `<div class="item"><div class="stack">
    <div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta"><span class="ch">${ico(kind[2])}${esc(kind[1])}</span><span>${esc(meetingWhen(d))}</span>${there ? `<span>${esc(there)} in ${esc(b.city || b.country)}</span>` : ''}</div>
    ${m.place ? `<div class="meta"><span>${esc(m.place)}</span></div>` : ''}${m.note ? `<div class="sub">${esc(m.note)}</div>` : ''}
    <div class="tags">${tag}${m.by ? `<span class="chip">Booked by ${esc(m.by)}</span>` : ''}</div>
  </div><div class="actions">${planned && (past || isToday) ? `<button type="button" class="btn small primary" data-act="meeting-done" data-id="${esc(m.id)}">${ico('check')}Done</button>` : planned ? cal : ''}${moreMenu('mt:' + m.id, extra)}</div></div>`;
}
function meetingsView() {
  const all = [...S.meetings.values()].filter((m) => S.businesses.get(m.businessId)).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const upcoming = all.filter((m) => m.status === 'planned' && Date.parse(m.at) >= start.getTime());
  const open = all.filter((m) => m.status === 'planned' && Date.parse(m.at) < start.getTime()).reverse();
  const past = all.filter((m) => m.status !== 'planned').reverse().slice(0, 30);
  return `<header class="head"><div><h1>Meetings</h1><p>Shop visits, video calls and phone calls with your clients, in your time and theirs.</p></div><div class="actions"><button class="btn primary" data-act="meeting-new">${ico('plus')}Book a meeting</button></div></header>
  ${open.length ? `<section class="section"><h2>How did they go? <span class="count">${open.length}</span></h2><div class="list">${open.map(meetingItem).join('')}</div></section>` : ''}
  <section class="section"><h2>Coming up <span class="count">${upcoming.length}</span></h2>${upcoming.length ? `<div class="list">${upcoming.map(meetingItem).join('')}</div>` : emptyBox("No meetings booked. Book one here or from a client's page.")}</section>
  ${past.length ? `<section class="section"><h2>Past <span class="count">${past.length}</span></h2><div class="list">${past.map(meetingItem).join('')}</div></section>` : ''}`;
}
function meetingModal() {
  const L = S.layer; const m = L.id ? S.meetings.get(L.id) : null;
  const fixed = S.businesses.get((m && m.businessId) || L.businessId || '') || null;
  const bid = fixed ? fixed.id : fv('mt.biz'); const b = S.businesses.get(bid) || null;
  const at = fv('mt.at', localDateTime(m ? new Date(m.at) : defaultMeetingTime())); const d = new Date(at);
  const there = b && !isNaN(d) ? theirTime(b, d) : ''; const kind = fv('mt.kind', (m && m.kind) || 'visit');
  let pick = '';
  if (!fixed) {
    const groups = {};
    for (const x of allBiz().filter((y) => !['rejected', 'unsubscribed'].includes(y.status)).sort((p, q) => p.name.localeCompare(q.name))) (groups[`${x.city}, ${x.country}`] ||= []).push(x);
    pick = `<div class="field"><label for="mt-biz">Client</label><select class="input" id="mt-biz" data-k="mt.biz" data-live="1"><option value="">Choose the client</option>${Object.entries(groups).sort().map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((x) => `<option value="${esc(x.id)}" ${bid === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>`;
  }
  const place = fv('mt.place', m ? m.place || '' : kind === 'visit' && b ? addressOf(b) : kind === 'call' && b ? contactOf(b).phone || contactOf(b).whatsapp || '' : '');
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="mt-title" data-form="meeting">
    <div class="layer-head"><div>${fixed ? `<div class="eyebrow">${esc(fixed.name)}</div>` : ''}<h2 id="mt-title">${m ? 'Change the meeting' : 'Book a meeting'}</h2></div>${closeBtn()}</div>
    ${pick}
    <div class="field"><span class="lab">Kind of meeting</span>${seg('mtkind', kind, MEETING_KINDS.map(([k, l]) => [k, l]))}</div>
    <div class="field"><label for="mt-at">Date and time, your time</label><input class="input" type="datetime-local" id="mt-at" data-k="mt.at" data-live="1" value="${esc(at)}">${there ? `<span class="hint">That's ${esc(there)} in ${esc(b.city || b.country)}.</span>` : ''}</div>
    <div class="field"><label for="mt-place">${kind === 'visit' ? 'Address' : kind === 'video' ? 'Video link' : 'Phone number'}</label><input class="input" id="mt-place" data-k="mt.place" value="${esc(place)}"></div>
    <div class="field"><label for="mt-note">What it's about</label><textarea class="input" id="mt-note" data-k="mt.note" style="min-height:70px" placeholder="e.g. Show the bridal samples and agree the first order">${esc(fv('mt.note', m ? m.note || '' : ''))}</textarea></div>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('check')}${m ? 'Save changes' : 'Book meeting'}</button></div>
  </form>`;
}

/* ---------- reminders: a date and a note on any client ---------- */
function remindersDue() {
  const today = todayStr(); const out = [];
  for (const b of allBiz()) {
    if (b.remind && b.remind.date && b.remind.date <= today) out.push({ b, kind: 'remind', date: b.remind.date, note: b.remind.note || 'Reminder', by: b.remind.by || '' });
    if (b.lead && b.lead.followUpAt && b.lead.followUpAt <= today && !needsReply(b) && b.status !== 'unsubscribed') out.push({ b, kind: 'follow', date: b.lead.followUpAt, note: hasOrdered(b) ? 'Ask about their next order' : 'Follow up', by: '' });
  }
  return out.sort((a, c) => a.date.localeCompare(c.date) || a.b.name.localeCompare(c.b.name));
}
function reminderItem(x) {
  const { b } = x; const late = daysBetween(x.date, todayStr()); const ids = `data-id="${esc(b.id)}" data-kind="${x.kind}"`;
  return `<div class="item"><div class="stack"><div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta"><span>${esc([b.city, b.country].filter(Boolean).join(', '))}</span>${x.by ? `<span>set by ${esc(x.by)}</span>` : ''}</div>
    <div class="subj">${esc(x.note)}</div>
    <div class="tags">${late > 0 ? `<span class="chip warn">Overdue ${late} d</span>` : '<span class="chip accent">Due today</span>'}${b.lead ? stageChip(b.lead.stage) : stateChip(b)}${exChip(b)}</div></div>
    <div class="actions"><button type="button" class="btn small primary" data-act="remind-done" ${ids}>${ico('check')}Done</button>${moreMenu('rm:' + x.kind + ':' + b.id, `<button type="button" class="btn small" data-act="remind-snooze" ${ids} data-when="1">${ico('clock')}Tomorrow</button><button type="button" class="btn small" data-act="remind-snooze" ${ids} data-when="7">${ico('clock')}Next week</button>`)}</div></div>`;
}
function remindModal() {
  const b = S.businesses.get(S.layer.businessId); if (!b) return '';
  const cur = b.remind || {}; const pick = fv('rm.pick', cur.date ? 'date' : 'tomorrow');
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="rm-title" data-form="remind">
    <div class="layer-head"><div><div class="eyebrow">${esc(b.name)}</div><h2 id="rm-title">Next reminder</h2></div>${closeBtn()}</div>
    <div class="field"><span class="lab">When</span>${seg('rmpick', pick, [['tomorrow', 'Tomorrow'], ['3d', 'In 3 days'], ['week', 'Next week'], ['date', 'Pick a date']])}</div>
    ${pick === 'date' ? `<div class="field"><label for="rm-date">Date</label><input class="input" type="date" id="rm-date" data-k="rm.date" value="${esc(fv('rm.date', cur.date || addDays(todayStr(), 1)))}"></div>` : ''}
    <div class="field"><label for="rm-note">What to do</label><input class="input" id="rm-note" data-k="rm.note" value="${esc(fv('rm.note', cur.note || ''))}" placeholder="e.g. Call about the sample rings"></div>
    <p class="hint" style="margin:0">On the day, the reminder shows on Today.</p>
    <div class="actions" style="justify-content:flex-end">${cur.date ? `<button type="button" class="btn quiet" data-act="remind-clear" data-id="${esc(b.id)}">Remove reminder</button>` : ''}<button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('check')}Save reminder</button></div>
  </form>`;
}

/* ---------- a client's whole story ---------- */
function historyOf(b) {
  const ev = []; const add = (at, icon, text) => { if (at) ev.push({ at: String(at), icon, text }); };
  add(b.createdAt, 'plus', b.source === 'map' ? 'Saved from the showroom map' : b.source === 'research' ? (b.type === 'online' ? "Saved from Claude's research (sells online)" : "Saved from Claude's research") : b.source === 'import' ? 'Imported from a list' : 'Added');
  if (b.seqStart) add(`${b.seqStart}T08:00:00`, 'megaphone', `Campaign ${b.seqStart > todayStr() ? 'starts' : 'started'}${b.startedBy ? ` (by ${b.startedBy})` : ''}`);
  const steps = allSteps();
  for (const [sid, x] of Object.entries(b.done || {})) {
    if (!x || !x.at) continue; const st = steps.find((y) => y.id === sid); const ch = st ? CH_LABEL[effectiveChannel(st, b)] || '' : '';
    add(x.at, x.how === 'skipped' ? 'x' : 'check', `${{ sent: 'Sent', done: 'Done', skipped: 'Skipped', bounced: 'Bounced' }[x.how] || x.how}: ${ch ? `${ch}, ` : ''}${st ? st.title : sid}${x.by ? ` · ${x.by}` : ''}`);
  }
  for (const m of b.messages || []) add(m.at, 'chat', m.dir === 'in' ? `They wrote on ${CH_LABEL[m.channel] || m.channel}: “${trunc(m.text, 90)}”` : `${m.by || 'You'} answered on ${CH_LABEL[m.channel] || m.channel}`);
  for (const m of meetingsFor(b.id)) add(m.at, 'meet', `${MEETING_LABEL[m.kind] || 'Meeting'}${m.status === 'done' ? ', done' : m.status === 'cancelled' ? ', cancelled' : ''}${m.note ? `: ${trunc(m.note, 80)}` : ''}`);
  for (const q of quotesOf(b.id)) add(q.createdAt, 'doc', `Quote ${q.number}: ${QUOTE_LABEL[q.status] || q.status}`);
  for (const x of samplesOf(b.id)) add(x.sentAt ? `${x.sentAt}T12:00:00` : x.createdAt, 'box', `Samples sent${x.pieces ? `: ${x.pieces}` : ''}`);
  for (const o of ordersOf(b.id)) add(o.createdAt, 'receipt', `Order ${o.number}: ${ORDER_LABEL[o.status] || o.status}, ${fmtMoney(orderTotal(o), o.currency)}`);
  return ev.sort((p, q) => q.at.localeCompare(p.at));
}
function historyPanel(b) {
  const ev = historyOf(b); if (!ev.length) return '';
  const all = !!S.ui.histAll[b.id]; const shown = all ? ev : ev.slice(0, 8);
  return `<section class="panel"><h3>History</h3><ol class="hist">${shown.map((x) => `<li>${ico(x.icon)}<span>${esc(x.text)}</span><span class="when">${esc(fmtWhen(x.at))}</span></li>`).join('')}</ol>${ev.length > 8 ? `<div><button type="button" class="btn small" data-act="hist-all" data-id="${esc(b.id)}">${all ? 'Show less' : `Show all ${ev.length}`}</button></div>` : ''}</section>`;
}
// Once a shop is serious (quote, samples or an order), the shops most like it that haven't been contacted yet.
function similarShops(b) {
  if (!hasOrdered(b) && !(b.lead && ['quoted', 'samples', 'first_order', 'repeat'].includes(b.lead.stage))) return [];
  return allBiz().filter((x) => x.id !== b.id && x.type === b.type && startable(x) && reachable(x))
    .map((x) => ({ x, score: fitScore(x) + (b.labGrown && x.labGrown ? 25 : 0) + (x.city !== b.city ? 5 : 0) }))
    .sort((p, q) => q.score - p.score || p.x.name.localeCompare(q.x.name)).slice(0, 5).map((y) => y.x);
}
function similarPanel(b) {
  const list = similarShops(b); if (!list.length) return '';
  return `<section class="panel"><h3>Shops like ${esc(b.name)}</h3><p class="hint" style="margin:0">The same kind of shop, not contacted yet${b.labGrown ? ', lab-grown sellers first' : ''}. Good ones to start next.</p>
    ${list.map((x) => `<div class="srow"><div class="stack"><div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(x.id)}">${esc(x.name)}</button></div><div class="meta"><span>${esc([x.city, x.country].filter(Boolean).join(', '))}</span>${x.labGrown ? '<span class="labmark">sells lab-grown</span>' : ''}</div></div><div class="actions"><button type="button" class="btn small" data-act="camp-one" data-id="${esc(x.id)}">${ico('megaphone')}Start</button></div></div>`).join('')}</section>`;
}

/* ---------- quotes, samples, broadcasts, seasons ---------- */
const quoteTotal = (q) => (q.lines || []).reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0) + (Number(q.shipping) || 0);
const quoteUsd = (q) => quoteTotal(q) * (q.currency === 'USD' ? 1 : Number(q.usdRate) || 0);
function nextQuoteNumber() { const n = [...S.quotes.values()].map((q) => Number(String(q.number || '').replace(/\D/g, '')) || 0); return 'Q-' + String(Math.max(0, ...n) + 1).padStart(4, '0'); }
function quoteText(q, b) {
  const co = settings().company;
  const lines = (q.lines || []).map((l, i) => `${i + 1}. ${l.desc}: ${l.qty} × ${num2(l.price)} = ${num2((Number(l.qty) || 0) * (Number(l.price) || 0))}`);
  return [`Quotation ${q.number}${co.name ? ` from ${co.name}` : ''}`, `For ${b.name}, ${[b.city, b.country].filter(Boolean).join(', ')}`,
    `Date ${fmtDate(String(q.createdAt || nowIso()).slice(0, 10))}${q.validUntil ? `, valid until ${fmtDate(q.validUntil)}` : ''}`, `Terms ${q.incoterm}, prices in ${q.currency}`, '',
    ...lines, ...(Number(q.shipping) ? [`Shipping and insurance: ${num2(q.shipping)}`] : []), `Total: ${fmtMoney(quoteTotal(q), q.currency)}`,
    ...(q.notes ? ['', q.notes] : []), '', [co.senderName, co.name].filter(Boolean).join(', ')].join('\n').trim();
}
function quoteHtmlFile(q, b) {
  const co = settings().company; const e = esc;
  const rows = (q.lines || []).map((l, i) => `<tr><td>${i + 1}</td><td>${e(l.desc)}</td><td class="n">${e(l.qty)}</td><td class="n">${num2(l.price)}</td><td class="n">${num2((Number(l.qty) || 0) * (Number(l.price) || 0))}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Quotation ${e(q.number)}</title><style>body{font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#131821;max-width:760px;margin:40px auto;padding:0 24px}h1{font-size:26px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{text-align:left;padding:8px;border-bottom:1px solid #d9dee7}th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6c768a}.n{text-align:right;font-variant-numeric:tabular-nums}.tot td{font-weight:700;border-bottom:0}.muted{color:#465063}.notes{white-space:pre-wrap;background:#f2f4f7;padding:12px;border-radius:8px}@media print{body{margin:0}}</style></head><body>
<h1>Quotation ${e(q.number)}</h1><p class="muted">${e(co.name || '')}${co.address ? ' · ' + e(co.address) : ''}${co.senderEmail ? ' · ' + e(co.senderEmail) : ''}${co.whatsapp ? ' · WhatsApp ' + e(co.whatsapp) : ''}</p>
<p><b>For</b> ${e(b.name)}, ${e([b.city, b.country].filter(Boolean).join(', '))}${contactOf(b).person ? ' · ' + e(contactOf(b).person) : ''}<br><b>Date</b> ${e(fmtDate(String(q.createdAt || nowIso()).slice(0, 10)))}${q.validUntil ? ` · <b>Valid until</b> ${e(fmtDate(q.validUntil))}` : ''}<br><b>Terms</b> ${e(q.incoterm)} · prices in ${e(q.currency)}</p>
<table><thead><tr><th>#</th><th>Item</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr></thead><tbody>${rows}
${Number(q.shipping) ? `<tr><td></td><td>Shipping and insurance</td><td></td><td></td><td class="n">${num2(q.shipping)}</td></tr>` : ''}<tr class="tot"><td></td><td>Total</td><td></td><td></td><td class="n">${e(fmtMoney(quoteTotal(q), q.currency))}</td></tr></tbody></table>
${q.notes ? `<p class="notes">${e(q.notes)}</p>` : ''}<p class="muted">Lab-grown diamonds. Prices exclude import duty and taxes in the destination country unless the terms are DDP.</p><p>${e(co.senderName || '')}</p></body></html>`;
}
const trackUrl = (x) => (TRACK_URL[x.courier] && x.tracking ? TRACK_URL[x.courier] + encodeURIComponent(x.tracking) : '');
function seasonWindow(x) { return { from: addDays(x.date, -PITCH_FROM), to: addDays(x.date, -PITCH_TO) }; }
function seasonPhase(x, today) { today = today || todayStr(); const w = seasonWindow(x); if (today > x.date) return 'past'; if (today < w.from) return 'soon'; if (today <= w.to) return 'now'; return 'late'; }
function audienceList(a) {
  let list = focusBiz().filter((b) => !['unsubscribed', 'bounced'].includes(b.status) && !isSuppressed(contactOf(b).email));
  if (a.segment === 'leads') list = list.filter((b) => b.lead && b.lead.stage !== 'lost');
  else if (a.segment === 'open') list = list.filter((b) => b.lead && !b.lead.firstOrderAt && b.lead.stage !== 'lost');
  else if (a.segment === 'customers') list = list.filter((b) => b.lead && b.lead.firstOrderAt);
  else if (a.segment === 'noreply') list = list.filter((b) => b.status === 'closed' && !inbound(b).length);
  else list = list.filter(contacted);
  if (a.countries && a.countries.length) list = list.filter((b) => a.countries.includes(b.country));
  if (a.channel === 'whatsapp') list = list.filter((b) => b.waOptIn && (contactOf(b).whatsapp || contactOf(b).phone));
  else list = list.filter((b) => contactOf(b).email);
  return list.sort((x, y) => x.name.localeCompare(y.name));
}
function broadcastExtra(bc) {
  const x = SEASONS.find((y) => y.key === bc.season);
  return { season: x ? x.name : '[season]', season_date: x ? fmtDate(x.date) : '[date]', ...(bc.fairName ? { fair: bc.fairName, booth: bc.booth || '[booth]', fair_dates: bc.fairDates || '[fair dates]' } : {}) };
}
function broadcastText(bc, b) {
  const extra = broadcastExtra(bc);
  if (bc.channel === 'whatsapp') return { body: fill(bc.body, b, extra) };
  return { subject: fill(bc.subject, b, extra), body: `${fill(bc.body, b, extra)}\n\n--\n${emailFooter()}` };
}
function bcStats(bc) {
  const recs = (bc.recipients || []).filter((r) => S.businesses.get(r.id));
  const sent = recs.filter((r) => r.at && r.how === 'sent');
  const replied = sent.filter((r) => inbound(S.businesses.get(r.id)).some((m) => String(m.at) > String(r.at) && Date.parse(m.at) - Date.parse(r.at) <= 14 * 86400000));
  return { total: recs.length, sent: sent.length, left: recs.filter((r) => !r.at).length, replied: replied.length };
}

/* ================= orders: proforma invoices, payments and shipping ================= */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const round4 = (n) => Math.round((Number(n) || 0) * 10000) / 10000;
const ordersOf = (bid) => [...S.orders.values()].filter((o) => o.businessId === bid).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
const orderSubtotal = (o) => round2((o.lines || []).reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0));
const orderTotal = (o) => round2(Math.max(0, orderSubtotal(o) + (Number(o.shipping) || 0) - (Number(o.discount) || 0)));
const orderPct = (o) => Math.min(100, Math.max(0, o.advancePct === '' || o.advancePct == null ? 50 : Number(o.advancePct) || 0));
const orderAdvance = (o) => round2((orderTotal(o) * orderPct(o)) / 100);
const orderPaid = (o) => round2((o.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0));
const orderDue = (o) => round2(Math.max(0, orderTotal(o) - orderPaid(o)));
const orderUsd = (o) => orderTotal(o) * (o.currency === 'USD' ? 1 : Number(o.usdRate) || 0);
const isOpenOrder = (o) => !['delivered', 'cancelled'].includes(o.status);
// Totals are stored on each order as well, so the morning summary can read them without working them out.
const orderSums = (o) => ({ total: orderTotal(o), advance: orderAdvance(o), paid: orderPaid(o) });
function fmtShort(n, cur) {
  const v = Number(n) || 0; const s = v.toLocaleString('en-GB', { minimumFractionDigits: Math.round(v * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return CUR_SYM[cur] ? CUR_SYM[cur] + s : `${cur} ${s}`;
}
// Indian financial years run April to March, so invoice numbers read AD/PI/2026-27/001.
function finYear(d) { const [y, m] = String(d || todayStr()).split('-').map(Number); const s = m >= 4 ? y : y - 1; return `${s}-${String((s + 1) % 100).padStart(2, '0')}`; }
function nextPiNumber() {
  const fy = finYear(todayStr()); const pre = String(settings().trade.piPrefix || 'PI').trim().replace(/\/+$/, '') || 'PI';
  const n = [...S.orders.values()].filter((o) => String(o.number || '').includes(`/${fy}/`)).map((o) => Number(String(o.number).split('/').pop()) || 0);
  return `${pre}/${fy}/${String(Math.max(0, ...n) + 1).padStart(3, '0')}`;
}
function hsFor(desc) {
  const t = String(desc || '').toLowerCase();
  if (/silver|\b925\b|sterling/.test(t)) return '7113.11';
  if (/gold|\b(9|10|14|18|22)\s?(k|kt|ct|carat)\b/.test(t)) return '7113.19';
  return '';
}
function currencyFor(country) { return country === UK ? 'GBP' : country === 'United Arab Emirates' ? 'AED' : EU.includes(country) ? 'EUR' : 'USD'; }
// What one unit of a currency is worth in US$, from the rupee rates saved on the Prices page
function fxUsd(cur) {
  const r = settings().pricing.rates; const usd = Number(r.USD) || 0;
  if (cur === 'USD') return 1; if (!usd) return 0; if (cur === 'INR') return round4(1 / usd);
  const x = Number(r[cur]) || 0; return x ? round4(x / usd) : 0;
}
function whereFrom(notes) { const m = String(notes || '').match(/^Where:\s*(.+)$/m); return m ? m[1].trim() : ''; }
function buyerSnapshot(b) { const c = b ? contactOf(b) : {}; return { name: b ? b.name : '', person: c.person || '', email: c.email || '', phone: c.phone || '', address: b ? whereFrom(b.notes) : '', country: b ? b.country || '' : '', vat: '' }; }
function newOrderDraft(b) {
  const t = settings().trade; const today = todayStr(); const last = b ? ordersOf(b.id)[0] : null;
  const currency = (last && last.currency) || currencyFor(b ? b.country : '');
  return {
    businessId: b ? b.id : '', buyer: last ? { ...buyerSnapshot(b), ...clone(last.buyer || {}) } : buyerSnapshot(b), currency, incoterm: 'DAP', place: b ? b.city || '' : '', port: t.port || DEFAULT_TRADE.port,
    lines: [{ desc: '', hs: '', qty: 1, price: '' }], shipping: '', discount: '', advancePct: 50, piDate: today, validUntil: addDays(today, 15), advanceDueAt: addDays(today, 7), readyBy: '', balanceDueAt: '',
    terms: t.paymentTerms || DEFAULT_TRADE.paymentTerms, notes: '', usdRate: fxUsd(currency) || '',
  };
}
function orderFromQuote(q, b) {
  const d = newOrderDraft(b);
  const lines = (q.lines || []).map((l) => ({ desc: l.desc || '', hs: hsFor(l.desc), qty: l.qty ?? 1, price: l.price ?? '' }));
  return { ...d, quoteId: q.id, currency: q.currency || d.currency, incoterm: q.incoterm || d.incoterm, lines: lines.length ? lines : d.lines, shipping: Number(q.shipping) || '',
    usdRate: q.currency === 'USD' ? 1 : Number(q.usdRate) || fxUsd(q.currency) || '', notes: q.notes || '', fromAccepted: q.status === 'accepted' };
}
// What an open order needs from the owner today, if anything
function orderTodo(o, today) {
  today = today || todayStr(); if (!isOpenOrder(o)) return null;
  const total = orderTotal(o), paid = orderPaid(o), adv = orderAdvance(o), cur = o.currency;
  if (o.status === 'pi') {
    if (adv > 0 && paid + 0.005 >= adv) return { tone: 'good', text: 'Advance received. Start production.' };
    if (o.advanceDueAt && o.advanceDueAt <= today) return { tone: 'warn', text: `Advance of ${fmtMoney(adv - paid, cur)} ${o.advanceDueAt < today ? `was due ${fmtDay(o.advanceDueAt)}` : 'due today'}` };
    return null;
  }
  if (o.status === 'production') return o.readyBy && o.readyBy < today ? { tone: 'warn', text: `Was due to be ready ${fmtDay(o.readyBy)}` } : null;
  if (o.status === 'ready') {
    if (paid + 0.005 >= total) return { tone: 'good', text: 'Paid in full. Ready to ship.' };
    if (!o.balanceDueAt || o.balanceDueAt <= today) return { tone: 'warn', text: `Balance of ${fmtMoney(total - paid, cur)} due${o.balanceDueAt && o.balanceDueAt < today ? ` since ${fmtDay(o.balanceDueAt)}` : ''}` };
    return null;
  }
  if (o.status === 'shipped' && o.shippedAt && daysBetween(o.shippedAt, today) >= 7) return { tone: 'accent', text: 'Ask whether the parcel arrived' };
  return null;
}
const orderTodos = () => [...S.orders.values()].map((o) => ({ o, t: orderTodo(o) })).filter((x) => x.t).sort((a, b) => (a.t.tone === 'warn' ? 0 : 1) - (b.t.tone === 'warn' ? 0 : 1) || String(a.o.piDate).localeCompare(String(b.o.piDate)));
const defaultPayAmount = (o) => { const paid = orderPaid(o), adv = orderAdvance(o); return round2(o.status === 'pi' && paid < adv ? adv - paid : Math.max(0, orderTotal(o) - paid)); };
async function countOrderRevenue(o) {
  // A paid order counts once in the buyer's order value and the reports. An order made from an accepted quote was counted when the quote was accepted.
  if (!o || o.loggedAt || o.fromAccepted || !S.businesses.get(o.businessId)) return;
  const usd = Math.round(orderUsd(o));
  if (usd > 0) await logOrder(o.businessId, usd, true); else await ensureLead(o.businessId, 'first_order');
  await write(() => Data.update('orders', o.id, { loggedAt: nowIso() }));
}
function clearForm(...prefixes) { for (const k of Object.keys(S.form)) if (prefixes.some((p) => k.startsWith(p))) delete S.form[k]; }
async function saveOrderDraft() {
  const d = S.orderDraft; if (!d) return;
  const lines = (d.lines || []).map((l) => ({ desc: String(l.desc || '').trim(), hs: String(l.hs || '').trim() || hsFor(l.desc), qty: Math.max(0, Number(l.qty) || 0), price: Math.max(0, Number(l.price) || 0) })).filter((l) => l.desc || l.price);
  const buyer = Object.fromEntries(['name', 'person', 'email', 'phone', 'address', 'country', 'vat'].map((k) => [k, String((d.buyer || {})[k] || '').trim()]));
  if (!buyer.name) { toast(d.businessId ? 'Add the buyer name.' : 'Choose the buyer first.'); return; }
  if (!lines.length) { toast('Add at least one item with a price.'); return; }
  const { id: _drop, ...base } = S.orders.get(d.id) || {};
  const doc = {
    ...base, businessId: d.businessId || '', quoteId: d.quoteId || base.quoteId || '', number: d.number || nextPiNumber(), buyer, currency: d.currency || 'USD', incoterm: d.incoterm || 'DAP',
    place: String(d.place || '').trim(), port: String(d.port || '').trim(), lines, shipping: Math.max(0, Number(d.shipping) || 0), discount: Math.max(0, Number(d.discount) || 0), advancePct: orderPct(d),
    piDate: d.piDate || todayStr(), validUntil: d.validUntil || '', advanceDueAt: d.advanceDueAt || '', readyBy: d.readyBy || '', balanceDueAt: d.balanceDueAt || '',
    terms: String(d.terms || '').trim(), notes: String(d.notes || '').trim(), usdRate: d.currency === 'USD' ? 1 : Number(d.usdRate) || 0,
    status: base.status || 'pi', statusAt: base.statusAt || { pi: nowIso() }, payments: base.payments || [], checks: base.checks || {}, fromAccepted: base.fromAccepted ?? !!d.fromAccepted,
    createdAt: base.createdAt || nowIso(), updatedAt: nowIso(), isExample: false,
  };
  Object.assign(doc, orderSums(doc));
  const oid = d.id || Data.newId('orders');
  if (!(await write(() => Data.set('orders', oid, doc)))) return;
  if (doc.businessId && S.businesses.get(doc.businessId)) await ensureLead(doc.businessId, 'quoted');
  const prev = S.layer && S.layer.back; const back = prev && prev.kind === 'order' ? prev.back : prev;
  S.orderDraft = null; clearForm('pm.', 'pay.', 'ship.'); S.ui.orderPanel = d.id ? '' : 'mail';
  S.layer = back ? { kind: 'order', id: oid, back } : { kind: 'order', id: oid }; render();
  const dr = $('#layer .drawer'); if (dr) dr.scrollTop = 0;
  toast(d.id ? `${doc.number} saved` : `Proforma ${doc.number} is ready. Check it, then email it.`);
}
async function savePayment(oid) {
  const o = S.orders.get(oid); if (!o) return;
  const amount = round2(Number(fv('pay.amount', defaultPayAmount(o))));
  if (!(amount > 0)) { toast('Enter the amount received.'); return; }
  const p = { id: uid(), at: fv('pay.at', todayStr()) || todayStr(), amount, method: fv('pay.method', 'bank'), ref: String(fv('pay.ref')).trim() };
  const payments = [...(o.payments || []), p]; const next = { ...o, payments };
  const patch = { payments, ...orderSums(next), updatedAt: nowIso() }; let started = false;
  if (o.status === 'pi' && orderPaid(next) + 0.005 >= orderAdvance(next)) { patch.status = 'production'; patch.statusAt = { production: nowIso() }; started = true; }
  if (!(await write(() => Data.update('orders', oid, patch)))) return;
  clearForm('pay.'); S.ui.orderPanel = '';
  await countOrderRevenue(S.orders.get(oid));
  const due = orderDue(S.orders.get(oid) || next);
  toast(`${fmtMoney(amount, o.currency)} recorded.${started ? ' Production can start.' : ''}${due > 0 ? ` ${fmtMoney(due, o.currency)} still to come.` : ' Paid in full.'}`);
  render();
}
async function setOrderStatus(oid, v) {
  const o = S.orders.get(oid); if (!o || !ORDER_LABEL[v]) return;
  const patch = { status: v, statusAt: { [v]: nowIso() }, updatedAt: nowIso() };
  if (v === 'ready' && !o.balanceDueAt) patch.balanceDueAt = addDays(todayStr(), 7);
  if (v === 'delivered') patch.deliveredAt = todayStr();
  if (!(await write(() => Data.update('orders', oid, patch)))) return;
  const b = S.businesses.get(o.businessId);
  if (v === 'delivered' && b) {
    if (!b.lead) await ensureLead(b.id, 'first_order');
    const day = addDays(todayStr(), reorderGap(b));
    await write(() => updateBiz(b.id, { lead: { followUpAt: day } }));
    toast(`Delivered. Reorder check-in set for ${fmtDay(day)}.`); return;
  }
  toast(v === 'production' ? 'Marked in production' : v === 'ready' ? `Marked ready. Balance due by ${fmtDay(patch.balanceDueAt || o.balanceDueAt)}.` : `Marked ${ORDER_LABEL[v].toLowerCase()}`);
}
async function saveShipment(oid) {
  const o = S.orders.get(oid); if (!o) return;
  const ship = { courier: fv('ship.courier', 'malca'), tracking: String(fv('ship.tracking')).trim(), at: fv('ship.at', todayStr()) || todayStr() };
  if (!(await write(() => Data.update('orders', oid, { status: 'shipped', statusAt: { shipped: nowIso() }, ship, shippedAt: ship.at, updatedAt: nowIso() })))) return;
  clearForm('ship.'); S.ui.orderPanel = '';
  toast(`Marked shipped${ship.tracking ? `, tracking ${ship.tracking}` : ''}`);
}
function amountWords(n, cur) {
  const NAMES = { GBP: ['Pounds', 'Pence'], USD: ['US Dollars', 'Cents'], EUR: ['Euros', 'Cents'], AED: ['UAE Dirhams', 'Fils'], INR: ['Rupees', 'Paise'], CAD: ['Canadian Dollars', 'Cents'], AUD: ['Australian Dollars', 'Cents'], SGD: ['Singapore Dollars', 'Cents'], HKD: ['Hong Kong Dollars', 'Cents'], SAR: ['Saudi Riyals', 'Halalas'], QAR: ['Qatari Riyals', 'Dirhams'], CHF: ['Swiss Francs', 'Centimes'], ZAR: ['Rand', 'Cents'] };
  const [big, small] = NAMES[cur] || [cur, 'Cents'];
  const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const two = (x) => (x < 20 ? ONES[x] : TENS[Math.floor(x / 10)] + (x % 10 ? '-' + ONES[x % 10] : ''));
  const three = (x) => { const h = Math.floor(x / 100), r = x % 100; return [h ? ONES[h] + ' hundred' : '', r ? (h ? 'and ' : '') + two(r) : ''].filter(Boolean).join(' '); };
  const groups = cur === 'INR' ? [[1e7, 'crore'], [1e5, 'lakh'], [1e3, 'thousand']] : [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
  const words = (x) => {
    if (!x) return 'zero'; const parts = [];
    for (const [v, name] of groups) if (x >= v) { parts.push(`${three(Math.floor(x / v))} ${name}`); x %= v; }
    if (x) parts.push((parts.length && x < 100 ? 'and ' : '') + three(x));
    return parts.join(' ');
  };
  const title = (t) => t.split(' ').map((w) => (w === 'and' ? w : w.replace(/(^|-)([a-z])/g, (m, a, c) => a + c.toUpperCase()))).join(' ');
  const v = round2(n); const whole = Math.floor(v + 1e-9); const frac = Math.round((v - whole) * 100);
  return `${big} ${title(words(whole))}${frac ? ` and ${title(two(frac))} ${small}` : ''} Only`;
}

/* ================= PDF: a small writer for A4 pages in the standard PDF fonts, so invoices need no library ================= */
// Character widths for Windows-1252 codes 32-255, in 1/1000 em, from the Adobe metrics of the four fonts used.
const PDF_W = {R:[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,350,556,350,222,556,333,1000,556,556,333,1000,667,333,1000,350,611,350,350,222,222,333,333,350,556,1000,333,1000,500,333,944,350,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],B:[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,350,556,350,278,556,500,1000,556,556,333,1000,667,333,1000,350,611,350,350,278,278,500,500,350,556,1000,333,1000,556,333,944,350,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556],T:[250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,350,500,350,333,500,444,1000,500,500,333,1000,556,333,889,350,611,350,350,333,333,444,444,350,500,1000,333,980,389,333,722,350,444,722,250,333,500,500,500,500,200,500,333,760,276,500,564,333,760,333,400,564,300,300,333,500,453,250,333,300,310,500,750,750,750,444,722,722,722,722,722,722,889,667,611,611,611,611,333,333,333,333,722,722,722,722,722,722,722,564,722,722,722,722,722,722,556,500,444,444,444,444,444,444,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,564,500,500,500,500,500,500,500,500],TB:[250,333,555,500,500,1000,833,278,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,556,556,444,389,333,556,500,722,500,500,444,394,220,394,520,350,500,350,333,500,500,1000,500,500,333,1000,556,333,1000,350,667,350,350,333,333,500,500,350,500,1000,333,1000,389,333,722,350,444,722,250,333,500,500,500,500,220,500,333,747,300,500,570,333,747,333,400,570,300,300,333,556,540,250,333,300,330,500,750,750,750,500,722,722,722,722,722,722,1000,722,667,667,667,667,389,389,389,389,722,722,778,778,778,778,778,570,778,722,722,722,722,722,611,556,500,500,500,500,500,500,722,444,444,444,444,444,278,278,278,278,500,556,500,500,500,500,500,570,500,556,556,556,556,500,556,500]};
const PDF_FONT = { R: 'Helvetica', B: 'Helvetica-Bold', T: 'Times-Roman', TB: 'Times-Bold' };
const WIN_HIGH = { 0x20AC: 128, 0x201A: 130, 0x0192: 131, 0x201E: 132, 0x2026: 133, 0x2020: 134, 0x2021: 135, 0x02C6: 136, 0x2030: 137, 0x0160: 138, 0x2039: 139, 0x0152: 140, 0x017D: 142, 0x2018: 145, 0x2019: 146, 0x201C: 147, 0x201D: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151, 0x02DC: 152, 0x2122: 153, 0x0161: 154, 0x203A: 155, 0x0153: 156, 0x017E: 158, 0x0178: 159 };
function pdfCodes(s) {
  const out = [];
  for (const ch of String(s ?? '').replace(/₹\s?/g, 'Rs. ').replace(/[   \t]/g, ' ').replace(/[\r\n]+/g, ' ')) {
    const c = ch.codePointAt(0);
    out.push(c >= 32 && c < 127 ? c : c >= 160 && c <= 255 ? c : WIN_HIGH[c] || 63);
  }
  return out;
}
function pdfWidth(s, f = 'R', size = 10, sp = 0) { const cs = pdfCodes(s); let w = 0; for (const c of cs) w += PDF_W[f][c - 32] || 0; return (w * size) / 1000 + sp * cs.length; }
function pdfFit(s, f, size, maxW) {
  s = String(s ?? ''); if (pdfWidth(s, f, size) <= maxW) return s;
  while (s.length > 1 && pdfWidth(s + '…', f, size) > maxW) s = s.slice(0, -1);
  return s.replace(/\s+$/, '') + '…';
}
function pdfWrap(s, f = 'R', size = 10, maxW = 100) {
  const out = [];
  for (const para of String(s ?? '').split(/\r?\n/)) {
    const words = para.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean); let cur = '';
    if (!words.length) { out.push(''); continue; }
    for (let w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (pdfWidth(next, f, size) <= maxW) { cur = next; continue; }
      if (cur) out.push(cur);
      while (w.length > 1 && pdfWidth(w, f, size) > maxW) { let k = w.length - 1; while (k > 1 && pdfWidth(w.slice(0, k), f, size) > maxW) k--; out.push(w.slice(0, k)); w = w.slice(k); }
      cur = w;
    }
    if (cur) out.push(cur);
  }
  while (out.length > 1 && out[out.length - 1] === '') out.pop();
  return out.length ? out : [''];
}
const pdfN = (n) => { const s = (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(/\.?0+$/, ''); return s === '' || s === '-0' ? '0' : s; };
function pdfDoc(meta = {}) {
  const W = 595.28, H = 841.89; const pages = []; let ops = null;
  const col = (hex) => { const h = String(hex || '#000000').replace('#', ''); return [0, 2, 4].map((i) => pdfN(parseInt(h.slice(i, i + 2), 16) / 255)).join(' '); };
  const str = (s) => pdfCodes(s).map((c) => (c === 40 || c === 41 || c === 92 ? '\\' + String.fromCharCode(c) : c < 32 || c > 126 ? '\\' + c.toString(8).padStart(3, '0') : String.fromCharCode(c))).join('');
  return {
    W, H,
    addPage() { ops = []; pages.push(ops); },
    onPage(i) { ops = pages[i]; },
    get pageCount() { return pages.length; },
    text(x, y, s, o = {}) {
      const f = o.f || 'R', size = o.size || 10, sp = o.sp || 0; const w = pdfWidth(s, f, size, sp);
      const x0 = o.align === 'right' ? x - w + sp : o.align === 'center' ? x - w / 2 : x;
      ops.push(`BT /${f} ${pdfN(size)} Tf ${pdfN(sp)} Tc ${col(o.color)} rg 1 0 0 1 ${pdfN(x0)} ${pdfN(H - y)} Tm (${str(s)}) Tj ET`);
      return w;
    },
    line(x1, y1, x2, y2, o = {}) { ops.push(`${pdfN(o.w || 0.5)} w ${col(o.color)} RG ${pdfN(x1)} ${pdfN(H - y1)} m ${pdfN(x2)} ${pdfN(H - y2)} l S`); },
    rect(x, y, w, h, o = {}) {
      const p = []; if (o.fill) p.push(`${col(o.fill)} rg`); if (o.stroke) p.push(`${pdfN(o.w || 0.5)} w ${col(o.stroke)} RG`);
      p.push(`${pdfN(x)} ${pdfN(H - y - h)} ${pdfN(w)} ${pdfN(h)} re ${o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S'}`); ops.push(p.join(' '));
    },
    bytes() {
      const objs = []; const add = (s) => { objs.push(s); return objs.length; };
      const cat = add(''), root = add('');
      const fonts = Object.entries(PDF_FONT).map(([k, name]) => `/${k} ${add(`<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`)} 0 R`).join(' ');
      const kids = pages.map((p) => {
        const content = p.join('\n'); const c = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        return add(`<< /Type /Page /Parent ${root} 0 R /MediaBox [0 0 ${pdfN(W)} ${pdfN(H)}] /Resources << /Font << ${fonts} >> >> /Contents ${c} 0 R >>`);
      });
      objs[cat - 1] = `<< /Type /Catalog /Pages ${root} 0 R >>`;
      objs[root - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
      const d = new Date(); const p2 = (n) => String(n).padStart(2, '0');
      const info = add(`<< /Title (${str(meta.title || '')}) /Author (${str(meta.author || '')}) /Producer (Ark Diamond Outreach) /CreationDate (D:${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}) >>`);
      let out = '%PDF-1.4\n%âãÏÓ\n'; const offs = [];
      objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
      const xref = out.length;
      out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
      out += `trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
      const bytes = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
      return bytes;
    },
  };
}
function piPdf(o) {
  const st = settings(); const co = st.company; const t = st.trade; const b = o.buyer || {};
  const pdf = pdfDoc({ title: `Proforma invoice ${o.number}`, author: co.name || '' });
  const M = 46, R = pdf.W - M, CW = R - M, BOTTOM = pdf.H - 66;
  const NAVY = '#0B1124', GOLD = '#A47E35', INK = '#1E2533', MUTED = '#5F6878', LINE = '#DAD3C4', SOFT = '#F7F3EA';
  const cur = o.currency || 'USD'; const uk = b.country === UK; const company = co.name || 'Ark Diamond';
  let y = 0;
  const top = (first) => {
    pdf.addPage(); y = 58;
    pdf.text(M, y, company.toUpperCase(), { f: 'TB', size: first ? 20 : 13, sp: first ? 2.4 : 1.6, color: NAVY });
    pdf.text(R, y, 'PROFORMA INVOICE', { f: 'TB', size: first ? 13 : 10, sp: 1.5, color: GOLD, align: 'right' });
    y += first ? 16 : 14;
    if (first) {
      pdf.text(M, y, 'Laboratory-grown diamond jewellery', { size: 8.5, color: MUTED, sp: 0.2 });
      pdf.text(R, y, `No. ${o.number}`, { f: 'B', size: 9, color: INK, align: 'right' });
      y += 12; pdf.text(R, y, `Date ${fmtDate(o.piDate)}`, { size: 9, color: INK, align: 'right' });
      if (o.validUntil) { y += 12; pdf.text(R, y, `Valid until ${fmtDate(o.validUntil)}`, { size: 9, color: INK, align: 'right' }); }
    } else pdf.text(R, y, `${o.number}, continued`, { size: 8.5, color: MUTED, align: 'right' });
    y += 12; pdf.line(M, y, R, y, { color: GOLD, w: 0.9 }); y += 24;
  };
  top(true);
  // seller and buyer side by side
  const colW = (CW - 28) / 2; const X2 = M + colW + 28;
  pdf.text(M, y, 'FROM', { f: 'B', size: 7.5, sp: 1.3, color: GOLD }); pdf.text(X2, y, 'BILL TO', { f: 'B', size: 7.5, sp: 1.3, color: GOLD });
  const block = (x, rows) => {
    let yy = y + 15;
    for (const [s, f = 'R', size = 9] of rows) { if (!s) continue; for (const ln of pdfWrap(s, f, size, colW)) { pdf.text(x, yy, ln, { f, size, color: INK }); yy += size + 3.6; } }
    return yy;
  };
  const yl = block(M, [[company, 'B', 10.5], [co.address], [[co.whatsapp ? `Phone ${co.whatsapp}` : '', co.senderEmail].filter(Boolean).join('  ·  ')], [co.website],
    [[t.iec ? `IEC ${t.iec}` : '', t.gstin ? `GSTIN ${t.gstin}` : ''].filter(Boolean).join('  ·  ')], [t.lut ? `LUT ${t.lut}` : '']]);
  const yr = block(X2, [[b.name, 'B', 10.5], [b.person ? `Attn. ${b.person}` : ''], [b.address], [b.country], [b.vat ? `VAT ${b.vat}` : ''], [[b.email, b.phone].filter(Boolean).join('  ·  ')]]);
  y = Math.max(yl, yr) + 8;
  // terms strip
  const cells = [['Currency', cur], ['Delivery terms', `${o.incoterm || ''} ${o.place || ''}`.trim() || '-'], ['Ships from', o.port || 'India'], ['Country of origin', 'India']];
  if (b.country) cells.push(['Destination', b.country]);
  if (o.readyBy) cells.push(['Ready by', fmtDate(o.readyBy)]);
  const per = 3, cw = CW / per, boxH = Math.ceil(cells.length / per) * 32 + 8;
  pdf.rect(M, y, CW, boxH, { fill: SOFT });
  cells.forEach(([k, v], i) => { const cx = M + 12 + (i % per) * cw, cy = y + 17 + Math.floor(i / per) * 32; pdf.text(cx, cy, k.toUpperCase(), { f: 'B', size: 6.8, sp: 0.9, color: MUTED }); pdf.text(cx, cy + 12.5, pdfFit(v, 'R', 9.5, cw - 20), { size: 9.5, color: INK }); });
  y += boxH + 16;
  if (o.terms) { for (const ln of pdfWrap(`Payment: ${o.terms}`, 'R', 8.8, CW)) { pdf.text(M, y, ln, { size: 8.8, color: INK }); y += 12; } y += 8; }
  // items
  const COLS = [{ h: '#', w: 22 }, { h: 'Description', w: 0 }, { h: 'HS code', w: 54 }, { h: 'Qty', w: 34, right: true }, { h: 'Unit price', w: 76, right: true }, { h: `Amount ${cur}`, w: 88, right: true }];
  COLS[1].w = CW - COLS.reduce((a, c) => a + c.w, 0);
  const xs = []; let acc = M; for (const c of COLS) { xs.push(acc); acc += c.w; }
  const thead = () => { pdf.rect(M, y, CW, 20, { fill: NAVY }); COLS.forEach((c, i) => pdf.text(c.right ? xs[i] + c.w - 6 : xs[i] + 6, y + 13.2, c.h, { f: 'B', size: 7.8, sp: 0.3, color: '#FFFFFF', align: c.right ? 'right' : 'left' })); y += 20; };
  const room = (h, withHead) => { if (y + h > BOTTOM) { top(false); if (withHead) thead(); } };
  thead();
  (o.lines || []).forEach((l, i) => {
    const desc = pdfWrap(localTerms(l.desc || 'Item', UK), 'R', 9, COLS[1].w - 12); const h = desc.length * 11.5 + 10; room(h, true);
    const ty = y + 13.5;
    pdf.text(xs[0] + 6, ty, String(i + 1), { size: 9, color: MUTED });
    desc.forEach((ln, k) => pdf.text(xs[1] + 6, ty + k * 11.5, ln, { size: 9, color: INK }));
    pdf.text(xs[2] + 6, ty, l.hs || '', { size: 9, color: INK });
    pdf.text(xs[3] + COLS[3].w - 6, ty, String(Number(l.qty) || 0), { size: 9, color: INK, align: 'right' });
    pdf.text(xs[4] + COLS[4].w - 6, ty, num2(l.price), { size: 9, color: INK, align: 'right' });
    pdf.text(xs[5] + COLS[5].w - 6, ty, num2((Number(l.qty) || 0) * (Number(l.price) || 0)), { size: 9, color: INK, align: 'right' });
    y += h; pdf.line(M, y, R, y, { color: LINE, w: 0.5 });
  });
  // totals
  const total = orderTotal(o), adv = orderAdvance(o);
  const sums = [['Subtotal', orderSubtotal(o)]];
  if (Number(o.shipping)) sums.push(['Shipping and insurance', Number(o.shipping)]);
  if (Number(o.discount)) sums.push(['Discount', -Number(o.discount)]);
  room(sums.length * 15 + 90, false);
  y += 18; const TX = R - 236;
  for (const [k, v] of sums) { pdf.text(TX, y, k, { size: 9, color: MUTED }); pdf.text(R - 6, y, num2(v), { size: 9, color: INK, align: 'right' }); y += 15; }
  pdf.line(TX, y - 5, R, y - 5, { color: GOLD, w: 0.7 }); y += 11;
  pdf.text(TX, y, 'Total', { f: 'TB', size: 12.5, color: NAVY }); pdf.text(R - 6, y, `${cur} ${num2(total)}`, { f: 'TB', size: 12.5, color: NAVY, align: 'right' }); y += 18;
  if (adv > 0 && adv < total) {
    pdf.text(TX, y, `Advance ${pdfN(orderPct(o))}%${o.advanceDueAt ? `, by ${fmtDate(o.advanceDueAt)}` : ''}`, { size: 9, color: INK }); pdf.text(R - 6, y, `${cur} ${num2(adv)}`, { f: 'B', size: 9, color: INK, align: 'right' }); y += 13;
    pdf.text(TX, y, 'Balance, before dispatch', { size: 9, color: INK }); pdf.text(R - 6, y, `${cur} ${num2(total - adv)}`, { size: 9, color: INK, align: 'right' }); y += 13;
  }
  y += 10;
  for (const ln of pdfWrap(`Amount in words: ${amountWords(total, cur)}`, 'R', 8.8, CW)) { room(14, false); pdf.text(M, y, ln, { size: 8.8, color: INK }); y += 12; }
  // bank details on the left, signature on the right
  const bank = [['Beneficiary', t.beneficiary || company], ['Bank', [t.bankName, t.bankBranch].filter(Boolean).join(', ')], ['Account no.', t.accountNo], ['IFSC', t.ifsc], ['SWIFT', t.swift], ['AD code', t.adCode]].filter(([, v]) => v);
  const hasBank = !!(t.accountNo && (t.swift || t.ifsc)); const bw = Math.round(CW * 0.58); const bh = Math.max(92, 26 + (hasBank ? bank.length * 12.5 : 13));
  room(bh + 30, false);
  y += 14; const y0 = y;
  pdf.rect(M, y0, bw, bh, { stroke: LINE, w: 0.6 });
  pdf.text(M + 12, y0 + 16, 'BANK DETAILS FOR PAYMENT', { f: 'B', size: 7.2, sp: 1.1, color: GOLD });
  let by = y0 + 30;
  if (hasBank) for (const [k, v] of bank) { pdf.text(M + 12, by, k, { size: 8.8, color: MUTED }); pdf.text(M + 88, by, pdfFit(v, 'R', 8.8, bw - 100), { size: 8.8, color: INK }); by += 12.5; }
  else pdf.text(M + 12, by, 'We will send our bank details with this invoice.', { size: 8.8, color: INK });
  pdf.text(R, y0 + 16, `For ${company}`, { f: 'B', size: 9, color: INK, align: 'right' });
  pdf.line(R - 160, y0 + bh - 16, R, y0 + bh - 16, { color: INK, w: 0.5 });
  pdf.text(R, y0 + bh - 4, co.senderName ? `${co.senderName}, authorised signatory` : 'Authorised signatory', { size: 8.2, color: MUTED, align: 'right' });
  y = y0 + bh + 20;
  // declarations
  const notes = [
    'All diamonds in these pieces are laboratory-grown diamonds.',
    uk ? 'Goods of Indian origin. Proof of origin for 0% UK import duty under the UK–India trade agreement comes with the shipment.' : 'Goods of Indian origin.',
    /DDP/.test(o.incoterm || '') ? 'Prices include delivery, import duty and taxes to the address above.' : 'Import VAT and any duty in the destination country are paid by the buyer.',
    'This is a proforma invoice, not a tax invoice. The commercial invoice is issued at dispatch.',
    ...(o.notes ? [localTerms(o.notes, UK)] : []),
  ];
  for (const n of notes) {
    const lns = pdfWrap(n, 'R', 8.2, CW - 12); room(lns.length * 11 + 4, false);
    lns.forEach((ln, k) => { if (!k) pdf.text(M, y, '•', { size: 8.2, color: GOLD }); pdf.text(M + 10, y, ln, { size: 8.2, color: MUTED }); y += 11; }); y += 2;
  }
  // footer on every page
  const n = pdf.pageCount; const foot = [company, co.address, co.senderEmail].filter(Boolean).join('  ·  ');
  for (let i = 0; i < n; i++) {
    pdf.onPage(i); pdf.line(M, pdf.H - 46, R, pdf.H - 46, { color: LINE, w: 0.5 });
    pdf.text(M, pdf.H - 33, pdfFit(foot, 'R', 7, CW - 70), { size: 7, color: MUTED }); pdf.text(R, pdf.H - 33, `Page ${i + 1} of ${n}`, { size: 7, color: MUTED, align: 'right' });
  }
  return pdf.bytes();
}
const piFileName = (o) => `${String(o.number || 'proforma').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${String((o.buyer || {}).name || 'buyer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}.pdf`;
function toBase64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function piMail(o) {
  const co = settings().company; const b = o.buyer || {}; const total = orderTotal(o), adv = orderAdvance(o);
  const first = String(b.person || '').trim().split(/\s+/)[0];
  const pay = adv > 0 && adv < total
    ? `To confirm the order, please transfer the advance of ${fmtMoney(adv, o.currency)} to the bank account on the invoice${o.advanceDueAt ? ` by ${fmtDate(o.advanceDueAt)}` : ''}. The balance is due before dispatch, after we send you photos and certificates of the finished pieces.`
    : `To confirm the order, please transfer ${fmtMoney(total, o.currency)} to the bank account on the invoice.`;
  return {
    subject: `Proforma invoice ${o.number}${co.name ? ` from ${co.name}` : ''}`,
    body: [first ? `Hello ${first},` : 'Hello,', '', `Please find attached our proforma invoice ${o.number} for ${fmtMoney(total, o.currency)}.`, '', pay, '',
      `Production starts as soon as the payment arrives${o.readyBy ? `, and the pieces should be ready by ${fmtDate(o.readyBy)}` : ''}.`, '', 'Best regards,', co.senderName || '', co.name || ''].join('\n').replace(/\n+$/, ''),
  };
}

/* ================= Gmail: sends from the viewer's own Gmail through the claude.ai connector ================= */
const gmailOn = () => S.gm.state === 'ready';
async function initGmail(mcp) {
  if (!mcp) return;
  S.gm.api = mcp;
  try {
    const r = await mcp.listTools(GMAIL); const sv = ((r && r.servers) || []).find((x) => x.server === GMAIL);
    S.gm.state = !sv || !(sv.tools || []).length ? 'missing' : sv.authStatus === 'needs_reauth' ? 'reauth' : 'ready';
  } catch (e) { S.gm.state = e && e.code === 'needs_reauth' ? 'reauth' : 'missing'; }
  schedule();
}
async function gmailCall(tool, input) {
  if (!S.gm.api) return { ok: false, code: 'not_granted', message: '' };
  try { const r = await S.gm.api.callTool(GMAIL, tool, input); S.gm.used = true; return { ok: true, payload: (r && r.payload && typeof r.payload === 'object' ? r.payload : {}) }; }
  catch (e) {
    const code = (e && e.code) || 'upstream_error';
    if (code === 'needs_reauth') S.gm.state = 'reauth'; else if (code === 'server_not_connected' || code === 'server_not_found') S.gm.state = 'missing';
    return { ok: false, code, message: (e && e.message) || '' };
  }
}
function gmailError(r, isWrite = true) {
  const c = r && r.code;
  if (c === 'no_email') return 'Add an email address first.';
  if (c === 'suppressed') return 'That address is on your do-not-contact list.';
  if (c === 'needs_reauth') return 'Gmail needs reconnecting: claude.ai Settings, Connectors, Gmail.';
  if (c === 'server_not_connected' || c === 'server_not_found') return "Gmail isn't connected. Add it in claude.ai Settings, Connectors.";
  if (c === 'selection_required') return 'Choose which Gmail to use when Claude asks, then try again.';
  if (c === 'not_in_manifest' || c === 'consent_required') return "Gmail isn't allowed for this app. Reopen the app and allow Gmail when asked.";
  if (c === 'blocked_by_policy' || c === 'approval_required') return "Your organisation doesn't allow Gmail here.";
  if (c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed') return "Gmail can't be used in this view.";
  if (c === 'tool_error') return `Gmail said no: ${trunc(r.message || 'no reason given', 140)}`;
  if (c === 'cancelled') return 'Cancelled.';
  return isWrite ? "Gmail didn't confirm. Check your Sent folder before you try again." : "Gmail didn't answer. Try again in a moment.";
}
// Which address Gmail sends from, read from the newest sent email.
async function gmailAccount(force) {
  if (S.gm.checking || (S.gm.account && !force)) return S.gm.account;
  S.gm.checking = true; schedule();
  const r = await gmailCall('search_threads', { query: 'in:sent', pageSize: 1, view: 'THREAD_VIEW_METADATA_ONLY' });
  S.gm.checking = false;
  if (r.ok) {
    const th = ((r.payload && r.payload.threads) || [])[0]; const m = th && (th.messages || [])[0];
    const hit = m && String(m.sender || '').match(/[^\s<>"]+@[^\s<>"]+/);
    S.gm.account = hit ? hit[0].toLowerCase() : ''; S.gm.note = hit ? '' : 'none';
  } else S.gm.note = gmailError(r, false);
  schedule(); return S.gm.account;
}
function gmailMismatch() { const want = String(settings().company.senderEmail || '').trim().toLowerCase(); return S.gm.account && want && S.gm.account !== want ? want : ''; }
async function gmailSendStep(bid, stepId) {
  const b = S.businesses.get(bid); if (!b) return { ok: false, code: 'gone' };
  const step = stepsFor(seqKindOf(b)).find((x) => x.id === stepId); const to = String(contactOf(b).email || '').trim();
  if (!step || !to) return { ok: false, code: 'no_email' };
  if (isSuppressed(to)) return { ok: false, code: 'suppressed' };
  const e = emailText(b, step);
  const r = await gmailCall('send_message', { to: [to], subject: e.subject, body: e.body });
  if (r.ok) await markStep(S.businesses.get(bid) || b, stepId, 'sent', { via: 'gmail', ...(r.payload.id ? { gmailId: String(r.payload.id) } : {}), ...(r.payload.threadId ? { threadId: String(r.payload.threadId) } : {}) });
  return r;
}
// An email goes out in a batch only when nothing about it needs a human look first.
function autoSendable(x) {
  const b = x.b; const c = contactOf(b); if (!c.email || needsConsent(b) || isSuppressed(c.email)) return false;
  const e = emailText(b, x.step); return !complianceIssues(`${e.subject}\n${e.body}`, b.country).length;
}
async function gmailSendAll() {
  const list = todayData().emails.filter(autoSendable);
  S.gm.confirm = '';
  if (!list.length) { toast('No emails are ready to send without a check.'); render(); return; }
  S.gm.batch = { total: list.length, sent: 0, stop: false }; render();
  let fail = null;
  for (const x of list) {
    if (S.gm.batch.stop) break;
    const r = await gmailSendStep(x.b.id, x.step.id);
    if (!r.ok) { fail = r; break; }
    S.gm.batch.sent++; schedule();
    if (S.gm.batch.sent < list.length && !S.gm.batch.stop) await new Promise((res) => setTimeout(res, S.gm.gap));
  }
  const n = S.gm.batch.sent; const stopped = S.gm.batch.stop && n < list.length; S.gm.batch = null; render();
  toast(fail ? `${n} sent. Stopped: ${gmailError(fail)}` : `${n} ${n === 1 ? 'email' : 'emails'} sent from Gmail${stopped ? '. Stopped before the rest.' : ''}`);
}
function lastSubject(b) { const ls = lastStepDone(b); if (!ls) return ''; const st = allSteps().find((x) => x.id === ls.id); return st && st.channel === 'email' ? emailText(b, st).subject : ''; }
async function gmailSendReply(bid) {
  const b = S.businesses.get(bid); if (!b) return { ok: false, code: 'gone' };
  const to = String(contactOf(b).email || '').trim(); const text = String(fv('draft.' + bid)).trim();
  if (!to) return { ok: false, code: 'no_email' };
  let threadId = '', subject = '';
  const lastIn = inbound(b).filter((m) => m.threadId).slice(-1)[0];
  if (lastIn) { threadId = lastIn.threadId; subject = lastIn.subject || ''; }
  const s = threadId ? { ok: false } : await gmailCall('search_threads', { query: `from:${to}`, pageSize: 1 });
  if (s.ok) { const th = ((s.payload && s.payload.threads) || [])[0]; if (th) { threadId = String(th.id || ''); const m = (th.messages || [])[0]; subject = String((m && m.subject) || ''); } }
  if (!subject) subject = lastSubject(b) || `${settings().company.name || 'Our'} laboratory-grown diamond jewellery`;
  if (!/^re:/i.test(subject)) subject = 'Re: ' + subject;
  const input = { to: [to], subject, body: text }; if (threadId) input.replyThreadId = threadId;
  const r = await gmailCall('send_message', input);
  if (r.ok) await markAnswered(bid, text);
  return r;
}
async function gmailSendPi(oid, mode) {
  const o = S.orders.get(oid); if (!o) return { ok: false, code: 'gone' };
  const m = piMail(o); const to = String(fv('pm.to', (o.buyer || {}).email || '')).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, code: 'no_email' };
  const input = { to: [to], subject: String(fv('pm.subject', m.subject)).trim() || m.subject, body: String(fv('pm.body', m.body)), attachments: [{ content: toBase64(piPdf(o)), filename: piFileName(o), mimeType: 'application/pdf' }] };
  const r = await gmailCall(mode === 'send' ? 'send_message' : 'create_draft', input);
  if (r.ok) {
    const patch = { updatedAt: nowIso() };
    if (mode === 'send') Object.assign(patch, { emailedAt: nowIso(), emailedTo: to });
    else { const u = String(r.payload.viewUrl || ''); Object.assign(patch, { draftAt: nowIso(), draftUrl: /^https:\/\/mail\.google\.com\//.test(u) ? u : '' }); }
    await write(() => Data.update('orders', oid, patch));
  }
  return r;
}

/* ================= Gmail replies: they come into Leads by themselves ================= */
function senderEmail(x) { const m = String(x || '').match(/[^\s<>"'(),;:]+@[^\s<>"'(),;:]+\.[a-z]{2,}/i); return m ? m[0].toLowerCase() : ''; }
// Buyers we have written to, by address and, for company domains, by domain (a colleague may answer)
function watchList() {
  const byEmail = new Map(), byDomain = new Map();
  for (const b of allBiz()) {
    const e = String(contactOf(b).email || '').trim().toLowerCase(); if (!e.includes('@')) continue;
    if (!(contacted(b) || b.lead || ['active', 'replied', 'closed'].includes(b.status))) continue;
    byEmail.set(e, b);
    const d = emailDomain(e); if (d && !FREE_MAIL.has(d)) byDomain.set(d, byDomain.has(d) && byDomain.get(d) && byDomain.get(d).id !== b.id ? null : b);
  }
  return { byEmail, byDomain };
}
function matchBuyer(sender, w) { const e = senderEmail(sender); if (!e) return null; if (w.byEmail.has(e)) return w.byEmail.get(e); return w.byDomain.get(emailDomain(e)) || null; }
function firstContactAt(b) {
  const ts = []; const add = (done) => { for (const x of Object.values(done || {})) if (x && (x.how === 'sent' || x.how === 'done') && x.at) ts.push(String(x.at)); };
  add(b.done); for (const r of b.rounds || []) add(r.done); for (const m of b.messages || []) if (m.at) ts.push(String(m.at));
  return ts.length ? ts.sort()[0] : String(b.createdAt || nowIso());
}
// Keep what they wrote, not the quoted email underneath
function stripQuoted(t) {
  t = String(t || '').replace(/\r\n/g, '\n'); let end = t.length;
  for (const re of [/^On [^\n]{4,200}\n?[^\n]{0,200}wrote:\s*$/m, /^-{2,}\s*Original Message\s*-{2,}/mi, /^_{6,}\s*$/m, /^From:\s.+$/m, /^Sent from my (iPhone|iPad|Android|Samsung|mobile)[^\n]*$/mi]) { const m = re.exec(t); if (m && m.index > 0 && m.index < end) end = m.index; }
  return t.slice(0, end).split('\n').filter((l) => !/^\s*>/.test(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function guessTag(t) {
  const x = String(t || '').toLowerCase();
  if (/\bunsubscribe\b|remove (me|us) from|^\s*stop\s*[.!]?\s*$|please stop (emailing|sending|contacting)|do not (email|contact) (me|us)/m.test(x)) return 'unsubscribe';
  if (/not interested|no,? thanks?\b|no thank you|we('re| are) not (looking|interested)|(don'?t|do not) (sell|stock|carry) lab/.test(x)) return 'not_interested';
  if (/not (right )?now|maybe later|next (year|season)|in a few months|get back to you (later|in)/.test(x)) return 'not_now';
  if (/\bsamples?\b/.test(x)) return 'samples';
  if (/\bprices?\b|pricing|\bcosts?\b|\bquote\b|wholesale|\bmoq\b|minimum order|price list/.test(x)) return 'price';
  if (/interested|catalogue|catalog|send (me|us)|would like|love to see|more info/.test(x)) return 'interested';
  return 'other';
}
const isOurs = (m) => (m.labelIds || m.label_ids || []).includes('SENT');
const msgAt = (m) => { const t = Date.parse(m.date || '') || Number(m.internalDate) || Date.now(); return new Date(t).toISOString(); };
const msgBody = (m) => stripQuoted(m.plaintextBody || m.plaintext_body || '') || String(m.snippet || '').trim();
async function gmailAnswered(bid, m, threadId) {
  const b = S.businesses.get(bid); if (!b || !b.lead) return;
  const at = msgAt(m); const l = b.lead;
  const messages = [...(b.messages || []), { id: uid(), dir: 'out', channel: 'email', at, text: msgBody(m).slice(0, MSG_MAX) || '(answered in Gmail)', by: 'Gmail', gmailId: String(m.id), threadId, url: String(m.viewUrl || '') }].slice(-MSG_KEEP);
  const hrs = l.lastInAt ? Math.max(0, (Date.parse(at) - Date.parse(l.lastInAt)) / 3600000) : null;
  const lead = { ...l, awaitingReply: false, lastOutAt: at, remindAt: null, replyHours: [...(l.replyHours || []), ...(hrs != null ? [Math.round(hrs * 10) / 10] : [])].slice(-30) };
  if (lead.stage === 'new') lead.stage = 'replied';
  await write(() => updateBiz(bid, { messages, lead }));
}
function syncLine() {
  const g = S.gm.sync; const last = g.at || settings().gmailSync.at || '';
  if (g.running) return 'Checking Gmail for replies…';
  if (g.error) return `Gmail check didn't finish: ${g.error}`;
  if (last) return `Replies from Gmail come in by themselves while the app is open. Last checked ${fmtWhen(last)}.`;
  return 'Tap Check Gmail once and allow Gmail. After that, replies come in by themselves while the app is open.';
}
// Threads from Gmail (through the connector, or copied in by the background check) become replies in Leads.
// `full(th, msgs)` may read a whole thread when the search preview might hide something new.
async function ingestThreads(threads, w, full) {
  let added = 0, auto = 0;
  const imported = (bid, mid) => ((S.businesses.get(bid) || {}).messages || []).some((x) => x.gmailId === String(mid));
  for (const th of threads) {
    let msgs = Array.isArray(th.messages) ? th.messages : [];
    if (full) {
      const fresh = msgs.some((m) => { const b = !isOurs(m) && matchBuyer(m.sender, w); return b && !imported(b.id, m.id); });
      if (fresh || (Number(th.messageCount) || 0) > msgs.length) msgs = await full(th, msgs);
    }
    const sorted = msgs.slice().sort((a, b) => msgAt(a).localeCompare(msgAt(b)));
    for (const m of sorted) {
      const b0 = !isOurs(m) && matchBuyer(m.sender, w); if (!b0 || imported(b0.id, m.id)) continue;
      const b = S.businesses.get(b0.id); if (!b) continue;
      const at = msgAt(m); if (Date.parse(at) < Date.parse(firstContactAt(b)) - 12 * 3600000) continue;
      const text = msgBody(m);
      if (AUTO_REPLY.test(String(m.subject || '')) || AUTO_REPLY.test(text.slice(0, 160))) { auto++; continue; }
      const ok = await logReply(b.id, { channel: 'email', text, at, tag: guessTag(text), gmail: { id: String(m.id), threadId: String(th.id), url: String(m.viewUrl || th.viewUrl || ''), subject: String(m.subject || '') } });
      if (!ok) continue; added++;
      const later = sorted.find((x) => isOurs(x) && msgAt(x) > at);
      if (later) await gmailAnswered(b.id, later, String(th.id));
    }
  }
  return { added, auto };
}
async function ingestBounces(msgs, w) {
  let bounced = 0;
  for (const m of msgs) {
    const hay = `${m.subject || ''} ${m.snippet || ''} ${String(m.plaintextBody || '').slice(0, 4000)}`.toLowerCase();
    for (const [e, b0] of w.byEmail) {
      const b = S.businesses.get(b0.id); if (!b || !hay.includes(e) || !['active', 'closed'].includes(b.status)) continue;
      if (await write(() => updateBiz(b.id, { status: 'bounced', bounce: { at: msgAt(m), gmailId: String(m.id) } }))) bounced++;
    }
  }
  return bounced;
}
// The addresses Gmail is searched for: a buyer's company domain (so a colleague's answer counts), or the exact address
function watchTerms(w) { return [...new Set([...w.byEmail.keys()].map((e) => (w.byDomain.get(emailDomain(e)) ? emailDomain(e) : e)))].sort(); }
async function gmailSync(manual) {
  if (!gmailOn() || S.gm.sync.running) return;
  const w = watchList();
  // one search term per buyer: their company domain (so a colleague's answer counts), or the exact address on free mail or a shared domain
  const terms = watchTerms(w);
  if (!terms.length) { if (manual) toast('Nobody to check yet. The app looks for replies from buyers you have emailed.'); return; }
  const last = S.gm.sync.at || settings().gmailSync.at || '';
  const days = Math.min(30, Math.max(2, last ? Math.ceil((Date.now() - Date.parse(last)) / 86400000) + 1 : 14));
  S.gm.sync = { ...S.gm.sync, running: true, error: '' }; schedule();
  let added = 0, bounced = 0, auto = 0, fail = null; const threads = new Map();
  for (let i = 0; i < terms.length; i += 15) {
    const r = await gmailCall('search_threads', { query: `(${terms.slice(i, i + 15).map((t) => `from:${t}`).join(' OR ')}) newer_than:${days}d`, pageSize: 50 });
    if (!r.ok) { fail = r; break; }
    for (const th of r.payload.threads || []) if (th && th.id) threads.set(String(th.id), th);
  }
  if (!fail) {
    // search shows only the oldest few messages and no bodies, so read the whole thread when something may be new
    const full = async (th, msgs) => { const t = await gmailCall('get_thread', { threadId: String(th.id), messageFormat: 'PLAIN_TEXT' }); return t.ok && Array.isArray(t.payload.messages) ? t.payload.messages : msgs; };
    const res = await ingestThreads([...threads.values()], w, full); added = res.added; auto = res.auto;
    // bounces: the delivery-failure notice names the address that failed
    const r = await gmailCall('search_threads', { query: `(from:mailer-daemon OR from:postmaster) newer_than:${days}d`, pageSize: 25 });
    if (r.ok) bounced = await ingestBounces((r.payload.threads || []).flatMap((th) => th.messages || []), w);
  }
  const at = nowIso();
  S.gm.sync = { running: false, at: fail ? S.gm.sync.at : at, added, bounced, error: fail ? gmailError(fail, false) : '' };
  if (!fail) await write(() => (S.settingsDoc ? Data.update('config', 'settings', { gmailSync: { at, added, bounced } }) : saveSettings({ gmailSync: { at, added, bounced } })));
  render();
  if (fail) { if (manual) toast(S.gm.sync.error); return; }
  if (added || bounced) toast([added ? `${added} new ${added === 1 ? 'reply' : 'replies'} from Gmail` : '', bounced ? `${bounced} ${bounced === 1 ? 'email' : 'emails'} bounced` : ''].filter(Boolean).join(', '));
  else if (manual) toast(`No new replies${auto ? `. ${auto} automatic ${auto === 1 ? 'answer' : 'answers'} skipped` : ''}`);
}
// Runs on its own once Gmail is allowed: when the app opens, every 15 minutes, and when you come back to it
async function gmailAuto() {
  if (!gmailOn() || S.gm.sync.running || document.visibilityState === 'hidden' || S.gm.batch) return;
  if (S.mode === 'db' && !(S.loaded.businesses && S.loaded.settings)) return;
  const last = S.gm.sync.at || settings().gmailSync.at || '';
  if (last && Date.now() - Date.parse(last) < SYNC_EVERY - 30000) return;
  let st = 'prompt'; try { st = S.perm ? await S.perm.state('mcp:' + GMAIL) : 'prompt'; } catch { st = 'prompt'; }
  if (st === 'granted' || S.gm.used) gmailSync(false);
}

/* ================= phone app: email opens in the phone's mail app ================= */
const onPhone = () => !!S.device;
const phoneMail = () => onPhone() && !gmailOn();
const mailAppName = () => (S.device && S.device.mailApp() === 'gmail' ? 'Gmail' : 'Mail');
const mailHref = (to, subject, body) => S.device.mailHref(String(to || '').trim(), subject, body);
// A link that opens the mail app with everything filled in. `spec` rebuilds it at tap time from text still being edited.
function mailOpen(to, subject, body, key, primary, spec) {
  return `<a class="btn small${primary ? ' primary' : ''}" href="${esc(mailHref(to, subject, body))}" data-act="mail-open" data-key="${esc(key)}"${spec ? ` data-mail="${esc(spec)}"` : ''}>${ico('mail')}Open in ${mailAppName()}</a>`;
}
function replySubject(b) {
  const withSubj = (b.messages || []).filter((m) => m.channel === 'email' && m.subject).slice(-1)[0];
  const s = (withSubj && withSubj.subject) || lastSubject(b) || `${settings().company.name || 'Our'} laboratory-grown diamond jewellery`;
  return /^re:/i.test(s) ? s : 'Re: ' + s;
}
function mailFor(spec) {
  const [kind, a, c] = String(spec || '').split(':');
  if (kind === 'reply') { const b = S.businesses.get(a); return b ? mailHref(contactOf(b).email, replySubject(b), String(fv('draft.' + a))) : ''; }
  if (kind === 'trip') {
    const t = S.trips.get(a); const st = t && (t.stops || []).find((x) => x.id === c); const b = st && S.businesses.get(st.bid); if (!b) return '';
    const m = tripMailText(t, st, b, fv('tm.subject', (t.mail || VISIT_TEMPLATE).subject), fv('tm.body', (t.mail || VISIT_TEMPLATE).body));
    return mailHref(contactOf(b).email, m.subject, m.body);
  }
  return '';
}
async function tripTold(tid, sid) {
  const t = S.trips.get(tid); const st = t && (t.stops || []).find((x) => x.id === sid); const b = st && S.businesses.get(st.bid); if (!b) return;
  const subject = fv('tm.subject', (t.mail || VISIT_TEMPLATE).subject), body = fv('tm.body', (t.mail || VISIT_TEMPLATE).body);
  const m = tripMailText(t, st, b, subject, body); const at = nowIso();
  // the note counts as contact, so their answer comes in with the other replies
  await write(() => updateBiz(b.id, { messages: [...(b.messages || []), { id: uid(), dir: 'out', channel: 'email', at, text: `${m.subject}\n\n${m.body}`.slice(0, MSG_MAX), subject: m.subject }].slice(-MSG_KEEP) }));
  const cur = S.trips.get(tid);
  if (cur && await write(() => Data.update('trips', tid, { stops: (cur.stops || []).map((x) => (x.id === sid ? { ...x, emailedAt: at } : x)), mail: { subject, body }, updatedAt: at }))) toast(`${b.name} knows you're coming`);
}
function inboxLine() {
  const x = settings().inboxSync;
  if (x.at) return `Replies from Gmail come in by themselves a few times a day. Last checked ${fmtWhen(x.at)}.`;
  return "Replies from Gmail start coming in by themselves once Claude's background check runs. Until then, log a reply on the buyer when one arrives.";
}
function phoneMailCard() {
  const want = settings().company.senderEmail;
  return `<div class="ccard"><h3>${ico('mail')}Email</h3><span><span class="chip good">${ico('check')}Ready</span></span>
    <p>Emails, replies and visit notes open in your mail app with the address, subject and message filled in. You press send there, then mark it sent here. Proforma invoices go through the share sheet with the PDF attached.</p>
    <div class="field"><span class="lab">Open emails in</span>${seg('mailapp', S.device.mailApp(), [['mail', 'Mail app'], ['gmail', 'Gmail app']])}</div>
    <p class="hint" style="margin:0">${S.device.mailApp() === 'gmail' ? 'Needs the Gmail app on this phone.' : 'Opens your default mail app. To use Gmail without changing this, pick Gmail app.'}${want ? ` Send from ${esc(want)} so replies reach the right inbox.` : ''}</p>
    <p class="hint" style="margin:0">${esc(inboxLine())}</p></div>`;
}
function accountSection() {
  const who = S.device.account();
  return `<section class="section"><h2>This phone</h2><div class="panel"><p style="margin:0">${who ? `Signed in as <b class="mono sel">${esc(who)}</b>.` : 'Signed in.'} Your data lives in your own database, so any phone or computer you sign in on shows the same buyers and orders.</p>
    <div class="actions"><button type="button" class="btn" data-act="sign-out">Sign out</button></div></div></section>`;
}
// The background check reads config/watch to know whose replies to look for, and copies new mail into 'inbox'.
let inboxTimer = 0;
function queueInbox() { if (!inboxTimer) inboxTimer = setTimeout(() => { inboxTimer = 0; processInbox(); }, 400); }
async function processInbox() {
  if (!S.device || S.mode !== 'db' || S.inboxBusy || !(S.loaded.businesses && S.loaded.settings)) return;
  const w = watchList(); const terms = watchTerms(w);
  if (S.watchDoc && JSON.stringify(S.watchDoc.terms || null) !== JSON.stringify(terms)) {
    S.watchDoc = { ...S.watchDoc, terms };
    write(() => Data.set('config', 'watch', { terms, updatedAt: nowIso() }));
  }
  const pending = [...S.inbox.values()].filter((d) => !d.doneAt).sort((a, b) => String(a.fetchedAt || '').localeCompare(String(b.fetchedAt || '')));
  if (!pending.length) return;
  S.inboxBusy = true;
  try {
    const threads = pending.filter((d) => d.kind !== 'bounce' && Array.isArray(d.messages)).map((d) => ({ id: String(d.threadId || d.id), messages: d.messages, viewUrl: String(d.viewUrl || '') }));
    const { added } = await ingestThreads(threads, w, null);
    const bounced = await ingestBounces(pending.filter((d) => d.kind === 'bounce').map((d) => ({ id: d.gmailId || d.id, subject: d.subject, snippet: d.snippet, plaintextBody: d.plaintextBody, date: d.date })), w);
    const at = nowIso();
    for (const d of pending) await write(() => Data.update('inbox', d.id, { doneAt: at }));
    // keep the inbox small: handled mail older than 60 days goes
    const old = Date.now() - 60 * 86400000;
    for (const d of S.inbox.values()) if (d.doneAt && Date.parse(d.doneAt) < old) await write(() => Data.remove('inbox', d.id));
    if (added || bounced) toast([added ? `${added} new ${added === 1 ? 'reply' : 'replies'} from Gmail` : '', bounced ? `${bounced} ${bounced === 1 ? 'email' : 'emails'} bounced` : ''].filter(Boolean).join(', '));
  } finally { S.inboxBusy = false; schedule(); }
}
/* ================= showrooms: every jewellery shop in a city, from OpenStreetMap ================= */
const placeKey = (country, city) => `${placeText(country)}--${placeText(city)}`;
const canFind = () => !!S.device;
const metres = (a, b) => { const r = Math.PI / 180; const dy = (b.lat - a.lat) * r, dx = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r); return 6371000 * Math.hypot(dx, dy); };
const NAME_NOISE = /\b(the|ltd|limited|plc|llp|and|co|company|jewellers?|jewellery|jewelers?|jewelry|jewels?|uk)\b/g;
function nameKey(name) {
  const plain = String(name || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ');
  const k = plain.replace(NAME_NOISE, ' ').replace(/\s+/g, '');
  return k.length >= 3 ? k : plain.replace(/\s+/g, '');
}
const phoneKey = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 9 ? d.slice(-9) : ''; };
const siteKey = (u) => { const d = cleanDomain(u); return d && d.includes('.') && !SHARED_HOSTS.test(d) ? d : ''; };
const ukDistrict = (pc) => (String(pc || '').toUpperCase().match(/^([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}$/) || [])[1] || '';
// one OpenStreetMap element (a shop's point or building) into the few facts the app keeps
function shopFrom(el) {
  const t = (el && el.tags) || {}; const name = String(t.name || t['name:en'] || t.brand || '').replace(/\s+/g, ' ').trim();
  const lat = el && (el.lat ?? (el.center && el.center.lat)); const lon = el && (el.lon ?? (el.center && el.center.lon));
  if (!name || typeof lat !== 'number' || typeof lon !== 'number') return null;
  const s = { id: `${String(el.type || 'n')[0]}${el.id}`, name: name.slice(0, 120), lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 };
  const put = (k, v) => { v = String(v || '').split(';')[0].trim(); if (v) s[k] = v.slice(0, 200); };
  put('brand', t.brand);
  put('street', [t['addr:housenumber'], t['addr:street'] || t['addr:place']].filter(Boolean).join(' '));
  put('postcode', String(t['addr:postcode'] || '').toUpperCase());
  put('area', t['addr:suburb'] || t['addr:quarter'] || t['addr:neighbourhood']);
  put('town', t['addr:city'] || t['addr:town']);
  put('phone', t.phone || t['contact:phone'] || t.mobile || t['contact:mobile']);
  put('email', String(t.email || t['contact:email'] || '').toLowerCase());
  put('website', t.website || t['contact:website'] || t.url);
  put('instagram', t['contact:instagram'] || t.instagram);
  put('facebook', t['contact:facebook'] || t.facebook);
  if (t.craft === 'jeweller' && !/^jewel/.test(t.shop || '')) s.workshop = 1;
  if (t.brand || t['brand:wikidata'] || CHAIN_NAMES.test(name)) s.chain = 1;
  return s;
}
// a shop drawn both as a point and as its building comes back twice: keep the fuller one
function dedupeShops(list) {
  const out = [];
  for (const s of list.slice().sort((a, b) => Object.keys(b).length - Object.keys(a).length)) if (!out.some((x) => nameKey(x.name) === nameKey(s.name) && metres(x, s) < 80)) out.push(s);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
// Claude's findings for one shop take the place of the map's own details where it found something
function mergeShop(s, r) {
  if (!r) return s;
  const m = { ...s, checked: 1 };
  for (const k of RESEARCH_KEYS) { const v = String(r[k] || '').trim(); if (v) m[k] = k === 'email' ? v.toLowerCase() : v.slice(0, 200); }
  if (r.legalForm && LEGAL_LABEL[r.legalForm]) m.legalForm = r.legalForm;
  if (r.companyNo) m.companyNo = String(r.companyNo).trim().slice(0, 20);
  if (r.labGrown === true) m.labGrown = 1;
  if (r.closed) m.closed = 1;
  if (r.note) m.note = String(r.note).trim().slice(0, 200);
  return m;
}
const researchOf = (key) => S.research.get(key) || null;
const markChain = (s) => (s.chain || !CHAIN_NAMES.test(s.name) ? s : { ...s, chain: 1 });
const shopsOf = (doc) => { const res = (researchOf(placeKey(doc.country, doc.city)) || {}).results || {}; return (doc.shops || []).map((s) => markChain(mergeShop(s, res[s.id]))); };
// Showrooms Claude's research found that the map is missing (research.more). They are listed and saved like the
// map's own; without coordinates they have no dot on the map.
const moreOf = (doc) => {
  const m = (researchOf(placeKey(doc.country, doc.city)) || {}).more || {}; const txt = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  return Object.entries(m).filter(([, r]) => r && txt(r.name, 120)).map(([id, r]) => {
    const base = { id: String(id).replace(/[^A-Za-z0-9_.:@+-]/g, '-').slice(0, 80), name: txt(r.name, 120), town: txt(r.town, 80) || doc.city, extra: 1 };
    for (const k of ['street', 'area']) if (txt(r[k], 120)) base[k] = txt(r[k], 120);
    if (txt(r.postcode, 12)) base.postcode = txt(r.postcode, 12).toUpperCase();
    if (Number.isFinite(r.lat) && Number.isFinite(r.lon)) { base.lat = r.lat; base.lon = r.lon; }
    if (r.chain === true) base.chain = 1;
    return markChain(mergeShop(base, r));
  }).sort((a, b) => a.name.localeCompare(b.name));
};
// The map's showrooms and then Claude's, leaving out any of Claude's the map has after all (same name, website or phone).
function allShopsOf(doc) {
  const map = shopsOf(doc); const names = new Set(map.map((s) => nameKey(s.name)));
  const sites = new Set(map.map((s) => siteKey(s.website)).filter(Boolean)); const phones = new Set(map.map((s) => phoneKey(s.phone)).filter(Boolean));
  return [...map, ...moreOf(doc).filter((s) => !names.has(nameKey(s.name)) && !(siteKey(s.website) && sites.has(siteKey(s.website))) && !(phoneKey(s.phone) && phones.has(phoneKey(s.phone))))];
}
const onMap = (s) => Number.isFinite(s.lat) && Number.isFinite(s.lon);
// Online sellers based in the city (D2C brands, Etsy and Instagram shops): no map position, found by Claude's research.
const onlineOf = (doc) => { const on = (researchOf(placeKey(doc.country, doc.city)) || {}).online || {}; return Object.entries(on).filter(([, r]) => r && String(r.name || '').trim()).map(([id, r]) => ({ ...mergeShop({ id: String(id).replace(/[^A-Za-z0-9_.:@+-]/g, '-').slice(0, 80), name: String(r.name).replace(/\s+/g, ' ').trim().slice(0, 120), town: doc.city }, r), online: 1 })).sort((a, b) => a.name.localeCompare(b.name)); };
function buyerIndex(country, city) {
  const idx = { osm: new Map(), name: new Map(), site: new Map(), phone: new Map() };
  for (const b of allBiz()) {
    if (placeText(b.country) !== placeText(country)) continue;
    if (b.osm) idx.osm.set(b.osm, b);
    if (placeText(b.city) === placeText(city)) idx.name.set(nameKey(b.name), b);
    const site = siteKey(contactOf(b).website); if (site) idx.site.set(site, b);
    const ph = phoneKey(contactOf(b).phone); if (ph) idx.phone.set(ph, b);
  }
  return idx;
}
const buyerFor = (s, idx) => idx.osm.get(s.id) || idx.name.get(nameKey(s.name)) || (siteKey(s.website) && idx.site.get(siteKey(s.website))) || (phoneKey(s.phone) && idx.phone.get(phoneKey(s.phone))) || null;
const brandOf = (s) => s.brand || ((s.name.match(CHAIN_NAMES) || [])[0] || s.name).replace(/^the /i, '').trim();
function showroomReport(doc) {
  const shops = allShopsOf(doc); const idx = buyerIndex(doc.country, doc.city);
  const rows = shops.map((s) => ({ s, b: buyerFor(s, idx) }));
  const tally = (list, keyOf) => { const m = new Map(); for (const x of list) { const k = keyOf(x); if (!k) continue; const e = m.get(k) || { label: k, n: 0, names: new Map() }; e.n++; m.set(k, e); if (x.s.area) e.names.set(x.s.area, (e.names.get(x.s.area) || 0) + 1); } return [...m.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, 'en', { numeric: true })); };
  const areas = tally(rows, (x) => ukDistrict(x.s.postcode) || x.s.area || x.s.town || '').map((e) => { const top = [...e.names.entries()].sort((a, b) => b[1] - a[1])[0]; return { ...e, label: top && top[0] !== e.label ? `${e.label}, ${top[0]}` : e.label }; });
  const chains = rows.filter((x) => x.s.chain); const online = onlineOf(doc).map((s) => ({ s, b: buyerFor(s, idx) }));
  return { total: shops.length, mapTotal: shops.filter((s) => !s.extra).length, more: shops.filter((s) => s.extra).length, rows, ind: rows.filter((x) => !x.s.chain), chains, online, mine: [...rows, ...online].filter((x) => x.b), areas, brands: tally(chains, (x) => brandOf(x.s)) };
}

async function osmFetch(url, opts = {}, ms = 30000) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  const stop = S.find.ctl; const onStop = () => ctl.abort(); if (stop) stop.signal.addEventListener('abort', onStop);
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal, referrerPolicy: OSM_REFERRER, credentials: 'omit', cache: 'no-store' });
    if (!res.ok) throw { code: res.status === 429 || res.status === 504 ? 'busy' : 'unavailable', status: res.status };
    return await res.json();
  } catch (e) { if (stop && stop.signal.aborted) throw { code: 'stopped' }; if (e && e.code) throw e; throw { code: navigator.onLine === false ? 'offline' : 'unavailable' }; }
  finally { clearTimeout(timer); if (stop) stop.signal.removeEventListener('abort', onStop); }
}
async function locateCity(city, country) {
  const ask = (params) => osmFetch(`${GEOCODER}?${new URLSearchParams({ ...params, format: 'jsonv2', limit: '5', 'accept-language': 'en' })}`);
  let list = await ask({ city, country });
  if (!Array.isArray(list) || !list.length) list = await ask({ q: `${city}, ${country}` });
  if (!Array.isArray(list) || !list.length) throw { code: 'not_found' };
  const best = list.find((x) => x.osm_type === 'relation') || list[0];
  const bb = (best.boundingbox || []).map(Number);
  return { osmType: String(best.osm_type || ''), osmId: Number(best.osm_id) || 0, lat: Number(best.lat), lon: Number(best.lon), bbox: bb.length === 4 && bb.every(Number.isFinite) ? bb : null };
}
function showroomQuery(area) {
  const pick = (scope) => `nwr["shop"~"^(jewel(le)?ry|jewell?er|gold|silver)$"]${scope};nwr["craft"~"^(jewell?er|goldsmith|silversmith)$"]${scope};nwr["shop"~"^(yes|gift|accessories|fashion_accessories|boutique|clothes|fashion|watches|variety_store|antiques|craft|wholesale|general|retail|trade)$"]["name"~"jewel|ornament|alankar|gahana|gehna|swarna|kundan|polki|bullion|diamonds",i]${scope};`;
  const base = area.osmType === 'relation' ? 3600000000 : area.osmType === 'way' ? 2400000000 : 0;
  if (base && area.osmId) return `[out:json][timeout:90];area(id:${base + area.osmId})->.a;(${pick('(area.a)')});out center tags;`;
  const [s, n, w, e] = area.bbox && area.bbox[1] - area.bbox[0] > 0.02 ? area.bbox : [area.lat - 0.09, area.lat + 0.09, area.lon - 0.15, area.lon + 0.15];
  return `[out:json][timeout:90];(${pick(`(${s},${w},${n},${e})`)});out center tags;`;
}
async function overpass(query) {
  let last = null;
  for (const url of OVERPASS) {
    try {
      const data = await osmFetch(url, { method: 'POST', body: new URLSearchParams({ data: query }) }, 100000);
      if (data && Array.isArray(data.elements) && (data.elements.length || !/error/i.test(String(data.remark || '')))) return data;
      last = { code: 'busy' };
    } catch (e) { if (e && e.code === 'stopped') throw e; last = e; }
  }
  throw last || { code: 'unavailable' };
}
// UK shops without a postcode get the nearest one, so visits can group them by area
async function fillPostcodes(shops) {
  const need = shops.filter((s) => !s.postcode);
  for (let i = 0; i < need.length; i += 100) {
    const part = need.slice(i, i + 100);
    try {
      const r = await osmFetch(POSTCODES_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ geolocations: part.map((s) => ({ latitude: s.lat, longitude: s.lon, radius: 250, limit: 1 })) }) }, 20000);
      ((r && r.result) || []).forEach((x, k) => { const pc = x && Array.isArray(x.result) && x.result[0] && x.result[0].postcode; if (pc && part[k]) { part[k].postcode = String(pc).toUpperCase(); part[k].near = 1; } });
    } catch { return; }
  }
}
function findError(e, city) {
  const c = e && e.code;
  if (c === 'not_found') return `The map doesn't know a city called ${city}. Check the spelling, or try the nearest larger town.`;
  if (c === 'offline') return 'No internet connection. Try again when you have signal.';
  if (c === 'busy') return 'The map service is busy. Try again in a minute.';
  return "Couldn't reach the map service. Try again in a minute.";
}
async function findShowrooms(country, city, force) {
  const key = placeKey(country, city);
  if (!canFind() || S.find.busy || (!force && S.places.get(key))) return false;
  S.findTried.add(key);
  const ctl = new AbortController(); const halt = () => { if (ctl.signal.aborted) throw { code: 'stopped' }; };
  S.find = { key, busy: true, step: `Finding ${city} on the map`, error: '', ctl }; schedule();
  let ok = false;
  try {
    const area = await locateCity(city, country); halt();
    S.find.step = `Collecting the jewellery showrooms in ${city}`; schedule();
    let data = await overpass(showroomQuery(area)); halt();
    if (!data.elements.length && area.osmId && area.bbox) { data = await overpass(showroomQuery({ ...area, osmType: 'box' })); halt(); }
    const shops = dedupeShops(data.elements.map(shopFrom).filter(Boolean)).slice(0, 2500);
    if (placeText(country) === placeText(UK) && shops.some((s) => !s.postcode)) { S.find.step = 'Adding postcodes'; schedule(); await fillPostcodes(shops); halt(); }
    const doc = { city, country, fetchedAt: nowIso(), source: 'OpenStreetMap', area: { osmType: area.osmType, osmId: area.osmId, lat: area.lat, lon: area.lon, bbox: area.bbox }, shops };
    S.find = { key: '', busy: false, step: '', error: '' };
    ok = await write(() => Data.set('places', key, doc));
    if (ok) {
      Object.assign(S.ui, { placeSel: '', placePan: '', placesShown: SHOWN_STEP });
      const saved = await afterScan(key, !!force);
      toast(shops.length ? `${shops.length} showrooms found in ${city}${saved ? `; ${saved} saved to Leads` : ''}. Claude is finding their details.` : `No showrooms on the map in ${city}`);
    }
  } catch (e) {
    S.find = e && e.code === 'stopped' ? { key, busy: false, step: '', error: '', stopped: true } : { key, busy: false, step: '', error: findError(e, city) };
  }
  schedule();
  return ok;
}
function autoFind(f) {
  const key = placeKey(f.country, f.city);
  if (!canFind() || !S.loaded.places || S.find.busy || S.findTried.has(key) || S.places.get(key)) return;
  S.findTried.add(key); setTimeout(() => findShowrooms(f.country, f.city), 0);
}
async function cityCampaign(city, country) {
  const have = [...S.campaigns.values()].find((c) => c.kind !== 'fair' && inFocus(c, { city, country }));
  if (have) return have.id;
  const id = Data.newId('campaigns');
  const doc = { kind: 'city', city, country, language: LANG_BY_COUNTRY[country] || 'English', buyerTypes: BUYER_TYPES.map(([k]) => k), productLines: PRODUCT_LINES.map(([k]) => k), paused: false, createdAt: nowIso(), isExample: false };
  return (await write(() => Data.set('campaigns', id, doc))) ? id : null;
}
function shopWhere(s, doc) {
  const town = s.town && placeText(s.town) !== placeText(doc.city) ? s.town : doc.city;
  return [s.area && placeText(s.area) !== placeText(town) ? s.area : '', s.street, `${town}${s.postcode ? ' ' + s.postcode : ''}`].filter(Boolean).join(', ');
}
async function addShops(key, ids) {
  const doc = S.places.get(key); if (!doc) return 0;
  const idx = buyerIndex(doc.country, doc.city); const want = new Set(ids);
  const list = [...allShopsOf(doc), ...onlineOf(doc)].filter((s) => want.has(s.id) && !buyerFor(s, idx) && !(s.email && isSuppressed(s.email)));
  if (!list.length) return 0;
  const cid = await cityCampaign(doc.city, doc.country); if (!cid) return 0;
  const at = nowIso();
  const items = list.map((s) => {
    const contact = { person: s.person || '', email: s.email || '', phone: s.phone || '', website: s.website || '', instagram: s.instagram || '', facebook: s.facebook || '' };
    const notes = s.online ? `Sells online${s.note ? `: ${s.note}` : ''}.\nFound by Claude's research in ${doc.city}.` : `Where: ${shopWhere(s, doc)}\n${s.extra ? "Found by Claude's research (not on the showroom map)." : 'Found on the showroom map (OpenStreetMap).'}${s.note ? `\n${s.note}` : ''}`;
    const b = newBiz({ campaignId: cid, name: s.name, type: s.online ? 'online' : s.chain ? 'chain' : 'independent', city: doc.city, country: doc.country, source: s.online || s.extra ? 'research' : 'map', labGrown: !!s.labGrown, legalForm: s.legalForm || '', companyNo: s.companyNo || '', notes, contact });
    return [`m~${key}~${s.id}`.slice(0, 200), { ...b, osm: s.id, ...(s.checked ? { researchAt: at } : {}) }];
  });
  return (await write(() => Data.setMany('businesses', items))) ? items.length : 0;
}
// After a scan: the independent showrooms are saved for Leads, and Claude's research starts for this city.
// A rescan starts the research over, so every shop is checked again.
async function afterScan(key, again) {
  const doc = S.places.get(key); if (!doc) return 0;
  const ids = showroomReport(doc).ind.filter((x) => !x.b && !x.s.closed).map((x) => x.s.id);
  const n = ids.length ? await addShops(key, ids) : 0;
  const now = nowIso(); const cur = researchOf(key);
  if (again || (S.loaded.research && !cur)) await write(() => Data.set('research', key, { city: doc.city, country: doc.country, status: 'queued', requestedAt: now, updatedAt: now, results: {}, online: {}, onlineDone: false, more: (cur && cur.more) || {}, moreDone: false }));
  return n;
}
// Choosing a city that was searched before (and has no research yet): its showrooms go to Leads and Claude's
// research starts, the same as right after a search.
function startCityResearch(country, city) {
  const k = placeKey(country, city);
  if (!city || !canFind() || !S.places.get(k) || !S.loaded.research || researchOf(k)) return;
  afterScan(k, false).then((n) => { if (researchOf(k)) toast(n ? `Working on ${city}: ${n} ${n === 1 ? 'showroom' : 'showrooms'} saved to Leads. Claude is finding their details.` : `Working on ${city}. Claude is finding the showrooms' details.`); });
}
// New findings fill the empty details of shops already on your list; nothing you typed is overwritten.
let researchTimer = 0;
function queueResearch() { if (!researchTimer) researchTimer = setTimeout(() => { researchTimer = 0; applyResearch(); }, 500); }
async function applyResearch() {
  if (S.mode !== 'db' || S.researchBusy || !(S.loaded.businesses && S.loaded.places)) return;
  S.researchBusy = true;
  try {
    for (const [key, rs] of S.research) {
      const doc = S.places.get(key); if (!doc || !rs) continue;
      const res = rs.results || {}; const on = rs.online || {}; const more = rs.more || {};
      const idx = buyerIndex(doc.country, doc.city); const items = []; const now = nowIso();
      for (const s of [...allShopsOf(doc), ...onlineOf(doc)]) {
        const r = s.online ? on[s.id] : s.extra ? more[s.id] : res[s.id]; if (!r) continue;
        const at = String(r.checkedAt || rs.updatedAt || ''); const b = buyerFor(s, idx);
        if (!b || (b.researchAt && at && b.researchAt >= at)) continue;
        const c = contactOf(b); const contact = {};
        for (const k of RESEARCH_KEYS) if (s[k] && !String(c[k] || '').trim() && !(k === 'email' && isSuppressed(s[k]))) contact[k] = s[k];
        const patch = { researchAt: at || now, updatedAt: now };
        if (Object.keys(contact).length) patch.contact = contact;
        if (s.legalForm && !b.legalForm) patch.legalForm = s.legalForm;
        if (s.companyNo && !b.companyNo) patch.companyNo = s.companyNo;
        if (s.labGrown && !b.labGrown) patch.labGrown = true;
        items.push([b.id, patch]);
      }
      if (items.length && !(await write(() => Data.updateMany('businesses', items)))) return;
      const idx2 = buyerIndex(doc.country, doc.city);
      const fresh = [...onlineOf(doc), ...allShopsOf(doc).filter((s) => s.extra && !s.chain)].filter((s) => !s.closed && !buyerFor(s, idx2)).map((s) => s.id);
      if (fresh.length) await addShops(key, fresh);
    }
  } finally { S.researchBusy = false; }
}
const researchSeen = new Set();
function markResearchSeen(key) {
  const rs = researchOf(key);
  if (!rs || rs.status !== 'done' || !rs.finishedAt || (rs.seenAt && rs.seenAt >= rs.finishedAt) || researchSeen.has(key)) return;
  researchSeen.add(key); setTimeout(() => write(() => Data.update('research', key, { seenAt: nowIso() })), 0);
}
function researchPanel(key, r) {
  const rs = researchOf(key); const map = r.ind.filter((x) => !x.s.extra); const total = map.length;
  const doc = S.places.get(key) || {}; const city = esc(doc.city || (rs && rs.city) || 'this city');
  const done = map.filter((x) => x.s.checked).length; const st = rs ? rs.status : '';
  const head = '<h3>Emails and details</h3>'; const k = esc(key);
  const bar = total ? `<div class="progress" role="progressbar" aria-label="Showrooms checked" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><i style="width:${(done / total * 100).toFixed(1)}%"></i></div>` : '';
  const parts = [r.more ? `${r.more} ${total ? 'more ' : ''}${r.more === 1 ? 'showroom' : 'showrooms'} the map is missing` : '', r.online.length ? `${r.online.length} online ${r.online.length === 1 ? 'seller' : 'sellers'}` : ''].filter(Boolean);
  const found = parts.length ? `found ${listAnd(parts)}` : '';
  const sparse = r.mapTotal < 40 && placeText(doc.country) !== placeText(UK);
  if (!st) {
    if (!canFind()) return '';
    const unsaved = r.ind.filter((x) => !x.b && !x.s.closed).length;
    return `<section class="panel research">${head}<p class="muted" style="margin:0">${unsaved ? `The ${unsaved} independent ${unsaved === 1 ? 'showroom goes' : 'showrooms go'} to Leads, and Claude` : 'Claude'} finds each one's website, email, Instagram and owner, and in the UK its company type. It also finds the showrooms the map is missing, and jewellers here that sell online. About ${RESEARCH_BATCH} shops an hour, in the background.${sparse ? ` The map has only a few of ${city}'s jewellers, so most will come from Claude's research.` : ''}</p><div class="actions"><button type="button" class="btn primary" data-act="research-start" data-key="${k}">${ico('spark')}Find emails and details</button></div></section>`;
  }
  if (st === 'done') {
    const n = (f) => r.ind.filter((x) => x.s.checked && f(x.s)).length; const em = n((s) => s.email), web = n((s) => s.website), lf = n((s) => s.legalForm);
    const lead = total ? `Claude checked all ${total} independent showrooms${found ? `, and ${found}` : ''}` : `Claude ${found || 'found no showrooms here that the map is missing'}`;
    return `<section class="panel research">${head}<p style="margin:0">${lead}${rs.finishedAt ? `, finishing ${esc(fmtWhen(rs.finishedAt))}` : ''}: ${em} with an email, ${web} with a website${lf ? `, ${lf} with their company type` : ''}.</p><div class="actions">${moreMenu('research', `<button type="button" class="btn small" data-act="research-again" data-key="${k}">${ico('refresh')}Check them all again</button>`)}</div></section>`;
  }
  if (st === 'stopped') return `<section class="panel research">${head}<p style="margin:0">Stopped at ${done} of ${total} showrooms${parts.length ? `, with ${listAnd(parts)} found` : ''}. What Claude found so far stays.</p>${bar}<div class="actions"><button type="button" class="btn" data-act="research-continue" data-key="${k}">${ico('refresh')}Continue</button></div></section>`;
  const now = done || parts.length ? (total ? `Claude has checked ${done} of ${total} showrooms${found ? `, and ${found}` : ''}.` : `Claude has ${found} so far.`) : `Claude starts on ${city} within the hour.`;
  return `<section class="panel research">${head}<p style="margin:0">${now}</p>${bar}
    <p class="hint" style="margin:0">${rs.updatedAt && (done || parts.length) ? `Last update ${esc(fmtWhen(rs.updatedAt))}. ` : ''}About ${RESEARCH_BATCH} shops an hour, only for the city you're working on${sparse ? `, including the showrooms the map is missing` : ''}. You can close the app; what Claude finds goes onto the saved shops, and Today tells you when it's done.</p>
    <div class="actions"><button type="button" class="btn small" data-act="research-stop" data-key="${k}">${ico('stop')}Stop</button></div></section>`;
}
function researchBanner() {
  return [...S.research.entries()].filter(([, rs]) => rs.status === 'done' && rs.finishedAt && !(rs.seenAt && rs.seenAt >= rs.finishedAt)).map(([key, rs]) => {
    const d = S.places.get(key); const n = d ? showroomReport(d).ind.filter((x) => x.s.checked).length : 0;
    return `<div class="banner">${ico('spark')}<p><b>Claude found the details for the showrooms in ${esc(rs.city)}.</b> ${n ? `${n} checked. ` : ''}<button type="button" class="linkish" data-act="work-on" data-country="${esc(rs.country)}" data-city="${esc(rs.city)}">See them</button></p></div>`;
  }).join('');
}
const shopMapsUrl = (s, doc) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name}, ${shopWhere(s, doc)}`)}`;
const reportFileName = (doc) => `showrooms-${placeText(doc.city) || 'city'}-${String(doc.fetchedAt || todayStr()).slice(0, 10)}.pdf`;
function showroomsPdf(doc) {
  const company = settings().company.name || 'Ark Diamond'; const r = showroomReport(doc);
  const pdf = pdfDoc({ title: `Jewellery showrooms in ${doc.city}`, author: company });
  const M = 46, R = pdf.W - M, CW = R - M, BOTTOM = pdf.H - 62;
  const NAVY = '#0B1124', GOLD = '#A47E35', INK = '#1E2533', MUTED = '#5F6878', LINE = '#DAD3C4', SOFT = '#F7F3EA', GREEN = '#2F7D57', GREY = '#A3A9B4';
  const day = fmtDate(String(doc.fetchedAt || todayStr()).slice(0, 10));
  let y = 0;
  const top = (first) => {
    pdf.addPage(); y = 56;
    pdf.text(M, y, company.toUpperCase(), { f: 'TB', size: first ? 15 : 11, sp: 2, color: NAVY });
    pdf.text(R, y, first ? 'SHOWROOM REPORT' : `${String(doc.city).toUpperCase()}, CONTINUED`, { f: 'B', size: 8, sp: 1.3, color: GOLD, align: 'right' });
    y += 11; pdf.line(M, y, R, y, { color: GOLD, w: 0.9 }); y += first ? 42 : 18;
  };
  const room = (h) => { if (y + h > BOTTOM) top(false); };
  const label = (s) => { pdf.text(M, y, s.toUpperCase(), { f: 'B', size: 7.5, sp: 1.2, color: GOLD }); y += 14; };
  top(true);
  pdf.text(M, y, doc.city, { f: 'TB', size: 30, color: NAVY }); y += 20;
  const intro = pdfWrap(`Jewellery showrooms in ${doc.city}, ${doc.country}, from OpenStreetMap on ${day}${r.more ? `, and ${r.more} more found by Claude's research of public business listings` : ''}.`, 'R', 9.5, CW);
  intro.forEach((ln, i) => pdf.text(M, y + i * 13, ln, { size: 9.5, color: MUTED })); y += 20 + (intro.length - 1) * 13;
  const figs = [[r.total, 'Showrooms'], [r.ind.length, 'Independent'], [r.chains.length, 'Chains'], [r.mine.length, 'Already your buyers']]; const fw = CW / figs.length;
  pdf.rect(M, y, CW, 56, { fill: SOFT });
  figs.forEach(([n, l], i) => { pdf.text(M + 14 + i * fw, y + 29, String(n), { f: 'TB', size: 21, color: NAVY }); pdf.text(M + 14 + i * fw, y + 44, l, { size: 8, color: MUTED }); });
  y += 76;
  // every shop as a dot, north at the top
  const pts = r.rows.filter((x) => onMap(x.s));
  if (pts.length > 1) {
    const lats = pts.map((x) => x.s.lat), lons = pts.map((x) => x.s.lon);
    const la0 = Math.min(...lats), la1 = Math.max(...lats), lo0 = Math.min(...lons); const k = Math.cos(((la0 + la1) / 2) * Math.PI / 180);
    const MH = 230; const w = Math.max(1e-6, (Math.max(...lons) - lo0) * k), h = Math.max(1e-6, la1 - la0); const sc = Math.min((CW - 28) / w, (MH - 28) / h);
    const ox = M + (CW - w * sc) / 2, oy = y + (MH - h * sc) / 2;
    pdf.rect(M, y, CW, MH, { stroke: LINE, w: 0.6 });
    const dot = (x, color, d) => pdf.rect(ox + (x.s.lon - lo0) * k * sc - d / 2, oy + (la1 - x.s.lat) * sc - d / 2, d, d, { fill: color });
    for (const x of pts) if (x.s.chain && !x.b) dot(x, GREY, 3);
    for (const x of pts) if (!x.s.chain && !x.b) dot(x, GOLD, 3.4);
    for (const x of pts) if (x.b) dot(x, GREEN, 4);
    y += MH + 14; let lx = M;
    for (const [c, l] of [[GOLD, 'Independent'], [GREY, 'Chain'], [GREEN, 'Your buyer']]) { pdf.rect(lx, y - 6, 6, 6, { fill: c }); pdf.text(lx + 10, y, l, { size: 8, color: MUTED }); lx += 30 + pdfWidth(l, 'R', 8); }
    y += 26;
  }
  const areas = r.areas.slice(0, 10);
  if (areas.length) {
    room(26 + areas.length * 16); label('Where they are'); const max = Math.max(...areas.map((a) => a.n));
    for (const a of areas) { pdf.text(M, y, pdfFit(a.label, 'R', 9, 170), { size: 9, color: INK }); pdf.rect(M + 180, y - 7, Math.max(2, (CW - 220) * a.n / max), 8, { fill: GOLD }); pdf.text(R, y, String(a.n), { f: 'B', size: 9, color: INK, align: 'right' }); y += 16; }
    y += 16;
  }
  room(48); label(`Independent showrooms (${r.ind.length})`);
  const byArea = (x) => ukDistrict(x.s.postcode) || x.s.area || '~';
  for (const x of r.ind.slice().sort((a, b) => byArea(a).localeCompare(byArea(b), 'en', { numeric: true }) || a.s.name.localeCompare(b.s.name))) {
    const s = x.s; const addr = [s.street, s.postcode].filter(Boolean).join(', ') || s.area || ''; const reach = [s.phone, siteKey(s.website) || cleanDomain(s.website), s.email].filter(Boolean).join('     ');
    room(14 + (addr ? 11 : 0) + (reach ? 11 : 0) + 8);
    y += 4; pdf.text(M, y + 8, pdfFit(s.name, 'B', 9.5, CW - 80), { f: 'B', size: 9.5, color: INK }); if (x.b) pdf.text(R, y + 8, 'Your buyer', { f: 'B', size: 8, color: GREEN, align: 'right' }); y += 8;
    if (addr) { y += 11; pdf.text(M, y, pdfFit(addr, 'R', 8.5, CW), { size: 8.5, color: MUTED }); }
    if (reach) { y += 11; pdf.text(M, y, pdfFit(reach, 'R', 8.5, CW), { size: 8.5, color: MUTED }); }
    y += 7; pdf.line(M, y, R, y, { color: LINE, w: 0.4 });
  }
  if (r.online.length) {
    y += 20; room(48); label(`Online sellers (${r.online.length})`);
    for (const x of r.online) {
      const s = x.s; const reach = [siteKey(s.website) || cleanDomain(s.website), s.email, s.instagram ? '@' + String(s.instagram).replace(/^@/, '') : ''].filter(Boolean).join('     ');
      room(14 + (reach ? 11 : 0) + 8);
      y += 4; pdf.text(M, y + 8, pdfFit(s.name, 'B', 9.5, CW - 80), { f: 'B', size: 9.5, color: INK }); if (x.b) pdf.text(R, y + 8, 'Saved', { f: 'B', size: 8, color: GREEN, align: 'right' }); y += 8;
      if (reach) { y += 11; pdf.text(M, y, pdfFit(reach, 'R', 8.5, CW), { size: 8.5, color: MUTED }); }
      y += 7; pdf.line(M, y, R, y, { color: LINE, w: 0.4 });
    }
  }
  if (r.brands.length) {
    y += 20; room(40); label(`Chains (${r.chains.length})`);
    for (const ln of pdfWrap(r.brands.map((b) => `${b.label} ${b.n}`).join('    ·    '), 'R', 9, CW)) { room(13); pdf.text(M, y, ln, { size: 9, color: INK }); y += 13; }
  }
  y += 16; room(36);
  for (const ln of pdfWrap(`Source: OpenStreetMap contributors (openstreetmap.org/copyright)${r.more ? ", and Claude's research of public business listings for the shops not on the map" : ''}. A shop that neither has is missing here, and contact details can be out of date. Postcodes marked on the app as nearby are the nearest postcode to the shop.`, 'R', 7.8, CW)) { pdf.text(M, y, ln, { size: 7.8, color: MUTED }); y += 10.5; }
  const n = pdf.pageCount;
  for (let i = 0; i < n; i++) { pdf.onPage(i); pdf.line(M, pdf.H - 44, R, pdf.H - 44, { color: LINE, w: 0.5 }); pdf.text(M, pdf.H - 31, pdfFit(`${company} · Showrooms in ${doc.city} · ${day}`, 'R', 7, CW - 70), { size: 7, color: MUTED }); pdf.text(R, pdf.H - 31, `Page ${i + 1} of ${n}`, { size: 7, color: MUTED, align: 'right' }); }
  return pdf.bytes();
}

/* the showroom map: one Leaflet map, kept between redraws and moved into each new page */
const MAPV = { el: null, map: null, layer: null, key: '', fitted: '', sig: '', lib: null };
function loadMapLib() {
  if (window.L && window.L.map) return Promise.resolve(window.L);
  if (MAPV.lib) return MAPV.lib;
  MAPV.lib = new Promise((resolve, reject) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = MAP_LIB.css; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = MAP_LIB.js; s.async = true;
    s.onload = () => (window.L && window.L.map ? resolve(window.L) : reject(new Error('map library')));
    s.onerror = () => reject(new Error('map library'));
    document.head.appendChild(s);
  }).catch((e) => { MAPV.lib = null; throw e; });
  return MAPV.lib;
}
function mountMap() {
  const slot = document.getElementById('map-slot'); if (!slot) return;
  const key = slot.dataset.key; if (!S.places.get(key)) return;
  if (!MAPV.el) { MAPV.el = document.createElement('div'); MAPV.el.className = 'smap'; }
  slot.appendChild(MAPV.el);
  loadMapLib().then((L) => drawMap(L, key)).catch(() => { const sl = document.getElementById('map-slot'); if (sl) { sl.classList.add('off'); sl.innerHTML = '<p class="hint">The map didn\'t load. Every showroom is in the list below.</p>'; } });
}
function drawMap(L, key) {
  const doc = S.places.get(key); if (!doc || !MAPV.el.isConnected) return;
  if (!MAPV.map) {
    MAPV.map = L.map(MAPV.el, { preferCanvas: true, scrollWheelZoom: false, zoomSnap: 0.5 });
    MAPV.map.attributionControl.setPrefix(false);
    L.tileLayer(MAP_TILES, { maxZoom: 19, referrerPolicy: OSM_REFERRER, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(MAPV.map);
    MAPV.layer = L.layerGroup().addTo(MAPV.map);
  }
  MAPV.map.invalidateSize(false);
  const idx = buyerIndex(doc.country, doc.city); const shops = shopsOf(doc);
  const state = new Map(shops.map((s) => { const b = buyerFor(s, idx); return [s.id, b ? shopState(b) : '']; }));
  const sig = [key, doc.fetchedAt, S.ui.placeSel, [...state.values()].join(',')].join('|');
  if (sig !== MAPV.sig) {
    MAPV.layer.clearLayers(); const css = getComputedStyle(document.documentElement); const tok = (n, d) => css.getPropertyValue(n).trim() || d;
    const gold = tok('--gold', '#D6B66C'), good = tok('--good', '#79C79C'), grey = tok('--ink-3', '#9A9483'), ink = tok('--ink', '#F3EEE3'), blue = tok('--accent', '#1F4FBF');
    const rank = { replied: 3, campaign: 2, noreply: 1, out: 1, new: 0, '': 0 };
    const colour = (s) => { const k = state.get(s.id); return k === 'replied' ? good : k === 'campaign' ? blue : k === 'noreply' || k === 'out' || (s.chain && !k) ? grey : gold; };
    const order = shops.slice().sort((a, b) => (a.id === S.ui.placeSel) - (b.id === S.ui.placeSel) || (rank[state.get(a.id)] - rank[state.get(b.id)]) || ((b.chain || 0) - (a.chain || 0)));
    for (const s of order) {
      const sel = s.id === S.ui.placeSel; const c = colour(s); const ring = s.chain && !state.get(s.id);
      L.circleMarker([s.lat, s.lon], { radius: sel ? 10 : ring ? 5 : 6.5, color: sel ? ink : c, weight: sel ? 3 : ring ? 1.5 : 1, opacity: 1, fillColor: c, fillOpacity: ring ? 0.12 : 0.92 })
        .bindTooltip(s.name, { direction: 'top', offset: [0, -7] })
        .on('click', () => { S.ui.placeSel = s.id; S.ui.menu = ''; schedule(); })
        .addTo(MAPV.layer);
    }
    MAPV.sig = sig;
  }
  if (MAPV.key !== key || MAPV.fitted !== doc.fetchedAt) {
    if (shops.length) MAPV.map.fitBounds(L.latLngBounds(shops.map((s) => [s.lat, s.lon])).pad(0.06), { maxZoom: 15 });
    else if (doc.area && Number.isFinite(doc.area.lat)) MAPV.map.setView([doc.area.lat, doc.area.lon], 12);
    MAPV.key = key; MAPV.fitted = doc.fetchedAt;
  }
  if (S.ui.placePan) { const s = shops.find((x) => x.id === S.ui.placePan); S.ui.placePan = ''; if (s) MAPV.map.setView([s.lat, s.lon], Math.max(MAPV.map.getZoom(), 15)); }
}

/* ================= visits: plan a UK sales trip ================= */
// UK cities with shops to visit: the usual route first, then any other city you've added shops in
function tripCities() {
  const live = (b) => placeText(b.country) === placeText(UK) && !['rejected', 'unsubscribed', 'bounced'].includes(b.status) && b.city;
  const n = new Map(); for (const b of focusBiz()) if (live(b)) n.set(b.city, (n.get(b.city) || 0) + 1);
  return [...UK_ROUTE.filter((c) => n.has(c)), ...[...n.keys()].filter((c) => !UK_ROUTE.includes(c)).sort()].map((c) => [c, n.get(c)]);
}
const tripsList = () => [...S.trips.values()].sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
function postcodeOf(x) { const all = [...String(x || '').toUpperCase().matchAll(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/g)]; const m = all[all.length - 1]; return m ? { full: `${m[1]} ${m[2]}`, district: m[1] } : null; }
const placeOf = (b) => whereFrom(b.notes);
function areaOf(b) { const first = placeOf(b).split(',')[0].replace(/\(.*?\)/g, '').trim(); return first && first.length <= 40 && !/\d/.test(first) ? first : ''; }
function addressOf(b) { const w = placeOf(b).replace(/\s*\([^)]*\)/g, '').trim(); const a = areaOf(b); return a && w.startsWith(a + ',') ? w.slice(a.length + 1).trim() : w; }
const mapsUrl = (b) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name}, ${addressOf(b) || b.city || ''}`)}`;
function routeUrl(bs) {
  const pts = bs.filter((b) => addressOf(b)).map((b) => `${b.name}, ${addressOf(b)}`); if (pts.length < 2) return '';
  const enc = encodeURIComponent; const mid = pts.slice(1, -1).slice(0, 8);
  const sameArea = new Set(bs.map((b) => (postcodeOf(placeOf(b)) || {}).district)).size === 1;
  return `https://www.google.com/maps/dir/?api=1${sameArea ? '&travelmode=walking' : ''}&origin=${enc(pts[0])}&destination=${enc(pts[pts.length - 1])}${mid.length ? `&waypoints=${mid.map(enc).join('%7C')}` : ''}`;
}
// Day n of a trip, counting from its first day and leaving Sundays free
function tripDay(start, n) { let d = String(start || todayStr()); while (parseDate(d).getDay() === 0) d = addDays(d, 1); for (let k = 0; k < n;) { d = addDays(d, 1); if (parseDate(d).getDay() !== 0) k++; } return d; }
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// written out by hand, so every phone shows the same 'Sat 10 Oct' whatever its language settings
const fmtWeekday = (d) => { const x = parseDate(d); return `${WEEKDAYS[x.getDay()].slice(0, 3)} ${x.getDate()} ${MONTHS[x.getMonth()]}`; };
const fmtLongDay = (d) => { const x = parseDate(d); return `${WEEKDAYS[x.getDay()]} ${x.getDate()} ${MONTHS_LONG[x.getMonth()]}`; };
function fmtClock(hm) { const [h, m] = String(hm || '10:30').split(':').map(Number); return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`; }
function nextMonday() { let d = addDays(todayStr(), 1); while (parseDate(d).getDay() !== 1) d = addDays(d, 1); return d; }
function visitScore(b) { let s = fitScore(b); if (b.lead && b.lead.stage !== 'lost') s += 60; if (['approved', 'active', 'replied'].includes(b.status)) s += 10; return s; }
function tripPool(city, include) {
  let pool = allBiz().filter((b) => b.city === city && !['rejected', 'unsubscribed', 'bounced'].includes(b.status));
  if (include === 'leads') pool = pool.filter((b) => b.lead && b.lead.stage !== 'lost');
  else if (include === 'contacted') pool = pool.filter((b) => b.lead || contacted(b) || ['approved', 'active'].includes(b.status));
  return pool;
}
const pcKey = (b) => (postcodeOf(placeOf(b)) || {}).full || '~';
function retime(stops) {
  const byDay = new Map(); for (const st of stops) { if (!byDay.has(st.day)) byDay.set(st.day, []); byDay.get(st.day).push(st); }
  for (const list of byDay.values()) {
    let mins = 10 * 60 + 30; let prev = null;
    for (const st of list) {
      const b = S.businesses.get(st.bid); const dist = b ? (postcodeOf(placeOf(b)) || {}).district || '' : '';
      if (prev !== null && dist !== prev) mins += 20;
      st.time = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`; mins += 60; prev = dist;
    }
  }
  return stops;
}
// Cities in travel order; inside a city, shops grouped by postcode district so each day stays in one area
function planStops(d) {
  const order = [...UK_ROUTE.filter((c) => d.cities.includes(c)), ...d.cities.filter((c) => !UK_ROUTE.includes(c))];
  const per = Math.max(2, Number(d.perDay) || 6); const cap = Number(d.cap) || 0; const stops = []; let day = 0;
  for (const city of order) {
    let pool = tripPool(city, d.include).sort((a, b) => visitScore(b) - visitScore(a));
    if (cap) pool = pool.slice(0, cap);
    if (!pool.length) continue;
    const groups = new Map();
    for (const b of pool) { const k = (postcodeOf(placeOf(b)) || {}).district || '~'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b); }
    let slot = 0;
    for (const k of [...groups.keys()].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))) {
      const list = groups.get(k).sort((a, b) => pcKey(a).localeCompare(pcKey(b), 'en', { numeric: true }) || visitScore(b) - visitScore(a));
      if (slot && slot + list.length > per && slot >= Math.ceil(per / 2)) { day++; slot = 0; }
      for (const b of list) { if (slot >= per) { day++; slot = 0; } stops.push({ id: uid(), bid: b.id, day, status: 'planned' }); slot++; }
    }
    day++;
  }
  return retime(stops);
}
function insertStop(stops, st) { let k = -1; stops.forEach((x, j) => { if (x.day <= st.day) k = j; }); stops.splice(k + 1, 0, st); return stops; }
async function saveStops(tid, stops) { return write(() => Data.update('trips', tid, { stops: retime(stops), updatedAt: nowIso() })); }
function tripOf(bid) {
  for (const t of tripsList()) for (const st of t.stops || []) if (st.bid === bid && st.status === 'planned' && tripDay(t.startDate, st.day) >= todayStr()) return { t, st, date: tripDay(t.startDate, st.day) };
  return null;
}
const tripSendable = (b) => !!contactOf(b).email && !needsConsent(b) && !isSuppressed(contactOf(b).email) && !['unsubscribed', 'bounced'].includes(b.status);
function tripMailText(t, st, b, subject, body) {
  const extra = { visit_date: fmtLongDay(tripDay(t.startDate, st.day)), visit_time: fmtClock(st.time) };
  return { subject: fill(subject, b, extra), body: `${fill(body, b, extra)}\n\n--\n${emailFooter()}` };
}
async function logVisit(bid, outcome, note) {
  const b = S.businesses.get(bid); if (!b) return false;
  const at = nowIso(); const tag = { interested: 'interested', samples: 'samples', not_now: 'not_now', no: 'not_interested' }[outcome] || 'other';
  const messages = [...(b.messages || []), { id: uid(), dir: 'in', channel: 'visit', at, text: String(note || '').trim().slice(0, MSG_MAX) || `Visited: ${VISIT_LABEL[outcome] || 'met them'}`, tag }].slice(-MSG_KEEP);
  const lead = { stage: 'new', createdAt: at, ordersValue: 0, replyHours: [], ...(b.lead || {}) };
  lead.awaitingReply = false; lead.lastInAt = at; lead.lastChannel = 'visit'; lead.remindAt = null;
  if (tag === 'not_interested') lead.stage = 'lost';
  else if (tag === 'not_now') { lead.stage = 'lost'; lead.followUpAt = addDays(todayStr(), Number(settings().rules.notNowDays) || 60); }
  else { const want = tag === 'samples' ? 'samples' : 'replied'; if (STAGE_ORDER.indexOf(lead.stage) < STAGE_ORDER.indexOf(want)) lead.stage = want; lead.followUpAt = addDays(todayStr(), 2); }
  const patch = { messages, lead, metAt: `their shop, ${fmtDate(todayStr())}` };
  if (['active', 'found', 'approved'].includes(b.status)) patch.status = 'replied';
  return write(() => updateBiz(bid, patch));
}
async function tripMailSend(tid) {
  const t = S.trips.get(tid); if (!t || S.gm.batch) return;
  const subject = fv('tm.subject', (t.mail || VISIT_TEMPLATE).subject), body = fv('tm.body', (t.mail || VISIT_TEMPLATE).body);
  const list = (t.stops || []).filter((st) => st.status === 'planned' && !st.emailedAt).map((st) => ({ st, b: S.businesses.get(st.bid) })).filter((x) => x.b && tripSendable(x.b));
  if (!list.length) { toast('Everyone with an email address has been told.'); return; }
  S.gm.batch = { total: list.length, sent: 0, stop: false }; render();
  let fail = null; const sent = {};
  for (const x of list) {
    if (S.gm.batch.stop) break;
    const m = tripMailText(t, x.st, x.b, subject, body);
    const r = await gmailCall('send_message', { to: [contactOf(x.b).email], subject: m.subject, body: m.body });
    if (!r.ok) { fail = r; break; }
    sent[x.st.id] = nowIso(); S.gm.batch.sent++;
    // the note counts as contact, so their answer comes in with the other Gmail replies
    const cur = S.businesses.get(x.b.id) || x.b;
    await write(() => updateBiz(x.b.id, { messages: [...(cur.messages || []), { id: uid(), dir: 'out', channel: 'email', at: nowIso(), text: `${m.subject}\n\n${m.body}`.slice(0, MSG_MAX), gmailId: String(r.payload.id || ''), threadId: String(r.payload.threadId || '') }].slice(-MSG_KEEP) }));
    schedule();
    if (S.gm.batch.sent < list.length && !S.gm.batch.stop) await new Promise((res) => setTimeout(res, S.gm.gap));
  }
  const cur = S.trips.get(tid);
  if (cur) await write(() => Data.update('trips', tid, { stops: (cur.stops || []).map((st) => (sent[st.id] ? { ...st, emailedAt: sent[st.id] } : st)), mail: { subject, body }, updatedAt: nowIso() }));
  const n = Object.keys(sent).length; S.gm.batch = null; render();
  toast(fail ? `${n} sent. Stopped: ${gmailError(fail)}` : `${n} ${n === 1 ? 'shop knows' : 'shops know'} you're coming`);
}
/* ================= prices: wholesale price calculator ================= */
const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const roundUp = (x, step) => (step > 0 ? Math.ceil(x / step - 1e-9) * step : Math.ceil(x * 100 - 1e-9) / 100);
function fxFmt(cur, v) { const s = Number(v).toLocaleString('en-GB', { maximumFractionDigits: 2 }); const sym = (FX.find(([c]) => c === cur) || [])[1]; return sym ? sym + s : `${cur} ${s}`; }
function pcInputs() {
  const pr = settings().pricing; const g = (k, d = '') => (k in S.pc ? S.pc[k] : d);
  return { code: g('code'), metal: g('metal', 'silver925'), weight: g('weight'), wastage: g('wastage', pr.wastage), makingPerG: g('makingPerG'), setting: g('setting'), ct1: g('ct1'), rate1: g('rate1'), ct2: g('ct2'), rate2: g('rate2'), plating: g('plating'), cert: g('cert'), other: g('other'), margin: g('margin', pr.margin), shipping: g('shipping'), buyer: g('buyer'), cur: g('cur') };
}
function pcRates() {
  const pr = settings().pricing; const g = (k, d) => (k in S.rt ? S.rt[k] : d);
  return { gold24: g('gold24', pr.gold24), silver: g('silver', pr.silver), round: g('round', pr.round), rates: Object.fromEntries(FX.map(([c]) => [c, g(c, pr.rates[c])])) };
}
function calcPrice(p, r) {
  const n = (v) => Math.max(0, Number(v) || 0);
  const fine = p.metal === 'silver925' ? n(r.silver) : n(r.gold24);
  const metal = n(p.weight) * fine * (PURITY[p.metal] || 1);
  const wastage = (metal * n(p.wastage)) / 100;
  const making = n(p.weight) * n(p.makingPerG);
  const setting = n(p.setting);
  const diamonds = n(p.ct1) * n(p.rate1) + n(p.ct2) * n(p.rate2);
  const extras = n(p.plating) + n(p.cert) + n(p.other);
  const cost = metal + wastage + making + setting + diamonds + extras;
  const margin = (cost * n(p.margin)) / 100;
  const price = cost + margin + n(p.shipping);
  const fx = {}; for (const [c] of FX) { const rate = n(r.rates[c]); if (rate && price) fx[c] = roundUp(price / rate, n(r.round)); }
  return { fine, metal, wastage, making, setting, diamonds, extras, cost, margin, shipping: n(p.shipping), price, fx, missingMetal: n(p.weight) > 0 && !fine };
}
function pcDesc(p) {
  const ct = round2((Number(p.ct1) || 0) + (Number(p.ct2) || 0));
  return `${p.code ? `${p.code}: ` : ''}${METAL_SHORT[p.metal] || 'Jewellery'}${Number(p.weight) ? `, ${p.weight} g` : ''}${ct ? `, set with ${ct} ct laboratory-grown diamonds` : ''}`;
}
/* ================= reports ================= */
// Anyone who has written to us, or we to them, counts as contacted, so replies never outnumber contacts.
const sentAny = (done) => !!done && Object.values(done).some((x) => x && (x.how === 'sent' || x.how === 'done'));
function contacted(b) { return sentAny(b.done) || (b.rounds || []).some((r) => sentAny(r.done)) || (b.messages || []).length > 0; }
function inbound(b) { return (b.messages || []).filter((m) => m.dir === 'in'); }
function computeReport(list, by) {
  const rows = new Map();
  for (const b of list) {
    const key = by === 'country' ? (b.country || '—') : `${b.city || '—'}|${b.country || '—'}`;
    let r = rows.get(key);
    if (!r) { r = { key, city: b.city || '—', country: b.country || '—', found: 0, approved: 0, contacted: 0, replied: 0, interested: 0, samples: 0, orders: 0, revenue: 0, hours: [] }; rows.set(key, r); }
    r.found++;
    if (!['found', 'rejected'].includes(b.status)) r.approved++;
    if (contacted(b)) r.contacted++;
    const ins = inbound(b);
    if (ins.length) r.replied++;
    const l = b.lead;
    if (l) {
      if (ins.some((m) => ['interested', 'price', 'samples'].includes(m.tag)) || ['catalogue', 'quoted', 'samples', 'first_order', 'repeat'].includes(l.stage)) r.interested++;
      if (['samples', 'first_order', 'repeat'].includes(l.stage)) r.samples++;
      if (l.firstOrderAt) { r.orders++; r.revenue += Number(l.ordersValue) || 0; }
      if (Array.isArray(l.replyHours)) r.hours.push(...l.replyHours);
    }
  }
  return [...rows.values()].map((r) => ({ ...r, rate: r.contacted ? r.replied / r.contacted : null, avgHours: r.hours.length ? r.hours.reduce((a, x) => a + x, 0) / r.hours.length : null }))
    .sort((a, b) => b.contacted - a.contacted || b.found - a.found || a.key.localeCompare(b.key));
}
function totalsOf(rows) {
  const t = { found: 0, approved: 0, contacted: 0, replied: 0, interested: 0, samples: 0, orders: 0, revenue: 0, hours: [] };
  for (const r of rows) { for (const k of ['found', 'approved', 'contacted', 'replied', 'interested', 'samples', 'orders', 'revenue']) t[k] += r[k]; t.hours.push(...r.hours); }
  t.rate = t.contacted ? t.replied / t.contacted : null; t.avgHours = t.hours.length ? t.hours.reduce((a, x) => a + x, 0) / t.hours.length : null;
  return t;
}
function toCSV(rows) { return rows.map((r) => r.map((v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\r\n'); }
function parseCSV(text) {
  text = String(text || '').replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0] || '';
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ''));
}
const yesish = (v) => /^(y|yes|true|1|x|✓)$/i.test(String(v || '').trim());
const HEADER_MAP = { sellslabgrown: 'labGrown', labgrown: 'labGrown', labdiamonds: 'labGrown', labgrowndiamonds: 'labGrown', name: 'name', business: 'name', businessname: 'name', company: 'name', store: 'name', shop: 'name', type: 'type', buyertype: 'type', contact: 'person', contactname: 'person', person: 'person', owner: 'person', buyer: 'person', email: 'email', emailaddress: 'email', mail: 'email', phone: 'phone', telephone: 'phone', tel: 'phone', mobile: 'phone', whatsapp: 'whatsapp', website: 'website', web: 'website', url: 'website', site: 'website', instagram: 'instagram', ig: 'instagram', facebook: 'facebook', fb: 'facebook', linkedin: 'linkedin', city: 'city', country: 'country', notes: 'notes', note: 'notes', legalform: 'legalForm', companytype: 'legalForm', companynumber: 'companyNo', companyno: 'companyNo', companieshouse: 'companyNo' };
function typeFrom(v) {
  const s = String(v || '').toLowerCase();
  if (!s) return 'independent';
  for (const [k, label] of BUYER_TYPES) if (s === k || s === label.toLowerCase()) return k;
  if (s.includes('chain')) return 'chain'; if (s.includes('manufact') || s.includes('brand')) return 'manufacturer'; if (s.includes('wholesal') || s.includes('distrib')) return 'wholesaler';
  if (s.includes('online') || s.includes('shopify') || s.includes('etsy')) return 'online'; if (s.includes('bridal') || s.includes('custom')) return 'bridal'; if (s.includes('gift') || s.includes('fashion') || s.includes('department')) return 'gift';
  return 'independent';
}

/* ================= rendering ================= */
let raf = 0;
function schedule() {
  if (S.device && S.mode === 'db') queueInbox(); if (raf) return; raf = requestAnimationFrame(() => { raf = 0; render(); }); }
function captureFocus() {
  const a = document.activeElement; const d = $('.drawer, .modal');
  return { id: a && a.id, start: a && a.selectionStart, end: a && a.selectionEnd, layerScroll: d ? d.scrollTop : 0 };
}
function restoreFocus(f) {
  const d = $('.drawer, .modal'); if (d && f.layerScroll) d.scrollTop = f.layerScroll;
  if (!f.id) return; const el = document.getElementById(f.id); if (!el) return;
  el.focus({ preventScroll: true });
  try { if (f.start != null && typeof el.setSelectionRange === 'function') el.setSelectionRange(f.start, f.end); } catch { /* not a text field */ }
}
function render() {
  const f = captureFocus();
  renderNav();
  $('#main').innerHTML = `<div class="wrap">${viewHtml()}</div>`;
  for (const box of document.querySelectorAll('#main input[data-mixed]')) box.indeterminate = true;
  const h1 = $('#main .head h1'); if (h1 && h1.textContent.trim() === pageTitle()) h1.classList.add('same');
  mountMap();
  $('#layer').innerHTML = S.layer ? layerHtml() : '';
  restoreFocus(f);
}
/* ---------- shell: the bar with the page name, the tab bar and the More sheet, on every screen ---------- */
const PAGE_TITLE = { today: 'Today', showrooms: 'Showrooms', leads: 'Leads', orders: 'Orders', buyers: 'Buyers', meetings: 'Meetings', cities: 'Campaigns', city: 'Campaigns', trips: 'Visits', trip: 'Visits', prices: 'Prices', calendar: 'Calendar', reports: 'Reports', sequence: 'Messages', connections: 'Connections' };
const pageTitle = () => PAGE_TITLE[S.route.view] || 'Today';
const TAB_VIEWS = ['today', 'showrooms', 'leads', 'orders'];
const MORE_VIEWS = ['buyers', 'meetings', 'cities', 'trips', 'prices', 'calendar', 'reports', 'sequence', 'connections'];
const MORE_ICON = '<svg class="svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor"/></svg>';
const shellHtml = {};
function setShell(id, html) { const el = document.getElementById(id); if (!el || shellHtml[id] === html) return; shellHtml[id] = html; el.innerHTML = html; }
function moreOpen() { const m = $('#more'); return !!m && !m.hidden; }
function openMore() {
  const m = $('#more'); if (!m || !m.hidden) return;
  m.hidden = false;
  const b = $('#tab-more'); if (b) b.setAttribute('aria-expanded', 'true');
  const first = m.querySelector('.more-nav a') || m.querySelector('button'); if (first) first.focus({ preventScroll: true });
}
function closeMore(restore = true) {
  const m = $('#more'); if (!m || m.hidden) return;
  m.hidden = true;
  const b = $('#tab-more'); if (!b) return;
  b.setAttribute('aria-expanded', 'false');
  if (restore && b.getClientRects().length) b.focus({ preventScroll: true });
}
function initShell() {
  const m = $('#more');
  m.addEventListener('click', (e) => { if (e.target.closest('a[href]')) closeMore(); });
  document.addEventListener('keydown', (e) => {
    if (!moreOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMore(); return; }
    if (e.key !== 'Tab') return;
    const f = [...m.querySelectorAll('a[href], button:not([disabled])')]; if (!f.length) return;
    const first = f[0]; const last = f[f.length - 1]; const a = document.activeElement;
    if (e.shiftKey ? (a === first || !m.contains(a)) : (a === last || !m.contains(a))) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  });
  window.addEventListener('hashchange', () => closeMore());
}
function renderNav() {
  const waiting = allBiz().filter(needsReply).length; const ordersDue = orderTodos().length; const meetToday = meetingsToday().length;
  const items = [['today', 'Today', 'inbox', waiting], ['showrooms', 'Showrooms', 'store', 0], ['leads', 'Leads', 'chat', waiting], ['orders', 'Orders', 'receipt', ordersDue], ['buyers', 'Buyers', 'people', 0], ['meetings', 'Meetings', 'meet', meetToday], ['cities', 'Campaigns', 'megaphone', 0], ['trips', 'Visits', 'map', 0], ['prices', 'Prices', 'calc', 0], ['calendar', 'Calendar', 'calendar', 0], ['reports', 'Reports', 'bars', 0], ['sequence', 'Messages', 'route', 0], ['connections', 'Connections', 'plug', 0]];
  const cur = S.route.view === 'city' ? 'cities' : S.route.view === 'trip' ? 'trips' : S.route.view;
  const link = ([k, label, i, n]) => `<a href="#${k}" ${cur === k ? 'aria-current="page"' : ''}>${ico(i)}<span>${label}</span>${n ? `<span class="badge" aria-label="${n} waiting">${n}</span>` : ''}</a>`;
  const byKey = Object.fromEntries(items.map((x) => [x[0], x]));
  setShell('page-title', esc(pageTitle()));
  setShell('tabbar', TAB_VIEWS.map((k) => link(byKey[k])).join('') + `<button type="button" id="tab-more" data-act="more" aria-haspopup="dialog" aria-controls="more" ${MORE_VIEWS.includes(cur) ? 'aria-current="page"' : ''}>${MORE_ICON}<span>More</span></button>`);
  const more = $('#tab-more'); if (more) more.setAttribute('aria-expanded', String(moreOpen()));
  setShell('more-nav', MORE_VIEWS.map((k) => link(byKey[k])).join(''));
  const total = S.campaigns.size + S.businesses.size + S.quotes.size + S.samples.size + S.broadcasts.size + S.posts.size + S.orders.size + S.prices.size + S.trips.size + S.places.size + S.research.size + S.meetings.size;
  const modeNote = S.mode === 'db' ? `<b>${total.toLocaleString('en-US')}</b> of ${CAP.toLocaleString('en-US')} records used.` : S.mode === 'local' ? "<b>Practice mode.</b> Changes here aren't saved." : '';
  const foot = `${modeNote}<br>Channels connect at the end.`;
  setShell('more-foot', foot);
}
function viewHtml() {
  if (S.mode === 'loading' || (S.mode === 'db' && !(S.loaded.campaigns && S.loaded.businesses && S.loaded.settings))) {
    return '<div class="loading"><h1>Ark Diamond Outreach</h1><p>Loading your campaigns, buyers and leads.</p></div>';
  }
  const v = S.route.view;
  const body = v === 'meetings' ? meetingsView() : v === 'showrooms' ? showroomsView() : v === 'cities' ? citiesView() : v === 'city' ? cityView(S.route.id) : v === 'buyers' ? buyersView() : v === 'leads' ? leadsView() : v === 'calendar' ? calendarView() : v === 'reports' ? reportsView() : v === 'sequence' ? sequenceView() : v === 'connections' ? connectionsView() : v === 'orders' ? ordersView() : v === 'prices' ? pricesView() : v === 'trips' ? tripsView() : v === 'trip' ? tripView(S.route.id) : todayView();
  const moved = !S.device && MOVED_TO ? `<div class="banner">${ico('alert')}<p><b>Your app has moved.</b> Use Ark Diamond from your iPhone home screen or at <a href="${MOVED_TO}" target="_blank" rel="noopener">yumitdungrani.github.io</a>. Your buyers, orders and replies are kept there now, and this copy in Claude is no longer updated.</p></div>` : '';
  return moved + (S.mode === 'local' ? `<div class="banner">${ico('alert')}<p><b>Practice mode.</b> This copy can't reach your saved data, so nothing you do here is kept. Open Ark Diamond Outreach in Claude to work with your real cities and leads.</p></div>` : '') + body;
}

/* ---------- small builders ---------- */
const tile = (n, label, cls = '', href = '') => href ? `<a class="tile ${cls}" href="${href}"><span class="n">${n}</span><span class="l">${label}</span></a>` : `<div class="tile ${cls}"><span class="n">${n}</span><span class="l">${label}</span></div>`;
const emptyBox = (text, action = '') => `<div class="empty"><p>${text}</p>${action}</div>`;
const exChip = (b) => (b && b.isExample ? '<span class="chip example">Example</span>' : '');
const labChip = (b) => (b && b.labGrown ? ' · <span class="labmark">sells lab-grown</span>' : '');
const statusChip = (b) => `<span class="chip ${STATUS_TONE[b.status] || ''}">${esc(STATUS_LABEL[b.status] || b.status)}</span>`;
const stageChip = (s) => `<span class="chip ${STAGE_TONE[s] || ''}">${esc(STAGE_LABEL[s] || s)}</span>`;
const listAnd = (a) => (a.length < 2 ? a[0] || '' : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const tagChip = (t) => (t ? `<span class="chip ${TAG_TONE[t] || ''}">${esc(TAG_LABEL[t] || t)}</span>` : '');
function dueChip(due) {
  const d = daysBetween(todayStr(), due);
  if (d === 0) return '<span class="chip accent">Due today</span>';
  if (d < 0) return `<span class="chip warn">Overdue ${-d} d</span>`;
  return `<span class="chip">In ${d} d</span>`;
}
const meter = (n) => `<span class="meter" aria-hidden="true"><i style="width:${n}%"></i></span><span class="sub">${n}</span>`;
function reachIcons(b) {
  const c = contactOf(b);
  const has = { email: !!c.email, whatsapp: !!(c.whatsapp || c.phone), instagram: !!c.instagram, facebook: !!c.facebook, linkedin: !!c.linkedin };
  const names = Object.entries(has).filter(([, v]) => v).map(([k]) => CH_LABEL[k]);
  return `<span class="reach" title="${esc(names.join(', ') || 'No contact details yet')}" aria-label="${esc(names.join(', ') || 'No contact details yet')}">${Object.entries(has).map(([k, v]) => `<span class="${v ? 'on' : ''}">${chIco(k)}</span>`).join('')}</span>`;
}
function seg(group, cur, opts) { return `<div class="seg" role="group">${opts.map(([k, label]) => `<button type="button" data-act="seg" data-group="${group}" data-val="${esc(k)}" aria-pressed="${cur === k}">${label}</button>`).join('')}</div>`; }
function selectHtml(id, attrs, opts, cur, blank) {
  return `<select class="input" id="${id}" ${attrs}>${blank != null ? `<option value="">${esc(blank)}</option>` : ''}${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}
const fv = (k, dflt = '') => (S.form[k] ?? dflt);
// One clear button per row; the rest wait behind ⋯ until asked for.
function moreMenu(key, buttons) {
  if (!String(buttons || '').trim()) return '';
  const open = S.ui.menu === key;
  return `<button type="button" class="btn small quiet dots" data-act="menu" data-key="${esc(key)}" aria-expanded="${open}" aria-label="More actions">${MORE_ICON}</button>${open ? `<div class="menu-acts" role="group" aria-label="More actions">${buttons}</div>` : ''}`;
}
function placeSelect() {
  const f = focusNow(); const main = f.city || (f.country ? `All of ${f.country}` : 'Everywhere');
  const label = f.city ? `${f.city}, ${f.country}` : main;
  return `<button type="button" class="place-select" data-act="focus-open" aria-label="Working on ${esc(label)}. Change">${ico('pin')}<span class="what"><small>Working on</small><b>${esc(main)}${f.city ? `<span>, ${esc(f.country)}</span>` : ''}</b></span><span class="change">Change${ico('chev')}</span></button>`;
}
function confirmBtn(key, label, armedLabel, act, extra = '') {
  const armed = S.confirmKey === key;
  return `<button type="button" class="btn small ${armed ? 'armed' : 'danger quiet'}" data-act="${act}" data-key="${esc(key)}" ${extra}>${armed ? armedLabel : label}</button>`;
}
// One line on a page that leaves out other places, so nothing seems lost.
function elsewhereHint(n, one, many) {
  if (!n) return '';
  return `<p class="hint">Showing ${esc(focusName())}. ${n} more ${n === 1 ? `${one} is` : `${many} are`} elsewhere. <a href="#showrooms">Change the city in Showrooms</a>.</p>`;
}
function notConnectedBanner() {
  if (phoneMail()) return `<div class="banner">${ico('mail')}<p><b>Emails open in your ${mailAppName() === 'Gmail' ? 'Gmail' : 'mail'} app.</b> Send each one there, then mark it sent. WhatsApp, Instagram and LinkedIn steps stay as tasks for you to do and mark done. <a href="#connections">Connections</a></p></div>`;
  if (gmailOn()) return `<div class="banner">${ico('mail')}<p><b>Email sends from your Gmail.</b> WhatsApp, Instagram and LinkedIn steps stay as tasks for you to do and mark done. <a href="#connections">Connections</a></p></div>`;
  return `<div class="banner">${ico('plug')}<p><b>Channels connect at the end.</b> Until then, the app lists what is due and you send it yourself, then mark it done. <a href="#connections">See what each connection will do</a>.</p></div>`;
}

/* ---------- Today ---------- */
function todayData() {
  const st = settings(); const emails = []; const tasks = []; const today = todayStr();
  const f = st.focus; const bs = allBiz();
  for (const b of bs) for (const x of dueStepsFor(b, st)) (x.channel === 'email' ? emails : tasks).push({ b, ...x });
  const byDue = (a, b) => a.due.localeCompare(b.due) || a.b.name.localeCompare(b.b.name);
  emails.sort(byDue); tasks.sort(byDue);
  const waiting = bs.filter(needsReply).sort((a, b) => String(a.lead.lastInAt).localeCompare(String(b.lead.lastInAt)));
  const reminders = remindersDue(); const meetings = meetingsToday();
  const samples = [...S.samples.values()].filter((x) => ['sent', 'delivered', 'kept'].includes(x.status) && x.checkAt && x.checkAt <= today && S.businesses.get(x.businessId)).sort((a, b) => a.checkAt.localeCompare(b.checkAt));
  const retry = bs.filter((b) => b.status === 'closed' && b.closedAt && !b.noRetry && (Number(b.round) || 1) < 2 && !inbound(b).length && daysBetween(String(b.closedAt).slice(0, 10), today) >= (Number(st.rules.retryAfterDays) || 90) && !isSuppressed(contactOf(b).email));
  const bcs = [...S.broadcasts.values()].map((bc) => ({ bc, left: bcStats(bc).left })).filter((x) => x.left).sort((a, b) => String(b.bc.createdAt).localeCompare(String(a.bc.createdAt)));
  const mine = new Set((f.country ? [f.country] : bs.map((b) => b.country)).filter(Boolean));
  const pitch = SEASONS.filter((x) => seasonPhase(x) === 'now' && (!mine.size || x.countries.some((c) => mine.has(c))));
  return { emails, tasks, waiting, reminders, meetings, samples, retry, bcs, pitch, orders: orderTodos() };
}
function helloCard(t) {
  const now = new Date(); const hr = now.getHours(); const f = focusNow();
  const first = String(settings().company.senderName || '').trim().split(/\s+/)[0];
  const hello = `${hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'}${first ? `, ${first}` : ''}`;
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const go = `<span class="go">${ico('next')}</span>`;
  const row = (icon, label, value, to) => {
    const inner = `${ico(icon)}<span><b>${label}:</b> ${value}</span>`;
    if (!to) return `<div class="hello-row">${inner}</div>`;
    return to.startsWith('#') ? `<a class="hello-row" href="${to}">${inner}${go}</a>` : `<button type="button" class="hello-row" data-act="jump" data-target="${to}">${inner}${go}</button>`;
  };
  const doc = f.city ? S.places.get(placeKey(f.country, f.city)) : null;
  const running = [...S.campaigns.values()].filter((c) => inFocus(c) && campaignPhase(c).key === 'running').length;
  let place = row('megaphone', 'Campaigns running', String(running), '#cities');
  if (doc) {
    const rs = researchOf(placeKey(f.country, f.city)); const n = allShopsOf(doc).length;
    const res = !rs ? '' : rs.status === 'done' ? ', details found' : rs.status === 'stopped' ? ', details stopped' : ', finding details';
    place = row('store', `Showrooms in ${esc(f.city)}`, `${n} found${res}`, '#showrooms');
  }
  const w = t.waiting.length; const o = t.orders.length; const mt = t.meetings.length; const rm = t.reminders.length;
  const late = t.reminders.filter((x) => x.date < todayStr()).length; const send = t.emails.length + t.tasks.length;
  return `<h1 class="sr-only">Today</h1>
  <section class="hello" aria-label="Your day">
    <h2>${esc(hello)}</h2>
    <p class="eyebrow">${esc(dateLabel)}</p>
    ${row('chat', 'Replies waiting', w ? `<span class="hot">${w}</span>` : '0', w ? 'sec-replies' : '')}
    ${row('mail', 'To send today', send ? `${t.emails.length} ${t.emails.length === 1 ? 'email' : 'emails'}, ${t.tasks.length} ${t.tasks.length === 1 ? 'task' : 'tasks'}` : 'nothing', t.emails.length ? 'sec-emails' : t.tasks.length ? 'sec-tasks' : '')}
    ${row('meet', 'Meetings today', String(mt), mt ? 'sec-meetings' : '#meetings')}
    ${row('clock', 'Reminders', rm ? `${rm} due${late ? `, <span class="hot">${late} overdue</span>` : ''}` : 'none due', rm ? 'sec-reminders' : '')}
    ${row('receipt', 'Orders', o ? `${o} need${o === 1 ? 's' : ''} you` : 'nothing due', '#orders')}
    ${place}
    <button class="btn" data-act="log-reply">${ico('chat')}Log a reply</button>
  </section>`;
}
function todayView() {
  const t = todayData(); const st = settings();
  const retrySpan = Math.max(0, ...stepsFor('retry').map((x) => Number(x.day) || 0));
  const pitchNames = [...new Set(t.pitch.map((x) => x.name))];
  const visitsToday = tripsList().some((tr) => (tr.stops || []).some((st) => tripDay(tr.startDate, st.day) === todayStr()));
  const quiet = !gmailOn() && !visitsToday && ![t.waiting, t.tasks, t.emails, t.orders, t.bcs, t.samples, t.reminders, t.meetings, t.retry].some((x) => x.length);
  return `
  ${helloCard(t)}
  ${researchBanner()}
  ${visitsTodaySection()}
  ${quiet ? emptyBox("You're all caught up. New replies, tasks and emails that fall due show up here.", `<a class="btn" href="#showrooms">${ico('store')}Showrooms</a>`) : ''}
  ${t.waiting.length || gmailOn() ? `<section class="section" id="sec-replies"><div class="sec-head"><h2>Waiting for your reply <span class="count">${t.waiting.length}</span></h2>${gmailOn() ? `<button class="btn small" data-act="gm-sync" ${S.gm.sync.running ? 'disabled' : ''}>${ico('refresh')}${S.gm.sync.running ? 'Checking Gmail…' : 'Check Gmail'}</button>` : ''}</div>
    ${gmailOn() ? `<p class="hint">${esc(syncLine())}</p>` : ''}
    ${t.waiting.length ? `<div class="list">${t.waiting.map(waitingItem).join('')}</div>` : emptyBox(gmailOn() ? 'No replies waiting. Replies from Gmail land here by themselves, and the app reminds you until you answer.' : 'No replies waiting. When a buyer answers, log it with <b>Log a reply</b> and the app reminds you until you respond.')}
  </section>` : ''}
  ${t.meetings.length ? `<section class="section" id="sec-meetings"><h2>Meetings today <span class="count">${t.meetings.length}</span></h2><div class="list">${t.meetings.map(meetingItem).join('')}</div></section>` : ''}
  ${t.reminders.length ? `<section class="section" id="sec-reminders"><h2>Reminders <span class="count">${t.reminders.length}</span></h2><div class="list">${t.reminders.map(reminderItem).join('')}</div></section>` : ''}
  ${t.orders.length ? `<section class="section"><h2>Orders <span class="count">${t.orders.length}</span></h2><div class="list">${t.orders.map(({ o, t: td }) => orderItem(o, td)).join('')}</div></section>` : ''}
  ${t.tasks.length ? `<section class="section" id="sec-tasks"><h2>Your tasks <span class="count">${t.tasks.length}</span></h2>
    <div class="list">${t.tasks.map(taskItem).join('')}</div>
  </section>` : ''}
  ${t.emails.length || S.gm.batch ? emailsSection(t) : ''}
  ${t.bcs.length ? `<section class="section"><h2>Broadcasts to send <span class="count">${t.bcs.reduce((a, x) => a + x.left, 0)}</span></h2><div class="list">${t.bcs.map(({ bc, left }) => `<div class="item"><div class="stack"><div class="title-row">${chLabel(bc.channel)}<button class="linkish" data-act="bc-open" data-id="${esc(bc.id)}">${esc(bc.title)}</button>${exChip(bc)}</div><div class="meta"><span>${left} left to send</span><span>${esc(SEGMENT_LABEL[(bc.audience || {}).segment] || '')}</span></div></div><div class="actions"><button class="btn small primary" data-act="bc-open" data-id="${esc(bc.id)}">Open</button></div></div>`).join('')}</div></section>` : ''}
  ${t.samples.length ? `<section class="section"><h2>Samples to follow up <span class="count">${t.samples.length}</span></h2><div class="list">${t.samples.map(sampleDueItem).join('')}</div></section>` : ''}
  ${t.retry.length ? `<section class="section"><div class="sec-head"><h2>Ready for a second try <span class="count">${t.retry.length}</span></h2><button class="btn small" data-act="retry-all">${ico('refresh')}Start for all ${t.retry.length}</button></div>
    <p class="hint">These buyers finished the follow-up ${esc(st.rules.retryAfterDays)} or more days ago without answering. The second try is a short ${retrySpan}-day sequence about new designs.</p>
    <div class="list">${t.retry.slice(0, 25).map(retryItem).join('')}</div>${t.retry.length > 25 ? `<p class="hint">And ${t.retry.length - 25} more.</p>` : ''}</section>` : ''}
  ${pitchNames.length ? `<div class="banner plain">${ico('calendar')}<p><b>Retailers are ordering now for ${esc(listAnd(pitchNames.length > 2 ? [...pitchNames.slice(0, 2), 'more'] : pitchNames))}.</b> Send your leads an offer. <a href="#calendar">Open the calendar</a></p></div>` : ''}`;
}
// Anything waiting outside the place you're working on still gets a mention, so nothing slips.

function waitingItem(b) {
  const l = b.lead; const h = hoursSince(l.lastInAt); const last = inbound(b).slice(-1)[0];
  const tone = h < 2 ? 'accent' : h < 12 ? 'warn' : 'bad';
  return `<div class="item tap"><div class="stack">
    <div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta">${chLabel(l.lastChannel)}<span>${esc(b.city)}, ${esc(b.country)}</span><span>${esc(reminderText(l))}</span></div>
    ${last ? `<div class="msg quote">${esc(trunc(last.text, 260))}</div>` : ''}
    <div class="tags"><span class="chip ${tone}">${ico('clock')}waiting ${fmtWait(h)}</span>${windowChip(l.lastInAt, l.lastChannel)}${tagChip(last && last.tag)}${['phone', 'whatsapp'].includes(l.lastChannel) ? localChip(b) : ''}${exChip(b)}</div>
  </div><div class="actions">
    <button class="btn small primary" data-act="open-biz" data-id="${esc(b.id)}">Reply</button>
    ${moreMenu('w:' + b.id, `<button class="btn small" data-act="answered" data-id="${esc(b.id)}">${ico('check')}Mark answered</button><button class="btn small" data-act="snooze" data-id="${esc(b.id)}" data-when="tomorrow">${ico('clock')}Remind me tomorrow</button>`)}
  </div></div>`;
}
function taskItem(x) {
  const { b, step, due, channel } = x; const c = contactOf(b);
  const text = stepText(b, step, channel); const link = channelLink(b, channel, text);
  let note = '';
  if (channel === 'phone') note = c.phone || c.whatsapp ? `<div class="meta"><span>Phone</span><span class="mono sel">${esc(c.phone || c.whatsapp)}</span>${step.channel === 'whatsapp' ? '<span class="sub">No WhatsApp opt-in yet, so call instead.</span>' : ''}</div>` : '<div class="warnline">' + ico('alert') + 'No phone number on file. Add one or skip this step.</div>';
  if (channel === 'instagram' && !c.instagram) note = `<div class="warnline">${ico('alert')}No Instagram handle on file. Add one or skip this step.</div>`;
  if (channel === 'whatsapp') note = `<div class="meta sub">They opted in. The app sends this by itself once WhatsApp is connected.</div>`;
  const key = `task:${b.id}:${step.id}`; const opened = !link || S.mailOpened.has(key); const ids = `data-id="${esc(b.id)}" data-step="${esc(step.id)}"`;
  const openBtn = (primary) => `<a class="btn small${primary ? ' primary' : ''}" href="${esc(link)}" target="_blank" rel="noopener" data-act="mail-open" data-key="${esc(key)}"${channel === 'whatsapp' ? '' : ` data-copy="${esc(b.id)}:${esc(step.id)}"`}>${ico('ext')}Open ${esc(CH_LABEL[channel])}</a>`;
  const doneBtn = (primary) => `<button class="btn small${primary ? ' primary' : ''}" data-act="step-done" ${ids} data-how="done">${ico('check')}Done</button>`;
  return `<div class="item"><div class="stack">
    <div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta">${chLabel(channel)}<span>${esc(b.city)}, ${esc(b.country)}</span><span>${esc(SEQ_SHORT[seqKindOf(b)] + step.title)}</span></div>
    <div class="tags">${dueChip(due)}${['phone', 'whatsapp'].includes(channel) ? localChip(b) : ''}${exChip(b)}</div>
    <div class="msg">${esc(text)}</div>${note}
  </div><div class="actions">
    ${opened ? doneBtn(true) : openBtn(true)}
    ${moreMenu('t:' + key, `${opened ? (link ? openBtn(false) : '') : doneBtn(false)}<button class="btn small" data-act="copy-step" ${ids}>${ico('copy')}Copy message</button><button class="btn small" data-act="log-reply" data-id="${esc(b.id)}">${ico('chat')}They replied</button><button class="btn small quiet" data-act="step-done" ${ids} data-how="skipped">Skip</button>`)}
  </div></div>`;
}
function emailItem(x) {
  const { b, step, due } = x; const e = emailText(b, step); const c = contactOf(b);
  const issues = complianceIssues(`${e.subject}\n${e.body}`, b.country); const cn = consentNote(b); if (cn) issues.unshift(cn);
  const key = `step:${b.id}:${step.id}`; const gm = gmailOn() && !!c.email; const busy = S.gm.busy === key;
  const pm = !gm && phoneMail() && !!c.email; const opened = S.mailOpened.has(key);
  return `<div class="item"><div class="stack">
    <div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta">${c.email ? `<span class="mono sel">${esc(c.email)}</span>` : ''}<span>${esc(SEQ_SHORT[seqKindOf(b)] + step.title)}</span><span>${esc(b.city)}</span></div>
    <div class="tags">${dueChip(due)}${c.email ? '' : '<span class="chip warn">No email address</span>'}${e.variant ? `<span class="chip">Subject ${e.variant}</span>` : ''}${exChip(b)}</div>
    <div class="subj">${esc(e.subject)}</div>
    ${issues.length ? `<div class="warnline">${ico('alert')}${esc(issues.join(' · '))}</div>` : ''}
  </div><div class="actions">
    ${gm ? `<button class="btn small primary" data-act="gm-send" data-id="${esc(b.id)}" data-step="${esc(step.id)}" ${busy || S.gm.batch ? 'disabled' : ''}>${ico('mail')}${busy ? 'Sending…' : 'Send with Gmail'}</button>` : ''}
    ${pm && !opened ? mailOpen(c.email, e.subject, e.body, key, true) : ''}
    ${!gm && (!pm || opened) ? `<button class="btn small primary" data-act="step-done" data-id="${esc(b.id)}" data-step="${esc(step.id)}" data-how="sent">${ico('check')}Mark sent</button>` : ''}
    ${moreMenu('e:' + key, `${gm || (pm && !opened) ? `<button class="btn small" data-act="step-done" data-id="${esc(b.id)}" data-step="${esc(step.id)}" data-how="sent">${ico('check')}Mark sent</button>` : ''}${pm && opened ? mailOpen(c.email, e.subject, e.body, key, false) : ''}<button class="btn small" data-act="copy-step" data-id="${esc(b.id)}" data-step="${esc(step.id)}">${ico('copy')}Copy email</button><button class="btn small quiet" data-act="step-done" data-id="${esc(b.id)}" data-step="${esc(step.id)}" data-how="bounced">Bounced</button><button class="btn small quiet" data-act="step-done" data-id="${esc(b.id)}" data-step="${esc(step.id)}" data-how="skipped">Skip</button>`)}
  </div>${S.gm.confirm === key ? sendConfirm(c.email, issues, 'gm-send-go', 'Send') : ''}</div>`;
}

function sampleDueItem(x) {
  const b = S.businesses.get(x.businessId);
  return `<div class="item tap corner"><div class="stack"><div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta"><span class="ch">${ico('box')}Samples</span><span>${esc(x.pieces || 'Samples')}, sent ${esc(fmtDay(x.sentAt))}</span><span>${esc(SAMPLE_LABEL[x.status] || x.status)}</span></div>
    <div class="tags"><span class="chip warn">Check in ${esc(fmtDay(x.checkAt))}</span>${localChip(b)}${exChip(b)}</div>
    <div class="sub">Ask whether the pieces arrived, what they think, and whether to prepare an order.</div></div>
    <div class="actions">${moreMenu('sd:' + x.id, `${sampleButtons(x).replace(/ primary/g, '')}<button class="btn small quiet" data-act="sample-snooze" data-id="${esc(x.id)}">Ask again in 3 days</button>`)}</div></div>`;
}
function retryItem(b) {
  return `<div class="item"><div class="stack"><div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta"><span>${esc(b.city)}, ${esc(b.country)}</span><span>Follow-up ended ${esc(fmtDay(String(b.closedAt).slice(0, 10)))}</span></div>
    <div class="tags">${exChip(b)}</div></div>
    <div class="actions"><button class="btn small primary" data-act="retry-one" data-id="${esc(b.id)}">${ico('refresh')}Start second try</button>${moreMenu('r:' + b.id, `<button class="btn small quiet" data-act="retry-skip" data-id="${esc(b.id)}">Leave them</button>`)}</div></div>`;
}

/* ---------- Cities ---------- */
function campaignPhase(c) {
  const bs = bizOf(c.id);
  if (c.paused) return { key: 'paused', label: 'Paused', tone: 'warn' };
  if (!bs.length) return { key: 'finding', label: 'Finding buyers', tone: '' };
  if (bs.some((b) => b.status === 'active')) return { key: 'running', label: 'Sequence running', tone: 'accent' };
  if (bs.some((b) => b.status === 'found')) return { key: 'review', label: 'Approve the list', tone: 'gold' };
  if (bs.some((b) => b.status === 'approved')) return { key: 'ready', label: 'Ready to start', tone: 'gold' };
  return { key: 'done', label: 'Finished', tone: 'good' };
}
function campCounts(c) {
  const bs = bizOf(c.id);
  return {
    found: bs.length,
    approved: bs.filter((b) => !['found', 'rejected'].includes(b.status)).length,
    waitingStart: bs.filter((b) => b.status === 'approved').length,
    active: bs.filter((b) => b.status === 'active').length,
    replied: bs.filter((b) => inbound(b).length).length,
    orders: bs.filter((b) => b.lead && b.lead.firstOrderAt).length,
    review: bs.filter((b) => b.status === 'found').length,
  };
}
function howItWorks() {
  const span = Math.max(0, ...stepsFor().map((s) => Number(s.day) || 0));
  return `<ol class="howto"><li><b>Choose a city or a fair</b>Pick the place, buyer types and product lines.</li><li><b>Find buyers</b>Import a list, add shops by hand, or ask Claude in chat to search.</li><li><b>Approve the list</b>Nothing is sent until you approve each buyer.</li><li><b>Let it run</b>The ${span}-day follow-up runs email, WhatsApp, Instagram and LinkedIn; replies land in Leads with reminders.</li></ol>`;
}
function citiesView() {
  const f = focusNow(); const every = [...S.campaigns.values()]; const hidden = every.filter((c) => !inFocus(c, f)).length;
  const camps = every.filter((c) => inFocus(c, f)).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const title = (c) => (c.kind === 'fair' ? c.fairName || c.city : c.city);
  return `<header class="head"><div><h1>Campaigns</h1><p>A city campaign targets the jewellers in one city. A fair campaign collects the people you meet at a trade fair. You approve who gets contacted, then the follow-up runs.</p></div>
    <div class="actions"><button class="btn primary" data-act="new-campaign">${ico('plus')}New city campaign</button>${moreMenu('camps', `<button class="btn small" data-act="new-fair">${ico('calendar')}New fair campaign</button>`)}</div></header>
  ${howItWorks()}
  ${elsewhereHint(hidden, 'campaign', 'campaigns')}
  ${camps.length ? `<div class="table-wrap"><table><thead><tr><th>Campaign</th><th>Stage</th><th class="num">Found</th><th class="num">Approved</th><th class="num">In sequence</th><th class="num">Replies</th><th class="num">Orders</th></tr></thead><tbody>
    ${camps.map((c) => { const n = campCounts(c); const ph = campaignPhase(c); return `<tr class="click" data-act="go" data-href="#city-${esc(c.id)}"><td><a href="#city-${esc(c.id)}" class="linkish">${esc(title(c))}</a> ${c.kind === 'fair' ? '<span class="chip gold">Fair</span>' : ''} ${c.isExample ? '<span class="chip example">Example</span>' : ''}<div class="sub">${c.kind === 'fair' ? `${esc(fmtRange(c.startDate, c.endDate))} · ${esc(c.city)}, ` : ''}${esc(c.country)}</div></td><td><span class="chip ${ph.tone}">${ph.label}</span></td><td class="num">${n.found}</td><td class="num">${n.approved}</td><td class="num">${n.active}</td><td class="num">${n.replied}</td><td class="num">${n.orders}</td></tr>`; }).join('')}
  </tbody></table></div>` : emptyBox('No campaigns yet. Start with one of your test cities, such as London or Dubai, or a fair you are going to.', `<button class="btn primary" data-act="new-campaign">${ico('plus')}New city campaign</button>`)}`;
}
const CITY_TABS = [['review', 'To review'], ['approved', 'Approved'], ['active', 'In sequence'], ['replied', 'Replied'], ['other', 'Closed'], ['all', 'All']];
function bestCityTab(id) {
  const bs = bizOf(id); const has = (fn) => bs.some(fn);
  if (has((b) => b.status === 'found')) return 'review';
  if (has((b) => b.status === 'approved')) return 'approved';
  if (has((b) => b.status === 'active')) return 'active';
  if (has((b) => b.status === 'replied' || inbound(b).length)) return 'replied';
  return bs.length ? 'all' : 'review';
}
function cityList(id) {
  if (!S.filters.city.tab) S.filters.city.tab = bestCityTab(id);
  const tab = S.filters.city.tab; let list = bizOf(id);
  if (tab === 'review') list = list.filter((b) => b.status === 'found');
  else if (tab === 'approved') list = list.filter((b) => b.status === 'approved');
  else if (tab === 'active') list = list.filter((b) => b.status === 'active');
  else if (tab === 'replied') list = list.filter((b) => b.status === 'replied' || inbound(b).length);
  else if (tab === 'other') list = list.filter((b) => ['closed', 'rejected', 'unsubscribed', 'bounced'].includes(b.status));
  return list.sort((a, b) => fitScore(b) - fitScore(a) || a.name.localeCompare(b.name));
}
function cityView(id) {
  const c = S.campaigns.get(id);
  if (!c) return emptyBox("This campaign doesn't exist any more.", '<a class="btn" href="#cities">Back to campaigns</a>');
  const isFair = c.kind === 'fair'; const title = isFair ? c.fairName || c.city : c.city;
  const n = campCounts(c); const ph = campaignPhase(c); const list = cityList(id); const sel = [...S.selection].filter((x) => S.businesses.get(x) && S.businesses.get(x).campaignId === id);
  const ct = totalsOf(computeReport(bizOf(id), 'country'));
  const findOpen = S.ui.findOpen[id] ?? (n.found === 0);
  const lines = (c.productLines || []).map((k) => LINE_LABEL[k]).filter(Boolean);
  const fairBits = isFair ? `${esc(fmtRange(c.startDate, c.endDate))} · ${c.role === 'exhibiting' ? `Exhibiting${c.booth ? `, booth ${esc(c.booth)}` : ''}` : 'Visiting'} · ` : '';
  return `<header class="head"><div><div class="eyebrow"><a href="#cities">Campaigns</a> · ${isFair ? `Fair · ${esc(c.city)}, ` : ''}${esc(c.country)}</div><h1>${esc(title)}</h1>
      <p><span class="chip ${ph.tone}">${ph.label}</span> ${c.isExample ? '<span class="chip example">Example</span>' : ''} ${fairBits}Messages in ${esc(c.language || 'English')}</p>${lines.length ? `<ul class="hallmarks" aria-label="Product lines">${lines.map((l) => `<li class="hallmark">${esc(l)}</li>`).join('')}</ul>` : ''}</div>
    <div class="actions">
      ${isFair && canScan() ? scanButtons(c, 'h') : ''}
      <button class="btn primary" data-act="start-all" data-id="${esc(id)}" ${n.waitingStart ? '' : 'disabled'}>${isFair ? 'Start follow-up' : 'Start sequence'}${n.waitingStart ? ` for ${n.waitingStart}` : ''}</button>
      ${moreMenu('camp:' + id, `<button class="btn small" data-act="toggle-find" data-id="${esc(id)}">${ico('plus')}${isFair ? 'Add contacts' : 'Find buyers'}</button>${isFair ? '' : `<button type="button" class="btn small" data-act="work-on" data-country="${esc(c.country)}" data-city="${esc(c.city)}">${ico('store')}Showrooms in ${esc(c.city)}</button>`}<button class="btn small" data-act="edit-campaign" data-id="${esc(id)}">Settings</button>${c.paused ? `<button class="btn small" data-act="pause-campaign" data-id="${esc(id)}" data-val="0">Resume</button>` : `<button class="btn small" data-act="pause-campaign" data-id="${esc(id)}" data-val="1">Pause</button>`}`)}
    </div></header>
  <div class="stepper">
    <div class="step ${['finding', 'review'].includes(ph.key) ? 'on' : ''}"><div class="k">${isFair ? 'Contacts' : 'Found'}</div><div class="v">${n.found}</div><div class="sub">${n.review} to review</div></div>
    <div class="step ${ph.key === 'ready' ? 'on' : ''}"><div class="k">Approved</div><div class="v">${n.approved}</div><div class="sub">${n.waitingStart} ready to start</div></div>
    <div class="step ${ph.key === 'running' ? 'on' : ''}"><div class="k">In sequence</div><div class="v">${n.active}</div><div class="sub">${c.paused ? 'paused' : 'following up'}</div></div>
    <div class="step ${ph.key === 'done' ? 'on' : ''}"><div class="k">Replies</div><div class="v">${n.replied}</div><div class="sub">${n.orders} ordered</div></div>
  </div>
  ${isFair && String(c.startDate || '') >= todayStr() ? `<div class="banner plain">${ico('megaphone')}<p><b>Before the fair:</b> invite the buyers you already know to ${c.role === 'exhibiting' ? 'visit your booth' : 'meet you there'}. <button class="btn small" data-act="bc-new" data-fair="${esc(c.id)}">Write the invitation</button></p></div>` : ''}
  ${findOpen ? (isFair ? fairPanel(c) : findPanel(c)) : ''}
  <section class="section">
    <div class="sec-head"><h2>${isFair ? `Contacts from ${esc(title)}` : `Buyers in ${esc(c.city)}`} <span class="count">${list.length}</span></h2>${seg('city', S.filters.city.tab, CITY_TABS)}</div>
    ${sel.length ? `<div class="bulk"><b>${sel.length} selected</b><button class="btn small" data-act="bulk" data-op="approve">Approve</button><button class="btn small" data-act="bulk" data-op="reject">Reject</button><button class="btn small primary" data-act="bulk" data-op="start">Start sequence</button><button class="btn small quiet" data-act="bulk" data-op="clear">Clear selection</button></div>` : ''}
    ${list.length ? cityTable(list) : emptyBox(S.filters.city.tab === 'review' ? `No buyers waiting for review. Use <b>${isFair ? 'Add contacts' : 'Find buyers'}</b> to add more.` : 'No buyers in this group yet.')}
  </section>
  <section class="section"><div class="sec-head"><h2>Results ${isFair ? 'from' : 'in'} ${esc(title)}</h2>${n.found ? `<button class="btn small" data-act="city-report" data-id="${esc(id)}">${ico('bars')}Open in Reports</button>` : ''}</div>
    ${n.found ? `<div class="charts"><div class="chart"><h3>From found to ordered</h3>${funnelHtml(ct)}${ct.contacted ? `<p class="cap">Reply rate ${pct(ct.rate)}${ct.revenue ? ` · ${money(ct.revenue)} ordered` : ''}${ct.avgHours == null ? '' : ` · you reply in ${fmtWait(ct.avgHours)} on average`}</p>` : ''}</div><div class="chart"><h3>Where replies came from</h3>${channelBars(bizOf(id))}</div></div>` : emptyBox('Results show here once you add buyers and start the sequence.')}
  </section>
  <section class="section"><div class="sec-head"><h2>Danger zone</h2></div><div class="actions">${confirmBtn('camp:' + id, `Delete this campaign and its ${n.found} buyers`, 'Click again to delete everything', 'delete-campaign', `data-id="${esc(id)}"`)}</div></section>`;
}
const canScan = () => aiAvailable() && !!S.ai.images;
const scanAccept = () => ((S.ai.images && S.ai.images.mediaTypes) || ['image/jpeg', 'image/png', 'image/webp']).join(',');
function scanButtons(c, where) {
  const acc = esc(scanAccept()); const busy = S.ai.busy === 'scan'; const id = esc(c.id);
  if (where === 'h') return `<label class="btn" for="scanh-${id}">${ico('camera')}${busy ? 'Reading…' : 'Scan a card'}</label><input type="file" id="scanh-${id}" accept="${acc}" capture="environment" data-scan="${id}" hidden>`;
  return `<label class="btn primary" for="scan1-${id}">${ico('camera')}${busy ? 'Reading cards…' : 'Take a photo'}</label><input type="file" id="scan1-${id}" accept="${acc}" capture="environment" data-scan="${id}" hidden>
    <label class="btn" for="scann-${id}">${ico('upload')}Choose photos</label><input type="file" id="scann-${id}" accept="${acc}" multiple data-scan="${id}" hidden>`;
}
function fairPanel(c) {
  return `<section class="section"><div class="sec-head"><h2>Add contacts from ${esc(c.fairName || c.city)}</h2><button class="btn small quiet" data-act="toggle-find" data-id="${esc(c.id)}">Hide</button></div>
  <div class="options">
    <div class="option"><h3>Scan business cards</h3><p>Photograph each card, or pick several photos at once. Claude reads the name, company, email and phone, and you check them before saving.</p>
      ${canScan() ? `<div class="actions">${scanButtons(c, 'p')}</div>` : (onPhone() ? '<p class="hint">Card scanning needs Claude. Add each contact by hand, or send the photos to Claude in chat.</p>' : '<p class="hint">Card scanning works when this page runs inside Claude.</p>')}</div>
    <div class="option"><h3>Add a contact</h3><p>Someone who visited your booth or you met in the aisles.</p><button class="btn" data-act="add-biz" data-id="${esc(c.id)}">${ico('plus')}Add a contact</button></div>
    <div class="option"><h3>Import a list</h3><p>The fair's exhibitor or visitor list as a CSV, if the organiser shares one. Imported names get the city outreach, not the "great to meet you" follow-up.</p>
      <label class="btn" for="csv-${esc(c.id)}">${ico('upload')}Choose CSV file</label><input type="file" id="csv-${esc(c.id)}" accept=".csv,text/csv" data-import="${esc(c.id)}" hidden>
      <button class="btn small quiet" data-act="csv-template">${ico('download')}Get the template</button></div>
  </div></section>`;
}
function cityTable(list) {
  const all = list.length && list.every((b) => S.selection.has(b.id));
  return `<div class="table-wrap"><table><thead><tr><th class="cb"><input type="checkbox" id="sel-all" data-selall="1" aria-label="Select all buyers shown" ${all ? 'checked' : ''}></th><th>Buyer</th><th>Can reach by</th><th>Fit</th><th>Status</th><th>Next step</th><th><span class="sub">Actions</span></th></tr></thead><tbody>
    ${list.map((b) => `<tr><td class="cb"><input type="checkbox" id="sel-${esc(b.id)}" data-sel="${esc(b.id)}" aria-label="Select ${esc(b.name)}" ${S.selection.has(b.id) ? 'checked' : ''}></td>
      <td><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button> ${exChip(b)}<div class="sub">${esc(TYPE_LABEL[b.type] || '')}${labChip(b)}</div></td>
      <td>${reachIcons(b)}</td><td>${meter(fitScore(b))}</td><td>${statusChip(b)}</td><td class="sub">${esc(nextLabel(b))}</td>
      <td class="row-actions">${b.status === 'found' ? `<button class="btn small" data-act="approve" data-id="${esc(b.id)}">Approve</button><button class="btn small quiet" data-act="reject" data-id="${esc(b.id)}">Reject</button>` : b.status === 'approved' ? `<button class="btn small" data-act="start-one" data-id="${esc(b.id)}">Start</button>` : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function claudePrompt(c) {
  const types = (c.buyerTypes && c.buyerTypes.length ? c.buyerTypes : BUYER_TYPES.map((x) => x[0])).map((k) => (TYPE_LABEL[k] || k).toLowerCase()).join(', ');
  return `Find ${types}s and lab-grown diamond buyers in ${c.city}, ${c.country}, mark the ones that already sell lab-grown diamonds, and add them to my Ark Diamond Outreach app${onPhone() ? ' (its records are in my Supabase project "ark-diamond-outreach", table outreach_docs, collection businesses, status found)' : ''} under the ${c.city} campaign${onPhone() ? ` (campaign id ${c.id})` : ''} for me to approve.${c.country === UK ? ' For each one, note whether it is a limited company and give its Companies House number, because UK email rules differ for sole traders.' : ''}`;
}
function findPanel(c) {
  return `<section class="section"><div class="sec-head"><h2>Find buyers in ${esc(c.city)}</h2><button class="btn small quiet" data-act="toggle-find" data-id="${esc(c.id)}">Hide</button></div>
  <div class="options">
    <div class="option"><h3>Import a list</h3><p>A CSV from a customs-data provider, a fair's exhibitor list or your own spreadsheet. Columns: name, type, sells_lab_grown (yes or no), contact, email, phone, whatsapp, website, instagram, facebook, linkedin, notes.</p>
      <label class="btn" for="csv-${esc(c.id)}">${ico('upload')}Choose CSV file</label><input type="file" id="csv-${esc(c.id)}" accept=".csv,text/csv" data-import="${esc(c.id)}" hidden>
      <button class="btn small quiet" data-act="csv-template">${ico('download')}Get the template</button></div>
    <div class="option"><h3>Add a buyer</h3><p>A shop you already know, met at a fair, or found on Instagram.</p><button class="btn" data-act="add-biz" data-id="${esc(c.id)}">${ico('plus')}Add a buyer</button></div>
    <div class="option"><h3>Ask Claude to search</h3><p>Paste this into your chat with Claude. Claude checks public websites and adds what it finds here for you to approve.</p>
      <div class="prompt">${esc(claudePrompt(c))}</div><button class="btn small" data-act="copy-prompt" data-id="${esc(c.id)}">${ico('copy')}Copy request</button></div>
  </div><p class="hint">Automatic city search arrives when you connect a business-data source at the end.</p></section>`;
}

/* ---------- where a saved shop stands ---------- */
const SHOP_STATES = [['new', 'Not contacted'], ['campaign', 'In campaign'], ['replied', 'Replied'], ['noreply', 'No reply'], ['out', 'Stopped']];
function shopState(b) {
  if (!b) return 'new';
  if (['unsubscribed', 'bounced', 'rejected'].includes(b.status)) return 'out';
  if (b.status === 'replied' || inbound(b).length || (b.lead && b.lead.lastInAt)) return 'replied';
  if (b.status === 'active') return 'campaign';
  if (b.status === 'closed') return 'noreply';
  return 'new';
}
const hasOrdered = (b) => !!b && ((b.lead && Number(b.lead.ordersValue) > 0) || ordersOf(b.id).some((o) => o.status !== 'cancelled'));
function stateChip(b) {
  const st = shopState(b);
  if (st === 'campaign') {
    const d = b.seqStart ? daysBetween(b.seqStart, todayStr()) : 0; const span = Math.max(0, ...stepsFor(seqKindOf(b)).map((x) => Number(x.day) || 0));
    return d < 0 ? `<span class="chip accent">Starts ${esc(fmtDay(b.seqStart))}</span>` : `<span class="chip accent">In campaign · ${d === 0 ? 'started today' : `day ${Math.min(d, span)} of ${span}`}</span>`;
  }
  if (st === 'replied') return hasOrdered(b) ? '<span class="chip good">Ordered</span>' : b.lead && b.lead.stage === 'lost' ? '<span class="chip">Not interested</span>' : '<span class="chip good">Replied</span>';
  if (st === 'noreply') return '<span class="chip warn">No reply</span>';
  if (st === 'out') return `<span class="chip bad">${esc(STATUS_LABEL[b.status] || 'Stopped')}</span>`;
  return '<span class="chip">Not contacted</span>';
}

/* ---------- Showrooms ---------- */
function cityButtons(country, small) {
  const f = focusNow();
  const n = (c) => allBiz().filter((b) => inFocus(b, { country, city: c })).length;
  return `<div class="cities${small ? ' small' : ''}">${small ? `<button type="button" class="city-btn" data-act="work-on" data-country="${esc(country)}" data-city="" aria-pressed="${!f.city && placeText(f.country) === placeText(country)}"><b>All of ${esc(country)}</b><span class="sub">Every city</span></button>` : ''}${cityOptions(country).map((c) => {
    const d = S.places.get(placeKey(country, c)); const k = n(c);
    const sub = d ? `${allShopsOf(d).length} showrooms` : k ? `${k} ${k === 1 ? 'buyer' : 'buyers'}` : 'Not searched yet';
    return `<button type="button" class="city-btn" data-act="work-on" data-country="${esc(country)}" data-city="${esc(c)}" aria-pressed="${placeText(f.city) === placeText(c) && placeText(f.country) === placeText(country)}"><b>${esc(c)}</b><span class="sub">${esc(sub)}</span></button>`;
  }).join('')}</div>
  <form class="inline-form" data-form="work-city" data-country="${esc(country)}"><div class="field"><label for="oc-city-${small ? 'm' : 'p'}">Another city</label><input class="input" id="oc-city-${small ? 'm' : 'p'}" data-k="oc.city" value="${esc(fv('oc.city'))}" placeholder="e.g. Leicester" autocomplete="off"></div><button type="submit" class="btn">${small ? 'Work on it' : 'Find showrooms'}</button></form>`;
}
function countryButtons() {
  const n = (c) => allBiz().filter((b) => placeText(b.country) === placeText(c)).length;
  const list = focusCountries().map((c) => [c, n(c)]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return `<div class="cities">${list.map(([c, k]) => `<button type="button" class="city-btn" data-act="work-on" data-country="${esc(c)}" data-city=""><b>${esc(c)}</b><span class="sub">${k ? `${k} ${k === 1 ? 'buyer' : 'buyers'}` : 'No buyers yet'}</span></button>`).join('')}</div>`;
}
function showroomsView() {
  const f = focusNow(); const pick = placeSelect();
  if (!f.country) return `${pick}<header class="head"><div><h1>Choose a country</h1><p>Pick a country, then a city. The app finds every jewellery showroom there, shows them on a map and makes a short report.</p></div></header>${countryButtons()}`;
  if (!f.city) return `${pick}<header class="head"><div><h1>Choose a city</h1><p>The app finds every jewellery showroom in the city you pick, shows them on a map and makes a short report. The rest of the app then works on that city.</p></div></header>${cityButtons(f.country, false)}`;
  const key = placeKey(f.country, f.city); const doc = S.places.get(key); const busy = S.find.busy && S.find.key === key;
  const head = (p, actions = '') => `${pick}<header class="head"><div><h1 class="sr-only">Showrooms in ${esc(f.city)}</h1>${p}</div>${actions}</header>`;
  if (!doc) {
    if (!canFind()) return head(`<p>Finding showrooms works in the Ark Diamond app on your phone, at <a href="${MOVED_TO}" target="_blank" rel="noopener">yumitdungrani.github.io</a>.</p>`);
    if (!busy && S.find.error && S.find.key === key) return head(`<p>${esc(S.find.error)}</p>`, `<div class="actions"><button class="btn primary" data-act="places-retry">${ico('refresh')}Try again</button></div>`);
    if (!busy && S.find.stopped && S.find.key === key) return head('<p>Search stopped. Nothing was saved.</p>', `<div class="actions"><button class="btn primary" data-act="places-retry">${ico('refresh')}Search again</button></div>`);
    autoFind(f);
    return head('<p>Every jewellery showroom in the city, on a map, with a short report.</p>') + `<div class="finding" role="status"><svg class="gemspin" viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5h14l6 7-13 15L3 12z"/><path d="M3 12h26M12.5 5 10 12l6 15 6-15-2.5-7M10 12l6-7 6 7"/></svg><p><b>${esc(busy ? S.find.step : `Looking for showrooms in ${f.city}`)}…</b><br><span class="sub">This takes a few seconds, longer for London.</span></p>${busy ? `<button type="button" class="btn small" data-act="find-stop">${ico('stop')}Stop</button>` : ''}</div>`;
  }
  const r = showroomReport(doc); const pf = S.filters.places; const q = pf.q.trim().toLowerCase();
  const tab = ['ind', 'online', 'chain'].includes(pf.tab) ? pf.tab : 'ind';
  let list = tab === 'chain' ? r.chains : tab === 'online' ? r.online : r.ind;
  if (q) list = list.filter((x) => [x.s.name, x.s.street, x.s.postcode, x.s.area, x.s.brand].join(' ').toLowerCase().includes(q));
  const shown = list.slice(0, S.ui.placesShown); const toAdd = r.ind.filter((x) => !x.b && !x.s.closed); markResearchSeen(key);
  const sel = S.ui.placeSel ? r.rows.find((x) => x.s.id === S.ui.placeSel) : null;
  const areas = r.areas.slice(0, 8); const amax = Math.max(1, ...areas.map((a) => a.n));
  const fetched = String(doc.fetchedAt || '').slice(0, 10);
  const fresh = [...r.ind, ...r.online].filter((x) => x.b && startable(x.b)).length;
  return head(`<p>${r.more ? `${r.total} jewellery showrooms: ${r.mapTotal} from OpenStreetMap on ${esc(fmtDate(fetched))} and ${r.more} more found by Claude` : `${r.total} jewellery ${r.total === 1 ? 'showroom' : 'showrooms'}, from OpenStreetMap on ${esc(fmtDate(fetched))}`}${r.online.length ? `, and ${r.online.length} online ${r.online.length === 1 ? 'seller' : 'sellers'} from Claude's research` : ''}.</p>`,
    `<div class="actions"><button class="btn primary" data-act="places-share" data-key="${esc(key)}">${ico('share')}Share report</button><button class="btn" data-act="places-refresh" data-key="${esc(key)}" ${busy ? 'disabled' : ''}>${ico('refresh')}${busy ? 'Scanning…' : 'Rescan'}</button></div>`) + `
  <div class="tiles">${tile(r.total, 'Showrooms')}${tile(r.ind.length, 'Independent')}${tile(r.online.length, 'Online')}${tile(r.chains.length, 'Chains')}</div>
  ${fresh ? `<div class="banner plain">${ico('megaphone')}<p><b>${fresh} ${fresh === 1 ? 'shop' : 'shops'} in ${esc(doc.city)} saved and not contacted yet.</b> <button type="button" class="linkish" data-act="camp-city" data-country="${esc(doc.country)}" data-city="${esc(doc.city)}">Start the campaign</button></p></div>` : ''}
  ${busy ? `<div class="finding" role="status"><svg class="gemspin" viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5h14l6 7-13 15L3 12z"/><path d="M3 12h26M12.5 5 10 12l6 15 6-15-2.5-7M10 12l6-7 6 7"/></svg><p><b>${esc(S.find.step)}…</b></p><button type="button" class="btn small" data-act="find-stop">${ico('stop')}Stop</button></div>` : ''}
  ${researchPanel(key, r)}
  ${r.mapTotal ? `<section class="section map-section"><div class="mapbox" id="map-slot" data-key="${esc(key)}"></div>
    <div class="legend" aria-hidden="true"><span><i class="ind"></i>Not contacted</span><span><i class="camp"></i>In campaign</span><span><i class="mine"></i>Replied</span><span><i class="chain"></i>Chain</span></div>
    ${sel ? `<div class="list picked">${shopItem(sel, doc, key, true)}</div>` : '<p class="hint">Tap a dot to see the shop.</p>'}</section>` : emptyBox(`OpenStreetMap has no jewellery showrooms in ${esc(doc.city)}.${r.more ? ` The ${r.more} below were found by Claude.` : " Claude's research above can find them."}`, `<button class="btn" data-act="focus-open">${ico('pin')}Change city</button>`)}
  ${areas.length > 1 ? `<section class="section"><h2>Where they are</h2>${barRows(areas.map((a, i) => ({ name: a.label, share: a.n / amax, top: i === 0, val: `<b>${a.n}</b>` })))}<p class="hint">${placeText(doc.country) === placeText(UK) ? 'By postcode district, with the area most of them name.' : 'By area.'} The busiest streets make the best visit days.</p></section>` : ''}
  ${r.total || r.online.length ? `<section class="section"><div class="sec-head"><h2>The shops</h2>${seg('ptab', tab, [['ind', `Independent ${r.ind.length}`], ['online', `Online ${r.online.length}`], ['chain', `Chains ${r.chains.length}`]])}</div>
    ${tab === 'ind' && toAdd.length ? `<div class="bulk"><span>${toAdd.length} independent ${toAdd.length === 1 ? 'showroom isn\'t' : 'showrooms aren\'t'} saved to Leads yet.</span><button class="btn small primary" data-act="places-add-all" data-key="${esc(key)}">${ico('plus')}Save all ${toAdd.length}</button></div>` : ''}
    ${tab === 'online' && !r.online.length ? `<p class="hint">Claude's research looks for jewellers in ${esc(doc.city)} that sell online, straight to customers: their own website, Etsy, Not On The High Street or Instagram shops. They show here and are saved to Leads.</p>` : ''}
    ${tab === 'chain' && r.brands.length ? `<p class="hint">Chains buy through their head office, so independents are the better first call. ${esc(r.brands.slice(0, 8).map((b) => `${b.label} ${b.n}`).join(', '))}${r.brands.length > 8 ? ', and more' : ''}.</p>` : ''}
    <div class="filters"><input class="input search" id="pl-q" type="search" placeholder="Search name, street or postcode" value="${esc(pf.q)}" data-filter="places.q" aria-label="Search showrooms"></div>
    ${shown.length ? `<div class="list">${shown.map((x) => shopItem(x, doc, key)).join('')}</div>` : tab === 'online' && !q ? '' : emptyBox(q ? 'No showrooms match.' : 'None here.')}
    ${list.length > shown.length ? `<div><button class="btn" data-act="places-more">Show ${Math.min(SHOWN_STEP, list.length - shown.length)} more of ${list.length - shown.length}</button></div>` : ''}
  </section>` : ''}
  <p class="hint">Map data © OpenStreetMap contributors. Claude's research adds the showrooms OpenStreetMap is missing, and online sellers.${placeText(doc.country) === placeText(UK) ? ' Postcodes marked “nearby” are the closest postcode to the shop.' : ''}</p>`;
}
function shopItem(x, doc, key, picked) {
  const { s, b } = x; const site = safeUrl(s.website); const tel = String(s.phone || '').replace(/[^\d+]/g, '');
  const where = s.online ? '' : [s.street, s.postcode ? `${s.postcode}${s.near ? ' (nearby)' : ''}` : ''].filter(Boolean).join(', ') || s.area || s.town || '';
  const extra = `${picked || s.online || !onMap(s) ? '' : `<button type="button" class="btn small" data-act="places-show" data-id="${esc(s.id)}">${ico('pin')}Show on map</button>`}${s.online ? '' : `<a class="btn small" href="${esc(shopMapsUrl(s, doc))}" target="_blank" rel="noopener">${ico('route')}Directions</a>`}${tel ? `<a class="btn small" href="tel:${esc(tel)}">${ico('phone')}Call</a>` : ''}${site ? `<a class="btn small" href="${esc(site)}" target="_blank" rel="noopener">${ico('ext')}Website</a>` : ''}${igUrl(s.instagram) ? `<a class="btn small" href="${esc(igUrl(s.instagram))}" target="_blank" rel="noopener">${ico('camera')}Instagram</a>` : ''}${picked ? `<button type="button" class="btn small quiet" data-act="places-unsel">Close</button>` : ''}`;
  const tags = `${b ? stateChip(b) : ''}${s.online ? '<span class="chip accent">Sells online</span>' : ''}${s.extra ? '<span class="chip">Found by Claude</span>' : ''}${s.labGrown ? '<span class="chip good">Sells lab-grown</span>' : ''}${s.chain ? '<span class="chip">Chain</span>' : ''}${s.workshop ? '<span class="chip">Workshop</span>' : ''}${s.closed ? '<span class="chip warn">May have closed</span>' : ''}`;
  return `<div class="item${b ? ' tap corner' : ''}"><div class="stack">
    <div class="title-row">${b ? `<button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(s.name)}</button>` : `<b>${esc(s.name)}</b>`}</div>
    <div class="meta">${where ? `<span>${esc(where)}</span>` : ''}${s.phone ? `<span class="mono">${esc(s.phone)}</span>` : ''}${site ? `<span>${esc(cleanDomain(site))}</span>` : ''}${s.email ? `<span class="mono sel">${esc(s.email)}</span>` : ''}</div>
    ${s.person || s.legalForm ? `<div class="meta">${s.person ? `<span>${esc(s.person)}</span>` : ''}${s.legalForm ? `<span>${esc(LEGAL_LABEL[s.legalForm] || s.legalForm)}${s.companyNo ? `, no. ${esc(s.companyNo)}` : ''}</span>` : ''}</div>` : ''}
    ${s.note ? `<div class="sub">${esc(s.note)}</div>` : ''}
    <div class="tags">${tags}</div>
  </div><div class="actions">${b ? '' : `<button class="btn small primary" data-act="places-add" data-key="${esc(key)}" data-id="${esc(s.id)}">${ico('plus')}Add</button>`}${moreMenu('shop:' + s.id + (picked ? ':p' : ''), extra)}</div></div>`;
}
function focusModal() {
  const f = focusNow(); const country = fv('fc.country', f.country);
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="fc-title">
    <div class="layer-head"><div><h2 id="fc-title">Where are you working?</h2><p class="hint" style="margin:6px 0 0">Every screen, and Claude's daily checks, keep to the place you choose. Replies from anywhere still come in.</p></div>${closeBtn()}</div>
    <div class="field"><label for="fc-country">Country</label>${selectHtml('fc-country', 'data-k="fc.country" data-live="1"', focusCountries().map((x) => [x, x]), country, 'Everywhere')}</div>
    ${country ? `<div class="field"><span class="lab">City</span>${cityButtons(country, true)}</div>` : `<div class="actions"><button type="button" class="btn primary" data-act="work-on" data-country="" data-city="">Work everywhere</button></div>`}
  </div>`;
}

/* ---------- Buyers ---------- */
function buyerList() {
  const f = S.filters.buyers; const q = f.q.trim().toLowerCase();
  let list = focusBiz();
  if (q) list = list.filter((b) => [b.name, b.city, b.country, contactOf(b).email, contactOf(b).person].join(' ').toLowerCase().includes(q));
  if (f.country) list = list.filter((b) => b.country === f.country);
  if (f.city) list = list.filter((b) => b.city === f.city);
  if (f.type) list = list.filter((b) => b.type === f.type);
  if (f.status) list = list.filter((b) => b.status === f.status);
  if (f.lab === 'yes') list = list.filter((b) => b.labGrown);
  return list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}
function buyersView() {
  const f = S.filters.buyers; const list = buyerList();
  const shown = list.slice(0, S.ui.buyersShown);
  const fo = focusNow(); const mine = focusBiz();
  const countries = [...new Set(mine.map((b) => b.country).filter(Boolean))].sort();
  const cities = [...new Set(mine.filter((b) => !f.country || b.country === f.country).map((b) => b.city).filter(Boolean))].sort();
  return `<header class="head"><div><h1>Buyers</h1><p>Every jeweller, chain and lab-grown buyer ${fo.country ? `in ${esc(focusName(fo))}` : 'on your list'}.</p></div><div class="actions"><button class="btn" data-act="buyers-export">${ico('download')}Export CSV</button></div></header>
  <div class="filters">
    <input class="input search" id="f-q" type="search" placeholder="Search name, city, email" value="${esc(f.q)}" data-filter="buyers.q" aria-label="Search buyers">
    ${fo.country ? '' : selectHtml('f-country', 'data-filter="buyers.country" aria-label="Country"', countries.map((x) => [x, x]), f.country, 'All countries')}
    ${fo.city ? '' : selectHtml('f-city', 'data-filter="buyers.city" aria-label="City"', cities.map((x) => [x, x]), f.city, 'All cities')}
    ${selectHtml('f-type', 'data-filter="buyers.type" aria-label="Buyer type"', BUYER_TYPES, f.type, 'All types')}
    ${selectHtml('f-status', 'data-filter="buyers.status" aria-label="Status"', Object.entries(STATUS_LABEL), f.status, 'Any status')}
    ${selectHtml('f-lab', 'data-filter="buyers.lab" aria-label="Lab-grown stock"', [['yes', 'Sells lab-grown']], f.lab, 'Any stock')}
  </div>
  ${shown.length ? `<div class="table-wrap"><table><thead><tr><th>Buyer</th><th>City</th><th>Can reach by</th><th>Fit</th><th>Status</th><th>Next step</th></tr></thead><tbody>
    ${shown.map((b) => `<tr class="click" data-act="open-biz" data-id="${esc(b.id)}"><td><button type="button" class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button> ${exChip(b)}<div class="sub">${esc(TYPE_LABEL[b.type] || '')}${labChip(b)}</div></td><td>${esc(b.city)}<div class="sub">${esc(b.country)}</div></td><td>${reachIcons(b)}</td><td>${meter(fitScore(b))}</td><td>${statusChip(b)}</td><td class="sub">${esc(nextLabel(b))}</td></tr>`).join('')}
  </tbody></table></div>${list.length > shown.length ? `<div><button class="btn" data-act="more-buyers">Show ${Math.min(100, list.length - shown.length)} more of ${list.length - shown.length}</button></div>` : ''}`
  : emptyBox(mine.length ? 'No buyers match these filters.' : `No buyers in ${esc(focusName(fo))} yet. Find the showrooms there and add them.`, mine.length ? '' : `<a class="btn primary" href="#showrooms">${ico('store')}Showrooms</a>`)}`;
}

/* ---------- Leads ---------- */
function leadsView() {
  const fl = S.filters.leads; const leads = allBiz().filter((b) => b.lead); const needs = leads.filter(needsReply);
  // opening Leads shows replies if any are waiting, otherwise every shop; the choice then stays while you work here
  const view = ['replies', 'shops'].includes(fl.view) ? fl.view : (fl.view = needs.length ? 'replies' : 'shops');
  return `<header class="head"><div><h1>Leads</h1></div><div class="actions"><button class="btn primary" data-act="log-reply">${ico('chat')}Log a reply</button><button class="btn" data-act="meeting-new">${ico('calendar')}Book a meeting</button></div></header>
  ${seg('leadsview', view, [['replies', `Replies ${leads.length}`], ['shops', `All shops ${allBiz().length}`]])}
  ${view === 'replies' ? repliesPart(leads, needs) : shopsPart()}`;
}
// The last answer you or your team sent, and who sent it.
function lastOut(b) { const m = (b.messages || []).filter((x) => x.dir === 'out').slice(-1)[0]; return m || null; }
function repliesPart(leads, needs) {
  const f = S.filters.leads;
  const snoozed = leads.filter((b) => b.lead.awaitingReply && !needsReply(b));
  const answered = leads.filter((b) => !b.lead.awaitingReply && lastOut(b));
  const tab = ['needs', 'answered', 'snoozed', 'all'].includes(f.tab) ? f.tab : 'needs';
  let list = tab === 'needs' ? needs : tab === 'answered' ? answered : tab === 'snoozed' ? snoozed : leads;
  if (tab === 'all' && f.stage) list = list.filter((b) => b.lead.stage === f.stage);
  const at = (b, k) => String(b.lead[k] || '');
  list = list.slice().sort((a, b) => tab === 'answered' ? at(b, 'lastOutAt').localeCompare(at(a, 'lastOutAt')) : tab === 'all' ? at(b, 'lastInAt').localeCompare(at(a, 'lastInAt')) : at(a, 'lastInAt').localeCompare(at(b, 'lastInAt')));
  const stageCounts = STAGES.map(([k, label]) => [k, label, leads.filter((b) => b.lead.stage === k).length]);
  const openQuotes = [...S.quotes.values()].filter((q) => q.status === 'sent' && S.businesses.get(q.businessId));
  const pipeline = openQuotes.reduce((a, q) => a + quoteUsd(q), 0);
  const samplesOut = [...S.samples.values()].filter((x) => ['sent', 'delivered', 'kept'].includes(x.status) && S.businesses.get(x.businessId)).length;
  return `<div class="tiles tight">${stageCounts.map(([k, label, n]) => `<button type="button" class="tile" data-act="lead-stage" data-val="${k}"><span class="n">${n}</span><span class="l">${label}</span></button>`).join('')}</div>
  ${openQuotes.length || samplesOut ? `<p class="muted" style="margin:0">${openQuotes.length ? `<b>${openQuotes.length}</b> open ${openQuotes.length === 1 ? 'quote' : 'quotes'}${pipeline ? ` worth <b>${money(pipeline)}</b>` : ''}` : ''}${openQuotes.length && samplesOut ? ' · ' : ''}${samplesOut ? `<b>${samplesOut}</b> sample ${samplesOut === 1 ? 'parcel' : 'parcels'} out` : ''}</p>` : ''}
  <div class="sec-head">${seg('leads', tab, [['needs', `Needs reply (${needs.length})`], ['answered', `Answered (${answered.length})`], ['snoozed', `Snoozed (${snoozed.length})`], ['all', `All (${leads.length})`]])}
    ${tab === 'all' ? selectHtml('f-stage', 'data-filter="leads.stage" aria-label="Stage"', STAGES, f.stage, 'Every stage') : ''}</div>
  ${list.length ? `<div class="list">${list.map(leadItem).join('')}</div>` : emptyBox(tab === 'needs' ? 'Every reply has an answer. New replies from any city show up here.' : tab === 'answered' ? 'Nothing answered yet. Replies you or your team answer show here, with who answered.' : leads.length ? 'No leads in this group.' : 'No leads yet. When a shop replies by email, WhatsApp or Instagram, it shows here.')}`;
}
// Every saved shop, by country and then city, with where it stands. Tick a country, a city or single shops,
// then Start campaign.
function placeIds(kind, country, city) { return allBiz().filter((b) => startable(b) && (b.country || '') === country && (kind === 'country' || (b.city || '') === city)).map((b) => b.id); }
function pickBox(ids, attrs, label) {
  if (!ids.length) return '<span class="pick-gap" aria-hidden="true"></span>';
  const n = ids.filter((id) => S.selection.has(id)).length;
  return `<input type="checkbox" class="pick" ${attrs} aria-label="${esc(label)}" ${n === ids.length ? 'checked' : ''} ${n && n < ids.length ? 'data-mixed="1"' : ''}>`;
}
function shopsPart() {
  const f = S.filters.leads; const q = f.q.trim().toLowerCase(); const all = allBiz();
  const want = SHOP_STATES.some(([k]) => k === f.shops) ? f.shops : 'all';
  const count = (k) => all.filter((b) => shopState(b) === k).length;
  const list = all.filter((b) => (want === 'all' || shopState(b) === want) && (!q || [b.name, b.city, b.country, contactOf(b).email, contactOf(b).person].join(' ').toLowerCase().includes(q)));
  const tree = new Map();
  for (const b of list) { const c = b.country || 'No country'; const city = b.city || 'No city'; if (!tree.has(c)) tree.set(c, new Map()); const m = tree.get(c); if (!m.has(city)) m.set(city, []); m.get(city).push(b); }
  const size = (m) => [...m.values()].reduce((a, x) => a + x.length, 0);
  const countries = [...tree.entries()].sort((a, b) => size(b[1]) - size(a[1]) || a[0].localeCompare(b[0]));
  const n = S.selection.size;
  return `<div class="filters"><input class="input search" id="sh-q" type="search" placeholder="Search shop, city or email" value="${esc(f.q)}" data-filter="leads.q" aria-label="Search saved shops"></div>
  ${seg('shopstate', want, [['all', `All ${all.length}`], ['new', `Not contacted ${count('new')}`], ['campaign', `In campaign ${count('campaign')}`], ['replied', `Replied ${count('replied')}`], ['noreply', `No reply ${count('noreply')}`]])}
  ${countries.length ? countries.map(([country, cities]) => countryBlock(country, cities, !!q)).join('') : emptyBox(all.length ? 'No saved shops match.' : 'No shops saved yet. Choose a city in Showrooms: its showrooms are saved here by themselves.', all.length ? '' : `<a class="btn primary" href="#showrooms">${ico('store')}Showrooms</a>`)}
  ${n ? `<div class="selbar" role="region" aria-label="Selected shops"><span><b>${n}</b> ${n === 1 ? 'shop' : 'shops'} selected</span><button type="button" class="btn quiet" data-act="sel-clear">Clear</button><button type="button" class="btn primary" data-act="camp-start">${ico('megaphone')}Start campaign</button></div><div class="selbar-space" aria-hidden="true"></div>` : ''}`;
}
function countryBlock(country, cities, open) {
  const total = [...cities.values()].reduce((a, x) => a + x.length, 0);
  const rows = [...cities.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return `<section class="place-group"><div class="pg-head">${pickBox(placeIds('country', country), `data-selplace="country" data-country="${esc(country)}"`, `Select every shop not contacted yet in ${country}`)}<h2>${esc(country)} <span class="count">${total}</span></h2></div>
    <div class="list">${rows.map(([city, list]) => cityBlock(country, city, list, open)).join('')}</div></section>`;
}
function cityBlock(country, city, list, forceOpen) {
  const key = `${country}|${city}`; const open = forceOpen || S.ui.openPlaces.has(key);
  const by = (k) => list.filter((b) => shopState(b) === k).length;
  const parts = [['new', 'not contacted'], ['campaign', 'in campaign'], ['replied', 'replied'], ['noreply', 'no reply']].map(([k, l]) => [by(k), l]).filter(([v]) => v);
  const shown = S.ui.placeShown[key] || 40;
  const sorted = list.slice().sort((a, b) => (startable(b) - startable(a)) || fitScore(b) - fitScore(a) || a.name.localeCompare(b.name));
  return `<div class="item place-row"><div class="place-top">${pickBox(placeIds('city', country, city), `data-selplace="city" data-country="${esc(country)}" data-city="${esc(city)}"`, `Select every shop not contacted yet in ${city}`)}
      <button type="button" class="place-open" data-act="place-toggle" data-key="${esc(key)}" aria-expanded="${open}"><span class="stack"><b>${esc(city)}</b><span class="meta"><span>${list.length} ${list.length === 1 ? 'shop' : 'shops'}</span>${parts.map(([v, l]) => `<span>${v} ${l}</span>`).join('')}</span></span>${ico('chev')}</button></div>
    ${open ? `<div class="place-shops">${sorted.slice(0, shown).map(shopRow).join('')}${sorted.length > shown ? `<div class="shop-more"><button type="button" class="btn small" data-act="place-more" data-key="${esc(key)}">Show ${Math.min(100, sorted.length - shown)} more of ${sorted.length - shown}</button></div>` : ''}</div>` : ''}</div>`;
}
function shopRow(b) {
  const c = contactOf(b); const where = areaOf(b) || '';
  const reach = [c.email ? 'email' : '', c.phone || c.whatsapp ? 'phone' : '', c.instagram ? 'Instagram' : ''].filter(Boolean);
  return `<div class="shop-row">${startable(b) ? `<input type="checkbox" class="pick" data-sel="${esc(b.id)}" aria-label="Select ${esc(b.name)}" ${S.selection.has(b.id) ? 'checked' : ''}>` : '<span class="pick-gap" aria-hidden="true"></span>'}
    <div class="stack"><button type="button" class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button><div class="meta">${where ? `<span>${esc(where)}</span>` : ''}<span>${reach.length ? esc(listAnd(reach)) : 'no contact details yet'}</span></div></div>${stateChip(b)}</div>`;
}
function leadItem(b) {
  const l = b.lead; const last = (b.messages || []).slice(-1)[0];
  const waiting = l.awaitingReply; const h = l.lastInAt ? hoursSince(l.lastInAt) : 0;
  return `<div class="item tap"><div class="stack">
    <div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button></div>
    <div class="meta">${chLabel(l.lastChannel)}<span>${esc([b.city, b.country].filter(Boolean).join(', '))}</span>${l.followUpAt ? `<span>Follow up ${esc(fmtDay(l.followUpAt))}</span>` : ''}${waiting && needsReply(b) ? `<span>${esc(reminderText(l))}</span>` : ''}</div>
    ${last ? `<div class="msg ${last.dir === 'in' ? 'quote' : ''}">${last.dir === 'out' ? 'You: ' : ''}${esc(trunc(last.text, 220))}</div>` : ''}
    <div class="tags">${stageChip(l.stage)}${!waiting && lastOut(b) ? `<span class="chip good">${ico('check')}Answered${lastOut(b).by ? ` by ${esc(lastOut(b).by)}` : ''} · ${esc(fmtWhen(lastOut(b).at))}</span>` : ''}${waiting ? `<span class="chip ${needsReply(b) ? (h < 2 ? 'accent' : h < 12 ? 'warn' : 'bad') : ''}">${ico('clock')}${needsReply(b) ? `waiting ${fmtWait(h)}` : `snoozed until ${esc(fmtWhen(l.remindAt))}`}</span>` : ''}${waiting ? windowChip(l.lastInAt, l.lastChannel) : ''}${l.ordersValue ? `<span class="chip gold">${money(l.ordersValue)} ordered</span>` : ''}${exChip(b)}</div>
  </div>${waiting ? `<div class="actions">
    <button class="btn small primary" data-act="open-biz" data-id="${esc(b.id)}">Reply</button>
    ${moreMenu('l:' + b.id, `<button class="btn small" data-act="answered" data-id="${esc(b.id)}">${ico('check')}Mark answered</button>`)}
  </div>` : `<span class="go" aria-hidden="true">${ico('next')}</span>`}</div>`;
}

/* ---------- Reports ---------- */
function reportList() {
  const f = S.filters.reports; let list = focusBiz();
  if (f.country) list = list.filter((b) => b.country === f.country);
  if (f.city) list = list.filter((b) => b.city === f.city);
  if (f.period !== 'all') { const since = addDays(todayStr(), -Number(f.period)); list = list.filter((b) => String(b.seqStart || b.createdAt || '').slice(0, 10) >= since); }
  return list;
}
function barRows(rows) {
  // rows: [{ name, share (0..1 of the longest bar), val (html), title, top }]
  return `<div class="bars">${rows.map((r) => `<div class="bar ${r.top ? 'top' : ''}" title="${esc(r.title || r.name)}"><span class="name">${esc(r.name)}</span><span class="trk"><span class="fill" style="display:block;width:${(Math.max(0, Math.min(1, r.share)) * 100).toFixed(1)}%"></span></span><span class="val">${r.val}</span></div>`).join('')}</div>`;
}
function funnelHtml(t) {
  const steps = [['Found', t.found], ['Approved', t.approved], ['Contacted', t.contacted], ['Replied', t.replied], ['Interested', t.interested], ['Ordered', t.orders]];
  return `<div class="funnel">${barRows(steps.map(([name, n]) => ({ name, share: t.found ? n / t.found : 0, val: `<b>${n}</b>${t.found ? ` · ${Math.round(n / t.found * 100)}%` : ''}` })))}</div>`;
}
function channelBars(list) {
  const counts = {};
  for (const b of list) { const first = inbound(b).sort((x, y) => String(x.at).localeCompare(String(y.at)))[0]; if (first) counts[first.channel] = (counts[first.channel] || 0) + 1; }
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...rows.map((r) => r[1]));
  if (!rows.length) return '<p class="cap">Appears after the first reply.</p>';
  return barRows(rows.map(([ch, n], i) => ({ name: CH_LABEL[ch] || ch, share: n / max, top: i === 0, val: `<b>${n}</b> ${n === 1 ? 'buyer' : 'buyers'}` }))) + '<p class="cap">The channel each buyer first answered on.</p>';
}
function typeBars(list) {
  const m = new Map();
  for (const b of list) { if (!contacted(b)) continue; const k = b.type || 'independent'; const r = m.get(k) || { k, contacted: 0, replied: 0 }; r.contacted++; if (inbound(b).length) r.replied++; m.set(k, r); }
  const rows = [...m.values()].map((r) => ({ ...r, rate: r.replied / r.contacted })).sort((a, b) => b.rate - a.rate || b.contacted - a.contacted);
  if (!rows.length) return '<p class="cap">Appears once buyers have been contacted.</p>';
  const max = Math.max(0.0001, ...rows.map((r) => r.rate));
  return barRows(rows.map((r, i) => ({ name: TYPE_LABEL[r.k] || r.k, share: r.rate / max, top: i === 0 && r.rate > 0, val: `<b>${pct(r.rate)}</b> · ${r.replied} of ${r.contacted}`, title: `${TYPE_LABEL[r.k] || r.k}: ${r.replied} of ${r.contacted} replied` }))) + '<p class="cap">Which kinds of buyer answer most. Target more of the top ones.</p>';
}
function stepBars(list) {
  const m = new Map();
  for (const b of list) {
    const a = b.lead && b.lead.afterStep; if (!a) continue;
    const k = `${a.kind}:${a.id}`; const r = m.get(k) || { name: `${SEQ_SHORT[a.kind] || ''}Day ${a.day == null ? '?' : a.day} · ${a.title}`, n: 0 }; r.n++; m.set(k, r);
  }
  const rows = [...m.values()].sort((a, b) => b.n - a.n).slice(0, 8); const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return '<p class="cap">Appears after a buyer replies to a sequence step.</p>';
  return barRows(rows.map((r, i) => ({ name: r.name, share: r.n / max, top: i === 0, val: `<b>${r.n}</b> ${r.n === 1 ? 'reply' : 'replies'}` }))) + '<p class="cap">The last step sent before each first reply. Put your effort into the steps at the top.</p>';
}
function abRows(list) {
  const out = [];
  for (const step of allSteps().filter((x) => x.channel === 'email')) {
    const v = { A: { sent: 0, replied: 0 }, B: { sent: 0, replied: 0 } };
    for (const b of list) {
      for (const d of [b.done, ...(b.rounds || []).map((r) => r.done)]) {
        const x = d && d[step.id]; if (!x || x.how !== 'sent' || !x.variant || !v[x.variant]) continue;
        v[x.variant].sent++; if (inbound(b).some((m) => String(m.at) > String(x.at))) v[x.variant].replied++;
      }
    }
    if (v.A.sent + v.B.sent) out.push({ step, v });
  }
  return out;
}
function abTable(list) {
  const rows = abRows(list);
  if (!rows.length) return '<p class="hint">Add a second subject line to any email step on the Messages page. The app gives half the buyers each one and shows here which gets more replies.</p>';
  const cell = (x) => `<td class="num">${x.sent}</td><td class="num">${x.replied}</td><td class="num"><b>${x.sent ? pct(x.replied / x.sent) : '—'}</b></td>`;
  return `<div class="table-wrap"><table><thead><tr><th>Email</th><th>Subject A</th><th class="num">Sent</th><th class="num">Replies</th><th class="num">Rate</th><th>Subject B</th><th class="num">Sent</th><th class="num">Replies</th><th class="num">Rate</th></tr></thead><tbody>
    ${rows.map(({ step, v }) => `<tr><td>${esc(step.title)}</td><td class="sub">${esc(trunc(step.subject, 48))}</td>${cell(v.A)}<td class="sub">${esc(trunc(step.subjectB || '', 48))}</td>${cell(v.B)}</tr>`).join('')}
  </tbody></table></div><p class="hint">Small numbers swing a lot. Wait for about 50 sends of each before you pick a winner.</p>`;
}
function reportsView() {
  const f = S.filters.reports; const list = reportList(); const fo = focusNow(); const mine = focusBiz();
  const byCity = computeReport(list, 'city'); const byCountry = computeReport(list, 'country'); const t = totalsOf(byCountry);
  const countries = [...new Set(mine.map((b) => b.country).filter(Boolean))].sort();
  const cities = [...new Set(mine.filter((b) => !f.country || b.country === f.country).map((b) => b.city).filter(Boolean))].sort();
  const rated = byCity.filter((r) => r.contacted > 0).sort((a, b) => (b.rate || 0) - (a.rate || 0) || b.contacted - a.contacted).slice(0, 12);
  const maxRate = Math.max(0.0001, ...rated.map((r) => r.rate || 0));
  const scope = f.city || f.country || fo.city || fo.country || '';
  const pipeline = [...S.quotes.values()].filter((q) => q.status === 'sent' && list.some((b) => b.id === q.businessId)).reduce((a, q) => a + quoteUsd(q), 0);
  const tableRows = (rows, by) => rows.map((r) => `<tr><td>${by === 'city' ? `${esc(r.city)}<div class="sub">${esc(r.country)}</div>` : esc(r.country)}</td><td class="num">${r.found}</td><td class="num">${r.contacted}</td><td class="num">${r.replied}</td><td class="num">${pct(r.rate)}</td><td class="num">${r.interested}</td><td class="num">${r.samples}</td><td class="num">${r.orders}</td><td class="num">${r.revenue ? money(r.revenue) : '—'}</td><td class="num">${r.avgHours == null ? '—' : fmtWait(r.avgHours)}</td></tr>`).join('');
  const head = (first) => `<thead><tr><th>${first}</th><th class="num">Found</th><th class="num">Contacted</th><th class="num">Replied</th><th class="num">Reply rate</th><th class="num">Interested</th><th class="num">Samples</th><th class="num">Orders</th><th class="num">Revenue</th><th class="num">Your reply time</th></tr></thead>`;
  return `<header class="head"><div><h1>Reports</h1><p>Results by city and country, from first contact to orders.</p></div>
    <div class="actions"><button class="btn" data-act="export" data-by="city">${ico('download')}Cities CSV</button><button class="btn" data-act="export" data-by="country">${ico('download')}Countries CSV</button></div></header>
  <div class="filters">${fo.country ? '' : selectHtml('r-country', 'data-filter="reports.country" aria-label="Country"', countries.map((x) => [x, x]), f.country, 'All countries')}
    ${fo.city ? '' : selectHtml('r-city', 'data-filter="reports.city" aria-label="City"', cities.map((x) => [x, x]), f.city, 'All cities')}
    ${seg('period', f.period, [['all', 'All time'], ['90', 'Last 90 days'], ['30', 'Last 30 days']])}</div>
  <div class="tiles wide">${tile(t.found, 'Buyers found')}${tile(t.contacted, 'Contacted')}${tile(pct(t.rate), 'Reply rate')}${tile(t.orders, 'Orders')}${tile(money(t.revenue), 'Revenue, US$', 'money')}${tile(money(pipeline), 'Open quotes, US$')}</div>
  ${aiAvailable() ? `<div class="panel"><div class="sec-head"><h3>Claude's advice</h3>${S.ai.busy === 'advice' ? `<button class="btn small" data-act="ai-stop">${ico('stop')}Stop</button>` : `<button class="btn small" data-act="advice-run">${ico('spark')}${S.ai.advice ? 'Ask again' : 'What should I do next?'}</button>`}</div><p id="advice-text" class="advice-text">${S.ai.advice ? esc(S.ai.advice) : S.ai.busy === 'advice' ? 'Claude is reading your numbers…' : 'Claude reads these results, the coming seasons and fairs, and suggests what to do in the next two weeks.'}</p></div>` : ''}
  ${list.length ? `
  <div class="charts">
    <div class="chart"><h3>From found to ordered</h3>${funnelHtml(t)}<p class="cap">Share of all buyers found${scope ? ` in ${esc(scope)}` : ''}.</p></div>
    <div class="chart"><h3>Reply rate by city</h3>${rated.length ? barRows(rated.map((r, i) => ({ name: r.city, share: (r.rate || 0) / maxRate, top: i === 0, val: `<b>${pct(r.rate)}</b> · ${r.replied} of ${r.contacted}`, title: `${r.city}: ${r.replied} of ${r.contacted} replied` }))) + '<p class="cap">Replies on any channel divided by buyers contacted. The top city is highlighted.</p>' : '<p class="cap">Appears once buyers in a city have been contacted.</p>'}</div>
    <div class="chart"><h3>Where replies came from</h3>${channelBars(list)}</div>
    <div class="chart"><h3>Reply rate by buyer type</h3>${typeBars(list)}</div>
    <div class="chart"><h3>Which message got the reply</h3>${stepBars(list)}</div>
  </div>
  <section class="section"><h2>Subject line tests</h2>${abTable(list)}</section>
  <section class="section"><h2>By country</h2><div class="table-wrap"><table>${head('Country')}<tbody>${tableRows(byCountry, 'country')}</tbody></table></div></section>
  <section class="section"><h2>By city</h2><div class="table-wrap"><table>${head('City')}<tbody>${tableRows(byCity, 'city')}</tbody></table></div></section>`
  : emptyBox(mine.length ? 'No buyers match these filters.' : 'Reports fill in as you find, contact and hear back from buyers.', mine.length ? '' : `<a class="btn primary" href="#showrooms">${ico('store')}Find showrooms</a>`)}`;
}

/* ---------- Sequence ---------- */
function highlight(text) { return esc(text).replace(/\{\{(\w+)\}\}/g, '<span class="ph">{{$1}}</span>'); }
function ruler(seq) {
  const max = Math.max(10, ...seq.map((s) => Number(s.day) || 0));
  const ticks = Array.from({ length: max + 1 }, (_, d) => `<span class="tick" style="left:${(d / max * 100).toFixed(2)}%"><i></i><b>${d}</b></span>`).join('');
  const marks = seq.slice().sort((a, b) => (a.day || 0) - (b.day || 0)).map((s, i) => `<span class="mark ${s.by === 'you' ? 'you' : 'app'} r${i % 2}" style="left:${((Number(s.day) || 0) / max * 100).toFixed(2)}%"><span class="pin">${chIco(s.channel)}</span>${esc(CH_LABEL[s.channel] || s.channel)}</span>`).join('');
  return `<div class="ruler-wrap" role="img" aria-label="Sequence timeline from day 0 to day ${max}"><div class="ruler"><div class="track"></div>${ticks}${marks}</div><div class="legend"><span><i class="app"></i>App sends</span><span><i class="you"></i>You send, the app drafts and reminds</span><span>Days after the first email</span></div></div>`;
}
function sequenceView() {
  const st = settings(); const kind = S.seqTab; const editing = !!S.seqDraft; const seq = editing ? S.seqDraft : stepsFor(kind, st);
  const langs = Object.keys(st.translations || {}); const r = st.rules;
  const rule = (k, label, min) => `<div class="field"><label for="ru-${k}">${label}</label><input class="input" type="number" min="${min}" max="365" id="ru-${k}" data-k="ru.${k}" value="${esc(fv('ru.' + k, r[k]))}"></div>`;
  return `<header class="head"><div><h1>Messages</h1><p>Your follow-up sequences, the rules that bring buyers back, and ready answers for common questions.</p></div>
    <div class="actions">${editing ? `<button class="btn quiet" data-act="seq-cancel">Cancel</button><button class="btn" data-act="seq-add">${ico('plus')}Add step</button><button class="btn primary" data-act="seq-save">${ico('check')}Save sequence</button>` : `<button class="btn" data-act="seq-edit">Edit messages</button>`}</div></header>
  <div class="sec-head">${seg('seqtab', kind, SEQ_KINDS)}</div>
  <p class="hint" style="margin-top:-14px">${esc(SEQ_INTRO[kind])}</p>
  ${ruler(seq)}
  <div class="banner plain">${ico('alert')}<p><b>Channel rules.</b> WhatsApp messages go only to buyers who opted in; others get a call task. Instagram, Facebook and LinkedIn ban automated cold messages, so those steps are drafted for you to send. Every email carries a "reply stop" line, and a missing opt-in or an unsubscribe stops all channels.</p></div>
  <div class="list">${seq.map((x, i) => editing ? stepEdit(x, i) : stepRead(x)).join('')}</div>
  ${editing ? `<div class="actions">${confirmBtn('seq-reset', 'Reset to the default sequence', 'Click again to reset', 'seq-reset')}</div>` : ''}
  <section class="section"><h2>Automatic follow-ups</h2>
    <p class="hint">The app puts these on your Today list when they're due.</p>
    <div class="panel"><div class="grid2">
      ${rule('notNowDays', 'Follow up after a "not now" reply, in days', 7)}
      ${rule('reorderDays', 'Reorder check-in after an order, in days', 7)}
      ${rule('retryAfterDays', 'Second try for buyers who never answered, in days', 30)}
      ${rule('sampleCheckDays', 'Check in after sending samples, in days', 1)}
    </div><div class="actions"><button class="btn primary" data-act="rules-save">${ico('check')}Save rules</button></div></div>
  </section>
  <section class="section"><div class="sec-head"><h2>Ready answers <span class="count">${st.answers.length}</span></h2><button class="btn small" data-act="ans-add">${ico('plus')}Add an answer</button></div>
    <p class="hint">Insert these into a reply in one tap. Fill the parts in [brackets] with your own terms once, and they're ready for every buyer.</p>
    ${st.answers.length ? `<div class="list">${st.answers.map(answerRow).join('')}</div>` : emptyBox('No ready answers yet.')}
  </section>
  <section class="section"><div class="sec-head"><h2>Translations</h2></div>
    <p class="hint">Each campaign sends in its own language. Translate all three sequences once per language, check them, and save.</p>
    <div class="filters">${selectHtml('tr-lang', 'data-k="tr.lang" aria-label="Language"', LANGS.filter((l) => l !== 'English').map((l) => [l, l]), fv('tr.lang', 'German'))}
      ${aiAvailable() ? `<button class="btn" data-act="tr-run" ${S.ai.busy === 'tr' ? 'disabled' : ''}>${ico('spark')}${S.ai.busy === 'tr' ? 'Claude is translating…' : 'Translate with Claude'}</button>` : (onPhone() ? '<span class="hint">Translation needs Claude. Ask Claude in chat, then paste the translation here.</span>' : '<span class="hint">Translation with Claude works when this page runs inside Claude.</span>')}
      ${langs.length ? `<span class="hint">Saved: ${langs.map((l) => `${esc(l)} <button class="btn small quiet" data-act="tr-delete" data-val="${esc(l)}">Remove</button>`).join(' ')}</span>` : ''}</div>
    ${S.trDraft ? trDraftHtml() : ''}
  </section>`;
}
function answerRow(a) {
  if (S.ansEdit === a.id) {
    return `<div class="item"><div class="stack" style="gap:8px"><div class="field"><label for="ans-t-${esc(a.id)}">Title</label><input class="input" id="ans-t-${esc(a.id)}" data-k="ans.title.${esc(a.id)}" value="${esc(fv('ans.title.' + a.id, a.title))}"></div>
      <div class="field"><label for="ans-x-${esc(a.id)}">Answer</label><textarea class="input" id="ans-x-${esc(a.id)}" data-k="ans.text.${esc(a.id)}" style="min-height:90px">${esc(fv('ans.text.' + a.id, a.text))}</textarea></div></div>
      <div class="actions"><button class="btn small quiet" data-act="ans-cancel">Cancel</button><button class="btn small primary" data-act="ans-save" data-id="${esc(a.id)}">${ico('check')}Save</button></div></div>`;
  }
  const issues = complianceIssues(a.text, '');
  return `<div class="item"><div class="stack"><b>${esc(a.title)}</b><div class="msg" style="max-height:none">${highlight(a.text)}</div>${issues.length ? `<div class="warnline">${ico('alert')}${esc(issues.join(' · '))}</div>` : ''}</div>
    <div class="actions"><button class="btn small" data-act="ans-edit" data-id="${esc(a.id)}">Edit</button>${confirmBtn('ans:' + a.id, 'Delete', 'Click again to delete', 'ans-delete', `data-id="${esc(a.id)}"`)}</div></div>`;
}
function stepRead(s) {
  const issues = complianceIssues(`${s.subject || ''}\n${s.subjectB || ''}\n${s.body || ''}`, '');
  return `<div class="stepcard"><div class="when">Day ${esc(s.day)}<small>${chLabel(s.channel)}</small><small>${s.by === 'you' ? 'You send' : 'App sends'}</small></div>
    <div class="stack"><b>${esc(s.title)}</b>${s.subject ? `<div class="subj">${highlight(s.subject)}</div>` : ''}${hasVariantB(s) ? `<div class="sub"><b>Testing against:</b> ${highlight(s.subjectB)}</div>` : ''}<div class="body">${highlight(s.body)}</div>${s.alt ? `<div class="sub"><b>No opt-in:</b> ${highlight(s.alt)}</div>` : ''}${issues.length ? `<div class="warnline">${ico('alert')}${esc(issues.join(' · '))}</div>` : ''}</div></div>`;
}
function stepEdit(s, i) {
  const issues = complianceIssues(`${s.subject || ''}\n${s.body || ''}`, '');
  return `<div class="stepcard"><div class="stack"><div class="field"><label for="sq-${i}-day">Day</label><input class="input" id="sq-${i}-day" type="number" min="0" max="60" value="${esc(s.day)}" data-seq="${i}.day"></div>
      <div class="field"><label for="sq-${i}-ch">Channel</label>${selectHtml(`sq-${i}-ch`, `data-seq="${i}.channel"`, Object.entries(CH_LABEL).filter(([k]) => k !== 'phone'), s.channel)}</div>
      <button class="btn small quiet danger" data-act="seq-remove" data-val="${i}">Remove step</button></div>
    <div class="stack"><div class="field"><label for="sq-${i}-title">Step name</label><input class="input" id="sq-${i}-title" value="${esc(s.title)}" data-seq="${i}.title"></div>
      ${s.channel === 'email' ? `<div class="field"><label for="sq-${i}-subject">Subject</label><input class="input" id="sq-${i}-subject" value="${esc(s.subject || '')}" data-seq="${i}.subject"></div><div class="field"><label for="sq-${i}-subjectB">Second subject to test (optional)</label><input class="input" id="sq-${i}-subjectB" value="${esc(s.subjectB || '')}" data-seq="${i}.subjectB" placeholder="Half the buyers get this one"></div>` : ''}
      <div class="field"><label for="sq-${i}-body">Message</label><textarea class="input" id="sq-${i}-body" data-seq="${i}.body">${esc(s.body || '')}</textarea></div>
      ${s.channel === 'whatsapp' ? `<div class="field"><label for="sq-${i}-alt">Call script when they haven't opted in</label><textarea class="input" id="sq-${i}-alt" style="min-height:70px" data-seq="${i}.alt">${esc(s.alt || '')}</textarea></div>` : ''}
      <p class="hint">Placeholders: {{business}} {{contact}} {{city}} {{country}} {{sender}} {{company}} {{products}} {{catalogue_link}} {{price_list_link}} {{whatsapp_link}} {{gold_karats}}${S.seqTab === 'fair' ? ' {{fair}} {{fair_dates}} {{booth}}' : ''}</p>
      ${issues.length ? `<div class="warnline">${ico('alert')}${esc(issues.join(' · '))}</div>` : ''}</div></div>`;
}
function trDraftHtml() {
  const d = S.trDraft;
  return `<div class="panel"><h3>${esc(d.lang)} draft, check before saving</h3>${d.items.map((it, i) => `<div class="field"><label for="tr-${i}">${esc((allSteps().find((s) => s.id === it.id) || {}).title || it.id)}</label>${it.subject ? `<input class="input" id="tr-${i}-s" value="${esc(it.subject)}" data-tr="${i}.subject">` : ''}<textarea class="input" id="tr-${i}" data-tr="${i}.body">${esc(it.body)}</textarea></div>`).join('')}
    <div class="actions"><button class="btn quiet" data-act="tr-discard">Discard</button><button class="btn primary" data-act="tr-save">${ico('check')}Save ${esc(d.lang)} translation</button></div></div>`;
}

/* ---------- Calendar: fairs, seasons, broadcasts, social posts ---------- */
function calendarView() {
  const today = todayStr(); const until = addDays(today, 365); const f = { ...S.filters.calendar }; if (f.country == null) f.country = focusNow().country;
  const seasons = SEASONS.filter((x) => x.date >= today && x.date <= until && (!f.country || x.countries.includes(f.country)));
  const fairs = FAIRS.filter((x) => x.end >= today && x.start <= until && (!f.country || x.country === f.country));
  const now = seasons.filter((x) => seasonPhase(x) === 'now');
  const months = new Map(); const add = (k, it) => { if (!months.has(k)) months.set(k, []); months.get(k).push(it); };
  for (const x of fairs) add(x.start.slice(0, 7), { date: x.start, html: fairRow(x) });
  for (const x of seasons) add(x.date.slice(0, 7), { date: x.date, html: seasonRow(x) });
  const countries = [...new Set([...SEASONS.flatMap((x) => x.countries), ...FAIRS.map((x) => x.country)])].sort();
  const bcs = [...S.broadcasts.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const keys = [...months.keys()].sort(); const shownKeys = S.ui.calAll ? keys : keys.filter((k) => k <= addDays(today, 92).slice(0, 7));
  const allPosts = [...S.posts.values()]; const posts = allPosts.filter((p) => (S.filters.posts === 'posted' ? p.status === 'posted' : p.status !== 'posted')).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return `<header class="head"><div><h1>Calendar</h1><p>Trade fairs and retail seasons for the next 12 months. Retailers order stock about one to three months before a season, so that's when to pitch.</p></div>
    <div class="actions"><button class="btn primary" data-act="bc-new">${ico('megaphone')}New broadcast</button></div></header>
  <div class="filters">${selectHtml('cal-country', 'data-filter="calendar.country" aria-label="Country"', countries.map((x) => [x, x]), f.country, 'All countries')}</div>
  <section class="section"><h2>Pitch now <span class="count">${now.length}</span></h2>
    ${now.length ? `<div class="cards">${now.map(pitchCard).join('')}</div>` : emptyBox('No season is in its ordering window right now for this country.')}
  </section>
  <section class="section"><h2>Broadcasts <span class="count">${bcs.length}</span></h2>
    ${bcs.length ? `<div class="list">${bcs.map(bcListItem).join('')}</div>` : emptyBox('A broadcast sends one message to many buyers you already know: a seasonal offer, new designs, or an invitation to meet at a fair.', `<button class="btn" data-act="bc-new">${ico('megaphone')}New broadcast</button>`)}
  </section>
  <section class="section"><div class="sec-head"><h2>Social post ideas <span class="count">${allPosts.filter((p) => p.status !== 'posted').length}</span></h2>${seg('posts', S.filters.posts, [['idea', 'To post'], ['posted', 'Posted']])}</div>
    ${posts.length ? `<div class="list">${posts.map(postItem).join('')}</div>` : emptyBox(S.filters.posts === 'posted' ? 'Nothing marked as posted yet.' : aiAvailable() ? 'Choose <b>Post ideas</b> on a season: Claude writes posts for your Instagram, LinkedIn and Facebook pages that speak to retailers planning stock.' : (onPhone() ? 'Post ideas need Claude. Ask Claude in chat for posts for this season.' : 'Post ideas from Claude work when this page runs inside Claude.'))}
  </section>
  <section class="section"><h2>Coming up</h2>
    ${shownKeys.map((k) => { const [y, m] = k.split('-').map(Number); return `<div class="month"><h3>${MONTHS_LONG[m - 1]} ${y}</h3><div class="list">${months.get(k).sort((a, b) => a.date.localeCompare(b.date)).map((it) => it.html).join('')}</div></div>`; }).join('') || emptyBox('Nothing in the next 12 months for this country.')}
    ${keys.length > shownKeys.length ? `<div><button class="btn" data-act="cal-all">Show the rest of the year, ${keys.length - shownKeys.length} more ${keys.length - shownKeys.length === 1 ? 'month' : 'months'}</button></div>` : ''}
  </section>
  <p class="hint">Fair dates were checked on each organiser's website in October 2026; confirm before you book. Eid dates are expected dates that depend on the moon.</p>`;
}
function pitchCard(x) {
  const w = seasonWindow(x); const busy = S.ai.busy === 'posts:' + x.key;
  return `<div class="ccard"><h3>${ico('calendar')}${esc(x.name)}</h3>
    <p><b>${esc(fmtDate(x.date))}</b>${x.approx ? ' <span class="chip">expected date</span>' : ''}</p>
    <p>Retailers order from ${esc(fmtDay(w.from))} to ${esc(fmtDay(w.to))}.</p>
    <p class="sub">${esc(countryList(x.countries))}</p>${x.note ? `<p class="sub">${esc(x.note)}</p>` : ''}
    <div class="actions"><button class="btn small primary" data-act="bc-new" data-season="${esc(x.key)}">${ico('megaphone')}Send an offer</button>${aiAvailable() ? `<button class="btn small" data-act="posts-gen" data-season="${esc(x.key)}" ${S.ai.busy ? 'disabled' : ''}>${ico('spark')}${busy ? 'Writing…' : 'Post ideas'}</button>` : ''}</div></div>`;
}
function fairRow(x) {
  const planned = [...S.campaigns.values()].find((c) => c.kind === 'fair' && c.fairKey === x.key);
  return `<div class="item"><div class="stack"><div class="title-row"><span class="ch">${ico('store')}Fair</span><b>${esc(x.name)}</b>${x.unconfirmed ? '<span class="chip warn">dates not confirmed yet</span>' : ''}${planned ? '<span class="chip good">Campaign planned</span>' : ''}</div>
    <div class="meta"><span>${esc(fmtRange(x.start, x.end))}</span><span>${esc(x.city)}, ${esc(x.country)}</span>${x.venue ? `<span>${esc(x.venue)}</span>` : ''}</div><div class="sub">${esc(x.who)}</div></div>
    <div class="actions">${planned ? `<a class="btn small" href="#city-${esc(planned.id)}">Open campaign</a>` : `<button class="btn small primary" data-act="new-fair" data-fair="${esc(x.key)}">Plan a fair campaign</button>`}<a class="btn small quiet" href="${esc(x.url)}" target="_blank" rel="noopener">${ico('ext')}Website</a></div></div>`;
}
function seasonRow(x) {
  const ph = seasonPhase(x); const w = seasonWindow(x); const busy = S.ai.busy === 'posts:' + x.key;
  const phase = ph === 'now' ? '<span class="chip good">Pitch now</span>' : ph === 'late' ? '<span class="chip warn">Late: offer ready stock</span>' : `<span class="chip">Pitch from ${esc(fmtDay(w.from))}</span>`;
  return `<div class="item"><div class="stack"><div class="title-row"><span class="ch">${ico('calendar')}Season</span><b>${esc(x.name)}</b>${phase}${x.approx ? '<span class="chip">expected date</span>' : ''}</div>
    <div class="meta"><span>${esc(fmtDate(x.date))}</span><span>${esc(countryList(x.countries))}</span></div>${x.note ? `<div class="sub">${esc(x.note)}</div>` : ''}</div>
    <div class="actions"><button class="btn small" data-act="bc-new" data-season="${esc(x.key)}">${ico('megaphone')}Offer</button>${aiAvailable() ? `<button class="btn small quiet" data-act="posts-gen" data-season="${esc(x.key)}" ${S.ai.busy ? 'disabled' : ''}>${ico('spark')}${busy ? 'Writing…' : 'Post ideas'}</button>` : ''}</div></div>`;
}
function bcListItem(bc) {
  const st = bcStats(bc);
  return `<div class="item"><div class="stack"><div class="title-row"><button class="linkish" data-act="bc-open" data-id="${esc(bc.id)}">${esc(bc.title)}</button>${chLabel(bc.channel)}${exChip(bc)}</div>
    <div class="meta"><span>${st.sent} of ${st.total} sent</span><span>${st.replied} replied</span><span>${esc(SEGMENT_LABEL[(bc.audience || {}).segment] || '')}</span><span>Created ${esc(fmtDay(String(bc.createdAt).slice(0, 10)))}</span></div></div>
    <div class="actions"><button class="btn small ${st.left ? 'primary' : ''}" data-act="bc-open" data-id="${esc(bc.id)}">${st.left ? `Send ${st.left} more` : 'Open'}</button></div></div>`;
}
function postItem(p) {
  const x = SEASONS.find((y) => y.key === p.season); const issues = complianceIssues(p.caption, '');
  const ch = p.platform === 'LinkedIn' ? 'linkedin' : p.platform === 'Facebook' ? 'facebook' : 'instagram';
  return `<div class="item"><div class="stack"><div class="title-row">${chLabel(ch)}${x ? `<span class="chip">${esc(x.name)}</span>` : ''}${p.status === 'posted' ? `<span class="chip good">Posted ${esc(fmtDay(String(p.postedAt || '').slice(0, 10)))}</span>` : ''}${exChip(p)}</div>
    <div class="msg" style="max-height:none">${esc(p.caption)}</div>${(p.hashtags || []).length ? `<div class="sub">${esc(p.hashtags.map((h) => '#' + h).join(' '))}</div>` : ''}${p.visual ? `<div class="sub"><b>Photo or video:</b> ${esc(p.visual)}</div>` : ''}${issues.length ? `<div class="warnline">${ico('alert')}${esc(issues.join(' · '))}</div>` : ''}</div>
    <div class="actions"><button class="btn small" data-act="post-copy" data-id="${esc(p.id)}">${ico('copy')}Copy</button>${p.status === 'posted' ? '' : `<button class="btn small primary" data-act="post-done" data-id="${esc(p.id)}">${ico('check')}Posted</button>`}<button class="btn small quiet" data-act="post-delete" data-id="${esc(p.id)}">Delete</button></div></div>`;
}
/* ---------- Gmail pieces shared by Today, the buyer drawer and Connections ---------- */
function fromWho() { return S.gm.account ? `<b class="mono">${esc(S.gm.account)}</b>` : S.gm.checking ? 'your Gmail (checking the address…)' : 'your Gmail'; }
function mismatchLine() { const mm = gmailMismatch(); return mm ? `<div class="warnline">${ico('alert')}Your sending address is ${esc(mm)}, but Gmail is connected as ${esc(S.gm.account)}.</div>` : ''; }
function sendConfirm(to, issues, goAct, goLabel, id) {
  return `<div class="confirm" role="group" aria-label="Confirm sending"><p>Send to <b class="mono">${esc(to)}</b> from ${fromWho()}?</p>${mismatchLine()}
    ${issues && issues.length ? `<div class="warnline">${ico('alert')}${esc(issues.join(' · '))}</div>` : ''}
    <button type="button" class="btn small primary" data-act="${goAct}" ${id ? `data-id="${esc(id)}"` : ''}>${ico('mail')}${goLabel}</button><button type="button" class="btn small quiet" data-act="gm-cancel">Cancel</button></div>`;
}
// UK shops open around 9:30; emails sent between 10:00 and 12:00 London time arrive while they're at the counter.
function ukSendHint(emails) {
  if (!emails.some((x) => x.b.country === UK)) return '';
  let diff = 0;
  try { const z = zoned('Europe/London', new Date()); const now = new Date(); diff = (now.getHours() * 60 + now.getMinutes()) - (z.h * 60 + z.m); if (diff > 720) diff -= 1440; if (diff < -720) diff += 1440; } catch { return ''; }
  const at = (h) => { const d = new Date(); d.setHours(h, diff, 0, 0); return fmtTime(d); };
  return diff ? ` Best sent between 10:00 and 12:00 UK time, which is ${at(10)} to ${at(12)} for you.` : ' Best sent between 10:00 and 12:00, while UK shops are open.';
}
function emailsSection(t) {
  const auto = gmailOn() ? t.emails.filter(autoSendable) : []; const held = t.emails.length - auto.length; const bt = S.gm.batch;
  const hint = gmailOn()
    ? `Send each email from your Gmail with one tap.${auto.length > 1 ? ` <b>Send ${auto.length} with Gmail</b> sends them one every few seconds.` : ''}${held && auto.length ? ` ${held} ${held === 1 ? 'needs' : 'need'} a check first, so ${held === 1 ? 'it stays' : 'they stay'} for you to send one by one.` : ''}`
    : phoneMail() ? `Tap Open in ${mailAppName()}: the email opens with the address, subject and message filled in. Send it there, then tap Mark sent.${ukSendHint(t.emails)}`
    : "Email isn't connected yet, so copy each one into your mail app, send it, then mark it sent.";
  return `<section class="section" id="sec-emails"><div class="sec-head"><h2>Emails due <span class="count">${t.emails.length}</span></h2><div class="actions">${auto.length > 1 && !bt ? `<button class="btn small primary" data-act="gm-send-all">${ico('mail')}Send ${auto.length} with Gmail</button>` : ''}${t.emails.length > 1 && !bt ? `<button class="btn small" data-act="mark-all-sent">${ico('check')}Mark all ${t.emails.length} as sent</button>` : ''}</div></div>
    ${S.gm.confirm === 'all' && !bt ? `<div class="confirm" role="group" aria-label="Confirm sending"><p>Send ${auto.length} ${auto.length === 1 ? 'email' : 'emails'} from ${fromWho()}, one every few seconds?</p>${mismatchLine()}<button type="button" class="btn small primary" data-act="gm-send-all-go">${ico('mail')}Send ${auto.length}</button><button type="button" class="btn small quiet" data-act="gm-cancel">Cancel</button></div>` : ''}
    ${bt ? `<div class="banner">${ico('mail')}<p><b>Sent ${bt.sent} of ${bt.total}.</b> Keep this page open until it finishes.</p><button type="button" class="btn small" data-act="gm-stop">Stop</button></div>` : ''}
    ${t.emails.length ? `<p class="hint">${hint}</p><div class="list">${t.emails.map(emailItem).join('')}</div>` : emptyBox('No emails due today. Start a city campaign to fill this list.')}
  </section>`;
}
function gmailCard() {
  const st = S.gm.state; const want = settings().company.senderEmail;
  if (st === 'ready') {
    return `<div class="ccard"><h3>${ico('mail')}Gmail</h3><span><span class="chip good">${ico('check')}Connected</span></span>
      <p>Sends your sequence emails, replies and proforma invoices from your own Gmail, and brings buyers' answers into Leads by itself.</p>
      ${S.gm.account ? `<p>Sending from <b class="mono sel">${esc(S.gm.account)}</b>.</p>` : S.gm.note === 'none' ? '<p class="hint" style="margin:0">Connected. Its address shows after the first email it sends.</p>' : S.gm.note ? `<div class="warnline">${ico('alert')}${esc(S.gm.note)}</div>` : ''}
      ${gmailMismatch() ? `<div class="warnline">${ico('alert')}Your sending address is ${esc(gmailMismatch())}. To send from it, reconnect Gmail in claude.ai Settings, Connectors, and pick that account.</div>` : ''}
      <p class="hint" style="margin:0">${esc(syncLine())}</p>
      <div class="actions"><button class="btn small" data-act="gm-check" ${S.gm.checking ? 'disabled' : ''}>${S.gm.checking ? 'Checking…' : S.gm.account ? 'Check again' : 'Check which address sends'}</button><button class="btn small" data-act="gm-sync" ${S.gm.sync.running ? 'disabled' : ''}>${ico('refresh')}${S.gm.sync.running ? 'Checking…' : 'Check for replies'}</button></div></div>`;
  }
  return `<div class="ccard"><h3>${ico('mail')}Gmail</h3><span><span class="chip warn">${st === 'reauth' ? 'Needs reconnecting' : 'Not connected'}</span></span>
    <p>${st === 'reauth' ? 'Reconnect Gmail in claude.ai Settings, Connectors, then reopen this app.' : `Connect Gmail in claude.ai Settings, Connectors${want ? `, signed in as ${esc(want)}` : ''}, then reopen this app to send emails and invoices with one tap.`}</p></div>`;
}
function tradeSection() {
  const t = settings().trade; const co = settings().company;
  const f = (k, label, ph = '') => `<div class="field"><label for="tr-${k}">${label}</label><input class="input" id="tr-${k}" data-k="tr.${k}" value="${esc(fv('tr.' + k, t[k]))}" placeholder="${esc(ph)}"></div>`;
  return `<section class="section"><h2>Export and bank details</h2><p class="hint">These print on your proforma invoices, so buyers know where to pay.</p>
    <div class="panel"><div class="grid2">${f('beneficiary', 'Account name', co.name || '')}${f('bankName', 'Bank')}${f('accountNo', 'Account number')}${f('ifsc', 'IFSC')}${f('swift', 'SWIFT or BIC')}${f('bankBranch', 'Branch and address')}${f('adCode', 'AD code, optional')}${f('iec', 'IEC number')}${f('gstin', 'GSTIN')}${f('lut', 'LUT reference, optional')}${f('piPrefix', 'Invoice numbers start with', 'AD/PI')}${f('port', 'Ships from', 'Mumbai, India')}</div>
      <div class="field"><label for="tr-paymentTerms">Payment terms on the invoice</label><textarea class="input" id="tr-paymentTerms" data-k="tr.paymentTerms" style="min-height:64px">${esc(fv('tr.paymentTerms', t.paymentTerms))}</textarea></div>
      <div class="actions"><button class="btn primary" data-act="save-trade">${ico('check')}Save export and bank details</button></div></div></section>`;
}

/* ---------- Orders ---------- */
function orderItem(o, todo) {
  const b = S.businesses.get(o.businessId); const total = orderTotal(o), paid = orderPaid(o);
  const who = (o.buyer || {}).name || (b && b.name) || '';
  return `<div class="item tap"><div class="stack">
    <div class="title-row"><button class="linkish" data-act="order-open" data-id="${esc(o.id)}">${esc(o.number)}${who ? ` · ${esc(who)}` : ''}</button></div>
    <div class="meta"><span>${esc(fmtMoney(total, o.currency))}</span><span>${paid ? `${esc(fmtMoney(paid, o.currency))} received` : 'Nothing received yet'}</span><span>${esc(fmtDay(o.piDate))}</span>${b && b.city ? `<span>${esc(b.city)}</span>` : ''}</div>
    <div class="tags"><span class="chip ${ORDER_TONE[o.status] || ''}">${esc(ORDER_LABEL[o.status] || o.status)}</span>${todo ? `<span class="chip ${todo.tone}">${esc(todo.text)}</span>` : ''}</div>
  </div><span class="go" aria-hidden="true">${ico('next')}</span></div>`;
}
function ordersView() {
  const fo = S.filters.orders; const q = fo.q.trim().toLowerCase();
  const all = [...S.orders.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const open = all.filter(isOpenOrder); const todo = orderTodos(); const todoIds = new Set(todo.map((x) => x.o.id));
  const waitingPay = open.filter((o) => (o.status === 'pi' && orderPaid(o) + 0.005 < orderAdvance(o)) || (o.status !== 'pi' && orderDue(o) > 0)).length;
  const toShip = open.filter((o) => o.status === 'ready' && orderDue(o) <= 0).length;
  const closed = all.filter((o) => !isOpenOrder(o));
  const hit = (o) => { if (!q) return true; const b = S.businesses.get(o.businessId); return [o.number, (o.buyer || {}).name, b && b.name, b && b.city].join(' ').toLowerCase().includes(q); };
  const tab = ['open', 'done', 'all', 'clients'].includes(fo.tab) ? fo.tab : 'open';
  const cards = (list) => `<div class="list">${list.map(({ o, t }) => orderItem(o, t)).join('')}</div>`;
  let body = '';
  if (tab === 'open') {
    const needs = todo.filter(({ o }) => hit(o)); const rest = open.filter((o) => !todoIds.has(o.id) && hit(o));
    body = `${needs.length ? `<section class="section"><h2>Needs you <span class="count">${needs.length}</span></h2>${cards(needs)}</section>` : ''}
    ${rest.length ? `<section class="section"><h2>Open <span class="count">${rest.length}</span></h2>${cards(rest.map((o) => ({ o, t: null })))}</section>` : ''}
    ${needs.length || rest.length ? '' : emptyBox(q ? 'No open orders match.' : 'No open orders. Delivered and cancelled ones are under Done.')}`;
  } else if (tab === 'clients') body = clientsPart(all, hit);
  else {
    const list = (tab === 'done' ? closed : all).filter(hit).slice(0, 60);
    body = list.length ? cards(list.map((o) => ({ o, t: isOpenOrder(o) ? orderTodo(o) : null }))) : emptyBox(q ? 'No orders match.' : 'Nothing here yet.');
  }
  return `<header class="head"><div><h1>Orders</h1></div>
    <div class="actions"><button class="btn primary" data-act="order-new">${ico('plus')}New order</button><a class="btn" href="#prices">${ico('calc')}Prices</a></div></header>
  ${all.length ? `<div class="filters"><input class="input search" id="or-q" type="search" placeholder="Search buyer or order number" value="${esc(fo.q)}" data-filter="orders.q" aria-label="Search orders"></div>
  ${seg('orders', tab, [['open', `Open ${open.length}`], ['done', `Done ${closed.length}`], ['all', `All ${all.length}`], ['clients', 'By client']])}` : ''}
  <div class="tiles">${tile(open.length, 'Open orders')}${tile(waitingPay, 'Waiting for payment')}${tile(toShip, 'Ready to ship')}${tile(all.filter((o) => o.status === 'delivered').length, 'Delivered')}</div>
  ${all.length ? body : emptyBox('No orders yet. When a buyer accepts a quote, tap <b>Make proforma</b> on it, or start one with <b>New order</b>.')}`;
}
// Everyone you do business with: their orders, what they've ordered in total, what's still due.
function clientsPart(all, hit) {
  const groups = new Map();
  for (const o of all.filter(hit)) { const k = o.businessId && S.businesses.get(o.businessId) ? o.businessId : `name:${String((o.buyer || {}).name || 'Unknown').toLowerCase()}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); }
  const rows = [...groups.entries()].map(([k, list]) => {
    const b = S.businesses.get(k) || null; const sums = {};
    for (const o of list) { if (o.status === 'cancelled') continue; const c = o.currency || 'USD'; const e = sums[c] || (sums[c] = { total: 0, due: 0 }); e.total += orderTotal(o); e.due += orderDue(o); }
    const last = list.map((o) => String(o.piDate || o.createdAt || '').slice(0, 10)).sort().pop() || '';
    return { b, list, sums, last, name: b ? b.name : (list[0].buyer || {}).name || 'Unknown buyer', open: list.filter(isOpenOrder).length };
  }).sort((a, b) => b.last.localeCompare(a.last));
  if (!rows.length) return emptyBox('No clients with orders yet.');
  return `<div class="list">${rows.map((r) => `<div class="item tap"><div class="stack"><div class="title-row"><button class="linkish" ${r.b ? `data-act="open-biz" data-id="${esc(r.b.id)}"` : `data-act="order-open" data-id="${esc(r.list[0].id)}"`}>${esc(r.name)}</button></div>
    <div class="meta"><span>${r.list.length} ${r.list.length === 1 ? 'order' : 'orders'}</span>${r.last ? `<span>last ${esc(fmtDay(r.last))}</span>` : ''}${r.b && r.b.city ? `<span>${esc(r.b.city)}</span>` : ''}</div>
    <div class="tags">${Object.entries(r.sums).map(([c, e]) => `<span class="chip gold">${esc(fmtMoney(e.total, c))} ordered</span>${e.due > 0.005 ? `<span class="chip warn">${esc(fmtMoney(e.due, c))} due</span>` : ''}`).join('')}${r.open ? `<span class="chip accent">${r.open} open</span>` : ''}</div></div><span class="go" aria-hidden="true">${ico('next')}</span></div>`).join('')}</div>`;
}
function ordersPanel(b) {
  const list = ordersOf(b.id);
  return `<section class="panel"><h3>Orders</h3>${list.length ? list.map((o) => { const t = orderTodo(o); return `<div class="srow"><div class="stack"><div class="title-row"><button class="linkish" data-act="order-open" data-id="${esc(o.id)}">${esc(o.number)}</button><span class="chip ${ORDER_TONE[o.status] || ''}">${esc(ORDER_LABEL[o.status] || o.status)}</span></div>
      <div class="meta"><span>${esc(fmtMoney(orderTotal(o), o.currency))}</span><span>${esc(fmtMoney(orderPaid(o), o.currency))} received</span><span>${esc(fmtDay(o.piDate))}</span></div>${t ? `<div><span class="chip ${t.tone}">${esc(t.text)}</span></div>` : ''}</div>
      <div class="actions"><button class="btn small" data-act="order-open" data-id="${esc(o.id)}">Open</button></div></div>`; }).join('') : '<p class="hint">When they confirm an order, send a proforma invoice from here, then track the payments and shipping.</p>'}
    <div><button class="btn small" data-act="order-new" data-id="${esc(b.id)}">${ico('receipt')}New proforma invoice</button></div></section>`;
}
function orderDrawer(o) {
  const b = S.businesses.get(o.businessId); const by = o.buyer || {}; const cur = o.currency;
  const total = orderTotal(o), paid = orderPaid(o), adv = orderAdvance(o), due = round2(Math.max(0, total - paid));
  const uk = (by.country || (b && b.country) || '') === UK; const panel = S.ui.orderPanel; const off = o.status === 'cancelled';
  const idx = ORDER_TRACK.findIndex(([k]) => k === o.status);
  const track = `<ol class="track${off ? ' off' : ''}" aria-label="Order progress">${ORDER_TRACK.map(([, label], i) => { const cls = off ? '' : o.status === 'delivered' || i < idx ? 'done' : i === idx ? 'now' : ''; return `<li class="${cls}"${i === idx && !off ? ' aria-current="step"' : ''}>${esc(label)}</li>`; }).join('')}</ol>`;
  const btn = (act, label, x = {}) => `<button type="button" class="btn small ${x.primary ? 'primary' : x.quiet ? 'quiet' : ''}" data-act="${act}" data-id="${esc(o.id)}"${x.val != null ? ` data-val="${esc(x.val)}"` : ''}>${x.icon ? ico(x.icon) : ''}${label}</button>`;
  let lead = ''; let acts = [];
  if (o.status === 'pi') {
    lead = `${paid ? `${esc(fmtMoney(paid, cur))} received so far. ` : ''}Waiting for the advance of <b>${esc(fmtMoney(Math.max(0, adv - paid), cur))}</b>${o.advanceDueAt ? `, due ${esc(fmtDay(o.advanceDueAt))}` : ''}.`;
    acts = [btn('order-panel', 'Email proforma', { primary: !o.emailedAt, val: 'mail', icon: 'mail' }), btn('order-panel', 'Record payment', { primary: !!o.emailedAt, val: 'pay', icon: 'check' }), btn('order-pdf', 'PDF', { icon: 'download' }), btn('order-status', 'Start production', { quiet: true, val: 'production' })];
  } else if (o.status === 'production') {
    lead = `In production${o.readyBy ? `, ready by ${esc(fmtDay(o.readyBy))}` : ''}.${paid ? ` ${esc(fmtMoney(paid, cur))} received.` : ''}`;
    acts = [btn('order-status', 'Ready: ask for the balance', { primary: true, val: 'ready', icon: 'check' }), btn('order-panel', 'Record payment', { val: 'pay' }), btn('order-pdf', 'PDF', { icon: 'download' })];
  } else if (o.status === 'ready') {
    lead = due > 0 ? `Ready. Balance of <b>${esc(fmtMoney(due, cur))}</b> due${o.balanceDueAt ? ` by ${esc(fmtDay(o.balanceDueAt))}` : ''}, before dispatch.` : 'Paid in full. Ready to ship.';
    acts = due > 0 ? [btn('order-panel', 'Record payment', { primary: true, val: 'pay', icon: 'check' }), btn('order-panel', 'Mark shipped', { val: 'ship', icon: 'box' })] : [btn('order-panel', 'Mark shipped', { primary: true, val: 'ship', icon: 'box' })];
  } else if (o.status === 'shipped') {
    const sh = o.ship || {}; const url = trackUrl(sh);
    lead = `Shipped ${esc(fmtDay(o.shippedAt))}${sh.courier ? ` by ${esc(COURIER_LABEL[sh.courier] || sh.courier)}` : ''}${sh.tracking ? `, tracking <span class="mono sel">${esc(sh.tracking)}</span>` : ''}.${url ? ` <a href="${esc(url)}" target="_blank" rel="noopener">Track it</a>` : ''}`;
    acts = [btn('order-status', 'Mark delivered', { primary: true, val: 'delivered', icon: 'check' })];
  } else if (o.status === 'delivered') lead = `Delivered ${esc(fmtDay(o.deliveredAt))}.${b && b.lead && b.lead.followUpAt ? ` Reorder check-in on ${esc(fmtDay(b.lead.followUpAt))}.` : ''}`;
  else lead = 'This order was cancelled.';
  const cancel = btn('order-panel', 'Cancel', { quiet: true, val: '' });
  const payForm = panel === 'pay' ? `<section class="panel"><h3>Record a payment</h3><div class="grid3">
      <div class="field"><label for="pay-amount">Amount, ${esc(cur)}</label><input class="input" id="pay-amount" type="number" min="0" step="0.01" inputmode="decimal" data-k="pay.amount" value="${esc(fv('pay.amount', defaultPayAmount(o)))}"></div>
      <div class="field"><label for="pay-at">Received on</label><input class="input" id="pay-at" type="date" data-k="pay.at" value="${esc(fv('pay.at', todayStr()))}"></div>
      <div class="field"><label for="pay-method">How</label>${selectHtml('pay-method', 'data-k="pay.method"', PAY_METHODS, fv('pay.method', 'bank'))}</div></div>
      <div class="field"><label for="pay-ref">Bank reference</label><input class="input" id="pay-ref" data-k="pay.ref" value="${esc(fv('pay.ref'))}" placeholder="e.g. the SWIFT or UTR number"></div>
      <div class="actions"><button type="button" class="btn primary" data-act="pay-save" data-id="${esc(o.id)}">${ico('check')}Save payment</button>${cancel}</div></section>` : '';
  const shipForm = panel === 'ship' ? `<section class="panel"><h3>Shipment</h3><div class="grid3">
      <div class="field"><label for="ship-courier">Courier</label>${selectHtml('ship-courier', 'data-k="ship.courier"', COURIERS, fv('ship.courier', 'malca'))}</div>
      <div class="field"><label for="ship-tracking">Tracking number</label><input class="input" id="ship-tracking" data-k="ship.tracking" value="${esc(fv('ship.tracking'))}"></div>
      <div class="field"><label for="ship-at">Shipped on</label><input class="input" type="date" id="ship-at" data-k="ship.at" value="${esc(fv('ship.at', todayStr()))}"></div></div>
      ${uk && !(o.checks || {}).hallmark ? `<div class="warnline">${ico('alert')}Hallmarking isn't ticked. In the UK, gold over 1 g and silver over 7.78 g need a UK hallmark before they're sold.</div>` : ''}
      ${due > 0 ? `<div class="warnline">${ico('alert')}${esc(fmtMoney(due, cur))} is still unpaid.</div>` : ''}
      <div class="actions"><button type="button" class="btn primary" data-act="ship-save" data-id="${esc(o.id)}">${ico('box')}Mark shipped</button>${cancel}</div></section>` : '';
  const m = piMail(o); const tr = settings().trade; const noBank = !(tr.accountNo && (tr.swift || tr.ifsc)); const busy = S.gm.busy === 'pi:' + o.id;
  const mailForm = panel === 'mail' ? `<section class="panel"><h3>Email the proforma</h3>
      ${noBank ? `<div class="warnline">${ico('alert')}Your bank details aren't saved, so the invoice can't show where to pay. <a href="#connections">Add them in Connections</a>.</div>` : ''}
      <div class="field"><label for="pm-to">To</label><input class="input" id="pm-to" type="email" data-k="pm.to" value="${esc(fv('pm.to', by.email || ''))}"></div>
      <div class="field"><label for="pm-subject">Subject</label><input class="input" id="pm-subject" data-k="pm.subject" value="${esc(fv('pm.subject', m.subject))}"></div>
      <div class="field"><label for="pm-body">Message</label><textarea class="input" id="pm-body" data-k="pm.body" style="min-height:190px">${esc(fv('pm.body', m.body))}</textarea></div>
      <p class="hint">The invoice goes as a PDF attachment, ${esc(piFileName(o))}.</p>
      ${onPhone() && !gmailOn() ? `<div class="actions"><button type="button" class="btn primary" data-act="order-share" data-id="${esc(o.id)}">${ico('share')}Share invoice</button><button type="button" class="btn" data-act="copy-text" data-val="${esc(fv('pm.to', by.email || ''))}">${ico('copy')}Copy address</button><button type="button" class="btn quiet" data-act="order-copy-mail" data-id="${esc(o.id)}">${ico('copy')}Copy message</button><button type="button" class="btn ${S.mailOpened.has('pi:' + o.id) ? 'primary' : 'quiet'}" data-act="order-emailed" data-id="${esc(o.id)}">I've emailed it</button>${cancel}</div>
      <p class="hint">Share invoice opens your phone's share sheet. Pick Gmail or Mail: the PDF is attached and the message is filled in. Add ${esc(fv('pm.to', by.email || '') || 'the buyer')} as the recipient, send it, then tap I've emailed it.</p>` : `<div class="actions">${gmailOn() ? `<button type="button" class="btn primary" data-act="order-mail" data-id="${esc(o.id)}" data-val="send" ${busy ? 'disabled' : ''}>${ico('mail')}${busy ? 'Working…' : 'Send with Gmail'}</button><button type="button" class="btn" data-act="order-mail" data-id="${esc(o.id)}" data-val="draft" ${busy ? 'disabled' : ''}>Save as Gmail draft</button>` : ''}<button type="button" class="btn ${gmailOn() ? 'quiet' : ''}" data-act="order-pdf" data-id="${esc(o.id)}">${ico('download')}Download PDF</button><button type="button" class="btn quiet" data-act="order-copy-mail" data-id="${esc(o.id)}">${ico('copy')}Copy message</button>${gmailOn() ? '' : `<button type="button" class="btn quiet" data-act="order-emailed" data-id="${esc(o.id)}">I've emailed it</button>`}${cancel}</div>
      ${o.draftUrl ? `<p class="hint">Draft saved ${esc(fmtWhen(o.draftAt))}. <a href="${esc(o.draftUrl)}" target="_blank" rel="noopener">Open it in Gmail</a></p>` : ''}
      ${gmailOn() ? '' : '<p class="hint">Connect Gmail to send it from here. Until then, download the PDF and attach it in your mail app.</p>'}`}</section>` : '';
  const pays = (o.payments || []).slice().sort((x, y) => String(x.at).localeCompare(String(y.at)));
  const payments = `<section class="panel"><h3>Payments</h3>${pays.length ? pays.map((p) => `<div class="srow"><div class="stack"><div class="title-row"><b>${esc(fmtMoney(p.amount, cur))}</b><span class="sub">${esc(fmtDate(p.at))}</span></div><div class="meta"><span>${esc(PAY_LABEL[p.method] || p.method || 'Payment')}</span>${p.ref ? `<span class="mono sel">${esc(p.ref)}</span>` : ''}</div></div><div class="actions">${confirmBtn(`pay:${o.id}:${p.id}`, 'Remove', 'Tap again to remove', 'pay-delete', `data-id="${esc(o.id)}" data-val="${esc(p.id)}"`)}</div></div>`).join('') : '<p class="hint">No payments yet. Record each transfer when it reaches your bank.</p>'}</section>`;
  const checks = o.checks || {};
  const AUTO = { '@pi': ['Proforma sent', !!o.emailedAt || o.status !== 'pi'], '@advance': ['Advance received', adv > 0 ? paid + 0.005 >= adv : paid > 0], '@balance': ['Balance received', total > 0 && paid + 0.005 >= total], '@delivered': ['Delivered', o.status === 'delivered'] };
  const FLOW = ['@pi', '@advance', 'cad', 'photos', 'certs', 'hallmark', '@balance', 'invoice', 'origin', 'export', 'insured', '@delivered'];
  const checklist = `<section class="panel"><h3>${uk ? 'UK order checklist' : 'Order checklist'}</h3><div class="checklist">${FLOW.map((k) => {
    if (AUTO[k]) { const [label, on] = AUTO[k]; return `<div class="auto ${on ? 'on' : ''}">${ico(on ? 'check' : 'clock')}<span>${esc(label)}</span></div>`; }
    const c = ORDER_CHECKS.find((x) => x.k === k); if (!c || (c.uk && !uk)) return '';
    return `<label class="switch"><input type="checkbox" id="chk-${esc(o.id)}-${k}" data-check="${esc(o.id)}:${k}" ${checks[k] ? 'checked' : ''} ${off ? 'disabled' : ''}>${esc(c.label)}</label>`;
  }).join('')}</div></section>`;
  const items = `<section class="panel"><h3>Items</h3><dl class="ledger">${(o.lines || []).map((l) => `<dt>${esc(l.desc || 'Item')}<span class="sub"> · ${esc(l.qty)} × ${esc(num2(l.price))}${l.hs ? ` · HS ${esc(l.hs)}` : ''}</span></dt><dd>${esc(num2((Number(l.qty) || 0) * (Number(l.price) || 0)))}</dd>`).join('')}${Number(o.shipping) ? `<dt>Shipping and insurance</dt><dd>${esc(num2(o.shipping))}</dd>` : ''}${Number(o.discount) ? `<dt>Discount</dt><dd>−${esc(num2(o.discount))}</dd>` : ''}<dt class="tot">Total</dt><dd class="tot">${esc(fmtMoney(total, cur))}</dd></dl></section>`;
  const rows = [['Buyer', b ? `<button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(by.name || b.name)}</button>` : esc(by.name || '')], ['Email', by.email && `<span class="mono sel">${esc(by.email)}</span>`], ['Address', by.address && esc(by.address)], ['VAT', by.vat && esc(by.vat)],
    ['Terms', esc(`${o.incoterm || ''} ${o.place || ''}`.trim())], ['Ships from', o.port && esc(o.port)], ['Proforma date', esc(fmtDate(o.piDate))], ['Valid until', o.validUntil && esc(fmtDate(o.validUntil))], ['Advance due', o.advanceDueAt && esc(fmtDate(o.advanceDueAt))], ['Ready by', o.readyBy && esc(fmtDate(o.readyBy))], ['Balance due', o.balanceDueAt && esc(fmtDate(o.balanceDueAt))]].filter((r) => r[1]);
  return `<div class="drawer" role="dialog" aria-modal="true" aria-label="Proforma ${esc(o.number)}">
    <div class="layer-head"><div><div class="eyebrow">Proforma invoice · ${esc(by.name || (b && b.name) || '')}</div><h2>${esc(o.number)}</h2><div class="chips"><span class="chip ${ORDER_TONE[o.status] || ''}">${esc(ORDER_LABEL[o.status] || o.status)}</span>${o.emailedAt ? `<span class="chip">${ico('mail')}Emailed ${esc(fmtDay(String(o.emailedAt).slice(0, 10)))}</span>` : ''}</div></div>${closeBtn()}</div>
    ${track}
    <div class="tiles wide">${tile(esc(fmtShort(total, cur)), 'Total')}${tile(esc(fmtShort(adv, cur)), `Advance, ${esc(pdfN(orderPct(o)))}%`)}${tile(esc(fmtShort(paid, cur)), 'Received')}${tile(esc(fmtShort(due, cur)), 'Still due')}</div>
    <section class="panel"><h3>Next</h3><p style="margin:0">${lead}</p>${acts.length ? `<div class="actions">${acts.join('')}</div>` : ''}</section>
    ${payForm}${shipForm}${mailForm}${payments}${checklist}${items}
    <section class="panel"><h3>Details</h3><dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></section>
    <div class="actions">${off ? '' : btn('order-edit', 'Edit proforma')}${btn('order-pdf', 'Download PDF', { icon: 'download' })}${!off && o.status !== 'delivered' ? confirmBtn('ocancel:' + o.id, 'Cancel order', 'Tap again to cancel the order', 'order-cancel', `data-id="${esc(o.id)}"`) : ''}${(o.payments || []).length ? '' : confirmBtn('odel:' + o.id, 'Delete', 'Tap again to delete', 'order-delete', `data-id="${esc(o.id)}"`)}</div>
  </div>`;
}
function orderModal() {
  const d = S.orderDraft; if (!d) return ''; const b = S.businesses.get(d.businessId); const ob = d.buyer || {};
  const buyers = allBiz().filter((x) => x.status !== 'rejected').sort((x, y) => (y.lead ? 1 : 0) - (x.lead ? 1 : 0) || x.name.localeCompare(y.name));
  const of = (k, label, type = 'text', extra = '') => `<div class="field"><label for="o-${k}">${label}</label><input class="input" id="o-${k}" type="${type}" data-o="${k}" value="${esc(d[k] ?? '')}" ${extra}></div>`;
  const bf = (k, label, type = 'text') => `<div class="field"><label for="ob-${k}">${label}</label><input class="input" id="ob-${k}" type="${type}" data-ob="${k}" value="${esc(ob[k] ?? '')}"></div>`;
  return `<form class="modal wide" role="dialog" aria-modal="true" aria-labelledby="o-title" data-form="order">
    <div class="layer-head"><div><div class="eyebrow">${b ? `${esc(b.name)} · ${esc([b.city, b.country].filter(Boolean).join(', '))}` : 'Proforma invoice'}</div><h2 id="o-title">${d.number ? `Edit ${esc(d.number)}` : 'New proforma invoice'}</h2></div>${closeBtn()}</div>
    ${d.id ? '' : `<div class="field"><label for="o-businessId">Buyer</label>${selectHtml('o-businessId', 'data-o="businessId"', buyers.map((x) => [x.id, `${x.name}${x.city ? ', ' + x.city : ''}`]), d.businessId, 'Choose a buyer')}</div>`}
    <section class="panel"><h3>Bill to</h3><div class="grid2">${bf('name', 'Company name')}${bf('person', 'Contact person')}${bf('email', 'Email', 'email')}${bf('phone', 'Phone', 'tel')}${bf('country', 'Country')}${bf('vat', ob.country === UK ? 'UK VAT number' : 'VAT or tax number')}</div>
      <div class="field"><label for="ob-address">Address</label><textarea class="input" id="ob-address" data-ob="address" style="min-height:64px">${esc(ob.address || '')}</textarea></div></section>
    <div class="grid3">
      <div class="field"><label for="o-currency">Currency</label>${selectHtml('o-currency', 'data-o="currency"', CURRENCIES.map((x) => [x, x]), d.currency)}</div>
      <div class="field"><label for="o-incoterm">Delivery terms</label>${selectHtml('o-incoterm', 'data-o="incoterm"', INCOTERMS.map(([k, l]) => [k, `${k}, ${l.toLowerCase()}`]), d.incoterm)}</div>
      ${of('place', 'Named place, e.g. London')}
    </div>
    <div class="olines">
      <div class="ohead"><span>Item</span><span>HS code</span><span>Qty</span><span>Unit price</span><span class="num">Amount</span><span></span></div>
      ${d.lines.map((l, i) => `<div class="oline"><input class="input" id="ol-${i}-d" data-ol="${i}.desc" value="${esc(l.desc)}" placeholder="e.g. 18K gold ring, 1 ct laboratory-grown diamond" aria-label="Item ${i + 1}">
        <label class="cell"><span class="ml">HS code</span><input class="input" id="ol-${i}-h" data-ol="${i}.hs" value="${esc(l.hs)}" placeholder="${esc(hsFor(l.desc) || '7113.19')}" aria-label="HS code, item ${i + 1}"></label>
        <label class="cell"><span class="ml">Qty</span><input class="input" id="ol-${i}-q" type="number" min="0" step="1" data-ol="${i}.qty" value="${esc(l.qty)}" aria-label="Quantity, item ${i + 1}"></label>
        <label class="cell"><span class="ml">Unit price</span><input class="input" id="ol-${i}-p" type="number" min="0" step="0.01" data-ol="${i}.price" value="${esc(l.price)}" aria-label="Unit price, item ${i + 1}"></label>
        <span class="num">${esc(num2((Number(l.qty) || 0) * (Number(l.price) || 0)))}</span>
        <button type="button" class="btn small quiet" data-act="ol-remove" data-val="${i}" aria-label="Remove item ${i + 1}" ${d.lines.length < 2 ? 'disabled' : ''}>${ico('x')}</button></div>`).join('')}
      <div><button type="button" class="btn small" data-act="ol-add">${ico('plus')}Add an item</button></div>
    </div>
    <div class="grid3 nums">${of('shipping', 'Shipping and insurance', 'number', 'min="0" step="0.01"')}${of('discount', 'Discount', 'number', 'min="0" step="0.01"')}<div class="field"><span class="lab">Total</span><b class="qtotal">${esc(fmtMoney(orderTotal(d), d.currency))}</b></div></div>
    <div class="grid3 nums">${of('advancePct', 'Advance, %', 'number', 'min="0" max="100" step="1"')}${of('piDate', 'Invoice date', 'date')}${of('validUntil', 'Valid until', 'date')}${of('advanceDueAt', 'Advance due by', 'date')}${of('readyBy', 'Ready by', 'date')}${of('balanceDueAt', 'Balance due by', 'date')}</div>
    <div class="grid3">${of('port', 'Ships from')}${d.currency !== 'USD' ? of('usdRate', `1 ${esc(d.currency)} in US$, for reports`, 'number', 'min="0" step="0.0001"') : ''}</div>
    <div class="field"><label for="o-terms">Payment terms</label><textarea class="input" id="o-terms" data-o="terms" style="min-height:60px">${esc(d.terms || '')}</textarea></div>
    <div class="field"><label for="o-notes">Notes on the invoice</label><textarea class="input" id="o-notes" data-o="notes" style="min-height:60px" placeholder="Certificates, packing, anything you agreed">${esc(d.notes || '')}</textarea></div>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="button" class="btn primary" data-act="order-save">${ico('check')}${d.id ? 'Save changes' : 'Create proforma'}</button></div>
  </form>`;
}

/* ---------- Visits ---------- */
function tripChip(b) { const x = tripOf(b.id); return x ? `<a class="chip gold" href="#trip-${esc(x.t.id)}">${ico('map')}Visit ${esc(fmtWeekday(x.date))}, ${esc(fmtClock(x.st.time))}</a>` : ''; }
function tripItem(t) {
  const stops = t.stops || []; const days = [...new Set(stops.map((st) => st.day))].sort((a, b) => a - b);
  const cities = [...new Set(stops.map((st) => (S.businesses.get(st.bid) || {}).city).filter(Boolean))];
  const end = days.length ? tripDay(t.startDate, days[days.length - 1]) : t.startDate;
  return `<div class="item"><div class="stack"><div class="title-row"><a class="linkish" href="#trip-${esc(t.id)}">${esc(t.name)}</a></div>
    <div class="meta"><span>${esc(fmtRange(tripDay(t.startDate, 0), end))}</span><span>${esc(listAnd(cities))}</span><span>${stops.length} shops</span><span>${stops.filter((st) => st.status === 'visited').length} visited</span></div></div>
    <div class="actions"><a class="btn small primary" href="#trip-${esc(t.id)}">Open</a></div></div>`;
}
function tripsView() {
  const cities = tripCities().map(([c, n]) => ({ c, n, talking: focusBiz().filter((b) => b.city === c && b.lead && b.lead.stage !== 'lost').length }));
  const trips = tripsList();
  return `<header class="head"><div><h1>Visits</h1><p>Plan a sales trip. Pick the cities, and the app groups the shops by postcode into a day-by-day route, with a short note to send each shop before you go.</p></div>
    <div class="actions"><button class="btn primary" data-act="trip-new">${ico('map')}Plan a trip</button></div></header>
  ${cities.length ? `<section class="section"><h2>Where your buyers are</h2><div class="tiles">${cities.map((x) => tile(x.n, `${esc(x.c)}${x.talking ? `, ${x.talking} talking` : ''}`)).join('')}</div><p class="hint">London and Birmingham, Manchester and Leeds, and Edinburgh and Glasgow are each an hour or so apart by train, so those pairs fit into one trip.</p></section>` : ''}
  <section class="section"><h2>Trips <span class="count">${trips.length}</span></h2>${trips.length ? `<div class="list">${trips.map(tripItem).join('')}</div>` : emptyBox('No trips yet. Plan one and it appears here.', `<button class="btn primary" data-act="trip-new">${ico('map')}Plan a trip</button>`)}</section>`;
}
function tripModal() {
  const counts = tripCities();
  const first = counts.length ? counts[0][0] : '';
  const start = fv('tp.start', nextMonday());
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="tp-title" data-form="trip">
    <div class="layer-head"><h2 id="tp-title">Plan a trip</h2>${closeBtn()}</div>
    <div class="grid2"><div class="field"><label for="tp-name">Name</label><input class="input" id="tp-name" data-k="tp.name" value="${esc(fv('tp.name', `UK trip, ${MONTHS_LONG[parseDate(start).getMonth()]} ${parseDate(start).getFullYear()}`))}"></div>
      <div class="field"><label for="tp-start">First day</label><input class="input" type="date" id="tp-start" data-k="tp.start" value="${esc(start)}"></div></div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="lab" style="margin-bottom:6px">Cities, visited in this order</legend><div class="checks">${counts.map(([c, n]) => `<label><input type="checkbox" id="tp-c-${esc(c.toLowerCase())}" data-k="tp.c.${esc(c)}" ${fv('tp.c.' + c, c === first) ? 'checked' : ''}>${esc(c)} <span class="sub">${n}</span></label>`).join('')}</div></fieldset>
    <div class="field"><span class="lab">Which shops</span>${seg('tpinc', fv('tp.include', 'all'), [['all', 'All found'], ['contacted', 'Approved or contacted'], ['leads', 'Only leads']])}</div>
    <div class="grid2"><div class="field"><label for="tp-per">Shops a day</label>${selectHtml('tp-per', 'data-k="tp.perDay"', ['4', '5', '6', '7', '8'].map((n) => [n, n]), fv('tp.perDay', '6'))}</div>
      <div class="field"><label for="tp-cap">Most shops in each city</label>${selectHtml('tp-cap', 'data-k="tp.cap"', [['6', '6'], ['12', '12'], ['18', '18'], ['0', 'All of them']], fv('tp.cap', '12'))}</div></div>
    <p class="hint">The best fits go in first: shops already talking to you, then those selling lab-grown. Sundays are left free.</p>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('map')}Make the plan</button></div>
  </form>`;
}
function visitForm(t, st) {
  return `<div class="confirm" role="group" aria-label="How the visit went"><p>How did it go?</p>${seg('vfout', fv('vf.outcome', 'interested'), VISIT_OUTCOMES)}
    <div class="field" style="flex:1 1 100%"><label for="vf-note">Notes</label><textarea class="input" id="vf-note" data-k="vf.note" style="min-height:70px" placeholder="Who you met, what they liked, what to send them">${esc(fv('vf.note'))}</textarea></div>
    <button type="button" class="btn small primary" data-act="visit-save" data-id="${esc(t.id)}" data-val="${esc(st.id)}">${ico('check')}Save visit</button><button type="button" class="btn small quiet" data-act="visit-cancel">Cancel</button></div>`;
}
function stopItem(t, st, days) {
  const b = S.businesses.get(st.bid); const tid = esc(t.id); const sid = esc(st.id);
  if (!b) return `<div class="item"><div class="stack"><div class="title-row"><span class="chip">${esc(st.time || '')}</span><span class="sub">This buyer was deleted.</span></div></div><div class="actions"><button class="btn small quiet" data-act="stop-remove" data-id="${tid}" data-val="${sid}">Remove</button></div></div>`;
  const c = contactOf(b); const done = st.status === 'visited' ? `<span class="chip good">${ico('check')}Visited${st.outcome ? ' · ' + esc(VISIT_LABEL[st.outcome] || st.outcome) : ''}</span>` : st.status === 'skipped' ? '<span class="chip">Skipped</span>' : '';
  return `<div class="item"><div class="stack">
    <div class="title-row"><span class="chip gold">${esc(fmtClock(st.time))}</span><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button>${b.lead ? stageChip(b.lead.stage) : ''}${done}${st.emailedAt ? `<span class="chip">${ico('mail')}Told ${esc(fmtDay(String(st.emailedAt).slice(0, 10)))}</span>` : ''}</div>
    <div class="meta">${areaOf(b) ? `<span>${esc(areaOf(b))}</span>` : ''}<span>${esc(addressOf(b) || 'No address on file')}</span></div>
    ${c.phone || b.labGrown || needsConsent(b) ? `<div class="meta">${c.phone ? `<span class="mono sel">${esc(c.phone)}</span>` : ''}${b.labGrown ? '<span class="labmark">sells lab-grown</span>' : ''}${consentChip(b)}</div>` : ''}
    ${st.note ? `<div class="msg quote">${esc(st.note)}</div>` : ''}
  </div><div class="actions">
    <a class="btn small" href="${esc(mapsUrl(b))}" target="_blank" rel="noopener">${ico('pin')}Map</a>
    ${st.status === 'planned' ? `<button class="btn small primary" data-act="stop-visit" data-id="${tid}" data-val="${sid}">${ico('check')}Visited</button>` : `<button class="btn small quiet" data-act="stop-undo" data-id="${tid}" data-val="${sid}">Undo</button>`}
    <select class="input" style="width:7.25rem" aria-label="Change the visit to ${esc(b.name)}" data-stopchange="${tid}:${sid}"><option value="">More…</option>${days.filter((d) => d !== st.day).map((d) => `<option value="${d}">Move to day ${days.indexOf(d) + 1}, ${esc(fmtWeekday(tripDay(t.startDate, d)))}</option>`).join('')}<option value="new">Move to a new day</option>${st.status === 'planned' ? '<option value="skip">Skip this shop</option>' : ''}<option value="remove">Take off the trip</option></select>
  </div>${S.ui.visitOpen === st.id ? visitForm(t, st) : ''}</div>`;
}
function tripMailPanel(t) {
  const m = t.mail || VISIT_TEMPLATE; const subject = fv('tm.subject', m.subject); const body = fv('tm.body', m.body);
  const rows = (t.stops || []).filter((st) => st.status === 'planned' && !st.emailedAt).map((st) => ({ st, b: S.businesses.get(st.bid) })).filter((x) => x.b);
  const ready = rows.filter((x) => tripSendable(x.b)); const call = rows.filter((x) => !tripSendable(x.b));
  const sample = ready[0] || rows[0]; const pv = sample ? tripMailText(t, sample.st, sample.b, subject, body) : null; const bt = S.gm.batch;
  return `<section class="panel"><h3>Tell them you're coming</h3>
    <p class="hint" style="margin:0">Each shop gets its own day and time: {{visit_date}} and {{visit_time}} fill in by themselves.</p>
    <div class="field"><label for="tm-subject">Subject</label><input class="input" id="tm-subject" data-k="tm.subject" data-quiet="1" value="${esc(subject)}"></div>
    <div class="field"><label for="tm-body">Message</label><textarea class="input" id="tm-body" data-k="tm.body" data-quiet="1" style="min-height:200px">${esc(body)}</textarea></div>
    ${pv ? `<div class="field"><span class="lab">What ${esc(sample.b.name)} receives</span><div class="msg" style="max-height:none"><b>${esc(pv.subject)}</b>\n\n${esc(pv.body)}</div></div>` : ''}
    ${bt ? `<div class="banner">${ico('mail')}<p><b>Sent ${bt.sent} of ${bt.total}.</b> Keep this page open until it finishes.</p><button type="button" class="btn small" data-act="gm-stop">Stop</button></div>` : ''}
    <div class="actions">${gmailOn() && ready.length && !bt ? `<button type="button" class="btn primary" data-act="trip-mail-send" data-id="${esc(t.id)}">${ico('mail')}Send to ${ready.length} with Gmail</button>` : ''}<button type="button" class="btn" data-act="trip-mail-save" data-id="${esc(t.id)}">Save message</button><button type="button" class="btn quiet" data-act="trip-mail" data-id="${esc(t.id)}">Close</button></div>
    ${phoneMail() && ready.length ? `<div class="list">${ready.map((x) => { const key = `trip:${t.id}:${x.st.id}`; const mm = tripMailText(t, x.st, x.b, subject, body); const op = S.mailOpened.has(key);
      return `<div class="item"><div class="stack"><div class="title-row"><b>${esc(x.b.name)}</b></div><div class="meta"><span class="mono sel">${esc(contactOf(x.b).email)}</span><span>${esc(fmtWeekday(tripDay(t.startDate, x.st.day)))} ${esc(fmtClock(x.st.time))}</span></div></div>
        <div class="actions">${mailOpen(contactOf(x.b).email, mm.subject, mm.body, key, !op, key)}<button type="button" class="btn small ${op ? 'primary' : ''}" data-act="trip-told" data-id="${esc(t.id)}" data-val="${esc(x.st.id)}">${ico('check')}Mark told</button></div></div>`; }).join('')}</div>
      <p class="hint">Open each note in ${mailAppName()}, send it, then tap Mark told. Their answers come in with your other replies.</p>` : ''}
    ${!gmailOn() && !phoneMail() && ready.length ? `<p class="hint">Connect Gmail to send these in one go. Until then, copy each one: ${ready.map((x) => `<button type="button" class="linkish" data-act="trip-copy" data-id="${esc(t.id)}" data-val="${esc(x.st.id)}">${esc(x.b.name)}</button>`).join(', ')}.</p>` : ''}
    ${call.length ? `<p class="hint">Call these instead: ${call.map((x) => `${esc(x.b.name)}${contactOf(x.b).phone ? ` (<span class="mono sel">${esc(contactOf(x.b).phone)}</span>)` : ''}`).join(', ')}. They have no email address, or their company type isn't confirmed and UK sole traders and partnerships must agree before you email them.</p>` : ''}
    ${!rows.length ? '<p class="hint">Everyone on this trip has been told.</p>' : ''}
  </section>`;
}
function tripView(id) {
  const t = S.trips.get(id);
  if (!t) return `<header class="head"><div><div class="eyebrow"><a href="#trips">Visits</a></div><h1>Trip not found</h1><p>It may have been deleted.</p></div></header>`;
  const stops = t.stops || []; const days = [...new Set(stops.map((st) => st.day))].sort((a, b) => a - b);
  const cities = [...new Set(stops.map((st) => (S.businesses.get(st.bid) || {}).city).filter(Boolean))];
  const end = days.length ? tripDay(t.startDate, days[days.length - 1]) : t.startDate;
  const inTrip = new Set(stops.map((st) => st.bid));
  const others = cities.flatMap((c) => tripPool(c, 'all')).filter((b) => !inTrip.has(b.id)).sort((a, b) => a.city.localeCompare(b.city) || pcKey(a).localeCompare(pcKey(b), 'en', { numeric: true }));
  const daySection = (d) => {
    const list = stops.filter((st) => st.day === d); const bs = list.map((st) => S.businesses.get(st.bid)).filter(Boolean); const date = tripDay(t.startDate, d);
    const dists = [...new Set(bs.map((b) => (postcodeOf(placeOf(b)) || {}).district).filter(Boolean))]; const route = routeUrl(list.filter((st) => st.status !== 'skipped').map((st) => S.businesses.get(st.bid)).filter(Boolean));
    return `<section class="section"><div class="sec-head"><h2>Day ${days.indexOf(d) + 1} · ${esc(fmtWeekday(date))} <span class="count">${esc(listAnd([...new Set(bs.map((b) => b.city))]))}${dists.length ? ' · ' + esc(dists.join(', ')) : ''}</span></h2>${route ? `<a class="btn small" href="${esc(route)}" target="_blank" rel="noopener">${ico('map')}Route in Google Maps</a>` : ''}</div>
      <div class="list">${list.map((st) => stopItem(t, st, days)).join('')}</div></section>`;
  };
  return `<header class="head"><div><div class="eyebrow"><a href="#trips">Visits</a></div><h1>${esc(t.name)}</h1><p>${esc(fmtRange(tripDay(t.startDate, 0), end))} · ${esc(listAnd(cities))} · ${stops.length} shops. Sundays are left free.</p></div>
    <div class="actions"><button class="btn primary" data-act="trip-mail" data-id="${esc(t.id)}">${ico('mail')}Tell them you're coming</button>${confirmBtn('trip:' + t.id, 'Delete trip', 'Tap again to delete the trip', 'trip-delete', `data-id="${esc(t.id)}"`)}</div></header>
  <div class="tiles">${tile(days.length, days.length === 1 ? 'Day' : 'Days')}${tile(stops.length, 'Shops')}${tile(stops.filter((st) => st.emailedAt).length, 'Told in advance')}${tile(stops.filter((st) => st.status === 'visited').length, 'Visited')}</div>
  ${S.ui.tripMail === t.id ? tripMailPanel(t) : ''}
  ${days.map(daySection).join('')}
  ${others.length ? `<section class="section"><h2>Other shops in ${esc(listAnd(cities))} <span class="count">${others.length}</span></h2><div class="list">${others.map((b) => `<div class="item"><div class="stack"><div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button>${b.lead ? stageChip(b.lead.stage) : statusChip(b)}</div><div class="meta"><span>${esc(addressOf(b) || b.city)}</span></div></div>
      <div class="actions"><select class="input" style="width:auto" aria-label="Add ${esc(b.name)} to a day" data-stopadd="${esc(t.id)}:${esc(b.id)}"><option value="">Add to…</option>${days.map((d, i) => `<option value="${d}">Day ${i + 1}</option>`).join('')}<option value="new">A new day</option></select></div></div>`).join('')}</div></section>` : ''}`;
}
function visitsTodaySection() {
  const today = todayStr(); const rows = [];
  for (const t of tripsList()) { const stops = t.stops || []; const days = [...new Set(stops.map((st) => st.day))].sort((a, b) => a - b); for (const st of stops) if (tripDay(t.startDate, st.day) === today) rows.push(stopItem(t, st, days)); }
  if (rows.length) return `<section class="section"><h2>Visits today <span class="count">${rows.length}</span></h2><div class="list">${rows.join('')}</div></section>`;
  const soon = tripsList().find((t) => { const d0 = tripDay(t.startDate, 0); return d0 > today && daysBetween(today, d0) <= 7; });
  return soon ? `<div class="banner plain">${ico('map')}<p><b>${esc(soon.name)} starts ${esc(fmtLongDay(tripDay(soon.startDate, 0)))}.</b> ${(soon.stops || []).filter((st) => !st.emailedAt).length ? 'Tell the shops you\'re coming, so they keep time for you. ' : ''}<a href="#trip-${esc(soon.id)}">Open the plan</a></p></div>` : '';
}
/* ---------- Prices ---------- */
function priceRow(x, r) {
  const p = { ...(x.inputs || {}) }; const c = calcPrice(p, r);
  return `<div class="item"><div class="stack"><div class="title-row"><b>${esc(p.code || 'Untitled')}</b></div><div class="meta"><span>${esc(pcDesc({ ...p, code: '' }))}</span></div>
    <div class="meta"><span>${esc(inr(c.price))} at today's rates</span>${Object.entries(c.fx).map(([k, v]) => `<span>${esc(fxFmt(k, v))}</span>`).join('')}</div></div>
    <div class="actions"><button class="btn small" data-act="pc-load" data-id="${esc(x.id)}">Load</button>${confirmBtn('price:' + x.id, 'Delete', 'Tap again to delete', 'price-delete', `data-id="${esc(x.id)}"`)}</div></div>`;
}
function pricesView() {
  const p = pcInputs(); const r = pcRates(); const c = calcPrice(p, r); const pr = settings().pricing;
  const pf = (k, label, step = 'any', ph = '') => `<div class="field"><label for="pc-${k}">${label}</label><input class="input" id="pc-${k}" type="number" min="0" step="${step}" inputmode="decimal" data-pc="${k}" value="${esc(p[k] ?? '')}" placeholder="${esc(ph)}"></div>`;
  const rf = (k, label) => `<div class="field"><label for="rt-${k}">${label}</label><input class="input" id="rt-${k}" type="number" min="0" step="any" inputmode="decimal" data-rt="${k}" value="${esc((k in r.rates ? r.rates[k] : r[k]) ?? '')}" placeholder="Today's rate"></div>`;
  const parts = [[`Metal: ${Number(p.weight) || 0} g of ${METAL_SHORT[p.metal] || ''} at ${inr(c.fine * (PURITY[p.metal] || 1))} a gram`, c.metal], [`Wastage, ${Number(p.wastage) || 0}%`, c.wastage], [`Making, ${inr(p.makingPerG)} a gram`, c.making], ['Setting and finishing', c.setting], ['Laboratory-grown diamonds', c.diamonds], ['Plating, certificate and other', c.extras]].filter(([, v]) => v > 0);
  const fx = Object.entries(c.fx); const shop = c.fx.GBP ? Math.round(c.fx.GBP * 2.5 * 1.2) : 0;
  const buyers = focusBiz().filter((x) => !['rejected', 'unsubscribed', 'bounced'].includes(x.status)).sort((x, y) => (y.lead ? 1 : 0) - (x.lead ? 1 : 0) || x.name.localeCompare(y.name));
  const saved = [...S.prices.values()].sort((x, y) => String((x.inputs || {}).code || '').localeCompare(String((y.inputs || {}).code || '')));
  const curOpts = fx.length ? fx.map(([k]) => [k, k]) : FX.map(([k]) => [k, k]);
  return `<header class="head"><div><h1>Prices</h1><p>Work out a wholesale price from metal, diamonds and making, then see it in pounds, dollars, euros and dirhams.</p></div></header>
  <section class="section"><div class="sec-head"><h2>Today's rates</h2><span class="hint">${pr.ratesAt ? `Saved ${esc(fmtDate(pr.ratesAt))}` : 'Not saved yet'}</span></div>
    <div class="panel"><div class="grid3 nums">${rf('gold24', 'Gold 24K, ₹ a gram')}${rf('silver', 'Silver 999, ₹ a gram')}${rf('GBP', '₹ for £1')}${rf('USD', '₹ for $1')}${rf('EUR', '₹ for €1')}${rf('AED', '₹ for 1 dirham')}</div>
      <div class="grid3"><div class="field"><label for="rt-round">Round prices up to</label>${selectHtml('rt-round', 'data-rt="round"', [['1', 'The nearest 1'], ['5', 'The nearest 5'], ['10', 'The nearest 10'], ['0', "Don't round"]], String(r.round ?? 5))}</div></div>
      <div class="actions"><button class="btn primary" data-act="pc-save-rates">${ico('check')}Save rates</button><span class="hint">Saved rates also fill the US$ rate on quotes and invoices.</span></div></div></section>
  <div class="calc">
    <section class="panel"><h3>The piece</h3>
      <div class="grid2"><div class="field"><label for="pc-code">Design code or name</label><input class="input" id="pc-code" data-pc="code" value="${esc(p.code || '')}" placeholder="e.g. AR-101 halo ring"></div>
        <div class="field"><label for="pc-metal">Metal</label>${selectHtml('pc-metal', 'data-pc="metal"', METALS.map(([k, l]) => [k, l]), p.metal)}</div></div>
      <div class="grid3 nums">${pf('weight', 'Net metal weight, g', '0.01')}${pf('wastage', 'Wastage, %', '0.1')}${pf('makingPerG', 'Making, ₹ a gram')}</div>
      <div class="grid2 nums">${pf('ct1', 'Centre stone, ct', '0.01')}${pf('rate1', 'Centre stone, ₹ a carat')}${pf('ct2', 'Small stones, total ct', '0.01')}${pf('rate2', 'Small stones, ₹ a carat')}</div>
      <div class="grid3 nums">${pf('setting', 'Setting and finishing, ₹')}${pf('plating', 'Plating, ₹')}${pf('cert', 'Certificate, ₹')}${pf('other', 'Packing and other, ₹')}${pf('margin', 'Your margin, %', '0.1')}${pf('shipping', 'Shipping and insurance, ₹')}</div>
      ${p.metal === 'gold10' ? `<div class="warnline">${ico('alert')}10K isn't a legal gold standard in the UK. Use 9K or 14K for UK buyers.</div>` : ''}
      ${c.missingMetal ? `<div class="warnline">${ico('alert')}Add today's ${p.metal === 'silver925' ? 'silver' : 'gold'} rate above to price the metal.</div>` : ''}
    </section>
    <section class="panel"><h3>Price</h3>
      ${c.price ? `<dl class="ledger">${parts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(inr(v))}</dd>`).join('')}<dt class="tot">Cost</dt><dd class="tot">${esc(inr(c.cost))}</dd>${c.margin ? `<dt>Margin, ${Number(p.margin) || 0}%</dt><dd>${esc(inr(c.margin))}</dd>` : ''}${c.shipping ? `<dt>Shipping and insurance</dt><dd>${esc(inr(c.shipping))}</dd>` : ''}<dt class="tot">Wholesale price</dt><dd class="tot">${esc(inr(c.price))}</dd></dl>
        ${fx.length ? `<div class="tiles wide">${fx.map(([k, v]) => tile(esc(fxFmt(k, v)), k)).join('')}</div>` : '<p class="hint">Add exchange rates above to see this price in pounds, dollars, euros and dirhams.</p>'}
        ${shop ? `<p class="hint">In a UK shop at a 2.5× mark-up plus 20% VAT, this sells for about £${shop.toLocaleString('en-GB')}.</p>` : ''}
        <div class="actions"><button class="btn small" data-act="pc-copy">${ico('copy')}Copy</button><button class="btn small" data-act="pc-save">${ico('check')}Save to price list</button><button class="btn small quiet" data-act="pc-reset">Clear</button></div>
        <div class="grid2"><div class="field"><label for="pc-buyer">Quote it to</label>${selectHtml('pc-buyer', 'data-pc="buyer"', buyers.map((x) => [x.id, `${x.name}${x.city ? ', ' + x.city : ''}`]), p.buyer || '', 'Choose a buyer')}</div><div class="field"><label for="pc-cur">In</label>${selectHtml('pc-cur', 'data-pc="cur"', curOpts, p.cur || curOpts[0][0])}</div></div>
        <div><button class="btn small primary" data-act="pc-quote">${ico('doc')}Start a quote</button></div>`
      : '<p class="hint" style="margin:0">Fill in the piece to see its price.</p>'}
    </section>
  </div>
  <section class="section"><h2>Price list <span class="count">${saved.length}</span></h2>
    ${saved.length ? `<div class="list">${saved.map((x) => priceRow(x, r)).join('')}</div>` : emptyBox('Save a design to keep it here. Saved designs re-price with the rates you save each day.')}</section>`;
}
/* ---------- Connections and settings ---------- */
function connectionsView() {
  const st = settings(); const co = st.company; const ex = [S.businesses, S.campaigns, S.quotes, S.samples, S.broadcasts, S.posts].reduce((a, m) => a + [...m.values()].filter((x) => x.isExample).length, 0);
  const f = (k, v) => fv(k, v);
  const days = { email: dayList('email'), whatsapp: dayList('whatsapp') };
  return `<header class="head"><div><h1>Connections</h1><p>${gmailOn() ? 'Gmail is connected. The other channels connect at the end, and until then their steps are tasks you mark done.' : phoneMail() ? 'Email opens in your mail app. The other channels connect at the end, and until then their steps are tasks you mark done.' : 'Each channel connects at the end. Until then the app runs every step as a task you mark done.'}</p></div></header>
  <div class="cards">${CONNECTIONS.map((c) => c.key === 'email' && phoneMail() ? phoneMailCard() : c.key === 'email' && S.gm.state !== 'off' ? gmailCard() : `<div class="ccard"><h3>${ico(c.icon)}${esc(c.name)}</h3><span>${c.on ? `<span class="chip good">${ico('check')}Working</span>` : '<span class="chip">Not connected yet</span>'}</span><p>${esc(typeof c.does === 'function' ? c.does(days) : c.does)}</p><ul>${c.needs.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>`).join('')}</div>
  <section class="section"><h2>Your company</h2><p class="hint">These fill the placeholders in every message. Add the catalogue and price-list links when they're ready.</p>
    <div class="panel"><div class="grid2">
      <div class="field"><label for="co-name">Company name</label><input class="input" id="co-name" data-k="co.name" value="${esc(f('co.name', co.name))}"></div>
      <div class="field"><label for="co-sender">Your name (signs the messages)</label><input class="input" id="co-sender" data-k="co.senderName" value="${esc(f('co.senderName', co.senderName))}"></div>
      <div class="field"><label for="co-email">Sending email address</label><input class="input" id="co-email" type="email" data-k="co.senderEmail" value="${esc(f('co.senderEmail', co.senderEmail))}"></div>
      <div class="field"><label for="co-wa">WhatsApp number, with country code</label><input class="input" id="co-wa" inputmode="tel" placeholder="+91 …" data-k="co.whatsapp" value="${esc(f('co.whatsapp', co.whatsapp))}"></div>
      <div class="field"><label for="co-web">Website</label><input class="input" id="co-web" data-k="co.website" value="${esc(f('co.website', co.website))}"></div>
      <div class="field"><label for="co-addr">Business address (email footer)</label><input class="input" id="co-addr" data-k="co.address" value="${esc(f('co.address', co.address))}"></div>
      <div class="field"><label for="co-cat">Catalogue link</label><input class="input" id="co-cat" placeholder="Added at the end" data-k="ln.catalogue" value="${esc(f('ln.catalogue', st.links.catalogue))}"></div>
      <div class="field"><label for="co-price">Price list link</label><input class="input" id="co-price" placeholder="Added at the end" data-k="ln.priceList" value="${esc(f('ln.priceList', st.links.priceList))}"></div>
      <div class="field"><label for="co-cap">Daily limit for first emails</label><input class="input" id="co-cap" type="number" min="1" max="500" data-k="sd.dailyCap" value="${esc(f('sd.dailyCap', st.sending.dailyCap))}"></div>
    </div><div class="actions"><button class="btn primary" data-act="save-settings">${ico('check')}Save company details</button></div></div>
  </section>
  ${teamSection()}
  ${tradeSection()}
  <section class="section"><h2>WhatsApp QR code</h2><div class="panel">${qrPanel(co)}</div></section>
  <section class="section"><h2>Do-not-contact list</h2><div class="panel">${dncPanel()}</div></section>
  <section class="section"><h2>Data</h2><div class="panel">
    <p class="hint">${S.mode === 'db' ? `This app holds ${(S.campaigns.size + S.businesses.size).toLocaleString('en-US')} of its ${CAP.toLocaleString('en-US')} records.${onPhone() ? '' : ' People you share the app with see the same cities and leads.'}` : "Practice mode: nothing here is saved."}</p>
    ${ex ? `<div class="actions"><span>${ex} example records are loaded so you can try the app.</span>${confirmBtn('examples', 'Remove example data', 'Click again to remove all examples', 'remove-examples')}</div>` : '<p class="hint">No example data loaded.</p>'}
  </div></section>
  ${onPhone() ? accountSection() : ''}`;
}
function teamSection() {
  if (!S.device || typeof S.device.team !== 'function') return '';
  const head = '<section class="section"><h2>Your team</h2>';
  if (S.teamState === 'missing') return `${head}<div class="panel"><p style="margin:0">Give each person on your team their own login, and see who answered each reply. This needs a one-time update to your app's database first: ask Claude to switch on team logins.</p></div></section>`;
  if (S.teamState !== 'ready') return `${head}<div class="panel"><p class="hint" style="margin:0">${S.teamState === 'error' ? "Couldn't load the team. Check the connection and open this page again." : 'Loading the team…'}</p></div></section>`;
  const owner = !!S.me && S.me.role === 'owner';
  const ownerName = String(settings().company.senderName || '').trim();
  return `${head}<div class="panel">
    ${S.team.map((m) => `<div class="srow"><div class="stack"><div class="title-row"><b>${esc(m.name || (m.role === 'owner' ? ownerName || 'Owner' : m.email))}</b>${m.is_me ? '<span class="chip accent">You</span>' : ''}<span class="chip">${m.role === 'owner' ? 'Owner' : 'Team'}</span></div><div class="meta"><span class="mono sel">${esc(m.email)}</span><span>${m.last_sign_in_at ? `signed in ${esc(fmtWhen(m.last_sign_in_at))}` : 'not signed in yet'}</span></div></div>${owner && m.role === 'member' ? `<div class="actions">${confirmBtn('team:' + m.user_id, 'Remove', 'Tap again to remove', 'team-remove', `data-id="${esc(m.user_id)}"`)}</div>` : ''}</div>`).join('')}
    ${owner ? `<form data-form="team-add" class="grid2">
      <div class="field"><label for="tm-name">Name</label><input class="input" id="tm-name" data-k="tm.name" value="${esc(fv('tm.name'))}" autocomplete="off"></div>
      <div class="field"><label for="tm-email">Email</label><input class="input" id="tm-email" type="email" data-k="tm.email" value="${esc(fv('tm.email'))}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="field"><label for="tm-pass">Starting password, 10 characters or more</label><input class="input" id="tm-pass" data-k="tm.pass" value="${esc(fv('tm.pass'))}" autocomplete="new-password" autocapitalize="off" spellcheck="false"></div>
      <div class="field" style="justify-content:flex-end"><button type="submit" class="btn primary">${ico('plus')}Add to the team</button></div>
    </form><p class="hint" style="margin:0">They sign in on their own phone with that email and password, and see the same shops, replies and orders. What they send or answer shows their name.</p>` : '<p class="hint" style="margin:0">Only the owner adds or removes people.</p>'}
  </div></section>`;
}
function qrPanel(co) {
  const num = String(co.whatsapp || '').replace(/\D/g, '');
  if (num.length < 7) return '<p class="hint" style="margin:0">Save your WhatsApp number above to get a QR code for your visiting card, booth banner and catalogue. Buyers who scan it message you first, which also counts as WhatsApp opt-in.</p>';
  const text = fv('qr.text', "Hello, I'd like your lab-grown diamond jewellery catalogue.");
  const link = waUrl(num, text);
  if (S.qr === 'idle') { S.qr = 'loading'; loadQr().then(() => { S.qr = 'ready'; schedule(); }, () => { S.qr = 'failed'; schedule(); }); }
  const pic = S.qr === 'ready' ? qrSvg(link) : S.qr === 'failed' ? '<p class="hint">The QR code couldn\'t load here. The link works the same.</p>' : '<p class="hint">Making your QR code…</p>';
  return `<div class="qr"><div class="qr-box">${pic}</div><div class="stack" style="gap:10px;flex:1 1 260px">
    <p class="muted" style="margin:0">Print this on your visiting card, booth banner and catalogue. Scanning it opens a WhatsApp chat with you with this message filled in, and their first message counts as opt-in.</p>
    <div class="field"><label for="qr-text">Message they send you</label><input class="input" id="qr-text" data-k="qr.text" data-quiet="1" value="${esc(text)}"></div>
    <div class="mono sub" style="overflow-wrap:anywhere">${esc(link)}</div>
    <div class="actions">${S.qr === 'ready' ? `<button class="btn small" data-act="qr-png">${ico('download')}PNG</button><button class="btn small" data-act="qr-svg">${ico('download')}SVG</button>` : ''}<button class="btn small quiet" data-act="qr-copy">${ico('copy')}Copy link</button></div></div></div>`;
}
function dncPanel() {
  const d = S.suppressDoc || {}; const all = [...(d.domains || []), ...(d.emails || [])];
  return `<p class="hint" style="margin:0">The app never contacts these addresses or domains and skips them on import. Everyone who asks to unsubscribe is added automatically. ${all.length} on the list.</p>
    <div class="field"><label for="dnc-text">Add emails or whole domains, one per line</label><textarea class="input" id="dnc-text" data-k="dnc.text" style="min-height:70px" placeholder="buyer@example.com&#10;example-store.com">${esc(fv('dnc.text'))}</textarea></div>
    <div class="actions"><button class="btn small primary" data-act="dnc-add">${ico('ban')}Add to the list</button></div>
    ${all.length ? `<div class="dnc">${all.slice(-60).reverse().map((v) => `<span class="chip">${esc(v)}<button type="button" class="x" data-act="dnc-remove" data-val="${esc(v)}" aria-label="Remove ${esc(v)}">${ico('x')}</button></span>`).join('')}</div>${all.length > 60 ? '<p class="hint">Showing the latest 60.</p>' : ''}` : ''}`;
}
let qrLoad = null;
function loadQr() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (qrLoad) return qrLoad;
  qrLoad = new Promise((res, rej) => {
    const el = document.createElement('script'); el.src = QR_LIB; el.async = true;
    el.onload = () => (window.qrcode ? res(window.qrcode) : rej(new Error('qrcode missing')));
    el.onerror = () => { qrLoad = null; rej(new Error('qrcode failed to load')); };
    document.head.appendChild(el);
  });
  return qrLoad;
}
function qrSvg(text) {
  const q = window.qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(); const m = 4; const size = n + m * 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="WhatsApp QR code"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* ---------- layer: drawer and modals ---------- */
function layerHtml() {
  const L = S.layer; const center = (html) => `<div class="layer center" data-act="layer-bg">${html}</div>`;
  if (L.kind === 'biz') { const b = S.businesses.get(L.id); if (!b) return ''; return `<div class="layer" data-act="layer-bg">${bizDrawer(b)}</div>`; }
  if (L.kind === 'bcast') { const bc = S.broadcasts.get(L.id); if (!bc) return ''; return `<div class="layer" data-act="layer-bg">${bcDetail(bc)}</div>`; }
  if (L.kind === 'focus') return center(focusModal());
  if (L.kind === 'startcamp') return center(startCampModal());
  if (L.kind === 'meeting') return center(meetingModal());
  if (L.kind === 'remind') return center(remindModal());
  if (L.kind === 'campaign') return center(campaignModal());
  if (L.kind === 'fair') return center(fairModal());
  if (L.kind === 'bizform') return center(bizFormModal());
  if (L.kind === 'reply') return center(replyModal());
  if (L.kind === 'quote') return center(quoteModal());
  if (L.kind === 'order') { const o = S.orders.get(L.id); if (!o) return ''; return `<div class="layer" data-act="layer-bg">${orderDrawer(o)}</div>`; }
  if (L.kind === 'orderform') return center(orderModal());
  if (L.kind === 'tripform') return center(tripModal());
  if (L.kind === 'sample') return center(sampleModal());
  if (L.kind === 'broadcast') return center(broadcastModal());
  return '';
}
function closeBtn() { return `<button type="button" class="btn quiet" data-act="close-layer" aria-label="Close">${ico('x')}</button>`; }
function bizDrawer(b) {
  const c = contactOf(b); const l = b.lead; const st = settings();
  const rows = [['Contact', c.person], ['Email', c.email && `<span class="mono sel">${esc(c.email)}</span>`, true], ['Phone', c.phone && `<span class="mono sel">${esc(c.phone)}</span>`, true], ['WhatsApp', c.whatsapp && `<span class="mono sel">${esc(c.whatsapp)}</span>`, true],
    ['Website', safeUrl(c.website) && `<a href="${esc(safeUrl(c.website))}" target="_blank" rel="noopener">${esc(c.website)}</a>`, true], ['Instagram', igUrl(c.instagram) && `<a href="${esc(igUrl(c.instagram))}" target="_blank" rel="noopener">${esc(c.instagram)}</a>`, true],
    ['Facebook', safeUrl(c.facebook) && `<a href="${esc(safeUrl(c.facebook))}" target="_blank" rel="noopener">Facebook page</a>`, true], ['LinkedIn', safeUrl(c.linkedin) && `<a href="${esc(safeUrl(c.linkedin))}" target="_blank" rel="noopener">LinkedIn</a>`, true], ['Company', companyHtml(b), true]].filter((r) => r[1]);
  const steps = stepState(b, st);
  return `<div class="drawer" role="dialog" aria-modal="true" aria-label="${esc(b.name)}">
    <div class="layer-head"><div><div class="eyebrow">${esc(TYPE_LABEL[b.type] || 'Buyer')} · ${esc([b.city, b.country].filter(Boolean).join(', '))}</div><h2>${esc(b.name)}</h2><div class="chips">${stateChip(b)}${l ? stageChip(l.stage) : ''}${b.metAt ? `<span class="chip gold">Met at ${esc(b.metAt)}</span>` : ''}${localChip(b)}${consentChip(b)}${tripChip(b)}${exChip(b)}</div></div>${closeBtn()}</div>
    ${l && l.awaitingReply ? replyBox(b) : ''}
    ${(() => { const meet = meetingsFor(b.id).find((m) => m.status === 'planned' && Date.parse(m.at) >= Date.now() - 3600000); return meet ? `<div class="banner plain">${ico('meet')}<p><b>${esc(MEETING_LABEL[meet.kind] || 'Meeting')}: ${esc(meetingWhen(new Date(meet.at)))}.</b> ${meet.note ? `${esc(trunc(meet.note, 120))} ` : ''}<button type="button" class="linkish" data-act="meeting-edit" data-id="${esc(meet.id)}">Change</button></p></div>` : ''; })()}
    ${b.remind && b.remind.date ? `<div class="banner plain">${ico('clock')}<p><b>Reminder ${esc(fmtDay(b.remind.date))}${b.remind.note ? `: ${esc(b.remind.note)}` : ''}.</b> <button type="button" class="linkish" data-act="remind-new" data-id="${esc(b.id)}">Change</button></p></div>` : ''}
    <div class="actions">${bizActions(b)}</div>
    <div class="actions"><button type="button" class="btn" data-act="meeting-new" data-id="${esc(b.id)}">${ico('meet')}Book a meeting</button><button type="button" class="btn" data-act="remind-new" data-id="${esc(b.id)}">${ico('clock')}Next reminder</button></div>
    ${l ? leadPanel(b) : ''}
    ${['found', 'rejected'].includes(b.status) ? '' : quotesPanel(b) + ordersPanel(b) + samplesPanel(b)}
    ${similarPanel(b)}
    <section class="panel"><h3>Contact</h3>${rows.length ? `<dl class="kv">${rows.map(([k, v, raw]) => `<dt>${k}</dt><dd>${raw ? v : esc(v)}</dd>`).join('')}</dl>` : '<p class="hint">No contact details yet.</p>'}
      ${needsConsent(b) ? `<p class="hint">${esc(UK_EMAIL_RULE)}</p>` : ''}
      <label class="switch"><input type="checkbox" id="optin-${esc(b.id)}" data-optin="${esc(b.id)}" ${b.waOptIn ? 'checked' : ''}>WhatsApp opt-in received</label>
      <p class="hint">Turn this on only after they tapped your WhatsApp link, sent you their number, or met you in person.</p>
      <div><button class="btn small" data-act="edit-biz" data-id="${esc(b.id)}">Edit details</button></div></section>
    ${b.seqStart ? `<section class="panel"><h3>${esc(SEQ_KINDS.find(([k]) => k === seqKindOf(b))[1])}, started ${esc(fmtDay(b.seqStart))}</h3><ol class="tl">${steps.map((x) => `<li><span class="day">Day ${esc(x.step.day)}</span><span>${chLabel(x.channel)} <span class="sub">${esc(x.step.title)}</span></span><span>${x.done ? `<span class="chip ${x.done.how === 'sent' || x.done.how === 'done' ? 'good' : x.done.how === 'bounced' ? 'warn' : ''}">${esc({ sent: 'Sent', done: 'Done', skipped: 'Skipped', bounced: 'Bounced' }[x.done.how] || x.done.how)}</span>` : b.status === 'active' ? dueChip(x.due) : '<span class="chip">Stopped</span>'}</span></li>`).join('')}</ol></section>` : ''}
    <section class="panel"><h3>Conversation</h3>${(b.messages || []).length ? `<div class="thread">${b.messages.slice().sort((x, y) => String(x.at).localeCompare(String(y.at))).map((m) => `<div class="bubble ${m.dir}">${esc(m.text)}<span class="when">${m.dir === 'in' ? (m.channel === 'visit' ? 'Your visit' : 'They wrote') : 'You wrote'} · ${esc(CH_LABEL[m.channel] || m.channel)} · ${esc(fmtWhen(m.at))} ${m.tag ? '· ' + esc(TAG_LABEL[m.tag] || m.tag) : ''}${/^https:\/\/mail\.google\.com\//.test(m.url || '') ? ` · <a href="${esc(m.url)}" target="_blank" rel="noopener">Open in Gmail</a>` : ''}</span></div>`).join('')}</div>` : '<p class="hint">No messages yet. Log their reply when it comes in.</p>'}
      <div><button class="btn small" data-act="log-reply" data-id="${esc(b.id)}">${ico('chat')}Log a reply</button></div></section>
    ${historyPanel(b)}
    <section class="panel"><h3>Notes</h3><textarea class="input" id="notes-${esc(b.id)}" data-k="notes.${esc(b.id)}" style="min-height:80px">${esc(fv('notes.' + b.id, b.notes || ''))}</textarea><div><button class="btn small" data-act="save-notes" data-id="${esc(b.id)}">Save notes</button></div></section>
    <div class="actions">${b.status !== 'unsubscribed' ? `<button class="btn small quiet" data-act="unsub" data-id="${esc(b.id)}">Mark unsubscribed</button>` : ''}${confirmBtn('biz:' + b.id, 'Delete buyer', 'Click again to delete', 'delete-biz', `data-id="${esc(b.id)}"`)}</div>
  </div>`;
}
function bizActions(b) {
  if (b.status === 'found' || b.status === 'approved') return `<button class="btn primary" data-act="camp-one" data-id="${esc(b.id)}">${ico('megaphone')}Start campaign</button><button class="btn quiet" data-act="reject" data-id="${esc(b.id)}">Reject</button>`;
  if (b.status === 'active') return `<button class="btn" data-act="log-reply" data-id="${esc(b.id)}">${ico('chat')}They replied</button><button class="btn quiet" data-act="stop-seq" data-id="${esc(b.id)}">Stop sequence</button>`;
  if (b.status === 'rejected') return `<button class="btn" data-act="approve" data-id="${esc(b.id)}">Approve after all</button>`;
  return '';
}
function replyBox(b) {
  const l = b.lead; const h = hoursSince(l.lastInAt); const last = inbound(b).slice(-1)[0]; const id = b.id;
  const busy = S.ai.busy === 'draft:' + id; const gmReply = gmailOn() && !!contactOf(b).email && l.lastChannel === 'email';
  const pmReply = !gmReply && phoneMail() && !!contactOf(b).email && l.lastChannel === 'email'; const opened = S.mailOpened.has('reply:' + id);
  return `<section class="panel alert"><h3>Waiting for your reply · ${fmtWait(h)}</h3>
    <div class="meta">${chLabel(l.lastChannel)}${windowChip(l.lastInAt, l.lastChannel)}<span>${esc(reminderText(l))}</span></div>
    ${last ? `<div class="msg quote">${esc(last.text)}</div>` : ''}
    <div class="field"><label for="draft-${esc(id)}">Your reply</label><textarea class="input" id="draft-${esc(id)}" data-k="draft.${esc(id)}" placeholder="${busy ? 'Claude is writing…' : aiAvailable() ? 'Write your reply, or ask Claude for a draft' : 'Write your reply'}">${esc(fv('draft.' + id))}</textarea></div>
    ${settings().answers.length ? `<div class="field"><label for="ans-${esc(id)}">Insert a ready answer</label><select class="input" id="ans-${esc(id)}" data-answer="${esc(id)}"><option value="">Choose an answer</option>${settings().answers.map((a) => `<option value="${esc(a.id)}">${esc(a.title)}</option>`).join('')}</select></div>` : ''}
    <div class="actions">
      ${aiAvailable() ? (busy ? `<button class="btn" data-act="ai-stop">${ico('stop')}Stop</button>` : `<button class="btn" data-act="ai-draft" data-id="${esc(id)}">${ico('spark')}Draft with Claude</button>`) : ''}
      ${gmReply ? `<button class="btn primary" data-act="gm-reply" data-id="${esc(id)}" ${S.gm.busy === 'reply:' + id ? 'disabled' : ''}>${ico('mail')}${S.gm.busy === 'reply:' + id ? 'Sending…' : 'Send with Gmail'}</button>` : ''}
      ${pmReply ? mailOpen(contactOf(b).email, replySubject(b), String(fv('draft.' + id)), 'reply:' + id, !opened, 'reply:' + id).replace('btn small', 'btn') : ''}
      <button class="btn ${gmReply || (pmReply && !opened) ? '' : 'primary'}" data-act="answered" data-id="${esc(id)}">${ico('check')}I've replied</button>
      ${moreMenu('reply:' + id, `<button class="btn small" data-act="copy-draft" data-id="${esc(id)}">${ico('copy')}Copy</button><button class="btn small" data-act="snooze" data-id="${esc(id)}" data-when="1h">${ico('clock')}Remind me in 1 h</button><button class="btn small" data-act="snooze" data-id="${esc(id)}" data-when="tomorrow">${ico('clock')}Tomorrow 9:00</button>`)}
    </div>
    ${S.gm.confirm === 'reply:' + id ? sendConfirm(contactOf(b).email, [], 'gm-reply-go', 'Send reply', id) : ''}
    ${aiAvailable() ? '<p class="hint">Claude\'s drafts leave prices, minimums and delivery times as blanks for you to fill.</p>' : pmReply ? `<p class="hint">Open in ${mailAppName()} starts the reply with your text and the subject filled in. Send it there, then tap I've replied.</p>` : ''}</section>`;
}
function leadPanel(b) {
  const l = b.lead; const id = b.id;
  return `<section class="panel"><h3>Lead</h3><div class="grid2">
    <div class="field"><label for="stage-${esc(id)}">Stage</label>${selectHtml('stage-' + id, `data-stage="${esc(id)}"`, STAGES, l.stage)}</div>
    <div class="field"><label for="follow-${esc(id)}">Follow up on</label><input class="input" type="date" id="follow-${esc(id)}" data-follow="${esc(id)}" value="${esc(l.followUpAt || '')}"></div>
    <div class="field"><label for="order-${esc(id)}">Log an order, US$</label><input class="input" type="number" min="0" step="1" id="order-${esc(id)}" data-k="order.${esc(id)}" value="${esc(fv('order.' + id))}" placeholder="e.g. 4200"></div>
    <div class="field"><span class="lab">Ordered so far</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>${money(l.ordersValue || 0)}</b>${l.firstOrderAt ? `<span class="sub">first on ${esc(fmtDay(l.firstOrderAt))}</span>` : ''}<button class="btn small" data-act="log-order" data-id="${esc(id)}">Add order</button></div></div>
  </div></section>`;
}
function quotesPanel(b) {
  const list = quotesOf(b.id);
  return `<section class="panel"><h3>Quotes</h3>${list.length ? list.map((q) => `<div class="srow"><div class="stack"><div class="title-row"><b>${esc(q.number)}</b><span class="chip ${QUOTE_TONE[q.status] || ''}">${esc(QUOTE_LABEL[q.status] || q.status)}</span>${q.status === 'sent' && q.validUntil && q.validUntil < todayStr() ? '<span class="chip warn">past its date</span>' : ''}${exChip(q)}</div>
      <div class="meta"><span>${esc(fmtMoney(quoteTotal(q), q.currency))}</span><span>${esc(q.incoterm)}</span><span>${(q.lines || []).length} ${(q.lines || []).length === 1 ? 'item' : 'items'}</span><span>${esc(fmtDay(String(q.createdAt).slice(0, 10)))}</span></div></div>
      <div class="actions"><button class="btn small" data-act="quote-copy" data-id="${esc(q.id)}">${ico('copy')}Copy</button><button class="btn small" data-act="quote-download" data-id="${esc(q.id)}">${ico('download')}Download</button>${q.status === 'draft' ? `<button class="btn small" data-act="quote-status" data-id="${esc(q.id)}" data-val="sent">Mark sent</button>` : ''}${q.status === 'sent' ? `<button class="btn small primary" data-act="quote-status" data-id="${esc(q.id)}" data-val="accepted">Accepted</button><button class="btn small quiet" data-act="quote-status" data-id="${esc(q.id)}" data-val="declined">Declined</button>` : ''}${q.status === 'accepted' ? `<button class="btn small primary" data-act="order-from-quote" data-id="${esc(q.id)}">${ico('receipt')}Make proforma</button>` : ''}<button class="btn small quiet" data-act="quote-edit" data-id="${esc(q.id)}">Edit</button></div></div>`).join('') : '<p class="hint">When they ask for prices, build a quote here, copy it into your reply, and mark it accepted when they order.</p>'}
    <div><button class="btn small" data-act="quote-new" data-id="${esc(b.id)}">${ico('doc')}New quote</button></div></section>`;
}
function sampleButtons(x) {
  const btn = (v, label, primary) => `<button class="btn small ${primary ? 'primary' : ''}" data-act="sample-status" data-id="${esc(x.id)}" data-val="${v}">${label}</button>`;
  if (x.status === 'sent') return btn('delivered', 'Delivered') + btn('returned', 'Returned');
  if (x.status === 'delivered' || x.status === 'kept') return btn('ordered', 'They ordered', true) + (x.status === 'delivered' ? btn('kept', 'Still deciding') : '') + btn('returned', 'Returned');
  return '';
}
function samplesPanel(b) {
  const list = samplesOf(b.id);
  return `<section class="panel"><h3>Samples</h3>${list.length ? list.map((x) => { const url = trackUrl(x); return `<div class="srow"><div class="stack"><div class="title-row"><b>${esc(x.pieces || 'Samples')}</b><span class="chip ${SAMPLE_TONE[x.status] || ''}">${esc(SAMPLE_LABEL[x.status] || x.status)}</span>${exChip(x)}</div>
      <div class="meta"><span>Sent ${esc(fmtDay(x.sentAt))}</span>${x.value ? `<span>${money(x.value)}</span>` : ''}${x.courier ? `<span>${esc(COURIER_LABEL[x.courier] || x.courier)} ${esc(x.tracking || '')}</span>` : ''}${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Track</a>` : ''}${['sent', 'delivered', 'kept'].includes(x.status) && x.checkAt ? `<span>check in ${esc(fmtDay(x.checkAt))}</span>` : ''}</div>${x.notes ? `<div class="sub">${esc(x.notes)}</div>` : ''}</div>
      <div class="actions">${sampleButtons(x)}</div></div>`; }).join('') : '<p class="hint">No samples sent yet. Log a parcel and the app reminds you to ask for feedback.</p>'}
    <div><button class="btn small" data-act="sample-new" data-id="${esc(b.id)}">${ico('box')}Log samples sent</button></div></section>`;
}
function startCampModal() {
  const L = S.layer; const ids = L.ids || [...S.selection];
  const cap = Math.max(1, Number(fv('sc.cap', settings().sending.dailyCap)) || 25); const plan = campaignPlan(ids, cap);
  const n = plan.days.length; const steps = stepsFor('city'); const span = Math.max(0, ...steps.map((x) => Number(x.day) || 0));
  const links = settings().links; const missing = [!links.catalogue && 'catalogue', !links.priceList && 'price list'].filter(Boolean);
  const places = [...new Set(plan.days.map(([b]) => b.city).filter(Boolean))];
  const uk = plan.days.filter(([b]) => needsConsent(b) && contactOf(b).email).length;
  const today = plan.days.filter(([, d]) => d === todayStr()).length;
  const when = !n ? '' : plan.first === plan.last ? (plan.first === todayStr() ? 'They all start today.' : `They all start on ${fmtDay(plan.first)}.`) : `${today ? `${today} start today` : `The first start on ${fmtDay(plan.first)}`}, the last on ${fmtDay(plan.last)}.`;
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="sc-title" data-form="startcamp">
    <div class="layer-head"><div>${places.length ? `<div class="eyebrow">${esc(places.length > 3 ? `${places.slice(0, 3).join(', ')} and ${places.length - 3} more` : listAnd(places))}</div>` : ''}<h2 id="sc-title">Start the campaign</h2></div>${closeBtn()}</div>
    ${n ? `<p style="margin:0"><b>${n} ${n === 1 ? 'shop gets' : 'shops get'}</b> your ${span}-day plan. Best fits go first, ${cap} a day. ${when}</p>` : '<p style="margin:0"><b>None of these shops can start yet.</b> They have no email, phone or Instagram so far.</p>'}
    <div class="field"><span class="lab">Shops to start each day</span>${seg('sccap', String(cap), [['10', '10'], ['25', '25'], ['50', '50'], ['100', '100']])}</div>
    <section class="panel"><h3>Each shop gets</h3><ol class="tl">${steps.map((x) => `<li><span class="day">Day ${esc(x.day)}</span><span>${chLabel(x.channel)} <span class="sub">${esc(x.title)}</span></span><span></span></li>`).join('')}</ol>
      <p class="hint" style="margin:0">A shop's steps stop the moment it replies. Steps a shop can't receive (no Instagram, no yes to WhatsApp) are left out for that shop. Instagram and LinkedIn steps are tasks for you on Today; the app writes each message.</p></section>
    ${plan.waiting.length ? `<p class="warnline">${ico('alert')}${plan.waiting.length} ${plan.waiting.length === 1 ? "shop has" : "shops have"} no email, phone or Instagram yet, so ${plan.waiting.length === 1 ? 'it waits' : 'they wait'}. Start them once Claude's research finds their details.</p>` : ''}
    ${missing.length ? `<p class="warnline">${ico('alert')}Add your ${esc(listAnd(missing))} link in Connections before the first emails go: the messages use ${missing.length === 1 ? 'it' : 'them'}.</p>` : ''}
    ${uk ? `<p class="hint" style="margin:0">${uk} UK ${uk === 1 ? "shop isn't" : "shops aren't"} confirmed as limited companies yet. Their emails show a reminder to check first (UK rule).</p>` : ''}
    <p class="hint" style="margin:0">${gmailOn() ? 'Emails send from your Gmail.' : 'Each day, Today lists the emails due, ready to open in your mail app and send. Automatic sending starts once Gmail sending is connected.'}</p>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary" ${n ? '' : 'disabled'}>${ico('megaphone')}Start for ${n} ${n === 1 ? 'shop' : 'shops'}</button></div>
  </form>`;
}
function campaignModal() {
  const editing = S.layer.id ? S.campaigns.get(S.layer.id) : null;
  const country = editing ? editing.country : fv('nc.country', 'United Kingdom');
  const cities = PLACES[country] || [];
  const city = editing ? editing.city : fv('nc.city', cities[0] || '');
  const lang = fv('nc.lang', LANG_BY_COUNTRY[country] || 'English');
  const where = editing ? `<p class="muted" style="margin:0">${esc(editing.city)}, ${esc(editing.country)}. To target another city, create a new campaign.</p>` : `
      <div class="field"><label for="nc-country">Country</label>${selectHtml('nc-country', 'data-k="nc.country" data-live="1"', [...Object.keys(PLACES).map((k) => [k, k]), ['__other', 'Another country']], country)}</div>
      <div class="field"><label for="nc-city">City</label>${country === '__other' ? `<input class="input" id="nc-city" data-k="nc.city" value="${esc(fv('nc.city', ''))}" placeholder="City">` : selectHtml('nc-city', 'data-k="nc.city" data-live="1"', [...cities.map((c) => [c, c]), ['__other', 'Another city']], city)}</div>
      ${country === '__other' ? `<div class="field"><label for="nc-country2">Country name</label><input class="input" id="nc-country2" data-k="nc.countryOther" value="${esc(fv('nc.countryOther', ''))}"></div>` : ''}
      ${country !== '__other' && city === '__other' ? `<div class="field"><label for="nc-city2">City name</label><input class="input" id="nc-city2" data-k="nc.cityOther" value="${esc(fv('nc.cityOther', ''))}"></div>` : ''}`;
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="nc-title" data-form="campaign">
    <div class="layer-head"><h2 id="nc-title">${editing ? `${esc(editing.city)} settings` : 'New city campaign'}</h2>${closeBtn()}</div>
    ${editing ? where : ''}
    <div class="grid2">
      ${editing ? '' : where}
      <div class="field"><label for="nc-lang">Message language</label>${selectHtml('nc-lang', 'data-k="nc.lang" data-live="1"', LANGS.map((l) => [l, l]), lang)}</div>
    </div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="lab" style="margin-bottom:6px">Buyer types to target</legend><div class="checks">${BUYER_TYPES.map(([k, label]) => `<label><input type="checkbox" id="nc-t-${k}" data-k="nc.t.${k}" ${fv('nc.t.' + k, true) ? 'checked' : ''}>${esc(label)}</label>`).join('')}</div></fieldset>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="lab" style="margin-bottom:6px">Product lines to offer</legend><div class="checks">${PRODUCT_LINES.map(([k, label]) => `<label><input type="checkbox" id="nc-p-${k}" data-k="nc.p.${k}" ${fv('nc.p.' + k, true) ? 'checked' : ''}>${esc(label)}</label>`).join('')}</div></fieldset>
    ${country === 'United Kingdom' ? '<p class="hint">UK emails offer 14K, 18K and 22K gold, because 10K is not a legal standard there.</p>' : ''}
    ${lang !== 'English' && !(settings().translations[lang]) ? `<p class="hint">Messages go out in English until you save a ${esc(lang)} translation on the Messages page.</p>` : ''}
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('check')}${editing ? 'Save settings' : 'Create campaign'}</button></div>
  </form>`;
}
function bizFormModal() {
  const L = S.layer; const editing = !!L.id; const b = editing ? S.businesses.get(L.id) : null; const c = b ? contactOf(b) : {};
  const camp = S.campaigns.get(b ? b.campaignId : L.campaignId); const isFair = !!(camp && camp.kind === 'fair');
  const v = (k, d) => fv('bf.' + k, d ?? '');
  const field = (k, label, d, type = 'text') => `<div class="field"><label for="bf-${k}">${label}</label><input class="input" id="bf-${k}" type="${type}" data-k="bf.${k}" value="${esc(v(k, d))}"></div>`;
  const ukForm = (b ? b.country : camp && camp.country) === UK;
  const title = editing ? `Edit ${esc(b ? b.name : 'buyer')}` : L.scanned ? 'Check the card' : isFair ? 'Add a contact' : 'Add a buyer';
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="bf-title" data-form="bizform">
    <div class="layer-head"><h2 id="bf-title">${title}</h2>${closeBtn()}</div>
    ${L.scanned ? '<p class="hint" style="margin:0">Claude read these details from the photo. Check them, especially the email and phone, before saving.</p>' : ''}
    <div class="grid2">
      ${field('name', 'Business name', b && b.name)}
      <div class="field"><label for="bf-type">Type</label>${selectHtml('bf-type', 'data-k="bf.type"', BUYER_TYPES, v('type', (b && b.type) || 'independent'))}</div>
      ${field('person', 'Contact person', c.person)}${field('email', 'Email', c.email, 'email')}
      ${field('phone', 'Phone', c.phone, 'tel')}${field('whatsapp', 'WhatsApp', c.whatsapp, 'tel')}
      ${isFair ? field('city', 'City', b && b.city) + field('country', 'Country', b && b.country) : ''}
      ${field('website', 'Website', c.website)}${field('instagram', 'Instagram handle or link', c.instagram)}
      ${field('facebook', 'Facebook page link', c.facebook)}${field('linkedin', 'LinkedIn link', c.linkedin)}
      ${ukForm ? `<div class="field"><label for="bf-legalForm">Company type</label>${selectHtml('bf-legalForm', 'data-k="bf.legalForm"', LEGAL_FORMS, v('legalForm', (b && b.legalForm) || ''), 'Not sure yet')}</div>${field('companyNo', 'Companies House number', b && b.companyNo)}` : ''}
    </div>
    ${ukForm ? `<p class="hint" style="margin:0">${esc(UK_EMAIL_RULE)}</p>` : ''}
    ${editing ? '' : `<div class="field"><label for="bf-notes">Notes</label><input class="input" id="bf-notes" data-k="bf.notes" value="${esc(v('notes'))}" placeholder="${isFair ? 'What they liked, what to send them' : 'Anything useful'}"></div>`}
    <label class="switch"><input type="checkbox" id="bf-lab" data-k="bf.labGrown" ${fv('bf.labGrown', !!(b && b.labGrown)) ? 'checked' : ''}>Already sells lab-grown diamonds</label>
    <label class="switch"><input type="checkbox" id="bf-wa" data-k="bf.waOptIn" ${fv('bf.waOptIn', !!(b && b.waOptIn)) ? 'checked' : ''}>They agreed to WhatsApp messages</label>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('check')}${editing ? 'Save changes' : isFair ? 'Add contact' : 'Add buyer'}</button></div>
  </form>`;
}
function fairModal() {
  const editing = S.layer.id ? S.campaigns.get(S.layer.id) : null;
  const upcoming = FAIRS.filter((x) => x.end >= todayStr());
  const key = editing ? editing.fairKey || '__other' : fv('nf.fair', upcoming[0] ? upcoming[0].key : '__other');
  const fair = FAIRS.find((x) => x.key === key);
  const role = fv('nf.role', editing ? editing.role || 'visiting' : 'visiting');
  const lang = fv('nf.lang', editing ? editing.language || 'English' : 'English');
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="nf-title" data-form="fair">
    <div class="layer-head"><h2 id="nf-title">${editing ? `${esc(editing.fairName)} settings` : 'New fair campaign'}</h2>${closeBtn()}</div>
    ${editing ? `<p class="muted" style="margin:0">${esc(fmtRange(editing.startDate, editing.endDate))} · ${esc(editing.city)}, ${esc(editing.country)}</p>` : `
    <div class="field"><label for="nf-fair">Fair</label>${selectHtml('nf-fair', 'data-k="nf.fair" data-live="1"', [...upcoming.map((x) => [x.key, `${x.name}, ${x.city} · ${fmtRange(x.start, x.end)}`]), ['__other', 'Another fair']], key)}</div>
    ${key === '__other' ? `<div class="grid2">
      <div class="field"><label for="nf-name">Fair name</label><input class="input" id="nf-name" data-k="nf.name" value="${esc(fv('nf.name'))}"></div>
      <div class="field"><label for="nf-city">City</label><input class="input" id="nf-city" data-k="nf.city" value="${esc(fv('nf.city'))}"></div>
      <div class="field"><label for="nf-country">Country</label><input class="input" id="nf-country" data-k="nf.country" value="${esc(fv('nf.country'))}"></div>
      <div class="field"><label for="nf-start">First day</label><input class="input" type="date" id="nf-start" data-k="nf.start" value="${esc(fv('nf.start'))}"></div>
      <div class="field"><label for="nf-end">Last day</label><input class="input" type="date" id="nf-end" data-k="nf.end" value="${esc(fv('nf.end'))}"></div>
    </div>` : fair ? `<p class="hint" style="margin-top:-8px">${esc([fair.venue, fair.who].filter(Boolean).join(' · '))}${fair.unconfirmed ? ' · dates not confirmed by the organiser yet' : ''}</p>` : ''}`}
    <div class="grid2">
      <div class="field"><span class="lab">You are</span>${seg('nfrole', role, [['visiting', 'Visiting'], ['exhibiting', 'Exhibiting']])}</div>
      ${role === 'exhibiting' ? `<div class="field"><label for="nf-booth">Booth or stand</label><input class="input" id="nf-booth" data-k="nf.booth" value="${esc(fv('nf.booth', editing ? editing.booth || '' : ''))}" placeholder="e.g. Hall 3, 3C-12"></div>` : ''}
      <div class="field"><label for="nf-lang">Message language</label>${selectHtml('nf-lang', 'data-k="nf.lang"', LANGS.map((l) => [l, l]), lang)}</div>
    </div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="lab" style="margin-bottom:6px">Product lines to offer</legend><div class="checks">${PRODUCT_LINES.map(([k, label]) => `<label><input type="checkbox" id="nf-p-${k}" data-k="nf.p.${k}" ${fv('nf.p.' + k, true) ? 'checked' : ''}>${esc(label)}</label>`).join('')}</div></fieldset>
    <p class="hint">At the fair, scan business cards into this campaign. Everyone you add gets the after-fair follow-up when you start it.</p>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('check')}${editing ? 'Save settings' : 'Create campaign'}</button></div>
  </form>`;
}
function quoteModal() {
  const d = S.quoteDraft; if (!d) return ''; const b = S.businesses.get(d.businessId); if (!b) return '';
  return `<form class="modal wide" role="dialog" aria-modal="true" aria-labelledby="q-title" data-form="quote">
    <div class="layer-head"><div><div class="eyebrow">${esc(b.name)} · ${esc([b.city, b.country].filter(Boolean).join(', '))}</div><h2 id="q-title">${d.number ? `Quote ${esc(d.number)}` : 'New quote'}</h2></div>${closeBtn()}</div>
    <div class="grid3">
      <div class="field"><label for="q-cur">Currency</label>${selectHtml('q-cur', 'data-q="currency"', CURRENCIES.map((x) => [x, x]), d.currency)}</div>
      <div class="field"><label for="q-inc">Terms</label>${selectHtml('q-inc', 'data-q="incoterm"', INCOTERMS.map(([k, l]) => [k, `${k}, ${l.toLowerCase()}`]), d.incoterm)}</div>
      <div class="field"><label for="q-valid">Valid until</label><input class="input" type="date" id="q-valid" data-q="validUntil" value="${esc(d.validUntil || '')}"></div>
    </div>
    <div class="qlines">
      <div class="qhead"><span>Item</span><span>Qty</span><span>Unit price</span><span class="num">Amount</span><span></span></div>
      ${d.lines.map((l, i) => `<div class="qline"><input class="input" id="ql-${i}-d" data-ql="${i}.desc" value="${esc(l.desc)}" placeholder="e.g. 18K ring, 1 ct lab-grown diamond" aria-label="Item ${i + 1}"><input class="input" id="ql-${i}-q" type="number" min="0" step="1" data-ql="${i}.qty" value="${esc(l.qty)}" aria-label="Quantity, item ${i + 1}"><input class="input" id="ql-${i}-p" type="number" min="0" step="0.01" data-ql="${i}.price" value="${esc(l.price)}" aria-label="Unit price, item ${i + 1}"><span class="num">${esc(num2((Number(l.qty) || 0) * (Number(l.price) || 0)))}</span><button type="button" class="btn small quiet" data-act="ql-remove" data-val="${i}" aria-label="Remove item ${i + 1}" ${d.lines.length < 2 ? 'disabled' : ''}>${ico('x')}</button></div>`).join('')}
      <div><button type="button" class="btn small" data-act="ql-add">${ico('plus')}Add an item</button></div>
    </div>
    <div class="grid3">
      <div class="field"><label for="q-ship">Shipping and insurance</label><input class="input" type="number" min="0" step="0.01" id="q-ship" data-q="shipping" value="${esc(d.shipping)}"></div>
      ${d.currency !== 'USD' ? `<div class="field"><label for="q-rate">1 ${esc(d.currency)} in US$, for reports</label><input class="input" type="number" min="0" step="0.0001" id="q-rate" data-q="usdRate" value="${esc(d.usdRate)}"></div>` : '<div></div>'}
      <div class="field"><span class="lab">Total</span><b class="qtotal">${esc(fmtMoney(quoteTotal(d), d.currency))}</b></div>
    </div>
    <div class="field"><label for="q-notes">Notes for the buyer</label><textarea class="input" id="q-notes" data-q="notes" style="min-height:70px" placeholder="Payment terms, delivery time, certificates">${esc(d.notes || '')}</textarea></div>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="button" class="btn" data-act="quote-save" data-val="draft">Save draft</button><button type="button" class="btn primary" data-act="quote-save" data-val="sent">${ico('check')}Save as sent</button></div>
  </form>`;
}
function sampleModal() {
  const b = S.businesses.get(S.layer.businessId); if (!b) return '';
  const sent = fv('sm.sentAt', todayStr());
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="sm-title" data-form="sample">
    <div class="layer-head"><div><div class="eyebrow">${esc(b.name)}</div><h2 id="sm-title">Samples sent</h2></div>${closeBtn()}</div>
    <div class="grid2">
      <div class="field"><label for="sm-date">Sent on</label><input class="input" type="date" id="sm-date" data-k="sm.sentAt" data-live="1" value="${esc(sent)}"></div>
      <div class="field"><label for="sm-pieces">What you sent</label><input class="input" id="sm-pieces" data-k="sm.pieces" value="${esc(fv('sm.pieces'))}" placeholder="e.g. 6 rings, 2 pendants"></div>
      <div class="field"><label for="sm-value">Value, US$</label><input class="input" type="number" min="0" id="sm-value" data-k="sm.value" value="${esc(fv('sm.value'))}"></div>
      <div class="field"><label for="sm-courier">Courier</label>${selectHtml('sm-courier', 'data-k="sm.courier"', COURIERS, fv('sm.courier', 'dhl'))}</div>
      <div class="field"><label for="sm-track">Tracking number</label><input class="input" id="sm-track" data-k="sm.tracking" value="${esc(fv('sm.tracking'))}"></div>
      <div class="field"><label for="sm-check">Check in with them on</label><input class="input" type="date" id="sm-check" data-k="sm.checkAt" value="${esc(fv('sm.checkAt', addDays(sent, Number(settings().rules.sampleCheckDays) || 7)))}"></div>
    </div>
    <div class="field"><label for="sm-notes">Notes</label><input class="input" id="sm-notes" data-k="sm.notes" value="${esc(fv('sm.notes'))}" placeholder="Memo terms, return date"></div>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('check')}Save</button></div>
  </form>`;
}
function bcFromForm() {
  const camp = S.campaigns.get(fv('bc.fair'));
  return { channel: fv('bc.channel', 'email'), subject: fv('bc.subject'), body: fv('bc.body'), season: fv('bc.season'), fairName: camp ? camp.fairName : '', booth: camp ? camp.booth || '' : '', fairDates: camp ? fmtRange(camp.startDate, camp.endDate) : '' };
}
function bcAudience() {
  const countries = [...new Set(allBiz().map((b) => b.country).filter(Boolean))].filter((x) => fv('bc.c.' + x, false));
  return { segment: fv('bc.segment', 'leads'), countries, channel: fv('bc.channel', 'email') };
}
function broadcastModal() {
  const ch = fv('bc.channel', 'email'); const season = SEASONS.find((x) => x.key === fv('bc.season')); const fairCamp = S.campaigns.get(fv('bc.fair'));
  const countries = [...new Set(allBiz().map((b) => b.country).filter(Boolean))].sort();
  const list = audienceList(bcAudience()); const busy = S.ai.busy === 'bc'; const first = list[0];
  const preview = first && String(fv('bc.body')).trim() ? broadcastText(bcFromForm(), first) : null;
  const issues = preview ? complianceIssues(`${preview.subject || ''}\n${preview.body}`, first.country) : [];
  return `<form class="modal wide" role="dialog" aria-modal="true" aria-labelledby="bc-title" data-form="broadcast">
    <div class="layer-head"><div>${season ? `<div class="eyebrow">${esc(season.name)} · ${esc(fmtDate(season.date))}</div>` : fairCamp ? `<div class="eyebrow">${esc(fairCamp.fairName)} · ${esc(fmtRange(fairCamp.startDate, fairCamp.endDate))}</div>` : ''}<h2 id="bc-title">New broadcast</h2></div>${closeBtn()}</div>
    <div class="grid2">
      <div class="field"><label for="bc-name">Name</label><input class="input" id="bc-name" data-k="bc.title" value="${esc(fv('bc.title'))}"></div>
      <div class="field"><span class="lab">Send by</span>${seg('bcch', ch, [['email', 'Email'], ['whatsapp', 'WhatsApp']])}</div>
      <div class="field"><label for="bc-seg">Who gets it</label>${selectHtml('bc-seg', 'data-k="bc.segment" data-live="1"', SEGMENTS, fv('bc.segment', 'leads'))}</div>
    </div>
    ${countries.length > 1 ? `<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="lab" style="margin-bottom:6px">Countries (none ticked means all)</legend><div class="checks">${countries.map((x, i) => `<label><input type="checkbox" id="bc-c-${i}" data-k="bc.c.${esc(x)}" data-live="1" ${fv('bc.c.' + x, false) ? 'checked' : ''}>${esc(x)}</label>`).join('')}</div></fieldset>` : ''}
    <p class="${list.length ? 'muted' : 'warnline'}" style="margin:0">${list.length ? `<b>${list.length}</b> ${list.length === 1 ? 'buyer gets' : 'buyers get'} this${ch === 'whatsapp' ? ', all of them opted in to WhatsApp' : ''}. Unsubscribed and do-not-contact buyers are left out.` : `Nobody matches yet.${ch === 'whatsapp' ? ' WhatsApp goes only to buyers who opted in.' : ''}`}</p>
    ${ch === 'email' ? `<div class="field"><label for="bc-subject">Subject</label><input class="input" id="bc-subject" data-k="bc.subject" data-quiet="1" value="${esc(fv('bc.subject'))}"></div>` : ''}
    <div class="field"><label for="bc-body">Message</label><textarea class="input" id="bc-body" data-k="bc.body" data-quiet="1">${esc(fv('bc.body'))}</textarea></div>
    <div class="actions">${aiAvailable() ? `<button type="button" class="btn" data-act="bc-ai" ${busy ? 'disabled' : ''}>${ico('spark')}${busy ? 'Claude is writing…' : 'Write with Claude'}</button>` : ''}<span class="hint">Placeholders: {{contact}} {{business}} {{catalogue_link}} {{sender}} {{company}}${season ? ' {{season}} {{season_date}}' : ''}${fairCamp ? ' {{fair}} {{fair_dates}} {{booth}}' : ''}</span></div>
    ${preview ? `<div class="panel"><h3>Preview for ${esc(first.name)}</h3>${preview.subject ? `<div class="subj">${esc(preview.subject)}</div>` : ''}<div class="msg" style="max-height:14em">${esc(preview.body)}</div>${issues.length ? `<div class="warnline">${ico('alert')}${esc(issues.join(' · '))}</div>` : ''}</div>` : ''}
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary" ${list.length ? '' : 'disabled'}>${ico('check')}Create broadcast</button></div>
  </form>`;
}
function bcDetail(bc) {
  const st = bcStats(bc); const recs = (bc.recipients || []).map((r) => ({ r, b: S.businesses.get(r.id) })).filter((x) => x.b);
  const pending = recs.filter((x) => !x.r.at); const done = recs.filter((x) => x.r.at);
  return `<div class="drawer" role="dialog" aria-modal="true" aria-label="${esc(bc.title)}">
    <div class="layer-head"><div><div class="eyebrow">Broadcast · ${esc(CH_LABEL[bc.channel] || bc.channel)} · ${esc(SEGMENT_LABEL[(bc.audience || {}).segment] || '')}</div><h2>${esc(bc.title)}</h2><div class="chips"><span class="chip">${st.sent} of ${st.total} sent</span><span class="chip good">${st.replied} replied</span>${exChip(bc)}</div></div>${closeBtn()}</div>
    <p class="hint" style="margin:0">${bc.channel === 'email' ? "Email isn't connected yet: copy each message into your mail app, send it, then mark it sent. Once email is connected, the app sends these by itself." : 'Open WhatsApp for each buyer with the message filled in, send it, then mark it sent.'} A reply within 14 days counts for this broadcast.</p>
    ${pending.length > 1 ? `<div class="actions"><button class="btn small" data-act="bc-all" data-id="${esc(bc.id)}">${ico('check')}Mark all ${pending.length} as sent</button></div>` : ''}
    <section class="panel"><h3>To send · ${pending.length}</h3>${pending.length ? pending.map((x) => bcRow(bc, x.b)).join('') : '<p class="hint">All sent.</p>'}</section>
    ${done.length ? `<section class="panel"><h3>Done · ${done.length}</h3>${done.map((x) => `<div class="meta"><button class="linkish" data-act="open-biz" data-id="${esc(x.b.id)}">${esc(x.b.name)}</button><span>${x.r.how === 'skipped' ? 'Skipped' : 'Sent ' + esc(fmtWhen(x.r.at))}</span>${inbound(x.b).some((m) => String(m.at) > String(x.r.at)) ? '<span class="chip good">Replied</span>' : ''}</div>`).join('')}</section>` : ''}
    <div class="actions">${confirmBtn('bc:' + bc.id, 'Delete broadcast', 'Click again to delete', 'bc-delete', `data-id="${esc(bc.id)}"`)}</div>
  </div>`;
}
function bcRow(bc, b) {
  const m = broadcastText(bc, b); const c = contactOf(b);
  const link = bc.channel === 'whatsapp' ? waUrl(c.whatsapp || c.phone, m.body) : '';
  return `<div class="srow"><div class="stack"><div class="title-row"><button class="linkish" data-act="open-biz" data-id="${esc(b.id)}">${esc(b.name)}</button><span class="sub">${esc([b.city, b.country].filter(Boolean).join(', '))}</span></div>
    <div class="meta"><span class="mono sel">${esc(bc.channel === 'email' ? c.email : c.whatsapp || c.phone)}</span></div>${m.subject ? `<div class="subj">${esc(m.subject)}</div>` : ''}</div>
    <div class="actions"><button class="btn small" data-act="bc-copy" data-id="${esc(bc.id)}" data-biz="${esc(b.id)}">${ico('copy')}Copy</button>${link ? `<a class="btn small" href="${esc(link)}" target="_blank" rel="noopener">${ico('ext')}Open WhatsApp</a>` : ''}<button class="btn small primary" data-act="bc-mark" data-id="${esc(bc.id)}" data-biz="${esc(b.id)}" data-how="sent">${ico('check')}Sent</button><button class="btn small quiet" data-act="bc-mark" data-id="${esc(bc.id)}" data-biz="${esc(b.id)}" data-how="skipped">Skip</button></div></div>`;
}
function replyModal() {
  const fixed = S.layer.id && S.businesses.get(S.layer.id);
  const groups = {};
  if (!fixed) for (const b of allBiz().filter((x) => !['found', 'rejected'].includes(x.status)).sort((a, b) => a.name.localeCompare(b.name))) (groups[`${b.city}, ${b.country}`] ||= []).push(b);
  const bizSel = fixed ? `<p><b>${esc(fixed.name)}</b> <span class="sub">${esc(fixed.city)}, ${esc(fixed.country)}</span></p>`
    : `<div class="field"><label for="rp-biz">Buyer</label><select class="input" id="rp-biz" data-k="rp.biz"><option value="">Choose the buyer who replied</option>${Object.entries(groups).sort().map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((b) => `<option value="${esc(b.id)}" ${fv('rp.biz') === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>`;
  const busy = S.ai.busy === 'tag';
  return `<form class="modal" role="dialog" aria-modal="true" aria-labelledby="rp-title" data-form="reply">
    <div class="layer-head"><h2 id="rp-title">Log a reply</h2>${closeBtn()}</div>
    ${bizSel}
    <div class="grid2"><div class="field"><label for="rp-ch">Channel</label>${selectHtml('rp-ch', 'data-k="rp.ch"', Object.entries(CH_LABEL), fv('rp.ch', 'email'))}</div>
      <div class="field"><label for="rp-at">When</label><input class="input" type="datetime-local" id="rp-at" data-k="rp.at" value="${esc(fv('rp.at', localDateTime(new Date())))}"></div></div>
    <div class="field"><label for="rp-text">Their message</label><textarea class="input" id="rp-text" data-k="rp.text" placeholder="Paste what they wrote">${esc(fv('rp.text'))}</textarea></div>
    <div class="grid2"><div class="field"><label for="rp-tag">What they want</label>${selectHtml('rp-tag', 'data-k="rp.tag"', TAGS, fv('rp.tag', 'interested'))}</div>
      <div class="field"><span class="lab">Sort it for me</span>${aiAvailable() ? `<button type="button" class="btn" data-act="ai-tag" ${busy ? 'disabled' : ''}>${ico('spark')}${busy ? 'Claude is reading…' : 'Sort with Claude'}</button>` : (onPhone() ? '<span class="hint">Pick the label yourself.</span>' : '<span class="hint">Works when this page runs inside Claude.</span>')}</div></div>
    ${fv('rp.summary') ? `<p class="hint">Claude: ${esc(fv('rp.summary'))}</p>` : ''}
    <p class="hint">Saving stops the sequence for this buyer, moves them to Leads and starts reminders. A WhatsApp reply also counts as opt-in.</p>
    <div class="actions" style="justify-content:flex-end"><button type="button" class="btn quiet" data-act="close-layer">Cancel</button><button type="submit" class="btn primary">${ico('check')}Save reply</button></div>
  </form>`;
}
function localDateTime(d) { return `${toDateStr(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }

/* ================= AI (Claude) ================= */
const aiAvailable = () => !!S.ai.sample && !S.ai.off;
function aiError(e) {
  const c = e && e.code;
  if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'tools_unavailable'].includes(c)) { S.ai.off = true; toast("Claude isn't allowed on this page, so AI help is hidden."); }
  else if (c === 'rate_limited') toast('Claude is busy right now. Try again in a minute.');
  else if (c === 'cancelled') { /* stopped by you */ }
  else if (c === 'refused') toast("Claude couldn't help with that message.");
  else if (c === 'session_expired') toast('Sign in to Claude again to use AI help.');
  else toast("Claude didn't finish. Try again.");
}
function companyBrief(country) {
  const co = settings().company;
  return `${co.senderName || 'the sender'} at ${co.name || 'an Indian jewellery manufacturer'}, which makes jewellery set with CVD ${labTerm(country)} diamonds: 925 sterling silver (plain, or plated with ${platingKarats(country)} gold) and solid ${goldKarats(country).replace(' and ', ' or ')} gold, with moissanite made to order`;
}
async function aiTag() {
  if (!aiAvailable()) return;
  const id = S.layer && (S.layer.id || fv('rp.biz')); const b = id && S.businesses.get(id); const text = String(fv('rp.text')).trim();
  if (!text) { toast('Paste their message first.'); return; }
  S.ai.busy = 'tag'; schedule();
  const prompt = `You sort replies to cold outreach from a lab-grown diamond jewellery manufacturer.
Reply with only JSON: {"tag": one of ["interested","price","samples","not_now","not_interested","unsubscribe","other"], "summary": "what they want in at most 12 words"}.
Use "unsubscribe" when they ask not to be contacted again.
Buyer: ${b ? `${b.name}, ${TYPE_LABEL[b.type] || ''}, ${b.city}, ${b.country}` : 'unknown'}. Channel: ${CH_LABEL[fv('rp.ch', 'email')]}.
Their message:
"""${text.slice(0, 6000)}"""`;
  try {
    const res = await S.ai.sample.json(prompt, { modelTier: 'quick' });
    const tag = res && TAG_LABEL[res.tag] ? res.tag : 'other';
    S.form['rp.tag'] = tag; S.form['rp.summary'] = String((res && res.summary) || '').slice(0, 160);
  } catch (e) { aiError(e); }
  finally { S.ai.busy = ''; schedule(); }
}
async function aiDraft(id) {
  if (!aiAvailable()) return;
  const b = S.businesses.get(id); if (!b) return;
  const l = b.lead || {}; const lang = (campOf(b) || {}).language || 'English';
  const thread = (b.messages || []).slice(-8).map((m) => `${m.dir === 'in' ? 'Buyer' : 'Us'} (${CH_LABEL[m.channel] || m.channel}): ${String(m.text).slice(0, 1200)}`).join('\n');
  const prompt = `Draft a reply for ${companyBrief(b.country)}.
Rules: always write "${labTerm(b.country)} diamond", never "diamond" alone${b.country === UK ? ' and never the short form "lab-grown"' : ''}; do not invent prices, minimum orders, delivery times or discounts, write [price], [MOQ] or [delivery time] where they are needed; no green claims such as "eco-friendly"; under 120 words; write in ${lang}; sign as ${settings().company.senderName || '[your name]'}.
Channel: ${CH_LABEL[l.lastChannel] || 'Email'}. For WhatsApp, Instagram or Facebook keep it short and friendly; for email include a greeting and sign-off but no subject line.
Buyer: ${b.name} (${TYPE_LABEL[b.type] || 'jeweller'}) in ${b.city}, ${b.country}.
Conversation so far, oldest first:
${thread}
Write only the reply text.`;
  S.ai.ctl = new AbortController(); S.ai.busy = 'draft:' + id; S.form['draft.' + id] = ''; schedule();
  try {
    const res = await S.ai.sample(prompt, { signal: S.ai.ctl.signal, cache: false, onText: ({ text }) => { S.form['draft.' + id] = text; const ta = document.getElementById('draft-' + id); if (ta) ta.value = text; } });
    S.form['draft.' + id] = res.text;
    if (res.truncated) toast('The draft was cut short. Edit it before sending.');
  } catch (e) { if (e && e.text) S.form['draft.' + id] = e.text; aiError(e); }
  finally { S.ai.busy = ''; S.ai.ctl = null; schedule(); }
}
async function aiTranslate() {
  if (!aiAvailable()) return;
  const lang = fv('tr.lang', 'German'); const steps = allSteps();
  const items = steps.map((s) => ({ id: s.id, subject: s.subject || '', body: s.body || '', alt: s.alt || '' }));
  const prompt = `Translate these outreach messages from English into ${lang} for jewellery retailers.
Keep every {{placeholder}} exactly as written, keep the line breaks, use the standard ${lang} term for "lab-grown diamond", and add no green claims.
Reply with only a JSON array of {"id": string, "subject": string, "body": string, "alt": string} in the same order; leave a field empty when the source is empty.
Messages:
${JSON.stringify(items)}`;
  S.ai.busy = 'tr'; schedule();
  try {
    const res = await S.ai.sample.json(prompt);
    const arr = Array.isArray(res) ? res : [];
    const out = items.map((it) => { const t = arr.find((x) => x && x.id === it.id) || {}; return { id: it.id, subject: String(t.subject || ''), body: String(t.body || ''), alt: String(t.alt || '') }; });
    if (!out.some((x) => x.body)) throw { code: 'upstream_error' };
    S.trDraft = { lang, items: out };
  } catch (e) { aiError(e); }
  finally { S.ai.busy = ''; schedule(); }
}
function cardPrompt(c) {
  return `This photo shows one business card that a buyer handed to a lab-grown diamond jewellery manufacturer${c.kind === 'fair' ? ` at ${c.fairName || 'a trade fair'}` : ''}.
Read it and reply with only JSON: {"company": "", "person": "", "title": "", "email": "", "phone": "", "whatsapp": "", "website": "", "instagram": "", "city": "", "country": "", "type": "", "notes": ""}.
"type" is one of independent, chain, manufacturer, wholesaler, online, bridal, gift: your best guess from the card. "country" is the English name of the country. "notes" holds anything else useful, such as other branches or what they sell. Use "" for anything that is not on the card, and never invent details.
If the photo is not a business card, reply {"error": "not a card"}.`;
}
function cardToBuyer(r, c) {
  const t = (v) => String(v || '').trim().slice(0, 300);
  const type = BUYER_TYPES.some(([k]) => k === r.type) ? r.type : 'independent';
  return {
    name: t(r.company) || t(r.person), type, labGrown: false,
    city: t(r.city) || (c.kind === 'fair' ? '' : c.city), country: t(r.country) || (c.kind === 'fair' ? '' : c.country),
    notes: [t(r.title), t(r.notes)].filter(Boolean).join(' · '),
    contact: { person: t(r.person), email: t(r.email).toLowerCase(), phone: t(r.phone), whatsapp: t(r.whatsapp), website: t(r.website), instagram: t(r.instagram), facebook: '', linkedin: '' },
  };
}
async function aiScanCards(cid, files) {
  const c = S.campaigns.get(cid); if (!c) return;
  if (!canScan()) { toast("Card scanning isn't available in this view."); return; }
  const types = S.ai.images.mediaTypes || [];
  const list = files.filter((f) => !types.length || types.includes(f.type)).slice(0, 40);
  if (!list.length) { toast('Choose a JPEG, PNG or WebP photo of the card.'); return; }
  S.ai.busy = 'scan'; schedule();
  let added = 0, skipped = 0, failed = 0, single = null;
  for (let i = 0; i < list.length; i++) {
    if (list.length > 1) toast(`Reading card ${i + 1} of ${list.length}…`);
    try {
      const res = await S.ai.sample.json(cardPrompt(c), { images: list[i] });
      if (!res || res.error || !(res.company || res.person || res.email)) { failed++; continue; }
      const o = cardToBuyer(res, c);
      if (list.length === 1) { single = o; break; }
      if (o.contact.email && (isSuppressed(o.contact.email) || findByEmail(o.contact.email))) { skipped++; continue; }
      if (await write(() => Data.set('businesses', Data.newId('businesses'), newBiz({ ...o, campaignId: c.id, source: 'card', status: 'found', metAt: c.kind === 'fair' ? c.fairName : '' })))) added++;
    } catch (e) {
      aiError(e);
      if (S.ai.off || (e && ['rate_limited', 'cancelled', 'images_unavailable'].includes(e.code))) break;
      failed++;
    }
  }
  S.ai.busy = ''; schedule();
  if (single) {
    const k = single.contact;
    S.form = { 'bf.name': single.name, 'bf.type': single.type, 'bf.person': k.person, 'bf.email': k.email, 'bf.phone': k.phone, 'bf.whatsapp': k.whatsapp, 'bf.website': k.website, 'bf.instagram': k.instagram, 'bf.city': single.city, 'bf.country': single.country, 'bf.notes': single.notes, 'bf.waOptIn': false };
    openLayer({ kind: 'bizform', campaignId: c.id, scanned: true });
    return;
  }
  if (list.length > 1) { S.filters.city.tab = 'review'; toast(`${added} ${added === 1 ? 'card' : 'cards'} added to review${skipped ? `, ${skipped} already listed or on do-not-contact` : ''}${failed ? `, ${failed} couldn't be read` : ''}.`); }
  else if (failed) toast("That photo didn't look like a business card. Try a sharper, closer photo.");
}
async function aiPosts(key) {
  if (!aiAvailable()) return;
  const x = SEASONS.find((y) => y.key === key); if (!x) return;
  const prompt = `Write 5 social media posts for ${companyBrief()}. They go on the company's own Instagram, LinkedIn and Facebook pages and speak to jewellery retailers and wholesalers (business buyers, not consumers) who are planning stock for ${x.name} on ${fmtDate(x.date)} in ${countryList(x.countries, 8)}.
Mix: 2 Instagram, 2 LinkedIn, 1 Facebook. Each post: a hook in the first line, under 90 words, and a clear call to action to message for the wholesale catalogue. No prices, no discounts, always "lab-grown diamond" and never "diamond" alone, and no green claims such as "eco-friendly" or "sustainable".
Reply with only a JSON array of {"platform": "Instagram" or "LinkedIn" or "Facebook", "caption": string, "hashtags": [up to 8 strings without #], "visual": "the photo or short video to post with it"}.`;
  S.ai.busy = 'posts:' + key; schedule();
  try {
    const res = await S.ai.sample.json(prompt);
    const arr = (Array.isArray(res) ? res : []).filter((p) => p && p.caption).slice(0, 6);
    if (!arr.length) throw { code: 'upstream_error' };
    for (const p of arr) {
      const doc = { platform: ['Instagram', 'LinkedIn', 'Facebook'].includes(p.platform) ? p.platform : 'Instagram', caption: String(p.caption).slice(0, 2200), hashtags: (Array.isArray(p.hashtags) ? p.hashtags : []).map((h) => String(h).replace(/^#/, '').replace(/\s+/g, '')).filter(Boolean).slice(0, 10), visual: String(p.visual || '').slice(0, 300), season: key, createdAt: nowIso(), status: 'idea', postedAt: null, isExample: false };
      await write(() => Data.set('posts', Data.newId('posts'), doc));
    }
    S.filters.posts = 'idea';
    toast(`${arr.length} post ideas for ${x.name} added below`);
  } catch (e) { aiError(e); }
  finally { S.ai.busy = ''; schedule(); }
}
async function aiBroadcastText() {
  if (!aiAvailable()) return;
  const f = bcFromForm(); const x = SEASONS.find((y) => y.key === f.season); const segLabel = (SEGMENT_LABEL[fv('bc.segment', 'leads')] || '').toLowerCase();
  const title = String(fv('bc.title')).trim();
  const purpose = x ? `a ${x.name} offer. ${x.name} is on ${fmtDate(x.date)} and retailers are planning stock for it now` : f.fairName ? `an invitation to meet at ${f.fairName} (${f.fairDates})${f.booth ? `, booth ${f.booth}` : ''}` : title ? `this message: "${title}"` : 'sharing our new designs';
  const ph = ['{{contact}} for their first name', '{{business}} for their store', '{{catalogue_link}}', '{{sender}}', ...(x ? ['{{season}}', '{{season_date}}'] : []), ...(f.fairName ? ['{{fair}}', '{{fair_dates}}', ...(f.booth ? ['{{booth}}'] : [])] : [])];
  const prompt = `Write a ${f.channel === 'whatsapp' ? 'WhatsApp message under 60 words, with no subject' : 'short email under 120 words, with a subject line'} from ${companyBrief()} to jewellery retailers and wholesalers who already know us (${segLabel}).
Purpose: ${purpose}.
Use these placeholders exactly as written where they fit: ${ph.join(', ')}.
Rules: always write "lab-grown diamond", never "diamond" alone; no prices, discounts or delivery promises; no green claims such as "eco-friendly"; friendly and specific, with one clear ask at the end.
Reply with only JSON: {"subject": string, "body": string}.`;
  S.ai.busy = 'bc'; schedule();
  try {
    const res = await S.ai.sample.json(prompt);
    if (!res || !res.body) throw { code: 'upstream_error' };
    if (f.channel === 'email' && res.subject) S.form['bc.subject'] = String(res.subject).slice(0, 200);
    S.form['bc.body'] = String(res.body).slice(0, 4000);
  } catch (e) { aiError(e); }
  finally { S.ai.busy = ''; schedule(); }
}
async function aiAdvice() {
  if (!aiAvailable()) return;
  const list = reportList(); const byCountry = computeReport(list, 'country'); const t = totalsOf(byCountry); const today = todayStr();
  const pick = (r) => ({ found: r.found, contacted: r.contacted, replied: r.replied, replyRatePct: r.rate == null ? null : Math.round(r.rate * 100), interested: r.interested, orders: r.orders, revenueUsd: Math.round(r.revenue) });
  const chans = {}; const types = {}; const steps = {};
  for (const b of list) {
    const first = inbound(b).sort((x, y) => String(x.at).localeCompare(String(y.at)))[0]; if (first) chans[first.channel] = (chans[first.channel] || 0) + 1;
    if (contacted(b)) { const k = TYPE_LABEL[b.type] || b.type; types[k] = types[k] || { contacted: 0, replied: 0 }; types[k].contacted++; if (inbound(b).length) types[k].replied++; }
    const a = b.lead && b.lead.afterStep; if (a) { const k = `${SEQ_SHORT[a.kind] || ''}day ${a.day} ${a.title}`; steps[k] = (steps[k] || 0) + 1; }
  }
  const data = {
    today, totals: pick(t), waitingForYourReply: allBiz().filter(needsReply).length, hoursYouTakeToReply: t.avgHours == null ? null : Math.round(t.avgHours * 10) / 10,
    countries: byCountry.slice(0, 12).map((r) => ({ country: r.country, ...pick(r) })),
    cities: computeReport(list, 'city').slice(0, 12).map((r) => ({ city: r.city, country: r.country, ...pick(r) })),
    firstReplyChannel: chans, replyByBuyerType: types, repliesAfterStep: steps,
    subjectTests: abRows(list).map(({ step, v }) => ({ step: step.title, A: v.A, B: v.B })),
    openQuotesUsd: Math.round([...S.quotes.values()].filter((q) => q.status === 'sent').reduce((a, q) => a + quoteUsd(q), 0)),
    samplesOut: [...S.samples.values()].filter((x) => ['sent', 'delivered', 'kept'].includes(x.status)).length,
    seasonsInOrderingWindow: SEASONS.filter((x) => seasonPhase(x) === 'now').map((x) => `${x.name} ${x.date}`),
    fairsInNext90Days: FAIRS.filter((x) => x.start >= today && x.start <= addDays(today, 90)).map((x) => `${x.name}, ${x.city}, ${x.start}`),
    campaigns: [...S.campaigns.values()].map((c) => `${c.kind === 'fair' ? 'fair ' + c.fairName : 'city ' + c.city}: ${campaignPhase(c).label}`),
  };
  const prompt = `You advise ${companyBrief()}. They sell to jewellery retailers, chains and wholesalers abroad through email, WhatsApp, Instagram and LinkedIn follow-ups, trade fairs and seasonal offers.
Here are their current results and calendar as JSON. Suggest 4 to 6 concrete actions for the next two weeks, one per line, each starting with a verb and naming the city, country, buyer type, channel, message, season or fair it concerns. Base them only on this data. If there is too little data to judge, say what to do first to get it. Plain text, no headings, no markdown.

${JSON.stringify(data)}`;
  S.ai.ctl = new AbortController(); S.ai.busy = 'advice'; S.ai.advice = ''; schedule();
  try {
    const res = await S.ai.sample(prompt, { signal: S.ai.ctl.signal, cache: false, onText: ({ text }) => { S.ai.advice = text; const el = document.getElementById('advice-text'); if (el) el.textContent = text; } });
    S.ai.advice = res.text;
  } catch (e) { if (e && e.text) S.ai.advice = e.text; aiError(e); }
  finally { S.ai.busy = ''; S.ai.ctl = null; schedule(); }
}

/* ================= actions ================= */
let toastTimer = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove(); toast(ok ? 'Copied' : 'Select the text and copy it yourself');
  }
}
async function saveFile(filename, data) {
  if (!S.downloads) { toast("Downloads aren't available in this view."); return; }
  try { await S.downloads.save({ filename, data }); }
  catch (e) { if (e && e.code === 'declined') return; toast(e && e.code === 'rate_limited' ? 'A download is already waiting for your answer.' : "The file couldn't be saved here."); }
}
let returnFocus = null;
const DRAWERS = ['biz', 'bcast', 'order'];
function openLayer(L) {
  if (!S.layer) returnFocus = document.activeElement;
  // From a drawer, remember where to go back to: buyer, then order, then the order form.
  if (S.layer && DRAWERS.includes(S.layer.kind) && !(S.layer.kind === L.kind && S.layer.id === L.id) && !(S.layer.kind === 'biz' && L.kind === 'biz')) L.back = { kind: S.layer.kind, id: S.layer.id, ...(S.layer.back ? { back: S.layer.back } : {}) };
  S.layer = L; S.confirmKey = ''; render();
  const first = DRAWERS.includes(L.kind) ? $('#layer [data-act="close-layer"]') : $('#layer input:not([type=hidden]), #layer select, #layer textarea, #layer button');
  if (first) first.focus();
}
function closeLayer() {
  if (S.ai.ctl) S.ai.ctl.abort();
  const back = S.layer && S.layer.back; if (S.layer && S.layer.kind === 'quote') S.quoteDraft = null; if (S.layer && S.layer.kind === 'orderform') S.orderDraft = null;
  const live = (L) => !!L && (L.kind === 'biz' ? S.businesses.get(L.id) : L.kind === 'bcast' ? S.broadcasts.get(L.id) : L.kind === 'order' ? S.orders.get(L.id) : null);
  S.layer = live(back) ? back : null; if (!S.layer || S.layer.kind !== 'order') S.ui.orderPanel = ''; render();
  if (!S.layer && returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  if (!S.layer) returnFocus = null;
}
function armed(key) {
  if (S.confirmKey === key) { S.confirmKey = ''; return true; }
  S.confirmKey = key; render(); setTimeout(() => { if (S.confirmKey === key) { S.confirmKey = ''; render(); } }, 5000);
  return false;
}
const CONFIRM_ACTS = ['team-remove', 'delete-campaign', 'delete-biz', 'remove-examples', 'seq-reset', 'bc-delete', 'ans-delete', 'pay-delete', 'order-cancel', 'order-delete', 'price-delete', 'trip-delete'];
async function removeBuyer(bid) {
  for (const q of quotesOf(bid)) await write(() => Data.remove('quotes', q.id));
  for (const x of samplesOf(bid)) await write(() => Data.remove('samples', x.id));
  return write(() => Data.remove('businesses', bid));
}
function setPath(obj, path, value) { const keys = path.split('.'); let o = obj; for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]]; o[keys[keys.length - 1]] = value; }

// Instagram, Facebook and LinkedIn can't take a ready message, so it goes to the clipboard as the app opens
function copyStepFor(spec) {
  const [bid, sid] = String(spec).split(':'); const b = S.businesses.get(bid); const step = b && stepsFor(seqKindOf(b)).find((x) => x.id === sid); if (!step) return;
  const ch = effectiveChannel(step, b); const text = stepText(b, step, ch);
  try { navigator.clipboard.writeText(text).then(() => toast(`Message copied. Paste it in ${CH_LABEL[ch] || 'the app'}.`), () => {}); } catch { /* the app opens anyway */ }
}
async function onClick(e) {
  // an open ⋯ menu closes on any tap outside it, and after any choice inside it
  if (S.ui.menu && !e.target.closest('[data-act="menu"]') && (!e.target.closest('.menu-acts') || e.target.closest('[data-act], a[href]'))) { S.ui.menu = ''; schedule(); }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act; const id = el.dataset.id;
  if (act === 'layer-bg') { if (e.target === el) closeLayer(); return; }
  if (act === 'mail-open' && el.dataset.copy) copyStepFor(el.dataset.copy);
  if (act === 'mail-open') { const fresh = el.dataset.mail ? mailFor(el.dataset.mail) : ''; if (fresh) el.href = fresh; if (el.dataset.key) { S.mailOpened.add(el.dataset.key); setTimeout(schedule, 700); } return; }
  if (el.tagName === 'A' && act !== 'go') return;
  if (S.confirmKey && !CONFIRM_ACTS.includes(act)) S.confirmKey = '';
  switch (act) {
    case 'go': location.hash = el.dataset.href; break;
    case 'menu': {
      const k = el.dataset.key; S.ui.menu = S.ui.menu === k ? '' : k; render();
      const first = S.ui.menu ? $('.menu-acts [data-act], .menu-acts a[href]') : $(`[data-act="menu"][data-key="${CSS.escape(k)}"]`); if (first) first.focus({ preventScroll: true });
      break;
    }
    case 'focus-open': S.form = {}; openLayer({ kind: 'focus' }); break;
    case 'jump': { const t = document.getElementById(el.dataset.target); if (t) t.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); break; }
    case 'work-on': {
      const city = el.dataset.city || '';
      if (await setFocus({ country: el.dataset.country || '', city })) {
        if (S.layer && S.layer.kind === 'focus') { S.layer = null; S.form = {}; }
        if (city && location.hash !== '#showrooms') location.hash = '#showrooms'; else render();
        startCityResearch(el.dataset.country || '', city);
      }
      break;
    }
    case 'find-stop': if (S.find.ctl) S.find.ctl.abort(); break;
    case 'research-start': {
      const k = el.dataset.key; const d = S.places.get(k); if (!d) break;
      if (!S.loaded.research) { toast('Still loading. Try again in a moment.'); break; }
      const n = await afterScan(k, false);
      if (researchOf(k)) toast(n ? `${n} ${n === 1 ? 'showroom' : 'showrooms'} saved to Leads. Claude starts on ${d.city} within the hour.` : `Claude will start on ${d.city} within the hour`);
      break;
    }
    case 'research-again': {
      const k = el.dataset.key; const d = S.places.get(k); if (!d) break; const now = nowIso();
      if (await write(() => Data.set('research', k, { city: d.city, country: d.country, status: 'queued', requestedAt: now, updatedAt: now, results: {}, online: {}, onlineDone: false, more: (researchOf(k) || {}).more || {}, moreDone: false }))) toast(`Claude will check every shop in ${d.city} again, starting within the hour`);
      break;
    }
    case 'research-stop': if (await write(() => Data.update('research', el.dataset.key, { status: 'stopped', updatedAt: nowIso() }))) toast('Stopped. What Claude found so far stays.'); break;
    case 'research-continue': if (await write(() => Data.update('research', el.dataset.key, { status: 'queued', updatedAt: nowIso() }))) toast('Claude will carry on within the hour'); break;
    case 'places-retry': { const f = focusNow(); if (f.city) findShowrooms(f.country, f.city, true); break; }
    case 'places-refresh': { const d = S.places.get(el.dataset.key); if (d) { toast(`Rescanning ${d.city}: the map now, then Claude checks every shop again`); findShowrooms(d.country, d.city, true); } break; }
    case 'places-add': {
      const d = S.places.get(el.dataset.key); const n = await addShops(el.dataset.key, [id]);
      if (n) toast('Saved to Leads');
      break;
    }
    case 'places-add-all': {
      const d = S.places.get(el.dataset.key); if (!d) break;
      const ids = showroomReport(d).ind.filter((x) => !x.b && !x.s.closed).map((x) => x.s.id); el.disabled = true;
      const n = await addShops(el.dataset.key, ids);
      toast(n ? `${n} showrooms saved to Leads` : 'They are all saved already'); render();
      break;
    }
    case 'places-show': S.ui.placeSel = id; S.ui.placePan = id; render(); { const m = $('#map-slot'); if (m) m.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } break;
    case 'places-unsel': S.ui.placeSel = ''; render(); break;
    case 'places-more': S.ui.placesShown += SHOWN_STEP; render(); break;
    case 'places-share': {
      const d = S.places.get(el.dataset.key); if (!d) break;
      const bytes = showroomsPdf(d); const r = showroomReport(d);
      if (S.device) {
        try { const how = await S.device.share({ filename: reportFileName(d), data: bytes, mimeType: 'application/pdf', title: `Jewellery showrooms in ${d.city}`, text: `${r.total} jewellery showrooms in ${d.city}: ${r.ind.length} independent, ${r.chains.length} chains.` }); if (how !== 'shared') toast('The report is saved.'); }
        catch (err) { if (!(err && err.code === 'declined')) toast("The report couldn't be shared here."); }
      } else saveFile(reportFileName(d), bytes);
      break;
    }
    case 'seg': {
      const g = el.dataset.group; const v = el.dataset.val;
      if (g === 'city') { S.filters.city.tab = v; S.selection.clear(); }
      if (g === 'leads') S.filters.leads.tab = v;
      if (g === 'period') S.filters.reports.period = v;
      if (g === 'seqtab') { S.seqTab = v; S.seqDraft = null; }
      if (g === 'posts') S.filters.posts = v;
      if (g === 'bcch') S.form['bc.channel'] = v;
      if (g === 'nfrole') S.form['nf.role'] = v;
      if (g === 'tpinc') S.form['tp.include'] = v;
      if (g === 'vfout') S.form['vf.outcome'] = v;
      if (g === 'mailapp' && S.device) S.device.setMailApp(v);
      if (g === 'ptab') { S.filters.places.tab = v; S.ui.placesShown = SHOWN_STEP; }
      if (g === 'orders') S.filters.orders.tab = v;
      if (g === 'leadsview') { S.filters.leads.view = v; S.selection.clear(); }
      if (g === 'shopstate') S.filters.leads.shops = v;
      if (g === 'sccap') S.form['sc.cap'] = v;
      if (g === 'mtkind') { S.form['mt.kind'] = v; delete S.form['mt.place']; }
      if (g === 'rmpick') S.form['rm.pick'] = v;
      render(); break;
    }
    case 'lead-stage': S.filters.leads.view = 'replies'; S.filters.leads.tab = 'all'; S.filters.leads.stage = el.dataset.val; render(); break;
    case 'place-toggle': { const k = el.dataset.key; if (S.ui.openPlaces.has(k)) S.ui.openPlaces.delete(k); else S.ui.openPlaces.add(k); render(); break; }
    case 'place-more': { const k = el.dataset.key; S.ui.placeShown[k] = (S.ui.placeShown[k] || 40) + 100; render(); break; }
    case 'sel-clear': S.selection.clear(); render(); break;
    case 'meeting-new': S.form = {}; openLayer({ kind: 'meeting', businessId: id || '' }); break;
    case 'meeting-edit': S.form = {}; openLayer({ kind: 'meeting', id }); break;
    case 'meeting-done': if (await write(() => Data.update('meetings', id, { status: 'done', doneAt: nowIso(), doneBy: myName() }))) toast('Meeting marked done'); break;
    case 'meeting-cancel': if (await write(() => Data.update('meetings', id, { status: 'cancelled', cancelledAt: nowIso() }))) toast('Meeting cancelled'); break;
    case 'meeting-ics': {
      const m = S.meetings.get(id); const b = m && S.businesses.get(m.businessId); if (!m || !b) break;
      const name = `meeting-${placeText(b.name).slice(0, 30) || 'ark-diamond'}.ics`; const text = icsFor(m, b);
      if (S.device) { try { await S.device.share({ filename: name, data: text, mimeType: 'text/calendar', title: `${MEETING_LABEL[m.kind] || 'Meeting'}: ${b.name}` }); } catch (err) { if (!(err && err.code === 'declined')) toast("The calendar file couldn't be shared here."); } }
      else saveFile(name, text);
      break;
    }
    case 'remind-new': S.form = {}; openLayer({ kind: 'remind', businessId: id }); break;
    case 'remind-clear': if (await write(() => updateBiz(id, { remind: null }))) { S.form = {}; closeLayer(); toast('Reminder removed'); } break;
    case 'remind-done': if (await write(() => updateBiz(id, el.dataset.kind === 'follow' ? { lead: { followUpAt: null } } : { remind: null }))) toast('Done'); break;
    case 'remind-snooze': { const day = addDays(todayStr(), Number(el.dataset.when) || 1); if (await write(() => updateBiz(id, el.dataset.kind === 'follow' ? { lead: { followUpAt: day } } : { remind: { date: day } }))) toast(`I'll remind you on ${fmtDay(day)}`); break; }
    case 'hist-all': S.ui.histAll[id] = !S.ui.histAll[id]; render(); break;
    case 'team-remove': {
      if (!armed(el.dataset.key) || !S.device) break;
      const r = await S.device.removeMember(id); toast(r === 'ok' ? 'Removed from the team; they are signed out everywhere' : "That didn't work. Try again."); await loadTeam(); break;
    }
    case 'camp-start': S.form = {}; openLayer({ kind: 'startcamp' }); break;
    case 'camp-city': { const ids = placeIds('city', el.dataset.country || '', el.dataset.city || ''); S.form = {}; openLayer({ kind: 'startcamp', ids }); break; }
    case 'camp-one': S.form = {}; openLayer({ kind: 'startcamp', ids: [id] }); break;
    case 'close-layer': closeLayer(); break;
    case 'more': if (moreOpen()) closeMore(); else openMore(); break;
    case 'more-close': closeMore(); break;
    case 'open-biz': S.form = Object.fromEntries(Object.entries(S.form).filter(([k]) => k.startsWith('draft.'))); S.layer = null; openLayer({ kind: 'biz', id }); break;
    case 'new-campaign': S.form = {}; openLayer({ kind: 'campaign' }); break;
    case 'new-fair': {
      const upcoming = FAIRS.filter((x) => x.end >= todayStr());
      S.form = { 'nf.fair': el.dataset.fair || (upcoming[0] ? upcoming[0].key : '__other'), 'nf.role': 'visiting', 'nf.lang': 'English' };
      openLayer({ kind: 'fair' }); break;
    }
    case 'edit-campaign': {
      const c = S.campaigns.get(id); if (!c) break;
      if (c.kind === 'fair') {
        S.form = { 'nf.role': c.role || 'visiting', 'nf.booth': c.booth || '', 'nf.lang': c.language || 'English' };
        for (const [k] of PRODUCT_LINES) S.form['nf.p.' + k] = !c.productLines || !c.productLines.length || c.productLines.includes(k);
        openLayer({ kind: 'fair', id }); break;
      }
      S.form = { 'nc.lang': c.language || 'English' };
      for (const [k] of BUYER_TYPES) S.form['nc.t.' + k] = !c.buyerTypes || !c.buyerTypes.length || c.buyerTypes.includes(k);
      for (const [k] of PRODUCT_LINES) S.form['nc.p.' + k] = !c.productLines || !c.productLines.length || c.productLines.includes(k);
      openLayer({ kind: 'campaign', id }); break;
    }
    case 'toggle-find': { const c = S.campaigns.get(id); const n = c ? campCounts(c).found : 0; S.ui.findOpen[id] = !(S.ui.findOpen[id] ?? (n === 0)); render(); break; }
    case 'add-biz': S.form = { 'bf.type': 'independent' }; openLayer({ kind: 'bizform', campaignId: id }); break;
    case 'edit-biz': S.form = {}; openLayer({ kind: 'bizform', id, campaignId: (S.businesses.get(id) || {}).campaignId }); break;
    case 'log-reply': S.form = { 'rp.ch': 'email', 'rp.tag': 'interested', 'rp.at': localDateTime(new Date()) }; openLayer({ kind: 'reply', id: id || null }); break;
    case 'csv-template': saveFile('ark-diamond-buyers-template.csv', toCSV([['name', 'type', 'sells_lab_grown', 'contact', 'email', 'phone', 'whatsapp', 'website', 'instagram', 'facebook', 'linkedin', 'city', 'country', 'notes']])); break;
    case 'copy-prompt': { const c = S.campaigns.get(id); if (c) copyText(claudePrompt(c)); break; }
    case 'approve': case 'reject': {
      const ok = await write(() => updateBiz(id, act === 'approve' ? { status: 'approved', approvedAt: nowIso() } : { status: 'rejected' }));
      if (ok) toast(act === 'approve' ? 'Approved' : 'Rejected'); break;
    }
    case 'start-one': await startSequence([id]); break;
    case 'start-all': if (await startSequence(bizOf(id).filter((b) => b.status === 'approved').map((b) => b.id))) { S.filters.city.tab = 'active'; S.ui.findOpen[id] = false; render(); } break;
    case 'bulk': {
      const op = el.dataset.op; const ids = [...S.selection].filter((x) => S.businesses.get(x));
      if (op === 'clear') { S.selection.clear(); render(); break; }
      if (op === 'start') {
        for (const x of ids) { const b = S.businesses.get(x); if (b && b.status === 'found') await write(() => updateBiz(x, { status: 'approved', approvedAt: nowIso() })); }
        if (await startSequence(ids) && S.route.view === 'city') { S.filters.city.tab = 'active'; S.ui.findOpen[S.route.id] = false; }
      } else {
        let n = 0;
        for (const x of ids) { const b = S.businesses.get(x); if (!b || ['active', 'replied'].includes(b.status)) continue; if (await write(() => updateBiz(x, op === 'approve' ? { status: 'approved', approvedAt: nowIso() } : { status: 'rejected' }))) n++; }
        toast(`${n} ${op === 'approve' ? 'approved' : 'rejected'}`);
      }
      S.selection.clear(); render(); break;
    }
    case 'pause-campaign': await write(() => Data.update('campaigns', id, { paused: el.dataset.val === '1' })); break;
    case 'delete-campaign': {
      if (!armed(el.dataset.key)) break;
      for (const b of bizOf(id)) await removeBuyer(b.id);
      await write(() => Data.remove('campaigns', id)); toast('Campaign deleted'); location.hash = '#cities'; break;
    }
    case 'delete-biz': {
      if (!armed(el.dataset.key)) break;
      S.layer = null; await removeBuyer(id); toast('Buyer deleted'); render(); break;
    }
    case 'remove-examples': {
      if (!armed('examples')) break;
      for (const coll of ['quotes', 'samples', 'broadcasts', 'posts', 'businesses', 'campaigns']) for (const x of [...mapFor(coll).values()].filter((y) => y.isExample)) await write(() => Data.remove(coll, x.id));
      toast('Example data removed'); break;
    }
    case 'copy-step': {
      const b = S.businesses.get(id); if (!b) break; const step = stepsFor(seqKindOf(b)).find((x) => x.id === el.dataset.step); if (!step) break;
      const ch = effectiveChannel(step, b);
      if (ch === 'email') { const m = emailText(b, step); copyText(`Subject: ${m.subject}\n\n${m.body}`); } else copyText(stepText(b, step, ch));
      break;
    }
    case 'step-done': {
      const b = S.businesses.get(id); if (!b) break; const how = el.dataset.how;
      if (await markStep(b, el.dataset.step, how)) toast({ sent: 'Marked sent', done: 'Marked done', skipped: 'Skipped', bounced: 'Marked bounced; sequence stopped' }[how]);
      break;
    }
    case 'mark-all-sent': {
      const items = todayData().emails; let n = 0;
      for (const x of items) { const b = S.businesses.get(x.b.id); if (b && contactOf(b).email && await markStep(b, x.step.id, 'sent')) n++; }
      const left = items.length - n;
      toast(`${n} ${n === 1 ? 'email' : 'emails'} marked sent${left ? `; ${left} ${left === 1 ? 'has' : 'have'} no address, so skip ${left === 1 ? 'it' : 'them'} or add one` : ''}`); break;
    }
    case 'answered': await markAnswered(id, fv('draft.' + id)); break;
    case 'snooze': {
      const when = snoozeTime(el.dataset.when); const b = S.businesses.get(id); if (!b || !b.lead) break;
      if (await write(() => updateBiz(id, { lead: { remindAt: when.toISOString() } }))) toast(`I'll remind you ${toDateStr(when) === todayStr() ? 'at' : `on ${fmtDay(toDateStr(when))} at`} ${fmtTime(when)}`);
      break;
    }
    case 'clear-follow': await write(() => updateBiz(id, { lead: { followUpAt: null } })); break;
    case 'save-notes': if (await write(() => updateBiz(id, { notes: String(fv('notes.' + id)) }))) toast('Notes saved'); break;
    case 'log-order': {
      const b = S.businesses.get(id); const v = Number(fv('order.' + id)); if (!b) break;
      if (!(v > 0)) { toast('Enter the order value in US$ first.'); break; }
      if (await logOrder(id, v)) delete S.form['order.' + id];
      break;
    }
    case 'unsub': {
      const b = S.businesses.get(id); if (!b) break;
      const patch = { status: 'unsubscribed' }; if (b.lead) patch.lead = { awaitingReply: false, remindAt: null, stage: 'lost' };
      if (await write(() => updateBiz(id, patch))) { if (contactOf(b).email) await addSuppression([contactOf(b).email]); toast('Unsubscribed and added to your do-not-contact list'); }
      break;
    }
    case 'stop-seq': if (await write(() => updateBiz(id, { status: 'closed', closedAt: nowIso() }))) toast('Sequence stopped'); break;
    case 'retry-one': await startSequence([id], { retry: true }); break;
    case 'retry-all': await startSequence(todayData().retry.map((b) => b.id), { retry: true }); break;
    case 'retry-skip': if (await write(() => updateBiz(id, { noRetry: true }))) toast("They won't get a second try"); break;
    case 'ai-tag': aiTag(); break;
    case 'ai-draft': aiDraft(id); break;
    case 'ai-stop': if (S.ai.ctl) S.ai.ctl.abort(); break;
    case 'advice-run': aiAdvice(); break;
    case 'copy-draft': { const t = String(fv('draft.' + id)).trim(); if (t) copyText(t); else toast('Write or draft a reply first.'); break; }

    /* quotes */
    case 'quote-new': S.quoteDraft = { businessId: id, currency: 'USD', incoterm: 'FOB', validUntil: addDays(todayStr(), 14), lines: [{ desc: '', qty: 1, price: '' }], shipping: '', notes: '', usdRate: '' }; openLayer({ kind: 'quote', businessId: id }); break;
    case 'quote-edit': { const q = S.quotes.get(id); if (!q) break; S.quoteDraft = { ...clone(q), id: q.id, lines: clone(q.lines || []).length ? clone(q.lines) : [{ desc: '', qty: 1, price: '' }] }; openLayer({ kind: 'quote', id, businessId: q.businessId }); break; }
    case 'ql-add': if (S.quoteDraft) { S.quoteDraft.lines.push({ desc: '', qty: 1, price: '' }); render(); const i = S.quoteDraft.lines.length - 1; const f = document.getElementById(`ql-${i}-d`); if (f) f.focus(); } break;
    case 'ql-remove': if (S.quoteDraft && S.quoteDraft.lines.length > 1) { S.quoteDraft.lines.splice(Number(el.dataset.val), 1); render(); } break;
    case 'quote-save': {
      const d = S.quoteDraft; if (!d) break;
      const lines = d.lines.map((l) => ({ desc: String(l.desc || '').trim(), qty: Number(l.qty) || 0, price: Number(l.price) || 0 })).filter((l) => l.desc || l.price);
      if (!lines.length) { toast('Add at least one item with a price.'); break; }
      const status = el.dataset.val === 'sent' ? (['accepted', 'declined'].includes(d.status) ? d.status : 'sent') : d.status || 'draft';
      const doc = { businessId: d.businessId, number: d.number || nextQuoteNumber(), currency: d.currency || 'USD', incoterm: d.incoterm || 'FOB', validUntil: d.validUntil || '', lines, shipping: Number(d.shipping) || 0, notes: String(d.notes || ''), usdRate: d.currency === 'USD' ? 1 : Number(d.usdRate) || 0, status, createdAt: d.createdAt || nowIso(), sentAt: status === 'sent' ? d.sentAt || nowIso() : d.sentAt || null, decidedAt: d.decidedAt || null, isExample: !!d.isExample };
      const qid = d.id || Data.newId('quotes');
      if (await write(() => Data.set('quotes', qid, doc))) {
        await ensureLead(d.businessId, 'quoted');
        S.quoteDraft = null; S.layer = { kind: 'biz', id: d.businessId }; render();
        toast(status === 'sent' ? `Quote ${doc.number} saved as sent. Copy it into your reply.` : `Quote ${doc.number} saved as a draft`);
      }
      break;
    }
    case 'quote-copy': { const q = S.quotes.get(id); const b = q && S.businesses.get(q.businessId); if (b) copyText(quoteText(q, b)); break; }
    case 'quote-download': { const q = S.quotes.get(id); const b = q && S.businesses.get(q.businessId); if (b) saveFile(`quotation-${q.number}-${b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}.html`, quoteHtmlFile(q, b)); break; }
    case 'quote-status': {
      const q = S.quotes.get(id); if (!q) break; const v = el.dataset.val;
      const patch = { status: v, decidedAt: ['accepted', 'declined'].includes(v) ? nowIso() : null }; if (v === 'sent' && !q.sentAt) patch.sentAt = nowIso();
      if (!(await write(() => Data.update('quotes', id, patch)))) break;
      if (v === 'accepted') { const usd = quoteUsd(q); if (usd > 0) { await logOrder(q.businessId, Math.round(usd), true); toast(`Quote accepted and ${money(usd)} added to their orders. Tap Make proforma to invoice it.`); } else toast('Quote accepted. Tap Make proforma to invoice it, and add the order value in US$ in the Lead panel.'); }
      else toast(v === 'declined' ? 'Quote marked declined' : 'Quote marked sent');
      break;
    }

    /* orders */
    case 'order-new': { const b = id ? S.businesses.get(id) : null; S.orderDraft = newOrderDraft(b); openLayer({ kind: 'orderform' }); break; }
    case 'order-from-quote': { const q = S.quotes.get(id); const b = q && S.businesses.get(q.businessId); if (!b) break; S.orderDraft = orderFromQuote(q, b); openLayer({ kind: 'orderform' }); break; }
    case 'order-open': S.ui.orderPanel = ''; clearForm('pay.', 'ship.', 'pm.'); openLayer({ kind: 'order', id }); break;
    case 'order-edit': { const o = S.orders.get(id); if (!o) break; S.orderDraft = { ...clone(o), id: o.id, buyer: { ...clone(o.buyer || {}) }, lines: (o.lines || []).length ? clone(o.lines) : [{ desc: '', hs: '', qty: 1, price: '' }] }; openLayer({ kind: 'orderform', id }); break; }
    case 'ol-add': if (S.orderDraft) { S.orderDraft.lines.push({ desc: '', hs: '', qty: 1, price: '' }); render(); const f = document.getElementById(`ol-${S.orderDraft.lines.length - 1}-d`); if (f) f.focus(); } break;
    case 'ol-remove': if (S.orderDraft && S.orderDraft.lines.length > 1) { S.orderDraft.lines.splice(Number(el.dataset.val), 1); render(); } break;
    case 'order-save': await saveOrderDraft(); break;
    case 'order-panel': {
      const v = el.dataset.val || ''; S.ui.orderPanel = S.ui.orderPanel === v ? '' : v; render();
      const f = S.ui.orderPanel && $(`#layer #${S.ui.orderPanel === 'mail' ? 'pm-to' : S.ui.orderPanel === 'pay' ? 'pay-amount' : 'ship-tracking'}`); if (f) f.focus();
      break;
    }
    case 'pay-save': await savePayment(id); break;
    case 'pay-delete': {
      if (!armed(el.dataset.key)) break; const o = S.orders.get(id); if (!o) break;
      const payments = (o.payments || []).filter((p) => p.id !== el.dataset.val);
      if (await write(() => Data.update('orders', id, { payments, ...orderSums({ ...o, payments }), updatedAt: nowIso() }))) toast('Payment removed');
      break;
    }
    case 'order-status': await setOrderStatus(id, el.dataset.val); break;
    case 'ship-save': await saveShipment(id); break;
    case 'order-pdf': { const o = S.orders.get(id); if (o) saveFile(piFileName(o), piPdf(o)); break; }
    case 'order-share': {
      const o = S.orders.get(id); if (!o || !S.device) break;
      const m = piMail(o); const subject = String(fv('pm.subject', m.subject)).trim() || m.subject;
      try {
        const r = await S.device.share({ filename: piFileName(o), data: piPdf(o), mimeType: 'application/pdf', title: subject, text: String(fv('pm.body', m.body)) });
        S.mailOpened.add('pi:' + id); render();
        toast(r === 'shared' ? "Shared. Once it's sent, tap I've emailed it." : 'The PDF is saved. Attach it in your mail app.');
      } catch (err) { if (!(err && err.code === 'declined')) toast("The invoice couldn't be shared here. Try Download PDF."); }
      break;
    }
    case 'copy-text': if (el.dataset.val) copyText(el.dataset.val); else toast('Nothing to copy yet.'); break;
    case 'trip-told': await tripTold(id, el.dataset.val); break;
    case 'sign-out': if (S.device) S.device.signOut(); break;
    case 'order-copy-mail': { const o = S.orders.get(id); if (o) copyText(String(fv('pm.body', piMail(o).body))); break; }
    case 'order-emailed': if (await write(() => Data.update('orders', id, { emailedAt: nowIso(), updatedAt: nowIso() }))) { S.ui.orderPanel = ''; toast('Marked as emailed'); } break;
    case 'order-mail': {
      const mode = el.dataset.val === 'draft' ? 'draft' : 'send';
      S.gm.busy = 'pi:' + id; render();
      const r = await gmailSendPi(id, mode); S.gm.busy = '';
      if (r.ok && mode === 'send') { S.ui.orderPanel = ''; clearForm('pm.'); }
      render(); toast(r.ok ? (mode === 'send' ? 'Proforma sent from Gmail' : 'Saved in your Gmail drafts') : gmailError(r));
      break;
    }
    case 'order-cancel': { if (!armed(el.dataset.key)) break; if (await write(() => Data.update('orders', id, { status: 'cancelled', statusAt: { cancelled: nowIso() }, updatedAt: nowIso() }))) toast('Order cancelled'); break; }
    case 'order-delete': {
      if (!armed(el.dataset.key)) break; const o = S.orders.get(id); if (!o) break;
      if ((o.payments || []).length) { toast('This order has payments, so cancel it instead.'); break; }
      if (await write(() => Data.remove('orders', id))) { closeLayer(); toast(`${o.number} deleted`); }
      break;
    }
    case 'save-trade': {
      const trade = { ...settings().trade };
      for (const [k, v] of Object.entries(S.form)) if (k.startsWith('tr.')) trade[k.slice(3)] = String(v).trim();
      if (await write(() => saveSettings({ trade }))) { clearForm('tr.'); toast('Export and bank details saved'); }
      break;
    }

    /* Gmail replies */
    case 'gm-sync': await gmailSync(true); break;

    /* visits */
    case 'trip-new': S.form = {}; openLayer({ kind: 'tripform' }); break;
    case 'trip-delete': { if (!armed(el.dataset.key)) break; if (await write(() => Data.remove('trips', id))) { location.hash = '#trips'; toast('Trip deleted'); } break; }
    case 'trip-mail': S.ui.tripMail = S.ui.tripMail === id ? '' : id; clearForm('tm.'); render(); break;
    case 'trip-mail-save': { const t = S.trips.get(id); if (!t) break; if (await write(() => Data.update('trips', id, { mail: { subject: fv('tm.subject', (t.mail || VISIT_TEMPLATE).subject), body: fv('tm.body', (t.mail || VISIT_TEMPLATE).body) }, updatedAt: nowIso() }))) toast('Message saved'); break; }
    case 'trip-mail-send': await tripMailSend(id); break;
    case 'trip-copy': {
      const t = S.trips.get(id); const st = t && (t.stops || []).find((x) => x.id === el.dataset.val); const b = st && S.businesses.get(st.bid); if (!b) break;
      const m = tripMailText(t, st, b, fv('tm.subject', (t.mail || VISIT_TEMPLATE).subject), fv('tm.body', (t.mail || VISIT_TEMPLATE).body)); copyText(`Subject: ${m.subject}\n\n${m.body}`); break;
    }
    case 'stop-visit': S.ui.visitOpen = el.dataset.val; clearForm('vf.'); render(); { const f = $('#vf-note'); if (f) f.focus(); } break;
    case 'visit-cancel': S.ui.visitOpen = ''; render(); break;
    case 'visit-save': {
      const t = S.trips.get(id); if (!t) break; const stops = clone(t.stops || []); const st = stops.find((x) => x.id === el.dataset.val); if (!st) break;
      const outcome = fv('vf.outcome', 'interested'); const note = String(fv('vf.note')).trim();
      Object.assign(st, { status: 'visited', outcome, note, visitedAt: nowIso() });
      if (!(await saveStops(id, stops))) break;
      await logVisit(st.bid, outcome, note); S.ui.visitOpen = ''; clearForm('vf.');
      toast(outcome === 'no' ? 'Visit saved' : outcome === 'not_now' ? 'Visit saved. The app reminds you later.' : 'Visit saved. Follow-up set for 2 days from now.');
      break;
    }
    case 'stop-skip': case 'stop-undo': {
      const t = S.trips.get(id); if (!t) break; const stops = clone(t.stops || []); const st = stops.find((x) => x.id === el.dataset.val); if (!st) break;
      st.status = act === 'stop-skip' ? 'skipped' : 'planned'; await saveStops(id, stops); break;
    }
    case 'stop-remove': { const t = S.trips.get(id); if (!t) break; await saveStops(id, clone(t.stops || []).filter((x) => x.id !== el.dataset.val)); break; }
    /* prices */
    case 'pc-save-rates': {
      const r = pcRates(); const n = (v) => (v === '' || v == null ? '' : Math.max(0, Number(v) || 0));
      const pricing = { ...settings().pricing, gold24: n(r.gold24), silver: n(r.silver), round: Math.max(0, Number(r.round) || 0), rates: Object.fromEntries(FX.map(([c]) => [c, n(r.rates[c])])), ratesAt: todayStr() };
      if (await write(() => saveSettings({ pricing }))) { S.rt = {}; toast('Rates saved'); }
      break;
    }
    case 'pc-copy': {
      const p = pcInputs(); const c = calcPrice(p, pcRates()); if (!c.price) { toast('Fill in the piece first.'); break; }
      copyText([pcDesc(p), `Wholesale price ${inr(c.price)}`, ...Object.entries(c.fx).map(([k, v]) => fxFmt(k, v))].join('\n')); break;
    }
    case 'pc-save': {
      const p = pcInputs(); const c = calcPrice(p, pcRates()); const code = String(p.code || '').trim();
      if (!code) { toast('Add a design code or name first.'); break; }
      if (!c.price) { toast('Fill in the piece first.'); break; }
      const { buyer: _b, cur: _c, ...inputs } = p; const same = [...S.prices.values()].find((x) => String((x.inputs || {}).code || '').trim().toLowerCase() === code.toLowerCase());
      const doc = { inputs: { ...inputs, code }, priceInr: Math.round(c.price), createdAt: same ? same.createdAt : nowIso(), updatedAt: nowIso(), isExample: false };
      if (await write(() => Data.set('prices', same ? same.id : Data.newId('prices'), doc))) toast(same ? `${code} updated in your price list` : `${code} saved to your price list`);
      break;
    }
    case 'pc-load': { const x = S.prices.get(id); if (!x) break; const keep = { buyer: S.pc.buyer, cur: S.pc.cur }; S.pc = { ...clone(x.inputs || {}), ...Object.fromEntries(Object.entries(keep).filter(([, v]) => v)) }; render(); window.scrollTo(0, 0); toast(`${(x.inputs || {}).code || 'Design'} loaded`); break; }
    case 'price-delete': { if (!armed(el.dataset.key)) break; if (await write(() => Data.remove('prices', id))) toast('Removed from your price list'); break; }
    case 'pc-reset': S.pc = { buyer: S.pc.buyer, cur: S.pc.cur }; render(); break;
    case 'pc-quote': {
      const b = S.businesses.get(pcInputs().buyer); if (!b) { toast('Choose the buyer to quote.'); break; }
      const p = pcInputs(); const c = calcPrice(p, pcRates()); const cur = p.cur || Object.keys(c.fx)[0] || 'GBP'; const price = c.fx[cur];
      if (!price) { toast(`Add the rupee rate for ${cur} first.`); break; }
      S.quoteDraft = { businessId: b.id, currency: cur, incoterm: 'DAP', validUntil: addDays(todayStr(), 14), lines: [{ desc: localTerms(pcDesc(p), b.country), qty: 1, price }], shipping: '', notes: '', usdRate: fxUsd(cur) || '' };
      openLayer({ kind: 'quote', businessId: b.id }); break;
    }

    /* Gmail */
    case 'gm-check': await gmailAccount(true); break;
    case 'gm-cancel': S.gm.confirm = ''; render(); break;
    case 'gm-send': S.gm.confirm = `step:${id}:${el.dataset.step}`; render(); if (!S.gm.account) gmailAccount(); break;
    case 'gm-send-go': {
      const key = S.gm.confirm; const [, bid, sid] = key.split(':'); if (!bid || !sid) break;
      S.gm.busy = key; S.gm.confirm = ''; render();
      const r = await gmailSendStep(bid, sid); S.gm.busy = ''; render();
      toast(r.ok ? 'Sent from Gmail' : gmailError(r)); break;
    }
    case 'gm-send-all': S.gm.confirm = 'all'; render(); if (!S.gm.account) gmailAccount(); break;
    case 'gm-send-all-go': await gmailSendAll(); break;
    case 'gm-stop': if (S.gm.batch) { S.gm.batch.stop = true; toast('Stopping after this email'); } break;
    case 'gm-reply': {
      if (!String(fv('draft.' + id)).trim()) { toast('Write or draft a reply first.'); break; }
      S.gm.confirm = 'reply:' + id; render(); if (!S.gm.account) gmailAccount(); break;
    }
    case 'gm-reply-go': {
      S.gm.busy = 'reply:' + id; S.gm.confirm = ''; render();
      const r = await gmailSendReply(id); S.gm.busy = ''; render();
      toast(r.ok ? 'Reply sent from Gmail' : gmailError(r)); break;
    }
    /* samples */
    case 'sample-new': S.form = { 'sm.sentAt': todayStr(), 'sm.courier': 'dhl' }; openLayer({ kind: 'sample', businessId: id }); break;
    case 'sample-status': {
      const x = S.samples.get(id); if (!x) break; const v = el.dataset.val; const patch = { status: v };
      if (v === 'delivered') patch.checkAt = addDays(todayStr(), 3);
      if (await write(() => Data.update('samples', id, patch))) toast(v === 'ordered' ? 'Great. Add the order value in the Lead panel.' : v === 'delivered' ? `Marked delivered. The app reminds you to ask for feedback on ${fmtDay(patch.checkAt)}.` : v === 'returned' ? 'Marked returned' : 'Noted');
      break;
    }
    case 'sample-snooze': { const day = addDays(todayStr(), 3); if (await write(() => Data.update('samples', id, { checkAt: day }))) toast(`I'll remind you on ${fmtDay(day)}`); break; }

    /* broadcasts */
    case 'bc-new': {
      const x = SEASONS.find((y) => y.key === el.dataset.season); const camp = S.campaigns.get(el.dataset.fair);
      S.form = { 'bc.channel': 'email', 'bc.segment': 'leads', 'bc.season': x ? x.key : '', 'bc.fair': camp ? camp.id : '' };
      if (x) {
        Object.assign(S.form, { 'bc.title': `${x.name} offer`, 'bc.subject': '{{season}} collection for {{business}}', 'bc.body': "Hello {{contact}},\n\n{{season}} is on {{season_date}}. If you'd like our lab-grown diamond jewellery in your store for it, now is a good time to order.\n\nHere is our catalogue: {{catalogue_link}}\n\nTell me which pieces you like and I'll send prices and delivery times.\n\nBest regards,\n{{sender}}" });
        for (const c of x.countries) if (allBiz().some((b) => b.country === c)) S.form['bc.c.' + c] = true;
      } else if (camp) {
        const exhib = camp.role === 'exhibiting';
        Object.assign(S.form, { 'bc.title': `Invitation: ${camp.fairName}`, 'bc.subject': exhib ? 'Meet us at {{fair}}, booth {{booth}}' : 'Will you be at {{fair}}?',
          'bc.body': exhib ? "Hello {{contact}},\n\nWe're exhibiting our lab-grown diamond jewellery at {{fair}} ({{fair_dates}}), booth {{booth}}. If you're going, I'd be glad to show you the collection in person. Reply with a time that suits you and I'll keep it free.\n\nBest regards,\n{{sender}}\n{{company}}" : "Hello {{contact}},\n\nI'll be at {{fair}} ({{fair_dates}}). If you're going too, could we meet for 20 minutes? I'd like to show you a few of our lab-grown diamond pieces in person.\n\nBest regards,\n{{sender}}\n{{company}}" });
      } else Object.assign(S.form, { 'bc.title': 'New designs', 'bc.subject': 'New lab-grown diamond designs for {{business}}', 'bc.body': "Hello {{contact}},\n\nWe've added new lab-grown diamond designs to our collection: {{catalogue_link}}\n\nTell me which pieces you'd like prices for.\n\nBest regards,\n{{sender}}" });
      openLayer({ kind: 'broadcast' }); break;
    }
    case 'bc-ai': aiBroadcastText(); break;
    case 'bc-open': S.layer = null; openLayer({ kind: 'bcast', id }); break;
    case 'bc-copy': {
      const bc = S.broadcasts.get(id); const b = S.businesses.get(el.dataset.biz); if (!bc || !b) break;
      const m = broadcastText(bc, b); copyText(m.subject ? `Subject: ${m.subject}\n\n${m.body}` : m.body); break;
    }
    case 'bc-mark': case 'bc-all': {
      const bc = S.broadcasts.get(id); if (!bc) break; const at = nowIso();
      const recipients = (bc.recipients || []).map((r) => (act === 'bc-all' ? (!r.at && S.businesses.get(r.id) ? { ...r, at, how: 'sent' } : r) : r.id === el.dataset.biz ? { ...r, at, how: el.dataset.how } : r));
      if (await write(() => Data.update('broadcasts', id, { recipients }))) toast(act === 'bc-all' ? 'All marked sent' : el.dataset.how === 'skipped' ? 'Skipped' : 'Marked sent');
      break;
    }
    case 'bc-delete': { if (!armed(el.dataset.key)) break; S.layer = null; await write(() => Data.remove('broadcasts', id)); toast('Broadcast deleted'); render(); break; }

    /* social posts */
    case 'posts-gen': aiPosts(el.dataset.season); break;
    case 'post-copy': { const p = S.posts.get(id); if (p) copyText(`${p.caption}${(p.hashtags || []).length ? '\n\n' + p.hashtags.map((h) => '#' + h).join(' ') : ''}`); break; }
    case 'post-done': if (await write(() => Data.update('posts', id, { status: 'posted', postedAt: nowIso() }))) toast('Marked as posted'); break;
    case 'post-delete': await write(() => Data.remove('posts', id)); break;

    /* messages page */
    case 'seq-edit': S.seqDraft = clone(stepsFor(S.seqTab)); render(); break;
    case 'seq-cancel': S.seqDraft = null; render(); break;
    case 'seq-add': S.seqDraft.push({ id: ({ fair: 'f', retry: 'r' }[S.seqTab] || 's') + uid(), day: Math.max(0, ...S.seqDraft.map((x) => Number(x.day) || 0)) + 2, channel: 'email', by: 'app', title: 'New step', subject: 'Following up, {{business}}', body: 'Hello {{contact}},\n\n\n\nBest regards,\n{{sender}}' }); render(); break;
    case 'seq-remove': S.seqDraft.splice(Number(el.dataset.val), 1); render(); break;
    case 'seq-reset': {
      if (!armed('seq-reset')) break;
      S.seqDraft = clone({ fair: DEFAULT_FAIR_SEQUENCE, retry: DEFAULT_RETRY_SEQUENCE }[S.seqTab] || DEFAULT_SEQUENCE); render(); toast('Default sequence loaded. Save to keep it.'); break;
    }
    case 'seq-save': {
      const seq = S.seqDraft.map((x) => ({ ...x, day: Math.max(0, Math.min(60, Math.round(Number(x.day) || 0))), by: ['email', 'whatsapp'].includes(x.channel) ? 'app' : 'you', subjectB: x.channel === 'email' ? String(x.subjectB || '').trim() : '' }));
      const patch = S.seqTab === 'city' ? { sequence: seq } : { sequences: { ...((S.settingsDoc && S.settingsDoc.sequences) || {}), [S.seqTab]: seq } };
      if (await write(() => saveSettings(patch))) { S.seqDraft = null; toast('Sequence saved'); }
      break;
    }
    case 'rules-save': {
      const r = { ...settings().rules };
      for (const k of Object.keys(DEFAULT_RULES)) if (S.form['ru.' + k] != null) r[k] = Math.max(1, Math.min(365, Math.round(Number(S.form['ru.' + k]) || DEFAULT_RULES[k])));
      if (await write(() => saveSettings({ rules: r }))) { for (const k of Object.keys(DEFAULT_RULES)) delete S.form['ru.' + k]; toast('Rules saved'); }
      break;
    }
    case 'ans-add': { const a = { id: 'a' + uid(), title: 'New answer', text: '' }; if (await write(() => saveSettings({ answers: [...settings().answers, a] }))) { S.ansEdit = a.id; render(); } break; }
    case 'ans-edit': S.ansEdit = id; render(); break;
    case 'ans-cancel': S.ansEdit = ''; render(); break;
    case 'ans-save': {
      const answers = settings().answers.map((a) => (a.id === id ? { ...a, title: String(fv('ans.title.' + id, a.title)).trim() || a.title, text: String(fv('ans.text.' + id, a.text)).trim() } : a));
      if (await write(() => saveSettings({ answers }))) { S.ansEdit = ''; delete S.form['ans.title.' + id]; delete S.form['ans.text.' + id]; toast('Answer saved'); }
      break;
    }
    case 'ans-delete': { if (!armed(el.dataset.key)) break; await write(() => saveSettings({ answers: settings().answers.filter((a) => a.id !== id) })); break; }
    case 'tr-run': aiTranslate(); break;
    case 'tr-discard': S.trDraft = null; render(); break;
    case 'tr-save': {
      const st = settings(); const d = S.trDraft; if (!d) break;
      if (await write(() => saveSettings({ translations: { ...st.translations, [d.lang]: d.items } }))) { toast(`${d.lang} translation saved`); S.trDraft = null; render(); }
      break;
    }
    case 'tr-delete': { const st = settings(); const t = { ...st.translations }; delete t[el.dataset.val]; await write(() => saveSettings({ translations: t })); break; }

    /* connections */
    case 'save-settings': {
      const st = settings();
      const company = { ...st.company }; const links = { ...st.links }; const sending = { ...st.sending };
      for (const [k, v] of Object.entries(S.form)) {
        if (k.startsWith('co.')) company[k.slice(3)] = String(v).trim();
        if (k.startsWith('ln.')) links[k.slice(3)] = String(v).trim();
        if (k === 'sd.dailyCap') sending.dailyCap = Math.max(1, Math.min(500, Math.round(Number(v) || 40)));
      }
      if (await write(() => saveSettings({ company, links, sending }))) { S.form = {}; toast('Company details saved'); }
      break;
    }
    case 'qr-copy': case 'qr-svg': case 'qr-png': {
      const num = String(settings().company.whatsapp || '').replace(/\D/g, ''); if (num.length < 7) break;
      const link = waUrl(num, fv('qr.text', "Hello, I'd like your lab-grown diamond jewellery catalogue."));
      if (act === 'qr-copy') { copyText(link); break; }
      if (!window.qrcode) break;
      const svg = qrSvg(link);
      if (act === 'qr-svg') { saveFile('whatsapp-qr.svg', svg); break; }
      const img = new Image();
      img.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; cx.drawImage(img, 0, 0, 1024, 1024); cv.toBlob((blob) => { if (blob) saveFile('whatsapp-qr.png', blob); else toast("The PNG couldn't be made here. Try SVG."); }, 'image/png'); };
      img.onerror = () => toast("The PNG couldn't be made here. Try SVG.");
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      break;
    }
    case 'dnc-add': {
      const items = String(fv('dnc.text')).split(/[\s,;]+/).filter(Boolean);
      if (!items.length) { toast('Type an email or a domain first.'); break; }
      const n = await addSuppression(items); delete S.form['dnc.text'];
      let stopped = 0;
      for (const b of allBiz()) if (['found', 'approved', 'active'].includes(b.status) && isSuppressed(contactOf(b).email)) { if (await write(() => updateBiz(b.id, { status: 'unsubscribed' }))) stopped++; }
      toast(n ? `${n} added to the do-not-contact list${stopped ? `; ${stopped} ${stopped === 1 ? 'buyer' : 'buyers'} taken out of the follow-up` : ''}` : 'Those are already on the list');
      render(); break;
    }
    case 'dnc-remove': await removeSuppression(el.dataset.val); break;
    case 'export': {
      const by = el.dataset.by; const rows = computeReport(reportList(), by);
      const header = [by === 'city' ? 'City' : 'Country', ...(by === 'city' ? ['Country'] : []), 'Found', 'Approved', 'Contacted', 'Replied', 'Reply rate %', 'Interested', 'Samples', 'Orders', 'Revenue US$', 'Avg reply time h'];
      const body = rows.map((r) => [by === 'city' ? r.city : r.country, ...(by === 'city' ? [r.country] : []), r.found, r.approved, r.contacted, r.replied, r.rate == null ? '' : Math.round(r.rate * 100), r.interested, r.samples, r.orders, Math.round(r.revenue), r.avgHours == null ? '' : r.avgHours.toFixed(1)]);
      saveFile(`ark-diamond-report-by-${by}-${todayStr()}.csv`, toCSV([header, ...body])); break;
    }
    case 'buyers-export': {
      const list = buyerList(); if (!list.length) { toast('No buyers to export.'); break; }
      const header = ['Name', 'Type', 'Sells lab-grown', 'City', 'Country', 'Campaign', 'Status', 'Stage', 'Contact', 'Email', 'Phone', 'WhatsApp', 'Website', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp opt-in', 'Orders US$', 'Notes'];
      const rows = list.map((b) => { const c = contactOf(b); const camp = campOf(b) || {}; return [b.name, TYPE_LABEL[b.type] || b.type, b.labGrown ? 'yes' : 'no', b.city, b.country, camp.kind === 'fair' ? camp.fairName : camp.city || '', STATUS_LABEL[b.status] || b.status, b.lead ? STAGE_LABEL[b.lead.stage] || b.lead.stage : '', c.person, c.email, c.phone, c.whatsapp, c.website, c.instagram, c.facebook, c.linkedin, b.waOptIn ? 'yes' : 'no', b.lead ? Math.round(Number(b.lead.ordersValue) || 0) : 0, b.notes]; });
      saveFile(`ark-diamond-buyers-${todayStr()}.csv`, toCSV([header, ...rows])); break;
    }
    case 'more-buyers': S.ui.buyersShown += 100; render(); break;
    case 'cal-all': S.ui.calAll = true; render(); break;
    case 'city-report': { const c = S.campaigns.get(id); if (!c) break; S.filters.reports = { country: c.country, city: c.kind === 'fair' ? '' : c.city, period: 'all' }; location.hash = '#reports'; break; }
    default: break;
  }
}
function onInput(e) {
  const el = e.target; if (!el.dataset) return;
  if (el.dataset.k) {
    S.form[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.k === 'nc.country') { delete S.form['nc.city']; delete S.form['nc.cityOther']; delete S.form['nc.lang']; }
    if (el.dataset.k === 'nf.fair') for (const k of ['nf.name', 'nf.city', 'nf.country', 'nf.start', 'nf.end']) delete S.form[k];
    if (el.dataset.k === 'sm.sentAt') delete S.form['sm.checkAt'];
    if (el.dataset.live) schedule(); else if (el.dataset.quiet && e.type === 'input') scheduleQuiet();
  }
  if (el.dataset.filter) {
    setPath(S.filters, el.dataset.filter, el.value);
    if (el.dataset.filter === 'buyers.country') S.filters.buyers.city = '';
    if (el.dataset.filter === 'reports.country') S.filters.reports.city = '';
    S.ui.buyersShown = 100; S.ui.placesShown = SHOWN_STEP; schedule();
  }
  if (el.dataset.seq && S.seqDraft) { const [i, f] = el.dataset.seq.split('.'); S.seqDraft[Number(i)][f] = el.value; if (f === 'channel') schedule(); else if (e.type === 'input') scheduleQuiet(); }
  if (el.dataset.tr && S.trDraft) { const [i, f] = el.dataset.tr.split('.'); S.trDraft.items[Number(i)][f] = el.value; }
  if (el.dataset.q && S.quoteDraft) { S.quoteDraft[el.dataset.q] = el.value; if (el.tagName === 'SELECT') schedule(); else if (e.type === 'input') scheduleQuiet(); }
  if (el.dataset.o && S.orderDraft) {
    const k = el.dataset.o; const d = S.orderDraft; d[k] = el.value;
    if (k === 'businessId') { const nb = S.businesses.get(el.value); if (nb) { const f = newOrderDraft(nb); Object.assign(d, { buyer: f.buyer, currency: f.currency, place: f.place, usdRate: f.usdRate }); } }
    if (k === 'currency') d.usdRate = fxUsd(el.value) || '';
    if (el.tagName === 'SELECT') schedule(); else if (e.type === 'input') scheduleQuiet();
  }
  if (el.dataset.ob && S.orderDraft) { S.orderDraft.buyer = { ...(S.orderDraft.buyer || {}), [el.dataset.ob]: el.value }; if (el.dataset.ob === 'country') scheduleQuiet(); }
  if (el.dataset.ol && S.orderDraft) { const [i, f] = el.dataset.ol.split('.'); const line = S.orderDraft.lines[Number(i)]; if (line) line[f] = el.value; if (e.type === 'input' && f !== 'hs') scheduleQuiet(); }
  if (el.dataset.pc) { S.pc[el.dataset.pc] = el.value; if (el.tagName === 'SELECT') schedule(); else if (e.type === 'input') scheduleQuiet(350); }
  if (el.dataset.rt) { S.rt[el.dataset.rt] = el.value; if (el.tagName === 'SELECT') schedule(); else if (e.type === 'input') scheduleQuiet(350); }
  if (el.dataset.ql && S.quoteDraft) { const [i, f] = el.dataset.ql.split('.'); const line = S.quoteDraft.lines[Number(i)]; if (line) line[f] = el.value; if (e.type === 'input') scheduleQuiet(); }
}
let quietT = 0;
function scheduleQuiet(ms = 600) { clearTimeout(quietT); quietT = setTimeout(schedule, ms); }
async function onChange(e) {
  const el = e.target; if (!el.dataset) return;
  // Fields that change what the form shows carry data-live and redraw from onInput; the rest keep their own state.
  if (el.dataset.k || el.dataset.filter || el.dataset.seq || el.dataset.tr || el.dataset.q || el.dataset.ql || el.dataset.o || el.dataset.ob || el.dataset.ol || el.dataset.pc || el.dataset.rt) onInput(e);
  if (el.dataset.stopchange && el.value !== '') {
    const [tid, sid] = el.dataset.stopchange.split(':'); const t = S.trips.get(tid); const v = el.value; if (t) {
      const stops = clone(t.stops || []); const i = stops.findIndex((x) => x.id === sid);
      if (i >= 0 && v === 'skip') { stops[i].status = 'skipped'; await saveStops(tid, stops); }
      else if (i >= 0 && v === 'remove') { stops.splice(i, 1); if (await saveStops(tid, stops)) toast('Taken off the trip'); }
      else if (i >= 0) { const [st] = stops.splice(i, 1); st.day = v === 'new' ? Math.max(-1, ...(t.stops || []).map((x) => x.day)) + 1 : Number(v); if (await saveStops(tid, insertStop(stops, st))) toast(v === 'new' ? 'Moved to a new day' : 'Moved'); }
    }
  }
  if (el.dataset.stopadd && el.value !== '') {
    const [tid, bid] = el.dataset.stopadd.split(':'); const t = S.trips.get(tid); if (t) {
      const day = el.value === 'new' ? Math.max(-1, ...(t.stops || []).map((x) => x.day)) + 1 : Number(el.value);
      if (await saveStops(tid, insertStop(clone(t.stops || []), { id: uid(), bid, day, status: 'planned' }))) toast(`${(S.businesses.get(bid) || {}).name || 'Shop'} added`);
    }
  }
  if (el.dataset.check) { const [oid, key] = el.dataset.check.split(':'); await write(() => Data.update('orders', oid, { checks: { [key]: el.checked }, updatedAt: nowIso() })); }
  if (el.dataset.sel) { if (el.checked) S.selection.add(el.dataset.sel); else S.selection.delete(el.dataset.sel); render(); }
  if (el.dataset.selplace) { for (const id of placeIds(el.dataset.selplace, el.dataset.country || '', el.dataset.city || '')) { if (el.checked) S.selection.add(id); else S.selection.delete(id); } render(); }
  if (el.dataset.selall) { const list = S.route.view === 'city' ? cityList(S.route.id) : []; for (const b of list) { if (el.checked) S.selection.add(b.id); else S.selection.delete(b.id); } render(); }
  if (el.dataset.optin) await write(() => updateBiz(el.dataset.optin, { waOptIn: el.checked }));
  if (el.dataset.stage) await write(() => updateBiz(el.dataset.stage, { lead: { stage: el.value } }));
  if (el.dataset.follow) await write(() => updateBiz(el.dataset.follow, { lead: { followUpAt: el.value || null } }));
  if (el.dataset.import) { const file = el.files && el.files[0]; el.value = ''; if (file) importCSV(el.dataset.import, file); }
  if (el.dataset.scan) { const files = el.files ? [...el.files] : []; el.value = ''; if (files.length) aiScanCards(el.dataset.scan, files); }
  if (el.dataset.answer) {
    const bid = el.dataset.answer; const a = settings().answers.find((x) => x.id === el.value); const b = S.businesses.get(bid);
    if (a && b) { const cur = String(fv('draft.' + bid)).trim(); S.form['draft.' + bid] = (cur ? cur + '\n\n' : '') + fill(a.text, b); }
    el.value = ''; render();
  }
}
async function onSubmit(e) {
  const form = e.target.closest('form[data-form]'); if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  if (kind === 'meeting') {
    const L = S.layer; const old = L.id ? S.meetings.get(L.id) : null;
    const bid = (old && old.businessId) || L.businessId || fv('mt.biz'); const b = S.businesses.get(bid);
    if (!b) { toast('Choose the client.'); return; }
    const val = (sel) => String((form.querySelector(sel) || {}).value || '').trim();
    const d = new Date(val('#mt-at')); if (!val('#mt-at') || isNaN(d)) { toast('Choose the date and time.'); return; }
    const doc = { businessId: bid, at: d.toISOString(), kind: fv('mt.kind', (old && old.kind) || 'visit'), place: val('#mt-place').slice(0, 300), note: val('#mt-note').slice(0, 1000), status: 'planned', createdAt: old ? old.createdAt : nowIso(), by: old ? old.by || myName() : myName(), updatedAt: nowIso() };
    if (await write(() => Data.set('meetings', L.id || Data.newId('meetings'), doc))) { S.form = {}; closeLayer(); toast(`Meeting ${old ? 'changed' : 'booked'}: ${meetingWhen(d)}`); }
    return;
  }
  if (kind === 'remind') {
    const bid = S.layer.businessId; const b = S.businesses.get(bid); if (!b) { closeLayer(); return; }
    const pick = fv('rm.pick', b.remind && b.remind.date ? 'date' : 'tomorrow');
    const date = pick === 'tomorrow' ? addDays(todayStr(), 1) : pick === '3d' ? addDays(todayStr(), 3) : pick === 'week' ? addDays(todayStr(), 7) : String((form.querySelector('#rm-date') || {}).value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast('Choose a date.'); return; }
    const note = String((form.querySelector('#rm-note') || {}).value || '').trim().slice(0, 200);
    if (await write(() => updateBiz(bid, { remind: { date, note, by: myName(), setAt: nowIso() } }))) { S.form = {}; closeLayer(); toast(`Reminder set for ${fmtDay(date)}`); }
    return;
  }
  if (kind === 'team-add') {
    if (!S.device || typeof S.device.addMember !== 'function') return;
    const name = String(fv('tm.name')).trim(); const email = String(fv('tm.email')).trim(); const pass = String(fv('tm.pass'));
    const r = await S.device.addMember(name, email, pass);
    toast({ ok: `${name} can sign in now, with that email and password`, bad_name: 'Add their name.', bad_email: 'Enter a full email address.', weak_password: 'Use at least 10 characters for the password.', email_taken: 'That email already has a login.', team_full: 'The team is full (10 logins).', not_allowed: 'Only the owner can add people.' }[r] || "That didn't work. Try again.");
    if (r === 'ok') { for (const k of ['tm.name', 'tm.email', 'tm.pass']) delete S.form[k]; await loadTeam(); }
    return;
  }
  if (kind === 'startcamp') {
    const ids = (S.layer && S.layer.ids) || [...S.selection]; const cap = Math.max(1, Number(fv('sc.cap', settings().sending.dailyCap)) || 25);
    if (cap !== Number(settings().sending.dailyCap)) await write(() => saveSettings({ sending: { ...settings().sending, dailyCap: cap } }));
    const r = await startCampaign(ids, cap);
    if (r.started) {
      const today = r.days.filter(([, d]) => d === todayStr()).length;
      S.selection.clear(); S.form = {}; closeLayer();
      toast(`Campaign started for ${r.started} ${r.started === 1 ? 'shop' : 'shops'}${r.first === r.last ? '' : `: ${today ? `${today} today` : `from ${fmtDay(r.first)}`}, the last on ${fmtDay(r.last)}`}`);
    } else toast('None of these shops could start. They may have started already, or have no contact details yet.');
    return;
  }
  if (kind === 'work-city') {
    const city = String(fv('oc.city')).replace(/\s+/g, ' ').trim(); const country = form.dataset.country || focusNow().country;
    if (!city) { toast('Type the name of a city.'); return; }
    const known = cityOptions(country).find((c) => placeText(c) === placeText(city)) || city.replace(/\b\p{Ll}/gu, (m) => m.toUpperCase());
    if (await setFocus({ country, city: known })) { delete S.form['oc.city']; if (S.layer && S.layer.kind === 'focus') { S.layer = null; S.form = {}; } if (location.hash !== '#showrooms') location.hash = '#showrooms'; else render(); startCityResearch(country, known); }
    return;
  }
  if (kind === 'campaign' && S.layer && S.layer.id) {
    const c = S.campaigns.get(S.layer.id); if (!c) { closeLayer(); return; }
    const buyerTypes = BUYER_TYPES.map(([k]) => k).filter((k) => fv('nc.t.' + k, true));
    const productLines = PRODUCT_LINES.map(([k]) => k).filter((k) => fv('nc.p.' + k, true));
    if (!buyerTypes.length) { toast('Pick at least one buyer type.'); return; }
    if (await write(() => Data.update('campaigns', c.id, { language: fv('nc.lang', c.language || 'English'), buyerTypes, productLines }))) { S.form = {}; closeLayer(); toast(`${c.city} settings saved`); }
    return;
  }
  if (kind === 'campaign') {
    let country = fv('nc.country', 'United Kingdom'); let city = fv('nc.city', (PLACES[country] || [])[0] || '');
    if (country === '__other') { country = String(fv('nc.countryOther')).trim(); city = String(fv('nc.city')).trim(); }
    else if (city === '__other') city = String(fv('nc.cityOther')).trim();
    if (!country || !city) { toast('Choose a country and a city.'); return; }
    const buyerTypes = BUYER_TYPES.map(([k]) => k).filter((k) => fv('nc.t.' + k, true));
    const productLines = PRODUCT_LINES.map(([k]) => k).filter((k) => fv('nc.p.' + k, true));
    if (!buyerTypes.length) { toast('Pick at least one buyer type.'); return; }
    const id = Data.newId('campaigns');
    const doc = { kind: 'city', city, country, language: fv('nc.lang', LANG_BY_COUNTRY[country] || 'English'), buyerTypes, productLines, paused: false, createdAt: nowIso(), isExample: false };
    if (await write(() => Data.set('campaigns', id, doc))) { S.layer = null; S.form = {}; S.ui.findOpen[id] = true; S.filters.city.tab = 'review'; location.hash = '#city-' + id; render(); toast(`${city} campaign created. Now find buyers.`); }
  }
  if (kind === 'fair') {
    const productLines = PRODUCT_LINES.map(([k]) => k).filter((k) => fv('nf.p.' + k, true));
    const role = fv('nf.role', 'visiting'); const booth = role === 'exhibiting' ? String(fv('nf.booth')).trim() : '';
    if (S.layer && S.layer.id) {
      const c = S.campaigns.get(S.layer.id); if (!c) { closeLayer(); return; }
      if (await write(() => Data.update('campaigns', c.id, { role, booth, language: fv('nf.lang', c.language || 'English'), productLines }))) { S.form = {}; closeLayer(); toast(`${c.fairName} settings saved`); }
      return;
    }
    const key = fv('nf.fair', '__other'); const fair = FAIRS.find((x) => x.key === key);
    const doc = fair ? { fairKey: fair.key, fairName: fair.name, city: fair.city, country: fair.country, startDate: fair.start, endDate: fair.end, url: fair.url }
      : { fairKey: '', fairName: String(fv('nf.name')).trim(), city: String(fv('nf.city')).trim(), country: String(fv('nf.country')).trim(), startDate: fv('nf.start'), endDate: fv('nf.end') || fv('nf.start'), url: '' };
    if (!doc.fairName) { toast('Add the fair name.'); return; }
    if (!doc.startDate) { toast('Add the first day of the fair.'); return; }
    Object.assign(doc, { kind: 'fair', role, booth, language: fv('nf.lang', 'English'), buyerTypes: BUYER_TYPES.map(([k]) => k), productLines, paused: false, createdAt: nowIso(), isExample: false });
    const id = Data.newId('campaigns');
    if (await write(() => Data.set('campaigns', id, doc))) { S.layer = null; S.form = {}; S.ui.findOpen[id] = true; location.hash = '#city-' + id; render(); toast(`${doc.fairName} campaign created`); }
  }
  if (kind === 'bizform') {
    const L = S.layer; const cur = L.id ? S.businesses.get(L.id) : null; const camp = S.campaigns.get(cur ? cur.campaignId : L.campaignId);
    const name = String(fv('bf.name', cur ? cur.name : '')).trim();
    if (!name) { toast('Add the business name.'); return; }
    const cc = cur ? contactOf(cur) : {};
    const pick = (k) => String(fv('bf.' + k, cc[k] || '')).trim();
    const contact = { person: pick('person'), email: pick('email').toLowerCase(), phone: pick('phone'), whatsapp: pick('whatsapp'), website: pick('website'), instagram: pick('instagram'), facebook: pick('facebook'), linkedin: pick('linkedin') };
    const type = fv('bf.type', cur ? cur.type : 'independent');
    const labGrown = !!fv('bf.labGrown', cur ? !!cur.labGrown : false);
    const waOptIn = !!fv('bf.waOptIn', cur ? !!cur.waOptIn : false);
    const isFair = !!(camp && camp.kind === 'fair');
    const city = isFair ? String(fv('bf.city', cur ? cur.city : '')).trim() : cur ? cur.city : camp && camp.city;
    const country = isFair ? String(fv('bf.country', cur ? cur.country : '')).trim() : cur ? cur.country : camp && camp.country;
    if (contact.email) {
      if (isSuppressed(contact.email)) { toast(`${contact.email} is on your do-not-contact list.`); return; }
      const dup = findByEmail(contact.email, cur && cur.id); if (dup) { toast(`${contact.email} is already listed as ${dup.name}${dup.city ? ` in ${dup.city}` : ''}.`); return; }
    }
    let ok;
    const legal = { legalForm: String(fv('bf.legalForm', cur ? cur.legalForm || '' : '')), companyNo: String(fv('bf.companyNo', cur ? cur.companyNo || '' : '')).trim() };
    if (cur) ok = await write(() => updateBiz(cur.id, { name, type, labGrown, contact, waOptIn, city: city || '', country: country || '', ...legal }));
    else {
      if (!camp) { toast('That campaign no longer exists.'); return; }
      ok = await write(() => Data.set('businesses', Data.newId('businesses'), newBiz({ campaignId: camp.id, name, type, labGrown, city, country, contact, waOptIn, ...legal, notes: String(fv('bf.notes')).trim(), source: L.scanned ? 'card' : 'manual', status: isFair ? 'approved' : 'found', metAt: isFair ? camp.fairName : '' })));
    }
    if (ok) {
      toast(cur ? 'Saved' : isFair ? 'Contact added and ready for the after-fair follow-up' : 'Buyer added to review');
      if (!cur && isFair) S.filters.city.tab = 'approved';
      S.form = {}; S.layer = cur ? { kind: 'biz', id: cur.id } : null; render();
    }
  }
  if (kind === 'reply') {
    const id = S.layer.id || fv('rp.biz'); const text = String(fv('rp.text')).trim();
    if (!id) { toast('Choose the buyer who replied.'); return; }
    if (!text) { toast('Paste their message.'); return; }
    const atLocal = fv('rp.at', localDateTime(new Date())); const at = new Date(atLocal).toString() === 'Invalid Date' ? nowIso() : new Date(atLocal).toISOString();
    if (await logReply(id, { channel: fv('rp.ch', 'email'), text, at, tag: fv('rp.tag', 'interested') })) { toast('Reply logged. It is in Leads with a reminder.'); S.form = {}; S.layer = { kind: 'biz', id }; render(); }
  }
  if (kind === 'trip') {
    const counts = tripCities().map(([c]) => c);
    const cities = counts.filter((c) => fv('tp.c.' + c, c === counts[0]));
    if (!cities.length) { toast('Pick at least one city.'); return; }
    const start = fv('tp.start', nextMonday()) || nextMonday();
    const d = { name: String(fv('tp.name', `UK trip, ${MONTHS_LONG[parseDate(start).getMonth()]} ${parseDate(start).getFullYear()}`)).trim() || 'UK trip', startDate: start, perDay: Number(fv('tp.perDay', '6')) || 6, cap: Number(fv('tp.cap', '12')) || 0, include: fv('tp.include', 'all'), cities };
    const stops = planStops(d);
    if (!stops.length) { toast('No shops match. Try All found.'); return; }
    const id = Data.newId('trips');
    if (await write(() => Data.set('trips', id, { ...d, stops, mail: VISIT_TEMPLATE, createdAt: nowIso(), updatedAt: nowIso(), isExample: false }))) { S.layer = null; S.form = {}; location.hash = '#trip-' + id; render(); toast(`${stops.length} shops over ${new Set(stops.map((x) => x.day)).size} days`); }
    return;
  }
  if (kind === 'sample') {
    const bid = S.layer.businessId; if (!S.businesses.get(bid)) { closeLayer(); return; }
    const sentAt = fv('sm.sentAt', todayStr()) || todayStr();
    const doc = { businessId: bid, sentAt, pieces: String(fv('sm.pieces')).trim(), value: Number(fv('sm.value')) || 0, currency: 'USD', courier: fv('sm.courier', 'dhl'), tracking: String(fv('sm.tracking')).trim(), status: 'sent', checkAt: fv('sm.checkAt', '') || addDays(sentAt, Number(settings().rules.sampleCheckDays) || 7), notes: String(fv('sm.notes')).trim(), createdAt: nowIso(), isExample: false };
    if (await write(() => Data.set('samples', Data.newId('samples'), doc))) { await ensureLead(bid, 'samples'); S.form = {}; S.layer = { kind: 'biz', id: bid }; render(); toast(`Samples logged. The app reminds you to check in on ${fmtDay(doc.checkAt)}.`); }
  }
  if (kind === 'broadcast') {
    const f = bcFromForm(); const aud = bcAudience(); const list = audienceList(aud);
    if (!list.length) { toast('Nobody matches this group yet.'); return; }
    if (!String(f.body).trim() || (f.channel === 'email' && !String(f.subject).trim())) { toast(f.channel === 'email' ? 'Add a subject and a message.' : 'Add a message.'); return; }
    const id = Data.newId('broadcasts');
    const doc = { title: String(fv('bc.title')).trim() || 'Broadcast', channel: f.channel, subject: f.channel === 'email' ? f.subject : '', body: f.body, audience: aud, season: f.season || '', fairName: f.fairName || '', booth: f.booth || '', fairDates: f.fairDates || '', createdAt: nowIso(), recipients: list.slice(0, 1500).map((b) => ({ id: b.id })), isExample: false };
    if (await write(() => Data.set('broadcasts', id, doc))) { S.form = {}; S.layer = null; openLayer({ kind: 'bcast', id }); toast(`Broadcast ready for ${doc.recipients.length} ${doc.recipients.length === 1 ? 'buyer' : 'buyers'}`); }
  }
}
function newBiz(o) {
  const at = nowIso();
  return { campaignId: o.campaignId, name: o.name, type: o.type || 'independent', labGrown: !!o.labGrown, city: o.city || '', country: o.country || '', contact: o.contact || {}, notes: o.notes || '', source: o.source || 'manual', status: o.status || 'found', waOptIn: !!o.waOptIn, legalForm: o.legalForm || '', companyNo: o.companyNo || '', metAt: o.metAt || '', seqStart: null, done: {}, messages: [], lead: null, isExample: false, createdAt: at, updatedAt: at, approvedAt: o.status === 'approved' ? at : null };
}
async function importCSV(cid, file) {
  const c = S.campaigns.get(cid); if (!c) return;
  if (file.size > 3 * 1024 * 1024) { toast('That file is over 3 MB. Split it into smaller lists.'); return; }
  const text = await file.text(); const rows = parseCSV(text);
  if (rows.length < 2) { toast('No rows found. The first row must hold the column names.'); return; }
  const head = rows[0].map((h) => HEADER_MAP[String(h).toLowerCase().replace(/[^a-z]/g, '')] || null);
  if (!head.includes('name')) { toast('Add a "name" column, then import again.'); return; }
  const names = new Set(bizOf(cid).map((b) => b.name.trim().toLowerCase()));
  const emails = new Set(allBiz().map((b) => String(contactOf(b).email || '').trim().toLowerCase()).filter(Boolean));
  const room = CAP - (S.campaigns.size + S.businesses.size + S.quotes.size + S.samples.size + S.broadcasts.size + S.posts.size + S.orders.size + S.prices.size + S.trips.size);
  let added = 0, dup = 0, dnc = 0, blank = 0;
  for (const r of rows.slice(1)) {
    const o = {}; head.forEach((k, i) => { if (k) o[k] = String(r[i] ?? '').trim(); });
    if (!o.name) { blank++; continue; }
    const em = String(o.email || '').toLowerCase();
    if (names.has(o.name.toLowerCase()) || (em && emails.has(em))) { dup++; continue; }
    if (em && isSuppressed(em)) { dnc++; continue; }
    if (added >= room) { toast(`Stopped at ${added}: the app is full.`); break; }
    names.add(o.name.toLowerCase()); if (em) emails.add(em);
    const ok = await write(() => Data.set('businesses', Data.newId('businesses'), newBiz({ campaignId: cid, name: o.name, type: typeFrom(o.type), labGrown: yesish(o.labGrown), legalForm: legalFrom(o.legalForm), companyNo: o.companyNo || '', city: o.city || (c.kind === 'fair' ? '' : c.city), country: o.country || (c.kind === 'fair' ? '' : c.country), notes: o.notes || '', source: 'import',
      contact: { person: o.person || '', email: em, phone: o.phone || '', whatsapp: o.whatsapp || '', website: o.website || '', instagram: o.instagram || '', facebook: o.facebook || '', linkedin: o.linkedin || '' } })));
    if (!ok) break; added++;
  }
  S.filters.city.tab = 'review';
  toast(`${added} buyers imported for review${dup ? `, ${dup} already listed` : ''}${dnc ? `, ${dnc} on your do-not-contact list` : ''}${blank ? `, ${blank} without a name` : ''}.`);
}

/* ================= start ================= */
function route() {
  const h = (location.hash || '').replace(/^#/, '');
  let view = 'today', id = null;
  if (h.startsWith('city-')) { view = 'city'; id = h.slice(5); }
  else if (h.startsWith('trip-')) { view = 'trip'; id = h.slice(5); }
  else if (['today', 'showrooms', 'cities', 'buyers', 'leads', 'meetings', 'calendar', 'reports', 'sequence', 'connections', 'orders', 'prices', 'trips'].includes(h)) view = h;
  if (view !== S.route.view || id !== S.route.id) { S.selection.clear(); S.confirmKey = ''; S.ui.menu = ''; if (view === 'city') S.filters.city.tab = null; if (view === 'leads') S.filters.leads.view = ''; }
  S.route = { view, id };
}
function subscribe() {
  const onErr = (e) => { if (e && e.code === 'revoked') S.mode = 'revoked'; toast(errorText(e)); schedule(); };
  const watch = (coll) => DB.collection(coll).onSnapshot((snap) => { S[coll] = new Map(snap.docs.map((d) => [d.id, { ...d.data(), id: d.id }])); if (coll in S.loaded) S.loaded[coll] = true; if (['research', 'places', 'businesses'].includes(coll)) queueResearch(); schedule(); }, onErr);
  for (const coll of ['campaigns', 'businesses', 'quotes', 'samples', 'broadcasts', 'posts', 'orders', 'prices', 'trips', 'places', 'research', 'meetings']) watch(coll);
  DB.doc('config/settings').onSnapshot((snap) => { S.settingsDoc = snap.exists ? snap.data() : null; S.loaded.settings = true; schedule(); }, onErr);
  DB.doc('config/suppression').onSnapshot((snap) => { S.suppressDoc = snap.exists ? snap.data() : null; schedule(); }, onErr);
  if (S.device) {
    // replies a background Claude check copied from Gmail, and the addresses it should look for
    DB.collection('inbox').onSnapshot((snap) => { S.inbox = new Map(snap.docs.map((d) => [d.id, { ...d.data(), id: d.id }])); queueInbox(); schedule(); }, onErr);
    DB.doc('config/watch').onSnapshot((snap) => { S.watchDoc = snap.exists ? snap.data() : { terms: null }; queueInbox(); }, onErr);
  }
}
async function loadTeam() {
  if (!S.device || typeof S.device.team !== 'function') return;
  S.teamState = S.teamState === 'ready' ? 'ready' : 'loading';
  const r = await S.device.team();
  if (!r || !r.ok) { S.team = []; S.me = null; S.teamState = r && r.code === 'missing_function' ? 'missing' : 'error'; schedule(); return; }
  S.team = r.members || []; S.me = S.team.find((m) => m.is_me) || null; S.teamState = 'ready'; schedule();
}
async function init() {
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (S.ui.menu) { const k = S.ui.menu; S.ui.menu = ''; render(); const b = $(`[data-act="menu"][data-key="${CSS.escape(k)}"]`); if (b) b.focus({ preventScroll: true }); return; }
    if (S.layer) closeLayer();
  });
  initShell();
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); render(); });
  setInterval(() => { if (!S.layer && S.route.view !== 'showrooms') schedule(); }, 60000);
  route(); render();
  const use = (name) => (window.claude && typeof window.claude.use === 'function' ? window.claude.use(name).catch(() => null) : Promise.resolve(null));
  const mcpReady = use('mcp');
  const [db, sample, downloads, device] = await Promise.all([use('db'), use('sample'), use('downloads'), use('device')]);
  S.ai.sample = sample || null; S.downloads = downloads || null; S.device = device || null;
  if (sample && typeof sample.limits === 'function') { try { const lim = await sample.limits(); S.ai.images = lim && lim.images ? lim.images : null; } catch { S.ai.images = null; } }
  if (db) { DB = db; S.mode = 'db'; subscribe(); loadTeam(); }
  else { S.mode = 'local'; S.loaded = { campaigns: true, businesses: true, settings: true, places: true, research: true }; }
  schedule();
  initGmail(await mcpReady).then(async () => {
    S.perm = await use('permissions');
    setTimeout(gmailAuto, 1200); setInterval(gmailAuto, 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') gmailAuto(); });
  });
}
window.__facet = { S, Data, focusNow, setFocus, startCampaign, campaignPlan, shopState, onlineOf, moreOf, allShopsOf, afterScan, startCityResearch, remindersDue, myName, historyOf, similarShops, reorderGap, stepApplies, loadTeam, meetingsToday, render, placeKey, shopFrom, showroomReport, showroomQuery, findShowrooms, addShops, showroomsPdf, buyerIndex, buyerFor, MAPV, mergeShop, applyResearch, logReply, startSequence, markStep, todayData, settings, stepsFor, seqKindOf, localInfo, calcPrice, pcDesc, piPdf, piMail, amountWords, pdfWidth, pdfWrap, orderTotal, orderAdvance, orderPaid, orderTodo, nextPiNumber, finYear, fxUsd, autoSendable, gmailSync, gmailAuto, planStops, tripDay, postcodeOf, stripQuoted, guessTag };
init();
})();
