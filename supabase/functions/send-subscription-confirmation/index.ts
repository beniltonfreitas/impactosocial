import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionConfirmationRequest {
  email: string;
  name: string;
  plan: string;
  amount: number;
  nextBillingDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, plan, amount, nextBillingDate }: SubscriptionConfirmationRequest = await req.json();

    console.log(`Sending subscription confirmation to ${email} for plan ${plan}`);

    const emailResponse = await resend.emails.send({
      from: "Impacto Social Cotia <onboarding@resend.dev>",
      to: [email],
      subject: "Assinatura Confirmada - Bem-vindo ao Premium! 🌟",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #8B5CF6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
              .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .info-box { background: #f0fdf4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
              h1 { margin: 0; font-size: 28px; }
              h2 { color: #10B981; font-size: 20px; }
              .price { font-size: 36px; font-weight: bold; color: #10B981; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Assinatura Confirmada!</h1>
              </div>
              <div class="content">
                <h2>Parabéns, ${name}!</h2>
                <p>Sua assinatura <strong>${plan}</strong> foi confirmada com sucesso. Agora você tem acesso total aos benefícios Premium!</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">Detalhes da Assinatura</h3>
                  <p><strong>Plano:</strong> ${plan}</p>
                  <p><strong>Valor:</strong> <span class="price">R$ ${(amount / 100).toFixed(2)}</span></p>
                  <p><strong>Próxima cobrança:</strong> ${new Date(nextBillingDate).toLocaleDateString('pt-BR')}</p>
                </div>

                <h2>Benefícios Inclusos:</h2>
                <ul>
                  <li>✅ Acesso ilimitado a todas as notícias Premium</li>
                  <li>✅ Comunidade Illúmina exclusiva</li>
                  <li>✅ Desafio Social com recompensas</li>
                  <li>✅ Conteúdo exclusivo da Rede PcD</li>
                  <li>✅ Cursos e capacitações gratuitas</li>
                  <li>✅ Desconto em produtos e serviços parceiros</li>
                  <li>✅ Sem anúncios e experiência prioritária</li>
                </ul>

                <div style="text-align: center;">
                  <a href="https://beniltonfreitas.com.br/dashboard" class="button">Explorar Benefícios Premium</a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666;">
                  Você pode cancelar sua assinatura a qualquer momento através do seu painel de usuário.
                </p>
              </div>
              <div class="footer">
                <p>Impacto Social Cotia - Obrigado por apoiar a transformação social!</p>
                <p>📧 contato@beniltonfreitas.com.br | 🌐 beniltonfreitas.com.br</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Subscription confirmation email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending subscription confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
