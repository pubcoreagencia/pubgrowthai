import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

const setupSchema = z.object({
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
  objective: z.enum(["views", "engagement", "traffic", "conversion", "awareness"]),
  // Optional results (all numbers)
  views: z.coerce.number().min(0).optional(),
  impressions: z.coerce.number().min(0).optional(),
  reach: z.coerce.number().min(0).optional(),
  likes: z.coerce.number().min(0).optional(),
  comments: z.coerce.number().min(0).optional(),
  shares: z.coerce.number().min(0).optional(),
  saves: z.coerce.number().min(0).optional(),
  linkClicks: z.coerce.number().min(0).optional(),
  followersBefore: z.coerce.number().min(0).optional(),
  followersAfter: z.coerce.number().min(0).optional(),
  purchases: z.coerce.number().min(0).optional(),
  revenue: z.coerce.number().min(0).optional(),
  avgOrderValue: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof setupSchema>;

export const Route = createFileRoute("/campaigns/new")({
  component: NewCampaign,
});

function NewCampaign() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(setupSchema),
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

  // Auto-compute days when dates change.
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
      },
      {
        views: v.views,
        impressions: v.impressions,
        reach: v.reach,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        saves: v.saves,
        linkClicks: v.linkClicks,
        followersBefore: v.followersBefore,
        followersAfter: v.followersAfter,
        purchases: v.purchases,
        revenue: v.revenue,
        avgOrderValue: v.avgOrderValue,
      },
    );
    toast.success("Campanha criada");
    navigate({ to: "/campaigns/$id", params: { id: created.id } });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
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
        Preencha as informações da campanha. Você pode informar os resultados
        agora ou depois — o relatório é atualizado automaticamente.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {/* Setup */}
          <section className="surface-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[image:var(--gradient-primary)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Configuração da campanha
              </h2>
            </div>
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
                      <Input placeholder="Ex: Lançamento coleção verão" {...field} />
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
                        <SelectItem value="views">Visualizações</SelectItem>
                        <SelectItem value="engagement">Engajamento</SelectItem>
                        <SelectItem value="traffic">Tráfego</SelectItem>
                        <SelectItem value="conversion">Conversão</SelectItem>
                        <SelectItem value="awareness">Reconhecimento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Results */}
          <section className="surface-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[image:var(--gradient-primary)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Resultados obtidos
              </h2>
              <span className="ml-2 text-[11px] text-muted-foreground">opcionais</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <NumberField control={form.control} name="views" label="Views" />
              <NumberField control={form.control} name="impressions" label="Impressões" />
              <NumberField control={form.control} name="reach" label="Alcance" />
              <NumberField control={form.control} name="likes" label="Curtidas" />
              <NumberField control={form.control} name="comments" label="Comentários" />
              <NumberField control={form.control} name="shares" label="Compartilhamentos" />
              <NumberField control={form.control} name="saves" label="Salvamentos" />
              <NumberField control={form.control} name="linkClicks" label="Cliques no link" />
              <NumberField control={form.control} name="followersBefore" label="Seguidores antes" />
              <NumberField control={form.control} name="followersAfter" label="Seguidores depois" />
              <NumberField control={form.control} name="purchases" label="Compras" />
              <NumberField control={form.control} name="avgOrderValue" label="Ticket médio (R$)" step="0.01" />
              <NumberField
                control={form.control}
                name="revenue"
                label="Receita total (R$)"
                step="0.01"
                className="md:col-span-3"
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
    </div>
  );
}

function NumberField({
  control,
  name,
  label,
  step,
  className,
}: {
  control: ReturnType<typeof useForm<FormValues>>["control"];
  name: keyof FormValues;
  label: string;
  step?: string;
  className?: string;
}) {
  return (
    <FormField
      control={control}
      name={name as never}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-xs text-muted-foreground">{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="0"
              step={step ?? "1"}
              placeholder="0"
              value={(field.value as number | undefined) ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
