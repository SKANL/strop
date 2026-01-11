# Base de Conocimientos de Paquetes Flutter

> Catálogo curado de paquetes esenciales para desarrollo Flutter
>
> **Fecha de creación:** Enero 2026

---

## 📋 Tabla de Contenidos

- [Lista 1: UI Widgets & Componentes Visuales](#lista-1-ui-widgets--componentes-visuales)
- [Lista 2: Design Systems & Frameworks UI](#lista-2-design-systems--frameworks-ui)

---

## Lista 1: UI Widgets & Componentes Visuales

### 1. GetWidget

**📦 Paquete:** `getwidget` (v7.0.0)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/getwidget>
- GitHub: <https://github.com/ionicfirebaseapp/getwidget>

**📊 Estadísticas:**

- ⭐ Likes: 2,548
- 📥 Downloads: 35,769
- 🏆 Pub Points: 150/160

**📝 ¿Qué hace?**
GetWidget es una biblioteca de código abierto que ofrece más de 1000 componentes UI pre-construidos para Flutter, permitiendo desarrollar aplicaciones más rápido y de manera más eficiente.

**💡 Utilidad:**
Proporciona widgets listos para usar que se pueden personalizar según las necesidades del proyecto sin tener que crear componentes desde cero.

**🎯 ¿En qué casos podría usarse?**

- Desarrollo rápido de prototipos
- Proyectos que necesitan componentes UI consistentes
- Aplicaciones empresariales que requieren múltiples tipos de widgets
- Cuando se busca acelerar el tiempo de desarrollo

**🎁 ¿Qué ofrece el paquete?**

- Más de 1000+ componentes UI pre-construidos
- Botones, tarjetas, formularios, badges, loaders
- Carruseles, acordeones, avatares, alertas
- Componentes de navegación (tabs, bottom sheets, drawers)
- Rating widgets, progress bars
- Altamente personalizable

**❌ ¿Cuándo NO usarlo?**

- Si buscas un diseño altamente personalizado y único
- Cuando el peso del paquete es una preocupación crítica
- Si prefieres tener control total sobre cada aspecto visual
- Proyectos que requieren strict Material Design compliance

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja-Media**
- Solo necesitas importar los widgets que uses
- No requiere configuración especial del proyecto
- Se integra fácilmente con el código existente

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Proyecto Flutter configurado
- Conocimiento básico de widgets en Flutter
- Definir el design system del proyecto

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `provider` o `riverpod` para state management
- `cached_network_image` para imágenes
- `flutter_svg` para iconos SVG
- Cualquier paquete de navegación (go_router, auto_route)

**⚠️ ¿Qué limitación importante tiene?**

- Puede incrementar significativamente el tamaño de la app
- Estilo predefinido que puede no ajustarse a todos los diseños
- Dependencia de actualizaciones del paquete para nuevas versiones de Flutter
- Curva de aprendizaje para dominar todos los componentes disponibles

---

### 2. calendar_view

**📦 Paquete:** `calendar_view` (v1.4.0)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/calendar_view>
- GitHub: <https://github.com/SimformSolutionsPvtLtd/flutter_calendar_view>
- Publisher: simform.com

**📊 Estadísticas:**

- ⭐ Likes: 964
- 📥 Downloads: 28,136
- 🏆 Pub Points: 150/160

**📝 ¿Qué hace?**
Un paquete Flutter que permite implementar fácilmente todas las funcionalidades y UI de calendario, incluyendo eventos de calendario.

**💡 Utilidad:**
Facilita la creación de vistas de calendario completas sin tener que construir la lógica desde cero.

**🎯 ¿En qué casos podría usarse?**

- Aplicaciones de gestión de tareas/eventos
- Calendarios de citas (médicos, salones, consultoría)
- Planificadores personales o empresariales
- Apps de horarios o programación

**🎁 ¿Qué ofrece el paquete?**

- Vistas de calendario múltiples (día, semana, mes)
- Gestión de eventos de calendario
- Personalización completa de UI
- Soporte para eventos de múltiples días
- Callbacks para interacción con eventos

**❌ ¿Cuándo NO usarlo?**

- Calendarios muy simples con solo selección de fechas
- Cuando solo necesitas un date picker estándar
- Si requieres sincronización nativa con calendarios del dispositivo

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja**
- Widget autocontenido
- No requiere cambios en la arquitectura
- Se integra como cualquier widget de Flutter

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Modelo de datos para eventos
- Diseño de UI definido para el calendario
- State management configurado

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `table_calendar` (alternativa)
- `intl` para formateo de fechas
- State management (provider, bloc, riverpod)
- `timezone` para manejo de zonas horarias

**⚠️ ¿Qué limitación importante tiene?**

- No incluye sincronización con calendarios nativos
- Puede ser complejo personalizar comportamientos muy específicos
- No incluye recordatorios o notificaciones por defecto

---

### 3. TimeLines

**📦 Paquete:** `timelines` (v0.1.0)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/timelines>
- Repository: <https://github.com/chulwoo-park/timelines/>
- Publisher: chulwoo.dev

**📊 Estadísticas:**

- ⭐ Likes: 1,757
- 📥 Downloads: 10,165
- 🏆 Pub Points: 90/160

**📝 ¿Qué hace?**
Un paquete poderoso y fácil de usar para crear timelines (líneas de tiempo) en Flutter. Todos los componentes UI son widgets separados.

**💡 Utilidad:**
Permite crear líneas de tiempo visuales para mostrar progreso, historial o secuencias de eventos de manera elegante y personalizable.

**🎯 ¿En qué casos podría usarse?**

- Historial de pedidos o transacciones
- Progreso de procesos (onboarding, registro, checkout)
- Feeds de actividad o noticias
- Historial médico o académico
- Tracking de envíos

**🎁 ¿Qué ofrece el paquete?**

- Componentes UI modulares y separados
- Timeline vertical y horizontal
- Indicadores personalizables
- Conectores entre eventos
- Tiles de contenido flexibles
- Animaciones integradas

**❌ ¿Cuándo NO usarlo?**

- Para timelines muy simples que puedes construir con Column/Row
- Cuando necesitas sincronización en tiempo real compleja
- Si el diseño requerido es completamente diferente al patrón timeline

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Muy Baja**
- Widgets independientes
- Sin dependencias adicionales complejas
- Fácil integración

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Datos estructurados de eventos/pasos
- Diseño visual de la timeline definido
- Modelos de datos para items del timeline

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `timeline_tile` (alternativa más popular con 1,900+ likes)
- `intl` para fechas
- State management
- `animations` para transiciones

**⚠️ ¿Qué limitación importante tiene?**

- Pub points bajos (90/160) sugiere mantenimiento limitado
- Última actualización puede estar desactualizada
- Considera usar `timeline_tile` o `timelines_plus` como alternativas más mantenidas

---

### 4. Fl_Chart

**📦 Paquete:** `fl_chart` (v1.1.1)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/fl_chart>
- Homepage: <https://flchart.dev/>
- Repository: <https://github.com/imaNNeo/fl_chart>
- Publisher: flchart.dev

**📊 Estadísticas:**

- ⭐ Likes: 7,037
- 📥 Downloads: 854,047
- 🏆 Pub Points: 150/160

**📝 ¿Qué hace?**
Una biblioteca de gráficos Flutter altamente personalizable que soporta Line Chart, Bar Chart, Pie Chart, Scatter Chart y Radar Chart.

**💡 Utilidad:**
Permite crear visualizaciones de datos hermosas e interactivas con animaciones fluidas y alto nivel de personalización.

**🎯 ¿En qué casos podría usarse?**

- Dashboards analíticos
- Apps de finanzas e inversiones
- Reportes de datos
- Apps de salud y fitness (tracking)
- Aplicaciones de monitoreo
- Visualización de estadísticas

**🎁 ¿Qué ofrece el paquete?**

- 5 tipos de gráficos principales (Line, Bar, Pie, Scatter, Radar)
- Altamente personalizable
- Animaciones integradas
- Interactividad (touch gestures)
- Performance optimizado
- Tooltips y leyendas
- Gradientes y estilos avanzados

**❌ ¿Cuándo NO usarlo?**

- Gráficos 3D complejos
- Mapas de calor muy elaborados
- Cuando necesitas tipos de gráficos muy especializados
- Si prefieres una solución más simple para gráficos básicos

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja**
- Widgets independientes
- No afecta arquitectura
- Fácil de integrar en cualquier parte de la app

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Datos estructurados para graficar
- Diseño visual de los gráficos
- Entender los tipos de datos que cada gráfico requiere

**🔗 ¿Con qué otros paquetes se suele combinar?**

- State management (provider, bloc, riverpod)
- `syncfusion_flutter_charts` (alternativa comercial)
- `charts_flutter` (alternativa de Google)
- `intl` para formateo de números y fechas
- `animations` para transiciones

**⚠️ ¿Qué limitación importante tiene?**

- Curva de aprendizaje moderada para personalización avanzada
- Puede tener issues de rendimiento con datasets muy grandes
- Documentación podría ser más detallada para casos complejos
- No incluye todos los tipos de gráficos especializados

---

### 5. Flutter_svg

**📦 Paquete:** `flutter_svg` (v2.2.3)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/flutter_svg>
- Repository: <https://github.com/flutter/packages/tree/main/third_party/packages/flutter_svg>
- Publisher: flutter.dev

**📊 Estadísticas:**

- ⭐ Likes: 5,809
- 📥 Downloads: 2,659,023
- 🏆 Pub Points: 160/160
- 🏷️ Topics: svg, vector-graphics

**📝 ¿Qué hace?**
Una biblioteca de renderizado SVG para Flutter que permite pintar y mostrar archivos Scalable Vector Graphics 1.1.

**💡 Utilidad:**
Permite usar gráficos vectoriales SVG que escalan perfectamente en cualquier resolución sin perder calidad, ideal para iconos e ilustraciones.

**🎯 ¿En qué casos podría usarse?**

- Iconos personalizados
- Ilustraciones vectoriales
- Logos e imágenes de marca
- Interfaces que requieren gráficos escalables
- Animaciones SVG simples
- Íconos multicolor complejos

**🎁 ¿Qué ofrece el paquete?**

- Renderizado SVG completo
- Widget SvgPicture para mostrar SVGs
- Soporte para SVGs de red y assets
- Colorización de SVGs
- Caché de SVGs
- Performance optimizado

**❌ ¿Cuándo NO usarlo?**

- Animaciones SVG muy complejas (considerar Lottie)
- Cuando PNG/WebP son suficientes
- Si el tamaño del SVG es muy grande y complejo

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Muy Baja**
- Simple widget de imagen
- No requiere configuración especial
- Reemplazo directo de Image widget

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Archivos SVG en assets o URLs
- Configuración de assets en pubspec.yaml
- Archivos SVG optimizados (SVGO recomendado)

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `vector_graphics` (nueva implementación oficial)
- `cached_network_image` para SVGs de red
- `flutter_svg_provider` para image providers
- `lottie` para animaciones

**⚠️ ¿Qué limitación importante tiene?**

- No soporta todas las características de SVG 2.0
- Animaciones SVG limitadas
- Algunos filtros SVG no están soportados
- Performance puede degradarse con SVGs muy complejos

---

### 6. Flutter_spinkit

**📦 Paquete:** `flutter_spinkit` (v5.2.2)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/flutter_spinkit>
- Homepage: <https://github.com/jogboms/flutter_spinkit>
- Publisher: jogboms.xyz

**📊 Estadísticas:**

- ⭐ Likes: 4,593
- 📥 Downloads: 321,729
- 🏆 Pub Points: 140/160

**📝 ¿Qué hace?**
Una colección de indicadores de carga animados construidos con Flutter. Fuertemente inspirado por SpinKit de @tobiasahlin.

**💡 Utilidad:**
Proporciona loaders/spinners animados y atractivos para mostrar estados de carga en lugar del CircularProgressIndicator estándar.

**🎯 ¿En qué casos podría usarse?**

- Pantallas de carga (splash screens)
- Estados de carga de datos
- Procesamiento de operaciones
- Refresh indicators personalizados
- Cualquier feedback visual de "procesando"

**🎁 ¿Qué ofrece el paquete?**

- Más de 30 estilos de loading diferentes
- Animaciones suaves y atractivas
- Fácil personalización de colores y tamaños
- Loaders: Wave, Bounce, Pulse, Rotating, Fading, etc.
- No requiere assets adicionales

**❌ ¿Cuándo NO usarlo?**

- Cuando el Material CircularProgressIndicator es suficiente
- Apps que requieren strict Material Design compliance
- Si buscas animaciones de carga muy específicas/custom

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Muy Baja**
- Widgets independientes
- Reemplazo directo de CircularProgressIndicator
- Sin configuración adicional requerida

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Nada especial
- Solo importar y usar
- Definir colores de tu tema

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `flutter_easyloading` para overlays
- `loading_indicator` (alternativa)
- State management packages
- `overlay_support` para mostrar loaders globales

**⚠️ ¿Qué limitación importante tiene?**

- Solo loaders rotativos/animados (no progress bars)
- No incluye porcentajes de progreso
- Animaciones fijas (poca customización de timing)
- No incluye loading overlays (necesita paquete adicional)

---

### 7. Flutter_slidable

**📦 Paquete:** `flutter_slidable` (v4.0.3)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/flutter_slidable>
- Homepage: <https://github.com/letsar/flutter_slidable>
- Publisher: romainrastel.com

**📊 Estadísticas:**

- ⭐ Likes: 6,036
- 📥 Downloads: 450,958
- 🏆 Pub Points: 150/160

**📝 ¿Qué hace?**
Una implementación Flutter de list items deslizables con acciones direccionales que pueden ser descartados (dismissed).

**💡 Utilidad:**
Permite crear list items con acciones ocultas que se revelan al deslizar, similar a las acciones en apps nativas de iOS y Android.

**🎯 ¿En qué casos podría usarse?**

- Listas de correos (archivar, eliminar, marcar)
- To-do lists (completar, eliminar)
- Listas de contactos (llamar, mensaje, editar)
- Carrito de compras (eliminar items)
- Cualquier lista con acciones contextuales

**🎁 ¿Qué ofrece el paquete?**

- Deslizamiento en ambas direcciones
- Múltiples acciones por dirección
- Animaciones suaves
- Dismiss/swipe to delete
- Acciones personalizables
- Tipos de acción: stretch, scroll, behind, drawer

**❌ ¿Cuándo NO usarlo?**

- Listas simples sin acciones contextuales
- Cuando prefieres menús contextuales tradicionales
- Si los usuarios no están familiarizados con gestos de deslizamiento

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja**
- Wrapper widget alrededor de list items
- Compatible con ListView, GridView, etc.
- No afecta arquitectura

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Lista de datos
- Definir acciones y sus callbacks
- Íconos para las acciones
- Colores del tema

**🔗 ¿Con qué otros paquetes se suele combinar?**

- ListView builders
- State management
- `flutter_slidable_panel` (alternativa)
- `animations` para transiciones

**⚠️ ¿Qué limitación importante tiene?**

- Puede ser confuso para usuarios nuevos
- Gestos pueden conflictuar con otros gestures
- Performance en listas muy largas puede variar
- Necesita educación del usuario sobre las acciones disponibles

---

### 8. awesome_snackbar_content

**📦 Paquete:** `awesome_snackbar_content` (v0.1.8)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/awesome_snackbar_content>
- Homepage: <https://github.com/mhmzdev/awesome_snackbar_content>
- Publisher: mhmz.dev

**📊 Estadísticas:**

- ⭐ Likes: 1,007
- 📥 Downloads: 8,137
- 🏆 Pub Points: 160/160

**📝 ¿Qué hace?**
Eleva la experiencia de snackbar con varios mensajes de alerta (success, failure, help, warning) con un diseño UI único y atractivo.

**💡 Utilidad:**
Proporciona snackbars y material banners hermosos y personalizados para mostrar mensajes de éxito, error, advertencia o ayuda.

**🎯 ¿En qué casos podría usarse?**

- Feedback de operaciones (guardado exitoso, error al enviar)
- Notificaciones de sistema
- Mensajes de validación
- Confirmaciones de acciones
- Alertas temporales

**🎁 ¿Qué ofrece el paquete?**

- 4 tipos de mensajes: Success, Failure, Help, Warning
- Diseño único y atractivo
- Colores y diseños predefinidos
- Animaciones incluidas
- Fácil de implementar
- Compatible con SnackBar y MaterialBanner

**❌ ¿Cuándo NO usarlo?**

- Si prefieres snackbars minimalistas de Material Design
- Cuando los diseños predefinidos no coinciden con tu UI
- Apps que requieren strict Material Design compliance

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Muy Baja**
- Widget de contenido para SnackBar
- No requiere configuración global
- Uso bajo demanda

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- BuildContext para mostrar snackbars
- Mensajes y títulos definidos
- Decidir tipo de alerta a mostrar

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `another_flushbar` (alternativa más completa)
- `animated_snack_bar` (alternativa)
- `flutter_styled_toast` (alternativa)
- State management para triggering

**⚠️ ¿Qué limitación importante tiene?**

- Diseño fijo con limitada personalización
- Solo 4 tipos predefinidos
- Puede no ajustarse a todos los design systems
- No incluye posicionamiento personalizado

---

### 9. cached_network_image

**📦 Paquete:** `cached_network_image` (v3.4.1)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/cached_network_image>
- Homepage: <https://github.com/Baseflow/flutter_cached_network_image>
- Publisher: baseflow.com

**📊 Estadísticas:**

- ⭐ Likes: 6,869
- 📥 Downloads: 1,720,999
- 🏆 Pub Points: 160/160
- 🏷️ Topics: cache, image, network-image

**📝 ¿Qué hace?**
Una biblioteca Flutter para cargar y cachear imágenes de red. También puede usarse con widgets de placeholder y error.

**💡 Utilidad:**
Optimiza la carga de imágenes de red almacenándolas en caché, mejorando performance y reduciendo uso de datos.

**🎯 ¿En qué casos podría usarse?**

- Apps con muchas imágenes de red (redes sociales, e-commerce)
- Galerías de imágenes
- Feeds de contenido
- Perfiles de usuario
- Listados de productos
- Cualquier app que cargue imágenes de internet

**🎁 ¿Qué ofrece el paquete?**

- Caché automático de imágenes
- Placeholders durante la carga
- Widgets de error personalizables
- Progress indicators
- Fade-in animations
- Control de caché (invalidación, limpieza)
- Soporte para headers HTTP

**❌ ¿Cuándo NO usarlo?**

- Imágenes que nunca deberían cachearse (sensibles)
- Cuando solo usas assets locales
- Apps con muy pocas imágenes de red

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja**
- Reemplazo directo de Image.network()
- Configuración de caché opcional
- No afecta arquitectura

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- URLs de imágenes
- Placeholders (widgets o assets)
- Error widgets
- Permisos de internet configurados

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `flutter_cache_manager` (usado internamente)
- `fast_cached_network_image` (alternativa)
- `photo_view` para zoom de imágenes
- `flutter_blurhash` para placeholders

**⚠️ ¿Qué limitación importante tiene?**

- Gestión de caché puede consumir almacenamiento
- No incluye compresión automática de imágenes
- Requiere configuración para casos especiales (headers, timeouts)
- Puede tener problemas con imágenes muy grandes

---

### 10. animations

**📦 Paquete:** `animations` (v2.1.1)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/animations>
- Repository: <https://github.com/flutter/packages/tree/main/packages/animations>
- Publisher: flutter.dev

**📊 Estadísticas:**

- ⭐ Likes: 6,764
- 📥 Downloads: 693,715
- 🏆 Pub Points: 160/160
- 🏷️ Topics: animation, ui

**📝 ¿Qué hace?**
Animaciones pre-construidas elegantes que pueden integrarse fácilmente en cualquier aplicación Flutter. Paquete oficial de Flutter.

**💡 Utilidad:**
Proporciona transiciones de Material Design complejas de forma simple, mejorando la experiencia de usuario con animaciones fluidas.

**🎯 ¿En qué casos podría usarse?**

- Transiciones entre pantallas
- Navegación con animaciones
- Modal bottom sheets animados
- Transformación de contenedores
- Shared element transitions
- Fade through transitions

**🎁 ¿Qué ofrece el paquete?**

- Container Transform (hero-like transitions)
- Shared Axis Transition
- Fade Through Transition
- Fade Scale Transition
- OpenContainer para transiciones modales
- Animaciones Material Design oficiales

**❌ ¿Cuándo NO usarlo?**

- Animaciones muy personalizadas/únicas
- Cuando prefieres control total de animations
- Si las animaciones predefinidas no se ajustan

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja-Media**
- Puede requerir restructuración de navegación
- Widgets wrapper
- Compatible con navegación estándar

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Navegación configurada
- Widgets de origen y destino
- Definir tipo de transición deseada

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `go_router` para navegación
- `auto_route` para routing
- `simple_animations` (alternativa)
- `animated_text_kit` para texto
- `lottie` para animaciones complejas

**⚠️ ¿Qué limitación importante tiene?**

- Solo incluye patrones Material Design
- Limitadas opciones de personalización de timing
- No incluye animaciones de elementos individuales
- Puede tener conflictos con Hero widgets

---

## Lista 2: Design Systems & Frameworks UI

### 1. exui

**📦 Paquete:** `exui` (v1.0.9)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/exui>
- Homepage/Repository: <https://github.com/jozzdart/exui>
- Publisher: jozz.biz

**📊 Estadísticas:**

- ⭐ Likes: 36
- 📥 Downloads: 96
- 🏆 Pub Points: 160/160
- 🏷️ Topics: flutter, widget, extension, ui, widgets

**📝 ¿Qué hace?**
Construye tu UI más rápido. Sin boilerplate, sin dependencias. Solo extensiones de widgets poderosas.

**💡 Utilidad:**
Proporciona extensiones Dart sobre widgets existentes de Flutter para simplificar la construcción de UI sin añadir dependencias pesadas.

**🎯 ¿En qué casos podría usarse?**

- Desarrollo rápido de UI
- Reducir código boilerplate
- Proyectos que buscan sintaxis fluida
- Cuando se prefiere extension methods sobre widgets wrapper

**🎁 ¿Qué ofrece el paquete?**

- Extension methods sobre widgets nativos
- API fluida y encadenable
- Sin dependencias adicionales
- Soporte Material y Cupertino
- Sintaxis limpia y expresiva

**❌ ¿Cuándo NO usarlo?**

- Si prefieres widgets tradicionales
- Cuando el equipo no está familiarizado con extensions
- Proyectos muy grandes donde las extensiones pueden causar confusión

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Muy Baja**
- Solo añade métodos de extensión
- No cambia arquitectura
- Compatible con código existente

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Entender extension methods en Dart
- Familiaridad con widgets de Flutter
- Proyecto Flutter configurado

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `styled_widget` (similar pero más completo)
- Cualquier state management
- `flutter_hooks` para composición

**⚠️ ¿Qué limitación importante tiene?**

- Comunidad pequeña (36 likes)
- Mantenimiento puede ser limitado
- Menos features que `styled_widget`
- Curva de aprendizaje para sintaxis nueva

---

### 2. shadcn_ui

**📦 Paquete:** `shadcn_ui` (v0.43.1)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/shadcn_ui>
- Homepage: <https://flutter-shadcn-ui.mariuti.com>
- Repository: <https://github.com/nank1ro/flutter-shadcn-ui>
- Publisher: mariuti.com

**📊 Estadísticas:**

- ⭐ Likes: 836
- 📥 Downloads: 19,644
- 🏆 Pub Points: 160/160
- 🏷️ Topics: user-interface, design-system, shadcn-ui, material-alternative

**📝 ¿Qué hace?**
Port de shadcn/ui para Flutter. Componentes UI increíbles para Flutter, completamente personalizables.

**💡 Utilidad:**
Trae el popular design system shadcn/ui de web a Flutter, ofreciendo componentes modernos y consistentes.

**🎯 ¿En qué casos podría usarse?**

- Apps que buscan diseño moderno y minimalista
- Proyectos que quieren consistencia con versión web
- Alternativa a Material Design
- Apps empresariales modernas

**🎁 ¿Qué ofrece el paquete?**

- Componentes shadcn/ui portados a Flutter
- Theming completo y personalizable
- Componentes: Button, Card, Dialog, Input, etc.
- Diseño moderno y limpio
- Documentación completa

**❌ ¿Cuándo NO usarlo?**

- Apps que requieren Material Design estricto
- Si no estás familiarizado con shadcn/ui
- Proyectos que necesitan componentes muy específicos

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Media**
- Requiere configuración de tema
- Reemplaza widgets Material/Cupertino
- Necesita adopción consistente

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Diseño UI definido
- Tema y colores configurados
- Decisión de abandonar Material Design

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `shadcn_flutter` (alternativa con 396 likes)
- `forui` (alternativa inspirada en shadcn)
- State management
- `go_router` para navegación

**⚠️ ¿Qué limitación importante tiene?**

- Comunidad más pequeña que Material
- No todos los componentes están disponibles
- Puede requerir customización adicional
- Actualizaciones pueden tardar más que Flutter nativo

---

### 3. fluent_ui

**📦 Paquete:** `fluent_ui` (v4.13.0)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/fluent_ui>
- Homepage: <https://bdlukaa.github.io/fluent_ui/#/>
- Repository: <https://github.com/bdlukaa/fluent_ui>
- Publisher: bdlukaa.dev

**📊 Estadísticas:**

- ⭐ Likes: 3,159
- 📥 Downloads: 10,173
- 🏆 Pub Points: 140/160
- 🏷️ Topics: windows, desktop, ui, widgets

**📝 ¿Qué hace?**
Implementa el Windows User Interface de Microsoft en Flutter.

**💡 Utilidad:**
Permite crear apps Flutter con el look and feel nativo de Windows 11/10, perfecto para aplicaciones de escritorio.

**🎯 ¿En qué casos podría usarse?**

- Apps de escritorio para Windows
- Aplicaciones empresariales Windows
- Herramientas de productividad
- Apps que requieren integración con el ecosistema Windows
- Cuando se busca consistencia con Windows

**🎁 ¿Qué ofrece el paquete?**

- Widgets Fluent Design System completos
- NavigationView, CommandBar, TreeView
- Acrylic backgrounds
- Theming Windows 11
- InfoBar, Flyouts, Dialogs
- Soporte para modo oscuro/claro
- 40+ idiomas soportados

**❌ ¿Cuándo NO usarlo?**

- Apps móviles (iOS/Android)
- Si no necesitas look nativo de Windows
- Proyectos multiplataforma que necesitan UI consistente

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Alta**
- Reemplaza completamente Material/Cupertino
- Requiere reescritura de UI
- Cambio fundamental en estructura de widgets

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Proyecto enfocado en Windows desktop
- Diseño basado en Fluent Design System
- Familiaridad con UI de Windows

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `fluentui_system_icons` para iconos
- `window_manager` para ventanas
- `bitsdojo_window` para customización de ventana
- State management (riverpod, bloc)

**⚠️ ¿Qué limitación importante tiene?**

- Solo recomendado para Windows desktop
- No es oficial de Microsoft
- Menos soporte de comunidad que Material
- Algunas features avanzadas pueden faltar

---

### 4. flutter_platform_widgets

**📦 Paquete:** `flutter_platform_widgets` (v9.0.0)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/flutter_platform_widgets>
- Homepage: <https://github.com/stryder-dev/flutter_platform_widgets>
- Documentation: <https://github.com/stryder-dev/flutter_platform_widgets/wiki>
- Publisher: stryder.dev

**📊 Estadísticas:**

- ⭐ Likes: 1,308
- 📥 Downloads: 31,251
- 🏆 Pub Points: 140/160

**📝 ¿Qué hace?**
Simplifica el uso de widgets Material y Cupertino con un solo widget que se adapta automáticamente a la plataforma.

**💡 Utilidad:**
Permite escribir código una vez y obtener look nativo en iOS (Cupertino) y Android (Material) automáticamente.

**🎯 ¿En qué casos podría usarse?**

- Apps multiplataforma iOS/Android
- Cuando se busca look nativo en cada plataforma
- Reducir código duplicado platform-specific
- Mantener consistencia mientras se adapta al OS

**🎁 ¿Qué ofrece el paquete?**

- PlatformApp, PlatformScaffold, PlatformButton
- Adaptación automática iOS/Android
- Theming unificado
- Navegación platform-aware
- Dialogs, switches, sliders adaptables
- Customización por plataforma

**❌ ¿Cuándo NO usarlo?**

- Apps con diseño custom no-nativo
- Cuando se prefiere UI consistente cross-platform
- Solo una plataforma target

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Media**
- Cambio de widgets base
- Requiere refactoring de UI existente
- Afecta toda la capa de presentación

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Diseños para ambas plataformas
- Decisión de adoptar look nativo
- Testing en ambas plataformas

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `adaptive_theme` para theming
- `adaptive_platform_ui` (alternativa)
- State management
- Platform detection packages

**⚠️ ¿Qué limitación importante tiene?**

- Dos diseños diferentes para mantener
- Complejidad adicional en testing
- No cubre todos los widgets
- Puede requerir customización platform-specific

---

### 5. styled_widget

**📦 Paquete:** `styled_widget` (v0.4.1)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/styled_widget>
- Homepage: <https://github.com/ReinBentdal/styled_widget>
- Repository: <https://github.com/ReinBentdal/styled_widget>

**📊 Estadísticas:**

- ⭐ Likes: 906
- 📥 Downloads: 7,729
- 🏆 Pub Points: 130/160

**📝 ¿Qué hace?**
Simplifica la estructura del árbol de widgets definiendo widgets usando métodos. Se inspira en CSS y SwiftUI.

**💡 Utilidad:**
Permite escribir UI de Flutter de forma más concisa y legible usando extension methods, similar a SwiftUI.

**🎯 ¿En qué casos podría usarse?**

- Proyectos que buscan código más limpio
- Desarrolladores familiarizados con SwiftUI
- Reducir anidamiento de widgets
- Sintaxis más declarativa

**🎁 ¿Qué ofrece el paquete?**

- Extension methods sobre widgets
- Sintaxis fluida y encadenable
- Métodos inspirados en CSS (padding, margin, etc.)
- Reduce anidamiento
- Código más legible

**❌ ¿Cuándo NO usarlo?**

- Equipos no familiarizados con esta sintaxis
- Cuando se prefiere widgets tradicionales
- Proyectos con strict coding guidelines

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja**
- Solo añade extension methods
- Compatible con código existente
- Adopción gradual posible

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Entender extension methods
- Familiaridad con widgets Flutter
- Convencer al equipo de la sintaxis

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `exui` (similar)
- `animated_styled_widget` para animaciones
- `styled_text` para texto con formato
- State management

**⚠️ ¿Qué limitación importante tiene?**

- Curva de aprendizaje inicial
- Puede ser confuso para nuevos en Flutter
- No cubre todos los casos de uso
- Pub points bajos (130/160)

---

### 6. assorted_layout_widgets

**📦 Paquete:** `assorted_layout_widgets` (v11.0.0)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/assorted_layout_widgets>
- Homepage: <https://github.com/marcglasberg/assorted_layout_widgets>
- Publisher: glasberg.dev

**📊 Estadísticas:**

- ⭐ Likes: 378
- 📥 Downloads: 27,859
- 🏆 Pub Points: 150/160
- 🏷️ Topics: widgets, layout, ui, keyboard, button

**📝 ¿Qué hace?**
Widgets de layout como SideBySide, ColumnSuper, RowSuper, FitHorizontally, Box, WrapSuper, TextOneLine, Delayed, Pad, ButtonBarSuper, etc.

**💡 Utilidad:**
Proporciona widgets de layout avanzados que solucionan problemas comunes de layout que los widgets nativos no manejan fácilmente.

**🎯 ¿En qué casos podría usarse?**

- Layouts complejos
- Cuando Column/Row no son suficientes
- Necesitas widgets con superpoderes de layout
- Problemas específicos de posicionamiento

**🎁 ¿Qué ofrece el paquete?**

- ColumnSuper/RowSuper (Column/Row mejorados)
- Box (Container con superpoderes)
- FitHorizontally (ajusta widgets horizontalmente)
- TextOneLine (texto que nunca hace overflow)
- SideBySide (layout lado a lado flexible)
- WrapSuper, Delayed, Pad, ButtonBarSuper

**❌ ¿Cuándo NO usarlo?**

- Layouts simples que Column/Row manejan bien
- Cuando prefieres widgets estándar
- Proyectos que evitan dependencias adicionales

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Baja**
- Widgets adicionales opcionales
- No afecta arquitectura
- Uso selectivo donde se necesite

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Problemas de layout identificados
- Entender qué widget resuelve qué problema
- Layout designs definidos

**🔗 ¿Con qué otros paquetes se suele combinar?**

- Widgets nativos de Flutter
- `matrix4_transform` (del mismo autor)
- `animated_size_and_fade` (del mismo autor)
- Cualquier UI framework

**⚠️ ¿Qué limitación importante tiene?**

- Curva de aprendizaje para entender cada widget
- Puede añadir complejidad innecesaria
- Algunos widgets muy específicos
- Documentación podría ser más clara

---

### 7. mix

**📦 Paquete:** `mix` (v1.7.0)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/mix>
- Homepage: <https://github.com/leoafarias/mix>
- Repository: <https://github.com/btwld/mix/tree/main/packages/mix>
- Publisher: leoafarias.com

**📊 Estadísticas:**

- ⭐ Likes: 389
- 📥 Downloads: 17,577
- 🏆 Pub Points: 140/160

**📝 ¿Qué hace?**
Una forma expresiva de construir design systems en Flutter sin esfuerzo.

**💡 Utilidad:**
Proporciona una API poderosa y expresiva para crear y gestionar design systems completos, similar a styled-components.

**🎯 ¿En qué casos podría usarse?**

- Design systems complejos
- Apps empresariales grandes
- Equipos que necesitan design tokens
- Proyectos que requieren theming avanzado

**🎁 ¿Qué ofrece el paquete?**

- Sistema de design tokens
- API de styling poderosa
- Variantes y modificadores
- Responsive design integrado
- Composición de estilos
- Theming avanzado

**❌ ¿Cuándo NO usarlo?**

- Apps pequeñas o prototipos
- Cuando no necesitas design system complejo
- Equipos no familiarizados con design tokens

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Alta**
- Requiere adopción de nuevo paradigma
- Afecta toda la capa de UI
- Necesita setup inicial significativo

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Design system bien definido
- Design tokens especificados
- Comprensión de la API de Mix
- Tiempo para setup inicial

**🔗 ¿Con qué otros paquetes se suele combinar?**

- State management
- `remix_icon` para iconos
- Theme packages
- Layout packages

**⚠️ ¿Qué limitación importante tiene?**

- Curva de aprendizaje pronunciada
- Overhead para proyectos pequeños
- Comunidad relativamente pequeña
- Requiere inversión inicial significativa

---

### 8. arna

**📦 Paquete:** `arna` (v1.0.6)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/arna>
- Homepage: <https://github.com/MahanRahmati/Arna>

**📊 Estadísticas:**

- ⭐ Likes: 65
- 📥 Downloads: 50
- 🏆 Pub Points: 90/160

**📝 ¿Qué hace?**
Arna es un set de widgets diseñados para ser simples y fáciles de usar para construir aplicaciones con Flutter.

**💡 Utilidad:**
Proporciona una biblioteca UI alternativa enfocada en simplicidad y facilidad de uso.

**🎯 ¿En qué casos podría usarse?**

- Proyectos que buscan UI simple
- Alternativa a Material/Cupertino
- Aplicaciones minimalistas

**🎁 ¿Qué ofrece el paquete?**

- Widgets simples y fáciles de usar
- Diseño minimalista
- Componentes básicos

**❌ ¿Cuándo NO usarlo?**

- Proyectos de producción críticos
- Cuando necesitas comunidad grande
- Apps que requieren muchos componentes

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Media-Alta**
- Reemplazo de widgets base
- Requiere adopción completa

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Familiaridad con el paquete
- Diseño minimalista definido
- Tolerancia a riesgos

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `arna_web_service` (del mismo autor)
- `arna_animations` (del mismo autor)
- `arna_logger` (del mismo autor)

**⚠️ ¿Qué limitación importante tiene?**

- Comunidad muy pequeña (65 likes, 50 downloads)
- Mantenimiento incierto
- Pub points bajos (90/160)
- Documentación limitada
- **NO RECOMENDADO para producción**

---

### 9. macos_ui

**📦 Paquete:** `macos_ui` (v2.2.2)

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/macos_ui>
- Homepage: <https://macosui.dev>
- Repository: <https://github.com/GroovinChip/macos_ui>
- Publisher: macosui.dev

**📊 Estadísticas:**

- ⭐ Likes: 1,027
- 📥 Downloads: 26,595
- 🏆 Pub Points: 160/160

**📝 ¿Qué hace?**
Widgets y temas Flutter que implementan el actual lenguaje de diseño de macOS.

**💡 Utilidad:**
Permite crear aplicaciones Flutter que se ven y sienten nativas en macOS, siguiendo las Human Interface Guidelines de Apple.

**🎯 ¿En qué casos podría usarse?**

- Apps de escritorio para macOS
- Aplicaciones que buscan look nativo en Mac
- Herramientas de productividad para macOS
- Apps cross-platform con UI nativa por plataforma

**🎁 ¿Qué ofrece el paquete?**

- Widgets nativos de macOS
- MacosWindow, MacosScaffold
- MacosSearchField, MacosSwitch
- Theming macOS completo
- Modo oscuro/claro
- Sidebar navigation
- Toolbar, Sheets, Alerts

**❌ ¿Cuándo NO usarlo?**

- Apps solo móviles
- Proyectos que no targetean macOS
- Cuando se necesita UI consistente cross-platform

**🏗️ ¿Qué tanto modifica la estructura del proyecto?**

- Modificación: **Alta**
- Reemplaza widgets Material/Cupertino
- Requiere adopción de paradigma macOS
- Cambios significativos en UI

**🔧 ¿Qué necesito tener listo antes de usarlo?**

- Proyecto enfocado en macOS
- Diseño basado en macOS HIG
- Familiaridad con UI de macOS

**🔗 ¿Con qué otros paquetes se suele combinar?**

- `appkit_ui_elements` (complementario)
- `window_manager` para gestión de ventanas
- `macos_window_utils` para customización
- State management (riverpod, bloc)

**⚠️ ¿Qué limitación importante tiene?**

- Solo para macOS desktop
- No cubre todos los widgets macOS nativos
- Requiere conocimiento de macOS design patterns
- Menos flexible que Material para customización

---

## 📊 Resumen Comparativo

### Por Categoría

#### UI Component Libraries

- **GetWidget**: Más completo (1000+ componentes)
- **shadcn_ui**: Más moderno y trending
- **fluent_ui**: Mejor para Windows desktop
- **macos_ui**: Mejor para macOS desktop

#### Loading & Progress

- **flutter_spinkit**: Estándar de industria para loaders
- **fl_chart**: Mejor para gráficos y visualizaciones

#### Image Handling

- **cached_network_image**: Estándar para imágenes de red
- **flutter_svg**: Mejor para vectores/SVG

#### Animations

- **animations**: Oficial de Flutter, mejor opción general
- **flutter_spinkit**: Específico para loading

#### Layout Utilities

- **assorted_layout_widgets**: Soluciones específicas
- **styled_widget**: Sintaxis declarativa

#### Design Systems

- **mix**: Más poderoso y completo
- **shadcn_ui**: Balance entre features y simplicidad

### Por Popularidad (Likes)

1. fl_chart: 7,037
2. cached_network_image: 6,869
3. animations: 6,764
4. flutter_slidable: 6,036
5. flutter_svg: 5,809

### Por Uso (Downloads)

1. cached_network_image: 1,720,999
2. flutter_svg: 2,659,023
3. fl_chart: 854,047
4. animations: 693,715
5. flutter_slidable: 450,958

---

## 🎯 Recomendaciones por Tipo de Proyecto

### Apps Empresariales

- GetWidget, shadcn_ui, fl_chart, animations

### E-commerce

- cached_network_image, flutter_slidable, animations, awesome_snackbar_content

### Redes Sociales

- cached_network_image, flutter_spinkit, animations, calendar_view

### Productividad

- timelines, calendar_view, flutter_slidable, awesome_snackbar_content

### Desktop (Windows)

- fluent_ui, fl_chart

### Desktop (macOS)

- macos_ui, fl_chart

### Cross-platform Native Look

- flutter_platform_widgets

---

## 📚 Referencias

- Pub.dev: <https://pub.dev>
- Flutter Packages: <https://github.com/flutter/packages>
- Flutter Community: <https://flutter.dev/community>

---

**Última actualización:** Enero 2026
**Versión:** 1.0
**Mantenido por:** Equipo de Desarrollo Flutter
