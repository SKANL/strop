// Supabase Auth Hook for sending custom emails via Resend Templates
import "@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "standardwebhooks";
import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");

const resend = new Resend(RESEND_API_KEY);

// Map email action types to Resend template IDs (as shown in your dashboard)
const EMAIL_TEMPLATES: Record<string, string> = {
  signup: "confirm-account",
  recovery: "reset-password",
};

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

    // Get template ID
    const templateId = EMAIL_TEMPLATES[email_action_type];
    if (!templateId) {
      console.error(`No template configured for action: ${email_action_type}`);
      return new Response(JSON.stringify({ error: `Unknown action: ${email_action_type}` }), { status: 400 });
    }

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

    // Send via Resend using TEMPLATE
    console.log("Sending email with template:", templateId);
    
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [user.email],
      template: {
        id: templateId,
        variables: {
          USER_EMAIL: user.email,
          CONFIRMATION_URL: confirmationUrl,
        },
      },
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
