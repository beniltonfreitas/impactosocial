import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdPlay() {
  return (
    <ModuloTemplate
      titulo="PcD Play"
      subtitulo="Streaming Inclusivo 100% Acessível"
      emoji="▶️"
      slug="play"
      corDestaque="accent"
      seoDescription="Vídeos, lives e eventos 100% acessíveis com Libras, audiodescrição e legendas. Assista produções originais sobre inclusão."
      descricao="O PcD Play é sua plataforma de streaming totalmente acessível. Oferecemos uma biblioteca completa de vídeos com tradução em Libras, audiodescrição e legendas sincronizadas. Acompanhe lives de eventos, debates, shows e palestras sobre inclusão em tempo real. Todas as produções são pensadas para garantir acessibilidade plena."
      beneficios={[
        "▶️ Biblioteca de vídeos com Libras e audiodescrição",
        "📺 Lives e eventos ao vivo 100% acessíveis",
        "🎬 Produções originais sobre inclusão e direitos",
        "💾 Download para assistir offline quando quiser",
        "🎭 Shows, palestras e debates inclusivos",
        "📱 Compatível com todos os dispositivos"
      ]}
      ctaTexto="Assistir Agora"
      ctaLink="/auth"
    />
  );
}
