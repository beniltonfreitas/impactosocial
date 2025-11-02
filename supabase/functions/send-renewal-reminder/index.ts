import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RenewalReminderRequest {
  email: string;
  name: string;
  plan: string;
  amount: number;
  renewalDate: string;
  daysUntilRenewal: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, plan, amount, renewalDate, daysUntilRenewal }: RenewalReminderRequest = await req.json();

    console.log(`Sending renewal reminder to ${email} - ${daysUntilRenewal} days until renewal`);

    const emailResponse = await resend.emails.send({
      from: "Impacto Social Cotia <onboarding@resend.dev>",
      to: [email],
      subject: `Sua assinatura Premium renova em ${daysUntilRenewal} dias ⏰`,
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
              .info-box { background: #faf5ff; border-left: 4px solid #8B5CF6; padding: 15px; margin: 20px 0; }
              .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
              h1 { margin: 0; font-size: 28px; }
              h2 { color: #8B5CF6; font-size: 20px; }
              .highlight { font-size: 24px; font-weight: bold; color: #8B5CF6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Lembrete de Renovação</h1>
              </div>
              <div class="content">
                <h2>Olá, ${name}!</h2>
                <p>Este é um lembrete amigável de que sua assinatura Premium será renovada em breve.</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">Detalhes da Renovação</h3>
                  <p><strong>Plano:</strong> ${plan}</p>
                  <p><strong>Valor:</strong> R$ ${(amount / 100).toFixed(2)}</p>
                  <p><strong>Data de Renovação:</strong> <span class="highlight">${new Date(renewalDate).toLocaleDateString('pt-BR')}</span></p>
                  <p><strong>Faltam:</strong> <span class="highlight">${daysUntilRenewal} dias</span></p>
                </div>

                <h2>Continue aproveitando:</h2>
                <ul>
                  <li>📰 Notícias Premium sem limitações</li>
                  <li>🤝 Comunidade Illúmina exclusiva</li>
                  <li>🎯 Desafios e pontuações especiais</li>
                  <li>♿ Conteúdo inclusivo da Rede PcD</li>
                  <li>🎓 Cursos e capacitações</li>
                </ul>

                <div class="warning-box">
                  <p style="margin: 0;"><strong>⚠️ Importante:</strong> Certifique-se de que seu método de pagamento está atualizado para evitar interrupções no serviço.</p>
                </div>

                <div style="text-align: center;">
                  <a href="https://beniltonfreitas.com.br/dashboard?tab=assinatura" class="button">Gerenciar Assinatura</a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666;">
                  Se desejar cancelar sua assinatura, você pode fazer isso a qualquer momento através do seu painel. O cancelamento entrará em vigor após o término do período atual.
                </p>
              </div>
              <div class="footer">
                <p>Impacto Social Cotia - Obrigado por fazer parte da transformação!</p>
                <p>📧 contato@beniltonfreitas.com.br | 🌐 beniltonfreitas.com.br</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Renewal reminder email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending renewal reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
