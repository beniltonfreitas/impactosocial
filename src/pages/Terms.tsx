import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Termos de Uso"
        description="Termos de uso e condições de utilização do Conexão na Cidade."
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary via-primary/90 to-accent py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 flex items-center gap-3">
                <FileText className="h-10 w-10" />
                Termos de Uso
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
                <CardTitle>1. Aceitação dos Termos</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Ao acessar e usar o portal Conexão na Cidade, você concorda com estes termos de uso.
                  Se não concordar, por favor, não utilize nossos serviços.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Uso do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Você concorda em:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Usar o site apenas para fins legais</li>
                  <li>Não tentar acessar áreas restritas sem autorização</li>
                  <li>Não publicar conteúdo ofensivo, difamatório ou ilegal</li>
                  <li>Não prejudicar o funcionamento do site</li>
                  <li>Respeitar os direitos autorais e propriedade intelectual</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Cadastro e Conta</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Para acessar recursos como comentários e assinaturas, é necessário criar uma conta.
                  Você é responsável por manter a confidencialidade de suas credenciais e por todas
                  as atividades realizadas com sua conta.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Conteúdo Gerado por Usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Ao publicar comentários ou outro conteúdo:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Você mantém os direitos sobre seu conteúdo</li>
                  <li>Você concede ao Conexão na Cidade licença para exibir e distribuir o conteúdo</li>
                  <li>Você declara que tem direito de publicar o conteúdo</li>
                  <li>Reservamo-nos o direito de remover conteúdo inadequado</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Propriedade Intelectual</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Todo o conteúdo do site (textos, imagens, logotipos, design) é protegido por
                  direitos autorais e pertence ao Conexão na Cidade ou seus licenciadores.
                  É proibida a reprodução sem autorização expressa.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Assinaturas Premium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Para assinaturas pagas:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Renovação automática mensal</li>
                  <li>Cancelamento a qualquer momento</li>
                  <li>Acesso imediato aos benefícios após pagamento confirmado</li>
                  <li>Não há reembolso proporcional em caso de cancelamento</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Limitação de Responsabilidade</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  O Conexão na Cidade não se responsabiliza por:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Interrupções ou falhas no serviço</li>
                  <li>Conteúdo de terceiros ou links externos</li>
                  <li>Danos diretos ou indiretos decorrentes do uso do site</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Moderação</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Reservamo-nos o direito de moderar, editar ou remover comentários que violem
                  estes termos. Usuários que descumprirem as regras podem ter suas contas suspensas
                  ou banidas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Alterações nos Termos</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Podemos atualizar estes termos periodicamente. O uso continuado do site após
                  alterações constitui aceitação dos novos termos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Lei Aplicável</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Estes termos são regidos pelas leis brasileiras. Foro da comarca de São Paulo/SP
                  para resolução de controvérsias.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contato</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Para dúvidas sobre estes termos:
                </p>
                <p className="mt-4">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:juridico@conexaonacidade.com.br" className="text-primary hover:underline">
                    juridico@conexaonacidade.com.br
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
