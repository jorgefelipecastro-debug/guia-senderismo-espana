# ENCÚMBRATE — PROYECTO MAESTRO

> Documento vivo para conservar la visión, decisiones de producto y hoja de ruta de Encúmbrate fuera de cualquier conversación de ChatGPT.
>
> Estado: reconstrucción inicial basada en el código y documentación actualmente conservados en el repositorio. Las ideas que solo existían en la conversación perdida deben reincorporarse al validar este documento.

## 1. Visión

Encúmbrate es una guía de senderismo inteligente para España. No pretende ser simplemente un catálogo de tracks: debe acompañar al senderista antes, durante y después de una ruta y ayudarle a escoger aventuras coherentes con su capacidad real.

Idea central: **Descubre · Prepara · Vive · Disfruta**, con la seguridad como principio transversal.

La aplicación aprende del usuario y adapta sus recomendaciones a su experiencia. La progresión debe ser gradual: no incentivar retos peligrosos ni convertir la montaña en una competición por puntos.

## 2. Principios de producto

1. **Personalización real.** La ruta adecuada depende de la persona, no solo de su popularidad.
2. **Separar orientación, progreso y acreditación.** El cuestionario propone una orientación inicial. El nivel real se gana con rutas y logros; la experiencia previa solo puede incorporarse mediante una solicitud acreditada y revisada.
3. **Progresión responsable.** Las rutas completadas y verificadas deben mejorar el perfil progresivamente.
4. **Seguridad antes que gamificación.** Nunca empujar al usuario hacia una ruta para la que todavía no está preparado.
5. **Utilidad en montaña.** GPS, mapas offline, orientación, vuelta sobre los pasos, información del terreno y SOS deben convertirse en funciones reales.
6. **Información honesta.** Encúmbrate reduce incertidumbre; no garantiza seguridad ni sustituye criterio, preparación, servicios de emergencia o información oficial.
7. **Comunidad útil.** Priorizar estado del sendero, equipamiento, agua, meteorología, incidencias, fotografías y consejos recientes frente a métricas sociales vacías.
8. **La experiencia importa.** La aplicación debe ayudar a vivir y recordar la montaña, no solo a registrar kilómetros.

## 3. Recorrido ideal del usuario

### 3.1 Encúmbrate te conoce
- Crear cuenta / iniciar sesión.
- Perfil inicial mediante cuestionario.
- Variables ya planteadas: experiencia, distancia habitual, orientación, primeros auxilios y terreno técnico.
- Futuro: incorporar actividad real y rutas verificadas.

### 3.2 Encuentra tu ruta
Encúmbrate debe cruzar el perfil con:
- distancia;
- desnivel;
- dificultad/terreno;
- duración;
- ubicación;
- meteorología;
- estado reciente de la ruta;
- necesidades de material;
- experiencia necesaria.

La interfaz debe permitir búsqueda por provincia, paisaje o nombre y recomendaciones como «Sorpréndeme», «Cerca de mí» y «Quiero progresar».

### 3.3 Prepárate
Antes de salir:
- ficha completa de ruta;
- track GPX;
- mapa offline;
- puntos esenciales;
- meteorología y alertas;
- material recomendado;
- agua/refugios/puntos críticos;
- estimación de compatibilidad con el perfil;
- advertencias de riesgo.

### 3.4 Encúmbrate camina contigo — Modo Aventura
Objetivo: lo importante debe estar a una pulsación.

Funciones previstas:
- navegación GPS;
- mapa offline;
- progreso en tiempo real;
- registro del rastro;
- «Volver sobre mis pasos»;
- aviso al salir del track;
- recuperación conservadora de la ruta;
- brújula y orientación;
- integración futura con reloj/salud;
- fotografías/momentos de la aventura;
- música mediante plataformas externas sin interferir con avisos de seguridad;
- SOS accesible inmediatamente.

### 3.5 Vive y recuerda
Después de la ruta:
- guardar ruta completada;
- conservar track verificado;
- kilómetros y estadísticas;
- fotografías y momentos;
- registro de rutas parciales para retomarlas;
- pasaporte/historial de montaña.

### 3.6 Comparte y progresa
La experiencia acumulada debe alimentar el perfil y abrir retos adecuados de forma progresiva.

La comunidad debe permitir experiencias verificadas asociadas a una ruta realizada: fotografías, estado, equipamiento, incidencias y consejos.

## 4. Perfil senderista

Niveles actuales del prototipo:
- Principiante;
- Intermedio;
- Experto.

El cuestionario no adjudica el nivel real: solo ofrece una orientación inicial para personalizar recomendaciones. El nivel real evoluciona mediante rutas y logros registrados. Un senderista experimentado puede solicitar un nivel acreditado aportando evidencias y aceptando una declaración responsable; la solicitud queda pendiente de revisión y nunca concede el nivel automáticamente.

Dimensiones ya representadas:
- experiencia;
- orientación;
- seguridad/primeros auxilios.

A desarrollar:
- modelo de puntuación serio y auditable;
- ponderación de desnivel, distancia, terreno y exposición;
- historial temporal: no valorar igual una ruta de hace años que actividad reciente;
- rutas verificadas por GPS;
- detección de progresión gradual;
- mecanismo de regresión/recomendación conservadora tras largos periodos de inactividad;
- explicación al usuario de por qué una ruta se recomienda o se bloquea.

## 5. Motor de recomendación

Cada ruta debe disponer de una ficha estructurada con al menos:
- nombre y localización;
- coordenadas;
- distancia;
- desnivel positivo/negativo;
- duración estimada;
- tipo de recorrido;
- dificultad física;
- dificultad técnica;
- exposición;
- orientación/señalización;
- terreno;
- altitud;
- época recomendada;
- restricciones/permisos;
- agua y refugios;
- riesgos específicos;
- track y procedencia de los datos;
- fecha de última validación.

La compatibilidad no debe presentarse como una garantía. Debe explicar factores favorables y factores de riesgo.

## 6. Seguridad y SOS

### Principio
Encúmbrate puede ayudar a preparar y reaccionar, pero nunca afirmar que elimina el riesgo de la montaña.

### SOS actual/propuesto
- obtener geolocalización del dispositivo;
- mostrar latitud/longitud;
- mostrar precisión disponible;
- compartir posición;
- facilitar llamada al 112.

### Regla crítica
No afirmar que el 112 recibe automáticamente la posición salvo que exista una integración oficial verificada. Cualquier futura integración con emergencias debe validarse técnica y legalmente con autoridades y plataformas.

### Futuro de seguridad
- compartir ruta prevista con contacto de confianza;
- hora estimada de regreso;
- alertas por retraso, cuando sea técnicamente fiable y con consentimiento;
- avisos meteorológicos;
- estado de senderos;
- batería y cobertura;
- descarga obligatoria/recomendada de recursos offline para zonas sin cobertura;
- instrucciones de emergencia disponibles offline.

## 7. Mapas, GPS y offline

Objetivo futuro:
- tracks GPX reales y autorizados;
- cartografía apta para uso offline;
- descarga de ruta antes de salir;
- posición sobre track;
- distancia restante;
- puntos de interés y riesgo;
- rastro del usuario;
- detección de desviación con umbrales prudentes;
- vuelta sobre los pasos.

La PWA actual dispone de manifest, modo standalone, iconos y service worker básico. Esto es una base de instalación/offline, no equivale todavía a disponer de mapas de montaña offline completos.

## 8. Comunidad

La comunidad debe estar ligada a utilidad y experiencia real.

Contenido prioritario:
- estado reciente del sendero;
- fuentes secas/activas;
- nieve, barro, viento, desprendimientos;
- equipamiento recomendado;
- fotografías vinculadas a puntos/kilómetros de la ruta;
- consejos de personas que realmente la han realizado.

Moderación: insultos, amenazas, spam y contenido abusivo no se publican. Una crítica negativa útil sí.

## 9. Cuenta y datos del usuario

La aplicación utiliza Supabase Auth en producción, correo transaccional de Resend y el dominio encumbrate.es. El alta exige confirmación de correo y la recuperación permite establecer una contraseña.

Pendiente:
- backend;
- base de datos;
- autenticación segura;
- recuperación de contraseña;
- sincronización entre dispositivos;
- perfil persistente;
- privacidad y consentimiento;
- exportación/eliminación de datos;
- almacenamiento de tracks y fotografías;
- políticas y textos legales reales.

## 10. Estado funcional reconstruido

### Ya representado en el MVP
- identidad Encúmbrate;
- onboarding/registro e inicio de sesión de prototipo;
- explicación «cómo funciona»;
- cuestionario de perfil;
- niveles Principiante/Intermedio/Experto;
- recomendación/bloqueo de rutas según perfil;
- explorador y buscador;
- fichas de rutas de demostración;
- compatibilidad orientativa;
- Modo Aventura;
- brújula educativa;
- SOS con geolocalización y 112;
- pasaporte/progreso;
- rutas parciales y completadas simuladas;
- experiencias/comunidad de demostración;
- diseño responsive;
- PWA: manifest, standalone, iconos, service worker y flujo de instalación móvil.

### Actualmente son prototipo/simulación
- rutas y compatibilidades;
- verificación GPS de rutas;
- mapas offline reales;
- vuelta sobre los pasos;
- detección fuera de ruta;
- integración de reloj/salud;
- fotografías inteligentes;
- autenticación social;
- comunidad persistente;
- datos meteorológicos;
- backend y sincronización.

## 11. Fuentes de datos — pendiente crítico

No poblar Encúmbrate con datos copiados sin comprobar derechos y condiciones de uso.

Hay que definir fuentes autorizadas para:
- catálogo de rutas;
- tracks GPX;
- cartografía;
- meteorología;
- espacios protegidos/restricciones;
- refugios y puntos de agua;
- alertas/incidencias.

Cada dato sensible para seguridad debería tener procedencia y fecha de actualización cuando sea posible.

## 12. Hoja de ruta propuesta

### Fase 0 — Recuperación y definición
- validar este documento con Jorge;
- recuperar las ideas de la conversación perdida que no estén reflejadas;
- congelar una versión de visión/producto;
- definir qué significa MVP real.

### Fase 1 — PWA sólida
- iconografía definitiva Encúmbrate;
- verificar instalación Android/iOS;
- revisar service worker y estrategia de caché;
- probar responsive en teléfonos reales;
- corregir accesibilidad y rendimiento.

### Fase 2 — Datos reales de rutas
- elegir fuentes y licencias;
- diseñar esquema de datos;
- importar primer conjunto controlado de rutas españolas;
- fichas detalladas y GPX.

### Fase 3 — Usuarios reales
- backend y base de datos;
- autenticación;
- perfil persistente;
- historial y preferencias;
- privacidad y seguridad de datos.

### Fase 4 — Navegación
- mapa real;
- GPX;
- descarga offline;
- tracking GPS;
- progreso y desvíos;
- vuelta sobre los pasos;
- consumo de batería y pruebas de campo.

### Fase 5 — Inteligencia de recomendación
- modelo de capacidad senderista;
- scoring de rutas;
- compatibilidad explicable;
- progresión basada en rutas verificadas;
- meteorología/condiciones como modificadores dinámicos.

### Fase 6 — Seguridad avanzada
- checklist previa;
- contactos de confianza;
- plan de ruta;
- avisos y alertas;
- robustecer SOS y funcionamiento offline;
- revisión con expertos/organismos cuando corresponda.

### Fase 7 — Comunidad y recuerdos
- publicaciones verificadas por actividad;
- fotos asociadas a ruta/punto;
- estado reciente;
- moderación;
- pasaporte y recuerdos de montaña.

### Fase 8 — App nativa / tiendas
Evaluar Capacitor/React Native u otra arquitectura cuando las necesidades de GPS en segundo plano, mapas, sensores, reloj, notificaciones y tiendas justifiquen pasar de PWA a aplicación nativa/híbrida.

## 13. Decisiones que debemos reconstruir contigo

Este bloque existe expresamente para recuperar el feedback perdido. No se debe inventar la respuesta.

- ¿Cuál era la frase exacta de misión/posicionamiento que habíamos elegido?
- ¿Qué funciones habíamos decidido que diferenciaban Encúmbrate de Wikiloc/AllTrails/Strava y otras apps?
- ¿Cómo habíamos definido exactamente la progresión del senderista?
- ¿Qué papel tendría IA/personalización?
- ¿Cómo debía funcionar «Sorpréndeme»?
- ¿Qué habíamos acordado sobre niños, familias, perros, accesibilidad o grupos?
- ¿Qué funciones específicas del reloj habíamos priorizado?
- ¿Qué modelo de negocio habíamos planteado, si alguno?
- ¿Qué asociaciones/partners/administraciones habíamos considerado?
- ¿Qué criterios exactos debía tener una experiencia «verificada»?
- ¿Qué detalles de seguridad habíamos añadido que aún no aparecen en el código?
- ¿Qué orden de desarrollo habíamos acordado originalmente?

## 14. Registro de decisiones

A partir de ahora, cada decisión importante debe añadirse aquí antes o al mismo tiempo que se implementa.

Formato:

`AAAA-MM-DD — Decisión — Motivo — Consecuencia`

- 2026-08-22 — El plan maestro se conserva dentro del repositorio — Evitar que la continuidad del producto dependa de una conversación — GitHub pasa a ser la fuente permanente de contexto del proyecto.

## 15. Regla de trabajo desde ahora

Antes de cambios grandes de producto:
1. consultar este documento;
2. confirmar si el cambio modifica una decisión existente;
3. actualizar el documento si procede;
4. implementar;
5. comprobar el resultado antes de declararlo terminado.

**Este archivo es la memoria operativa del proyecto Encúmbrate.**


## 14. Decisiones vigentes sobre nivel y responsabilidad (25-08-2026)

### Tres datos distintos
- **Orientación del test:** `assessment_suggested_level`. Sirve para recomendaciones iniciales y no modifica el nivel real.
- **Nivel por progreso:** `progression_level`. Evoluciona con rutas y logros registrados por Encúmbrate.
- **Nivel acreditado:** `accredited_level`. Solo se concede después de revisar una solicitud y sus evidencias.

El nivel efectivo procede del progreso, salvo que una acreditación haya sido aprobada expresamente. Las rutas se catalogan como **Principiante**, **Intermedio** y **Experto**.

### Solicitud de experiencia previa
El usuario puede solicitar Intermedio o Experto, explicar su experiencia y aportar enlaces a historial de rutas, licencia federativa, certificados o tracks GPS. La aplicación registra usuario, fecha, versión de la declaración y estado de revisión. Una casilla marcada no concede nivel automáticamente.

### Declaración responsable
El solicitante declara que la información aportada es veraz, que debe valorar recorrido, desnivel, terreno, meteorología, material y riesgos, y que asume las consecuencias de escoger actividades superiores a sus capacidades. Esta declaración no elimina las responsabilidades que legalmente correspondan a Encúmbrate.

### Pendiente de definición antes de automatizar ascensos
Los umbrales concretos de rutas, puntos, dificultad y verificación necesarios para subir de Principiante a Intermedio o Experto deben aprobarse como reglas de producto. No se inventarán ni se activarán automáticamente hasta acordarlos.

### Preferencia operativa del propietario
Antes de sustituir texto manualmente en un panel: borrar el contenido anterior, comprobar que el campo está vacío, pegar el contenido nuevo, verificar que no haya duplicados y guardar solo tras confirmación cuando la interfaz lo requiera.


## 15. Insignias y cierre del test (25-08-2026)

El cuestionario inicial solo puede producir dos orientaciones:
- **PRINCIPIANTE — Lagartija**.
- **INTERMEDIO — Camaleón**.

Al terminar y guardar el test, antes de entrar en la página principal, se muestra una celebración a pantalla completa con la insignia correspondiente y el nombre del nivel debajo en mayúsculas.

La tercera insignia es **EXPERTO — Serpiente**. Nunca puede obtenerse como resultado del test. Solo se muestra cuando el nivel Experto ha sido ganado mediante el sistema de progresión aprobado o concedido tras acreditar y verificar experiencia. Su marco dorado y más ostentoso expresa que es la categoría superior.
