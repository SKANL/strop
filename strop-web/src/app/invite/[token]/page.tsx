/**
 * Accept Invitation Page
 * 
 * Handles invitation token validation and acceptance.
 * Shows different UI depending on user authentication state.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, UserPlus, AlertCircle } from 'lucide-react'
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

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Validate invitation
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitación inválida</CardTitle>
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

  // User is logged in - can accept directly
  if (user) {
    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Email incorrecto</CardTitle>
              <CardDescription>
                Esta invitación es para <strong>{invitation.email}</strong>, pero estás conectado como <strong>{user.email}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/api/auth/signout">Cerrar sesión y continuar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Accept invitation automatically
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
    }

    redirect('/dashboard?welcome=true')
  }

  // User not logged in - show options
  const loginUrl = `/login?redirect=/invite/${token}`
  const registerUrl = `/register?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`

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
          <CardTitle>Te han invitado a unirte</CardTitle>
          <CardDescription className="space-y-2">
            <p>
              <strong>{invitation.inviter?.full_name || 'Un administrador'}</strong> te ha invitado a unirte a{' '}
              <strong>{invitation.organization?.name}</strong> como <strong>{invitation.role}</strong>.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" asChild>
            <Link href={registerUrl}>
              <UserPlus className="mr-2 h-4 w-4" />
              Crear cuenta
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={loginUrl}>Ya tengo cuenta</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
