import type { ReactNode } from "react";
import { UserRound } from "lucide-react";

export const authBlue = "#3157d5";

export const authInputClass =
  "w-full rounded-xl border border-transparent bg-[#f1f3f7] px-4 py-3.5 text-[15px] text-[#172033] outline-none transition-all placeholder:text-[#9aa3b2] focus:border-[#3157d5] focus:bg-white focus:ring-4 focus:ring-[#3157d5]/10";

export const authButtonClass =
  "w-full rounded-xl bg-[#3157d5] py-3.5 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(49,87,213,0.24)] transition-all hover:bg-[#2749bd] focus:outline-none focus:ring-4 focus:ring-[#3157d5]/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

export const authLinkClass =
  "font-semibold text-[#3157d5] transition-colors hover:text-[#203da7]";

export function AuthAvatar() {
  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-24 items-center justify-center rounded-full border-[5px] border-white bg-[#3157d5] shadow-[0_12px_28px_rgba(49,87,213,0.3)] sm:h-28 sm:w-28"
    >
      <UserRound className="h-14 w-14 text-white sm:h-16 sm:w-16" strokeWidth={1.5} />
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#f5f7fb] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[#e7ebf3] bg-white shadow-[0_20px_60px_rgba(36,52,88,0.12)]">
        <div className="relative h-36 overflow-visible bg-gradient-to-b from-[#eaf0fb] via-[#f1f5fc] to-[#f8faff]">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(135deg, rgba(49,87,213,0.06), transparent 45%), radial-gradient(circle at 82% 20%, rgba(49,87,213,0.12), transparent 26%)" }} />
          <div className="absolute bottom-[-3.5rem] left-1/2 -translate-x-1/2">
            <AuthAvatar />
          </div>
        </div>
        <div className="px-5 pb-9 pt-16 sm:px-12 sm:pb-12">{children}</div>
      </div>
      <p className="mx-auto mt-5 max-w-[560px] text-center text-xs text-[#a0a8b8]">
        ZyNum · Numéros virtuels et codes SMS sécurisés
      </p>
    </div>
  );
}