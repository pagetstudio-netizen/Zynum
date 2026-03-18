import React, { useState } from "react";
import { Link } from "wouter";
import { Code, Terminal, Key, Shield, Copy, Check, RefreshCw } from "lucide-react";
import { useGetDeveloperApiKey, useRegenerateDeveloperApiKey, useGetCurrentUser, getGetDeveloperApiKeyQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedKey, setCopiedKey] = useState(false);

  const { data: user } = useGetCurrentUser({ query: { retry: false } });
  
  const { data: apiData, isLoading: isLoadingKey } = useGetDeveloperApiKey({
    query: { enabled: !!user }
  });

  const regenMutation = useRegenerateDeveloperApiKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDeveloperApiKeyQueryKey() });
        toast({ title: "API Key Regenerated", description: "Your old key is no longer valid." });
      }
    }
  });

  const copyKey = () => {
    if (apiData?.apiKey) {
      navigator.clipboard.writeText(apiData.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Code className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-4">Developer API</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Integrate ZyNum directly into your applications. Simple, RESTful, and built for scale.
        </p>
      </div>

      {/* Authentication Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield className="text-primary w-6 h-6" /> Authentication
        </h2>
        <div className="bg-card border border-white/10 rounded-2xl p-6 md:p-8 shadow-lg">
          {user ? (
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2">Your API Key</h3>
                <p className="text-sm text-muted-foreground mb-4">Pass this key in the header: <code className="bg-black/30 px-1 py-0.5 rounded text-accent">X-API-Key: YOUR_KEY</code></p>
                <div className="flex items-center gap-3 w-full max-w-md">
                  <div className="flex-1 bg-black/40 border border-white/10 px-4 py-3 rounded-xl font-mono text-sm text-white truncate relative">
                    {isLoadingKey ? "Loading..." : apiData?.apiKey || "No key generated yet"}
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
                  </div>
                  <Button variant="secondary" className="shrink-0 bg-white/10 hover:bg-white/20 text-white border-white/10" onClick={copyKey} disabled={!apiData?.apiKey}>
                    {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="shrink-0 border-l border-white/10 pl-8 hidden md:block">
                <Button 
                  variant="outline" 
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (confirm("Are you sure? Your old API key will immediately stop working.")) {
                      regenMutation.mutate();
                    }
                  }}
                  disabled={regenMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenMutation.isPending ? 'animate-spin' : ''}`} />
                  Regenerate Key
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-white mb-2">Login to get your API Key</h3>
              <p className="text-muted-foreground mb-6">You need an account to generate developer credentials.</p>
              <Link href="/login">
                <Button className="bg-primary text-white">Log In / Register</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Terminal className="text-primary w-6 h-6" /> Endpoints
        </h2>

        {/* Buy Number */}
        <EndpointCard 
          method="POST" 
          path="/api/v1/buy" 
          title="Buy a Virtual Number"
          description="Purchases a number for a specific service and country."
          reqBody={`{\n  "service": "telegram",\n  "country": "russia",\n  "currency": "USD"\n}`}
          resBody={`{\n  "order": {\n    "id": "ord_123abc",\n    "phone": "+79991234567",\n    "status": "PENDING",\n    "priceUsd": 0.50\n    // ...\n  }\n}`}
        />

        {/* Check SMS */}
        <EndpointCard 
          method="GET" 
          path="/api/v1/check/{orderId}" 
          title="Check SMS Status"
          description="Poll this endpoint every 5 seconds to get the SMS code."
          resBody={`{\n  "order": {\n    "id": "ord_123abc",\n    "status": "RECEIVED",\n    "smsCode": "48151",\n    "smsText": "Your Telegram code is 48151"\n  }\n}`}
        />

        {/* Balance */}
        <EndpointCard 
          method="GET" 
          path="/api/v1/balance" 
          title="Get Balance"
          description="Check your current 5SIM platform balance."
          resBody={`{\n  "balance": 1450.50,\n  "currency": "RUB",\n  "isLow": false\n}`}
        />
      </section>
    </div>
  );
}

function EndpointCard({ method, path, title, description, reqBody, resBody }: any) {
  const methodColors: any = {
    GET: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    POST: "bg-green-500/20 text-green-400 border-green-500/30"
  };

  return (
    <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-lg">
      <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-xs font-bold border font-mono ${methodColors[method]}`}>{method}</span>
          <span className="font-mono text-white text-sm bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">{path}</span>
        </div>
        <div className="sm:ml-auto text-sm font-medium text-white">{title}</div>
      </div>
      <div className="p-6">
        <p className="text-muted-foreground text-sm mb-6">{description}</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {reqBody && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Request Body</div>
              <pre className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-x-auto">
                <code className="text-sm font-mono text-blue-300">{reqBody}</code>
              </pre>
            </div>
          )}
          <div className={reqBody ? "" : "md:col-span-2"}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Response Example</div>
            <pre className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-x-auto">
              <code className="text-sm font-mono text-green-300">{resBody}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
