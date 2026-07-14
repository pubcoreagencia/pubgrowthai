// Estimation engine — MVP 1.0.
// Takes a Campaign (only views informed manually) plus the admin-tunable
// EstimationSettings and produces every derived indicator used by the
// dashboard, funnel and executive report.

import type { Campaign } from "./campaigns-store";
import type { EstimationSettings } from "./estimation-settings";

export interface CampaignEstimates {
  // Setup
  investment: number;
  views: number;

  // Reach & engagement
  impressions: number;
  interactions: number; // curtidas + comentários
  saves: number;
  totalEngagements: number;
  engagementRate: number; // %

  // Traffic & conversion
  clicks: number;
  purchases: number;
  ctr: number; // %
  conversionRate: number; // %

  // Post-sale
  upsells: number;
  crossSells: number;

  // Revenue
  productValue: number;
  upsellValue: number;
  crossSellValue: number;
  revenueMain: number;
  revenueUpsell: number;
  revenueCrossSell: number;
  revenueTotal: number;

  // Efficiency
  cpv: number | null;
  cpc: number | null;
  cpa: number | null;
  roas: number | null;
}

export function estimateCampaign(
  c: Campaign,
  s: EstimationSettings,
): CampaignEstimates {
  const investment = (c.dailyBudget || 0) * (c.days || 0);
  const views = c.results.views ?? 0;

  const impressions =
    s.viewsShareOfImpressions > 0 ? views / s.viewsShareOfImpressions : 0;

  const interactions = views * s.engagementRate;
  const saves = views * s.savesRate;
  const totalEngagements = interactions + saves;
  const engagementRate =
    views > 0 ? (totalEngagements / views) * 100 : 0;

  const clicks = impressions * s.ctrOnImpressions;
  const purchases = clicks * s.purchaseConversion;

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (purchases / clicks) * 100 : 0;

  const upsells = purchases * s.upsellRate;
  const crossSells = purchases * s.crossSellRate;

  const productValue = c.avgProductValue ?? 0;
  const upsellValue = c.avgUpsellValue ?? productValue * s.upsellValueRatio;
  const crossSellValue =
    c.avgCrossSellValue ?? productValue * s.crossSellValueRatio;

  const revenueMain = purchases * productValue;
  const revenueUpsell = upsells * upsellValue;
  const revenueCrossSell = crossSells * crossSellValue;
  const revenueTotal = revenueMain + revenueUpsell + revenueCrossSell;

  const cpv = views > 0 ? investment / views : null;
  const cpc = clicks > 0 ? investment / clicks : null;
  const cpa = purchases > 0 ? investment / purchases : null;
  const roas = investment > 0 ? revenueTotal / investment : null;

  return {
    investment,
    views,
    impressions,
    interactions,
    saves,
    totalEngagements,
    engagementRate,
    clicks,
    purchases,
    ctr,
    conversionRate,
    upsells,
    crossSells,
    productValue,
    upsellValue,
    crossSellValue,
    revenueMain,
    revenueUpsell,
    revenueCrossSell,
    revenueTotal,
    cpv,
    cpc,
    cpa,
    roas,
  };
}

export interface FunnelStep {
  key: string;
  name: string;
  phase: "topo" | "meio" | "fundo" | "pos";
  value: number;
  cumulativeRevenue?: number;
}

export function buildFunnel(
  e: CampaignEstimates,
  s: EstimationSettings,
): FunnelStep[] {
  const remarketing = e.views; // toda view entra em audiência
  const remarketingReceived = e.views * s.remarketingReachRate;
  const ctaReached = e.views * s.ctaViewRate;
  const offerViewed = e.clicks * s.offerViewRate;
  const checkoutStarted = e.clicks * s.checkoutInitiationRate;
  const recurring = e.purchases * s.recurringCustomerRate;

  return [
    { key: "start", name: "Campanha iniciada", phase: "topo", value: e.impressions },
    { key: "impressions", name: "Pessoas impactadas", phase: "topo", value: e.impressions },
    { key: "views", name: "Assistiram ao vídeo", phase: "topo", value: e.views },
    { key: "remarketing", name: "Entraram em remarketing", phase: "meio", value: remarketing },
    { key: "reimpact", name: "Receberam vídeo novamente", phase: "meio", value: remarketingReceived },
    { key: "cta", name: "Receberam CTA", phase: "meio", value: ctaReached },
    { key: "clicks", name: "Clicaram no link", phase: "fundo", value: e.clicks },
    { key: "offer", name: "Visualizaram a oferta", phase: "fundo", value: offerViewed },
    { key: "checkout", name: "Iniciaram checkout", phase: "fundo", value: checkoutStarted },
    { key: "purchase", name: "Compraram", phase: "fundo", value: e.purchases, cumulativeRevenue: e.revenueMain },
    { key: "upsell_offer", name: "Receberam oferta de Upsell", phase: "pos", value: e.purchases },
    { key: "upsell_buy", name: "Compraram Upsell", phase: "pos", value: e.upsells, cumulativeRevenue: e.revenueMain + e.revenueUpsell },
    { key: "cross_offer", name: "Receberam Cross Sell", phase: "pos", value: e.purchases },
    { key: "cross_buy", name: "Compraram Cross Sell", phase: "pos", value: e.crossSells, cumulativeRevenue: e.revenueTotal },
    { key: "recurring", name: "Clientes recorrentes", phase: "pos", value: recurring },
  ];
}

// Format helpers

export function formatBRL(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
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

export function getInstagramEmbedId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export function buildExecutiveReport(
  c: Campaign,
  e: CampaignEstimates,
): string[] {
  const parts: string[] = [];

  parts.push(
    `A campanha "${c.campaignName}" para ${c.clientName} foi veiculada por ${c.days} dia${c.days === 1 ? "" : "s"}, com investimento total de ${formatBRL(e.investment)} (${formatBRL(c.dailyBudget)} por dia). Os números apresentados são estimativas projetadas a partir das ${formatInt(e.views)} visualizações informadas e das taxas de mercado configuradas na plataforma.`,
  );

  parts.push(
    `Estima-se que o vídeo tenha gerado ${formatInt(e.impressions)} impressões, alcançando um público amplo no topo do funil. As ${formatInt(e.views)} visualizações representam a fatia efetivamente engajada com o criativo, com ${formatInt(e.totalEngagements)} interações estimadas — curtidas, comentários e salvamentos combinados — resultando em uma taxa de engajamento projetada de ${formatPct(e.engagementRate)}.`,
  );

  parts.push(
    `Ao longo da jornada de conversão, o funil aponta para ${formatInt(e.clicks)} cliques no link (CTR de ${formatPct(e.ctr)}) e ${formatInt(e.purchases)} compra${e.purchases === 1 ? "" : "s"} concretizada${e.purchases === 1 ? "" : "s"}, o que equivale a uma taxa de conversão de ${formatPct(e.conversionRate)} entre quem clica e quem compra.`,
  );

  if (e.productValue > 0) {
    parts.push(
      `Somando venda principal (${formatBRL(e.revenueMain)}), upsell (${formatBRL(e.revenueUpsell)} em ${formatInt(e.upsells)} operações) e cross sell (${formatBRL(e.revenueCrossSell)} em ${formatInt(e.crossSells)} operações), a receita total projetada é de ${formatBRL(e.revenueTotal)}, com ROAS estimado de ${formatNumber(e.roas)}.`,
    );
  } else {
    parts.push(
      `O valor médio do produto não foi informado, portanto a receita projetada não pôde ser calculada. Recomenda-se preencher o ticket médio para obter uma estimativa completa de ROAS e retorno.`,
    );
  }

  if (e.roas !== null && e.productValue > 0) {
    if (e.roas >= 3) {
      parts.push(
        `O desempenho projetado é sólido: para cada real investido, a expectativa é de retorno de ${formatNumber(e.roas)} reais. Recomenda-se manter o criativo em veiculação e considerar escalar o investimento diário, monitorando a saturação da audiência.`,
      );
    } else if (e.roas >= 1.5) {
      parts.push(
        `O retorno projetado é positivo, porém há margem para otimização. Sugere-se testar variações de CTA, refinar o público de remarketing e reforçar gatilhos de conversão para elevar a taxa de compra sobre cliques.`,
      );
    } else {
      parts.push(
        `O ROAS projetado indica que o funil precisa de ajustes antes de qualquer escala. Prioridades sugeridas: revisar a oferta, encurtar o caminho até o checkout e trabalhar campanhas dedicadas de recuperação de abandono para converter o volume já gerado.`,
      );
    }
  }

  parts.push(
    `Recomendações para a próxima campanha: reforçar a estratégia de upsell (hoje projetada em ${formatInt(e.upsells)} operações) e cross sell (${formatInt(e.crossSells)}) para elevar o ticket médio; nutrir a base de remarketing gerada por este vídeo com um segundo criativo focado em conversão; e acompanhar a evolução do CPA (${formatBRL(e.cpa)}) e CPV (${formatBRL(e.cpv)}) ao longo dos próximos aportes.`,
  );

  return parts;
}
