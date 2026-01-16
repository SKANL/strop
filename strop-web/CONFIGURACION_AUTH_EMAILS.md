# 📧 Configuración de Auth Emails - Strop

## 🔴 PROBLEMA IDENTIFICADO

Los correos de autenticación (signup, recovery) **NO están llegando** a los usuarios.

### Diagnóstico
1. ✅ Edge Function `send-auth-emails` está desplegada (versión 13)
2. ❌ **La función está fallando con HTTP 500** en todos los intentos
3. ✅ Secrets están configurados correctamente
4. ❌ **Falta configurar el Auth Hook en Supabase Dashboard**

### Logs de Error
```
POST | 500 | /functions/v1/send-auth-emails
Múltiples fallos desde versión 4 hasta versión 13
```

---

## ✅ SOLUCIÓN PASO A PASO

### 1. Configurar Auth Hook en Supabase Dashboard

**IMPORTANTE:** Los Auth Hooks **NO se configuran en código**, se configuran en el Dashboard de Supabase.

#### Pasos:
1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard/project/splypnvbvqyqotnlxxii
2. Navega a **Authentication** → **Hooks** (en el menú lateral)
3. Haz clic en **"Enable Send Email Hook"**
4. Configura:
   - **Hook Type:** `Send Email`
   - **HTTP Method:** `POST`
   - **Hook URL:** `https://splypnvbvqyqotnlxxii.supabase.co/functions/v1/send-auth-emails`
   - **Authorization Header:** `Bearer {SEND_EMAIL_HOOK_SECRET}`
   - **Events:** Marca las siguientes casillas:
     - ✅ Signup confirmation
     - ✅ Password recovery
     - ✅ Email change confirmation (opcional)
     - ✅ Magic link (opcional)

5. Guarda los cambios

### 2. Verificar Secrets de Edge Function

Los secrets ya están configurados correctamente:
```bash
npx supabase secrets list --project-ref splypnvbvqyqotnlxxii
```

Secrets requeridos:
- ✅ `RESEND_API_KEY` - API key de Resend
- ✅ `SENDER_EMAIL` - Email verificado en Resend
- ✅ `SEND_EMAIL_HOOK_SECRET` - Secret para validar webhook
- ✅ `SUPABASE_URL` - URL del proyecto
- ✅ `SUPABASE_ANON_KEY` - Anon key del proyecto

### 3. Verificar Templates en Resend

Ve a tu dashboard de Resend: https://resend.com/emails

Necesitas tener estos templates **PUBLICADOS**:
1. **Template ID:** `confirm-account`
   - Variables: `USER_EMAIL`, `CONFIRMATION_URL`
   - Uso: Confirmación de signup

2. **Template ID:** `reset-password`
   - Variables: `USER_EMAIL`, `CONFIRMATION_URL`
   - Uso: Recuperación de contraseña

Si los templates no existen o no están publicados, créalos en Resend con estos IDs exactos.

### 4. Probar el Flujo

Una vez configurado:

1. **Registra un nuevo usuario:**
   ```
   https://constructora.zentyar.com/onboarding
   ```

2. **Verifica en Logs de Edge Function:**
   ```bash
   npx supabase functions logs send-auth-emails --project-ref splypnvbvqyqotnlxxii
   ```

3. **Debe aparecer:**
   ```
   Sending signup email to usuario@email.com
   Template: confirm-account
   Confirmation URL: https://constructora.zentyar.com/auth/confirm?token_hash=...
   Email sent successfully for signup to usuario@email.com
   ```

4. **Verifica en Resend Dashboard:**
   - Ve a "Emails" y confirma que el email se envió

---

## 🔍 DEBUGGING

### Ver logs en tiempo real
```bash
# Logs de Edge Function
npx supabase functions logs send-auth-emails --project-ref splypnvbvqyqotnlxxii --tail

# Logs de Auth
npx supabase inspect db logs --db-url="postgresql://..." --schema=auth
```

### Errores Comunes

#### Error 500: "Configuration missing"
- **Causa:** Faltan variables de entorno
- **Solución:** Verifica que todos los secrets estén configurados

#### Error 500: "Webhook signature verification failed"
- **Causa:** El secret del hook no coincide
- **Solución:** Regenera el secret y actualízalo en ambos lados

#### Error: "Template not found"
- **Causa:** El template no existe o no está publicado en Resend
- **Solución:** Publica los templates en Resend Dashboard

#### Emails no llegan pero función retorna 200
- **Causa:** Template ID incorrecto o variables mal mapeadas
- **Solución:** Verifica el mapping en `index.ts` línea 14-17

---

## 📝 ARCHIVOS RELACIONADOS

### Edge Function
- **Archivo:** `supabase/functions/send-auth-emails/index.ts`
- **Config:** `supabase/config.toml`
- **Deno config:** `supabase/functions/send-auth-emails/deno.json`

### Frontend
- **Onboarding:** `src/app/onboarding/page.tsx`
- **Auth Confirm:** `src/app/auth/confirm/route.ts`

---

## 🎯 CHECKLIST DE VALIDACIÓN

Antes de dar por solucionado:

- [ ] Auth Hook configurado en Supabase Dashboard
- [ ] Hook URL apunta a la función correcta
- [ ] Authorization header configurado con el secret
- [ ] Templates creados y PUBLICADOS en Resend
- [ ] Template IDs coinciden con el código (`confirm-account`, `reset-password`)
- [ ] Variables de template mapeadas correctamente
- [ ] Probado con registro real de usuario
- [ ] Email de confirmación recibido
- [ ] Logs muestran status 200
- [ ] Resend Dashboard muestra email enviado

---

## 🚀 PRÓXIMOS PASOS

Una vez funcionando:

1. **Personalizar templates en Resend:**
   - Agregar logo de Strop
   - Mejorar diseño
   - Agregar información de la organización

2. **Agregar más tipos de email:**
   - Invitación a organización (ya existe: `send-invitation`)
   - Cambio de email
   - Magic link

3. **Configurar rate limiting:**
   - Evitar spam
   - Proteger la función

4. **Monitoreo:**
   - Configurar alertas en Resend
   - Dashboard de emails enviados

---

## 📞 SOPORTE

Si persisten los problemas:
1. Revisa los logs de la Edge Function
2. Verifica en Resend Dashboard si hay errores
3. Contacta a soporte de Supabase si el hook no se activa
4. Revisa la documentación oficial: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook

**Última actualización:** 16 de Enero, 2026
