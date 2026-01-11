# 📝 Zero-Code Documentation Transformation Prompt

## 🎯 Objetivo

Transformar documentos técnicos que contienen bloques de código en **especificaciones agnósticas de stack tecnológico** usando **prosa algorítmica precisa**. El resultado es un documento ejecutable mediante describir el flujo de datos y comportamiento exacto sin dependencias de implementación específica.

---

## 🔄 Flujo de Transformación

### 1. Lectura Completa del Documento

Leer el archivo completo indicado para entender:
- Estructura general del documento
- Cantidad y tipo de bloques de código
- Secciones que requieren transformación
- Secciones que pueden permanecer sin cambios

### 2. Criterios de Transformación

Aplicar estas reglas OBLIGATORIAS a cada bloque de código:

#### ✅ PRESERVACIÓN DE LÓGICA EXACTA

**Nunca simplificar** la descripción algorítmica. Mantener precisión técnica nivel machine-readable:

| Código Dice | ❌ INCORRECTO | ✅ CORRECTO |
|------------|--|--|
| `filter: priority=CRITICAL` | "Filtra cosas importantes" | "Filtra estrictamente entidades donde el atributo prioridad tiene valor exacto CRITICAL" |
| `if (!auth)` | "Si no está autenticado" | "Si la propiedad de estado isAuthenticated es false" |
| `await db.insert()` | "Guarda en la base de datos" | "Ejecuta operación asíncrona de inserción que agrega nueva fila a tabla especificada" |
| `jwt.verify()` | "Valida el token" | "Verifica firma criptográfica del token JWT contra clave pública y valida claims de expiración y audiencia" |

#### 🔀 TRANSFORMACIÓN DE CÓDIGO A PROSA

Cada bloque de código debe convertirse en **descripción paso a paso de flujo de datos**:

**Patrón de Transformación:**

```
CÓDIGO ORIGINAL:
router = createRouter({
  redirect: (state) => {
    if (!auth.isLoggedIn) return '/login'
    if (auth.isLoggedIn && state.path === '/login') return '/home'
  }
})

PROSA TRANSFORMADA:
Crear instancia de router con función redirect que recibe estado actual que contiene path. 
Evaluación condicional: si propiedad isLoggedIn del estado de autenticación es false Y la 
ruta destino no es exactamente '/login', entonces retornar ruta alternativa '/login'. 
Segunda evaluación condicional: si isLoggedIn es true Y la ruta destino es exactamente 
'/login', entonces retornar ruta alternativa '/home'. Si ninguna condición de redirección 
se cumple, retornar null permitiendo navegación normal a ruta solicitada.
```

### 3. Instrucciones de Reemplazo

Para cada sección con código:

1. **Leer contexto:** Entender qué hace el bloque de código completo
2. **Describir paso a paso:** Escribir la secuencia de operaciones en prosa secuencial
3. **Especificar tipos y valores:** Mencionar tipos de datos exactos y valores concretos
4. **Explicar condicionales:** Usar "si X es exactamente Y" en lugar de abreviaturas
5. **Detallar operaciones:** Expandir operaciones compuestas en sus componentes atómicos
6. **Mantener orden:** Preservar secuencia lógica de ejecución del algoritmo

### 4. Remover Especificidad de Stack

Transformar referencias específicas a frameworks/lenguajes en conceptos agnósticos:

| Específico de Stack | Agnóstico de Stack |
|-----------|-----------|
| `await dio.post()` con headers JWT | "Ejecutar solicitud HTTP POST asíncrona con autenticación mediante token" |
| `supabase.from('tabla').select()` | "Ejecutar consulta de lectura a tabla especificada" |
| `BlocBuilder<MyBloc, MyState>` | "Widget que se reconstruye reactivamente basado en cambios de estado" |
| `@freezed class` con toJson/fromJson | "Clase de datos con igualdad por valor y serialización bidireccional" |
| `SharedPreferences.setString()` | "Persistir valor de tipo texto en almacenamiento local del dispositivo" |
| `@override List<Object?> get props` | "Definir propiedades que participan en comparación de igualdad" |

### 5. Opciones de Remoción

**Eliminar completamente:**
- Bloques de código concreto con imports específicos de frameworks
- Configuraciones de CI/CD específicas de plataforma (GitHub Actions, GitLab CI, etc.)
- Versiones pin-eadas de paquetes que pueden cambiar (`package: ^1.2.3`)
- Stack traces de errores o logs de ejecución
- Sintaxis específica del lenguaje (decoradores, anotaciones, etc.)

**Mantener siempre:**
- Tablas de comparación de conceptos y requisitos
- Diagramas arquitectónicos abstractos en ASCII art
- Listas de casos de uso de negocio
- Métricas y requisitos no-funcionales (tiempo máximo, cobertura, etc.)
- Nombre de identidades de datos (campos de tabla, rutas, parámetros conceptuales)

---

## 📊 Plantilla de Ejecución

```
🔍 USUARIO PROPORCIONA:
- Instrucción: "Transforma el archivo [RUTA] usando zeroCode.md"
- Opción: Secciones específicas a transformar o mantener

⚙️ AGENTE EJECUTA:

1. LECTURA:
   - Invocar read_file() para obtener contenido completo
   - Identificar todos los bloques delimitados por ``` lang ... ```
   - Contar cantidad total de bloques de código

2. ANÁLISIS:
   - Para cada bloque, documentar:
     * Líneas de inicio y fin
     * Tipo de lenguaje
     * Propósito del bloque
     * Dependencias de stack específico

3. TRANSFORMACIÓN:
   - Para cada bloque identificado:
     a) Extraer lógica principal
     b) Escribir descripción algorítmica exacta en prosa
     c) Expandir abreviaturas a términos completos
     d) Especificar condicionales con precisión
     e) Mantener todos los valores y tipos

4. APLICACIÓN:
   - Usar multi_replace_string_in_file() para reemplazar:
     * Cada bloque de código por descripción
     * Inclusiones de import específicas por conceptos
     * Referencias a versiones por conceptos genéricos

5. VALIDACIÓN:
   - Verificar coherencia global del documento
   - Confirmar que no hay bloques de código language-specific restantes
   - Validar que todas las descripciones son agnósticas

📋 CHECKLIST DE VALIDACIÓN:
- ✅ Cero bloques de código con delimitadores (```)
- ✅ Cero menciones de librerías específicas en descripciones
- ✅ Cero imports o require/import statements
- ✅ Todas las descripciones son agnósticas de stack
- ✅ Lógica preservada con precisión técnica
- ✅ Flujo de datos claro y secuencial
- ✅ Tablas y diagramas mantienen contenido conceptual
```

---

## 🚀 Uso del Prompt

### Invocación Simple

```
Usa el prompt zeroCode_prompt.md para transformar [RUTA_ARCHIVO]
a prosa agnóstica de stack tecnológico preservando lógica exacta.
```

### Invocación Avanzada

```
Usa el prompt zeroCode_prompt.md para:
1. Transformar [RUTA_ARCHIVO] a prosa agnóstica
2. Mantener intactas tablas y diagramas en secciones [SECCIÓN_1], [SECCIÓN_2]
3. Eliminar completamente sección [SECCIÓN_REMOVE]
4. Aplicar multi_replace_string_in_file() para eficiencia
```

### Invocación con Opciones

```
Usa el prompt zeroCode_prompt.md para [RUTA_ARCHIVO]:
- Preservar especificidad: mantener nombres exactos de campos/rutas/parámetros
- Nivel de detalle: incluir "mediante" y "mediante" para describir mecanismos
- Validación: confirmar cero bloques de código en resultado final
```

---

## ✨ Características de la Prosa Resultante

El documento transformado debe cumplir estas características:

- **Agnóstico:** No menciona frameworks, librerías, versiones, o lenguajes específicos
- **Preciso:** Incluye tipos de datos exactos, valores concretos, y condicionales específicos
- **Ejecutable:** Un arquitecto podría implementar en cualquier stack siguiendo la descripción
- **Legible:** Sin código inline, sin sintaxis de programación, sin caracteres especiales de lenguajes
- **Mantenible:** Cambios de stack solo requieren mapeo directo a nuevas herramientas
- **Lógicamente equivalente:** Cada descripción produce exactamente el mismo comportamiento que el código original

---

## 📚 Ejemplos Adicionales de Transformación

### Ejemplo 1: Autenticación

```
CÓDIGO:
async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    redirect('/login');
    return;
  }
  const decoded = jwt.decode(token);
  if (decoded.exp < Date.now()) {
    clearAuth();
    return redirect('/login');
  }
}

PROSA:
Ejecutar función asíncrona de verificación de autenticación: obtener token de autenticación 
desde almacenamiento persistente del dispositivo usando clave 'auth_token'. Si el token no existe 
o es null, ejecutar redirección a ruta '/login' y finalizar ejecución. Si token existe, decodificar 
el JWT extrayendo los claims. Extraer claim 'exp' que contiene timestamp de expiración. Comparar 
timestamp de expiración contra marca de tiempo actual del sistema: si expiración es anterior a tiempo 
actual, el token está expirado. Ejecutar función de limpieza de autenticación que elimina token persistido, 
y luego redireccionar a ruta '/login'.
```

### Ejemplo 2: Inserción con Validación

```
CÓDIGO:
const insertIncident = async (incident) => {
  if (!incident.projectId) throw new Error('Project ID required');
  if (!incident.type) throw new Error('Type required');
  
  const result = await db.insert('incidents', {
    ...incident,
    created_at: new Date().toISOString(),
    status: 'pending'
  });
  return result;
}

PROSA:
Crear función para insertar registro de incidencia que recibe objeto incidente como parámetro. 
Ejecutar validaciones previas: verificar que propiedad projectId del objeto existe y no es null/undefined, 
si falla lanzar excepción indicando 'Project ID requerido'; verificar que propiedad type existe y no es null, 
si falla lanzar excepción indicando 'Type requerido'. Si validaciones pasan, ejecutar operación asíncrona 
de inserción en tabla 'incidents' con un nuevo registro que contiene todas las propiedades del objeto incidente 
original más dos propiedades adicionales: created_at con valor de timestamp ISO 8601 del momento actual, y 
status con valor literal 'pending'. Retornar resultado de la operación de inserción.
```

### Ejemplo 3: Query con Filtros

```
CÓDIGO:
db.query('incidents')
  .where('project_id', '==', projectId)
  .where('status', '!=', 'archived')
  .orderBy('created_at', 'desc')
  .limit(50)
  .select(['id', 'title', 'priority'])

PROSA:
Ejecutar consulta que lee registros de tabla 'incidents' aplicando múltiples filtros en secuencia: 
primero filtrar estrictamente por project_id que debe ser exactamente igual al valor projectId proporcionado, 
segundo filtrar por status que debe ser cualquier valor EXCEPTO exactamente 'archived', tercero ordenar 
resultados por columna created_at en orden descendente (registros más recientes primero), cuarto limitar 
cantidad de registros retornados a máximo 50 filas, finalmente proyectar solo las columnas 'id', 'title' 
y 'priority' en el resultado (excluir todas las otras columnas).
```

---

## 📌 Notas Importantes

- **Reutilizable:** Este prompt puede aplicarse a cualquier documento técnico con código
- **Agnóstico:** El resultado funciona con cualquier stack tecnológico elegido futuramente
- **Precisión:** La lógica se preserva exactamente, permitiendo implementación correcta en cualquier plataforma
- **Mantenibilidad:** Cuando cambie el stack, solo mapear los conceptos agnósticos a nuevas herramientas
