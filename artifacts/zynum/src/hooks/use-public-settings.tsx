import { useQuery } from "@tanstack/react-query";

export interface PublicSettings {
  platform_name?: string;
  support_email?: string;
  support_telegram?: string;
  support_whatsapp?: string;
  maintenance_mode?: string;
  maintenance_buy?: string;
  commission_type?: string;
  commission_value?: string;
  currency_rate?: string;
  whatsapp_button_enabled?: string;
  whatsapp_button_link?: string;
  playstore_url?: string;
  appstore_url?: string;
}

export function usePublicSettings() {
  const { data, isLoading } = useQuery<PublicSettings>({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/settings");
      if (!res.ok) return {};
      const json = await res.json();
      // The API wraps settings in { settings: {...} } — unwrap safely
      return (json.settings ?? json) as PublicSettings;
    },
    staleTime: 5 * 60 * 1000,
  });
  return { settings: data ?? {}, isLoading };
}

export function openTelegramSupport(telegramHandle: string) {
  const url = telegramHandle.startsWith("http")
    ? telegramHandle
    : `https://t.me/${telegramHandle.replace(/^@/, "")}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openWhatsAppSupport(linkOrNumber: string) {
  let url: string;
  if (linkOrNumber.startsWith("http")) {
    url = linkOrNumber;
  } else {
    // Strip spaces, dashes, parentheses
    const cleaned = linkOrNumber.replace(/[\s\-().]/g, "");
    url = `https://wa.me/${cleaned.replace(/^\+/, "")}`;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
