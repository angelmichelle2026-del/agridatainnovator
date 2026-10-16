import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart3,
  BookOpen,
  GitCompareArrows,
  Home,
  Languages,
  Leaf,
  MessageSquareText,
  ScanSearch,
} from "lucide-react";

export type Language = "en" | "rw";

const navigation = [
  {
    href: "/",
    icon: Home,
    en: "Home",
    rw: "Ahabanza",
    shortEn: "Home",
    shortRw: "Ahabanza",
  },
  {
    href: "/data",
    icon: ScanSearch,
    en: "Explore data",
    rw: "Shakisha amakuru",
    shortEn: "Data",
    shortRw: "Amakuru",
  },
  {
    href: "/dashboard",
    icon: BarChart3,
    en: "Seasonal picture",
    rw: "Ishusho y’ibihe",
    shortEn: "Seasons",
    shortRw: "Ibihe",
  },
  {
    href: "/compare",
    icon: GitCompareArrows,
    en: "Compare districts",
    rw: "Gereranya uturere",
    shortEn: "Compare",
    shortRw: "Gereranya",
  },
  {
    href: "/insights",
    icon: Activity,
    en: "Changes & context",
    rw: "Impinduka n’ibisobanuro",
    shortEn: "Insights",
    shortRw: "Ibyagaragaye",
  },
  {
    href: "/assistant",
    icon: MessageSquareText,
    en: "Ask AgriLens",
    rw: "Baza AgriLens",
    shortEn: "Ask AI",
    shortRw: "Baza AI",
  },
  {
    href: "/about",
    icon: BookOpen,
    en: "Sources",
    rw: "Inkomoko",
    shortEn: "Sources",
    shortRw: "Inkomoko",
  },
];

type Props = {
  children: ReactNode;
  language: Language;
  onLanguageChange: (language: Language) => void;
};

export function AppShell({ children, language, onLanguageChange }: Props) {
  const [location] = useLocation();
  const rw = language === "rw";

  return (
    <div className="grain app-frame min-h-[100dvh] bg-background text-foreground">
      <header className="app-header sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center gap-3 px-4 sm:px-7 xl:px-10 2xl:px-12">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            data-testid="link-brand-home"
          >
            <span className="brand-mark flex h-10 w-10 items-center justify-center rounded-[15px] text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6">
              <Leaf size={20} strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="display-font block text-[15px] font-extrabold leading-none tracking-[-.055em]">
                AgriLens <span className="text-primary">AI</span>
              </span>
              <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground sm:block">
                {rw
                  ? "Rwanda · Isesengura ry’ubuhinzi"
                  : "Rwanda · Field intelligence"}
              </span>
            </span>
          </Link>

          <nav
            aria-label={rw ? "Ibyiciro by’ingenzi" : "Primary navigation"}
            className="desktop-navigation mx-2 hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto xl:flex"
          >
            {navigation.map(({ href, en, rw: rwLabel, shortEn, shortRw }) => {
              const active = location === href;
              const label = rw ? rwLabel : en;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-${href === "/" ? "overview" : href.slice(1)}`}
                  className={`nav-link group inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-2.5 text-[11px] font-semibold transition-all xl:px-3 xl:text-[12px] ${active ? "is-active bg-secondary text-primary" : "text-muted-foreground hover:bg-white/70 hover:text-foreground"}`}
                >
                  <span>{rw ? shortRw : shortEn}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0">
            <div
              className="language-switch flex items-center gap-0.5 rounded-full border border-border/80 bg-white/80 p-1 shadow-sm"
              role="group"
              aria-label={rw ? "Hitamo ururimi" : "Choose language"}
            >
              <Languages size={14} className="ml-1 text-muted-foreground" />
              <button
                type="button"
                onClick={() => onLanguageChange("en")}
                aria-pressed={!rw}
                data-testid="button-language-en"
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-colors ${!rw ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange("rw")}
                aria-pressed={rw}
                data-testid="button-language-rw"
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-colors ${rw ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
              >
                RW
              </button>
            </div>
          </div>
        </div>

        <nav
          className="mobile-navigation flex items-center gap-1 overflow-x-auto border-t border-border/50 px-3 py-2 xl:hidden"
          aria-label={rw ? "Kujya mu bice by’urubuga" : "Mobile navigation"}
        >
          {navigation.map(({ href, icon: Icon, en, rw: rwLabel }) => {
            const active = location === href;
            const label = rw ? rwLabel : en;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                data-testid={`mobile-nav-${href === "/" ? "overview" : href.slice(1)}`}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto min-h-[calc(100dvh-110px)] max-w-[1600px] px-4 pb-14 pt-6 sm:px-7 sm:pt-8 xl:px-10 xl:pt-9 2xl:px-12">
        {children}
      </main>
    </div>
  );
}
