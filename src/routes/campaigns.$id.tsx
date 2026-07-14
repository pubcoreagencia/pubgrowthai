import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCampaign, getCampaign } from "@/lib/campaigns-store";
import {
  buildExecutiveReport,
  computeMetrics,
  formatBRL,
  formatInt,
  formatNumber,
  formatPct,
  getInstagramEmbedId,
} from "@/lib/campaign-metrics";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import {
  ArrowLeft,
  DollarSign,
  Eye,
  ExternalLink,
  Heart,
  MousePointerClick,
  Printer,
  ShoppingBag,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/campaigns/$id")({
  loader: ({ params }) => {
    if (typeof window === "undefined") return { id: params.id };
    const c = getCampaign(params.id);
    if (!c) throw notFound();
    return { id: params.id };
  },
  component: CampaignDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Campanha não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A campanha pode ter sido removida.
      </p>
      <Button asChild className="mt-6">
        <Link to="/campaigns">Ver campanhas</Link>
      </Button>
    </div>
  ),
});

const objectiveLabels: Record<string, string> = {
  views: "Visualizações",
  engagement: "Engajamento",
  traffic: "Tráfego",
  conversion: "Conversão",
  awareness: "Reconhecimento",
};

function CampaignDetail() {
  const { id } = Route.useParams();
  const c = useCampaign(id);

  if (!c) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Campanha não encontrada</h1>
        <Button asChild className="mt-6">
          <Link to="/campaigns">Voltar</Link>
        </Button>
      </div>
    );
  }

  const m = computeMetrics(c);
  const embedId = getInstagramEmbedId(c.videoUrl);
  const report = buildExecutiveReport(c, m);

  const funnel = useMemo(() => {
    const steps = [
      { name: "Impressões", value: c.results.impressions ?? 0 },
      { name: "Views", value: c.results.views ?? 0 },
      { name: "Cliques", value: c.results.linkClicks ?? 0 },
      { name: "Compras", value: c.results.purchases ?? 0 },
    ];
    return steps.map((s, i) => {
      const prev = i > 0 ? steps[i - 1].value : null;
      const pct = prev && prev > 0 ? (s.value / prev) * 100 : null;
      return { ...s, pct };
    });
  }, [c.results]);

  // Fake distribution: split investment / views linearly over the days for visual purpose.
  const trend = useMemo(() => {
    const days = Math.max(1, c.days);
    const data = [] as Array<{ day: string; investimento: number; views: number; cliques: number }>;
    const dailyInvest = m.totalInvestment / days;
    const dailyViews = (c.results.views ?? 0) / days;
    const dailyClicks = (c.results.linkClicks ?? 0) / days;
    for (let i = 1; i <= days; i++) {
      data.push({
        day: `D${i}`,
        investimento: Math.round(dailyInvest * i),
        views: Math.round(dailyViews * i),
        cliques: Math.round(dailyClicks * i),
      });
    }
    return data;
  }, [c.days, c.results.views, c.results.linkClicks, m.totalInvestment]);

  const engagementBreakdown = [
    { name: "Curtidas", value: c.results.likes ?? 0 },
    { name: "Comentários", value: c.results.comments ?? 0 },
    { name: "Compart.", value: c.results.shares ?? 0 },
    { name: "Salvos", value: c.results.saves ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      {/* Header */}
      <div className="no-print">
        <Link
          to="/campaigns"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Campanhas
        </Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              {objectiveLabels[c.objective]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(c.startDate)} – {formatDate(c.endDate)} · {c.days} dia
              {c.days === 1 ? "" : "s"}
            </span>
          </div>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight md:text-3xl">
            {c.campaignName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cliente: <span className="text-foreground">{c.clientName}</span>
          </p>
        </div>
        <div className="no-print flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild>
            <a href={c.videoUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver vídeo
            </a>
          </Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Main metric cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Investimento"
          value={formatBRL(m.totalInvestment)}
          hint={`${formatBRL(c.dailyBudget)} / dia`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="Views"
          value={formatInt(c.results.views ?? 0)}
          hint={m.cpv !== null ? `CPV ${formatBRL(m.cpv)}` : undefined}
          icon={<Eye className="h-4 w-4" />}
          accent="primary"
        />
        <StatCard
          label="Impressões"
          value={formatInt(c.results.impressions ?? 0)}
          hint={c.results.reach ? `Alcance ${formatInt(c.results.reach)}` : undefined}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Seguidores conquistados"
          value={
            <span className={m.followersGained >= 0 ? "text-[color:var(--color-success)]" : "text-destructive"}>
              {m.followersGained >= 0 ? "+" : ""}
              {formatInt(m.followersGained)}
            </span>
          }
          hint={
            m.followersGrowthPct !== null
              ? `${formatPct(m.followersGrowthPct)} · ${formatNumber(m.followersDailyAvg, 1)}/dia`
              : `${formatNumber(m.followersDailyAvg, 1)} / dia`
          }
          icon={<Users className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Cliques"
          value={formatInt(c.results.linkClicks ?? 0)}
          hint={m.ctr !== null ? `CTR ${formatPct(m.ctr)}` : undefined}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
        <StatCard
          label="Conversões"
          value={formatInt(c.results.purchases ?? 0)}
          hint={m.conversionRate !== null ? `${formatPct(m.conversionRate)} dos cliques` : undefined}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatCard
          label="Receita"
          value={formatBRL(m.revenue)}
          hint={m.cpa !== null ? `CPA ${formatBRL(m.cpa)}` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="ROAS"
          value={m.roas !== null ? formatNumber(m.roas) : "—"}
          hint={m.roas !== null ? (m.roas >= 2 ? "Bom desempenho" : "Otimizar") : "Sem receita"}
          icon={<Target className="h-4 w-4" />}
          accent={m.roas && m.roas >= 2 ? "success" : "warning"}
        />
      </div>

      {/* Video preview + engagement */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="surface-card overflow-hidden p-0">
          <div className="border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Publicação
          </div>
          {embedId ? (
            <div className="relative aspect-[9/12] bg-black">
              <iframe
                src={`https://www.instagram.com/p/${embedId}/embed`}
                className="absolute inset-0 h-full w-full"
                allowTransparency
                frameBorder={0}
                scrolling="no"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex aspect-[9/12] flex-col items-center justify-center gap-2 bg-[image:var(--gradient-surface)] p-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">Preview indisponível</div>
              <a
                href={c.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-xs text-primary hover:underline"
              >
                {c.videoUrl}
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-rows-[auto_1fr] gap-4">
          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Engajamento</h2>
              <Badge variant="outline" className="border-primary/40 text-primary">
                Taxa {m.engagementRate !== null ? formatPct(m.engagementRate) : "—"}
              </Badge>
            </div>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementBreakdown} margin={{ left: 0, right: 8 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {engagementBreakdown.map((_, i) => (
                      <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />
              Total {formatInt(m.totalEngagements)} interações
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Evolução da campanha</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="investimento"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cliques"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <LegendDot color="var(--color-chart-1)" label="Investimento" />
              <LegendDot color="var(--color-chart-2)" label="Views" />
              <LegendDot color="var(--color-chart-3)" label="Cliques" />
            </div>
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="surface-card mt-6 p-6">
        <h2 className="text-sm font-semibold">Funil de conversão</h2>
        <div className="mt-5 space-y-3">
          {funnel.map((step, i) => {
            const max = funnel[0].value || 1;
            const pct = (step.value / max) * 100;
            return (
              <div key={step.name} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-xs text-muted-foreground">
                  {step.name}
                </div>
                <div className="relative h-9 flex-1 overflow-hidden rounded-lg border border-border/60 bg-card/40">
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg bg-[image:var(--gradient-primary)] opacity-90 transition-all"
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                  <div className="relative flex h-full items-center justify-between px-3 text-xs font-medium">
                    <span>{formatInt(step.value)}</span>
                    {i > 0 && step.pct !== null && (
                      <span className="text-[11px] text-muted-foreground">
                        {formatPct(step.pct, 1)} vs. anterior
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Executive report */}
      <div className="surface-card mt-6 p-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-[image:var(--gradient-primary)]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Relatório executivo
          </h2>
        </div>
        <p className="text-[15px] leading-relaxed text-foreground/90">{report}</p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
