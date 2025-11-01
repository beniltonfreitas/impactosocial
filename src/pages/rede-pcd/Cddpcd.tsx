import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function Cddpcd() {
  return (
    <ModuloTemplate
      titulo="CDDPcD"
      subtitulo="Conselhos de Defesa dos Direitos das PcD"
      emoji="🏛️"
      slug="conselhos"
      corDestaque="secondary"
      seoDescription="Informações sobre conselhos municipais, estaduais e nacional de defesa dos direitos das pessoas com deficiência. Participe ativamente."
      descricao="O CDDPcD conecta você aos Conselhos de Defesa dos Direitos das Pessoas com Deficiência de todo o Brasil. Encontre informações de contato, horários de atendimento, calendário de reuniões, atas públicas e como participar ativamente das deliberações. Fortaleça o controle social e a garantia de direitos."
      beneficios={[
        "🏛️ Diretório completo de conselhos por estado e cidade",
        "📞 Contatos diretos e horários de atendimento",
        "📋 Acesso a atas e deliberações públicas",
        "🗳️ Como participar das reuniões e conferências",
        "📢 Notificações de pautas importantes",
        "🤝 Conexão com conselheiros e movimento social"
      ]}
      ctaTexto="Encontrar Meu Conselho"
      ctaLink="/auth"
    />
  );
}
