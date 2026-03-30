import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { CurrencyProvider } from "@/hooks/use-currency";
import { LanguageProvider } from "@/hooks/use-language";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import BuyNumber from "@/pages/buy";
import Dashboard from "@/pages/dashboard";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Contact from "@/pages/contact";
import HelpCenter from "@/pages/aide";
import ApiDocs from "@/pages/api-docs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ThemeByRoute() {
  const [location] = useLocation();
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ThemeByRoute />
      <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/buy" component={BuyNumber} />
            <Route path="/history">{() => <Redirect to="/dashboard" />}</Route>
            <Route path="/aide" component={HelpCenter} />
            <Route path="/about" component={About} />
            <Route path="/faq" component={FAQ} />
            <Route path="/terms" component={Terms} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/contact" component={Contact} />
            <Route path="/api-docs" component={ApiDocs} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </CurrencyProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
