/**
 * Accept Invitation Page
 * 
 * Handles invitation token validation and acceptance.
 * Shows different UI depending on user authentication state.
 * 
 * IMPORTANT: The invitation is ONLY marked as accepted when a user
 * with the EXACT matching email successfully accepts. Visiting the
 * page does NOT invalidate or delete the invitation.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, UserPlus, AlertCircle, LogOut, Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aceptar Invitación',
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitationPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createServerComponentClient()

  // Get current user (if logged in)
  const { data: { user } } = await supabase.auth.getUser()

  // Validate invitation - just check if it exists, not expired, and not accepted
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organization:organizations(id, name, logo_url),
      inviter:users!invitations_invited_by_fkey(full_name)
    `)
    .eq('invitation_token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  // Invalid or expired invitation
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitación no válida</CardTitle>
            <CardDescription>
              Esta invitación no existe, ya fue utilizada o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is logged in
  if (user) {
    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      // WRONG EMAIL - Show friendly message with options
      // The invitation is NOT invalidated - user can come back later
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <Mail className="h-6 w-6 text-amber-500" />
              </div>
              <CardTitle>Cuenta diferente</CardTitle>
              <CardDescription className="space-y-2 text-left mt-4">
                <p>Esta invitación es para:</p>
                <p className="font-mono bg-muted px-3 py-2 rounded text-sm text-center">
                  {invitation.email}
                </p>
                <p className="pt-2">Actualmente estás conectado como:</p>
                <p className="font-mono bg-muted px-3 py-2 rounded text-sm text-center">
                  {user.email}
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Para aceptar esta invitación, necesitas usar la cuenta correcta.
              </p>
              <Button className="w-full" asChild>
                <Link href={`/api/auth/signout?redirect=/invite/${token}`}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión y continuar
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">
                  Volver al dashboard
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                El enlace seguirá activo. Puedes volver cuando quieras.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    // CORRECT EMAIL - Accept invitation
    // Only NOW do we mark it as accepted
    const { error: acceptError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (!acceptError) {
      // Add user to organization
      await supabase
        .from('users')
        .update({ 
          current_organization_id: invitation.organization_id,
          role: invitation.role 
        })
        .eq('id', user.id)

      // Also add to organization_members if needed
      await supabase
        .from('organization_members')
        .upsert({
          user_id: user.id,
          organization_id: invitation.organization_id,
          role: invitation.role,
        }, { onConflict: 'user_id,organization_id' })
    }

    redirect('/dashboard?welcome=true')
  }

  // User NOT logged in - Show options to register or login
  // The invitation is NOT touched - just showing options
  const loginUrl = `/login?redirect=/invite/${token}`
  const registerUrl = `/register?invite_token=${token}&email=${encodeURIComponent(invitation.email)}`

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {invitation.organization?.logo_url ? (
              <img 
                src={invitation.organization.logo_url} 
                alt={invitation.organization.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle>Te han invitado</CardTitle>
          <CardDescription className="space-y-2 mt-4">
            <p>
              <strong>{invitation.inviter?.full_name || 'Un administrador'}</strong> te invitó a unirte a{' '}
              <strong>{invitation.organization?.name}</strong>
            </p>
            <p className="text-sm">
              Rol: <span className="font-medium">{invitation.role}</span>
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Invitación para:</p>
            <p className="font-mono text-sm">{invitation.email}</p>
          </div>
          
          <Button className="w-full" asChild>
            <Link href={registerUrl}>
              <UserPlus className="mr-2 h-4 w-4" />
              Crear cuenta
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={loginUrl}>Ya tengo cuenta</Link>
          </Button>
          
          <p className="text-xs text-muted-foreground text-center pt-2">
            Este enlace expira en 7 días. Puedes volver cuando quieras.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
