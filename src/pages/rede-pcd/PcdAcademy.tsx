import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdAcademy() {
  return (
    <ModuloTemplate
      titulo="PcD Academy"
      subtitulo="Formação e Capacitação Inclusiva"
      emoji="🎓"
      slug="academy"
      corDestaque="accent"
      seoDescription="Cursos online 100% acessíveis e gratuitos com certificados reconhecidos. Aprenda com instrutores especializados em inclusão."
      descricao="A PcD Academy oferece cursos online totalmente acessíveis e gratuitos sobre diversos temas: tecnologia, empreendedorismo, direitos, acessibilidade digital, marketing e muito mais. Todos os cursos têm Libras, audiodescrição e materiais em formatos diversos. Ao concluir, você recebe certificado reconhecido para incluir no currículo."
      beneficios={[
        "🎓 Cursos 100% acessíveis e totalmente gratuitos",
        "📜 Certificados reconhecidos ao término",
        "👨‍🏫 Instrutores especializados em inclusão",
        "📚 Biblioteca digital com e-books e materiais",
        "🎯 Trilhas de aprendizado personalizadas",
        "💻 Acesso ilimitado a todos os conteúdos"
      ]}
      ctaTexto="Ver Cursos Disponíveis"
      ctaLink="/auth"
    />
  );
}
