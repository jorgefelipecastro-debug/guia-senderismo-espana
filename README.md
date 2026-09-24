# Encúmbrate

Aplicación de senderismo para España. El código incluye una PWA con catálogo de rutas, preparación, tiempo, avisos, navegación y comunidad, además de una aplicación Android en `mobile/`. La visión y las decisiones de producto se conservan en [CUMBRE-PROYECTO-MAESTRO.md](CUMBRE-PROYECTO-MAESTRO.md).

## Estado comprobado

Consulta [Estado del proyecto · 24 de septiembre de 2026](docs/ESTADO-2026-09-24.md) antes de describir capacidades, cobertura o información actual. La copia ZIP de agosto contiene historial e imágenes, pero el código actual está en este repositorio.

Las rutas y alojamientos proceden de importaciones periódicas de OpenStreetMap, no de una comprobación del sendero en tiempo real. La app debe mostrar la fecha de importación y consultar por separado avisos oficiales y previsión meteorológica. Si la previsión no está disponible, no debe presentarse un pronóstico guardado como actual.

## Desarrollo local

```bash
npm ci
npm run dev
npm test
npm run build
```

La app web necesita las variables públicas de Supabase; las operaciones administrativas requieren credenciales del servidor. Nunca publiques claves administrativas ni las incluyas en el cliente. Las migraciones SQL de `supabase/migrations/` se aplican al proyecto correspondiente de forma controlada.

La aplicación Android tiene instrucciones propias en [mobile/README.md](mobile/README.md).

## Servicios conectados

- Vercel sirve `www.encumbrate.es` y tiene las tareas de `vercel.json`. El endpoint público `/api/health` comprobó la conexión con Supabase el 24-09-2026, pero no identifica el commit desplegado (`release: local`).
- Railway figura en `lib/operational-api.js` como backend prioritario para llamadas operativas, con Vercel de respaldo. Su panel y el estado del servicio deben comprobarse con acceso a Railway; el código por sí solo no demuestra que esté activo.
- Supabase almacena rutas, alojamientos y datos de usuario. La importación de rutas usa una tarea `pg_cron` y una clave que permanece exclusivamente en el servidor. El detalle de las comprobaciones de producción está en el [estado del proyecto](docs/ESTADO-2026-09-24.md).

## Seguridad en montaña

Los tracks, pronósticos y puntos de alojamiento pueden estar incompletos o desactualizados. Hay que comprobar el estado y los permisos con el gestor del espacio, los avisos oficiales y la previsión antes de salir. El módulo SOS facilita coordenadas y llamada al 112; no afirma que envíe automáticamente la posición a emergencias.
