import type { Campaign, CampaignResults } from "./campaigns-store";

export interface Metrics {
  totalInvestment: number;
  followersGained: number;
  followersGrowthPct: number | null;
  followersDailyAvg: number;
  engagementRate: number | null;
  ctr: number | null;
  cpc: number | null;
  cpv: number | null;
  cpa: number | null;
  conversionRate: number | null;
  revenue: number;
  roas: number | null;
  totalEngagements: number;
}

const safeDiv = (n: number, d: number | undefined | null) =>
  d && d > 0 ? n / d : null;

export function computeMetrics(c: Campaign): Metrics {
  const r: CampaignResults = c.results;
  const totalInvestment = (c.dailyBudget || 0) * (c.days || 0);
  const followersBefore = r.followersBefore ?? 0;
  const followersAfter = r.followersAfter ?? followersBefore;
  const followersGained = followersAfter - followersBefore;
  const followersGrowthPct =
    followersBefore > 0 ? (followersGained / followersBefore) * 100 : null;
  const followersDailyAvg = c.days > 0 ? followersGained / c.days : 0;

  const totalEngagements =
    (r.likes ?? 0) + (r.comments ?? 0) + (r.shares ?? 0) + (r.saves ?? 0);

  const engagementRate = safeDiv(totalEngagements, r.views) !== null
    ? (totalEngagements / (r.views as number)) * 100
    : null;

  const ctr = safeDiv(r.linkClicks ?? 0, r.impressions);
  const ctrPct = ctr !== null ? ctr * 100 : null;

  const cpc = safeDiv(totalInvestment, r.linkClicks);
  const cpv = safeDiv(totalInvestment, r.views);
  const cpa = safeDiv(totalInvestment, r.purchases);
  const conversionRate = safeDiv(r.purchases ?? 0, r.linkClicks);
  const conversionRatePct = conversionRate !== null ? conversionRate * 100 : null;

  const revenue =
    r.revenue && r.revenue > 0
      ? r.revenue
      : (r.purchases ?? 0) * (r.avgOrderValue ?? 0);

  const roas = safeDiv(revenue, totalInvestment);

  return {
    totalInvestment,
    followersGained,
    followersGrowthPct,
    followersDailyAvg,
    engagementRate,
    ctr: ctrPct,
    cpc,
    cpv,
    cpa,
    conversionRate: conversionRatePct,
    revenue,
    roas,
    totalEngagements,
  };
}

export function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export function formatInt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

export function formatPct(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function formatNumber(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function buildExecutiveReport(c: Campaign, m: Metrics): string {
  const parts: string[] = [];
  parts.push(
    `A campanha "${c.campaignName}" foi executada durante ${c.days} dia${c.days === 1 ? "" : "s"} com investimento total de ${formatBRL(m.totalInvestment)}.`,
  );
  if (c.results.views) {
    parts.push(
      `O vídeo alcançou ${formatInt(c.results.views)} visualizações${c.results.impressions ? `, gerando ${formatInt(c.results.impressions)} impressões` : ""}${c.results.linkClicks ? ` e ${formatInt(c.results.linkClicks)} cliques` : ""}.`,
    );
  }
  if (m.followersGained !== 0) {
    parts.push(
      `O perfil apresentou ${m.followersGained > 0 ? "crescimento" : "variação"} de ${formatInt(Math.abs(m.followersGained))} seguidores no período${m.followersGrowthPct !== null ? ` (${formatPct(m.followersGrowthPct)})` : ""}.`,
    );
  }
  if (c.results.purchases && c.results.purchases > 0) {
    parts.push(
      `Foram registradas ${formatInt(c.results.purchases)} venda${c.results.purchases === 1 ? "" : "s"}${m.revenue ? `, resultando em receita de ${formatBRL(m.revenue)}` : ""}${m.roas !== null ? ` e ROAS de ${formatNumber(m.roas)}` : ""}.`,
    );
  }
  if (m.engagementRate !== null) {
    parts.push(
      `A taxa de engajamento sobre visualizações foi de ${formatPct(m.engagementRate)}${m.ctr !== null ? `, com CTR de ${formatPct(m.ctr)}` : ""}.`,
    );
  }
  if (m.roas !== null) {
    parts.push(
      m.roas >= 2
        ? `Os indicadores demonstram boa eficiência na conversão entre visualização e compra.`
        : `Há oportunidade de otimização no funil de conversão para melhorar o retorno da campanha.`,
    );
  }
  return parts.join(" ");
}

export function getInstagramEmbedId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}
