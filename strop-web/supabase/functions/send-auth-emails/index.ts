// Supabase Auth Hook for sending custom emails via Resend (INLINE HTML - PROVEN TO WORK)
import "@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "standardwebhooks";
import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");

const resend = new Resend(RESEND_API_KEY);

interface WebhookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

// Generate HTML email content inline (NO templates - they don't work reliably with Resend SDK)
function generateEmailHtml(actionType: string, confirmationUrl: string, userEmail: string): { subject: string; html: string } {
  const containerStyles = `max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7;`;
  const headerStyles = `background: #09090b; padding: 30px; text-align: center;`;
  const contentStyles = `padding: 40px 30px; color: #18181b; text-align: center;`;
  const buttonStyles = `background-color: #09090b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 20px;`;
  const footerStyles = `padding: 30px; text-align: center; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 13px; color: #a1a1aa;`;

  if (actionType === 'signup') {
    return {
      subject: 'Confirma tu cuenta en Strop',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="${containerStyles}">
            <div style="${headerStyles}"><div style="color: #ffffff; font-size: 24px; font-weight: bold;">STROP</div></div>
            <div style="${contentStyles}">
              <h1 style="font-size: 20px; margin-bottom: 20px;">Confirma tu correo electrónico</h1>
              <p style="color: #52525b; margin-bottom: 30px;">Hola, gracias por registrarte en Strop. Para comenzar, por favor confirma tu dirección de correo.</p>
              <a href="${confirmationUrl}" style="${buttonStyles}">Confirmar Cuenta</a>
            </div>
            <div style="${footerStyles}"><p>© 2026 Strop Inc.</p></div>
          </div>
        </body></html>`
    };
  } else if (actionType === 'recovery') {
    return {
      subject: 'Restablecer contraseña - Strop',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="${containerStyles}">
            <div style="${headerStyles}"><div style="color: #ffffff; font-size: 24px; font-weight: bold;">STROP</div></div>
            <div style="${contentStyles}">
              <h1 style="font-size: 20px; margin-bottom: 20px;">Restablecer Contraseña</h1>
              <p style="color: #52525b; margin-bottom: 30px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta: ${userEmail}.</p>
              <a href="${confirmationUrl}" style="${buttonStyles}">Restablecer Contraseña</a>
              <p style="font-size: 13px; color: #71717a; margin-top: 30px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
            </div>
            <div style="${footerStyles}"><p>© 2026 Strop Inc.</p></div>
          </div>
        </body></html>`
    };
  } else {
    return {
      subject: 'Notificación de Strop',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="${containerStyles}">
            <div style="${contentStyles}">
              <p>Haz clic abajo para continuar:</p>
              <a href="${confirmationUrl}" style="${buttonStyles}">Continuar</a>
            </div>
          </div>
        </body></html>`
    };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  console.log("Received auth email request");

  if (!RESEND_API_KEY || !HOOK_SECRET || !SENDER_EMAIL) {
    console.error("Missing configuration", { 
      hasApiKey: !!RESEND_API_KEY, 
      hasHookSecret: !!HOOK_SECRET, 
      hasSenderEmail: !!SENDER_EMAIL 
    });
    return new Response(JSON.stringify({ error: "Configuration missing" }), { status: 500 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", ""));

  try {
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as unknown as WebhookPayload;

    console.log(`Processing ${email_action_type} for ${user.email}`);

    // Build the confirmation URL
    const queryParams = new URLSearchParams({
      token_hash,
      type: email_action_type,
    });

    // Determine next path from redirect_to
    let nextPath = '/dashboard';
    if (redirect_to) {
      try {
        const urlObj = new URL(redirect_to);
        if (urlObj.pathname.startsWith('/invite/')) {
          nextPath = urlObj.pathname + urlObj.search;
        } else {
          nextPath = urlObj.pathname;
        }
      } catch {
        nextPath = redirect_to;
      }
    }
    queryParams.append("next", nextPath);

    const confirmationUrl = `${site_url}/auth/confirm?${queryParams.toString()}`;
    console.log("Generated confirmation URL:", confirmationUrl);

    // Generate HTML content (NO TEMPLATES - they don't work!)
    const { subject, html } = generateEmailHtml(email_action_type, confirmationUrl, user.email);

    // Send via Resend with inline HTML
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [user.email],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend API Error:", JSON.stringify(error));
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing email webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
