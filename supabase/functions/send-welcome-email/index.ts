import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Impacto Social Cotia <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo ao Impacto Social Cotia! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #10B981 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
              .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              h1 { margin: 0; font-size: 28px; }
              h2 { color: #8B5CF6; font-size: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bem-vindo, ${name}! 🎉</h1>
              </div>
              <div class="content">
                <h2>É ótimo ter você conosco!</h2>
                <p>Obrigado por se juntar ao <strong>Impacto Social Cotia</strong>, sua plataforma de notícias, inclusão e transformação social.</p>
                
                <h2>O que você pode fazer agora:</h2>
                <ul>
                  <li>📰 Acompanhe as últimas notícias de Cotia e região</li>
                  <li>🤝 Participe da Comunidade Illúmina Premium</li>
                  <li>🎯 Complete desafios sociais e ganhe pontos</li>
                  <li>♿ Explore a Rede PcD com conteúdo inclusivo</li>
                  <li>📚 Acesse cursos e materiais exclusivos</li>
                </ul>

                <div style="text-align: center;">
                  <a href="https://beniltonfreitas.com.br/dashboard" class="button">Acessar Meu Painel</a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <strong>Dica:</strong> Complete seu perfil para desbloquear recursos exclusivos e participar da comunidade!
                </p>
              </div>
              <div class="footer">
                <p>Impacto Social Cotia - Transformando Cotia através da informação e inclusão</p>
                <p>📧 contato@beniltonfreitas.com.br | 🌐 beniltonfreitas.com.br</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
