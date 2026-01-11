# 📐 STROP Mobile App - Reglas de Desarrollo

> **Versión:** 1.0
> **Última actualización:** Enero 11, 2026
> **Estado:** Obligatorio para todos los desarrolladores
> **Complemento:** Ver `STROP_MOBILE_APP.md` y `STROP_INTEGRATION.md`

---

## 📋 RESUMEN EJECUTIVO

Este documento define las **reglas técnicas obligatorias** para el desarrollo de la aplicación móvil STROP. Cada paquete listado aquí es **indispensable** y ha sido seleccionado específicamente para cumplir con los requisitos de producción de una aplicación empresarial que maneja:

- Modo offline crítico: operación completa sin conectividad de red durante actividades de construcción
- Sincronización en tiempo real: replicación bidireccional de datos mediante protocolo WebSocket de Supabase Realtime
- Gestión de estado compleja: coordinación de múltiples flujos de navegación y operaciones asíncronas concurrentes
- Manejo de imágenes pesadas: procesamiento y transmisión de hasta cinco archivos de imagen por registro de incidencia
- Autenticación multi-tenant: verificación de identidad con segregación estricta de datos por organización mediante JSON Web Tokens
- Navegación profunda con deep linking: resolución de rutas dinámicas desde notificaciones push y enlaces externos

**⚠️ IMPORTANTE:** No se permiten desviaciones de estos paquetes sin aprobación explícita del arquitecto de software.

---

## 🎯 STACK TECNOLÓGICO DEFINIDO

### Resumen Visual

```
┌──────────────────────────────────────────────────────────────────┐
│                    STROP MOBILE APP STACK                         │
│                                                                   │
│  UI Layer                 State Management          Backend       │
│  ├─ Flutter 3.35+        ├─ Bloc 9.0+              ├─ Supabase  │
│  ├─ Material Design      ├─ flutter_bloc           │   Flutter   │
│  └─ go_router 17.0+      └─ Equatable              └─ Dio 5.9+  │
│                                                                   │
│  Local Storage           Images & Media             Utilities     │
│  ├─ sqflite 2.4+         ├─ image_picker 1.2+      ├─ logger     │
│  ├─ shared_preferences   ├─ flutter_image_compress ├─ intl       │
│  └─ hive/isar (TBD)      └─ cached_network_image   └─ freezed    │
│                                                                   │
│  Permissions & Network                                           │
│  ├─ permission_handler                                           │
│  └─ connectivity_plus                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 PAQUETES OBLIGATORIOS

### 1. Navegación: `go_router`

**📦 Paquete:** `go_router: ^17.0.1`

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/go_router>
- Documentación: <https://pub.dev/documentation/go_router/latest/>
- Publisher: flutter.dev (Oficial)

**📊 Estadísticas:**

- ⭐ Likes: 5,606
- 📥 Downloads: 1,593,803
- 🏆 Pub Points: 150/160

#### ✅ Por qué es OBLIGATORIO

| Requisito STROP | Cómo lo cumple go_router |
|-----------------|--------------------------|
| **Deep linking** | URLs tipo `/incidents/:id` necesarias para notificaciones push |
| **Redirección de autenticación** | Guards que redirigen a login si no hay sesión válida |
| **Navegación por roles** | Rutas diferentes según `user_role` del JWT |
| **State restoration** | Mantiene historial de navegación tras kill de app |
| **Web compatibility** | Necesario si se migra a web en futuro |

#### 📋 Reglas de Uso

**✅ HACER:**

1. **Definición de rutas declarativas:** Configurar el router con instancia GoRouter que recibe dos parámetros críticos: refreshListenable que vincula al stream del Bloc de autenticación para reconstrucción reactiva, y una función redirect que implementa la lógica de guardias de ruta. Esta función redirect debe extraer dos propiedades del estado de autenticación: isAuthenticated para verificar sesión válida, y matchedLocation para determinar la ruta de destino actual. La lógica de redirección debe cumplir estas reglas estrictamente: si isAuthenticated es false Y la ruta de destino no es '/login', retornar '/login'; si isAuthenticated es true Y la ruta de destino es '/login', retornar '/home'; en cualquier otro caso, retornar null para permitir navegación.

2. **Registro de rutas tipadas:** Cada ruta debe registrarse mediante instancia GoRoute con tres propiedades obligatorias: path con patrón de ruta usando sintaxis de path parameters (:id), name con identificador único de la ruta en formato kebab-case, y builder que retorna el widget de la página. Para rutas con parámetros dinámicos, extraer los valores desde state.pathParameters usando el nombre del parámetro como clave y aplicar operador de aserción no-nulo si el parámetro es obligatorio.

3. **Navegación programática:** Invocar método goNamed del contexto con dos argumentos: name con el identificador de la ruta registrado anteriormente, y pathParameters con mapa que contiene pares clave-valor donde cada clave corresponde al nombre del path parameter definido en la ruta.

4. **Sincronización con estado de autenticación:** Configurar propiedad refreshListenable del GoRouter con instancia GoRouterRefreshStream que envuelve el stream del Bloc de autenticación, garantizando que cualquier emisión de nuevo estado de autenticación dispare reevaluación de la función redirect.

**❌ NO HACER:**

1. **Navegación imperativa prohibida:** Nunca invocar métodos del Navigator estándar de Flutter como push, pushReplacement o pop cuando go_router está configurado como sistema de navegación principal, ya que esto bypasea la lógica de rutas declarativas y guards de autenticación.

2. **Construcción de rutas no tipada:** Nunca invocar método go con strings literales que incluyan interpolación de variables sin validación de tipos, ya que esto elimina la seguridad de tipos en tiempo de compilación.

3. **Mezcla de sistemas de ruteo:** Nunca importar o usar simultáneamente paquetes auto_route o beamer en el mismo proyecto que usa go_router, ya que esto genera conflictos en la gestión del historial de navegación y state restoration.

#### ⚠️ Limitaciones Conocidas

- No soporta transiciones animadas complejas por defecto (usar `go_transitions` si es crítico)
- Curva de aprendizaje moderada para redirecciones complejas
- Debugging de rutas puede ser complejo

---

### 2. State Management: `bloc` + `flutter_bloc`

**📦 Paquetes:**

- `bloc: ^9.0.1`
- `flutter_bloc: ^9.1.1`

**🔗 Enlaces:**

- Pub.dev bloc: <https://pub.dev/packages/bloc>
- Pub.dev flutter_bloc: <https://pub.dev/packages/flutter_bloc>
- Publisher: fluttercommunity.dev

**📊 Estadísticas (bloc):**

- ⭐ Likes: 3,789
- 📥 Downloads: 2,873,092
- 🏆 Pub Points: 160/160

#### ✅ Por qué es OBLIGATORIO

| Requisito STROP | Cómo lo cumple Bloc |
|-----------------|---------------------|
| **Separación UI/Logic** | Business logic aislada en Blocs/Cubits |
| **Testing** | Fácil de testear sin UI (`bloc_test`) |
| **Modo offline** | Estados claros (loading, syncing, offline) |
| **Sincronización Realtime** | Streams de Supabase → Events de Bloc |
| **Arquitectura escalable** | Patrón CQRS/Event Sourcing |

#### 📋 Reglas de Uso

**✅ HACER:**

1. **Arquitectura de un Bloc por feature:** Crear una clase Bloc que extiende de `Bloc<EventType, StateType>` donde EventType representa eventos de dominio y StateType representa estados inmutables de UI. El constructor debe recibir dependencias mediante inyección de parámetros nombrados required, inicializar el estado inicial mediante super(), y registrar handlers de eventos usando método on<EventType> que vincula cada tipo de evento con su función handler correspondiente.

2. **Implementación de handlers de eventos:** Cada handler debe recibir dos parámetros: la instancia del evento y un Emitter<StateType> para emisión de estados. La lógica debe seguir estrictamente este flujo: emitir estado de carga usando emit() con status actualizado a loading, ejecutar operación de persistencia local primero mediante await a método de base de datos local, verificar propiedad isOnline del estado actual, si isOnline es true entonces ejecutar sincronización remota mediante await a cliente de Supabase, emitir estado de éxito si ambas operaciones completaron sin excepciones, capturar cualquier excepción mediante bloque catch y emitir estado de error con mensaje de excepción serializado.

3. **Provisión de Blocs en árbol de widgets:** Envolver el widget raíz o subárbol que requiere acceso al Bloc con widget BlocProvider cuya propiedad create recibe función que construye instancia del Bloc obteniendo dependencias desde contexto mediante read<DependencyType>(), y propiedad child que especifica el subárbol de widgets que tendrá acceso al Bloc mediante herencia de contexto.

4. **Construcción reactiva de UI:** Utilizar widget BlocBuilder<BlocType, StateType> con función builder que recibe contexto y estado actual, implementar lógica condicional que evalúa propiedad status del estado mediante pattern matching o getters booleanos, retornar widget LoadingIndicator cuando status.isLoading es true, retornar ErrorWidget con mensaje de estado.errorMessage cuando status.isError es true, retornar widget de contenido principal en caso contrario pasando datos desde estado.

5. **Despacho de eventos desde UI:** Obtener referencia al Bloc mediante context.read<BlocType>() sin reconstrucción de widget, invocar método add() pasando instancia del evento con todos los parámetros required completados, nunca ejecutar lógica de negocio directamente en el handler del widget.

**❌ NO HACER:**

1. **Lógica de negocio en Widgets:** Nunca implementar operaciones de persistencia, llamadas de red o transformaciones de datos dentro de clases que extienden StatefulWidget o State, ya que esto viola el principio de separación de responsabilidades y hace imposible el testing unitario de la lógica.

2. **Uso de setState para estado compartido:** Nunca utilizar método setState() del State de Flutter para actualizar datos que son consumidos por múltiples widgets o pantallas, ya que esto crea múltiples fuentes de verdad y inconsistencias de estado.

3. **Mezcla de sistemas de state management:** Nunca importar paquetes Provider o Riverpod en el mismo proyecto para gestión de estado de lógica de negocio cuando Bloc ya está configurado, ya que esto genera ambigüedad arquitectónica y complejidad innecesaria.

**🧪 Testing Obligatorio:**

Para cada Bloc, crear archivo de test que utiliza función blocTest del paquete bloc_test. La función debe recibir descripción del caso de prueba, callback build que retorna instancia del Bloc con dependencias mockeadas mediante when/thenAnswer de Mocktail, callback act que despacha el evento a probar, y callback expect que retorna lista ordenada de estados esperados que deben emitirse secuencialmente. Cada estado en la lista expect debe especificar valores exactos de todas las propiedades relevantes, especialmente status y datos de dominio.

---

### 3. HTTP Client: `dio`

**📦 Paquete:** `dio: ^5.9.0`

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/dio>
- Repository: <https://github.com/cfug/dio>
- Publisher: flutter.cn

**📊 Estadísticas:**

- ⭐ Likes: 8,211
- 📥 Downloads: 1,761,677
- 🏆 Pub Points: 160/160

#### ✅ Por qué es OBLIGATORIO

| Requisito STROP | Cómo lo cumple Dio |
|-----------------|---------------------|
| **Interceptors** | JWT automático en headers, refresh token |
| **Retry logic** | Reintentos automáticos si falla upload |
| **File upload** | Resumable upload de fotos (5MB cada una) |
| **Logging** | Pretty logs con `pretty_dio_logger` |
| **Cancelación** | Cancelar uploads si usuario cierra pantalla |

#### 📋 Reglas de Uso

**✅ HACER:**

1. **Configuración de instancia singleton:** Crear clase DioClient que implementa patrón Singleton mediante campo estático privado _instance, factory constructor que retorna siempre la misma instancia, y constructor privado_internal() que inicializa la instancia de Dio con BaseOptions. Las BaseOptions deben especificar baseUrl con URL del servicio de Supabase, connectTimeout y receiveTimeout con Duration de 30 segundos cada uno, y headers con mapa que contiene 'Content-Type' con valor 'application/json' y 'apikey' con clave anónima de Supabase.

2. **Interceptor de autenticación:** Agregar interceptor mediante dio.interceptors.add() pasando InterceptorsWrapper con dos callbacks: onRequest que extrae el access token actual del usuario mediante llamada asíncrona a método que obtiene la sesión de Supabase, si el token existe entonces agrega header 'Authorization' con valor 'Bearer {token}', y procede con handler.next(); onError que verifica si el código de status de response es exactamente 401, si es cierto entonces ejecuta flujo de refresh de token, reintenta la request original mediante await _retry(), y resuelve la request con handler.resolve(), si el error no es 401 entonces procede con handler.next().

3. **Interceptor de logging:** Agregar PrettyDioLogger a la lista de interceptors únicamente cuando kDebugMode es true, configurando las propiedades requestHeader, requestBody, responseBody y error todas como true para logging completo durante desarrollo. En modo release, este interceptor no debe estar presente para evitar logging de datos sensibles.

4. **Upload de archivos con progreso:** Construir instancia de FormData mediante FormData.fromMap() con mapa que contiene clave 'file' y valor creado mediante await MultipartFile.fromFile() pasando la ruta absoluta del archivo y filename extraído del path. Ejecutar POST request mediante dio.post() con la ruta del endpoint de storage, data con el FormData construido, y callback onSendProgress que recibe bytes enviados y total, calcula porcentaje de progreso mediante división sent/total multiplicado por 100, y emite el progreso al sistema de UI.

**❌ NO HACER:**

1. **Uso del paquete http:** Nunca importar ni utilizar el paquete http de Dart para requests HTTP en este proyecto, ya que carece de interceptors, manejo automático de retry, y capacidades de upload con progreso que son críticas para los requisitos de STROP.

2. **Múltiples instancias de Dio:** Nunca crear múltiples instancias de Dio mediante constructores directos en diferentes partes del código, ya que esto fragmenta la configuración de interceptors y headers globales.

3. **Tokens hardcodeados:** Nunca establecer token de autorización directamente en options.headers sin implementar lógica de refresh, ya que los JWT tienen expiración temporal y requieren renovación automática al llegar a tiempo de expiración.

**🔌 Interceptors Requeridos:**

Todo proyecto debe incluir obligatoriamente cuatro interceptors en este orden de ejecución: AuthInterceptor para inyección automática de JWT en header Authorization de cada request saliente; RetryInterceptor para reintentar automáticamente requests que fallan debido a errores de red temporal con backoff exponencial; LoggerInterceptor para registro de requests y responses únicamente en builds de desarrollo; CacheInterceptor opcional para almacenar responses de requests GET en caché local y reducir llamadas redundantes a servidor.

#### 📦 Paquetes Complementarios

- `pretty_dio_logger: ^1.4.0` - Logs legibles
- `dio_cache_interceptor: ^4.0.5` - Caché de requests (opcional)

---

### 4. Backend Client: `supabase_flutter`

**📦 Paquete:** `supabase_flutter: ^2.12.0`

**🔗 Enlaces:**

- Pub.dev: <https://pub.dev/packages/supabase_flutter>
- Documentation: <https://supabase.com/docs/reference/dart/introduction>
- Publisher: supabase.io (Oficial)

**📊 Estadísticas:**

- ⭐ Likes: 914
- 📥 Downloads: 285,701
- 🏆 Pub Points: 140/160

#### ✅ Por qué es OBLIGATORIO

| Requisito STROP | Cómo lo cumple Supabase |
|-----------------|-------------------------|
| **Autenticación** | Auth completo con JWT y custom claims |
| **Database** | PostgreSQL con RLS (Row Level Security) |
| **Storage** | Upload de fotos con signed URLs |
| **Realtime** | Suscripción a cambios de DB (comentarios) |
| **Edge Functions** | Push notifications (futuro) |

#### 📋 Reglas de Uso

**✅ HACER:**

1. **Inicialización temprana:** Invocar await Supabase.initialize() en función main() después de WidgetsFlutterBinding.ensureInitialized() y antes de runApp(). Pasar argumentos obligatorios url con URL del proyecto de Supabase, anonKey con clave pública anónima del proyecto, authOptions con FlutterAuthClientOptions donde authFlowType está configurado como AuthFlowType.pkce para seguridad PKCE y localStorage con implementación de SecureLocalStorage para almacenamiento cifrado de tokens, y realtimeClientOptions con RealtimeClientOptions donde logLevel está configurado según nivel de verbosidad requerido.

2. **Acceso al cliente mediante singleton:** Obtener referencia al cliente de Supabase mediante propiedad estática Supabase.instance.client en cualquier parte del código donde se requiera ejecutar operaciones de autenticación, database, storage o realtime. Nunca crear nuevas instancias de SupabaseClient manualmente.

3. **Autenticación con credenciales:** Ejecutar await supabase.auth.signInWithPassword() pasando map con claves email y password. El método retorna AuthResponse que contiene session con datos de sesión incluyendo accessToken, refreshToken y user con datos del usuario autenticado. Almacenar tokens de forma segura mediante el sistema de localStorage configurado en la inicialización.

4. **Suscripción a cambios de autenticación:** Registrar listener al stream supabase.auth.onAuthStateChange mediante método listen() que recibe callback con parámetro data. Extraer propiedad event de tipo AuthChangeEvent y session de tipo Session nullable. Implementar lógica condicional que evalúa si event es exactamente AuthChangeEvent.signedIn para ejecutar lógica de usuario autenticado (extrayendo userId de session.user.id y orgId de session.user.userMetadata con clave 'org_id'), o si event es AuthChangeEvent.signedOut para ejecutar lógica de limpieza de sesión local.

5. **Queries con filtros de seguridad:** Construir query mediante supabase.from('nombre_tabla').select() con patrón de columnas a seleccionar incluyendo relaciones mediante sintaxis 'tabla_principal, tabla_relacionada(columnas)'. Aplicar filtros mediante métodos eq() pasando nombre de columna y valor exacto a filtrar, método order() para ordenamiento especificando columna y ascending booleano, y método limit() para limitar cantidad de resultados. Siempre incluir filtro eq('org_id', orgId) o columna equivalente de tenant para segregación de datos multi-tenant.

6. **Suscripción Realtime a cambios de base de datos:** Crear canal mediante supabase.channel('identificador-único') encadenando método onPostgresChanges() con parámetros event configurado como PostgresChangeEvent.insert para inserciones (o .update/.delete según necesidad), schema con valor 'public', table con nombre exacto de tabla, filter con PostgresChangeFilter donde type es PostgresChangeFilterType.eq, column especifica la columna a filtrar y value el valor exacto del filtro (ej. projectId específico), y callback que recibe payload con propiedad newRecord conteniendo el registro insertado serializado como Map. Finalizar con método subscribe() para activar la suscripción.

7. **Upload de archivos a Storage:** Crear ruta de archivo con estructura jerárquica '{orgId}/{projectId}/{entityId}/{filename}' donde filename incluye UUID v4 para unicidad. Ejecutar await supabase.storage.from('nombre-bucket').upload() pasando la ruta completa y instancia de File del sistema, con fileOptions configurado como FileOptions donde cacheControl especifica segundos de caché HTTP y upsert como false para evitar sobrescritura accidental.

8. **Generación de URLs firmadas:** Obtener URL temporal mediante await supabase.storage.from('nombre-bucket').createSignedUrl() pasando ruta completa del archivo y duración de validez en segundos. La URL retornada expira automáticamente después del tiempo especificado garantizando seguridad temporal.

**❌ NO HACER:**

1. **Manejo inadecuado de errores de autenticación:** Nunca ignorar excepciones lanzadas por métodos de autenticación mediante bloques try-catch vacíos o sin logging, ya que errores de credenciales incorrectas, usuarios desactivados, o problemas de red deben comunicarse al usuario.

2. **Almacenamiento inseguro de credenciales:** Nunca guardar contraseñas de usuario en SharedPreferences, SQLite sin cifrado, o cualquier almacenamiento de texto plano, ya que esto viola principios básicos de seguridad de aplicaciones móviles.

3. **Queries sin filtros de tenant:** Nunca ejecutar queries select() sin incluir filtro eq() que restrinja los resultados al org_id o identificador de organización del usuario actual, ya que esto puede exponer datos de otras organizaciones violando aislamiento multi-tenant.

4. **Falta de limpieza de suscripciones:** Nunca olvidar invocar channel.unsubscribe() en método dispose() de StatefulWidget o clausura de Bloc, ya que suscripciones activas consumen recursos de red y pueden causar memory leaks.

**🔐 Seguridad Crítica:**

1. La clave service_role de Supabase nunca debe incluirse en código de aplicación móvil ni en archivos de configuración comiteados a repositorio, ya que otorga acceso administrativo total sin restricciones de RLS.

2. Todas las tablas de PostgreSQL deben tener políticas de Row Level Security (RLS) activas que verifiquen propiedad org_id contra custom claim del JWT antes de permitir acceso a filas.

3. Toda lógica de seguridad multi-tenant debe validar que auth.uid() del usuario coincida con propietario del recurso Y que org_id del recurso coincida con org_id del custom claim en el JWT.

4. Nunca almacenar accessToken o refreshToken en SharedPreferences sin implementación de cifrado AES-256, preferir siempre flutter_secure_storage o sistema de localStorage con cifrado.

---

### 5. Manejo de Imágenes: `image_picker` + `flutter_image_compress`

**📦 Paquetes:**

- `image_picker: ^1.2.1`
- `flutter_image_compress: ^2.4.0`

**🔗 Enlaces:**

- image_picker: <https://pub.dev/packages/image_picker> (Oficial Flutter)
- flutter_image_compress: <https://pub.dev/packages/flutter_image_compress>

**📊 Estadísticas:**

- image_picker: 7,659 likes, 1,846,824 downloads
- flutter_image_compress: 1,775 likes, 423,849 downloads

#### ✅ Por qué son OBLIGATORIOS

| Requisito STROP | Cómo lo cumplen |
|-----------------|-----------------|
| **Captura de fotos** | Cámara nativa + galería |
| **Compresión crítica** | Reducir 5MB → 200KB por foto |
| **Modo offline** | Guardar en cache antes de subir |
| **UX rápida** | Usuario no espera subidas lentas |

#### 📋 Reglas de Uso

**✅ HACER:**

1. **Verificación de permisos previa:** Antes de invocar cualquier método de ImagePicker que acceda a cámara o galería, ejecutar await Permission.camera.request() o Permission.photos.request() según corresponda. Evaluar el resultado mediante propiedad isGranted, si es false entonces mostrar diálogo explicativo al usuario indicando que el permiso es requerido para continuar y abortar el flujo de captura.

2. **Captura de foto con configuración óptima:** Invocar await ImagePicker().pickImage() con parámetros source configurado como ImageSource.camera para captura directa desde cámara nativa, imageQuality con valor 100 para capturar en calidad máxima (la compresión se realizará posteriormente), y preferredCameraDevice como CameraDevice.rear para usar cámara trasera por defecto. El método retorna XFile nullable que representa la foto capturada o null si usuario canceló.

3. **Compresión obligatoria de imágenes:** Para cada archivo de imagen obtenido de ImagePicker, ejecutar función de compresión que debe: obtener directorio temporal del sistema mediante await getTemporaryDirectory(), construir ruta de destino concatenando dir.path con UUID v4 y extensión .jpg, ejecutar await FlutterImageCompress.compressAndGetFile() con parámetros de ruta de origen (file.absolute.path), ruta de destino, quality configurado en 80 para balance entre calidad visual y reducción de tamaño, minWidth y minHeight configurados en 1920 para limitar resolución máxima, y format como CompressFormat.jpeg. Verificar que el archivo comprimido retornado no sea null y que su tamaño mediante length() sea menor a 5 megabytes (5 *1024* 1024 bytes), lanzar excepción si excede este límite.

4. **Selección múltiple con límite estricto:** Invocar await ImagePicker().pickMultiImage() con parámetros imageQuality en 100 y limit configurado exactamente en 5 para aplicar restricción de máximo cinco imágenes según especificación del sistema. Después de obtener la lista de XFile, verificar programáticamente que length sea menor o igual a 5, lanzar excepción si excede. Iterar sobre cada XFile y aplicar función de compresión descrita anteriormente, acumulando archivos comprimidos en lista de resultados.

**❌ NO HACER:**

1. **Upload sin compresión:** Nunca ejecutar operaciones de upload de imágenes a backend o storage pasando directamente el File obtenido de XFile.path sin haber ejecutado previamente el proceso de compresión, ya que imágenes de cámaras modernas pueden exceder 5-10 MB y consumir excesivo ancho de banda.

2. **Omisión de límite de cantidad:** Nunca invocar pickMultiImage() sin especificar parámetro limit o con valor mayor a 5, ya que la especificación de STROP define estrictamente un máximo de cinco fotos por incidencia para controlar tamaño total de datos.

3. **Ignorar errores de permisos:** Nunca proceder a invocar ImagePicker sin verificar previamente que los permisos de cámara o fotos fueron otorgados mediante status.isGranted, ya que esto causará excepciones no manejadas o comportamiento indefinido en la plataforma nativa.

**📊 Métricas de Compresión Esperadas:**

El proceso de compresión configurado con quality 80 y resolución máxima 1920px debe producir los siguientes resultados aproximados: imagen original de 5.2 MB capturada por cámara de 12 megapíxeles se comprime a aproximadamente 200 KB logrando reducción del 96% en tiempo de procesamiento de 500 milisegundos; imagen de 3.8 MB de cámara de 8 megapíxeles se comprime a 150 KB con reducción del 96% en 350 milisegundos; imagen de 2.1 MB de cámara de 6 megapíxeles se comprime a 100 KB con reducción del 95% en 200 milisegundos.

---

### 6. Storage Local: `sqflite` + `shared_preferences`

**📦 Paquetes:**

- `sqflite: ^2.4.2`
- `shared_preferences: ^2.5.4`

**🔗 Enlaces:**

- sqflite: <https://pub.dev/packages/sqflite>
- shared_preferences: <https://pub.dev/packages/shared_preferences> (Oficial)

**📊 Estadísticas:**

- sqflite: 5,490 likes, 1,782,412 downloads
- shared_preferences: 10,417 likes, 3,048,326 downloads

#### ✅ Por qué son OBLIGATORIOS

| Requisito STROP | Cómo lo cumplen |
|-----------------|-----------------|
| **Modo offline** | SQLite almacena incidencias sin conexión |
| **Sincronización** | Queue de operaciones pendientes |
| **Cache** | Datos de proyectos y usuarios |
| **Preferencias** | Tema, proyecto seleccionado, tokens |

#### 📋 Reglas de Uso

**sqflite - Base de Datos Local:**

1. **Implementación de singleton para acceso a base de datos:** Crear clase LocalDatabase que implementa patrón Singleton mediante campo estático privado _instance, factory constructor que retorna la instancia única, y campo estático nullable_database de tipo Database. Implementar getter asíncrono database que verifica si _database no es null para retornarla directamente, o invoca await_initDatabase() para inicialización lazy y almacena resultado en _database antes de retornar.

2. **Inicialización de base de datos:** Implementar método _initDatabase() que obtiene ruta del directorio de bases de datos mediante await getDatabasesPath(), construye path completa usando join() con nombre de archivo 'strop_local.db', y ejecuta await openDatabase() con parámetros path construida, version con número entero que incrementa en cada migración de esquema, onCreate con callback que recibe Database y version para crear esquema inicial, y onUpgrade con callback para migraciones entre versiones.

3. **Definición de esquema con tablas de sincronización:** El callback onCreate debe ejecutar múltiples sentencias CREATE TABLE mediante db.execute(). Tabla pending_incidents debe tener columnas: id TEXT PRIMARY KEY para identificador único, project_id TEXT NOT NULL para proyecto asociado, type TEXT NOT NULL para tipo de incidencia, description TEXT NOT NULL para descripción, priority TEXT NOT NULL para nivel de prioridad, created_at INTEGER NOT NULL para timestamp en Unix epoch, synced INTEGER DEFAULT 0 como bandera booleana de sincronización (0=no sincronizado, 1=sincronizado), retry_count INTEGER DEFAULT 0 para contador de reintentos fallidos. Tabla pending_photos debe tener: id TEXT PRIMARY KEY, incident_id TEXT NOT NULL, local_path TEXT NOT NULL para ruta en sistema de archivos, uploaded INTEGER DEFAULT 0 como bandera de upload completado, retry_count INTEGER DEFAULT 0, y FOREIGN KEY (incident_id) REFERENCES pending_incidents (id) para integridad referencial.

4. **Creación de índices para optimización:** Después de crear tablas, ejecutar db.execute() para crear índices mediante CREATE INDEX idx_synced ON pending_incidents(synced) para acelerar queries que filtran por registros no sincronizados, y CREATE INDEX idx_uploaded ON pending_photos(uploaded) para queries de fotos pendientes de upload.

5. **Inserción de registros pendientes de sincronización:** Implementar método insertPendingIncident que recibe Map<String, dynamic> con datos de incidencia, obtiene referencia a database mediante await database, y ejecuta await db.insert() con nombre de tabla 'pending_incidents', mapa de datos extendido mediante spread operator para incluir propiedades originales más synced configurado en 0 y retry_count en 0.

6. **Consulta de registros pendientes:** Implementar método getPendingIncidents que ejecuta await db.query() con tabla 'pending_incidents', cláusula where con string 'synced = ?', whereArgs con lista conteniendo [0] para filtrar estrictamente registros donde synced sea exactamente 0, y orderBy configurado como 'created_at ASC' para procesar en orden cronológico de creación.

**shared_preferences - Preferencias de Usuario:**

1. **Wrapper type-safe para preferencias:** Crear clase UserPreferences que recibe instancia de SharedPreferences mediante constructor, define constantes privadas para keys como _keySelectedProjectId,_keyThemeMode, _keyUserId,_keyOrgId. Implementar getters que invocan _prefs.getString() con la key correspondiente retornando tipo nullable, y métodos setters asíncronos que invocan await_prefs.setString() para persistir valores.

2. **Conversión de tipos complejos:** Para preferencias de enums como ThemeMode, implementar getter que: obtiene string mediante _prefs.getString(), usa ThemeMode.values.firstWhere() con predicado que compara e.name con el valor obtenido, y orElse que retorna ThemeMode.system como default si no hay coincidencia. El setter debe invocar await_prefs.setString() pasando mode.name para serializar el enum a string.

3. **Método de limpieza completa:** Implementar método clear() asíncrono que ejecuta await _prefs.clear() para eliminar todas las preferencias almacenadas, útil durante logout de usuario.

**❌ NO HACER:**

1. **Almacenamiento de datos sensibles sin cifrado:** Nunca invocar prefs.setString() o métodos similares de SharedPreferences para almacenar contraseñas de usuario, access tokens, refresh tokens, o cualquier credencial sensible, ya que SharedPreferences almacena datos en texto plano accesible por otras apps con permisos root. Usar exclusivamente flutter_secure_storage para datos sensibles.

2. **Queries SQL con interpolación directa:** Nunca construir queries mediante rawQuery() concatenando variables directamente en el string SQL como 'SELECT * FROM incidents WHERE id = $id', ya que esto crea vulnerabilidad de SQL injection. Siempre usar prepared statements con placeholders ? y lista de whereArgs.

3. **Falta de gestión de ciclo de vida de database:** Nunca crear múltiples instancias de Database mediante llamadas repetidas a openDatabase(), y nunca invocar close() en la instancia singleton durante ejecución de app, ya que la base de datos debe permanecer abierta para acceso rápido y cerrarse automáticamente cuando el proceso termina.

**🔄 Estrategia de Sincronización:**

Implementar función syncPendingIncidents que: obtiene lista de registros pendientes mediante await localDb.getPendingIncidents(), itera sobre cada registro con ciclo for, dentro del ciclo ejecuta bloque try que intenta await supabase.from('incidents').insert() con datos del registro, si la inserción es exitosa entonces invoca await localDb.markAsSynced() con el id del registro para actualizar synced a 1, y después ejecuta await syncPendingPhotos() pasando el incident_id para subir fotos asociadas. En bloque catch, incrementar retry_count mediante await localDb.incrementRetryCount(), y si retry_count alcanza valor de 3 entonces mostrar notificación al usuario indicando fallo persistente de sincronización.

---

### 7. Utilidades Esenciales

#### `equatable` - Comparación de Objetos

**📦 Paquete:** `equatable: ^2.0.8`

**Por qué:** Simplifica comparación de estados en Bloc sin override manual de operadores de igualdad y hashCode.

**Implementación:** Toda clase de estado de Bloc debe extender de Equatable e implementar getter props que retorna lista de todas las propiedades que participan en la comparación de igualdad. El framework automáticamente genera implementación de operador == que compara elemento por elemento de la lista props, y hashCode basado en combinación hash de todos los elementos. Implementar método copyWith que recibe parámetros opcionales nullable para cada propiedad del estado y retorna nueva instancia usando operador ?? para preservar valores no modificados.

---

#### `freezed` - Code Generation (Opcional pero Recomendado)

**📦 Paquetes:**

- `freezed: ^3.2.4` (dev_dependencies)
- `freezed_annotation: ^3.1.0` (dependencies)

**Por qué:** Genera automáticamente implementación de copyWith, toJson, fromJson, toString, y union types mediante generación de código en tiempo de build.

**Implementación:** Anotar clases de datos con @freezed, usar sintaxis factory constructor con parámetros nombrados required para propiedades obligatorias y nullable para opcionales, sufijo de nombre con guion bajo en clase generada como `_$ClassName`. Ejecutar build_runner mediante comando `flutter pub run build_runner build` para generar archivos `.freezed.dart` que contienen implementaciones concretas. Para serialización JSON, agregar factory constructor adicional con sintaxis `factory ClassName.fromJson(Map<String, dynamic> json) => _$ClassNameFromJson(json)`.

---

#### `logger` - Logging

**📦 Paquete:** `logger: ^2.6.2`

**Por qué:** Logs estructurados y legibles con niveles de severidad, crítico para debugging en producción y desarrollo.

**Configuración:** Crear instancia global de Logger con PrettyPrinter configurado mediante methodCount con valor 2 para mostrar dos niveles de call stack, errorMethodCount con valor 8 para errores profundos, lineLength de 120 caracteres, colors true para output colorizado, printEmojis true para íconos visuales. Configurar nivel de logging mediante level que debe ser Level.debug cuando kDebugMode es true y Level.warning o Level.error en builds de producción.

**Uso en código:** Invocar logger.d() para mensajes de debug durante desarrollo con información de flujo de ejecución, logger.w() para warnings que indican condiciones anómalas pero recuperables, logger.e() para errores que recibe tres argumentos: mensaje descriptivo, objeto de error, y StackTrace para debugging completo.

---

#### `connectivity_plus` - Estado de Red

**📦 Paquete:** `connectivity_plus: ^7.0.0`

**Por qué:** Detectar cambios de conectividad de red para activar modo offline/online y disparar sincronización automática.

**Implementación:** Registrar listener al stream Connectivity().onConnectivityChanged mediante listen() que recibe callback con parámetro result de tipo ConnectivityResult. Evaluar si result es exactamente ConnectivityResult.none para disparar evento al SyncBloc indicando modo offline mediante OfflineModeEnabled, o si result es wifi/mobile entonces disparar OnlineModeEnabled seguido inmediatamente de SyncPendingData para intentar sincronizar datos que quedaron pendientes durante desconexión.

---

#### `permission_handler` - Permisos

**📦 Paquete:** `permission_handler: ^12.0.1`

**Por qué:** Manejo unificado de permisos del sistema operativo incluyendo cámara, almacenamiento, y ubicación mediante API consistente cross-platform.

**Implementación:** Construir lista de Permission requeridos como [Permission.camera, Permission.photos, Permission.location], invocar método request() que retorna Map<Permission, PermissionStatus>, verificar que todos los valores del map cumplan status.isGranted mediante método every(). Si algún permiso es denegado permanentemente mediante isPermanentlyDenied, mostrar diálogo que guíe al usuario a Settings de la aplicación mediante openAppSettings().

---

## 🚫 PAQUETES PROHIBIDOS

### ❌ NUNCA Usar

| Paquete | Razón de Prohibición | Alternativa |
|---------|----------------------|-------------|
| `provider` | Inferior a Bloc para lógica compleja | `flutter_bloc` |
| `get_it` sin Bloc | Sin separación UI/Logic | `flutter_bloc` + DI manual |
| `auto_route` | Conflicta con go_router | `go_router` |
| `beamer` | Menos soporte que go_router | `go_router` |
| `http` | Menos features que Dio | `dio` |
| `flutter_secure_storage` sin validación | Problemas en Android 6 | Validar versión OS primero |
| `hive` sin análisis | Alternativa válida a sqflite pero requiere evaluación | TBD según caso de uso |

---

## 📐 ARQUITECTURA DE CARPETAS OBLIGATORIA

```
lib/
├── main.dart
├── app/
│   ├── app.dart                  # MaterialApp + Router
│   └── di/                       # Dependency Injection
│       └── service_locator.dart
├── core/
│   ├── constants/
│   │   ├── supabase_config.dart
│   │   └── app_constants.dart
│   ├── errors/
│   │   └── failures.dart
│   ├── network/
│   │   ├── dio_client.dart
│   │   └── network_info.dart
│   └── utils/
│       ├── logger.dart
│       └── validators.dart
├── data/
│   ├── datasources/
│   │   ├── local/
│   │   │   ├── local_database.dart
│   │   │   └── user_preferences.dart
│   │   └── remote/
│   │       ├── supabase_client.dart
│   │       └── dio_client.dart
│   ├── models/
│   │   ├── incident_model.dart
│   │   ├── photo_model.dart
│   │   └── comment_model.dart
│   └── repositories/
│       ├── incident_repository_impl.dart
│       ├── photo_repository_impl.dart
│       └── auth_repository_impl.dart
├── domain/
│   ├── entities/
│   │   ├── incident.dart
│   │   ├── photo.dart
│   │   └── user.dart
│   ├── repositories/
│   │   ├── incident_repository.dart
│   │   ├── photo_repository.dart
│   │   └── auth_repository.dart
│   └── usecases/
│       ├── create_incident_usecase.dart
│       ├── sync_pending_incidents_usecase.dart
│       └── upload_photo_usecase.dart
├── presentation/
│   ├── auth/
│   │   ├── bloc/
│   │   │   ├── auth_bloc.dart
│   │   │   ├── auth_event.dart
│   │   │   └── auth_state.dart
│   │   └── pages/
│   │       └── login_page.dart
│   ├── incidents/
│   │   ├── bloc/
│   │   │   ├── incident_bloc.dart
│   │   │   ├── incident_event.dart
│   │   │   └── incident_state.dart
│   │   ├── pages/
│   │   │   ├── incident_list_page.dart
│   │   │   ├── incident_detail_page.dart
│   │   │   └── create_incident_page.dart
│   │   └── widgets/
│   │       ├── incident_card.dart
│   │       ├── photo_gallery.dart
│   │       └── comment_thread.dart
│   └── shared/
│       └── widgets/
│           ├── loading_indicator.dart
│           └── error_widget.dart
└── l10n/
    ├── app_en.arb
    └── app_es.arb
```

La estructura de directorios debe seguir arquitectura en capas separando responsabilidades entre presentación, dominio y datos:

**Capa de aplicación (app/):** Contiene configuración global de MaterialApp, sistema de ruteo mediante go_router, y dependency injection mediante service locator o provider manual.

**Capa core (core/):** Agrupa funcionalidades transversales incluyendo constants/ para configuración de Supabase y constantes de aplicación, errors/ para definición de clases Failure que representan fallos de dominio, network/ para implementación de DioClient y NetworkInfo que verifica conectividad, y utils/ para funciones de logging y validación.

**Capa de datos (data/):** Implementa fuentes de datos y repositorios concretos organizados en datasources/ con subdirectorios local/ conteniendo LocalDatabase y UserPreferences, y remote/ conteniendo clientes de Supabase y Dio; models/ conteniendo clases de datos con serialización toJson/fromJson para incident_model, photo_model y comment_model; repositories/ conteniendo implementaciones concretas de repositorios que coordinan datasources locales y remotos.

**Capa de dominio (domain/):** Define contratos y lógica de negocio mediante entities/ que contiene modelos de dominio puros sin dependencias de framework, repositories/ con interfaces abstractas que definen contratos de acceso a datos, y usecases/ con clases que encapsulan casos de uso específicos como create_incident_usecase y sync_pending_incidents_usecase.

**Capa de presentación (presentation/):** Organizada por features donde cada feature tiene subdirectorios bloc/ conteniendo bloc, event y state de esa funcionalidad, pages/ con widgets de pantalla completa, y widgets/ con componentes reutilizables. Carpeta shared/ contiene widgets globales como loading_indicator y error_widget.

**Internacionalización (l10n/):** Contiene archivos ARB con traducciones en formato app_en.arb y app_es.arb siguiendo especificación de Flutter Intl.

Esta estructura garantiza separación de responsabilidades, testabilidad completa de cada capa, y escalabilidad para múltiples features sin acoplamiento.

---

## 🧪 TESTING OBLIGATORIO

### Tipos de Tests Requeridos

#### 1. Unit Tests (Cobertura Mínima: 80%)

Cada usecase y método de repositorio debe tener test unitario correspondiente que sigue este flujo: crear instancias mock de dependencias mediante clases Mock generadas por Mocktail, configurar comportamiento esperado mediante when() con matchers como any() que define valor de retorno usando thenAnswer() para operaciones asíncronas, invocar el método bajo prueba pasando argumentos de test, verificar resultado mediante expect() comparando con valor esperado usando matcher Right() para success cases de Either, y verificar interacción mediante verify() que confirma que el método del mock fue llamado exactamente el número de veces esperado.

---

#### 2. Bloc Tests

Todo Bloc debe tener suite de tests usando función blocTest del paquete bloc_test que valida transiciones de estado. La función recibe descripción del escenario, callback build que retorna instancia del Bloc con repositorios mockeados donde se configura comportamiento mediante when/thenAnswer, callback act que despacha el evento a probar mediante add(), y callback expect que retorna lista secuencial de estados que el Bloc debe emitir en respuesta al evento. Verificar que estados incluyan valores exactos de propiedades incluyendo status, datos de dominio, y errorMessage cuando aplique.

---

#### 3. Widget Tests

Cada widget custom debe tener test que verifica renderizado correcto de propiedades y comportamiento de interacciones. El test invoca await tester.pumpWidget() envolviendo el widget bajo prueba en MaterialApp y Scaffold para contexto completo, utiliza expect() con find.text() para verificar que textos esperados aparecen exactamente una vez mediante findsOneWidget, find.byIcon() para verificar presencia de íconos específicos, y tester.tap() seguido de tester.pump() para simular interacciones y verificar cambios de estado visual.

---

## 📊 MÉTRICAS DE CALIDAD OBLIGATORIAS

### Code Coverage

El proyecto debe mantener cobertura mínima de código del 80% medida mediante herramienta de coverage de Flutter, con objetivo aspiracional del 90% de cobertura. Ejecutar medición mediante comando `flutter test --coverage` que genera reporte lcov.info en directorio coverage/. Verificar cumplimiento extrayendo porcentaje del reporte mediante grep y validando que el valor sea mayor o igual a 80.0.

### Performance

**App startup time:** Tiempo desde tap en ícono hasta primera interacción útil debe ser menor a 3 segundos, medido en dispositivos de gama media mediante Flutter DevTools con flamegraph de startup.

**Frame rendering:** Aplicación debe mantener 60 fotogramas por segundo durante scrolling de listas y transiciones de navegación, sin frames perdidos (jank). Verificar mediante Flutter Inspector en modo Profile build, vigilando que timeline no muestre barras rojas que indican frames que excedieron 16ms.

**Bundle size Android:** Archivo APK en modo release con splits habilitados no debe exceder 40 megabytes de tamaño comprimido. Medir mediante comando `flutter build apk --analyze-size` que genera árbol de tamaño de bundle desglosando contribución de cada dependencia.

**Bundle size iOS:** Archivo IPA en modo release no debe exceder 50 megabytes excluyendo bitcode. Medir mediante `flutter build ios --analyze-size` después de compilación en modo release.

### Code Quality

**Linter:** Todo el código debe pasar análisis estático de very_good_analysis paquete versión 10.0.0 o superior, sin warnings ni errors permitidos. Ejecutar mediante `flutter analyze` antes de cada commit.

**Formato:** Aplicar formato automático de Dart mediante comando `dart format .` en directorio raíz del proyecto antes de cada commit, asegurando consistencia de estilo de código entre todos los desarrolladores.

**Análisis estático:** El comando `flutter analyze` no debe reportar ningún error ni warning en el output. Resolver todos los issues reportados antes de merge a rama main.

**Null safety:** Todos los archivos Dart del proyecto deben usar null safety completo, sin opt-out mediante comentarios de language version. Verificar que pubspec.yaml especifica SDK constraint mayor o igual a 2.12.0.

---

## RECURSOS ADICIONALES

### Documentación Oficial

- [Flutter Docs](https://docs.flutter.dev/)
- [Bloc Library](https://bloclibrary.dev/)
- [go_router Documentation](https://pub.dev/documentation/go_router/latest/)
- [Supabase Flutter Docs](https://supabase.com/docs/reference/dart/introduction)

### Tutoriales Recomendados

- [Offline-first architecture with Flutter](https://docs.flutter.dev/cookbook/persistence)
- [BLoC pattern implementation](https://bloclibrary.dev/tutorials/flutter-todos/)
- [Supabase Flutter Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/flutter)

---

## ✅ CHECKLIST DE CUMPLIMIENTO

Antes de hacer commit, verificar:

- [ ] Todos los paquetes están en las versiones especificadas
- [ ] No se usan paquetes prohibidos
- [ ] Estructura de carpetas es correcta
- [ ] Tests tienen > 80% de cobertura
- [ ] `flutter analyze` sin errores
- [ ] `dart format .` aplicado
- [ ] Bloc tests para toda la lógica de negocio
- [ ] Imágenes comprimidas antes de upload
- [ ] Permisos solicitados correctamente
- [ ] Modo offline funciona correctamente
- [ ] Realtime subscriptions canceladas en dispose
- [ ] Secrets en `.env` y no en código

---

**Versión del documento:** 1.0  
**Mantenido por:** Arquitecto de Software  
**Última revisión:** Enero 11, 2026

**⚠️ Este documento es de cumplimiento OBLIGATORIO. Cualquier desviación requiere aprobación explícita del arquitecto de software.**
