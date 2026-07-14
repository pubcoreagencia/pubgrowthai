import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCampaign } from "@/lib/campaigns-store";
import { useEstimationSettings } from "@/lib/estimation-settings";
import {
  estimateCampaign,
  formatBRL,
  formatInt,
  formatNumber,
  formatPct,
} from "@/lib/campaign-estimates";
import { toast } from "sonner";
import { ArrowLeft, Info, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

const schema = z.object({
  clientName: z.string().trim().min(1, "Informe o cliente").max(100),
  campaignName: z.string().trim().min(1, "Informe o nome da campanha").max(120),
  videoUrl: z
    .string()
    .trim()
    .min(1, "Informe o link do vídeo")
    .url("URL inválida")
    .max(500),
  startDate: z.string().min(1, "Informe a data inicial"),
  endDate: z.string().min(1, "Informe a data final"),
  dailyBudget: z.coerce.number().min(0, "Valor inválido"),
  days: z.coerce.number().int().min(1, "Mínimo 1 dia"),
  objective: z.enum([
    "views",
    "engagement",
    "traffic",
    "conversion",
    "sales",
    "awareness",
  ]),
  avgProductValue: z.coerce.number().min(0).optional(),
  avgUpsellValue: z.coerce.number().min(0).optional(),
  avgCrossSellValue: z.coerce.number().min(0).optional(),
  views: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/campaigns/new")({
  component: NewCampaign,
});

function NewCampaign() {
  const navigate = useNavigate();
  const settings = useEstimationSettings();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: "",
      campaignName: "",
      videoUrl: "",
      startDate: "",
      endDate: "",
      dailyBudget: 0,
      days: 1,
      objective: "views",
    },
  });

  const start = form.watch("startDate");
  const end = form.watch("endDate");
  useEffect(() => {
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
      if (!Number.isNaN(diff)) form.setValue("days", diff, { shouldValidate: false });
    }
  }, [start, end, form]);

  // Live preview of the estimation engine
  const values = form.watch();
  const preview = useMemo(() => {
    return estimateCampaign(
      {
        id: "preview",
        createdAt: "",
        updatedAt: "",
        clientName: values.clientName || "",
        campaignName: values.campaignName || "",
        videoUrl: values.videoUrl || "",
        startDate: values.startDate || "",
        endDate: values.endDate || "",
        dailyBudget: values.dailyBudget || 0,
        days: values.days || 0,
        objective: values.objective,
        avgProductValue: values.avgProductValue,
        avgUpsellValue: values.avgUpsellValue,
        avgCrossSellValue: values.avgCrossSellValue,
        results: { views: values.views },
      },
      settings,
    );
  }, [values, settings]);

  const onSubmit = (v: FormValues) => {
    const created = createCampaign(
      {
        clientName: v.clientName,
        campaignName: v.campaignName,
        videoUrl: v.videoUrl,
        startDate: v.startDate,
        endDate: v.endDate,
        dailyBudget: v.dailyBudget,
        days: v.days,
        objective: v.objective,
        avgProductValue: v.avgProductValue,
        avgUpsellValue: v.avgUpsellValue,
        avgCrossSellValue: v.avgCrossSellValue,
      },
      { views: v.views },
    );
    toast.success("Campanha criada");
    navigate({ to: "/campaigns/$id", params: { id: created.id } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <Link
        to="/campaigns"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para campanhas
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Nova campanha
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Informe apenas os dados essenciais. A plataforma calcula automaticamente
        impressões, interações, cliques, compras e receita a partir de taxas
        médias de mercado — ajustáveis em{" "}
        <Link to="/settings" className="text-primary hover:underline">
          configurações
        </Link>
        .
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="surface-card p-6">
              <SectionTitle>Configuração da campanha</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Loja Aurora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="campaignName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da campanha</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Lançamento verão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Link do vídeo no Instagram</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.instagram.com/reel/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Cole a URL do reel, post ou vídeo publicado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data inicial</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data final</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dailyBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investimento diário (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de dias</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Objetivo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="views">Views</SelectItem>
                          <SelectItem value="engagement">Engajamento</SelectItem>
                          <SelectItem value="traffic">Tráfego</SelectItem>
                          <SelectItem value="conversion">Conversão</SelectItem>
                          <SelectItem value="sales">Vendas</SelectItem>
                          <SelectItem value="awareness">Reconhecimento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="surface-card p-6">
              <SectionTitle>Resultado real informado</SectionTitle>
              <p className="-mt-1 mb-4 text-xs text-muted-foreground">
                Apenas as views obtidas — todo o resto é projetado pelo motor de
                estimativas.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="views"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Views obtidas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Ex: 45000"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="surface-card p-6">
              <SectionTitle>Economia do produto</SectionTitle>
              <p className="-mt-1 mb-4 text-xs text-muted-foreground">
                Opcional. Utilizado para projetar receita, upsell e cross sell.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="avgProductValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor médio do produto (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avgUpsellValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket do upsell (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="opcional"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avgCrossSellValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket do cross sell (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="opcional"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button asChild variant="ghost">
                <Link to="/campaigns">Cancelar</Link>
              </Button>
              <Button type="submit" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar relatório
              </Button>
            </div>
          </form>
        </Form>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="surface-card p-5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[image:var(--gradient-primary)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Prévia da estimativa
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <PreviewLine label="Investimento" value={formatBRL(preview.investment)} />
              <PreviewLine label="Impressões" value={formatInt(preview.impressions)} />
              <PreviewLine label="Interações" value={formatInt(preview.totalEngagements)} />
              <PreviewLine label="Cliques" value={formatInt(preview.clicks)} />
              <PreviewLine label="Compras" value={formatInt(preview.purchases)} />
              <PreviewLine label="Upsells" value={formatInt(preview.upsells)} />
              <PreviewLine label="Cross sell" value={formatInt(preview.crossSells)} />
              <PreviewLine label="Receita" value={formatBRL(preview.revenueTotal)} />
              <PreviewLine
                label="CTR"
                value={formatPct(preview.ctr)}
              />
              <PreviewLine
                label="ROAS"
                value={preview.roas !== null ? formatNumber(preview.roas) : "—"}
              />
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-card/40 p-3 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Estimativas geradas com base em taxas médias de mercado. Os
                números reais podem variar conforme criativo, público e nicho.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="h-6 w-1 rounded-full bg-[image:var(--gradient-primary)]" />
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
