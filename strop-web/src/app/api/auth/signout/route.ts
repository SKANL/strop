import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function doSignOut(redirectTo?: string) {
  const supabase = await createRouteHandlerClient();
  await supabase.auth.signOut();

  const destination = redirectTo ?? '/login';
  return NextResponse.redirect(new URL(destination, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}

export async function POST(request: Request) {
  // Allow form POSTs
  try {
    const form = await request.formData();
    const redirectTo = form.get('redirect') as string | null;
    return doSignOut(redirectTo ?? undefined);
  } catch (err) {
    return doSignOut();
  }
}

export async function GET(request: Request) {
  // Support direct links to /api/auth/signout (some views use Link)
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirect') ?? undefined;
  return doSignOut(redirectTo);
}
