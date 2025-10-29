import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Perguntas Frequentes (FAQ)"
        description="Encontre respostas para as perguntas mais comuns sobre assinaturas, conta, notificações e privacidade no Conexão na Cidade."
      />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Perguntas Frequentes</h1>
            <p className="text-xl text-muted-foreground">
              Encontre respostas rápidas para as dúvidas mais comuns
            </p>
          </div>

          <div className="space-y-6">
            {/* Assinaturas */}
            <Card>
              <CardHeader>
                <CardTitle>Assinaturas e Planos</CardTitle>
                <CardDescription>Tudo sobre nossos planos premium</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-1">
                    <AccordionTrigger>O que é o plano Premium?</AccordionTrigger>
                    <AccordionContent>
                      O plano Premium oferece acesso ilimitado a conteúdo exclusivo, artigos sem anúncios, 
                      notificações prioritárias de notícias urgentes e suporte premium. Você também terá 
                      acesso antecipado a novos recursos da plataforma.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2">
                    <AccordionTrigger>Como funciona o período de teste?</AccordionTrigger>
                    <AccordionContent>
                      Oferecemos 7 dias de teste gratuito para novos assinantes. Durante este período, 
                      você terá acesso completo a todos os recursos premium. Você pode cancelar a qualquer 
                      momento antes do fim do período de teste sem ser cobrado.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3">
                    <AccordionTrigger>Posso cancelar minha assinatura?</AccordionTrigger>
                    <AccordionContent>
                      Sim, você pode cancelar sua assinatura a qualquer momento através do painel de controle 
                      em "Meu Painel" → "Assinatura". Seu acesso premium continuará até o final do período pago.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4">
                    <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
                    <AccordionContent>
                      Aceitamos cartões de crédito (Visa, Mastercard, American Express), cartões de débito 
                      e pagamentos via Pix. Todas as transações são processadas de forma segura através do Stripe.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Conta */}
            <Card>
              <CardHeader>
                <CardTitle>Conta e Perfil</CardTitle>
                <CardDescription>Gerenciamento da sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-5">
                    <AccordionTrigger>Como criar uma conta?</AccordionTrigger>
                    <AccordionContent>
                      Clique em "Entrar" no menu superior e depois em "Criar conta". Você precisará fornecer 
                      um e-mail válido e criar uma senha. Após confirmar seu e-mail, você terá acesso completo 
                      ao portal.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6">
                    <AccordionTrigger>Como alterar minha senha?</AccordionTrigger>
                    <AccordionContent>
                      Acesse "Meu Painel" → "Segurança" e clique em "Alterar Senha". Você precisará 
                      informar sua senha atual e a nova senha duas vezes para confirmação.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-7">
                    <AccordionTrigger>Como atualizar meu perfil?</AccordionTrigger>
                    <AccordionContent>
                      Vá para "Meu Painel" → "Perfil" para atualizar seu nome, foto de perfil e outras 
                      informações pessoais. As alterações são salvas automaticamente.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-8">
                    <AccordionTrigger>Posso excluir minha conta?</AccordionTrigger>
                    <AccordionContent>
                      Sim, você pode solicitar a exclusão da sua conta entrando em contato com nosso 
                      suporte através da página de Contato. Todos os seus dados serão removidos 
                      permanentemente de acordo com a LGPD.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Notificações */}
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Gerencie suas notificações push</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-9">
                    <AccordionTrigger>Como ativar notificações push?</AccordionTrigger>
                    <AccordionContent>
                      Acesse "Meu Painel" → "Notificações" e clique em "Ativar Notificações". 
                      Seu navegador solicitará permissão para enviar notificações. Você receberá 
                      alertas de notícias urgentes e breaking news.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-10">
                    <AccordionTrigger>Não estou recebendo notificações</AccordionTrigger>
                    <AccordionContent>
                      Verifique se você concedeu permissão de notificações para o site nas 
                      configurações do seu navegador. Em alguns casos, extensões de privacidade 
                      podem bloquear notificações. Tente desativá-las temporariamente.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-11">
                    <AccordionTrigger>Posso escolher que tipo de notícias receber?</AccordionTrigger>
                    <AccordionContent>
                      Atualmente, as notificações push são enviadas apenas para notícias marcadas 
                      como "Urgentes". No futuro, adicionaremos opções de personalização para 
                      você escolher categorias específicas.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Privacidade */}
            <Card>
              <CardHeader>
                <CardTitle>Privacidade e Segurança</CardTitle>
                <CardDescription>Proteção dos seus dados</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-12">
                    <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
                    <AccordionContent>
                      Sim! Utilizamos criptografia de ponta a ponta para proteger seus dados. 
                      Todas as senhas são armazenadas com hash seguro e não temos acesso a elas. 
                      Seguimos rigorosamente as normas da LGPD (Lei Geral de Proteção de Dados).
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-13">
                    <AccordionTrigger>Vocês compartilham meus dados?</AccordionTrigger>
                    <AccordionContent>
                      Não vendemos ou compartilhamos seus dados pessoais com terceiros para fins 
                      de marketing. Usamos seus dados apenas para melhorar sua experiência no portal 
                      e enviar notificações que você autorizou. Leia nossa Política de Privacidade 
                      para mais detalhes.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-14">
                    <AccordionTrigger>Como são usados os cookies?</AccordionTrigger>
                    <AccordionContent>
                      Utilizamos cookies essenciais para manter você logado e cookies analíticos 
                      para entender como melhorar o site. Você pode gerenciar suas preferências 
                      de cookies através das configurações do seu navegador.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-15">
                    <AccordionTrigger>Como entro em contato com o suporte?</AccordionTrigger>
                    <AccordionContent>
                      Você pode entrar em contato através da nossa página de Contato ou enviando 
                      um e-mail para suporte@conexaonacidade.com.br. Respondemos todas as mensagens 
                      em até 24 horas úteis.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
