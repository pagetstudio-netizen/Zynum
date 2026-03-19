import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import {
  History, RefreshCcw, Lock, ChevronLeft, ChevronRight,
  Package, CheckCircle2, Clock, XCircle, Copy, Check,
  X, Loader2,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { useGetOrderHistory, useGetCurrentUser, useCancelOrder } from "@workspace/api-client-react";

const DURATION = 360;
function useTimeLeft(createdAt: string): number {
  const [left, setLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    return Math.max(0, DURATION - elapsed);
  });
  useEffect(() => {
    if (left === 0) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      setLeft(Math.max(0, DURATION - elapsed));
    }, 1000);
    return () => clearInterval(id);
  }, [createdAt, left]);
  return left;
}

function TimerBadge({ createdAt }: { createdAt: string }) {
  const { t } = useLanguage();
  const left = useTimeLeft(createdAt);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  if (left === 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> {t("history_timer_expired")}
    </span>
  );
  const urgent = left <= 60;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
      urgent ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    }`}>
      <Clock className="w-3 h-3" />
      {urgent ? `⚠️ ${mm}:${ss}` : `${mm}:${ss}`}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PENDING:  { label: t("history_status_pending"),  cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: <Clock className="w-3 h-3" /> },
    RECEIVED: { label: t("history_status_received"), cls: "bg-green-500/10  text-green-400  border-green-500/20",  icon: <CheckCircle2 className="w-3 h-3" /> },
    FINISHED: { label: t("history_status_finished"), cls: "bg-green-500/10  text-green-400  border-green-500/20",  icon: <CheckCircle2 className="w-3 h-3" /> },
    TIMEOUT:  { label: t("history_status_timeout"),  cls: "bg-gray-500/10   text-gray-400   border-gray-500/20",   icon: <XCircle className="w-3 h-3" /> },
    CANCELED: { label: t("history_status_canceled"), cls: "bg-gray-500/10   text-gray-400   border-gray-500/20",   icon: <XCircle className="w-3 h-3" /> },
    BANNED:   { label: t("history_status_banned"),   cls: "bg-red-500/10    text-red-400    border-red-500/20",    icon: <XCircle className="w-3 h-3" /> },
  };
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-white/5 text-white border-white/10", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-lg hover:bg-green-400/20 transition-all group">
      {code}
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />}
    </button>
  );
}

function CancelPendingButton({ orderId, refetch }: { orderId: string; refetch: () => void }) {
  const { t } = useLanguage();
  const cancel = useCancelOrder({ mutation: { onSuccess: () => refetch() } });
  return (
    <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => cancel.mutate(orderId)} disabled={cancel.isPending}>
      {cancel.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1" />{t("history_cancel_refund")}</>}
    </Button>
  );
}

function OrderCard({ order, formatPrice, refetch }: { order: any; formatPrice: (usd: number, fcfa?: number) => string; refetch: () => void }) {
  const { t, lang } = useLanguage();
  const isPending = order.status === "PENDING";
  const timeLeft = useTimeLeft(order.createdAt);
  const locale = lang === "fr" ? fr : enUS;

  return (
    <div className={`bg-white/[0.02] border rounded-2xl p-4 space-y-3 transition-colors ${isPending ? "border-yellow-500/20" : "border-white/[0.06]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{order.serviceName}</p>
            <p className="text-xs text-muted-foreground">{order.countryName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} />
          {isPending && <TimerBadge createdAt={order.createdAt} />}
        </div>
      </div>
      <div className="bg-black/30 rounded-xl px-3 py-2 font-mono text-sm text-white/80">{order.phone}</div>
      {order.smsCode ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{t("history_sms_code")}</span>
          <CopyCode code={order.smsCode} />
        </div>
      ) : isPending ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCcw className="w-3 h-3 animate-spin" />
            {t("history_waiting")} {timeLeft > 0 ? `(${String(Math.floor(timeLeft / 60)).padStart(2,"0")}:${String(timeLeft % 60).padStart(2,"0")} ${t("history_remaining")})` : `(${t("history_timer_expired")})`}
          </div>
          <CancelPendingButton orderId={order.id} refetch={refetch} />
        </div>
      ) : null}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "dd MMM yyyy · HH:mm", { locale })}</span>
        <span className="text-sm font-bold text-white font-mono">{formatPrice(order.priceUsd, order.priceFcfa)}</span>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const { t, lang } = useLanguage();
  const { formatPrice } = useCurrency();
  const [page, setPage] = useState(1);
  const limit = 15;
  const locale = lang === "fr" ? fr : enUS;

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({ query: { retry: false } });
  const { data: historyData, isLoading, isFetching, refetch } = useGetOrderHistory(
    { page, limit },
    {
      query: {
        enabled: !!user,
        refetchInterval: (query) => {
          const hasPending = query.state.data?.orders.some((o) => o.status === "PENDING");
          return hasPending ? 5000 : false;
        },
      },
    }
  );

  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><RefreshCcw className="w-7 h-7 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-5 border border-white/10">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t("history_login_required")}</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">{t("history_login_desc")}</p>
        <Link href="/login">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">{t("history_login_btn")}</Button>
        </Link>
      </div>
    );
  }

  const totalPages = historyData ? Math.ceil(historyData.total / limit) : 1;
  const orders = historyData?.orders ?? [];
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, historyData?.total ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{t("history_title")}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{t("history_sub")}</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-white shrink-0" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          {t("history_refresh")}
        </Button>
      </div>

      {historyData && historyData.total > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5">
          <History className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{historyData.total} {historyData.total > 1 ? t("history_orders_plural") : t("history_orders")} — {t("history_total")}</span>
          {historyData.total > limit && (
            <span className="ml-auto">{t("history_showing")} {from}–{to}</span>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCcw className="w-6 h-6 animate-spin text-primary opacity-50" />
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History className="w-12 h-12 mb-4 text-muted-foreground/30" />
          <p className="text-lg font-semibold text-white mb-1">{t("history_no_orders")}</p>
          <p className="text-muted-foreground text-sm mb-5">{t("history_no_orders_desc")}</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "buy" }))}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {t("history_buy_btn")}
          </button>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} formatPrice={formatPrice} refetch={refetch} />
            ))}
          </div>
          <div className="hidden md:block rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    {[
                      t("history_th_date"),
                      t("history_th_service"),
                      t("history_th_country"),
                      t("history_th_number"),
                      t("history_th_status"),
                      t("history_th_action"),
                      t("history_th_price"),
                    ].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i === 6 ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {orders.map((order) => {
                    const isPending = order.status === "PENDING";
                    return (
                      <tr key={order.id} className={`hover:bg-white/[0.02] transition-colors ${isPending ? "bg-yellow-500/[0.02]" : ""}`}>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-sm text-white">{format(new Date(order.createdAt), "dd MMM yyyy", { locale })}</p>
                          <p className="text-xs text-muted-foreground font-mono">{format(new Date(order.createdAt), "HH:mm:ss")}</p>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-white">{order.serviceName}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-white">{order.countryName}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-sm text-white/80">{order.phone}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={order.status} />
                            {isPending && <TimerBadge createdAt={order.createdAt} />}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {order.smsCode ? (
                            <CopyCode code={order.smsCode} />
                          ) : isPending ? (
                            <div className="flex flex-col gap-1.5">
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <RefreshCcw className="w-3 h-3 animate-spin" /> {t("history_waiting_short")}
                              </span>
                              <CancelPendingButton orderId={order.id} refetch={refetch} />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono text-sm font-semibold text-white">
                          {formatPrice(order.priceUsd, order.priceFcfa)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {historyData && historyData.total > limit && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {from}–{to} {t("history_of")} {historyData.total} {t("history_results")}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-white/10 text-white hover:bg-white/10 h-8 px-3">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-white/10 text-white hover:bg-white/10 h-8 px-3">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
