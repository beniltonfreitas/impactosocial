import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Política de Privacidade"
        description="Política de privacidade e proteção de dados do Conexão na Cidade - LGPD."
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary via-primary/90 to-accent py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 flex items-center gap-3">
                <Shield className="h-10 w-10" />
                Política de Privacidade
              </h1>
              <p className="text-lg text-primary-foreground/90">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Dados Coletados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Coletamos os seguintes tipos de dados:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Dados de cadastro:</strong> Nome, email, senha (criptografada)</li>
                  <li><strong>Dados de navegação:</strong> Páginas visitadas, artigos lidos, tempo de permanência</li>
                  <li><strong>Cookies:</strong> Preferências de região, sessão de login, análise de uso</li>
                  <li><strong>Comentários:</strong> Conteúdo publicado em artigos</li>
                  <li><strong>Notificações Push:</strong> Token de dispositivo (se autorizado)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Uso dos Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Utilizamos seus dados para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Personalizar sua experiência com notícias regionais</li>
                  <li>Permitir interação através de comentários</li>
                  <li>Enviar notificações de notícias importantes (se autorizado)</li>
                  <li>Melhorar nossos serviços através de análises agregadas</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Compartilhamento de Dados</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Não vendemos seus dados pessoais. Podemos compartilhá-los apenas com:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Provedores de serviços essenciais (hospedagem, analytics)</li>
                  <li>Autoridades legais, quando exigido por lei</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Seus Direitos (LGPD)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos ou desatualizados</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Revogar consentimento de tratamento</li>
                  <li>Solicitar portabilidade dos dados</li>
                </ul>
                <p className="mt-4">
                  Para exercer seus direitos, entre em contato através do email:{" "}
                  <a href="mailto:privacidade@conexaonacidade.com.br" className="text-primary hover:underline">
                    privacidade@conexaonacidade.com.br
                  </a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Cookies</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Utilizamos cookies para melhorar sua experiência. Você pode gerenciar cookies
                  através das configurações do seu navegador. A desativação pode afetar
                  funcionalidades do site.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Segurança</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Implementamos medidas técnicas e organizacionais para proteger seus dados,
                  incluindo criptografia, acesso restrito e monitoramento constante.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Alterações</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Esta política pode ser atualizada periodicamente. Notificaremos sobre
                  mudanças significativas através do email cadastrado ou avisos no site.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Contato</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Para dúvidas sobre privacidade ou exercer seus direitos, entre em contato:
                </p>
                <ul className="list-none space-y-2 mt-4">
                  <li><strong>Email:</strong> privacidade@conexaonacidade.com.br</li>
                  <li><strong>DPO:</strong> Encarregado de Proteção de Dados</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
