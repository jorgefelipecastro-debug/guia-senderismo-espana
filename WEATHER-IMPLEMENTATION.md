# Meteorología de Encúmbrate con AEMET

Tarjeta de Inicio y bloque de Información práctica en cada ruta; mismo diálogo de previsión. Inicio permite ubicación explícita y búsqueda de municipios. La referencia es el núcleo municipal más cercano (máximo 60 km), no una predicción específica de cada punto ni de las cumbres. Se muestra el nombre y la distancia.

## Configuración

`AEMET_API_KEY` debe estar en Production como secreto, nunca `NEXT_PUBLIC` ni en el repositorio. No se muestra en la consola administrativa ni se devuelve en ninguna API.

Para que Encúmbrate pueda avisar antes de la renovación se admite una de estas variables privadas adicionales:

- `AEMET_API_KEY_EXPIRES_AT=YYYY-MM-DD` — opción preferida si se conoce la fecha exacta de caducidad.
- `AEMET_API_KEY_CREATED_AT=YYYY-MM-DD` — alternativa; Encúmbrate calcula tres meses naturales desde la fecha de creación.

Si ninguna de esas fechas está configurada, la consola no inventa una caducidad: muestra el estado `unknown-expiry` y recuerda el corte de las claves antiguas sin expiración el 2026-10-15.

### Mantenimiento y renovación

La consola `/admin` comprueba la credencial contra AEMET sin descargar el catálogo completo y muestra un bloque **AEMET · SALUD DE CREDENCIAL**:

- verde cuando la credencial está operativa y faltan más de 30 días;
- amarillo cuando quedan 30 días o menos;
- crítico cuando quedan 7 días o menos, la fecha ya venció, falta la clave o AEMET la rechaza;
- el botón **Comprobar ahora** fuerza una comprobación sin caché.

Un HTTP `401` de AEMET, tanto en la comprobación administrativa como durante una previsión normal, se clasifica como `AEMET_AUTH` y genera una incidencia crítica en la monitorización administrativa. La clave nunca se incluye en el error registrado.

Procedimiento de renovación:

1. Obtener una nueva API Key en AEMET OpenData.
2. Sustituir únicamente el secreto `AEMET_API_KEY` en el entorno de producción.
3. Actualizar `AEMET_API_KEY_EXPIRES_AT` o `AEMET_API_KEY_CREATED_AT` con la fecha de la nueva credencial.
4. Desplegar la nueva configuración.
5. Abrir `/admin` y pulsar **Comprobar ahora** hasta obtener estado operativo.

No se crea una clave permanente ni una renovación automática; el sistema detecta y avisa para que la rotación se haga antes de la interrupción del servicio.

## Datos

Servidor: maestro de municipios y predicciones diaria/horaria de AEMET; descarga en dos pasos, clave solo en la primera petición, sin redirecciones y host oficial validado. Decodificación UTF-8/ISO-8859-1. Catálogo compartido 24 h; previsión por municipio 30 min. Rate limiting existente, con fallo cerrado, cubre ambas APIs.

Si falla la previsión horaria, se conserva la diaria. Cada día muestra únicamente las horas entregadas. La probabilidad de precipitación conserva su intervalo AEMET; no se presenta como probabilidad independiente de cada hora. Valores ausentes son null/—, nunca cero inventado. UV máximo diario; visibilidad y nubosidad porcentual no disponibles en este producto quedan sin dato. Amanecer/atardecer solo donde estén publicados.

Hasta 12 previsiones se guardan en el navegador; fecha visible, aviso de antigüedad y aviso de fallo de actualización. No se garantiza arranque completo offline. Las recomendaciones son heurísticas, no acreditan seguridad de una ruta.

Los avisos meteorológicos oficiales se integran por ruta mediante CAP/RSS de AEMET y conservan nivel, validez y zona. La predicción de montaña continúa enlazando con la fuente oficial cuando corresponde.

## Verificación

Las pruebas automáticas cubren coordenadas, caché corrupta, condiciones, respuesta diaria sin horaria, valores vacíos, búsqueda, municipios, zona horaria Canarias, ciclo de vida de la API Key, umbrales 30/7 días, corte de claves antiguas, detección HTTP/envelope 401 y protección del endpoint administrativo. La CI ejecuta `npm test` y un build completo de Next.js en cada PR y en `main`.
