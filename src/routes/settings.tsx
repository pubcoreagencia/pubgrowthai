import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DEFAULT_SETTINGS,
  getEstimationSettings,
  resetEstimationSettings,
  saveEstimationSettings,
  type EstimationSettings,
} from "@/lib/estimation-settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Info, RotateCcw, Save } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

interface FieldMeta {
  key: keyof EstimationSettings;
  label: string;
  help: string;
  format: "percent" | "ratio";
  group: "core" | "revenue" | "funnel";
}

const fields: FieldMeta[] = [
  { key: "viewsShareOfImpressions", label: "Views ÷ Impressões", help: "Views representam ~10% das impressões.", format: "percent", group: "core" },
  { key: "engagementRate", label: "Curtidas + Comentários", help: "% das views que geram curtida ou comentário.", format: "percent", group: "core" },
  { key: "savesRate", label: "Salvamentos", help: "% das views que salvam o conteúdo.", format: "percent", group: "core" },
  { key: "ctrOnImpressions", label: "CTR sobre impressões", help: "% de impressões que geram clique no link.", format: "percent", group: "core" },
  { key: "purchaseConversion", label: "Conversão em compra", help: "% dos cliques que convertem em venda.", format: "percent", group: "core" },
  { key: "upsellRate", label: "Taxa de upsell", help: "% de compradores que aceitam upsell.", format: "percent", group: "revenue" },
  { key: "crossSellRate", label: "Taxa de cross sell", help: "% de compradores que aceitam cross sell.", format: "percent", group: "revenue" },
  { key: "upsellValueRatio", label: "Ticket upsell (razão)", help: "Ticket do upsell como % do produto principal.", format: "percent", group: "revenue" },
  { key: "crossSellValueRatio", label: "Ticket cross sell (razão)", help: "Ticket do cross sell como % do produto principal.", format: "percent", group: "revenue" },
  { key: "remarketingReachRate", label: "Reimpacto remarketing", help: "% das views que recebem novamente o vídeo.", format: "percent", group: "funnel" },
  { key: "ctaViewRate", label: "Visualização de CTA", help: "% das views que veem o CTA reforçado.", format: "percent", group: "funnel" },
  { key: "offerViewRate", label: "Visualização da oferta", help: "% dos cliques que visualizam a oferta.", format: "percent", group: "funnel" },
  { key: "checkoutInitiationRate", label: "Início de checkout", help: "% dos cliques que iniciam o checkout.", format: "percent", group: "funnel" },
  { key: "recurringCustomerRate", label: "Clientes recorrentes", help: "% dos compradores que viram recorrentes.", format: "percent", group: "funnel" },
];

function SettingsPage() {
  const [values, setValues] = useState<EstimationSettings>(() => getEstimationSettings());

  const handleSave = () => {
    saveEstimationSettings(values);
    toast.success("Configurações salvas");
  };

  const handleReset = () => {
    resetEstimationSettings();
    setValues(DEFAULT_SETTINGS);
    toast.success("Valores restaurados");
  };

  const groups: Array<{ id: FieldMeta["group"]; title: string; desc: string }> = [
    { id: "core", title: "Motor principal", desc: "Taxas que projetam impressões, interações, cliques e compras." },
    { id: "revenue", title: "Economia de receita", desc: "Como cada compra se desdobra em upsell e cross sell." },
    { id: "funnel", title: "Etapas do funil", desc: "Taxas para as etapas intermediárias do funil inteligente." },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Configurações do motor
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ajuste as taxas médias de mercado que a plataforma utiliza para projetar
        cada campanha. As mudanças se aplicam imediatamente a todas as campanhas.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Todos os valores são expressos em <strong className="text-foreground">porcentagem</strong>
          . Ex: digite <code className="rounded bg-muted px-1">10</code> para 10%.
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((g) => (
          <section key={g.id} className="surface-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[image:var(--gradient-primary)]" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.title}
                </h2>
                <p className="text-xs text-muted-foreground/80">{g.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fields
                .filter((f) => f.group === g.id)
                .map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={f.key} className="text-sm">
                      {f.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={f.key}
                        type="number"
                        step="0.1"
                        min="0"
                        value={(values[f.key] * 100).toFixed(2)}
                        onChange={(e) => {
                          const n = Number(e.target.value) / 100;
                          setValues((v) => ({ ...v, [f.key]: Number.isFinite(n) ? n : 0 }));
                        }}
                        className="pr-8"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{f.help}</p>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar padrões
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
