# ⚡ Zero-Code Documentation Transformation

Este archivo es una **referencia rápida** del prompt completo. 

**Archivo principal:** Ver [zeroCode_prompt.md](zeroCode_prompt.md)

---

## 🎯 Uso Rápido

```
Usa el prompt zeroCode_prompt.md para transformar cualquier documento
de código a prosa agnóstica de stack tecnológico.
```

## ✅ Lo que hace:

1. **Lee el documento completo** - Identifica todos los bloques de código
2. **Transforma código a prosa** - Convierte a descripciones algorítmicas exactas
3. **Preserva lógica precisamente** - Si el código dice `filter: priority=CRITICAL`, describe exactamente eso
4. **Elimina especificidad** - Remueve imports, versiones, frameworks específicos
5. **Mantiene conceptos** - Conserva tablas, diagramas, requisitos, métricas
6. **Resultado agnóstico** - Implementable en cualquier stack futuro

---

## 📖 Ejemplo Rápido

| Código | ❌ Mal | ✅ Bien |
|--------|--------|--------|
| `if (!auth.isLoggedIn)` | "Si no está autenticado" | "Si la propiedad de estado isAuthenticated es false" |
| `db.insert('table', {...})` | "Guardar en la base de datos" | "Ejecutar operación asíncrona de inserción que agrega nueva fila a tabla especificada" |

---

## 🚀 Invocación

**Simple:**
```
Usa el prompt zeroCode_prompt.md para transformar [ARCHIVO]
```

**Avanzada:**
```
Usa el prompt zeroCode_prompt.md para:
1. Transformar [ARCHIVO] a prosa agnóstica
2. Mantener intactas secciones [SECCIÓN_1], [SECCIÓN_2]
3. Eliminar completamente sección [SECCIÓN_REMOVE]
```

---

**📖 Ver documento completo:** [zeroCode_prompt.md](zeroCode_prompt.md)
