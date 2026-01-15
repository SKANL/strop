// Edge Function for sending invitation emails via Resend
import "@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationPayload {
  to: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}

// Generate HTML email content inline
function generateInvitationHtml(payload: InvitationPayload): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitación a Equipo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background: #09090b; padding: 40px 30px; text-align: center;">
      <div style="color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; letter-spacing: -1px;">STROP</div>
    </div>
    <div style="padding: 40px 30px; color: #18181b; text-align: center;">
      <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 10px; color: #09090b; letter-spacing: -0.5px;">Te han invitado a colaborar</h1>
      <p style="font-size: 18px; color: #52525b; margin: 0 0 30px; font-weight: 400;">
        <strong>${payload.inviterName}</strong> te ha invitado a unirte a <strong>${payload.orgName}</strong>
      </p>
      
      <div style="margin-bottom: 30px;">
        <span style="background: #f4f4f5; padding: 4px 12px; border-radius: 99px; font-size: 14px; font-weight: 500; color: #18181b; border: 1px solid #e4e4e7;">Rol: ${payload.role}</span>
      </div>

      <div style="margin: 30px 0;">
        <a href="${payload.inviteUrl}" style="background-color: #09090b; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Aceptar Invitación</a>
      </div>

      <p style="font-size: 14px; color: #71717a; margin-top: 30px;">
        Este enlace expirará en 7 días.<br>
        Si no esperabas esta invitación, puedes ignorar este correo.
      </p>
    </div>
    <div style="padding: 30px; text-align: center; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 13px; color: #a1a1aa;">
      <p>© 2026 Strop Inc.</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY || !SENDER_EMAIL) {
    console.error("Missing required environment variables:", { 
      hasApiKey: !!RESEND_API_KEY, 
      hasSenderEmail: !!SENDER_EMAIL 
    });
    return new Response(
      JSON.stringify({ error: "Configuration missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: InvitationPayload = await req.json();
    console.log("Sending invitation to:", payload.to);

    // Generate HTML content
    const htmlContent = generateInvitationHtml(payload);

    // Send the email via Resend with inline HTML (not template)
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [payload.to],
      subject: `${payload.inviterName} te invitó a unirte a ${payload.orgName}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      throw error;
    }

    console.log(`Invitation email sent successfully to ${payload.to}`, data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending invitation email:", error);

    return new Response(
      JSON.stringify({
        error: { message: error instanceof Error ? error.message : "Unknown error" },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
