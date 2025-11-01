import { ModuloTemplate } from "@/components/rede-pcd/ModuloTemplate";

export default function PcdDireitos() {
  return (
    <ModuloTemplate
      titulo="PcD Direitos"
      subtitulo="Seus Direitos Garantidos por Lei"
      emoji="⚖️"
      slug="direitos"
      corDestaque="secondary"
      seoDescription="Informações jurídicas e orientações sobre direitos das pessoas com deficiência, BPC, transporte gratuito, isenções e muito mais."
      descricao="No PcD Direitos você encontra todas as informações sobre legislação, benefícios e garantias para pessoas com deficiência. Oferecemos guias completos sobre BPC/LOAS, passe livre, isenções fiscais, cotas de trabalho e educação inclusiva. Tudo em linguagem clara e acessível, com modelos de documentos prontos para uso."
      beneficios={[
        "⚖️ Guias completos sobre legislação PcD atualizada",
        "📘 Modelos de documentos e requerimentos prontos",
        "🤝 Orientação jurídica especializada e gratuita",
        "📢 Canal de denúncias de violações de direitos",
        "📚 Biblioteca com leis federais, estaduais e municipais",
        "🎯 Passo a passo para solicitar benefícios"
      ]}
      ctaTexto="Conheça Seus Direitos"
      ctaLink="/auth"
    />
  );
}
