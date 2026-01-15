# 🕵️ Guía de Verificación Manual (Fase 3)

Esta guía te permite validar las funcionalidades de **Gestión de Incidencias**: Detalles, Comentarios y Cierre.

---

## 🛑 1. Prerrequisitos

1.  **Backend Actualizado**: Asegúrate de haber ejecutado `04_incident_management_phase3.sql`.
    *   Debe existir la tabla `comments`.
    *   Deben existir los RPCs: `add_incident_comment`, `close_incident`, `get_incident_comments`.

---

## 🚀 2. Ejecución con Logs Mejorados

Ejecuta la app y verifica la consola. Ahora verás logs estructurados:

```bash
flutter run
```

Busca prefijos: `🐛 RPC:` para seguimiento de llamadas a base de datos.

---

## 🧪 3. Verificación de Flujo (Happy Path)

### A. Ver Detalles
1.  **Acción**: Toca una incidencia en la lista del Dashboard.
2.  **Validación**:
    *   Aparece la pantalla de detalle.
    *   Muestra Título, Descripción, Fotos, Fecha, Autor.
    *   Estado inicial del chip (ej. `OPEN` en azul).

### B. Agregar Comentario
1.  **Acción**: Escribe "Seguimiento de prueba" en el campo inferior.
2.  **Acción**: Toca el botón ➡️ (Enviar).
3.  **Validación UI**:
    *   El botón muestra un **spinner** de carga (no bloquea toda la pantalla).
    *   Al terminar, el campo de texto se limpia.
    *   El comentario aparece inmediatamente en la lista de arriba.
4.  **Validación Logs**:
    *   `🐛 RPC: Executing add_incident_comment...`
    *   `🐛 RPC: Comment added successfully. ID: ...`

### C. Cerrar Incidencia
*(Solo si eres el Creador o Admin)*
1.  **Acción**: Toca el icono de ✅ (Check) en la barra superior.
2.  **Validación**: Aparece diálogo de confirmación.
3.  **Acción**: Escribe una nota ("Reparado") y confirma.
4.  **Validación UI**:
    *   Loader fullscreen o feedback de proceso.
    *   El Chip de estado cambia a **CLOSED** (Verde).
    *   El botón de cerrar desaparece o se deshabilita.
    *   El campo de comentarios se oculta (opcional según regla de negocio actual, o permanece visible).
5.  **Validación Logs**:
    *   `🐛 RPC: Executing close_incident...`
    *   `🐛 RPC: Incident closed successfully.`

---

## 💥 4. Verificación de Errores (Resilience)

### Prueba 1: Comentario Vacío
1.  Intenta enviar sin escribir nada.
2.  **Resultado**: El botón no hace nada o está deshabilitado. No se inician llamadas RPC.

### Prueba 2: Fallo de Red (Simulado)
1.  Escribe un comentario.
2.  Activa **Modo Avión**.
3.  Envía.
4.  **Resultado**:
    *   SnackBar Rojo: "Error de conexión" o "SocketException".
    *   El texto escrito **NO** se borra (permitiendo reintentar).
    *   Log: `Unexpected error posting comment`.

### Prueba 3: Permisos (Simulado)
*(Si puedes manipular la DB o loguear con otro usuario)*
1.  Intenta cerrar una incidencia que no es tuya (siendo un rol bajo).
2.  **Resultado**:
    *   SnackBar Rojo: "No tienes permiso para cerrar esta incidencia."
    *   Log: `Supabase RPC Error... Permission denied`.

---

## ✅ Criterios de Éxito

| Feature | Criterio | Estado |
| :--- | :--- | :--- |
| **Comentarios** | Se agregan y listan en tiempo real (tras recarga) | ⬜ |
| **Cierre** | Cambia estado a CLOSED y guarda notas | ⬜ |
| **Feedback Error** | Snackbars aparecen en fallos RPC | ⬜ |
| **Logs** | Traza clara de ejecución en debug console | ⬜ |
