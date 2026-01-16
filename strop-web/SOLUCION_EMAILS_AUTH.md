# 🔴 PROBLEMA: Emails de Confirmación NO se Envían

## 🔍 DIAGNÓSTICO COMPLETO

### Hallazgos
1. ✅ **Auth Hook está configurado correctamente** en Supabase Dashboard
2. ✅ **Edge Function `send-auth-emails` está desplegada** (versión 13)
3. ✅ **Secrets están configurados** (RESEND_API_KEY, SENDER_EMAIL, etc.)
4. ✅ **Templates en Resend están creados** (`confirm-account`, `reset-password`)
5. ❌ **SUPABASE ESTÁ AUTO-CONFIRMANDO EMAILS SIN ENVIARLOS**

### Evidencia del Problema

**Query a la base de datos:**
```sql
SELECT 
  email, 
  created_at, 
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token
FROM auth.users 
WHERE email = 'tonguefake0@gmail.com';
```

**Resultado:**
```json
{
  "email": "tonguefake0@gmail.com",
  "created_at": "2026-01-16 06:18:23",
  "email_confirmed_at": "2026-01-16 06:18:23", // ← Confirmado INMEDIATAMENTE
  "confirmation_sent_at": null,                  // ← NO se envió email
  "confirmation_token": ""                       // ← NO hay token
}
```

**Conclusión:** Supabase está confirmando usuarios automáticamente sin requerir verificación de email, por lo tanto **el Auth Hook nunca se ejecuta**.

---

## ✅ SOLUCIÓN

### Paso 1: Deshabilitar Auto-Confirmación de Emails

Ve a tu proyecto en Supabase Dashboard:

```
https://supabase.com/dashboard/project/splypnvbvqyqotnlxxii/auth/users
```

1. **Authentication** → **Providers** → **Email**
2. Busca la opción **"Confirm email"** o **"Enable email confirmations"**
3. **Marca la casilla** para REQUERIR confirmación de email
4. **DESMARCA** la opción "Auto-confirm emails" si está marcada
5. Guarda los cambios

### Paso 2: Verificar Configuración en Dashboard

**Authentication > Settings:**
- ✅ **Enable Email Confirmations:** ON
- ❌ **Auto Confirm:** OFF  
- ✅ **Email Rate Limit:** Configurado (ej: 60 emails/hora)

### Paso 3: Probar el Flujo Completo

1. **Crea un nuevo usuario:**
   ```
   https://constructora.zentyar.com/register
   ```

2. **Verifica en la base de datos:**
   ```sql
   SELECT 
     email, 
     email_confirmed_at,
     confirmation_sent_at
   FROM auth.users 
   WHERE email = 'nuevo@email.com';
   ```
   
   **Debería mostrar:**
   - `email_confirmed_at`: **NULL** (no confirmado aún)
   - `confirmation_sent_at`: **TIMESTAMP** (email enviado)

3. **Verifica logs de Edge Function:**
   ```bash
   npx supabase functions logs send-auth-emails --project-ref splypnvbvqyqotnlxxii --tail
   ```
   
   **Debería mostrar:**
   ```
   Sending signup email to nuevo@email.com
   Template: confirm-account
   Confirmation URL: https://constructora.zentyar.com/auth/confirm?token_hash=...
   Email sent successfully
   ```

4. **Verifica en Resend Dashboard:**
   - Ve a https://resend.com/emails
   - Confirma que el email aparece como "Delivered"

5. **El usuario recibe el email y hace clic en el link**
   - Redirige a `/auth/confirm?token_hash=...&type=email`
   - El backend confirma el email
   - Redirige a `/onboarding` para crear su organización

---

## 🔧 CONFIGURACIÓN ADICIONAL (Opcional)

### Personalizar Redirect URL

Si quieres que después de confirmar el email vayan directo a onboarding:

En `src/lib/services/auth.service.ts`, línea ~75:

```typescript
async signUp(credentials: SignUpCredentials): Promise<AuthResult<{ user: SupabaseUser | null }>> {
  const { data, error } = await this.client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.fullName,
      },
      emailRedirectTo: credentials.redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding`,
    },
  })
  // ...
}
```

### Configurar Rate Limiting

Para evitar spam en producción:

1. **Authentication** → **Rate Limits**
2. Configura:
   - **Email sends per hour:** 60 (o según tu plan)
   - **SMS sends per hour:** 20
   - **Sign up attempts per hour:** 100

---

## 📊 CHECKLIST DE VALIDACIÓN

Después de aplicar los cambios:

- [ ] Auto-confirm emails está DESHABILITADO en Dashboard
- [ ] Enable email confirmations está HABILITADO
- [ ] Auth Hook "Send Email" está ENABLED
- [ ] Nuevo usuario registrado tiene `email_confirmed_at` = NULL
- [ ] Nuevo usuario registrado tiene `confirmation_sent_at` con timestamp
- [ ] Logs de Edge Function muestran email enviado (status 200)
- [ ] Resend Dashboard muestra email "Delivered"
- [ ] Usuario recibe el email en su bandeja
- [ ] Click en link confirma el email y redirige correctamente
- [ ] Después de confirmar, `email_confirmed_at` tiene timestamp

---

## 🎯 FLUJO CORRECTO ESPERADO

### Registro Normal (Dueño de Organización)

1. Usuario va a `/register`
2. Llena formulario y envía
3. **Backend llama a `supabase.auth.signUp()`**
4. **Supabase detecta nuevo signup**
5. **Supabase llama al Auth Hook** → `send-auth-emails` Edge Function
6. **Edge Function envía email via Resend** con template `confirm-account`
7. Usuario recibe email con link de confirmación
8. Usuario hace clic en link
9. **Redirige a `/auth/confirm?token_hash=XXX&type=email`**
10. Backend confirma el token
11. **Redirige a `/onboarding`** para crear organización
12. Usuario crea su organización
13. **Redirige a `/dashboard`**

### Invitación (Miembro de Organización)

1. Admin invita a usuario desde dashboard
2. **Backend llama a Edge Function `send-invitation`** (NO usa Auth Hook)
3. Usuario recibe email con template `invitation`
4. Usuario hace clic en link → `/register?invite_token=XXX&email=YYY`
5. Sigue flujo similar pero sin crear organización

---

## 🚨 ERRORES COMUNES

### "Email already registered"
- **Causa:** Usuario ya existe en `auth.users`
- **Solución:** Usar email diferente o eliminar usuario existente

### Email no llega después de cambios
- **Causa:** Cache o delay en Supabase
- **Solución:** 
  1. Espera 2-3 minutos
  2. Verifica spam/junk folder
  3. Revisa logs de Edge Function
  4. Verifica Resend Dashboard

### Usuarios antiguos ya confirmados
- **Causa:** Fueron auto-confirmados antes del cambio
- **Solución:** Normal, solo afecta nuevos usuarios después del cambio

---

## 📞 SOPORTE

**Documentación oficial:**
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- [Email Confirmations](https://supabase.com/docs/guides/auth/auth-email)
- [Resend Templates](https://resend.com/docs/send-with-templates)

**Si el problema persiste:**
1. Revisa logs detallados de la Edge Function
2. Verifica configuración en Resend Dashboard
3. Contacta a soporte de Supabase con project ID

---

**Última actualización:** 16 de Enero, 2026
**Estado:** Pendiente de aplicar configuración en Dashboard
