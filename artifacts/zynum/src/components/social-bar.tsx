import { useSocialLinks } from "@/hooks/use-social-links";

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: "hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-400",
  facebook: "hover:bg-blue-600/20 hover:border-blue-600/40 hover:text-blue-400",
  discord: "hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-400",
  telegram: "hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-400",
  youtube: "hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400",
  x: "hover:bg-white/10 hover:border-white/30 hover:text-white",
  twitter: "hover:bg-sky-400/20 hover:border-sky-400/40 hover:text-sky-400",
  instagram: "hover:bg-pink-500/20 hover:border-pink-500/40 hover:text-pink-400",
  tiktok: "hover:bg-pink-400/20 hover:border-pink-400/40 hover:text-pink-400",
};

interface SocialBarProps {
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

export function SocialBar({ className = "", label, size = "md" }: SocialBarProps) {
  const links = useSocialLinks();

  if (links.length === 0) return null;

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-9 h-9" : "w-11 h-11";

  return (
    <div className={className}>
      {label && (
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const iconSlug = link.icon ?? link.platform.toLowerCase();
          const colorClass = PLATFORM_COLORS[iconSlug] ?? "hover:bg-white/10 hover:border-white/20 hover:text-white";
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.platform}
              className={`${btnSize} rounded-xl border border-white/10 bg-white/[0.03] text-muted-foreground flex items-center justify-center transition-all ${colorClass}`}
            >
              <img
                src={`https://cdn.simpleicons.org/${iconSlug}/currentColor`}
                alt={link.platform}
                className={iconSize}
                style={{ filter: "invert(1) opacity(0.6)" }}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = "none";
                  if (t.nextSibling) return;
                  const span = document.createElement("span");
                  span.textContent = link.platform.charAt(0).toUpperCase();
                  span.className = "text-xs font-bold";
                  t.parentElement?.appendChild(span);
                }}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
