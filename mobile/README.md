# Encúmbrate móvil

Base nativa Android/iOS para seguimiento GPS con la pantalla apagada.

## Preparación

1. Copiar `.env.example` como `.env` y completar las dos variables públicas de Supabase.
2. Ejecutar `npm install` dentro de `mobile/`.
3. Crear un development build (`npx eas build --profile development`). El GPS en segundo plano no debe probarse únicamente con Expo Go.
4. Sustituir `PENDIENTE_DE_CREAR_EN_EXPO` en `app.json` por el identificador asignado por EAS.

## Flujo implementado

- Inicio de sesión con las cuentas existentes.
- Carga de rutas cercanas desde Encúmbrate.
- Permisos de ubicación en uso y permanente.
- Servicio nativo en segundo plano para Android/iOS.
- Cola local de hasta 5.000 puntos.
- Sincronización en lotes idempotentes con Supabase.
- Recuperación de la sesión activa al abrir la aplicación.
- Finalización segura únicamente cuando los puntos están sincronizados.

La siguiente fase incorporará mapa cartográfico offline, flecha de posición, trazado verde, retorno rojo y alertas de desvío.
