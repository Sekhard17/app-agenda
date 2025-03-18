# Funcionalidades Pendientes y Sugerencias de Implementación

## 1. Adjuntar Documentos

### Estado Actual
❌ No implementado

### Sugerencias de Implementación
- **Frontend**:
  - Implementar componente de arrastrar y soltar (drag & drop) usando `react-dropzone`
  - Vista previa de documentos usando `react-pdf` para PDFs
  - Barra de progreso para carga de archivos
  - Validación de tipos de archivo y tamaño

- **Backend**:
  - Implementar almacenamiento en Supabase Storage
  - Configurar límites de tamaño y tipos de archivo permitidos
  - Generar URLs firmadas para acceso seguro
  - Implementar limpieza automática de archivos no utilizados

### Tecnologías Sugeridas
```json
{
  "frontend": {
    "react-dropzone": "^14.2.3",
    "react-pdf": "^7.7.0",
    "file-saver": "^2.0.5"
  },
  "backend": {
    "@supabase/storage-js": "^2.39.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.2"
  }
}
```

## 2. Restricción de Edición de Días Anteriores

### Estado Actual
❌ No implementado

### Sugerencias de Implementación
- **Frontend**:
  - Implementar validación en el formulario de edición
  - Deshabilitar botones de edición para días anteriores
  - Mostrar mensaje claro cuando se intenta editar día anterior
  - Agregar indicador visual de días no editables

- **Backend**:
  - Implementar middleware de validación de fecha
  - Agregar validación en las rutas de actualización
  - Registrar intentos de edición de días anteriores

### Tecnologías Sugeridas
```json
{
  "frontend": {
    "date-fns": "^2.30.0",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.2"
  },
  "backend": {
    "express-validator": "^7.2.1"
  }
}
```

## 3. Envío de Correos

### Estado Actual
❌ No implementado

### Sugerencias de Implementación
- **Backend**:
  - Implementar sistema de colas para envío de correos
  - Plantillas de correo HTML personalizables
  - Sistema de reintentos para correos fallidos
  - Registro de envíos y estados

- **Frontend**:
  - Indicador de estado de envío
  - Notificación de éxito/error
  - Opción de reenvío manual

### Tecnologías Sugeridas
```json
{
  "backend": {
    "nodemailer": "^6.9.9",
    "bull": "^4.12.2",
    "handlebars": "^4.7.8",
    "ioredis": "^5.3.2"
  }
}
```

## 4. Otras Mejoras Sugeridas

### Optimización de Rendimiento
- Implementar caché con Redis
- Lazy loading de componentes
- Optimización de imágenes
- Compresión de respuestas

### Seguridad
- Implementar rate limiting
- Validación de archivos adjuntos
- Sistema de auditoría
- Protección contra CSRF

### UX/UI
- Implementar modo oscuro
- Mejorar responsividad
- Agregar animaciones de transición
- Implementar sistema de notificaciones en tiempo real

## 5. Plan de Implementación Sugerido

1. **Fase 1: Documentos**
   - Configurar Supabase Storage
   - Implementar componente de carga
   - Agregar validaciones y seguridad

2. **Fase 2: Restricción de Fechas**
   - Implementar validaciones frontend
   - Agregar middleware backend
   - Mejorar UX con feedback visual

3. **Fase 3: Sistema de Correos**
   - Configurar servidor SMTP
   - Implementar sistema de colas
   - Crear plantillas de correo
   - Agregar monitoreo y logs

4. **Fase 4: Optimizaciones**
   - Implementar caché
   - Optimizar rendimiento
   - Mejorar seguridad
   - Refinar UX/UI

## 6. Consideraciones Técnicas

### Base de Datos
- Crear tabla para documentos adjuntos
- Agregar índices para búsquedas frecuentes
- Implementar soft delete para documentos

### Seguridad
- Implementar validación de tipos MIME
- Escanear archivos adjuntos
- Limitar tamaño de archivos
- Implementar expiración de URLs

### Monitoreo
- Agregar logs detallados
- Implementar métricas de uso
- Configurar alertas
- Monitorear rendimiento

## 7. Próximos Pasos

1. Revisar y priorizar funcionalidades
2. Crear tickets en sistema de gestión
3. Asignar recursos y timeline
4. Implementar pruebas automatizadas
5. Documentar cambios y nuevas funcionalidades 