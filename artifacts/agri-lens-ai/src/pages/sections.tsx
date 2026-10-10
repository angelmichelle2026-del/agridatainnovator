import { Link } from 'wouter';
import type { ReactNode } from 'react';
import {
  ArrowRight, BookOpenCheck, Braces, ChartNoAxesCombined, CircleAlert, Database,
  FileSearch, GitCompareArrows, Layers3, MessageSquareText, ScanSearch, ShieldCheck,
  Sparkles, Sprout, TableProperties,
} from 'lucide-react';
import type { Language } from '@/components/app-shell';

type PageProps = { language: Language };
const isRw = (language: Language) => language === 'rw';

function PageHeading({ eyebrow, title, description, index }: { eyebrow: string; title: string; description: string; index: string }) {
  return (
    <div className="page-enter mb-8 flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
      <div className="max-w-[760px]">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-primary">
          <span className="h-px w-5 bg-primary" /> {eyebrow}
        </div>
        <h1 className="display-font text-[32px] font-extrabold leading-[1.1] tracking-[-.055em] text-foreground sm:text-[42px]">{title}</h1>
        <p className="mt-3 max-w-[690px] text-[14px] leading-6 text-muted-foreground sm:text-[15px]">{description}</p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 pb-1 font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground md:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-[#bd7d42]" /> PHASE 01 <span className="text-border">/</span> {index}
      </div>
    </div>
  );
}

function Availability({ language, title, detail }: { language: Language; title: string; detail: string }) {
  const rw = isRw(language);
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#d6d1bf] bg-[#f2f0e7] px-5 py-6 sm:px-8 sm:py-8" data-testid="status-data-not-loaded" role="status">
      <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full border border-[#d5d1be] sm:right-8 sm:top-[-105px] sm:h-64 sm:w-64" />
      <div className="pointer-events-none absolute -right-2 -top-7 h-32 w-32 rounded-full border border-[#d5d1be] sm:right-16 sm:top-[-74px] sm:h-48 sm:w-48" />
      <div className="relative flex max-w-[820px] items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d5d1be] bg-[#fbfaf5] text-[#806b42]"><Database size={19} /></span>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e6d9bd] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#655435]">{rw ? 'amakuru ntarashyirwamo' : 'data not loaded'}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{rw ? 'nta makuru y’ubuhinzi yatunganijwe' : 'no processed agricultural observations'}</span>
          </div>
          <h2 className="display-font text-[18px] font-bold tracking-[-.035em] sm:text-[20px]">{title}</h2>
          <p className="mt-2 max-w-[700px] text-[13px] leading-[1.75] text-muted-foreground">{detail}</p>
        </div>
      </div>
    </section>
  );
}

function Notice({ children, kind = 'plain' }: { children: ReactNode; kind?: 'plain' | 'caution' }) {
  return <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-[12px] leading-5 ${kind === 'caution' ? 'border-[#e4d4b5] bg-[#f8f2e7] text-[#685739]' : 'border-border bg-card text-muted-foreground'}`} data-testid="text-product-limitation">
    {kind === 'caution' ? <CircleAlert size={16} className="mt-0.5 shrink-0" /> : <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />}
    <p>{children}</p>
  </div>;
}

function OutlineLink({ href, children, testId }: { href: string; children: ReactNode; testId: string }) {
  return <Link href={href} data-testid={testId} className="group inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-[#f4f5ed]">
    {children}<ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
  </Link>;
}

export function HomePage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter">
    <section className="shell-grid relative overflow-hidden rounded-[22px] border border-[#d8d5c6] bg-[#ecefe4] px-5 pb-7 pt-6 sm:px-9 sm:pb-9 sm:pt-8 lg:px-11">
      <div className="absolute -right-16 -top-28 h-[330px] w-[330px] rounded-full border border-[#d4dbc8] sm:right-12 sm:top-[-180px] sm:h-[480px] sm:w-[480px]" />
      <div className="absolute -right-7 -top-16 h-[250px] w-[250px] rounded-full border border-[#d4dbc8] sm:right-[85px] sm:top-[-126px] sm:h-[360px] sm:w-[360px]" />
      <div className="absolute right-[45px] top-[95px] hidden h-[160px] w-[160px] rounded-full border border-dashed border-[#becbb0] sm:block sm:right-[175px] sm:top-[95px]" />
      <div className="relative z-[1] max-w-[810px]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#cad4bf] bg-[#f6f6ef] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#426348]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#638052]" /> {rw ? 'IGIKORESHO CY’IGERAGEZA' : 'A PLANNING WORKSPACE · PHASE 01'}
        </div>
        <h1 className="display-font max-w-[730px] text-[37px] font-extrabold leading-[1.04] tracking-[-.065em] text-[#213b30] sm:text-[56px] lg:text-[64px]">
          {rw ? <>Amakuru afasha<br className="hidden sm:block" /> gufata ibyemezo.</> : <>See the evidence.<br className="hidden sm:block" /> Plan with clarity.</>}
        </h1>
        <p className="mt-5 max-w-[580px] text-[14px] leading-6 text-[#526456] sm:text-[16px] sm:leading-7">
          {rw ? 'AgriLens AI ni prototype yigenga igenewe gufasha abategura igenamigambi ry’ubuhinzi mu turere kumenya, kugereranya no gusobanukirwa n’amakuru yemewe igihe azaba amaze gutegurwa.' : 'AgriLens AI is an independent prototype for district agricultural planners to discover, compare and interpret official statistics once verified source data is available.'}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <OutlineLink href="/data" testId="link-home-data">{rw ? 'Reba aho amakuru ageze' : 'Explore data availability'} <ScanSearch size={15} /></OutlineLink>
          <OutlineLink href="/about" testId="link-home-methodology">{rw ? 'Uko ikora' : 'How this prototype works'} <BookOpenCheck size={15} /></OutlineLink>
        </div>
      </div>
      <div className="relative z-[1] mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#d1d7c8] pt-4 text-[10px] font-semibold text-[#637363] sm:mt-10">
        <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ba7741]" />{rw ? 'Nta makuru y’ubuhinzi yatangijwe' : 'Agricultural source data not loaded'}</span>
        <span>{rw ? 'Serivisi ya Leta yigenga' : 'Independent, non-government service'}</span>
      </div>
    </section>

    <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">{rw ? 'AKAMARO K’IKI GIKORESHO' : 'A WORKSPACE FOR PUBLIC SERVICE'}</p>
            <h2 className="display-font mt-1.5 text-[22px] font-bold tracking-[-.04em]">{rw ? 'Ibyo ushobora gukora' : 'What this workspace is for'}</h2></div>
          <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">01 — 03</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: ScanSearch, n: '01', title: rw ? 'Menya amakuru' : 'Discover', text: rw ? 'Shakisha imibare yemewe imaze gutegurwa n’igihe n’aho iboneka.' : 'Find prepared official statistics by topic, geography and time period.' },
            { icon: GitCompareArrows, n: '02', title: rw ? 'Gereranya' : 'Compare', text: rw ? 'Reba uko ibipimo bihagaze mu turere n’igihe, amakuru amaze kuboneka.' : 'Review indicators across districts and periods when observations are available.' },
            { icon: Sparkles, n: '03', title: rw ? 'Sobanukirwa' : 'Interpret', text: rw ? 'Sobanukirwa n’ibipimo n’imipaka yabyo mbere yo kubikoresha.' : 'Understand indicator definitions and limitations before using the evidence.' },
          ].map(({ icon: Icon, n, title, text }) => <article key={n} className="rounded-xl border border-border bg-card p-4 sm:p-5" data-testid={`card-workspace-${n}`}>
            <div className="mb-5 flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf1e6] text-primary"><Icon size={17} /></span><span className="font-mono text-[10px] text-muted-foreground">{n}</span></div>
            <h3 className="display-font text-[16px] font-bold tracking-[-.025em]">{title}</h3><p className="mt-2 text-[12px] leading-[1.65] text-muted-foreground">{text}</p>
          </article>)}
        </div>
      </div>
      <aside className="rounded-xl bg-[#244636] p-5 text-[#f2f1e7] sm:p-6">
        <div className="flex items-center gap-2 text-[#c3d79d]"><Sprout size={17} /><span className="text-[10px] font-bold uppercase tracking-[.14em]">{rw ? 'AHO TUGEZE' : 'CURRENT PHASE'}</span></div>
        <h2 className="display-font mt-5 text-[23px] font-bold leading-tight tracking-[-.04em]">{rw ? 'Tangira ku makuru yizewe.' : 'Start with trustworthy data.'}</h2>
        <p className="mt-3 text-[12px] leading-[1.75] text-white/65">{rw ? 'Iyi ni shell y’icyiciro cya mbere gusa. Nta bitabo by’inkomoko by’imibare y’ubuhinzi cyangwa imibare yatunganijwe biri muri uyu mushinga.' : 'This is the Phase 1 app shell only. No agricultural source workbooks or processed observations are currently in this project.'}</p>
        <Link href="/about" className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-[#d5e3bb] hover:text-white" data-testid="link-phase-details">{rw ? 'Soma ibyo tutarashyiramo' : 'See what is not included'} <ArrowRight size={14} /></Link>
      </aside>
    </div>
    <div className="mt-7"><Notice kind="caution">{rw ? 'AgriLens AI ni prototype yigenga, ntabwo ari serivisi ya NISR. Ihinduranyandiko ry’Ikinyarwanda ni intangiriro; amagambo y’ubuhinzi ya tekiniki ashobora kuguma mu Cyongereza kugeza asuzumwe.' : 'AgriLens AI is an independent prototype, not an official NISR service. Kinyarwanda is an initial interface translation; technical agricultural terms may remain in English pending review.'}</Notice></div>
  </div>;
}

export function DataPage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter">
    <PageHeading index="01" eyebrow={rw ? 'KUMENYA AMAKURU' : 'DISCOVER THE EVIDENCE'} title={rw ? 'Shakisha amakuru' : 'Data explorer'} description={rw ? 'Ahantu ho kumenya imibare y’ubuhinzi izashyirwamo nyuma y’uko inkomoko yemewe iteguwe kandi isuzumwe.' : 'A place to discover agricultural statistics after official source material has been prepared and reviewed.'} />
    <Availability language={language} title={rw ? 'Nta makuru yo gushakisha arahari.' : 'There is no data to explore yet.'} detail={rw ? 'Nta bitabo by’inkomoko by’imibare y’ubuhinzi cyangwa imibare yatunganijwe biri muri uyu mushinga. Bityo, nta rutonde rw’imibare cyangwa ibisobanuro by’uturere bishobora kugaragazwa.' : 'No agricultural source workbooks or processed observations are present in this project. As a result, there are no indicator records or geographic breakdowns to browse.'} />
    <section className="mt-7 grid gap-4 md:grid-cols-[1.3fr_.7fr]">
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6" data-testid="empty-data-catalog">
        <div className="flex items-center gap-2 text-primary"><TableProperties size={17} /><span className="text-[10px] font-bold uppercase tracking-[.14em]">{rw ? 'URUTONDE RW’IMIBARE' : 'INDICATOR CATALOGUE'}</span></div>
        <h2 className="display-font mt-4 text-[19px] font-bold tracking-[-.035em]">{rw ? 'Urutonde ruzagaragara hano.' : 'The catalogue will appear here.'}</h2>
        <p className="mt-2 max-w-[640px] text-[13px] leading-6 text-muted-foreground">{rw ? 'Iyo amakuru yizewe amaze gushyirwamo, uru rwego ruzerekana ibisobanuro by’ibipimo, ibihe n’aho biboneka. Ibi bikorwa ntibirakorwa.' : 'When verified data is added, this space can present indicator definitions, periods and geographic coverage. That work has not happened yet.'}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[rw ? 'Igipimo' : 'Indicator', rw ? 'Igihe' : 'Period', rw ? 'Akarere' : 'Geography'].map((tag, i) => <span key={tag} className="rounded-md border border-dashed border-border px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground" data-testid={`empty-dimension-${i}`}>{tag} · —</span>)}
        </div>
      </div>
      <div className="rounded-xl border border-[#d8d5c6] bg-[#f0eee5] p-5 sm:p-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e3dfcf] text-[#756744]"><FileSearch size={17} /></span>
        <h3 className="display-font mt-4 text-[16px] font-bold">{rw ? 'Ibisabwa mbere yo gushakisha' : 'Before exploration can begin'}</h3>
        <ul className="mt-3 space-y-2.5 text-[12px] leading-[1.6] text-muted-foreground">
          <li className="flex gap-2"><span className="font-mono text-primary">01</span>{rw ? 'Inkomoko y’imibare iraboneka kandi igenzuwe.' : 'Source material is available and checked.'}</li>
          <li className="flex gap-2"><span className="font-mono text-primary">02</span>{rw ? 'Ibisobanuro by’ibipimo biranditswe.' : 'Indicator definitions are documented.'}</li>
          <li className="flex gap-2"><span className="font-mono text-primary">03</span>{rw ? 'Igihe n’aho amakuru akorera birasobanuwe.' : 'Time period and coverage are described.'}</li>
        </ul>
      </div>
    </section>
    <div className="mt-6"><Notice>{rw ? 'Iyi prototype ntabwo ishakisha, iyungurura cyangwa ikurura amakuru. Nta dosiye y’inkomoko cyangwa ruhushya byagenzuwe byatangajwe hano.' : 'This prototype does not search, filter or retrieve data. No source files or verified licensing details are represented here.'}</Notice></div>
  </div>;
}

export function DashboardPage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter">
    <PageHeading index="02" eyebrow={rw ? 'INCAMAKE Y’IBIMENYETSO' : 'INDICATOR OVERVIEW'} title={rw ? 'Imbonerahamwe' : 'Dashboard'} description={rw ? 'Urubuga ruzafasha abategura igenamigambi kubona incamake y’ibipimo by’ubuhinzi, igihe amakuru amaze kuboneka.' : 'A future overview for district planners to read agricultural indicators once real observations are available.'} />
    <Availability language={language} title={rw ? 'Incamake y’ibipimo ntiraboneka.' : 'Indicator summaries are not available.'} detail={rw ? 'Nta mibare y’ubuhinzi yatunganijwe yashyizwe muri uyu mushinga. Nta gipimo, impinduka cyangwa ishusho y’imibare ishobora gutangwa ubu.' : 'No processed agricultural observations have been added to this project. No indicator values, trends or visual summaries can be shown at this stage.'} />
    <section className="mt-7 overflow-hidden rounded-xl border border-border bg-card" data-testid="empty-dashboard-content">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">{rw ? 'AHO INCAMake IZABONEKERA' : 'OVERVIEW CANVAS'}</p><h2 className="display-font mt-1 text-[17px] font-bold">{rw ? 'Ibisobanuro bizashingira ku makuru' : 'Evidence-led summaries'}</h2></div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#e4d4b5] bg-[#f8f2e7] px-2.5 py-1.5 text-[10px] font-semibold text-[#705a30]"><CircleAlert size={12} />{rw ? 'Nta makuru arahari' : 'Awaiting data'}</span>
      </div>
      <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          { icon: Layers3, label: rw ? 'Ibipimo by’ubuhinzi' : 'Agriculture indicators', detail: rw ? 'Nta bisobanuro by’ibipimo byashyizweho.' : 'No indicator definitions added.' },
          { icon: ChartNoAxesCombined, label: rw ? 'Imigendekere mu gihe' : 'Change over time', detail: rw ? 'Ibihe byo kugereranya ntibiratangazwa.' : 'No reporting periods established.' },
          { icon: Database, label: rw ? 'Aho amakuru akorera' : 'Geographic coverage', detail: rw ? 'Nta makuru y’uturere yatunganyijwe.' : 'No district observations processed.' },
        ].map(({ icon: Icon, label, detail }) => <article className="min-h-[142px] p-5 sm:p-6" key={label} data-testid={`empty-dashboard-${label.toLowerCase().replaceAll(' ', '-')}`}>
          <Icon size={18} className="text-[#8b8b70]" /><h3 className="mt-4 text-[12px] font-bold">{label}</h3><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{detail}</p>
        </article>)}
      </div>
    </section>
    <div className="mt-6"><Notice kind="caution">{rw ? 'Nta shusho y’imibare cyangwa urugero rw’imibare rwakozwe muri iyi phase. Iyi mbonerahamwe izuzuzwa gusa hashingiwe ku makuru yemejwe.' : 'No charts or sample figures are included in this phase. This dashboard will only be populated from verified observations.'}</Notice></div>
  </div>;
}

export function ComparePage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter">
    <PageHeading index="03" eyebrow={rw ? 'KUGERERANYA IBIPIMO' : 'READ ACROSS CONTEXTS'} title={rw ? 'Gereranya' : 'Compare'} description={rw ? 'Umwanya wo kureba itandukaniro ry’ibipimo hagati y’uturere cyangwa ibihe, utanga ibisobanuro aho bishoboka.' : 'A future space to compare indicators between districts or periods, with context alongside each comparison.'} />
    <Availability language={language} title={rw ? 'Kugereranya ntibishoboka ubu.' : 'Comparisons cannot be made yet.'} detail={rw ? 'Nta mibare y’ubuhinzi yatunganijwe iboneka muri uyu mushinga. Kugereranya ubu byasaba guhimba imibare, ibyo iyi prototype itazakora.' : 'This project has no processed agricultural observations. Producing a comparison now would require invented figures, which this prototype will not do.'} />
    <section className="mt-7 rounded-xl border border-border bg-card p-5 sm:p-7" data-testid="empty-comparison-workspace">
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-dashed border-[#cfcbb9] bg-[#f7f6f0] p-5">
          <div className="flex items-center gap-2 text-muted-foreground"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary"><Layers3 size={16} /></span><span className="text-[10px] font-bold uppercase tracking-[.12em]">{rw ? 'AHO UGERERANYA' : 'COMPARISON SIDE A'}</span></div>
          <p className="mt-4 text-[13px] font-semibold">{rw ? 'Akarere cyangwa igihe' : 'District or time period'}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{rw ? 'Bizaboneka nyuma yo gutegura amakuru.' : 'Available after data preparation.'}</p>
        </div>
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground"><GitCompareArrows size={16} /></div>
        <div className="rounded-xl border border-dashed border-[#cfcbb9] bg-[#f7f6f0] p-5">
          <div className="flex items-center gap-2 text-muted-foreground"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary"><Layers3 size={16} /></span><span className="text-[10px] font-bold uppercase tracking-[.12em]">{rw ? 'AHO UGERERANYA' : 'COMPARISON SIDE B'}</span></div>
          <p className="mt-4 text-[13px] font-semibold">{rw ? 'Akarere cyangwa igihe' : 'District or time period'}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{rw ? 'Bizaboneka nyuma yo gutegura amakuru.' : 'Available after data preparation.'}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground"><Braces size={14} />{rw ? 'Ibipimo biboneka bizasobanurwa mbere yo kubigereranya.' : 'Available indicators will be defined before they are compared.'}</div>
    </section>
    <div className="mt-6"><Notice>{rw ? 'Nta mahitamo y’uturere, ibipimo cyangwa ibisubizo byo kugereranya bikora muri icyi cyiciro.' : 'District selection, indicator selection and comparison results are not implemented in this phase.'}</Notice></div>
  </div>;
}

export function InsightsPage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter">
    <PageHeading index="04" eyebrow={rw ? 'IBYAGARAGAYE MU MIBARE' : 'EVIDENCE, WITH CONTEXT'} title={rw ? 'Ibyagaragaye' : 'Insights'} description={rw ? 'Ibisobanuro bizafasha gusobanukirwa n’icyo imibare yemewe ivuga n’aho idashobora gutanga igisubizo.' : 'Explanations designed to help planners understand what official observations can—and cannot—tell them.'} />
    <Availability language={language} title={rw ? 'Nta busesenguzi bushobora gutangwa.' : 'There is no evidence to interpret.'} detail={rw ? 'Iyi project nta makuru y’ubuhinzi yatunganijwe ifite. Nta mpinduka, ihuriro cyangwa kidasanzwe bishobora kwemezwa hatabanje kuboneka imibare y’ukuri.' : 'There are no processed agricultural observations in this project. No trend, relationship or unusual pattern can be substantiated without real data.'} />
    <section className="mt-7 grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-border bg-card p-5 sm:p-6" data-testid="empty-insight-definitions">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf1e6] text-primary"><BookOpenCheck size={17} /></span>
        <h2 className="display-font mt-4 text-[17px] font-bold">{rw ? 'Ibisobanuro mbere y’ubusesenguzi' : 'Definitions before interpretation'}</h2>
        <p className="mt-2 text-[12px] leading-[1.7] text-muted-foreground">{rw ? 'Ibisobanuro by’igipimo, igipimo cyacyo, uburyo bwo kugikusanya n’imbibi zacyo bigomba kugaragazwa mbere yo gutanga umwanzuro.' : 'Indicator definitions, units, collection methods and limitations need to be made clear before any interpretation is offered.'}</p>
        <span className="mt-4 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{rw ? 'Ntabwo birategurwa' : 'Not yet prepared'}</span>
      </article>
      <article className="rounded-xl border border-border bg-card p-5 sm:p-6" data-testid="empty-insight-analysis">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2eadc] text-[#8b6a35]"><ChartNoAxesCombined size={17} /></span>
        <h2 className="display-font mt-4 text-[17px] font-bold">{rw ? 'Ibimenyetso, si ibitekerezo' : 'Evidence, not assumptions'}</h2>
        <p className="mt-2 text-[12px] leading-[1.7] text-muted-foreground">{rw ? 'Nta busesenguzi bw’impinduka cyangwa amakuru adasanzwe bukorerwa muri iyi prototype. Ibyo bizasaba amakuru n’uburyo byasobanuwe neza.' : 'This prototype does not run trend or anomaly analysis. Such work would require real observations and clearly documented methods.'}</p>
        <span className="mt-4 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{rw ? 'Ntabwo birakorwa' : 'Not implemented'}</span>
      </article>
    </section>
    <div className="mt-6"><Notice kind="caution">{rw ? 'Ibyo ushobora kubona hano ni ibisobanuro by’imipaka y’iki gikoresho gusa, si umwanzuro ku musaruro cyangwa imimerere y’ubuhinzi mu Rwanda.' : 'Any content here describes the prototype’s limits only; it is not a finding about agricultural production or conditions in Rwanda.'}</Notice></div>
  </div>;
}

export function AssistantPage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter">
    <PageHeading index="05" eyebrow={rw ? 'IKIGANIRO N’AMAKURU' : 'ASK WITH EVIDENCE'} title={rw ? 'Umufasha' : 'Assistant'} description={rw ? 'Umwanya wo gusobanukirwa n’amakuru yemewe mu mvugo isanzwe igihe azaba amaze gushyirwamo.' : 'A future way to ask plain-language questions grounded in verified, available agricultural statistics.'} />
    <div className="overflow-hidden rounded-2xl border border-[#d8d5c6] bg-[#f0eee5]" data-testid="assistant-unavailable-state" role="status">
      <div className="flex items-center gap-3 border-b border-[#d8d5c6] px-5 py-4 sm:px-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#244636] text-[#d8e3c6]"><MessageSquareText size={18} /></span>
        <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{rw ? 'AGRI LENS · UMUFASHA' : 'AGRILENS · ASSISTANT'}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{rw ? 'Ntiboneka muri iki cyiciro' : 'Unavailable in this phase'}</p></div>
        <span className="ml-auto rounded-full border border-[#ddcfb5] bg-[#f8f3e9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#785d2f]">{rw ? 'irategereje amakuru' : 'awaiting data'}</span>
      </div>
      <div className="mx-auto flex max-w-[760px] flex-col items-center px-5 py-10 text-center sm:px-12 sm:py-14">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d3d0c1] bg-[#faf9f3] text-[#71845d]"><MessageSquareText size={24} strokeWidth={1.6} /></span>
        <h2 className="display-font max-w-[550px] text-[23px] font-bold leading-tight tracking-[-.045em] sm:text-[27px]">{rw ? 'Ntabwo nshobora gusubiza ibibazo ku buhinzi ubu.' : 'I cannot answer factual agricultural questions yet.'}</h2>
        <p className="mt-4 max-w-[580px] text-[13px] leading-6 text-muted-foreground">{rw ? 'Nta makuru y’ubuhinzi yemewe yatangijwe muri uyu mushinga. Igihe ayo makuru ataraboneka, sinshobora gutanga ibisubizo bifatika, kandi ntazahimba imibare cyangwa ngo nkoreshe AI.' : 'No verified agricultural data has been loaded into this project. Until data is available, I cannot provide factual answers—and I will not invent results or call an AI model.'}</p>
        <div className="mt-7 flex w-full max-w-[520px] items-start gap-3 rounded-xl border border-[#e2d5bd] bg-[#f8f3e9] p-4 text-left">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-[#896a32]" />
          <p className="text-[11px] leading-[1.65] text-[#65583d]">{rw ? 'Nta kibazo wandika kizahabwa igisubizo cyakozwe n’iyi prototype muri iki cyiciro.' : 'Questions are not submitted or answered by this prototype in Phase 1.'}</p>
        </div>
      </div>
    </div>
    <div className="mt-6"><Notice>{rw ? 'Nta murongo wa AI cyangwa uburyo bwo kohereza ikibazo buhuye n’inyuma y’uru rubuga bwashyizweho.' : 'There is no AI connection or question-submission backend behind this interface.'}</Notice></div>
  </div>;
}

export function AboutPage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter">
    <PageHeading index="06" eyebrow={rw ? 'UBWIZERWE N’IMBIBI' : 'TRANSPARENCY FIRST'} title={rw ? 'Amakuru n’uburyo' : 'Data & methodology'} description={rw ? 'Ibisobanuro by’uko iki gikoresho cyateguwe, amakuru kibura n’ibyo kigamije gukora nyuma yaho.' : 'A clear account of what this prototype is, what evidence it does not yet contain, and what would be needed next.'} />
    <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <article className="rounded-xl border border-border bg-card p-5 sm:p-7" data-testid="about-data-status">
        <div className="flex items-center gap-2 text-primary"><Database size={17} /><span className="text-[10px] font-bold uppercase tracking-[.14em]">{rw ? 'IMITERERE Y’AMAKURU' : 'DATA STATUS'}</span></div>
        <h2 className="display-font mt-4 text-[22px] font-bold tracking-[-.04em]">{rw ? 'Nta makuru y’ubuhinzi yatangijwe.' : 'No agricultural data has been loaded.'}</h2>
        <p className="mt-3 text-[13px] leading-[1.8] text-muted-foreground">{rw ? 'Muri uyu mushinga nta bitabo by’inkomoko by’imibare y’ubuhinzi cyangwa imibare yatunganijwe irimo. Nta makuru yavanywe muri NISR cyangwa ahandi, kandi nta mibare yerekanwa nk’aho yaturutse ku makuru nyakuri.' : 'This project currently contains no agricultural source workbooks and no processed observations. Data has not been downloaded from NISR or elsewhere, and no figures are presented as real observations.'}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d4b5] bg-[#f8f2e7] px-2.5 py-1.5 text-[10px] font-semibold text-[#705a30]"><CircleAlert size={12} />{rw ? 'Amakuru ntarashyirwamo' : 'Data not loaded'}</span>
          <span className="rounded-full border border-border bg-background px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">{rw ? 'Imibare yatunganijwe: nta yo' : 'Processed observations: none'}</span>
        </div>
      </article>
      <article className="rounded-xl bg-[#244636] p-5 text-[#f2f1e7] sm:p-7" data-testid="about-independence">
        <ShieldCheck size={20} className="text-[#c3d79d]" />
        <h2 className="display-font mt-4 text-[20px] font-bold tracking-[-.035em]">{rw ? 'Prototype yigenga' : 'An independent prototype'}</h2>
        <p className="mt-3 text-[12px] leading-[1.8] text-white/70">{rw ? 'AgriLens AI si urubuga cyangwa serivisi yemewe ya NISR. Izina NISR rivugwa gusa mu gusobanura inkomoko y’amakuru ashobora gushakishwa mu bihe biri imbere; nta makuru yayo yashyizweho.' : 'AgriLens AI is not an official NISR website or service. NISR is mentioned only to describe a possible future source to investigate; no NISR data has been added.'}</p>
      </article>
    </section>
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card" data-testid="methodology-principles">
      <div className="border-b border-border px-5 py-4 sm:px-7"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{rw ? 'AMAHAME Y’IBANZE' : 'PHASE 1 PRINCIPLES'}</p><h2 className="display-font mt-1 text-[18px] font-bold">{rw ? 'Gusa ibyemejwe, kandi bigaragara.' : 'Only evidence that can be described.'}</h2></div>
      <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {[
          { title: rw ? 'Inkomoko izasuzumwa' : 'Sources will be reviewed', body: rw ? 'Inkomoko, igihe n’uruhushya bizasobanurwa gusa bimaze kugenzurwa.' : 'Source, period and licensing details will be described only after verification.' },
          { title: rw ? 'Uburyo buzandikwa' : 'Methods will be documented', body: rw ? 'Ibisobanuro by’ibipimo n’uko byatunganyijwe bizatangazwa mbere yo kubisesengura.' : 'Indicator definitions and processing choices will be stated before interpretation.' },
          { title: rw ? 'Imipaka izagaragazwa' : 'Limits will be visible', body: rw ? 'Icyo amakuru adashobora kwemeza na cyo kizagaragazwa.' : 'What the available evidence cannot establish will be made visible too.' },
        ].map((item, i) => <article className="p-5 sm:p-6" key={item.title} data-testid={`methodology-principle-${i}`}><span className="font-mono text-[10px] text-primary">0{i + 1}</span><h3 className="mt-3 text-[13px] font-bold">{item.title}</h3><p className="mt-2 text-[11px] leading-[1.7] text-muted-foreground">{item.body}</p></article>)}
      </div>
    </section>
    <section className="mt-6 rounded-xl border border-[#e3d8bf] bg-[#f8f3e9] p-5 sm:p-6" data-testid="translation-status">
      <div className="flex gap-3"><LanguagesIcon /><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#7c673c]">{rw ? 'IMITERERE Y’IHINDURANYANDIKO' : 'LANGUAGE NOTE'}</p><p className="mt-2 text-[12px] leading-[1.75] text-[#65583d]">{rw ? 'Ikinyarwanda ni intangiriro y’ihinduranyandiko ry’urubuga. Amagambo y’ubuhinzi ya tekiniki ashobora kuguma mu Cyongereza mu gihe ategereje gusuzumwa. Ntabwo tuvuga ko amagambo yose yamaze gusuzumwa.' : 'Kinyarwanda is an initial interface translation. Technical agricultural terms may remain in English pending review; we do not claim all terms have been reviewed.'}</p></div></div>
    </section>
    <div className="mt-6"><Notice kind="caution">{rw ? 'Iyi ni shell y’icyiciro cya mbere gusa: nta gukurura cyangwa gutunganya amakuru, gushakisha, kugereranya, gusesengura bidasanzwe cyangwa AI biri muri yo.' : 'This is the Phase 1 shell only: no data ingestion or processing, search, comparisons, anomaly analysis or AI is implemented.'}</Notice></div>
  </div>;
}

function LanguagesIcon() {
  return <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#efe4cd] text-[#806b42]"><BookOpenCheck size={16} /></span>;
}

export function NotFoundPage({ language }: PageProps) {
  const rw = isRw(language);
  return <div className="page-enter flex min-h-[54vh] flex-col items-center justify-center text-center" data-testid="empty-page-not-found">
    <span className="font-mono text-[12px] font-bold tracking-[.2em] text-primary">404 / 04</span>
    <h1 className="display-font mt-4 text-4xl font-extrabold tracking-[-.06em]">{rw ? 'Iyi paji ntihari.' : 'This page is not here.'}</h1>
    <p className="mt-3 max-w-[400px] text-[13px] leading-6 text-muted-foreground">{rw ? 'Ihuza wasabye ntirijyanye n’igice kiri muri iyi prototype.' : 'The address you followed does not match a section in this prototype.'}</p>
    <Link href="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-semibold text-primary-foreground" data-testid="link-not-found-home">{rw ? 'Subira ku ncamake' : 'Return to overview'} <ArrowRight size={15} /></Link>
  </div>;
}
