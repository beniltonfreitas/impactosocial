import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdPlus() {
  return (
    <ModuloTemplate
      titulo="PcD+"
      subtitulo="Central de Inclusão e Notícias Acessíveis"
      emoji="📰"
      slug="feed"
      corDestaque="primary"
      seoDescription="Notícias, artigos e conteúdos acessíveis sobre o universo da inclusão com tradução para Libras e áudio-descrição automática."
      descricao="O PcD+ é sua central de informação sobre inclusão e acessibilidade. Aqui você encontra notícias em tempo real, artigos especializados e conteúdos 100% acessíveis, com tradução automática para Libras, áudio-descrição e linguagem simplificada por IA. Tudo pensado para garantir que a informação chegue a todas as pessoas, independente de suas necessidades específicas."
      beneficios={[
        "📰 Notícias em tempo real com tradução para Libras",
        "🔊 Áudio-descrição automática de todos os conteúdos",
        "📱 Feed personalizado conforme suas preferências",
        "🎯 Linguagem simplificada por IA para melhor compreensão",
        "🔔 Notificações de breaking news acessíveis",
        "💬 Sistema de comentários inclusivo e moderado"
      ]}
      ctaTexto="Acessar PcD+"
      ctaLink="/auth"
    />
  );
}
