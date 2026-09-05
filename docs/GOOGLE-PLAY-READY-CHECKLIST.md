# Encúmbrate · preparación para Google Play
Estado: **no publicar todavía**. Este documento separa lo preparado de lo que exige una comprobación humana o credenciales externas.

## Ficha propuesta

- Nombre: `Encúmbrate`
- Descripción corta: `Rutas verificadas, navegación GPS y comunidad senderista.`
- Categoría principal: Viajes y guías
- Categoría secundaria: Salud y bienestar
- Sitio web: `https://www.encumbrate.es`
- Política de privacidad: `https://www.encumbrate.es/privacidad`
- Eliminación de cuenta: `https://www.encumbrate.es/eliminar-cuenta`

### Descripción larga

Encúmbrate ayuda a descubrir y preparar rutas de senderismo en España. Consulta distancia, duración, desnivel y altitud; descarga el trazado y, en la aplicación Android, la cartografía de la zona; sigue tu posición durante la marcha y conserva los puntos GPS cuando no hay cobertura.

La función “Estoy perdido” muestra el sendero guardado, la posición del dispositivo y, cuando existe conexión y el proveedor encuentra un itinerario, un retorno peatonal por caminos. La aplicación incluye avisos de seguridad, acceso al 112, comunidad con alias, chat moderado, quedadas, propuestas de rutas y logros verificados.

La información y la navegación son ayudas orientativas. Antes de salir hay que comprobar meteorología, restricciones, señalización, material y estado real del terreno.

## Declaración de seguridad de datos (borrador para revisar en Play Console)

| Tipo | Recogido | Compartido con terceros | Finalidad | Eliminable |
|---|---:|---:|---|---:|
| Correo, nombre y alias | Sí | Proveedor de autenticación/infraestructura | Cuenta, acceso y comunidad | Sí |
| Ubicación precisa | Sí, al iniciar una ruta | Infraestructura y proveedor cartográfico/rutas | Navegación, registro y retorno al sendero | Sí |
| Mensajes y quedadas | Sí, si se usan | Infraestructura | Funciones sociales y moderación | Sí |
| Fotos, GPX y pruebas de denuncia | Sí, voluntario | Almacenamiento contratado | Perfil, propuestas y moderación | Sí |
| Actividad de la aplicación | Sí | Infraestructura | Sincronización, seguridad y funcionamiento | Sí |

La ubicación en segundo plano es una función principal y solo debe solicitarse después de que el usuario pulse “Iniciar ruta”, tras mostrar la explicación previa incorporada en la aplicación.

## Capturas necesarias

1. Inicio y rutas con métricas completas.
2. Detalle de una ruta y descarga offline.
3. Navegación Mapbox con sendero verde y flecha azul.
4. “Estoy perdido” con retorno rojo calculado por caminos.
5. Chat general y tarjeta de logro oficial.
6. Insignia ampliada con requisitos.
7. Pantalla de seguridad y brújula.
8. Propuesta guiada de una ruta GPX.

Las capturas deben obtenerse del AAB final en un dispositivo real; no usar montajes que prometan resultados diferentes de la aplicación.

## Bloqueos antes de enviar a revisión

- Completar identidad legal del responsable, dirección y correo de privacidad en la política pública.
- Verificar que las migraciones pendientes están aplicadas en Supabase.
- Validar el formulario “Seguridad de los datos” con el responsable legal.
- Ejecutar pruebas internas y cerradas documentadas.
- Probar el permiso de ubicación en segundo plano en Android 11, 12, 13, 14, 15 y 16.
- Confirmar licencia y condiciones comerciales de Mapbox para descargas offline.
- Generar capturas y gráfico de funciones con los tamaños exigidos por Play Console.
- Completar clasificación de contenido y datos de acceso del revisor sin incluir contraseñas en el repositorio.
