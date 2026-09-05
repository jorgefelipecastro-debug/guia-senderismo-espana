# Matriz de pruebas Android y beta cerrada
## Dispositivos mínimos

| Android | Formato | Escenario principal |
|---|---|---|
| 11 | Gama media, GPS físico | “Permitir siempre” desde Ajustes y pantalla apagada |
| 12 | Gama media | Servicio de ubicación y ahorro de batería |
| 13 | Gama media | Notificaciones y recuperación tras cerrar la app |
| 14 | Pixel o equivalente | Restricciones de servicio en primer plano |
| 15 | Pixel/Samsung | Cartografía offline y proceso en segundo plano |
| 16 | Dispositivo o emulador oficial | Compatibilidad y permisos actuales |

## Casos obligatorios

1. Instalar desde prueba interna sin conservar una versión previa.
2. Crear cuenta, confirmar correo, entrar, recuperar contraseña y cerrar sesión.
3. Rechazar ubicación; comprobar que la app explica cómo continuar sin bloquearse.
4. Iniciar ruta, aceptar ubicación precisa y permanente, apagar pantalla 15 minutos y verificar puntos GPS.
5. Descargar una zona con Wi‑Fi, activar modo avión, cerrar/reabrir y comprobar mapa, sendero y posición.
6. Desviarse de un trazado controlado; comprobar aviso, “Estoy perdido”, línea roja y mensaje de regreso después de tres lecturas precisas.
7. Cortar red durante 20 minutos, recuperar cobertura y verificar que no faltan ni se duplican puntos.
8. Forzar cierre y reiniciar el teléfono con una ruta activa; recuperar la sesión.
9. Probar alias repetido, alias ofensivo, datos personales en mensajes, chat privado y denuncia con cinco imágenes.
10. Eliminar la cuenta y verificar que sesiones, filas y archivos privados dejan de estar disponibles.

## Beta cerrada

- 12–20 participantes de al menos cuatro fabricantes.
- Dos semanas y un mínimo de tres rutas controladas por versión.
- No realizar pruebas de desvío en terreno peligroso; usar parques o recorridos urbanos seguros.
- Registrar modelo, Android, resultado, precisión, consumo de batería, incidencias y consentimiento del participante.
- Criterio de salida: cero fallos críticos, cero pérdida de puntos y al menos 95 % de casos obligatorios aprobados.
