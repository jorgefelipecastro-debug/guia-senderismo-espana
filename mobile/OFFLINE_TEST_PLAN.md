# Validación física offline de Encúmbrate 0.1.5

Realizar la prueba con una ruta corta y segura, nunca por primera vez en montaña.

1. Con conexión, iniciar sesión y descargar dos rutas distintas.
2. Confirmar que ambas aparecen como descargadas y abrir sus mapas.
3. Iniciar una ruta descargada, caminar hasta registrar al menos diez puntos y activar el modo avión.
4. Apagar la pantalla durante dos minutos y comprobar que la notificación de seguimiento permanece.
5. Cerrar y volver a abrir Encúmbrate; la ruta debe recuperarse y continuar registrando.
6. Abrir el mapa en modo avión: la cartografía, el trazado verde y la posición deben seguir visibles.
7. Pulsar «Estoy perdido»: debe mostrarse en rojo el retorno por los pasos ya recorridos.
8. Finalizar en modo avión: debe indicar que la ruta quedó finalizada en el móvil y pendiente de sincronización.
9. Cerrar la app, quitar el modo avión y abrirla; pulsar «Sincronizar ahora» si aún aparece pendiente.
10. Confirmar que la ruta desaparece de pendientes y aparece guardada en el historial.

## Migración desde 0.1.4

1. En 0.1.4, iniciar una ruta, registrar puntos y dejarla pendiente sin conexión.
2. Actualizar a 0.1.5 sin borrar datos ni desinstalar la aplicación.
3. Abrir Encúmbrate y confirmar que recupera la misma sesión, sus puntos y el retorno por pasos.
4. Recuperar conexión, sincronizar y comprobar que no duplica ni pierde puntos.

La validación falla si el mapa queda vacío, se pierde algún punto, reaparece una grabación finalizada o se declara sincronizada sin constar en el historial.
