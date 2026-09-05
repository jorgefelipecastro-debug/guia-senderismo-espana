# Auditoría técnica de Encúmbrate · 31 de agosto de 2026

## Reparado en esta revisión

- Registro y recuperación de contraseña añadidos a la aplicación nativa.
- Cierre de sesión bloqueado mientras hay una ruta activa para evitar pérdida de sincronización.
- Protección frente a recuperar una sesión GPS perteneciente a otra cuenta.
- Explicación previa de ubicación permanente antes del diálogo del sistema.
- Las rutas móviles y la API dejan de mostrar fichas con métricas esenciales incompletas.
- Una ruta solo se marca como offline después de descargar correctamente trazado y cartografía.
- Validación de coordenadas y lectura tolerante a almacenamiento corrupto.
- El búfer GPS deja de borrar silenciosamente los puntos más antiguos.
- Rumbo normalizado y suavizado; se ignoran lecturas GPS demasiado imprecisas.
- Regreso al sendero confirmado mediante tres lecturas consecutivas, no una sola posición dudosa.
- Mensaje seguro cuando no existe conexión para calcular un retorno por caminos.
- Eliminación de cuenta cierra sesiones globales y elimina archivos privados antes de borrar el usuario.
- La consola administrativa aplica realmente una restricción cuando un aviso revisado se sanciona.
- El chat informa de fallos de carga en lugar de presentar una conversación vacía engañosa.
- Los textos web distinguen “trazado offline” de la cartografía offline real disponible en Android.
- Privacidad, términos, normas y eliminación de cuenta pueden consultarse sin iniciar sesión, como exige la ficha pública de Google Play.
- Migraciones de seguridad y rendimiento aplicadas y verificadas en el proyecto real de Supabase.
- Índices duplicados eliminados y claves foráneas relevantes indexadas.

## Verificado automáticamente

- Pruebas de calidad de rutas: 3 aprobadas.
- Pruebas geométricas y rumbo móvil: 3 aprobadas.
- TypeScript móvil: sin errores.
- Icono principal inspeccionado: muestra `ENCÚMBRATE` correctamente.
- Supabase registra las migraciones `security_audit_fixes` y `database_advisor_fixes`.
- El asesor de rendimiento ya no presenta índices duplicados ni claves foráneas sin índice.
- Catálogo real: 7.402 rutas publicadas, 7.402 con municipio y 2.785 con todas las métricas esenciales verificables.
- Las 4.617 rutas restantes no se ofrecen en la app nativa hasta completar distancia, duración, desnivel y altitudes; no se inventan métricas.
- Los registros recientes de Auth muestran inicios de sesión y consultas de sesión con respuesta correcta.

## Pendiente de entorno externo

- Probar registro y correo real: requiere el proyecto desplegado y una cuenta de prueba.
- Probar cartografía, GPS, pantalla apagada y modo avión: requiere dispositivos físicos.
- La compilación web local queda bloqueada por `uv_resident_set_memory`, una limitación del runtime de esta sesión; las pruebas de código sí se ejecutan.
- Completar los datos legales del responsable antes de considerar definitiva la política de privacidad.
- Activar en Supabase Auth la protección contra contraseñas filtradas; el conector disponible no modifica la configuración de Auth.
- Integrar Mapbox Navigation SDK nativo y sus teselas de navegación para calcular retornos por caminos sin conexión. La descarga actual de `@rnmapbox/maps` contiene cartografía y trazado, no un motor de rutas.
- Portar comunidad, insignias y herramientas a pantallas nativas; actualmente siguen completas en la web y solo la navegación está implementada de forma nativa.
- Realizar beta interna/cerrada antes de cualquier envío a producción.
