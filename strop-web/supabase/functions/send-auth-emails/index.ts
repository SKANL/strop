// Supabase Auth Hook for sending custom emails via Resend Templates
// Based on: https://github.com/resend/supabase-auth-hooks-with-resend-templates
import "@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "standardwebhooks";
import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");

const resend = new Resend(RESEND_API_KEY);

// Mapping of email action types to Resend template IDs
// These templates must be created and PUBLISHED in your Resend dashboard
const EMAIL_TEMPLATES: Record<string, string> = {
  signup: "confirm-account",
  recovery: "reset-password",
};

// Types for the webhook payload
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

  if (!RESEND_API_KEY || !HOOK_SECRET || !SENDER_EMAIL) {
    console.error("Missing required environment variables.");
    return new Response("Internal Server Error: Configuration missing", {
      status: 500,
    });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", ""));

  try {
    // Verify the webhook signature and extract payload
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as unknown as WebhookPayload;

    // Get the template ID for this action
    const templateId = EMAIL_TEMPLATES[email_action_type];

    if (!templateId) {
      console.warn(`No template found for action type: ${email_action_type}`);
      throw new Error(`Unsupported email action type: ${email_action_type}`);
    }

    // Construct the confirmation URL
    const queryParams = new URLSearchParams({
      token_hash,
      type: email_action_type,
    });

    // Determine next path from redirect_to
    if (redirect_to) {
      try {
        const nextPath = new URL(redirect_to).pathname;
        queryParams.append("next", nextPath);
      } catch {
        queryParams.append("next", redirect_to);
      }
    }

    // Use the origin from redirect_to if available
    let baseUrl = site_url;
    if (redirect_to && redirect_to.startsWith("http")) {
      try {
        const url = new URL(redirect_to);
        baseUrl = url.origin;
      } catch {
        // invalid url, stick to site_url
      }
    }

    const confirmationUrl = `${baseUrl}/auth/confirm?${queryParams.toString()}`;

    console.log(`Sending ${email_action_type} email to ${user.email}`);
    console.log(`Template: ${templateId}`);
    console.log(`Confirmation URL: ${confirmationUrl}`);

    // Send the email via Resend using TEMPLATE
    const { error } = await resend.emails.send({
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
      console.error("Resend error:", JSON.stringify(error));
      throw error;
    }

    console.log(`Email sent successfully for ${email_action_type} to ${user.email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing email webhook:", error);

    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
