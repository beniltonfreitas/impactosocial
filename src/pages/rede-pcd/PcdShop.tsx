import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdShop() {
  return (
    <ModuloTemplate
      titulo="PcD Shop"
      subtitulo="Marketplace Inclusivo"
      emoji="🛒"
      slug="shop"
      corDestaque="accent"
      seoDescription="Marketplace de produtos e serviços acessíveis de empreendedores PcD. Compre com descontos exclusivos e apoie a economia inclusiva."
      descricao="O PcD Shop é um marketplace que conecta empreendedores PcD com consumidores conscientes. Aqui você encontra produtos artesanais, tecnologias assistivas, serviços profissionais e muito mais. Todos os vendedores são verificados e recebem apoio para crescer. Assinantes têm descontos exclusivos e frete facilitado."
      beneficios={[
        "🛒 Marketplace 100% inclusivo e acessível",
        "💳 Descontos exclusivos para assinantes",
        "🏪 Apoio direto a empreendedores PcD",
        "📦 Sistema de avaliações confiável e transparente",
        "🚚 Opções de frete facilitado e rastreamento",
        "🔒 Pagamentos seguros e múltiplas formas"
      ]}
      ctaTexto="Explorar Produtos"
      ctaLink="/auth"
    />
  );
}
