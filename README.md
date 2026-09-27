# 道 Dōjō — tu dojo virtual, en cualquier lugar

Un **dojo virtual** para practicar **cualquier arte marcial en cualquier lado**: en casa,
en una habitación de hotel, en la oficina… solo necesitas un **espacio reducido** (~1–2 m²,
las técnicas que recorren espacio avisan cuando piden ~2 m libres). Cualquier persona puede
tomar la clase: **una buena clase, siempre, para todos** — cada ejercicio trae la variante
fácil en sus instrucciones (flexiones con rodillas, rangos cómodos), y tú marcas el ritmo
con pausar/saltar. Combina artes marciales (karate, muay thai, taekwondo, kenjutsu) con
fuerza, core, movilidad y respiración. Funciona **sin internet** y guarda todo en tu navegador.

## Cómo empezar (init)

1. Descarga o clona la carpeta del proyecto.
2. Abre `index.html` en cualquier navegador (móvil, tablet o PC) con **doble clic**.
   No necesita instalación, servidor ni conexión.
3. Elige una clase y sigue al sensei: timer, voz y personaje 3D te guían paso a paso.

> 💡 **En el móvil:** ábrela en Chrome/Safari y usa "Añadir a pantalla de inicio" para
> tenerla como una app. Mantén la pantalla encendida durante la clase.

### Las clases generales
- **Clase completa (≈60 min):** calentamiento → movilidad → piernas → tren superior →
  core → técnica marcial → vuelta a la calma. Bloques de fuerza en 2 series.
- **Express (≈30 min):** lo esencial cuando hay poco tiempo.
- **Sorpréndeme (≈40–50 min):** clase variada generada al azar, distinta cada vez.

### Entrenamiento por disciplina
Cada arte marcial sigue la estructura de una **clase real** de su escuela:
- **Karate (≈60 min):** como en el dojo — saludo y mokusō de apertura, **carrera inicial
  (≈10 min)**, **junbi undō** (movilidad articular: tobillos, rodillas, cadera, cuello,
  brazos), **acondicionamiento** (elevaciones de piernas ×30 sin tocar el suelo,
  flexiones ×30, plancha), **kihon** (puños, bloqueos, patadas), **kata**, **kumite**
  (sparring de sombra), posturas y vuelta a la calma con mokusō.
- **Muay Thai (≈50 min):** sesión de gimnasio tailandés — carrera y cuerda, sombra,
  las ocho armas (puños, codos, rodillas, patadas), rounds de sparring de sombra y
  acondicionamiento final.
- **Taekwondo (≈40 min):** carrera, movilidad, patadas de precisión, altura y velocidad
  (dollyo, dwit, naeryo chagi) y kyorugi (sparring de sombra).
- **Kenjutsu (≈30 min):** cortes (suburi men, kesa giri, dō giri), guardia y desplazamientos.
  Usa un bokken o un palo.

Hay **86 ejercicios** con **40 figuras animadas distintas** (cada movimiento tiene la suya: cada
estiramiento tiene la propia, los ejercicios de suelo apoyan de verdad en el tatami y el kenjutsu
se practica con un bokken en la mano),
incluidas técnicas que **recorren espacio** (marcadas «↔️ necesita espacio», ~2 m libres).

Durante la clase (a pantalla completa, **dentro del dojo 3D**):
- 🏯 **El dojo**: suelo de madera o tatami, shoji retroiluminados, pilares, kamiza con
  kakejiku, linternas, polvo flotando en la luz y sombras reales. Cuatro ambientes (🎴):
  dojo de madera, dojo de noche, sala de tatami y jardín zen.
- 🚪 Al empezar, las **puertas shoji** se cierran y se abren sobre el dojo; un **taiko**
  abre la clase, una **campana (rin)** marca cada cambio y un chasquido de madera cuenta
  3·2·1. Todo sintetizado, sin archivos de audio.
- ⏱️ **Timer** grande con cuenta regresiva, y arriba el **bloque** de la clase en que estás
  (Kihon, Kata, Core · serie 2/2…).
- ◧ **Modo inmersivo** (o tecla `H`): oculta la guía y deja solo el dojo, el nombre y el
  tiempo. Atajos: `espacio` pausa, `←`/`→` cambian de ejercicio.
- 🗣️ **Voz del sensei** que anuncia cada ejercicio (botón 🔊/🔇 para silenciar).
  Funciona **sin internet**: usa una voz del sistema en español si el equipo tiene
  una instalada; si no hay ninguna, cae a un **motor de voz propio empaquetado**
  (meSpeak/eSpeak) para que siempre suene, aunque más robótico. Ver más abajo.
- 👤 **Personaje 3D** ejecutando la técnica + guía del sensei (forma y respiración).
- ⏮ ⏸ ⏭ controles para pausar, repetir o saltar. La ✕ cierra la clase.
- Los ejercicios "por lado" se hacen en dos turnos (derecho / izquierdo).

### Mediciones
Registra peso y medidas (cintura, pecho, cadera, brazo, muslo) cada 1–2 semanas.
Verás el cambio respecto a la última toma y una curva de tu peso en el tiempo.

### Biblioteca
Todas las técnicas con su figura y detalle de ejecución. Además:
- 🥋 **Ver en 3D:** abre el personaje (karateka, silueta clara para analizar)
  ejecutando ese movimiento en bucle. **Arrastra** para girarlo y verlo desde
  cualquier ángulo.
- ✏️ **Ajustar movimiento** (técnicas marciales): un editor con deslizadores para
  cada articulación, fase por fase (guardia → chamber → extensión → recogida).
  Ves el cambio en vivo, **Guardar** lo aplica en toda la app (clase incluida) y
  se recuerda en tu navegador; **Original** vuelve al movimiento de fábrica.

## Estructura del proyecto

```
index.html          Estructura y pantallas (portada con el dojo vivo, clase a pantalla completa con HUD)
css/estilos.css     Sistema visual (laca, cedro, washi, urushi, pan de oro) + animaciones de las figuras
vendor/fonts/       Shippori Mincho (títulos) y Zen Kaku Gothic New (texto), subconjunto latino, locales
vendor/three.min.js Three.js (r128, MIT) — local, para el personaje 3D
js/figuras.js       Muñecos SVG animados (respaldo y miniaturas de la biblioteca)
js/escena3d.js      Escena 3D (Three.js): el dojo (texturas procedurales dibujadas en
                    canvas, sombras, ambientes), personaje articulado con gi, cámara
                    por modo (clase / portada / visor libre). Técnica marcial con poses
                    por fotogramas clave (guardia → chamber → extensión → recogida)
                    y guardia propia por arte
js/ejercicios.js    Biblioteca de ejercicios + definición de las rutinas
js/app.js           Reproductor de clase, timer, voz, mediciones, estadísticas
vendor/mespeak/     Motor de voz offline (meSpeak/eSpeak, GNU GPL): bundle main-thread
                    + datos de voz en español, embebidos para funcionar con file://
```

### Voz offline (cómo funciona)
La voz del sensei es **híbrida**, por orden de preferencia:
1. **La voz del navegador** en español (la de Chrome/Safari). Se prefiere una **local**
   (`localService`, offline y de buena calidad); si no hay ninguna local, se usa cualquier
   voz en español del navegador (p. ej. "Google español", que suena natural pero necesita
   internet).
2. Si esa voz **falla al hablar** (típico: voz de servidor sin conexión) o el navegador no
   tiene ninguna voz en español, cae automáticamente al motor propio de `vendor/mespeak/`
   (eSpeak compilado a JS, ~1,6 MB), que sintetiza en el equipo. Más robótico, pero
   garantizado sin internet.

El motor se carga de forma diferida (solo cuando hace falta) mediante etiquetas `<script>`
locales, y sus datos van embebidos como objetos JS (no usa XHR ni Web Workers) para seguir
funcionando con **doble clic** sobre `index.html` (`file://`). Para cambiar a acento
latinoamericano, pon `VOZ_OFFLINE_ID = 'es-la'` en `js/app.js`. meSpeak/eSpeak son **GNU GPL**.

### Personaje 3D
Durante la clase ves un **personaje 3D** que ejecuta cada movimiento (Three.js, sin
descargas externas: la librería está en `vendor/`). En la cabecera de la clase:
- 🎴 cambia el **ambiente** (dojo de madera, dojo de noche, sala de tatami, jardín zen).
  El «Estudio» neutro se usa solo en el visor de la Biblioteca.
- 🥷 cambia el **personaje** (karateka, ninja, monje y samurái). Puedes añadir tus propios
  modelos `.glb` (ver más abajo) y se animan por *retargeting*.
  Los personajes procedurales llevan gi con solapas, mangas anchas, obi anudado, puños,
  cara y peinado propios; no descargan nada.

Los modelos GLB van en `assets/` y además **incrustados en base64** en `assets/modelos.js`
para que carguen al abrir el index con doble clic (sin servidor).

**Añadir un personaje nuevo (Mixamo, Quaternius… gratis):**

```
node tools/incrustar-glb.js <ruta.glb> [clave] [Nombre visible]
```

La herramienta copia el `.glb` a `assets/`, lo incrusta en `assets/modelos.js` y registra
el personaje en `assets/personajes-extra.js`. Abre `index.html` y toca 🥷 para ciclar hasta él.

**¿Tu modelo no tiene esqueleto (es solo una malla)?** El motor anima reorientando huesos,
así que una malla sin huesos aparecería congelada. Necesita un rig humanoide.

> ⚠️ **Recomendado: Mixamo (gratis).** Sube tu malla a mixamo.com, deja que la auto-rigee
> (marcas barbilla/muñecas/codos/rodillas/ingle) y descarga el `.glb`/`.fbx` rigueado. Los
> rigs de Mixamo son de calidad y **funcionan bien con el retargeting de esta app** (brazos
> incluidos). Luego: `node tools/incrustar-glb.js modelo.glb clave "Nombre"`.
>
> Existe también `tools/riguear-glb.py` (auto-rig con Blender por proporciones). Genera piernas,
> torso y cabeza correctos, pero **los brazos se deforman** con el retargeting minimalista de la
> app (el motor reorienta el brazo con torsión indefinida). Sirve como punto de partida, no como
> solución final. Para brazos correctos, usa Mixamo.

Los `.glb` ya rigueados se incrustan en base64 y la app los carga al abrir; mantenlos por debajo
de ~2 MB para que vaya fluido.

El motor **no usa las animaciones del modelo**: aprovecha solo la malla y reorienta sus
huesos para copiar los más de 70 movimientos (*retargeting*). Por eso basta con un modelo en pose
de reposo/T-pose, y sus huesos se mapean solos si siguen alguna convención habitual —
Mixamo (`mixamorig:RightArm`), Blender (`Upperarm.Right`), sufijos `.L/.R`, etc. Si el modelo
mira hacia otro lado, añade `giroY: Math.PI` a su entrada; si conserva sus texturas y prefieres
teñirlo, añade `color: 0x…`. Si la consola dice *«esqueleto no compatible»*, reexpórtalo desde
Blender con un rig humanoide estándar.

Tus preferencias se recuerdan. Si el dispositivo no soporta WebGL, la app usa
automáticamente las figuras SVG 2D como respaldo.

**Anatomía articular (rangos AAOS).** El motor incorpora una tabla de rangos de
movimiento articular tomada de los valores normales de la *American Academy of
Orthopaedic Surgeons* (ampliados al rango atlético que exige una patada alta):
- **Límites duros** en codos y rodillas (bisagras): ninguna pose — ni siquiera una
  editada a mano — puede doblarlas al revés. Es lo que hacía que algunos
  movimientos "salieran mal".
- **Rangos del editor**: los deslizadores de «Ajustar movimiento» quedan acotados
  al rango anatómico de cada articulación y muestran el valor **en grados**
  (y en centímetros para los desplazamientos del cuerpo), para que ajustar una
  técnica sea intuitivo.

**Técnicas con espacio.** Algunos ejercicios recorren espacio real (avanzan o
saltan) y llevan el distintivo «↔️ necesita espacio» (campo `espacio: true`):
oi-zuki, mikazuki geri, twio ap chagi, khao loi, zancada caminando y footwork.
La voz del sensei avisa de tener ~2 m libres.

> **Añadir un personaje con modelo 3D (.glb):** ver la nota al final de `js/escena3d.js`.
> El sistema de personajes y fondos es un registro (`Dojo3D.personajes` / `Dojo3D.fondos`)
> pensado para sumar modelos descargados (Mixamo, Quaternius… todos gratis) sin tocar el resto.

## Cómo personalizarla

- **Añadir un ejercicio:** agrega un objeto a `BIBLIOTECA` en `js/ejercicios.js`
  (con `id`, `nombre`, `arquetipo`, `categoria`, `tipo`, duración/reps, instrucciones).
  El `arquetipo` elige qué figura animada usar (ver `MAPA_FIGURA` en `js/figuras.js`).
  Si además lleva `arte` (`karate`, `muaythai`, `taekwondo`, `kenjutsu`), el 3D usa la
  variante de ese estilo si existe (p. ej. el teep no se mueve igual que el mae geri).
- **Añadir un movimiento marcial nuevo:** en `js/escena3d.js`, sección *Técnica marcial
  v2*: define la secuencia de poses con `secuencia(dur,[{t,p},…])` partiendo de una
  guardia (`G_KARATE`, `G_MUAY`, `G_TKD`, `G_KEN`) y regístrala en `ANIM_ARQ` (o en
  `ANIM_ARTE` con clave `'arquetipo@arte'` si es una variante de estilo).
- **Crear/editar una rutina:** edita `RUTINAS` en `js/ejercicios.js`. Cada rutina son
  **bloques** con `rep` (nº de series) y la lista de `ids` de ejercicios.
- **Cambiar descansos:** campo `descanso` (segundos) de cada rutina.

## Referencias: en qué se basan las clases

La estructura de cada clase sigue la de las escuelas reales:

**Karate** — orden tradicional documentado: seiretsu/rei (formar y saludar) → mokusō →
carrera → junbi undō (movilidad articular) → acondicionamiento → kihon → kata → kumite →
mokusō final.
- [Class format — Shotokan Karate of America, Univ. de Pittsburgh](https://pitt.ska.org/class-format/)
- [Dojo protocol — JKA Hawaii](https://jkahawaii.com/dojo-protocol/) (apertura y cierre: seiza, mokusō, rei)
- [Estructura de una clase (en español) — Karate Shotokan KI](https://karateshotokanki.jimdofree.com/estructura-de-una-clase/) (60 min en 4 fases de 15)
- [Glosario de términos de dojo — Ashridge Karate](https://www.ashridgekarate.co.uk/glossary) (junbi undō, hojo undō, mokusō…)

**Muay thai** — sesión de gimnasio tailandés: carrera → cuerda → sombra → paos/saco →
clinch → acondicionamiento → estiramientos, en rounds de 2–5 min.
- [Muay thai workout — Muay Thai Guy](https://www.muay-thai-guy.com/blog/muay-thai-workout)
- [Entrenar en Tailandia — World Muay Thai Magazine](https://worldmuaythaimagazine.com/beginner/beginners-guide-muay-thai-thailand/)

**Taekwondo** — calentamiento en 5 fases (movimiento ligero, movilidad articular,
estiramiento dinámico, activación, patadas controladas) → técnica → poomsae → kyorugi.
- [Taekwondo warm-up routine — TVMA Academy](https://www.tvma.academy/taekwondo-blog/taekwondo-warm-up-routine)
- [Guía completa de entrenamiento — Amerikick](https://amerikicklanghorne.com/benefits-of-taekwondo/the-complete-taekwondo-training-guide-for-beginners-skills-structure-and-long-term-progress/)

En casa, el kumite/clinch/kyorugi se sustituye por **sparring de sombra** con visualización
del oponente — el mismo principio que kata y poomsae.

## Aviso

Calienta siempre y escucha a tu cuerpo. Si algo **duele** (no molesta: duele), detente.
Esto no sustituye el consejo de un profesional de la salud. — *Oss.* 🎌

## Licencia y créditos

- Código de Dōjō: **GPL-3.0** (ver `LICENSE`), porque incluye meSpeak/eSpeak (GNU GPL).
- [three.js](https://threejs.org) y `GLTFLoader`: MIT.
- Tipografías Shippori Mincho y Zen Kaku Gothic New: SIL Open Font License.
- El repositorio no incluye modelos 3D de terceros. Si añades uno, revisa su licencia
  (Mixamo, Quaternius y los modelos CC0 son buenas opciones).
