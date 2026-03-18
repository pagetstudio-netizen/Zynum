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

export interface FiveSimProfile {
  id: number;
  email: string;
  vendor: string;
  balance: number;
  rating: number;
}

export interface FiveSimCountryProduct {
  [country: string]: {
    [category: string]: {
      [product: string]: {
        Price: number;
        Count: number;
      };
    };
  };
}

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

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  priceUsd: number;
  priceFcfa: number;
  available: number;
}

export interface ServiceInfo {
  id: string;
  name: string;
  icon: string;
  category: string;
}

const SERVICE_MAP: Record<string, { name: string; icon: string; category: string }> = {
  telegram: { name: "Telegram", icon: "💬", category: "Messaging" },
  whatsapp: { name: "WhatsApp", icon: "📱", category: "Messaging" },
  google: { name: "Gmail / Google", icon: "📧", category: "Email" },
  facebook: { name: "Facebook", icon: "👤", category: "Social" },
  instagram: { name: "Instagram", icon: "📸", category: "Social" },
  twitter: { name: "Twitter / X", icon: "🐦", category: "Social" },
  tiktok: { name: "TikTok", icon: "🎵", category: "Social" },
  uber: { name: "Uber", icon: "🚗", category: "Transport" },
  amazon: { name: "Amazon", icon: "📦", category: "Shopping" },
  microsoft: { name: "Microsoft", icon: "💻", category: "Tech" },
  paypal: { name: "PayPal", icon: "💳", category: "Finance" },
  snapchat: { name: "Snapchat", icon: "👻", category: "Social" },
  discord: { name: "Discord", icon: "🎮", category: "Gaming" },
  linkedin: { name: "LinkedIn", icon: "💼", category: "Professional" },
  binance: { name: "Binance", icon: "₿", category: "Crypto" },
  airbnb: { name: "Airbnb", icon: "🏠", category: "Travel" },
};

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  russia: { name: "Russie", flag: "🇷🇺" },
  ukraine: { name: "Ukraine", flag: "🇺🇦" },
  china: { name: "Chine", flag: "🇨🇳" },
  usa: { name: "États-Unis", flag: "🇺🇸" },
  indonesia: { name: "Indonésie", flag: "🇮🇩" },
  philippines: { name: "Philippines", flag: "🇵🇭" },
  india: { name: "Inde", flag: "🇮🇳" },
  brazil: { name: "Brésil", flag: "🇧🇷" },
  kenya: { name: "Kenya", flag: "🇰🇪" },
  ghana: { name: "Ghana", flag: "🇬🇭" },
  nigeria: { name: "Nigeria", flag: "🇳🇬" },
  cameroon: { name: "Cameroun", flag: "🇨🇲" },
  senegal: { name: "Sénégal", flag: "🇸🇳" },
  cotedivoire: { name: "Côte d'Ivoire", flag: "🇨🇮" },
  france: { name: "France", flag: "🇫🇷" },
  england: { name: "Royaume-Uni", flag: "🇬🇧" },
  germany: { name: "Allemagne", flag: "🇩🇪" },
  vietnam: { name: "Vietnam", flag: "🇻🇳" },
  thailand: { name: "Thaïlande", flag: "🇹🇭" },
  cambodia: { name: "Cambodge", flag: "🇰🇭" },
  myanmar: { name: "Myanmar", flag: "🇲🇲" },
  pakistan: { name: "Pakistan", flag: "🇵🇰" },
  bangladesh: { name: "Bangladesh", flag: "🇧🇩" },
  kazakhstan: { name: "Kazakhstan", flag: "🇰🇿" },
  uzbekistan: { name: "Ouzbékistan", flag: "🇺🇿" },
};

export async function getProfile(): Promise<FiveSimProfile> {
  return fiveSimRequest<FiveSimProfile>("/user/profile");
}

export async function getAvailableServices(): Promise<ServiceInfo[]> {
  return Object.entries(SERVICE_MAP).map(([id, info]) => ({
    id,
    ...info,
  }));
}

export async function getCountriesForService(service: string): Promise<CountryInfo[]> {
  try {
    const data = await fiveSimRequest<FiveSimCountryProduct>(`/guest/products/${service}/any`);
    const countries: CountryInfo[] = [];

    for (const [countryCode, categories] of Object.entries(data)) {
      const countryInfo = COUNTRY_MAP[countryCode];
      if (!countryInfo) continue;

      let bestPrice = Infinity;
      let totalAvailable = 0;

      for (const categoryProducts of Object.values(categories)) {
        for (const productData of Object.values(categoryProducts)) {
          if (productData.Price < bestPrice) {
            bestPrice = productData.Price;
          }
          totalAvailable += productData.Count || 0;
        }
      }

      if (bestPrice === Infinity || totalAvailable === 0) continue;

      countries.push({
        code: countryCode,
        name: countryInfo.name,
        flag: countryInfo.flag,
        priceUsd: bestPrice,
        priceFcfa: usdToFcfa(bestPrice),
        available: totalAvailable,
      });
    }

    return countries.sort((a, b) => a.priceUsd - b.priceUsd);
  } catch {
    return Object.entries(COUNTRY_MAP).slice(0, 10).map(([code, info]) => ({
      code,
      name: info.name,
      flag: info.flag,
      priceUsd: 0.5,
      priceFcfa: usdToFcfa(0.5),
      available: 10,
    }));
  }
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

export function getCountryName(countryCode: string): string {
  return COUNTRY_MAP[countryCode]?.name ?? countryCode;
}

export function mapFiveSimStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "PENDING",
    RECEIVED: "RECEIVED",
    FINISHED: "FINISHED",
    TIMEOUT: "TIMEOUT",
    BANNED: "BANNED",
    CANCELED: "CANCELED",
  };
  return statusMap[status.toUpperCase()] ?? "PENDING";
}
