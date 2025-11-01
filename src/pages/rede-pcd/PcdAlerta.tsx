import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdAlerta() {
  return (
    <ModuloTemplate
      titulo="PcD Alerta"
      subtitulo="Canal de Denúncia e Fiscalização Cidadã"
      emoji="🚨"
      slug="alerta"
      corDestaque="destructive"
      seoDescription="Fiscalização colaborativa de acessibilidade e direitos. Denuncie estabelecimentos irregulares, calçadas inacessíveis e violações de direitos."
      descricao="O PcD Alerta é uma plataforma de fiscalização colaborativa onde você pode denunciar problemas de acessibilidade, violações de direitos e irregularidades. Todas as denúncias são geolocalizadas, podem incluir fotos e vídeos como comprovação, e são automaticamente encaminhadas para os órgãos competentes. Você pode acompanhar o status da sua denúncia em tempo real."
      beneficios={[
        "🚨 Denúncias geolocalizadas em tempo real",
        "📸 Upload de fotos e vídeos como prova",
        "🏛️ Encaminhamento automático para órgãos competentes",
        "📊 Acompanhamento do status das denúncias",
        "🗺️ Mapa colaborativo de acessibilidade urbana",
        "📢 Mobilização coletiva para problemas recorrentes"
      ]}
      ctaTexto="Fazer uma Denúncia"
      ctaLink="/auth"
    />
  );
}
