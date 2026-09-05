# Encúmbrate móvil

## Compilación reproducible

1. Copia `.env.example` a `.env` y completa las claves públicas de Supabase y Mapbox.
2. Configura `MAPBOX_ACCESS_TOKEN` en el servidor web para Directions Walking y `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` como secreto de compilación EAS.
3. Ejecuta `npm ci`, `npm run typecheck` y `npm test`.
4. Ejecuta `eas build --platform android --profile production` para generar el AAB firmado.

La aplicación no dibuja una línea roja directa. Si el motor peatonal no puede demostrar un retorno por caminos, muestra un aviso y mantiene únicamente la posición y el sendero descargado.

Al iniciar una ruta se guardan el trazado GPS y un paquete Mapbox Outdoors alrededor del recorrido (zoom 10–17). Google Maps se abre únicamente como enlace externo para llegar en coche al inicio.

## Pruebas de dispositivo

El flujo Maestro está en `e2e/navigation.yaml`. La prueba completa requiere una cuenta de prueba con una ruta activa.

Base nativa Android/iOS para seguimiento GPS con la pantalla apagada.

## Preparación

1. Copiar `.env.example` como `.env` y completar las dos variables públicas de Supabase.
2. Ejecutar `npm ci` dentro de `mobile/`.
3. Crear un development build (`npx eas build --profile development`). El GPS en segundo plano no debe probarse únicamente con Expo Go.
4. Proyecto EAS vinculado: `@encumbrate-apps-team/encumbrate-app`.

## Flujo implementado

- Inicio de sesión con las cuentas existentes.
- Carga de rutas cercanas desde Encúmbrate.
- Permisos de ubicación en uso y permanente.
- Servicio nativo en segundo plano para Android/iOS.
- Cola local de hasta 5.000 puntos.
- Sincronización en lotes idempotentes con Supabase.
- Recuperación de la sesión activa al abrir la aplicación.
- Finalización segura únicamente cuando los puntos están sincronizados.

El mapa Mapbox, la flecha, el trazado verde, las alertas de desvío, la cartografía por zona y el retorno calculado ya están integrados. Su activación exige los tokens restringidos indicados arriba.
