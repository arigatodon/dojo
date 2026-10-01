/* ============================================================
   FIGURAS — muñecos SVG animados que ilustran cada movimiento.
   Cada función devuelve el contenido interno de un <svg>.
   La clase del <svg> (run, squat, punch...) dispara las
   animaciones definidas en css/estilos.css.
   Los pivotes de rotación van en `style="transform-origin:..."`
   inline para no depender de la especificidad CSS.
   ============================================================ */

const SUELO = '<line class="figsuelo" x1="8" y1="120" x2="92" y2="120"/>';
const OT = 'style="transform-origin:top center"';      // pivote en la articulación superior
const OB = 'style="transform-origin:bottom center"';

const PLANTILLAS = {
  /* ---------- CARDIO ---------- */
  run: `
    <g class="an-cuerpo">
      <circle class="figfig cabeza" cx="50" cy="16" r="9"/>
      <line class="figfig" x1="50" y1="25" x2="50" y2="68"/>
      <g class="an-brazo-a" ${OT}><line class="figfig" x1="50" y1="34" x2="50" y2="60"/></g>
      <g class="an-brazo-b" ${OT}><line class="figfig" x1="50" y1="34" x2="50" y2="60"/></g>
      <g class="an-pierna-a" ${OT}><line class="figfig" x1="50" y1="68" x2="50" y2="106"/></g>
      <g class="an-pierna-b" ${OT}><line class="figfig" x1="50" y1="68" x2="50" y2="106"/></g>
    </g>`,

  jump: `
    <g class="an-cuerpo">
      <circle class="figfig cabeza" cx="50" cy="18" r="9"/>
      <line class="figfig" x1="50" y1="27" x2="50" y2="66"/>
      <g class="an-brazo-a" ${OT}><line class="figfig" x1="50" y1="32" x2="50" y2="58"/></g>
      <g class="an-brazo-b" ${OT}><line class="figfig" x1="50" y1="32" x2="50" y2="58"/></g>
      <g class="an-pierna-a" ${OT}><line class="figfig" x1="50" y1="66" x2="50" y2="104"/></g>
      <g class="an-pierna-b" ${OT}><line class="figfig" x1="50" y1="66" x2="50" y2="104"/></g>
    </g>`,

  burpee: `
    ${SUELO}
    <g class="an-todo">
      <circle class="figfig cabeza" cx="50" cy="20" r="9"/>
      <line class="figfig" x1="50" y1="29" x2="50" y2="66"/>
      <line class="figfig figacento" x1="50" y1="34" x2="34" y2="14"/>
      <line class="figfig figacento" x1="50" y1="34" x2="66" y2="14"/>
      <line class="figfig" x1="50" y1="66" x2="40" y2="104"/>
      <line class="figfig" x1="50" y1="66" x2="60" y2="104"/>
    </g>`,

  /* ---------- MOVILIDAD (cada una distinta) ---------- */
  armcircle: `
    ${SUELO}
    <circle class="figfig cabeza" cx="50" cy="16" r="9"/>
    <line class="figfig" x1="50" y1="25" x2="50" y2="70"/>
    <g class="an-brazo-giro" ${OT}><line class="figfig figacento" x1="50" y1="34" x2="50" y2="64"/></g>
    <g class="an-brazo-giro2" ${OT}><line class="figfig figacento" x1="50" y1="34" x2="50" y2="64"/></g>
    <line class="figfig" x1="50" y1="70" x2="40" y2="108"/>
    <line class="figfig" x1="50" y1="70" x2="60" y2="108"/>`,

  hipcircle: `
    ${SUELO}
    <line class="figfig" x1="40" y1="108" x2="50" y2="74"/>
    <line class="figfig" x1="60" y1="108" x2="50" y2="74"/>
    <g class="an-cadera-giro">
      <circle class="figfig cabeza" cx="50" cy="20" r="9"/>
      <line class="figfig" x1="50" y1="29" x2="50" y2="74"/>
      <line class="figfig figacento" x1="50" y1="40" x2="34" y2="52"/>
      <line class="figfig figacento" x1="50" y1="40" x2="66" y2="52"/>
    </g>`,

  catcamel: `
    ${SUELO}
    <line class="figfig" x1="34" y1="78" x2="34" y2="108"/>
    <line class="figfig" x1="74" y1="78" x2="74" y2="108"/>
    <g class="an-espalda" style="transform-origin:center bottom">
      <path class="figfig figacento" d="M34 78 Q54 64 74 78"/>
      <circle class="figfig cabeza" cx="26" cy="82" r="7"/>
    </g>`,

  legswing: `
    ${SUELO}
    <line class="figfig figsuelo" x1="84" y1="20" x2="84" y2="118"/>
    <circle class="figfig cabeza" cx="50" cy="16" r="9"/>
    <line class="figfig" x1="50" y1="25" x2="50" y2="68"/>
    <line class="figfig" x1="50" y1="34" x2="72" y2="40"/>
    <line class="figfig" x1="50" y1="34" x2="40" y2="58"/>
    <line class="figfig" x1="50" y1="68" x2="50" y2="116"/>
    <g class="an-pierna-swing" ${OT}><line class="figfig figacento" x1="50" y1="68" x2="50" y2="104"/></g>`,

  /* ---------- PIERNAS ---------- */
  squat: `
    <g class="an-todo">
      <circle class="figfig cabeza" cx="50" cy="14" r="9"/>
      <line class="figfig" x1="50" y1="23" x2="50" y2="58"/>
      <line class="figfig" x1="50" y1="30" x2="30" y2="44"/>
      <line class="figfig" x1="50" y1="30" x2="70" y2="44"/>
      <rect class="figpeso" x="24" y="40" width="10" height="8" rx="2"/>
      <rect class="figpeso" x="66" y="40" width="10" height="8" rx="2"/>
      <line class="figfig" x1="50" y1="58" x2="34" y2="86"/>
      <line class="figfig" x1="34" y1="86" x2="34" y2="108"/>
      <line class="figfig" x1="50" y1="58" x2="66" y2="86"/>
      <line class="figfig" x1="66" y1="86" x2="66" y2="108"/>
    </g>`,

  jumpsquat: `
    ${SUELO}
    <g class="an-saltosq">
      <circle class="figfig cabeza" cx="50" cy="14" r="9"/>
      <line class="figfig" x1="50" y1="23" x2="50" y2="58"/>
      <line class="figfig figacento" x1="50" y1="30" x2="34" y2="16"/>
      <line class="figfig figacento" x1="50" y1="30" x2="66" y2="16"/>
      <line class="figfig" x1="50" y1="58" x2="36" y2="86"/>
      <line class="figfig" x1="36" y1="86" x2="36" y2="108"/>
      <line class="figfig" x1="50" y1="58" x2="64" y2="86"/>
      <line class="figfig" x1="64" y1="86" x2="64" y2="108"/>
    </g>`,

  sidelunge: `
    ${SUELO}
    <g class="an-sidelunge">
      <circle class="figfig cabeza" cx="50" cy="16" r="9"/>
      <line class="figfig" x1="50" y1="25" x2="50" y2="60"/>
      <line class="figfig" x1="50" y1="32" x2="50" y2="54"/>
      <line class="figfig figacento" x1="50" y1="60" x2="24" y2="84"/>
      <line class="figfig figacento" x1="24" y1="84" x2="24" y2="108"/>
      <line class="figfig" x1="50" y1="60" x2="80" y2="108"/>
    </g>`,

  skater: `
    ${SUELO}
    <g class="an-skater">
      <circle class="figfig cabeza" cx="50" cy="18" r="9"/>
      <line class="figfig" x1="50" y1="27" x2="46" y2="64"/>
      <line class="figfig" x1="48" y1="36" x2="70" y2="30"/>
      <line class="figfig" x1="48" y1="36" x2="30" y2="46"/>
      <line class="figfig figacento" x1="46" y1="64" x2="40" y2="106"/>
      <line class="figfig" x1="46" y1="64" x2="66" y2="84"/>
    </g>`,

  bridge: `
    ${SUELO}
    <circle class="figfig cabeza" cx="20" cy="98" r="8"/>
    <line class="figfig" x1="27" y1="100" x2="52" y2="100"/>
    <g class="an-cadera">
      <line class="figfig figacento" x1="52" y1="100" x2="68" y2="78"/>
    </g>
    <line class="figfig" x1="68" y1="78" x2="68" y2="108"/>
    <line class="figfig" x1="68" y1="108" x2="80" y2="108"/>`,

  calf: `
    ${SUELO}
    <g class="an-puntillas">
      <circle class="figfig cabeza" cx="50" cy="14" r="9"/>
      <line class="figfig" x1="50" y1="23" x2="50" y2="70"/>
      <line class="figfig" x1="50" y1="32" x2="34" y2="50"/>
      <line class="figfig" x1="50" y1="32" x2="66" y2="50"/>
      <line class="figfig" x1="50" y1="70" x2="44" y2="108"/>
      <line class="figfig" x1="50" y1="70" x2="56" y2="108"/>
      <line class="figfig figacento" x1="40" y1="112" x2="44" y2="108"/>
      <line class="figfig figacento" x1="60" y1="112" x2="56" y2="108"/>
    </g>`,

  sideleg: `
    ${SUELO}
    <circle class="figfig cabeza" cx="18" cy="100" r="7"/>
    <line class="figfig" x1="24" y1="102" x2="56" y2="104"/>
    <line class="figfig" x1="56" y1="104" x2="86" y2="110"/>
    <line class="figfig" x1="24" y1="102" x2="20" y2="116"/>
    <line class="figfig" x1="24" y1="102" x2="40" y2="86"/>
    <g class="an-pierna-arriba" style="transform-origin:left center"><line class="figfig figacento" x1="56" y1="100" x2="86" y2="92"/></g>`,

  /* ---------- TREN SUPERIOR ---------- */
  plank: `
    <g class="an-todo">
      <circle class="figfig cabeza" cx="22" cy="74" r="8"/>
      <line class="figfig" x1="29" y1="78" x2="84" y2="96"/>
      <line class="figfig" x1="84" y1="96" x2="92" y2="110"/>
      <line class="figfig" x1="84" y1="96" x2="78" y2="110"/>
      <line class="figfig" x1="30" y1="80" x2="30" y2="108"/>
      <line class="figfig" x1="22" y1="108" x2="40" y2="108"/>
    </g>`,

  sideplank: `
    ${SUELO}
    <g class="an-sideplank">
      <circle class="figfig cabeza" cx="22" cy="56" r="8"/>
      <line class="figfig" x1="28" y1="62" x2="82" y2="104"/>
      <line class="figfig" x1="30" y1="64" x2="30" y2="108"/>
      <line class="figfig" x1="22" y1="108" x2="40" y2="108"/>
      <line class="figfig figacento" x1="42" y1="80" x2="46" y2="40"/>
    </g>`,

  pushup: `
    <g class="an-todo">
      <circle class="figfig cabeza" cx="24" cy="70" r="8"/>
      <line class="figfig" x1="31" y1="74" x2="86" y2="86"/>
      <line class="figfig" x1="86" y1="86" x2="94" y2="108"/>
      <line class="figfig" x1="34" y1="76" x2="34" y2="100"/>
      <line class="figfig" x1="60" y1="80" x2="60" y2="100"/>
    </g>`,

  arms: `
    <circle class="figfig cabeza" cx="50" cy="16" r="9"/>
    <line class="figfig" x1="50" y1="25" x2="50" y2="78"/>
    <line class="figfig" x1="50" y1="36" x2="50" y2="78"/>
    <line class="figfig" x1="36" y1="34" x2="36" y2="60"/>
    <line class="figfig" x1="64" y1="34" x2="64" y2="60"/>
    <g class="an-antebrazo-a" ${OT}><line class="figfig figacento" x1="36" y1="60" x2="36" y2="84"/><circle class="figpeso" cx="36" cy="86" r="6"/></g>
    <g class="an-antebrazo-b" ${OT}><line class="figfig figacento" x1="64" y1="60" x2="64" y2="84"/><circle class="figpeso" cx="64" cy="86" r="6"/></g>
    <line class="figfig" x1="50" y1="78" x2="40" y2="110"/>
    <line class="figfig" x1="50" y1="78" x2="60" y2="110"/>`,

  press: `
    <circle class="figfig cabeza" cx="50" cy="30" r="9"/>
    <line class="figfig" x1="50" y1="39" x2="50" y2="80"/>
    <g class="an-pesas">
      <line class="figfig" x1="50" y1="44" x2="34" y2="22"/>
      <line class="figfig" x1="50" y1="44" x2="66" y2="22"/>
      <rect class="figpeso" x="26" y="14" width="14" height="9" rx="2"/>
      <rect class="figpeso" x="60" y="14" width="14" height="9" rx="2"/>
    </g>
    <line class="figfig" x1="50" y1="80" x2="40" y2="112"/>
    <line class="figfig" x1="50" y1="80" x2="60" y2="112"/>`,

  /* ---------- CORE ---------- */
  crunch: `
    ${SUELO}
    <line class="figfig" x1="58" y1="100" x2="74" y2="84"/>
    <line class="figfig" x1="74" y1="84" x2="86" y2="100"/>
    <g class="an-torso" style="transform-origin:right bottom">
      <line class="figfig figacento" x1="30" y1="100" x2="58" y2="100"/>
      <circle class="figfig cabeza" cx="24" cy="98" r="7"/>
    </g>`,

  legraise: `
    ${SUELO}
    <circle class="figfig cabeza" cx="16" cy="100" r="7"/>
    <line class="figfig" x1="22" y1="102" x2="56" y2="102"/>
    <g class="an-piernas-arriba" style="transform-origin:left center">
      <line class="figfig figacento" x1="56" y1="102" x2="92" y2="102"/>
    </g>`,

  twist: `
    ${SUELO}
    <line class="figfig" x1="50" y1="98" x2="74" y2="82"/>
    <line class="figfig" x1="74" y1="82" x2="80" y2="100"/>
    <g class="an-giro-torso" style="transform-origin:center bottom">
      <line class="figfig" x1="50" y1="98" x2="42" y2="66"/>
      <circle class="figfig cabeza" cx="40" cy="58" r="8"/>
      <line class="figfig figacento" x1="44" y1="74" x2="64" y2="82"/>
    </g>`,

  superman: `
    ${SUELO}
    <g class="an-vuela">
      <circle class="figfig cabeza" cx="24" cy="92" r="7"/>
      <line class="figfig" x1="30" y1="94" x2="70" y2="98"/>
      <line class="figfig figacento" x1="30" y1="94" x2="10" y2="84"/>
      <line class="figfig figacento" x1="70" y1="98" x2="90" y2="86"/>
    </g>`,

  birddog: `
    ${SUELO}
    <line class="figfig" x1="42" y1="74" x2="42" y2="108"/>
    <line class="figfig" x1="64" y1="78" x2="64" y2="108"/>
    <line class="figfig" x1="42" y1="74" x2="64" y2="78"/>
    <circle class="figfig cabeza" cx="36" cy="72" r="7"/>
    <g class="an-extiende">
      <line class="figfig figacento" x1="42" y1="74" x2="18" y2="60"/>
      <line class="figfig figacento" x1="64" y1="78" x2="90" y2="64"/>
    </g>`,

  mountain: `
    <circle class="figfig cabeza" cx="22" cy="60" r="8"/>
    <line class="figfig" x1="29" y1="64" x2="78" y2="80"/>
    <line class="figfig" x1="30" y1="66" x2="30" y2="108"/>
    <g class="an-pierna-a" ${OT}><line class="figfig figacento" x1="78" y1="80" x2="78" y2="116"/></g>
    <g class="an-pierna-b" ${OT}><line class="figfig figacento" x1="78" y1="80" x2="56" y2="100"/></g>
    ${SUELO}`,

  /* ---------- TÉCNICA MARCIAL ---------- */
  kick: `
    ${SUELO}
    <circle class="figfig cabeza" cx="40" cy="16" r="9"/>
    <line class="figfig" x1="40" y1="25" x2="44" y2="64"/>
    <line class="figfig" x1="42" y1="34" x2="24" y2="48"/>
    <line class="figfig" x1="42" y1="36" x2="60" y2="30"/>
    <line class="figfig" x1="44" y1="64" x2="40" y2="116"/>
    <g class="an-pierna-pat" ${OT}><line class="figfig figacento" x1="44" y1="64" x2="44" y2="100"/></g>`,

  roundhouse: `
    ${SUELO}
    <path class="figfig figacento" style="opacity:.35" d="M44 30 Q92 50 70 96" fill="none"/>
    <circle class="figfig cabeza" cx="40" cy="18" r="9"/>
    <line class="figfig" x1="40" y1="27" x2="44" y2="66"/>
    <line class="figfig" x1="42" y1="36" x2="26" y2="30"/>
    <line class="figfig" x1="42" y1="38" x2="56" y2="50"/>
    <line class="figfig" x1="44" y1="66" x2="42" y2="116"/>
    <g class="an-pat-circ" ${OT}><line class="figfig figacento" x1="44" y1="66" x2="44" y2="102"/></g>`,

  kneestrike: `
    ${SUELO}
    <circle class="figfig cabeza" cx="46" cy="16" r="9"/>
    <line class="figfig" x1="46" y1="25" x2="48" y2="64"/>
    <line class="figfig" x1="47" y1="36" x2="36" y2="56"/>
    <line class="figfig" x1="47" y1="36" x2="58" y2="56"/>
    <line class="figfig" x1="48" y1="64" x2="46" y2="116"/>
    <g class="an-rodilla" ${OT}>
      <line class="figfig figacento" x1="48" y1="64" x2="48" y2="86"/>
      <line class="figfig figacento" x1="48" y1="86" x2="40" y2="104"/>
    </g>`,

  punch: `
    ${SUELO}
    <circle class="figfig cabeza" cx="40" cy="16" r="9"/>
    <line class="figfig" x1="40" y1="25" x2="42" y2="70"/>
    <line class="figfig" x1="42" y1="70" x2="30" y2="108"/>
    <line class="figfig" x1="42" y1="70" x2="58" y2="104"/>
    <g class="an-puno-a"><line class="figfig figacento" x1="42" y1="36" x2="74" y2="36"/><circle class="figfig cabeza" cx="76" cy="36" r="5"/></g>
    <g class="an-puno-b"><line class="figfig" x1="42" y1="42" x2="58" y2="42"/><circle class="figfig cabeza" cx="60" cy="42" r="4"/></g>`,

  block: `
    ${SUELO}
    <circle class="figfig cabeza" cx="44" cy="16" r="9"/>
    <line class="figfig" x1="44" y1="25" x2="46" y2="70"/>
    <line class="figfig" x1="46" y1="70" x2="34" y2="108"/>
    <line class="figfig" x1="46" y1="70" x2="62" y2="108"/>
    <line class="figfig" x1="46" y1="40" x2="62" y2="56"/>
    <line class="figfig" x1="46" y1="38" x2="34" y2="50"/>
    <g class="an-bloqueo" ${OT}><line class="figfig figacento" x1="46" y1="40" x2="46" y2="62"/></g>`,

  elbow: `
    ${SUELO}
    <circle class="figfig cabeza" cx="44" cy="16" r="9"/>
    <line class="figfig" x1="44" y1="25" x2="46" y2="70"/>
    <line class="figfig" x1="46" y1="70" x2="34" y2="108"/>
    <line class="figfig" x1="46" y1="70" x2="62" y2="108"/>
    <g class="an-codo" ${OT}>
      <line class="figfig figacento" x1="46" y1="38" x2="64" y2="44"/>
      <line class="figfig figacento" x1="64" y1="44" x2="58" y2="26"/>
    </g>`,

  /* ---------- KENJUTSU ---------- */
  sword: `
    ${SUELO}
    <circle class="figfig cabeza" cx="50" cy="34" r="9"/>
    <line class="figfig" x1="50" y1="43" x2="50" y2="80"/>
    <line class="figfig" x1="50" y1="80" x2="34" y2="84"/>
    <line class="figfig" x1="34" y1="84" x2="34" y2="116"/>
    <line class="figfig" x1="50" y1="80" x2="68" y2="84"/>
    <line class="figfig" x1="68" y1="84" x2="68" y2="116"/>
    <g class="an-corte" style="transform-origin:50px 48px">
      <line class="figfig" x1="50" y1="48" x2="44" y2="26"/>
      <line class="figfig" x1="50" y1="48" x2="56" y2="26"/>
      <line class="figpeso" style="stroke:var(--oro);stroke-width:4" x1="50" y1="26" x2="50" y2="-22"/>
    </g>`,

  kamae: `
    ${SUELO}
    <circle class="figfig cabeza" cx="40" cy="22" r="9"/>
    <line class="figfig" x1="40" y1="31" x2="42" y2="72"/>
    <line class="figfig" x1="42" y1="72" x2="26" y2="110"/>
    <line class="figfig" x1="42" y1="72" x2="70" y2="108"/>
    <g class="an-kamae">
      <line class="figfig" x1="42" y1="42" x2="64" y2="56"/>
      <line class="figfig" x1="42" y1="46" x2="60" y2="58"/>
      <line style="stroke:var(--oro);stroke-width:4;stroke-linecap:round" x1="62" y1="57" x2="96" y2="40"/>
    </g>`,

  /* ---------- CALMA ---------- */
  stretch: `
    ${SUELO}
    <line class="figfig" x1="50" y1="78" x2="40" y2="116"/>
    <line class="figfig" x1="50" y1="78" x2="60" y2="116"/>
    <g class="an-torso" ${OB}>
      <line class="figfig" x1="50" y1="78" x2="50" y2="34"/>
      <circle class="figfig cabeza" cx="50" cy="24" r="9"/>
      <line class="figfig figacento" x1="50" y1="40" x2="68" y2="22"/>
      <line class="figfig" x1="50" y1="44" x2="36" y2="64"/>
    </g>`,

  balance: `
    ${SUELO}
    <g class="an-todo" ${OB}>
      <circle class="figfig cabeza" cx="50" cy="16" r="9"/>
      <line class="figfig" x1="50" y1="25" x2="50" y2="66"/>
      <line class="figfig" x1="50" y1="34" x2="30" y2="40"/>
      <line class="figfig" x1="50" y1="34" x2="70" y2="40"/>
      <line class="figfig" x1="50" y1="66" x2="50" y2="116"/>
      <line class="figfig figacento" x1="50" y1="66" x2="34" y2="86"/>
      <line class="figfig figacento" x1="34" y1="86" x2="52" y2="92"/>
    </g>`,

  breathe: `
    <circle class="figfig an-anillo" cx="50" cy="60" r="34" style="opacity:.4"/>
    <g class="an-todo">
      <circle class="figfig cabeza" cx="50" cy="38" r="9"/>
      <line class="figfig" x1="50" y1="47" x2="50" y2="78"/>
      <line class="figfig" x1="50" y1="78" x2="30" y2="92"/>
      <line class="figfig" x1="50" y1="78" x2="70" y2="92"/>
      <line class="figfig" x1="38" y1="60" x2="50" y2="70"/>
      <line class="figfig" x1="62" y1="60" x2="50" y2="70"/>
    </g>
    <line class="figsuelo" x1="20" y1="92" x2="80" y2="92"/>`,
};

/* Cada arquetipo de ejercicio usa una plantilla de figura.
   Procura que ejercicios distintos usen figuras distintas. */
const MAPA_FIGURA = {
  /* cardio */
  trote:'run', cardio:'run', rodillas:'run', talones:'run', skipping:'run',
  jumping:'jump', saltos:'jump', burpee:'burpee',
  /* movilidad — cada una su figura */
  cuello:'stretch', cuadriceps:'stretch', isquios:'stretch', hombros:'stretch',
  mov_brazos:'armcircle', circulo_cadera:'hipcircle', gato:'catcamel', balanceo:'legswing',
  /* piernas */
  sentadilla:'squat', zancada:'squat', postura:'squat', sumo:'squat',
  jumpsquat:'jumpsquat', sidelunge:'sidelunge', skater:'skater',
  puente:'bridge', gemelos:'calf', abduccion:'sideleg',
  /* tren superior */
  plancha:'plank', plancha_lateral:'sideplank',
  flexion:'pushup', fondo:'pushup', pike:'pushup',
  curl:'arms', remo:'arms', press:'press', elevacion:'press',
  /* core */
  abdominal:'crunch', bicicleta:'crunch', escalador:'mountain',
  legraise:'legraise', twist:'twist', superman:'superman', birddog:'birddog',
  /* marcial */
  patada:'kick', patada_lateral:'kick', patada_atras:'kick', patada_hacha:'kick',
  roundhouse:'roundhouse', rodillazo:'kneestrike',
  avance_puno:'punch', creciente:'kick', patada_salto:'kick', rodillazo_salto:'kneestrike',
  zancada_andando:'squat', desplazamiento:'skater',
  puno:'punch', puno_kiba:'punch', guardia_karate:'punch', gancho:'punch', bloqueo:'block', bloqueo_bajo:'block', bloqueo_interior:'block', shuto:'block', codo:'elbow',
  espada:'sword', kamae:'kamae',
  equilibrio:'balance', grulla:'balance',
  /* calma */
  estiramiento:'stretch', movilidad:'stretch', respiracion:'breathe', meditacion:'breathe', soltar:'breathe',
};

/* Devuelve el <svg> completo para un arquetipo dado */
function figuraSVG(arquetipo){
  const clave = MAPA_FIGURA[arquetipo] || 'run';
  const cuerpo = PLANTILLAS[clave] || PLANTILLAS.run;
  return `<svg viewBox="0 0 100 130" class="${clave}" aria-hidden="true">${cuerpo}</svg>`;
}
