import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Command,
  GitCompareArrows,
  Home,
  Languages,
  Leaf,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

export type Language = "en" | "rw";

const navigation = [
  { href: "/", icon: Home, en: "Overview", rw: "Incamake" },
  {
    href: "/data",
    icon: ScanSearch,
    en: "Explore data",
    rw: "Shakisha amakuru",
  },
  {
    href: "/dashboard",
    icon: BarChart3,
    en: "Seasonal picture",
    rw: "Ishusho y’ibihe",
  },
  {
    href: "/compare",
    icon: GitCompareArrows,
    en: "Compare districts",
    rw: "Gereranya uturere",
  },
  {
    href: "/insights",
    icon: Activity,
    en: "Changes & context",
    rw: "Impinduka n’ibisobanuro",
  },
  {
    href: "/assistant",
    icon: MessageSquareText,
    en: "Ask AgriLens",
    rw: "Baza AgriLens",
  },
  {
    href: "/about",
    icon: BookOpen,
    en: "Sources & how to read",
    rw: "Inkomoko n’uko wasoma",
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
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] lg:flex">
        <Link
          href="/"
          className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6"
          data-testid="link-brand-home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b7d18e] text-[#234d3b]">
            <Leaf size={21} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="display-font block text-[15px] font-extrabold tracking-[-.04em]">
              AgriLens <span className="text-[#c1d69b]">AI</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-medium tracking-[.12em] text-white/50">
              RWANDA · PLANNING PROTOTYPE
            </span>
          </span>
        </Link>
        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">
            {rw ? "AHO UHEREREYE" : "WORKSPACE"}
          </p>
          <nav
            aria-label={rw ? "Ibyiciro by’ingenzi" : "Primary navigation"}
            className="space-y-1"
          >
            {navigation.map(({ href, icon: Icon, en, rw: rwLabel }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  data-testid={`nav-${href === "/" ? "overview" : href.slice(1)}`}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${active ? "bg-[#dce8c7] text-[#244d39]" : "text-white/72 hover:bg-white/8 hover:text-white"}`}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1">{rw ? rwLabel : en}</span>
                  {active && <ChevronRight size={14} />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto px-4 pb-5">
          <div className="rounded-xl border border-white/10 bg-white/[.045] p-4">
            <div className="mb-3 flex items-center gap-2 text-[#c1d69b]">
              <span className="h-2 w-2 rounded-full bg-[#c4d79d]" />
              <span className="text-[10px] font-bold uppercase tracking-[.12em]">
                {rw ? "IMITERERE Y’AMAKURU" : "DATA STATUS"}
              </span>
            </div>
            <p className="text-[12px] font-semibold leading-5 text-white/90">
              {rw
                ? "Imibare ya NISR yashyizwemo."
                : "A checked NISR snapshot is loaded."}
            </p>
            <p className="mt-1.5 text-[11px] leading-[1.55] text-white/50">
              {rw
                ? "Seasonal survey n’imibare y’uturere ya 2025–2026."
                : "Through 2026 Season B · not auto-refreshed."}
            </p>
            <Link
              href="/about"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#d5e3bb] hover:text-white"
              data-testid="link-sidebar-methodology"
            >
              {rw ? "Soma uko wayakoresha" : "How to use this data"}{" "}
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-2 px-3 text-[10px] text-white/38">
            <ShieldCheck size={13} />{" "}
            {rw
              ? "Prototype yigenga · Si serivisi ya NISR"
              : "Independent prototype · Not an NISR service"}
          </div>
        </div>
      </aside>

      <div className="min-h-[100dvh] lg:pl-[258px]">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-[hsl(var(--background)/.94)] backdrop-blur-xl">
          <div className="mx-auto flex h-[66px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 lg:hidden"
                aria-label="AgriLens AI home"
                data-testid="link-mobile-brand"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Leaf size={17} />
                </span>
              </Link>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <Command size={14} />
                <span>
                  {rw
                    ? "Igenamigambi ry’ubuhinzi"
                    : "Rwanda agriculture planning"}
                </span>
                <span className="text-border">/</span>
                <span className="font-semibold text-foreground">
                  {navigation.find((item) => item.href === location)?.[
                    rw ? "rw" : "en"
                  ] ?? (rw ? "Ntiboneka" : "Not found")}
                </span>
              </div>
              <span className="font-semibold text-[13px] lg:hidden">
                AgriLens AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#cbd9bd] bg-[#eff3e8] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#456749] sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#66834f]" />{" "}
                {rw ? "amakuru" : "data snapshot"}
              </span>
              <div
                className="flex items-center gap-1 rounded-lg border border-border bg-card p-1"
                role="group"
                aria-label={rw ? "Hitamo ururimi" : "Choose language"}
              >
                <Languages size={15} className="ml-1.5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => onLanguageChange("en")}
                  aria-pressed={!rw}
                  data-testid="button-language-en"
                  className={`rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors ${!rw ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange("rw")}
                  aria-pressed={rw}
                  data-testid="button-language-rw"
                  className={`rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors ${rw ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  RW
                </button>
              </div>
            </div>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1 border-t border-border/70 px-3 py-2 lg:hidden"
            aria-label={rw ? "Kujya mu bice by’urubuga" : "Mobile navigation"}
          >
            {navigation.map(({ href, icon: Icon, en, rw: rwLabel }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`mobile-nav-${href === "/" ? "overview" : href.slice(1)}`}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Icon size={14} />
                  {rw ? rwLabel : en}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 pb-14 pt-7 sm:px-7 sm:pt-9 xl:px-10">
          {children}
          <footer className="mt-16 flex flex-col gap-3 border-t border-border/80 pt-5 text-[11px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {rw
                ? "AgriLens AI ni prototype yigenga yo gufasha igenamigambi ry’ubuhinzi."
                : "AgriLens AI is an independent prototype for agricultural planning."}
            </span>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              data-testid="link-footer-about"
            >
              <CircleHelp size={13} />{" "}
              {rw ? "Ku bijyanye n’amakuru" : "Sources & how to read"}
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
