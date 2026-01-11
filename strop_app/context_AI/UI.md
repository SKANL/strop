Manual Maestro de UI para Desarrolladores

Este documento transforma decisiones subjetivas de diseño en reglas lógicas y deterministas. El objetivo es que cualquier desarrollador pueda construir una interfaz de nivel "Senior" siguiendo este sistema.

1. El Sistema de Sombras e Iluminación (Profundidad Realista)

Las sombras son el error #1 del desarrollador novato. No uses sombras negras por defecto.

La Regla: "Luz Ambiental y Sombras de Color"

Nunca uses una sombra negra pura (#000) con alta opacidad. En su lugar, usa sombras con un matiz del color del elemento o del fondo, y aumenta el "blur" (difuminado) significativamente.

Fórmula: Sombra grande y difusa = elevación alta. Sombra corta y nítida = elevación baja.

¿Por qué?
En el mundo real, las sombras no son negras; son áreas donde llega menos luz. Si la luz rebota en una mesa de madera marrón, la sombra tendrá tintes cálidos. Las sombras negras ensucian la interfaz ("muddy UI").

¿Para qué sirve?
Para crear una jerarquía de profundidad (Eje Z) limpia, donde los elementos flotan suavemente en lugar de parecer pegatinas oscuras sobre el fondo.

Cuándo SÍ:

En tarjetas (Cards) sobre un fondo blanco/gris.

En menús desplegables (Dropdowns) para separarlos del contenido inferior.

Tip Pro: Si tu botón es azul, usa una sombra azul oscura muy transparente, no negra.

Cuándo NO:

En elementos que deben parecer "hundidos" o planos.

Anti-patrón: Evita sombras duras tipo box-shadow: 5px 5px 0px #000 a menos que busques un estilo "Neobrutalista" o retro intencional.

1. Tipografía y Jerarquía (Contraste y Escala)

No confíes solo en el tamaño para diferenciar textos; usa el peso (weight) y el color.

La Regla: "Pares de Fuentes y Escala Limitada"

Limítate a una sola familia tipográfica (ej. Inter, Roboto) o un par máximo (una Serif para títulos, Sans-Serif para cuerpo). Usa pesos contrastantes: Títulos en Bold/Black, Cuerpo en Regular, Detalles en Medium.

¿Por qué?
El ojo humano escanea buscando anclas visuales. Si todo el texto tiene el mismo grosor visual, el cerebro se cansa tratando de diferenciar qué es un título y qué es contenido.

¿Para qué sirve?
Para crear un ritmo de lectura vertical escaneable (F-Pattern).

Cuándo SÍ:

Usa fuentes con múltiples "pesos" (Light, Regular, Medium, Bold, ExtraBold).

Combina una Serif elegante en encabezados grandes con una Sans funcional en párrafos pequeños para un look moderno y editorial.

Cuándo NO:

No uses más de 2 familias de fuentes distintas.

No uses fuentes "Display" o muy decorativas para párrafos de texto largos; son ilegibles en tamaños pequeños.

1. Uso del Color y Gradientes

El color debe tener una función lógica, no decorativa.

La Regla: "60-30-10 y Gradientes Funcionales"

Usa la regla 60% neutro, 30% secundario, 10% acento. Sobre los gradientes: no los uses para "decorar" todo el fondo sin sentido.

¿Por qué?
Los colores saturados compiten por atención. Si todo es brillante, nada destaca. Los gradientes excesivos (muy populares en 2018) ahora pueden hacer que la web se vea anticuada si no se controlan.

¿Para qué sirve?
Para guiar el ojo del usuario hacia la acción principal (el 10% de acento) sin distracciones.

Cuándo SÍ:

Usa gradientes suaves para guiar la vista de una sección a otra.

Usa colores pastel o baja saturación para fondos de tarjetas, reservando el color vibrante para el texto o icono dentro de ellas.

Cuándo NO:

Anti-patrón: No pongas un gradiente arcoíris en todo el fondo del body si hay texto encima. Compromete la legibilidad.

Evita el "Gris sobre Gris": Texto gris claro sobre fondo gris un poco menos claro. Es inaccesible.

1. Imágenes y Recursos Visuales

La Regla: "Autenticidad sobre Stock Genérico"

Evita las fotos de stock gratuitas donde aparecen "personas en traje dándose la mano en una oficina blanca".

¿Por qué?
El cerebro humano detecta lo "falso" en milisegundos. Las imágenes genéricas (stock photos) destruyen la confianza y hacen que el sitio parezca una plantilla barata o una estafa ("scam").

¿Para qué sirve?
Para humanizar la marca y conectar emocionalmente.

Cuándo SÍ:

Usa capturas de pantalla reales de tu producto (aunque sea en desarrollo).

Usa ilustraciones con personalidad propia (doodles, 3D customizado).

Muestra personas reales usando el producto, no modelos.

Cuándo NO:

Nunca uses iconos de diferente estilo visual juntos (ej. uno relleno de 3px y uno de línea fina de 1px).

Evita imágenes estiradas o pixeladas. Usa siempre object-fit: cover.

⚠️ QUÉ NO HACER EN UI (La Lista Negra)

NO uses Negro Puro (#000000): Causa fatiga visual y "smearing" en pantallas OLED. Usa #121212 o grises muy oscuros.

NO inventes controles: No diseñes un "checkbox" circular; los usuarios pensarán que es un "radio button". Respeta los patrones mentales establecidos.

NO satures de bordes: Si usas sombras para separar tarjetas, no necesitas bordes. Si usas fondos de diferente color, no necesitas sombras. Elige uno de los métodos de separación, no todos a la vez.
