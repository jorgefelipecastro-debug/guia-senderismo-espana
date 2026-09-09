# Meteorología de Encúmbrate con AEMET

Tarjeta de Inicio y bloque de Información práctica en cada ruta; mismo diálogo de previsión. Inicio permite ubicación explícita y búsqueda de municipios. La referencia es el núcleo municipal más cercano (máximo 60 km), no una predicción específica de cada punto ni de las cumbres. Se muestra el nombre y la distancia.

## Configuración

AEMET_API_KEY debe estar en Production como secreto, nunca NEXT_PUBLIC ni en el repositorio. El usuario confirma haberla guardado. No hay nuevas suscripciones, migraciones ni dependencias. Documentación: https://opendata.aemet.es/ y https://www.aemet.es/es/datos_abiertos .

Las nuevas claves caducan; renovar antes de la fecha indicada por AEMET, cambiar el secreto y desplegar. No se crea una clave permanente ni una renovación automática.

## Datos

Servidor: maestro de municipios y predicciones diaria/horaria de AEMET; descarga en dos pasos, clave solo en la primera petición, sin redirecciones y host oficial validado. Decodificación UTF-8/ISO-8859-1. Catálogo compartido 24 h; previsión por municipio 30 min. Rate limiting existente, con fallo cerrado, cubre ambas APIs.

Si falla la previsión horaria, se conserva la diaria. Cada día muestra únicamente las horas entregadas. La probabilidad de precipitación conserva su intervalo AEMET; no se presenta como probabilidad independiente de cada hora. Valores ausentes son null/—, nunca cero inventado. UV máximo diario; visibilidad y nubosidad porcentual no disponibles en este producto quedan sin dato. Amanecer/atardecer solo donde estén publicados.

Hasta 12 previsiones se guardan en el navegador; fecha visible, aviso de antigüedad y aviso de fallo de actualización. No se garantiza arranque completo offline. Las recomendaciones son heurísticas, no acreditan seguridad de una ruta.

Avisos oficiales y predicción de montaña: enlaces AEMET. La ingestión automática de avisos por zona sigue pendiente.

## Verificación

Pruebas unitarias de coordenadas, cache corrupta, condiciones, respuesta diaria sin horaria, valores vacíos, búsqueda, municipios y zona horaria Canarias. Compilación con variables Supabase ficticias solo para validar código. Las peticiones locales a AEMET devolvieron 502; la comprobación real se realiza después del despliegue en Vercel. El navegador local está bloqueado con ERR_BLOCKED_BY_CLIENT.
