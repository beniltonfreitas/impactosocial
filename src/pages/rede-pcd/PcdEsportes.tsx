import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdEsportes() {
  return (
    <ModuloTemplate
      titulo="PcD Esportes"
      subtitulo="Esporte Adaptado e Paralímpico"
      emoji="🏅"
      slug="esportes"
      corDestaque="primary"
      seoDescription="Cobertura completa do esporte adaptado brasileiro. Notícias, resultados, perfis de atletas paralímpicos e calendário de competições."
      descricao="O PcD Esportes traz cobertura completa do esporte adaptado e paralímpico brasileiro. Acompanhe notícias em tempo real, resultados de competições, perfis inspiradores de atletas, calendário de eventos e guias sobre modalidades adaptadas. Celebramos as conquistas e promovemos a visibilidade do esporte paralímpico nacional."
      beneficios={[
        "🏅 Notícias e resultados em tempo real",
        "🏆 Perfis completos de atletas paralímpicos brasileiros",
        "📅 Calendário nacional e internacional de competições",
        "🎯 Guia completo de modalidades adaptadas",
        "📸 Galeria de fotos e vídeos exclusivos",
        "💪 Histórias inspiradoras de superação"
      ]}
      ctaTexto="Ver Notícias Esportivas"
      ctaLink="/auth"
    />
  );
}
