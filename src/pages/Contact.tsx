import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  subject: z.string().min(1, "Selecione um assunto"),
  message: z.string().min(20, "Mensagem muito curta (mín. 20 caracteres)").max(1000, "Mensagem muito longa (máx. 1000 caracteres)"),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      // Validação
      contactSchema.parse(formData);

      // Enviar para edge function
      const { error } = await supabase.functions.invoke('contact-form', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Obrigado pelo contato. Responderemos em breve.",
      });

      // Limpar formulário
      setFormData({ name: "", email: "", subject: "", message: "" });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Contato"
        description="Entre em contato com a equipe do Conexão na Cidade. Sugestões, dúvidas ou parcerias."
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary via-primary/90 to-accent py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                Entre em Contato
              </h1>
              <p className="text-lg text-primary-foreground/90">
                Estamos aqui para ouvir você. Envie sua mensagem e responderemos em breve.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Redação:</p>
                  <a href="mailto:redacao@conexaonacidade.com.br" className="text-primary hover:underline">
                    redacao@conexaonacidade.com.br
                  </a>
                  <p className="text-sm text-muted-foreground mt-4 mb-2">Comercial:</p>
                  <a href="mailto:comercial@conexaonacidade.com.br" className="text-primary hover:underline">
                    comercial@conexaonacidade.com.br
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Telefone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">(11) 9999-9999</p>
                  <p className="text-sm text-muted-foreground mt-2">Segunda a sexta, 9h às 18h</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Avenida Paulista, 1000<br />
                    São Paulo - SP<br />
                    CEP 01310-100
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Envie sua mensagem</CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e entraremos em contato.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">Assunto *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o assunto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geral">Geral</SelectItem>
                          <SelectItem value="publicidade">Publicidade</SelectItem>
                          <SelectItem value="sugestao">Sugestão de Pauta</SelectItem>
                          <SelectItem value="denuncia">Denúncia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Escreva sua mensagem aqui..."
                        rows={6}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.message.length}/1000 caracteres
                      </p>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? "Enviando..." : "Enviar Mensagem"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
