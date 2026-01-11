Manual Maestro de UX para Desarrolladores

La UX no es arte, es empatía aplicada y reducción de fricción. Estas reglas buscan que el usuario "no piense" mientras usa tu aplicación.

1. Interrupción y Atención (Popups vs. Contexto)

La batalla contra las ventanas emergentes intrusivas.

La Regla: "No me grites, susúrrame"

Evita los modales y popups que bloquean toda la pantalla para anuncios o newsletters, especialmente al entrar.

¿Por qué?
Interrumpen el flujo de navegación y generan frustración inmediata ("rage quit"). Se sienten como publicidad agresiva.

¿Para qué sirve?
Para mantener al usuario en control ("Locus of Control"). El usuario decide cuándo interactuar.

Cuándo SÍ (Alternativas):

Usa Toasts/Snackbars (notificaciones pequeñas en una esquina) para informar sucesos.

Usa Banners Inline (dentro del contenido) que se pueden ignorar haciendo scroll.

Usa Badges (puntos rojos o etiquetas) en los iconos para indicar novedades sin bloquear la vista.

Cuándo NO:

Nunca lances un popup de "Suscríbete" en el segundo 0 de carga.

No uses modales para mensajes de éxito simples (ej. "Guardado correctamente"). Eso es trabajo para un Toast temporal.

2. Densidad de Información y Espacio en Blanco

El equilibrio entre limpieza y utilidad.

La Regla: "El Espacio en Blanco es Funcional" (Con matices culturales)

Añade aire (padding/margin) alrededor de los elementos para agruparlos. Sin embargo, adapta la densidad a tu audiencia.

¿Por qué?
El espacio vacío (whitespace) reduce la carga cognitiva. Permite al cerebro procesar bloques de información separados.

¿Para qué sirve?
Para mejorar la legibilidad y la velocidad de escaneo.

Cuándo SÍ:

En Landing Pages occidentales, dashboards ejecutivos y apps de consumo (B2C). Separa secciones con 64px, 80px o más.

Cuándo NO:

Excepción Cultural/Técnica: En herramientas de datos intensivos (Excel, Dashboards de trading) o en mercados asiáticos (China, Japón), la alta densidad de información es preferida y sinónimo de "riqueza de contenido". No apliques minimalismo extremo si el usuario necesita ver 50 filas de datos a la vez.

3. Navegación Móvil y Ergonomía

Diseña para dedos, no para cursores de ratón.

La Regla: "La Zona del Pulgar y Objetivos Táctiles"

Coloca la navegación y acciones primarias en el tercio inferior de la pantalla. Asegura áreas de toque mínimas de 44px.

¿Por qué?
Los móviles son cada vez más grandes. Alcanzar la esquina superior izquierda es doloroso o imposible con una sola mano. Los dedos son imprecisos.

¿Para qué sirve?
Para prevenir errores de "dedo gordo" (fat finger) y fatiga física.

Cuándo SÍ:

Menús de navegación (Bottom Tab Bar).

Botones flotantes de acción (FAB) en la esquina inferior derecha.

Inputs de formulario: asegúrate de que al abrir el teclado, el input no quede oculto.

Cuándo NO:

No pongas el botón "Atrás" o "Cerrar" únicamente en la esquina superior izquierda sin una alternativa gestual (swipe to back).

4. Gestión de Errores y Estados Vacíos

El sistema debe hablar claro cuando no hay nada o algo sale mal.

La Regla: "No culpes al usuario, guíalo"

Los mensajes de error deben decir qué pasó y cómo arreglarlo. Los estados vacíos (Empty States) deben invitar a la acción.

¿Por qué?
Un mensaje "Error 404" o una pantalla blanca vacía son callejones sin salida. El usuario se siente perdido o piensa que la app está rota.

¿Para qué sirve?
Para retener al usuario incluso cuando no hay contenido o hubo un fallo.

Cuándo SÍ:

Error: En lugar de "Formato inválido", di "El correo debe tener un @". Valida en tiempo real (inline), no al final.

Vacío: Si no hay proyectos, muestra una ilustración y un botón gigante: "Crear mi primer proyecto".

Cuándo NO:

Nunca uses alertas nativas del navegador (window.alert()). Son intrusivas y pausan la ejecución de scripts.

⚠️ QUÉ NO HACER EN UX (La Lista Negra)

NO secuestres el Scroll: El "Scroll Jacking" (cambiar la velocidad o dirección del scroll natural) marea y frustra.

NO pidas permisos prematuros: No pidas ubicación o notificaciones nada más abrir la app. Pídelo solo cuando el usuario pulse un botón que requiera esa función (Contexto).

NO uses carruseles automáticos: Nadie lee la segunda diapositiva. Si el contenido es importante, ponlo visible, no oculto tras un slider.

NO hagas esperar sin feedback: Si una acción tarda más de 0.5 segundos, muestra un spinner o barra de progreso. Si tarda más de 10 segundos, permite cancelar o notificar después.