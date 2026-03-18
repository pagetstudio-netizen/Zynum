import React, { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { History, Search, RefreshCcw, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetOrderHistory, useGetCurrentUser } from "@workspace/api-client-react";

export default function OrderHistory() {
  const { currency, formatPrice } = useCurrency();
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({ query: { retry: false } });

  const { 
    data: historyData, 
    isLoading, 
    isFetching,
    refetch 
  } = useGetOrderHistory(
    { page, limit },
    { 
      query: { 
        enabled: !!user,
        // Polling if there's any pending order in the current view
        refetchInterval: (query) => {
          const hasPending = query.state.data?.orders.some(o => o.status === 'PENDING');
          return hasPending ? 5000 : false;
        }
      } 
    }
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">Pending</Badge>;
      case 'RECEIVED':
      case 'FINISHED':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20">Received</Badge>;
      case 'TIMEOUT':
      case 'CANCELED':
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20">Timeout</Badge>;
      case 'BANNED':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20">Banned</Badge>;
      default:
        return <Badge className="bg-secondary text-white border-white/10">{status}</Badge>;
    }
  };

  if (isUserLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-[60vh]"><RefreshCcw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-4">View Your History</h2>
        <p className="text-muted-foreground max-w-md mb-8">Log in to view your past purchases and SMS codes.</p>
        <Link href="/login"><Button className="bg-primary text-white">Log In</Button></Link>
      </div>
    );
  }

  const totalPages = historyData ? Math.ceil(historyData.total / limit) : 1;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <History className="w-8 h-8 text-primary" />
            </div>
            Order History
          </h1>
          <p className="text-muted-foreground mt-2 ml-14">View your past virtual numbers and received codes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-white/10 bg-card hover:bg-white/5 text-white shadow-sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SMS Code</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                    Loading history...
                  </td>
                </tr>
              ) : !historyData || historyData.orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <History className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-medium text-white mb-1">No orders found</p>
                      <p>You haven't purchased any numbers yet.</p>
                      <Link href="/buy" className="mt-4">
                        <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">Buy a Number</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                historyData.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{format(new Date(order.createdAt), 'HH:mm:ss')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{order.serviceName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{order.countryName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-white">
                      {order.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      {order.smsCode ? (
                        <div className="font-mono text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded inline-block border border-green-400/20">
                          {order.smsCode}
                        </div>
                      ) : order.status === 'PENDING' ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <RefreshCcw className="w-3 h-3 animate-spin" /> Waiting...
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-sm text-white">
                      {formatPrice(order.priceUsd, order.priceFcfa)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {historyData && historyData.total > limit && (
          <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to Math.min(page * limit, historyData.total) of {historyData.total} results
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-white/10 text-white hover:bg-white/10 h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center px-3 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-md">
                {page} / {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-white/10 text-white hover:bg-white/10 h-8 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
