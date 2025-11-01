import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdVitrine() {
  return (
    <ModuloTemplate
      titulo="PcD Vitrine"
      subtitulo="Portfólio Profissional e Negócios Inclusivos"
      emoji="💼"
      slug="vitrine"
      corDestaque="primary"
      seoDescription="Espaço para divulgar serviços e negócios inclusivos. Crie seu portfólio digital gratuito e conecte-se com contratantes."
      descricao="A PcD Vitrine é seu espaço para divulgar serviços profissionais e negócios. Crie gratuitamente um portfólio digital completo com fotos, descrição de serviços, valores e contatos. Seu perfil é otimizado para mecanismos de busca e você recebe estatísticas de visualizações. Conecte-se com potenciais clientes e contratantes."
      beneficios={[
        "💼 Portfólio digital profissional gratuito",
        "🔍 Otimização para aparecer nas buscas",
        "📈 Estatísticas detalhadas de visualizações",
        "🤝 Conexão direta com contratantes interessados",
        "📸 Galeria ilimitada de fotos dos seus trabalhos",
        "⭐ Sistema de avaliações de clientes"
      ]}
      ctaTexto="Criar Meu Portfólio"
      ctaLink="/auth"
    />
  );
}
