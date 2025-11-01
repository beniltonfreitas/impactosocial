import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdClube() {
  return (
    <ModuloTemplate
      titulo="PcD Clube"
      subtitulo="Rede de Benefícios e Parcerias Inclusivas"
      emoji="🤝"
      slug="clube"
      corDestaque="primary"
      seoDescription="Descontos e vantagens exclusivas em parceiros. Rede com mais de 500 estabelecimentos e economia média de R$ 200/mês."
      descricao="O PcD Clube é sua rede de benefícios exclusivos. Tenha acesso a descontos em farmácias, supermercados, lojas, restaurantes, academias e serviços diversos. São mais de 500 parceiros espalhados por todo o Brasil. Membros relatam economia média de R$ 200 por mês. Use o mapa interativo para encontrar parceiros perto de você."
      beneficios={[
        "🎁 Descontos em farmácias, lojas e serviços",
        "🏪 Rede com mais de 500 parceiros nacionais",
        "💰 Economia média de R$ 200 por mês",
        "📍 Mapa interativo de parceiros por região",
        "🔔 Notificações de novas ofertas exclusivas",
        "💳 Carteirinha digital para usar nas lojas"
      ]}
      ctaTexto="Ver Benefícios"
      ctaLink="/auth"
    />
  );
}
