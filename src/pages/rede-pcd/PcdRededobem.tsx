import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdRededobem() {
  return (
    <ModuloTemplate
      titulo="PcD Rede do Bem"
      subtitulo="Campanhas Solidárias e Apoio Comunitário"
      emoji="❤️"
      slug="rede-do-bem"
      corDestaque="destructive"
      seoDescription="Apoie e seja apoiado pela comunidade. Campanhas de arrecadação verificadas, doações rastreáveis e projetos sociais comprovados."
      descricao="A PcD Rede do Bem conecta pessoas que precisam de apoio com quem deseja ajudar. Todas as campanhas são verificadas pela nossa equipe para garantir transparência. Você pode criar campanhas para tratamentos, equipamentos ou projetos sociais. As doações são rastreáveis e você recebe relatórios de impacto. Juntos somos mais fortes."
      beneficios={[
        "❤️ Campanhas de arrecadação verificadas e seguras",
        "🤲 Doações 100% rastreáveis e transparentes",
        "🎯 Projetos sociais com comprovação de resultados",
        "📊 Relatórios detalhados de impacto social",
        "🏥 Apoio para tratamentos e equipamentos",
        "🤝 Comunidade solidária e engajada"
      ]}
      ctaTexto="Apoiar uma Causa"
      ctaLink="/auth"
    />
  );
}
