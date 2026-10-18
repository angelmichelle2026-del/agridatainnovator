import { type ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell, type Language } from "@/components/app-shell";
import {
  AssistantPage,
  ComparePage,
  DashboardPage,
  DataPage,
  HomePage,
  NotFoundPage,
} from "@/pages/sections";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();

function Router({ language }: { language: Language }) {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={() => <HomePage language={language} />} />
        <Route
          path="/data"
          component={() => <DataPage language={language} />}
        />
        <Route
          path="/dashboard"
          component={() => <DashboardPage language={language} />}
        />
        <Route
          path="/compare"
          component={() => <ComparePage language={language} />}
        />
        <Route
          path="/assistant"
          component={() => <AssistantPage language={language} />}
        />
        <Route component={() => <NotFoundPage language={language} />} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem("agrilens-language") === "rw" ? "rw" : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    try {
      localStorage.setItem("agrilens-language", next);
    } catch {
      // Language selection remains active for this session when storage is unavailable.
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppShell language={language} onLanguageChange={changeLanguage}>
            <Router language={language} />
          </AppShell>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
