// Edge Function for sending invitation emails via Resend Templates
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

    // Send the email via Resend using TEMPLATE
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [payload.to],
      template: {
        id: "invitation",
        variables: {
          INVITER_NAME: payload.inviterName,
          ORG_NAME: payload.orgName,
          ROLE: payload.role,
          INVITE_URL: payload.inviteUrl,
        },
      },
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
