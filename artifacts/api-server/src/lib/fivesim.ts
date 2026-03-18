const BASE_URL = "https://5sim.net/v1";
const FCFA_RATE = 620;

export function usdToFcfa(usd: number): number {
  return Math.round(usd * FCFA_RATE);
}

async function fiveSimRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const apiKey = process.env.FIVESIM_API_KEY;
  if (!apiKey) throw new Error("FIVESIM_API_KEY not configured");

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`5SIM API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types returned by 5SIM API ───────────────────────────────────────────────

export interface FiveSimProfile {
  id: number;
  email: string;
  balance: number;
  rating: number;
  frozen_balance: number;
  total_active_orders: number;
}

// GET /v1/guest/countries
// { [countryName]: { iso: {[code]:1}, prefix: {[prefix]:1}, text_en: string, ... } }
interface FiveSimCountry {
  iso: Record<string, number>;
  prefix: Record<string, number>;
  text_en: string;
  text_ru: string;
}

// GET /v1/guest/prices?product=telegram
// { [product]: { [country]: { [operator]: { cost, count } } } }
interface FiveSimPriceEntry {
  cost: number;
  count: number;
  rate?: number;
}

// GET /v1/guest/products/{country}/any
// { [product]: { Category, Qty, Price } }
interface FiveSimProductEntry {
  Category: string;
  Qty: number;
  Price: number;
}

// GET /v1/user/buy/activation/{country}/any/{product}
export interface FiveSimOrder {
  id: number;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: string;
  expires: string;
  sms: Array<{
    created_at: string;
    date: string;
    sender: string;
    text: string;
    code: string;
  }>;
  created_at: string;
}

// ─── Our service/country types ────────────────────────────────────────────────

export interface ServiceInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  priceUsd: number;
  priceFcfa: number;
  available: number;
}

// ─── Static service catalogue ─────────────────────────────────────────────────

const CDN = "https://cdn.simpleicons.org";

const SERVICE_MAP: Record<string, { name: string; icon: string; color: string; category: string }> = {
  telegram:  { name: "Telegram",       icon: `${CDN}/telegram/ffffff`,   color: "#2AABEE", category: "Messagerie" },
  whatsapp:  { name: "WhatsApp",       icon: `${CDN}/whatsapp/ffffff`,   color: "#25D366", category: "Messagerie" },
  google:    { name: "Gmail / Google", icon: `${CDN}/gmail/ffffff`,      color: "#EA4335", category: "Email" },
  facebook:  { name: "Facebook",       icon: `${CDN}/facebook/ffffff`,   color: "#1877F2", category: "Social" },
  instagram: { name: "Instagram",      icon: `${CDN}/instagram/ffffff`,  color: "#E4405F", category: "Social" },
  twitter:   { name: "Twitter / X",    icon: `${CDN}/x/ffffff`,          color: "#14171A", category: "Social" },
  tiktok:    { name: "TikTok",         icon: `${CDN}/tiktok/ffffff`,     color: "#010101", category: "Social" },
  uber:      { name: "Uber",           icon: `${CDN}/uber/ffffff`,       color: "#000000", category: "Transport" },
  amazon:    { name: "Amazon",         icon: `${CDN}/amazon/ffffff`,     color: "#FF9900", category: "Shopping" },
  microsoft: { name: "Microsoft",      icon: `${CDN}/microsoft/ffffff`,  color: "#0078D4", category: "Tech" },
  paypal:    { name: "PayPal",         icon: `${CDN}/paypal/ffffff`,     color: "#003087", category: "Finance" },
  snapchat:  { name: "Snapchat",       icon: `${CDN}/snapchat/ffffff`,   color: "#FFFC00", category: "Social" },
  discord:   { name: "Discord",        icon: `${CDN}/discord/ffffff`,    color: "#5865F2", category: "Gaming" },
  linkedin:  { name: "LinkedIn",       icon: `${CDN}/linkedin/ffffff`,   color: "#0A66C2", category: "Pro" },
  binance:   { name: "Binance",        icon: `${CDN}/binance/ffffff`,    color: "#F0B90B", category: "Crypto" },
  airbnb:    { name: "Airbnb",         icon: `${CDN}/airbnb/ffffff`,     color: "#FF5A5F", category: "Voyage" },
  ebay:      { name: "eBay",           icon: `${CDN}/ebay/ffffff`,       color: "#E43142", category: "Shopping" },
  netflix:   { name: "Netflix",        icon: `${CDN}/netflix/ffffff`,    color: "#E50914", category: "Streaming" },
  steam:     { name: "Steam",          icon: `${CDN}/steam/ffffff`,      color: "#1B2838", category: "Gaming" },
  shopee:    { name: "Shopee",         icon: `${CDN}/shopee/ffffff`,     color: "#EE4D2D", category: "Shopping" },
};

// ISO code → emoji flag
function isoToFlag(iso: string): string {
  const code = iso.toLowerCase();
  const flagMap: Record<string, string> = {
    af: "🇦🇫", al: "🇦🇱", dz: "🇩🇿", ao: "🇦🇴", ag: "🇦🇬",
    ar: "🇦🇷", am: "🇦🇲", aw: "🇦🇼", au: "🇦🇺", at: "🇦🇹",
    az: "🇦🇿", bs: "🇧🇸", bh: "🇧🇭", bd: "🇧🇩", by: "🇧🇾",
    be: "🇧🇪", bz: "🇧🇿", bj: "🇧🇯", bo: "🇧🇴", ba: "🇧🇦",
    bw: "🇧🇼", br: "🇧🇷", bn: "🇧🇳", bg: "🇧🇬", bf: "🇧🇫",
    bi: "🇧🇮", kh: "🇰🇭", cm: "🇨🇲", ca: "🇨🇦", cv: "🇨🇻",
    cf: "🇨🇫", td: "🇹🇩", cl: "🇨🇱", co: "🇨🇴", km: "🇰🇲",
    cg: "🇨🇬", cd: "🇨🇩", cr: "🇨🇷", ci: "🇨🇮", hr: "🇭🇷",
    cy: "🇨🇾", cz: "🇨🇿", dk: "🇩🇰", dj: "🇩🇯", dm: "🇩🇲",
    do: "🇩🇴", ec: "🇪🇨", eg: "🇪🇬", sv: "🇸🇻", gq: "🇬🇶",
    er: "🇪🇷", ee: "🇪🇪", sz: "🇸🇿", et: "🇪🇹", fj: "🇫🇯",
    fi: "🇫🇮", fr: "🇫🇷", ga: "🇬🇦", gm: "🇬🇲", ge: "🇬🇪",
    de: "🇩🇪", gh: "🇬🇭", gr: "🇬🇷", gd: "🇬🇩", gt: "🇬🇹",
    gn: "🇬🇳", gw: "🇬🇼", gy: "🇬🇾", ht: "🇭🇹", hn: "🇭🇳",
    hu: "🇭🇺", is: "🇮🇸", in: "🇮🇳", id: "🇮🇩", ir: "🇮🇷",
    iq: "🇮🇶", ie: "🇮🇪", il: "🇮🇱", it: "🇮🇹", jm: "🇯🇲",
    jp: "🇯🇵", jo: "🇯🇴", kz: "🇰🇿", ke: "🇰🇪", ki: "🇰🇮",
    kp: "🇰🇵", kr: "🇰🇷", kw: "🇰🇼", kg: "🇰🇬", la: "🇱🇦",
    lv: "🇱🇻", lb: "🇱🇧", ls: "🇱🇸", lr: "🇱🇷", ly: "🇱🇾",
    lt: "🇱🇹", lu: "🇱🇺", mg: "🇲🇬", mw: "🇲🇼", my: "🇲🇾",
    mv: "🇲🇻", ml: "🇲🇱", mt: "🇲🇹", mh: "🇲🇭", mr: "🇲🇷",
    mu: "🇲🇺", mx: "🇲🇽", fm: "🇫🇲", md: "🇲🇩", mc: "🇲🇨",
    mn: "🇲🇳", me: "🇲🇪", ma: "🇲🇦", mz: "🇲🇿", mm: "🇲🇲",
    na: "🇳🇦", nr: "🇳🇷", np: "🇳🇵", nl: "🇳🇱", nz: "🇳🇿",
    ni: "🇳🇮", ne: "🇳🇪", ng: "🇳🇬", no: "🇳🇴", om: "🇴🇲",
    pk: "🇵🇰", pw: "🇵🇼", pa: "🇵🇦", pg: "🇵🇬", py: "🇵🇾",
    pe: "🇵🇪", ph: "🇵🇭", pl: "🇵🇱", pt: "🇵🇹", qa: "🇶🇦",
    ro: "🇷🇴", rw: "🇷🇼", kn: "🇰🇳", lc: "🇱🇨", vc: "🇻🇨",
    ws: "🇼🇸", sm: "🇸🇲", st: "🇸🇹", sa: "🇸🇦", sn: "🇸🇳",
    rs: "🇷🇸", sl: "🇸🇱", sg: "🇸🇬", sk: "🇸🇰", si: "🇸🇮",
    sb: "🇸🇧", so: "🇸🇴", za: "🇿🇦", ss: "🇸🇸", es: "🇪🇸",
    lk: "🇱🇰", sd: "🇸🇩", sr: "🇸🇷", se: "🇸🇪", ch: "🇨🇭",
    sy: "🇸🇾", tw: "🇹🇼", tj: "🇹🇯", tz: "🇹🇿", th: "🇹🇭",
    tl: "🇹🇱", tg: "🇹🇬", to: "🇹🇴", tt: "🇹🇹", tn: "🇹🇳",
    tr: "🇹🇷", tm: "🇹🇲", tv: "🇹🇻", ug: "🇺🇬", ua: "🇺🇦",
    ae: "🇦🇪", gb: "🇬🇧", us: "🇺🇸", uy: "🇺🇾", uz: "🇺🇿",
    vu: "🇻🇺", ve: "🇻🇪", vn: "🇻🇳", ye: "🇾🇪", zm: "🇿🇲",
    zw: "🇿🇼",
  };
  return flagMap[code] ?? "🏳️";
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

let countryCacheRaw: Record<string, FiveSimCountry> | null = null;
let countryCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

async function getRawCountries(): Promise<Record<string, FiveSimCountry>> {
  if (countryCacheRaw && Date.now() - countryCacheTime < CACHE_TTL) {
    return countryCacheRaw;
  }
  const data = await fiveSimRequest<Record<string, FiveSimCountry>>("/guest/countries");
  countryCacheRaw = data;
  countryCacheTime = Date.now();
  return data;
}

// prices cache: product → data
const priceCache: Map<string, { data: Record<string, Record<string, FiveSimPriceEntry>>; ts: number }> = new Map();

async function getPricesForProduct(
  product: string
): Promise<Record<string, Record<string, FiveSimPriceEntry>>> {
  const cached = priceCache.get(product);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // Response shape: { [product]: { [country]: { [operator]: { cost, count } } } }
  const raw = await fiveSimRequest<Record<string, Record<string, Record<string, FiveSimPriceEntry>>>>(
    `/guest/prices?product=${encodeURIComponent(product)}`
  );
  const data = raw[product] ?? {};
  priceCache.set(product, { data, ts: Date.now() });
  return data;
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export async function getProfile(): Promise<FiveSimProfile> {
  return fiveSimRequest<FiveSimProfile>("/user/profile");
}

export function getAvailableServices(): ServiceInfo[] {
  return Object.entries(SERVICE_MAP).map(([id, { name, icon, color, category }]) => ({
    id, name, icon, color, category,
  }));
}

export async function getCountriesForService(service: string): Promise<CountryInfo[]> {
  const [rawCountries, prices] = await Promise.all([
    getRawCountries(),
    getPricesForProduct(service),
  ]);

  const result: CountryInfo[] = [];

  for (const [countryCode, operatorMap] of Object.entries(prices)) {
    const meta = rawCountries[countryCode];
    if (!meta) continue;

    let bestPrice = Infinity;
    let totalAvailable = 0;

    for (const entry of Object.values(operatorMap)) {
      if (entry.cost < bestPrice) bestPrice = entry.cost;
      totalAvailable += entry.count || 0;
    }

    if (bestPrice === Infinity) continue;

    const isoCode = Object.keys(meta.iso ?? {})[0] ?? "";
    const flag = isoToFlag(isoCode);

    result.push({
      code: countryCode,
      name: meta.text_en,
      flag,
      priceUsd: Math.round(bestPrice * 100) / 100,
      priceFcfa: usdToFcfa(bestPrice),
      available: totalAvailable,
    });
  }

  // Sort by price ascending
  return result.sort((a, b) => a.priceUsd - b.priceUsd);
}

export async function buyNumber(service: string, country: string): Promise<FiveSimOrder> {
  return fiveSimRequest<FiveSimOrder>(`/user/buy/activation/${country}/any/${service}`);
}

export async function checkOrder(orderId: number): Promise<FiveSimOrder> {
  return fiveSimRequest<FiveSimOrder>(`/user/check/${orderId}`);
}

export function getServiceName(serviceId: string): string {
  return SERVICE_MAP[serviceId]?.name ?? serviceId;
}

// Synchronous helper — uses the raw country name key (already text_en from 5SIM)
// We store the text_en name in the DB so we just return whatever was passed in.
// If you need to resolve a code dynamically, use getRawCountries() instead.
export function getCountryName(countryCode: string): string {
  // Capitalize the first letter of each word
  return countryCode.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mapFiveSimStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: "PENDING",
    RECEIVED: "RECEIVED",
    FINISHED: "FINISHED",
    TIMEOUT: "TIMEOUT",
    BANNED: "BANNED",
    CANCELED: "CANCELED",
  };
  return map[status?.toUpperCase()] ?? "PENDING";
}
