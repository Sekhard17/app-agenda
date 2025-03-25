# Implementación del Sistema de Correos

## Estado Actual ✅

### Implementado
1. **Servicio de Correos**
   - Configuración base de Nodemailer
   - Sistema de plantillas con Handlebars
   - Manejo de errores y reintentos
   - Ruta API para envío de correos

2. **Estructura de Archivos**
   ```
   backend/
   ├── src/
   │   ├── services/
   │   │   └── EmailService.ts
   │   ├── controllers/
   │   │   └── EmailController.ts
   │   ├── routes/
   │   │   └── email.routes.ts
   │   └── templates/
   │       └── notification.hbs
   ```

3. **Endpoints API**
   ```typescript
   POST /api/email/send-notification
   {
     "to": "destinatario@ejemplo.com",
     "subject": "Asunto del correo",
     "title": "Título en el template",
     "message": "Contenido del mensaje",
     "actionUrl": "https://tuapp.com/accion",  // opcional
     "actionText": "Hacer clic aquí"  // opcional
   }
   ```

## Pendiente ⏳

### 1. Configuración de Cuenta de Correo
- [ ] Crear cuenta de Gmail dedicada
- [ ] Activar verificación en dos pasos
- [ ] Generar contraseña de aplicación
- [ ] Actualizar variables de entorno

### 2. Variables de Entorno
```env
# Agregar en backend/.env
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
```

### 3. Pruebas
- [ ] Probar envío de correos
- [ ] Verificar formato HTML
- [ ] Comprobar límites de Gmail (500/día)

## Guía de Configuración

### Paso 1: Crear Cuenta de Gmail
1. Ir a [Gmail](https://gmail.com)
2. Crear nueva cuenta
3. Nombres sugeridos:
   - agenda.socoepa@gmail.com
   - notificaciones.agenda@gmail.com
   - soporte.agenda@gmail.com

### Paso 2: Configurar Verificación en Dos Pasos
1. Ir a [Seguridad de Google](https://myaccount.google.com/security)
2. Activar "Verificación en dos pasos"
3. Seguir el proceso de configuración

### Paso 3: Generar Contraseña de Aplicación
1. Ir a [Contraseñas de aplicación](https://myaccount.google.com/apppasswords)
2. Seleccionar app: "Otra"
3. Nombre: "Agenda"
4. Copiar contraseña generada

### Paso 4: Configurar el Proyecto
1. Actualizar `.env`:
   ```env
   SMTP_USER=tu_correo@gmail.com
   SMTP_PASS=contraseña_de_aplicacion
   ```
2. Reiniciar el servidor
3. Probar envío de correo

## Límites y Consideraciones

### Límites de Gmail Gratuito
- 500 correos por día
- 100 destinatarios por mensaje
- Reinicio cada 24 horas

### Alternativas Futuras
Si se necesita escalar:
1. **Gmail Workspace**
   - 2000 correos/día
   - Desde $6 USD/mes

2. **Servicios Especializados**
   - SendGrid: 100 gratis/día
   - Mailgun: 5000 gratis/3 meses
   - Amazon SES: 62,000 gratis/mes
   - Resend.com: 100 gratis/día

## Uso del Servicio

### Ejemplo de Envío
```typescript
// Desde cualquier controlador
await emailService.sendEmail({
  to: "usuario@ejemplo.com",
  subject: "Bienvenido a la Agenda",
  template: "notification",
  context: {
    title: "¡Bienvenido!",
    message: "Tu cuenta ha sido creada exitosamente.",
    actionUrl: "https://agenda.com/login",
    actionText: "Iniciar Sesión"
  }
});
```

### Plantillas Disponibles
1. **notification.hbs**
   - Título personalizable
   - Mensaje principal
   - Botón de acción opcional
   - Pie de página corporativo

## Próximos Pasos Recomendados

1. Crear cuenta de correo dedicada
2. Configurar variables de entorno
3. Realizar prueba inicial de envío
4. Documentar cualquier error o ajuste necesario
5. Considerar monitoreo de límites de envío

## Notas Adicionales
- El servicio está listo para usar una vez configurada la cuenta
- Se pueden agregar más plantillas en `src/templates/`
- Los errores se registran en la consola del servidor
- Se recomienda hacer pruebas con correos propios antes de enviar a usuarios reales 