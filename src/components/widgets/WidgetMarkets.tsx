import { useEffect, useState } from "react";
import { fetchMarkets, MarketResp } from "@/lib/widgets";

export function WidgetMarkets() {
  const [data, setData] = useState<MarketResp | null>(null);

  const load = async () => {
    try {
      setData(await fetchMarkets());
    } catch (e) {
      console.error("Error loading markets:", e);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl p-4 shadow bg-card border border-border">
      <div className="font-semibold mb-3 text-card-foreground">Mercado Agora</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Item label="Dólar (USD/BRL)" value={data?.usd_brl} />
        <Item label="Euro (EUR/BRL)" value={data?.eur_brl} />
        <Item label="Ibovespa (pts)" value={data?.ibov} />
        <Item label="Bitcoin (BRL)" value={data?.btc_brl} />
        <Item label="Ethereum (BRL)" value={data?.eth_brl} />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {data?.updated_at
          ? `Atualizado: ${new Date(data.updated_at).toLocaleTimeString()}`
          : "Atualizando..."}
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-base font-medium text-card-foreground">
        {typeof value === "number"
          ? value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
          : "—"}
      </span>
    </div>
  );
}
