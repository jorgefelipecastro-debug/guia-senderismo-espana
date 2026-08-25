# Protocolo de desarrollo y resolución de problemas

Estas reglas son obligatorias para Encúmbrate y deben reutilizarse como base en futuros proyectos.

## 1. Sinceridad y diagnóstico

- No afirmar una causa sin pruebas suficientes.
- Diferenciar claramente entre hecho comprobado, hipótesis e inferencia.
- Consultar registros, base de datos, almacenamiento, red, compilación y estado del despliegue antes de concluir.
- Si algo no está claro, detener el cambio arriesgado y pedir confirmación.
- Una evidencia roja y concluyente vale más que muchas hipótesis amarillas.
- No atribuir automáticamente un fallo a propagación, caché, formato, tamaño o permisos: verificarlo primero.

## 2. Cambios de código y contenido

- Antes de sustituir texto o código, borrar el contenido antiguo y después insertar el nuevo.
- Evitar parches acumulativos contradictorios.
- Mantener una única fuente de verdad para cada estado.
- No introducir funciones duplicadas que resuelvan el mismo proceso de formas distintas.
- Hacer cambios pequeños, identificables y reversibles.
- Conservar los cambios del usuario que no formen parte del problema.

## 3. Verificación antes de terminar

- No finalizar un trabajo solo porque el código se haya guardado.
- Verificar compilación, despliegue activo, dominio de producción y errores de ejecución.
- Comprobar el flujo completo: interfaz → operación → almacenamiento → base de datos → nueva lectura.
- Cuando el resultado sea visual, inspeccionarlo en el tamaño de pantalla correspondiente.
- Si una función depende de hardware físico o de una sesión privada que no puede probarse directamente, decirlo expresamente y solicitar únicamente la prueba final necesaria.
- Si el resultado no coincide con lo acordado, repetir el proceso antes de cerrar.

## 4. Fotografías y avatares móviles

- Galería y cámara deben entrar por la misma función de guardado.
- La cámara integrada debe generar una imagen antes de llamar al guardado común.
- Mostrar una vista previa inmediata sin confundirla con una confirmación de persistencia.
- Comprimir en el dispositivo antes de subir: WebP, dimensión adecuada al uso y calidad equilibrada.
- Admitir archivos originales grandes para poder comprimirlos antes del límite remoto.
- Usar una ruta única por imagen para evitar caché antigua.
- No sustituir la referencia del perfil hasta que la subida haya terminado correctamente.
- Confirmar la actualización de la base de datos y obtener una URL válida antes de declarar éxito.
- Mostrar una pantalla visible de “Guardando” desde que comienza el procesamiento hasta la confirmación final.
- Indicar “No cierres ni actualices” durante ese intervalo.
- En caso de fallo, restaurar la imagen anterior y mostrar un mensaje comprensible.
- Evitar recargas internas duplicadas que puedan sobrescribir una vista previa o un estado nuevo con datos antiguos.
- No desactivar el refresco del navegador para ocultar un problema de persistencia.

## 5. Persistencia y concurrencia

- Tratar la vista previa local y el dato persistido como estados distintos.
- Prevenir respuestas antiguas que lleguen tarde y sobrescriban datos nuevos.
- Evitar cargas repetidas del perfil al volver de cámara, cambiar de pestaña o renovar una sesión.
- Tras guardar, leer o verificar el registro definitivo que utilizará la siguiente carga.
- La interfaz solo debe anunciar éxito cuando almacenamiento y base de datos estén de acuerdo.

## 6. Accesibilidad y colaboración

- Diseñar controles y mensajes grandes, legibles y bien contrastados.
- Dar instrucciones de prueba breves, numeradas y sin jerga innecesaria.
- No pedir al usuario acciones técnicas que puedan comprobarse directamente.
- Mantener informado al usuario durante operaciones largas.
- Priorizar fiabilidad, seguridad y claridad sobre velocidad aparente.

## 7. Criterio de cierre

Un cambio solo se considera terminado cuando:

1. El código correcto está guardado.
2. La compilación ha finalizado.
3. La versión está desplegada en producción.
4. No aparecen errores relevantes.
5. El dato se conserva tras una nueva lectura o actualización.
6. El resultado visual coincide con lo acordado.
7. Las limitaciones de verificación, si existen, se comunican con sinceridad.
