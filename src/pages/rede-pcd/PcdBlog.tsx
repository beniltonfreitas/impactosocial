import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdBlog() {
  return (
    <ModuloTemplate
      titulo="PcD Blog"
      subtitulo="Espaço de Expressão e Autoria PcD"
      emoji="✍️"
      slug="blog"
      corDestaque="secondary"
      seoDescription="Publique artigos e compartilhe experiências. Editor acessível com alcance de milhares de leitores e sistema de comentários moderado."
      descricao="O PcD Blog é seu espaço de expressão e autoria. Publique artigos, crônicas, poesias e relatos de experiência com total acessibilidade. Nosso editor é otimizado para leitores de tela e oferece recursos de formatação simples. Seus textos alcançam milhares de leitores e você recebe feedback da comunidade em um ambiente seguro e moderado."
      beneficios={[
        "✍️ Editor de textos totalmente acessível",
        "📢 Alcance de milhares de leitores engajados",
        "💬 Sistema de comentários moderado e respeitoso",
        "🏆 Destaque mensal para melhores autores",
        "📚 Biblioteca com todos os artigos publicados",
        "🎯 Tags e categorias para organização"
      ]}
      ctaTexto="Começar a Escrever"
      ctaLink="/auth"
    />
  );
}
