/* ============================================================
   DŌJŌ — lógica principal
   ============================================================ */

/* ---------------- Navegación entre vistas ---------------- */
function irA(vista){
  document.querySelectorAll('.vista').forEach(v=>v.classList.remove('activa'));
  document.getElementById('vista-'+vista).classList.add('activa');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('activa', b.dataset.vista===vista));
  document.body.classList.toggle('en-clase', vista==='clase');
  window.scrollTo(0,0);
  if(vista==='inicio'){ renderInicio(); montarPortada(); }
  else if(HAY_3D && vista!=='clase') Dojo3D.detener();      // fuera de la portada y la clase, la GPU descansa
  if(vista==='mediciones') renderMediciones();
  if(vista==='biblioteca') renderBiblioteca();
}

/* ¿Hay WebGL? Se comprueba UNA vez (crear lienzos de prueba repetidamente fuga contextos) */
const HAY_3D = (typeof Dojo3D!=='undefined') && Dojo3D.disponible();

/* Portada: el dojo vivo con el personaje meditando, la cámara paseando despacio */
function montarPortada(){
  if(!HAY_3D) return;
  const cont = document.getElementById('portada-3d');
  Dojo3D.montarAmbiente(cont, fondoGuardado==='zen'?'madera':fondoGuardado, personajeGuardado);
  requestAnimationFrame(()=>Dojo3D.resize());
}

/* ============================================================
   INICIO — tarjetas de rutina y estadísticas
   ============================================================ */
const COLOR_ARTE = {karate:'#e64d36', muaythai:'#d9b25f', taekwondo:'#6f8fd0', kenjutsu:'#8fae6b'};
function renderInicio(){
  // tarjetas (clases generales y disciplinas marciales por separado)
  const tarjeta = (k,r)=>`
    <button class="tarjeta${r.arte?' tarjeta-arte':''}" onclick="iniciarClase('${k}')" style="--color-arte:${COLOR_ARTE[k]||'var(--kin)'}">
      ${r.arte?'<span class="obi" aria-hidden="true"></span>':''}
      <span class="kanji" aria-hidden="true">${r.kanji}</span>
      <span class="dur">${r.dur}</span>
      <h3>${r.nombre}</h3>
      <p>${r.desc}</p>
      <span class="tarjeta-meta"><span>${resumenRutina(r)}</span><span class="tarjeta-fig" aria-hidden="true">${figuraSVG(FIGURA_TARJETA[k]||'respiracion')}</span></span>
    </button>`;
  const entradas = Object.entries(RUTINAS);
  document.getElementById('tarjetas-rutinas').innerHTML =
    entradas.filter(([,r])=>!r.arte).map(([k,r])=>tarjeta(k,r)).join('');
  document.getElementById('tarjetas-artes').innerHTML =
    entradas.filter(([,r])=>r.arte).map(([k,r])=>tarjeta(k,r)).join('');

  // estadísticas
  const ses = leerSesiones();
  const minutos = ses.reduce((a,s)=>a+(s.minutos||0),0);
  document.getElementById('stat-sesiones').textContent = ses.length;
  document.getElementById('stat-minutos').textContent = minutos;
  document.getElementById('stat-racha').textContent = calcularRacha(ses);
}

/* Figura que ilustra cada clase en su tarjeta, y resumen (técnicas y pausas de agua) */
const FIGURA_TARJETA = {completa:'patada', express:'jumping', sorprende:'burpee',
  karate:'puno', muaythai:'rodillazo', taekwondo:'roundhouse', kenjutsu:'espada'};
function resumenRutina(r){
  if(r.generar) return 'Al azar · 1 pausa';
  const pasos = construirTimeline(itemsDeRutina(r));
  const n = pasos.filter(p=>p.tipo==='ejercicio').length, d = pasos.filter(p=>p.tipo==='descanso').length;
  return `${n} técnicas · ` + (d ? `${d} pausa${d>1?'s':''}` : 'sin pausa');
}

function calcularRacha(ses){
  if(!ses.length) return 0;
  const dias = [...new Set(ses.map(s=>s.fecha))].sort().reverse();
  let racha=0;
  let cursor = new Date(); cursor.setHours(0,0,0,0);
  const hoy = fechaISO(cursor);
  // si la última sesión no es hoy ni ayer, racha rota
  if(dias[0]!==hoy){
    const ayer = new Date(cursor); ayer.setDate(ayer.getDate()-1);
    if(dias[0]!==fechaISO(ayer)) return 0;
    cursor = ayer;
  }
  for(const d of dias){
    if(d===fechaISO(cursor)){ racha++; cursor.setDate(cursor.getDate()-1); }
    else break;
  }
  return racha;
}

/* ============================================================
   REPRODUCTOR DE CLASE
   ============================================================ */
let estado = { pasos:[], i:0, restante:0, intervalo:null, pausado:false, rutina:null, cues:[] };
let vozActiva = localStorage.getItem('dojo_voz')!=='off';

/* Voz híbrida. Orden de preferencia:
   1) Voz del NAVEGADOR en español (la de Chrome/Safari): mejor calidad. Se prioriza
      una local (offline) pero, si no hay, se usa cualquiera en español del navegador.
   2) Si la del navegador falla al hablar (p. ej. voz de servidor sin internet) o no
      hay ninguna en español, se cae al motor propio (meSpeak/eSpeak) de vendor/mespeak,
      que suena más robótico pero funciona SIEMPRE sin conexión. */
const VOZ_OFFLINE_ID = 'es';   // 'es' (España) o 'es-la' (Latinoamérica)
let vozNativa = null;          // SpeechSynthesisVoice en español del navegador, o null
let motorOffline = null;       // null | 'cargando' | 'listo' | 'no'
let colaOffline = [];          // avisos en espera mientras carga el motor
function detectarVozNativa(){
  if(!('speechSynthesis' in window)) return;
  const es = speechSynthesis.getVoices().filter(v => /^es(\b|[-_])/i.test(v.lang));
  // 1º una local (offline, buena calidad); 2º cualquier voz en español del navegador
  vozNativa = es.find(v => v.localService) || es[0] || null;
}
if('speechSynthesis' in window){
  detectarVozNativa();
  speechSynthesis.onvoiceschanged = detectarVozNativa;
}

/* ---------------- Sensei conversador (frases) ---------------- */
const FRASES = {
  inicio:['Vamos, tú puedes','Concéntrate y respira','Con energía','Postura firme, mente tranquila',
          'A por ello','Enfócate en la técnica','Cabeza fría, corazón fuerte'],
  animo:['Vamos, tú puedes','Lo estás haciendo muy bien','Mantén la técnica','Respira y sigue',
         'Firme, no aflojes','Cada repetición cuenta','Eso es, sigue así','Fuerza y control',
         'Tu esfuerzo de hoy es tu fuerza de mañana','Domina el movimiento, no lo apresures'],
  final:['Quedan cinco segundos, con toda la fuerza','Últimos segundos, no aflojes','Cinco segundos, dalo todo',
         'Aguanta, ya casi lo logras','Termina fuerte, queda muy poco'],
  descanso:['Recupera el aliento','Buen trabajo, descansa','Respira hondo y relaja los hombros',
            'Bien hecho, toma aire','Suelta la tensión y respira'],
  fin:['Todo trabajo tiene su recompensa','Excelente clase, lo lograste','Gran trabajo de principio a fin',
       'Disciplina y constancia, bien hecho','Hoy fuiste más fuerte que ayer'],
};
const eligeFrase = arr => arr[Math.floor(Math.random()*arr.length)];

/* Programa los avisos de voz que se irán diciendo mientras corre el tiempo */
function construirCues(p){
  const cues = [];
  if(p.tipo==='ejercicio'){
    const ej=p.ej, dur=p.dur;
    let base = [];
    base.push(ej.tipo==='reps' ? `${ej.reps} repeticiones${ej.pesas?', con pesas':''}` : 'Mantén el ritmo');
    if(ej.espacio) base.push('Asegúrate de tener unos dos metros libres al frente');
    ej.instrucciones.forEach(t=>base.push(t));      // los detalles, leídos uno a uno
    base.push(eligeFrase(FRASES.animo));
    base.push('🫁'+ej.respiracion);
    // limitar densidad según la duración (deja ~6s al final)
    const maxN = Math.max(2, Math.floor((dur-6)/4));
    if(base.length>maxN) base = base.slice(0,maxN);
    const ini=5, fin=Math.max(ini+1, dur-7);
    base.forEach((txt,k)=>{
      const at = base.length>1 ? ini + k*(fin-ini)/(base.length-1) : ini;
      cues.push({at, txt:txt.replace('🫁','')});
    });
    if(dur>=12) cues.push({at:dur-5, txt:eligeFrase(FRASES.final)});
  } else if(p.tipo==='descanso'){
    cues.push({at:4, txt:eligeFrase(FRASES.descanso)});
    if(p.dur>=90) cues.push({at:p.dur-60, txt:'Sigue respirando despacio. Queda un minuto'});
    const sig = estado.pasos[estado.pasos.indexOf(p)+1];
    if(sig && sig.ej) cues.push({at:p.dur-10, txt:'Diez segundos. Vuelve a tu sitio para '+sig.ej.nombre});
  }
  return cues.sort((a,b)=>a.at-b.at);
}
let usar3D = false;
let fondoGuardado = localStorage.getItem('dojo_fondo')||'madera';
let personajeGuardado = localStorage.getItem('dojo_personaje')||'karateka';
if(typeof Dojo3D!=='undefined'){                    // claves de versiones anteriores → valores actuales
  if(!Dojo3D.fondos[fondoGuardado] || Dojo3D.fondos[fondoGuardado].oculto) fondoGuardado='madera';
  if(!Dojo3D.personajes[personajeGuardado]) personajeGuardado='karateka';
}
let hudMinimo = localStorage.getItem('dojo_hud')==='min';

/* Pinta la figura del paso actual: 3D si hay WebGL, si no SVG de respaldo */
function pintarFigura(arquetipo, arte){
  const fig = document.getElementById('figura');
  if(usar3D){ fig.classList.remove('svg2d'); Dojo3D.setEjercicio(arquetipo, arte); }
  else { fig.classList.add('svg2d'); fig.innerHTML = figuraSVG(arquetipo); }
}

/* Lista de {id, bloque} de una rutina: el bloque es el título de la parte de la clase
   (Kihon, Kata, Core · serie 2/2…) y se muestra en el HUD para saber dónde estás */
function itemsDeRutina(r){
  if(r.bloques && !r.generar){
    const out=[];
    r.bloques.forEach(b=>{ for(let k=0;k<b.rep;k++) b.ids.forEach(id=>out.push({id, bloque:(b.titulo||'')+(b.rep>1?` · serie ${k+1}/${b.rep}`:'')})); });
    return out;
  }
  return idsDeRutina(r).map(id=>({id, bloque:(POR_ID[id] && CATEGORIAS[POR_ID[id].categoria]) ? CATEGORIAS[POR_ID[id].categoria].nombre : ''}));
}

/* Ritmo de la clase: entre técnica y técnica solo hay un CAMBIO breve (colocarse y
   ver la siguiente), y el DESCANSO de verdad llega cada 20–30 min de trabajo, al
   terminar un bloque (como la pausa para beber agua de una clase real).          */
const RITMO = {
  cambio:5,            // s entre ejercicios
  cambioLado:3,        // s para cambiar de lado en ejercicios unilaterales
  descanso:120,        // s del descanso largo
  descansoDesde:20*60, // trabajo acumulado a partir del cual se descansa al acabar el bloque
  descansoMax:30*60,   // si el bloque es muy largo, se descansa igual al llegar aquí
  sinDescansoFinal:5*60, // no descansar si queda menos que esto de clase
};
function construirTimeline(items){
  const pasos = [{tipo:'prep', dur:10, bloque:'Saludo'}];
  const total = items.reduce((a,it)=>{ const ej=POR_ID[it.id]; return a + (ej ? ej.duracion*(ej.lado?2:1) : 0); }, 0);
  let trabajo = 0, desdeDescanso = 0, bloqueAnt = null;
  items.forEach(it=>{
    const ej = POR_ID[it.id]; if(!ej) return;
    if(bloqueAnt!==null){
      const finBloque = it.bloque!==bloqueAnt;
      const quedaClase = total - trabajo >= RITMO.sinDescansoFinal;
      if(quedaClase && ((finBloque && desdeDescanso>=RITMO.descansoDesde) || desdeDescanso>=RITMO.descansoMax)){
        pasos.push({tipo:'descanso', dur:RITMO.descanso, bloque:'Descanso · agua'});
        desdeDescanso = 0;
      } else pasos.push({tipo:'cambio', dur:RITMO.cambio, bloque:it.bloque});
    }
    const lados = ej.lado ? ['Lado derecho','Lado izquierdo'] : [null];
    lados.forEach((suf,li)=>{
      if(li>0) pasos.push({tipo:'cambio', dur:RITMO.cambioLado, bloque:it.bloque, lado:true});
      pasos.push({tipo:'ejercicio', ej, dur:ej.duracion, suf, bloque:it.bloque});
      trabajo += ej.duracion; desdeDescanso += ej.duracion;
    });
    bloqueAnt = it.bloque;
  });
  return pasos;
}

function iniciarClase(key){
  const r = RUTINAS[key];
  iniciarAudio();           // desbloquea audio con el gesto del usuario
  taiko();                  // el tambor abre la clase
  // las puertas shoji se cierran, cambia la escena detrás y se abren sobre el dojo
  cerrarShoji(()=>{
    estado.pasos = construirTimeline(itemsDeRutina(r));
    estado.i = 0;
    estado.pausado = false;
    estado.rutina = {key, nombre:r.nombre};
    actualizarBotonVoz();
    aplicarHud();
    irA('clase');
    // Escena 3D (con respaldo a SVG si el dispositivo no soporta WebGL)
    usar3D = HAY_3D;
    document.getElementById('btn-fondo').style.display = usar3D?'':'none';
    document.getElementById('btn-personaje').style.display = usar3D?'':'none';
    if(usar3D){
      Dojo3D.init(document.getElementById('figura'));
      Dojo3D.vistaClase();                 // cámara fija de clase (por si venías del visor de la Biblioteca)
      Dojo3D.setPersonaje(personajeGuardado);
      Dojo3D.setFondo(fondoGuardado);
      Dojo3D.arrancar();
      requestAnimationFrame(()=>Dojo3D.resize());
    }
    document.getElementById('paso-total').textContent = estado.pasos.filter(p=>p.tipo==='ejercicio').length;
    cargarPaso(0, true);
    arrancarReloj();
  });
}

/* Puertas shoji: se cierran (cb en el momento oscuro) y se vuelven a abrir */
function cerrarShoji(cb){
  const sh = document.getElementById('shoji');
  sh.classList.add('activa');
  requestAnimationFrame(()=>requestAnimationFrame(()=>sh.classList.add('cerrada')));
  setTimeout(()=>{ cb(); setTimeout(()=>{ sh.classList.remove('cerrada'); setTimeout(()=>sh.classList.remove('activa'), 900); }, 250); }, 900);
}

/* Modo inmersivo: oculta la guía para dejar solo el dojo, el nombre y el tiempo */
function alternarHud(){
  hudMinimo = !hudMinimo;
  localStorage.setItem('dojo_hud', hudMinimo?'min':'full');
  aplicarHud();
  mostrarToast(hudMinimo ? 'Modo inmersivo' : 'Guía visible');
}
function aplicarHud(){
  document.getElementById('hud').classList.toggle('minimo', hudMinimo);
  document.getElementById('btn-hud').classList.toggle('activo', hudMinimo);
}

/* Atajos de teclado durante la clase */
document.addEventListener('keydown', e=>{
  if(!document.body.classList.contains('en-clase')) return;
  if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if(e.code==='Space'){ e.preventDefault(); alternarPausa(); }
  else if(e.key==='ArrowRight') pasoSiguiente();
  else if(e.key==='ArrowLeft') pasoAnterior();
  else if(e.key.toLowerCase()==='h') alternarHud();
});

function arrancarReloj(){
  clearInterval(estado.intervalo);
  estado.intervalo = setInterval(tic, 1000);
}

function tic(){
  if(estado.pausado) return;
  estado.restante--;
  // avisos de voz del sensei según avanza el tiempo
  const dur = estado.pasos[estado.i].dur;
  const transcurrido = dur - estado.restante;
  while(estado.cues.length && transcurrido >= estado.cues[0].at){
    anunciar(estado.cues.shift().txt);
  }
  if(estado.restante <= 3 && estado.restante > 0) golpeMadera();
  if(estado.restante <= 0){
    campana();
    avanzar(1);
    return;
  }
  pintarContador();
}

function cargarPaso(i, anunciar){
  estado.i = i;
  const p = estado.pasos[i];
  estado.restante = p.dur;

  const chip = document.getElementById('chip-categoria');
  const nombre = document.getElementById('ejercicio-nombre');
  const meta = document.getElementById('meta-ejercicio');
  const instr = document.getElementById('instrucciones');
  const resp = document.getElementById('respiracion');
  const sig = document.getElementById('siguiente');
  const cont = document.getElementById('contador');

  const proximo = proximoEjercicio(i);
  cont.className = 'contador';
  document.getElementById('bloque-actual').textContent = p.bloque || '';

  if(p.tipo==='ejercicio'){
    const ej = p.ej, cat = CATEGORIAS[ej.categoria];
    chip.textContent = cat.nombre;
    chip.style.display='';
    pintarFigura(ej.arquetipo, ej.arte);
    nombre.textContent = ej.nombre + (p.suf? ' · '+p.suf : '');
    const tag = ej.tipo==='reps' ? `${ej.reps} repeticiones` : `${ej.duracion}s`;
    meta.innerHTML = tag + (ej.pesas? ' &nbsp;·&nbsp; 🏋️ con pesas':'') + (ej.espacio? ' &nbsp;·&nbsp; ↔️ necesita espacio':'');
    instr.innerHTML = ej.instrucciones.map(t=>`<li>${t}</li>`).join('');
    resp.textContent = '🫁 '+ej.respiracion;
    sig.innerHTML = proximo ? `<span>Después: <b>${proximo}</b></span>` : '<span>Último ejercicio 🎌</span>';
  }
  else if(p.tipo==='prep'){
    chip.style.display='none';
    pintarFigura('respiracion');
    nombre.textContent = 'Prepárate';
    meta.textContent = 'La clase comienza…';
    instr.innerHTML = '<li>Colócate en tu metro cuadrado</li><li>Ten el agua y las pesas a mano</li><li>Respira y enfoca</li>';
    resp.textContent = '🙇 Saludo al dojo: enfoca tu mente.';
    sig.innerHTML = proximo ? `<span>Empezamos con: <b>${proximo}</b></span>` : '';
    cont.classList.add('descanso');
  }
  else if(p.tipo==='cambio'){               // transición breve: ya se ve (y se lee) la siguiente técnica
    const sigP = estado.pasos[i+1], ej = sigP && sigP.ej;
    chip.textContent = p.lado ? 'Cambia de lado' : 'Siguiente';
    chip.style.display='';
    if(ej){
      pintarFigura(ej.arquetipo, ej.arte);
      nombre.textContent = ej.nombre + (sigP.suf? ' · '+sigP.suf : '');
      const tag = ej.tipo==='reps' ? `${ej.reps} repeticiones` : `${ej.duracion}s`;
      meta.innerHTML = 'Colócate · ' + tag + (ej.pesas? ' &nbsp;·&nbsp; 🏋️ con pesas':'') + (ej.espacio? ' &nbsp;·&nbsp; ↔️ necesita espacio':'');
      instr.innerHTML = ej.instrucciones.map(t=>`<li>${t}</li>`).join('');
      resp.textContent = '🫁 '+ej.respiracion;
    }
    sig.innerHTML = '';
    cont.classList.add('descanso');
  }
  else { // descanso largo (cada 20–30 min de trabajo)
    chip.textContent = 'Descanso';
    chip.style.display='';
    pintarFigura('meditacion');
    nombre.textContent = 'Pausa para el agua';
    meta.textContent = `${Math.round(p.dur/60)} min · llevas ${minutosHechos(i)} min de clase`;
    instr.innerHTML = '<li>Bebe agua a sorbos pequeños</li><li>Camina un poco y sacude brazos y piernas</li><li>Seca el sudor de manos y cara</li><li>Si quieres seguir ya, pulsa ⏭</li>';
    resp.textContent = '🫁 Inhala por la nariz en 4 tiempos, exhala largo por la boca en 6.';
    sig.innerHTML = proximo ? `<span>Al volver: <b>${proximo}</b></span>` : '';
    cont.classList.add('descanso');
  }

  pintarContador();
  pintarProgreso();
  estado.cues = construirCues(p);           // programa los avisos de voz del paso
  if(anunciar) anunciarPaso(p, proximo);
}

function pintarContador(){
  const cont = document.getElementById('contador');
  cont.textContent = formatoTiempo(estado.restante);
  const p = estado.pasos[estado.i];
  if(p.tipo==='ejercicio' && estado.restante<=3){
    cont.classList.remove('descanso'); cont.classList.add('alerta');
  }
  document.getElementById('tiempo-total-restante').textContent = formatoTiempo(tiempoRestanteTotal());
  const trazo = document.getElementById('contador-trazo');          // pincelada que se consume con el tiempo del paso
  trazo.style.transform = `scaleX(${p.dur ? Math.max(0, estado.restante/p.dur) : 0})`;
  trazo.className = p.tipo==='ejercicio' ? (estado.restante<=3 ? 'alerta' : '') : 'calma';
}

function pintarProgreso(){
  const ejercicios = estado.pasos.filter(p=>p.tipo==='ejercicio');
  const hechos = estado.pasos.slice(0,estado.i+1).filter(p=>p.tipo==='ejercicio').length;
  document.getElementById('paso-actual').textContent = Math.max(1,hechos);
  const pct = (estado.i/(estado.pasos.length-1))*100;
  document.getElementById('progreso-relleno').style.width = pct+'%';
}

function minutosHechos(i){
  return Math.round(estado.pasos.slice(0,i).reduce((a,p)=>a+p.dur,0)/60);
}
function tiempoRestanteTotal(){
  let t = estado.restante;
  for(let k=estado.i+1;k<estado.pasos.length;k++) t += estado.pasos[k].dur;
  return t;
}

function proximoEjercicio(i){
  for(let k=i+1;k<estado.pasos.length;k++)
    if(estado.pasos[k].tipo==='ejercicio'){
      const p = estado.pasos[k];
      return p.ej.nombre + (p.suf? ' ('+p.suf+')':'');
    }
  return null;
}
function proximoArquetipo(i){
  for(let k=i+1;k<estado.pasos.length;k++)
    if(estado.pasos[k].tipo==='ejercicio') return estado.pasos[k].ej.arquetipo;
  return 'respiracion';
}

function avanzar(dir){
  const nuevo = estado.i + dir;
  if(nuevo >= estado.pasos.length){ terminarClase(true); return; }
  if(nuevo < 0){ cargarPaso(0,false); return; }
  cargarPaso(nuevo, true);
}
function pasoSiguiente(){ avanzar(1); }
function pasoAnterior(){ avanzar(-1); }

function alternarPausa(){
  estado.pausado = !estado.pausado;
  document.getElementById('btn-pausa').textContent = estado.pausado ? '▶' : '⏸';
  if(estado.pausado) detenerVoz();
}

function terminarClase(completada){
  clearInterval(estado.intervalo);
  detenerVoz();
  if(completada){
    const minutos = Math.round(estado.pasos.reduce((a,p)=>a+p.dur,0)/60);
    registrarSesion(estado.rutina, minutos);
    const frase = eligeFrase(FRASES.fin);
    taiko(); setTimeout(campana, 350);
    anunciar('Clase terminada. '+frase+'. Oss.');
    document.getElementById('fin-frase').textContent = frase+'.';
    document.getElementById('fin-minutos').textContent = minutos;
    document.getElementById('fin-ejercicios').textContent = estado.pasos.filter(p=>p.tipo==='ejercicio').length;
    document.getElementById('fin-racha').textContent = calcularRacha(leerSesiones());
    prepararOpinion();
    document.getElementById('fin-clase').classList.remove('oculto');
    return;                              // el dojo sigue detrás hasta que saludas (Oss)
  }
  irA('inicio');
}
/* ---------------- Opinión del alumno tras la clase ----------------
   Sin servidor: la opinión se guarda en localStorage y, al enviar, se abre
   un issue de GitHub ya rellenado para que el alumno lo publique.        */
const REPO_OPINION = 'https://github.com/arigatodon/dojo/issues/new';
const LS_OPINION = 'dojo_opiniones';
const opinion = {estrellas:0, intensidad:null};
function prepararOpinion(){
  opinion.estrellas = 0; opinion.intensidad = null;
  document.getElementById('opinion-texto').value = '';
  document.getElementById('opinion-nota').textContent = 'Se abre GitHub para publicarlo. También queda guardado aquí.';
  document.getElementById('opinion-enviar').disabled = false;
  pintarOpinion();
}
function pintarOpinion(){
  document.querySelectorAll('.estrellas button').forEach(b=>{
    const v=+b.dataset.v; b.classList.toggle('on', v<=opinion.estrellas); b.setAttribute('aria-checked', v===opinion.estrellas);
  });
  document.querySelectorAll('.chips-opinion button').forEach(b=>{
    const on = b.dataset.i===opinion.intensidad; b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
  });
}
document.addEventListener('click', e=>{
  const est = e.target.closest('.estrellas button');
  if(est){ opinion.estrellas = +est.dataset.v; pintarOpinion(); return; }
  const chip = e.target.closest('.chips-opinion button');
  if(chip){ opinion.intensidad = opinion.intensidad===chip.dataset.i ? null : chip.dataset.i; pintarOpinion(); }
});
function enviarOpinion(ev){
  ev.preventDefault();
  const texto = document.getElementById('opinion-texto').value.trim();
  const nota = document.getElementById('opinion-nota');
  if(!opinion.estrellas && !opinion.intensidad && !texto){ nota.textContent = 'Elige unas estrellas o escribe algo antes de enviar.'; return; }
  const INT = {suave:'Suave', justa:'Justa', dura:'Muy dura'};
  const clase = (estado.rutina && estado.rutina.nombre) || 'Clase';
  const minutos = document.getElementById('fin-minutos').textContent;
  const registro = {fecha:new Date().toISOString(), clase, minutos:+minutos||0,
                    estrellas:opinion.estrellas, intensidad:opinion.intensidad, texto};
  try{ const prev = JSON.parse(localStorage.getItem(LS_OPINION)||'[]'); prev.push(registro);
       localStorage.setItem(LS_OPINION, JSON.stringify(prev.slice(-50))); }catch(e){}
  const titulo = `Opinión: ${clase}` + (opinion.estrellas ? ` · ${'★'.repeat(opinion.estrellas)}` : '');
  const cuerpo = [
    `**Clase:** ${clase} (${minutos} min)`,
    `**Valoración:** ${opinion.estrellas ? opinion.estrellas+'/5' : '—'}`,
    `**Intensidad:** ${opinion.intensidad ? INT[opinion.intensidad] : '—'}`,
    '', texto || '_(sin comentario)_',
  ].join('\n');
  const url = REPO_OPINION + '?labels=feedback&title=' + encodeURIComponent(titulo) + '&body=' + encodeURIComponent(cuerpo);
  window.open(url, '_blank', 'noopener');
  nota.textContent = '¡Gracias! Tu opinión quedó guardada. Publícala en la pestaña de GitHub.';
  document.getElementById('opinion-enviar').disabled = true;
}

function cerrarFin(){
  document.getElementById('fin-clase').classList.add('oculto');
  irA('inicio');
}

/* ---------------- Voz del sensei ---------------- */
function anunciarPaso(p, proximo){
  const ant = estado.pasos[estado.i-1];
  if(p.tipo==='ejercicio'){
    // tras un cambio el nombre ya se dijo: solo la señal de empezar
    if(ant && ant.tipo==='cambio') anunciar('¡Ya! '+eligeFrase(FRASES.inicio));
    else anunciar(p.ej.nombre + (p.suf? ', '+p.suf:'') + '. ' + eligeFrase(FRASES.inicio));
  }
  else if(p.tipo==='prep') anunciar('Prepárate. Empezamos con '+(proximo||'la clase')+'. '+eligeFrase(FRASES.inicio));
  else if(p.tipo==='cambio') anunciar(p.lado ? 'Cambia de lado' : 'Siguiente: '+(proximo||''));
  else anunciar('Descanso de '+Math.round(p.dur/60)+' minutos. Bebe agua.');
}
function anunciar(texto){
  if(!vozActiva) return;
  // reintenta detectar la voz del navegador (getVoices puede llegar vacío al inicio)
  if(vozNativa===null) detectarVozNativa();
  if(vozNativa) hablarNativo(texto);
  else hablarOffline(texto);
}
function hablarNativo(texto){
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.voice = vozNativa; u.lang = vozNativa.lang || 'es-ES'; u.rate = 1; u.pitch = 1;
  // si la voz del navegador falla (típico: voz de servidor sin internet), cae al motor offline
  u.onerror = (e)=>{ if(e && e.error==='interrupted') return;   // 'interrupted' = lo cancelamos nosotros
    hablarOffline(texto); };
  speechSynthesis.speak(u);
}

/* --- Motor de voz offline (meSpeak), cargado solo la primera vez que hace falta --- */
const OPC_MESPEAK = { amplitude: 100, pitch: 42, speed: 162 };  // tono firme de sensei
function hablarOffline(texto){
  if(motorOffline === 'listo'){ meSpeak.stop(); meSpeak.speak(texto, OPC_MESPEAK); return; }
  if(motorOffline === 'no') return;                       // no se pudo cargar: silencio
  colaOffline = [texto];                                  // solo interesa el aviso más reciente
  if(motorOffline === 'cargando') return;
  motorOffline = 'cargando';
  cargarScript('vendor/mespeak/mespeak.js', ok1 => {
    if(!ok1){ motorOffline='no'; colaOffline=[]; return; }
    cargarScript('vendor/mespeak/voz-es.js', ok2 => {
      try{
        if(!ok2 || typeof meSpeak==='undefined' || !window.DOJO_MESPEAK) throw 0;
        meSpeak.loadConfig(window.DOJO_MESPEAK.config);
        meSpeak.loadVoice(window.DOJO_MESPEAK.voces[VOZ_OFFLINE_ID]);
        meSpeak.setDefaultVoice(VOZ_OFFLINE_ID);
        motorOffline = 'listo';
        const ult = colaOffline.pop(); colaOffline = [];
        if(ult) meSpeak.speak(ult, OPC_MESPEAK);
      }catch(e){ motorOffline='no'; colaOffline=[]; }
    });
  });
}
function cargarScript(src, cb){
  const s = document.createElement('script');
  s.src = src; s.async = true;
  s.onload = ()=>cb(true); s.onerror = ()=>cb(false);
  document.head.appendChild(s);
}
function detenerVoz(){
  if('speechSynthesis' in window) speechSynthesis.cancel();
  if(motorOffline === 'listo' && typeof meSpeak!=='undefined') meSpeak.stop();
}
function alternarVoz(){
  vozActiva = !vozActiva;
  localStorage.setItem('dojo_voz', vozActiva?'on':'off');
  actualizarBotonVoz();
  if(!vozActiva) detenerVoz();
}
function actualizarBotonVoz(){
  document.getElementById('btn-voz').textContent = vozActiva ? '🔊' : '🔇';
}

/* ---------------- Fondo / personaje 3D ---------------- */
function cambiarFondo(){
  if(!usar3D) return;
  const nombre = Dojo3D.cicloFondo();
  fondoGuardado = Dojo3D.fondo; localStorage.setItem('dojo_fondo', fondoGuardado);
  mostrarToast('Ambiente: '+nombre);
}
function cambiarPersonaje(){
  if(!usar3D) return;
  const nombre = Dojo3D.cicloPersonaje();
  personajeGuardado = Dojo3D.personaje; localStorage.setItem('dojo_personaje', personajeGuardado);
  mostrarToast('Personaje: '+nombre);
}
function mostrarToast(txt){
  const t = document.getElementById('toast');
  t.textContent = txt; t.classList.add('ver');
  clearTimeout(t._tm); t._tm = setTimeout(()=>t.classList.remove('ver'), 1600);
}
window.addEventListener('resize', ()=>{ if(typeof Dojo3D!=='undefined') Dojo3D.resize(); });

/* ---------------- Audio (pitidos) ---------------- */
let audioCtx = null;
function iniciarAudio(){
  try{ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
       if(audioCtx.state==='suspended') audioCtx.resume(); }catch(e){}
}
/* Instrumentos del dojo, sintetizados (sin archivos de audio) */
function campana(){                      // rin: cuenco de bronce, parciales que se apagan despacio
  if(!audioCtx) return;
  try{
    const t = audioCtx.currentTime;
    [[528,1,3.4],[1420,0.42,2.4],[2830,0.16,1.5],[3910,0.07,0.9]].forEach(([f,a,d])=>{
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.20*a,t+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+d+0.05);
    });
  }catch(e){}
}
function taiko(){                        // tambor grave: barrido de tono + golpe de piel
  if(!audioCtx) return;
  try{
    const t = audioCtx.currentTime;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.4);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.75,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+0.75);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.8);
    const n=audioCtx.createBufferSource(), buf=audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate*0.14), audioCtx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const f=audioCtx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=800;
    const g2=audioCtx.createGain(); g2.gain.value=0.3;
    n.buffer=buf; n.connect(f); f.connect(g2); g2.connect(audioCtx.destination); n.start(t);
  }catch(e){}
}
function golpeMadera(){                  // hyōshigi: chasquido de madera para la cuenta 3·2·1
  if(!audioCtx) return;
  try{
    const t = audioCtx.currentTime;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='triangle'; o.frequency.setValueAtTime(1900,t); o.frequency.exponentialRampToValueAtTime(700,t+0.06);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.28,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+0.11);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.13);
  }catch(e){}
}
function pitido(freq, dur){
  if(!audioCtx) return;
  try{
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.type='sine';
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.3,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.start(t); o.stop(t+dur+0.02);
  }catch(e){}
}

/* ============================================================
   SESIONES (almacenamiento + estadísticas)
   ============================================================ */
function leerSesiones(){ try{return JSON.parse(localStorage.getItem('dojo_sesiones'))||[]}catch(e){return []} }
function registrarSesion(rutina, minutos){
  const ses = leerSesiones();
  ses.push({fecha:fechaISO(new Date()), rutina:rutina.key, nombre:rutina.nombre, minutos});
  localStorage.setItem('dojo_sesiones', JSON.stringify(ses));
}

/* ============================================================
   MEDICIONES
   ============================================================ */
const CAMPOS_MED = [
  {k:'peso',u:'kg'},{k:'cintura',u:'cm'},{k:'pecho',u:'cm'},
  {k:'cadera',u:'cm'},{k:'brazo',u:'cm'},{k:'muslo',u:'cm'}
];
function leerMediciones(){ try{return JSON.parse(localStorage.getItem('dojo_mediciones'))||[]}catch(e){return []} }
function guardarMediciones(m){ localStorage.setItem('dojo_mediciones', JSON.stringify(m)); }

function guardarMedicion(ev){
  ev.preventDefault();
  const f = ev.target;
  const reg = {fecha:fechaISO(new Date()), notas:f.notas.value.trim()};
  let alguno=false;
  CAMPOS_MED.forEach(c=>{
    const v = parseFloat(f[c.k].value);
    if(!isNaN(v)){ reg[c.k]=v; alguno=true; }
  });
  if(!alguno){ alert('Anota al menos un valor.'); return; }
  const m = leerMediciones();
  // si ya hay una de hoy, la reemplaza
  const idx = m.findIndex(x=>x.fecha===reg.fecha);
  if(idx>=0) m[idx]=reg; else m.push(reg);
  m.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  guardarMediciones(m);
  f.reset();
  renderMediciones();
}

function borrarMedicion(fecha){
  if(!confirm('¿Borrar la medición del '+fecha+'?')) return;
  guardarMediciones(leerMediciones().filter(m=>m.fecha!==fecha));
  renderMediciones();
}

function renderMediciones(){
  const m = leerMediciones();
  const resumen = document.getElementById('resumen-medicion');
  const hist = document.getElementById('historial-mediciones');
  const graf = document.getElementById('grafico-peso');

  if(!m.length){
    resumen.innerHTML='';
    hist.innerHTML='<p class="vacio">Aún no hay mediciones. Registra la primera arriba.</p>';
    graf.innerHTML='<p class="vacio">Tu progreso de peso aparecerá aquí.</p>';
    return;
  }

  const ultima = m[m.length-1];
  const previa = m.length>1 ? m[m.length-2] : null;
  resumen.innerHTML = CAMPOS_MED.map(c=>{
    if(ultima[c.k]==null) return '';
    let delta='';
    if(previa && previa[c.k]!=null){
      const d = +(ultima[c.k]-previa[c.k]).toFixed(1);
      if(d!==0){
        const baja = d<0;
        delta = `<span class="delta ${baja?'baja':'sube'}">${baja?'▼':'▲'} ${Math.abs(d)}</span>`;
      }
    }
    return `<div class="celda"><b>${ultima[c.k]}</b><span>${c.k} (${c.u})</span>${delta}</div>`;
  }).join('');

  hist.innerHTML = m.slice().reverse().map(r=>{
    const datos = CAMPOS_MED.filter(c=>r[c.k]!=null).map(c=>`${c.k} ${r[c.k]}${c.u}`).join(' · ');
    return `<div class="fila-hist">
      <div><div class="fecha">${fechaBonita(r.fecha)}</div><div class="datos">${datos||'—'}${r.notas?' · “'+r.notas+'”':''}</div></div>
      <button class="borrar" onclick="borrarMedicion('${r.fecha}')" title="Borrar">🗑</button>
    </div>`;
  }).join('');

  graf.innerHTML = graficoPeso(m.filter(r=>r.peso!=null));
}

/* Mini-gráfico SVG de la evolución del peso (área + punto final destacado) */
function graficoPeso(datos){
  if(datos.length<2) return '<p class="vacio">Registra al menos dos pesos para ver la curva.</p>';
  const W=600,H=170,pad=34, base=H-pad;
  const pesos = datos.map(d=>d.peso);
  const min = Math.min(...pesos), max = Math.max(...pesos);
  const rango = (max-min)||1;
  const x = i => pad + i*(W-2*pad)/(datos.length-1);
  const y = v => base - ((v-min)/rango)*(H-2*pad);
  const pts = datos.map((d,i)=>`${x(i)},${y(d.peso)}`).join(' ');
  const area = `${pad},${base} ${pts} ${x(datos.length-1)},${base}`;
  const puntos = datos.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.peso)}" r="3.5" fill="#b0a392"/>`).join('');
  const ult = datos[datos.length-1];
  const fin = `<circle cx="${x(datos.length-1)}" cy="${y(ult.peso)}" r="6" fill="#e2b449" stroke="#1b1714" stroke-width="2"/>
    <text x="${x(datos.length-1)}" y="${y(ult.peso)-14}" fill="#f7f2e9" font-size="15" font-weight="700" text-anchor="end">${ult.peso}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="gpeso" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d8442f" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#d8442f" stop-opacity="0"/>
    </linearGradient></defs>
    <line x1="${pad}" y1="${base}" x2="${W-pad}" y2="${base}" stroke="#352d26" stroke-width="1"/>
    <polygon points="${area}" fill="url(#gpeso)"/>
    <polyline points="${pts}" fill="none" stroke="#d8442f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${puntos}${fin}
    <text x="6" y="${y(max)+4}" fill="#b0a392" font-size="12">${max}</text>
    <text x="6" y="${y(min)+4}" fill="#b0a392" font-size="12">${min}</text>
  </svg>`;
}

/* ============================================================
   BIBLIOTECA
   ============================================================ */
function renderBiblioteca(){
  const cont = document.getElementById('lista-biblioteca');
  const hay3D = usar3DBib();              // se comprueba UNA sola vez (crea un canvas de prueba)
  let html='';
  Object.entries(CATEGORIAS).forEach(([catKey,cat])=>{
    const ejs = BIBLIOTECA.filter(e=>e.categoria===catKey);
    if(!ejs.length) return;
    html += `<h2 class="grupo-cat"><span class="kanji-cat">${cat.kanji}</span>${cat.nombre}</h2>`;
    html += ejs.map(ej=>{
      const tag = ej.tipo==='reps'?`${ej.reps} reps`:`${ej.duracion}s`;
      const editable = hay3D && Dojo3D.editable(ej.arquetipo, ej.arte);
      const acciones = hay3D ? `
          <div class="acciones-bib">
            <button class="btn-bib" onclick="verEnVisor('${ej.id}')">🥋 Ver en 3D</button>
            ${editable?`<button class="btn-bib editar" onclick="abrirEditor('${ej.id}')">✏️ Ajustar movimiento</button>`:''}
          </div>` : '';
      return `<details class="item-bib">
        <summary>
          <span class="mini">${figuraSVG(ej.arquetipo)}</span>
          ${ej.nombre}
          ${ej.pesas?'<span class="pesas-tag">pesas</span>':''}
          ${ej.espacio?'<span class="pesas-tag espacio-tag">espacio</span>':''}
        </summary>
        <div class="detalle">
          <span class="fig-grande">${figuraSVG(ej.arquetipo)}</span>
          <div class="txt">
            <div class="tag-dur">${tag}${ej.lado?' · por lado':''}</div>
            <ul>${ej.instrucciones.map(t=>`<li>${t}</li>`).join('')}</ul>
            <div class="resp">🫁 ${ej.respiracion}</div>
            ${acciones}
          </div>
        </div>
      </details>`;
    }).join('');
  });
  cont.innerHTML = html;
}

/* ============================================================
   VISOR / EDITOR 3D DE MOVIMIENTOS (desde la Biblioteca)
   ============================================================ */
function usar3DBib(){ return HAY_3D; }

let editorEstado = null;   // {fotograma} cuando el visor está en modo editor

function verEnVisor(id){ abrirVisor(id, false); }
function abrirEditor(id){ abrirVisor(id, true); }

function abrirVisor(id, editar){
  const ej = POR_ID[id]; if(!ej) return;
  const overlay = document.getElementById('visor3d');
  const panel = document.getElementById('visor-panel');
  document.getElementById('visor-titulo').textContent = ej.nombre;
  overlay.classList.remove('oculto');
  Dojo3D.montarEn(document.getElementById('visor-lienzo'), ej.arquetipo, ej.arte);
  requestAnimationFrame(()=>Dojo3D.resize());   // ajusta al tamaño ya visible del overlay

  if(editar && Dojo3D.editable(ej.arquetipo, ej.arte)){
    construirPanelEditor(ej);
  } else {
    editorEstado = null;
    panel.innerHTML = '';   // vacío → el CSS colapsa el panel y el 3D ocupa todo
  }
}

function cerrarVisor(){
  document.getElementById('visor3d').classList.add('oculto');
  Dojo3D.desmontar();
  editorEstado = null;
  // si había una clase en curso, devuelve el 3D a su lienzo y su cámara
  if(usar3D && document.getElementById('vista-clase').classList.contains('activa')){
    Dojo3D.init(document.getElementById('figura'));
    Dojo3D.vistaClase();
    Dojo3D.setPersonaje(personajeGuardado);
    Dojo3D.setFondo(fondoGuardado);
    Dojo3D.arrancar();
    requestAnimationFrame(()=>Dojo3D.resize());
  } else if(document.getElementById('vista-inicio').classList.contains('activa')) montarPortada();
}

function construirPanelEditor(ej){
  const info = Dojo3D.editarInfo(ej.arquetipo, ej.arte);
  if(!info){ document.getElementById('visor-panel').innerHTML=''; return; }
  editorEstado = { fotograma: 0 };

  const kfBtns = info.fotogramas.map((t,i)=>
    `<button class="kf-btn${i===0?' activo':''}" data-kf="${i}" onclick="editorFotograma(${i})">Fase ${i+1}</button>`
  ).join('');

  const grupos = info.grupos.map(gr=>{
    const filas = gr.items.map(([clave,etq])=>filaSlider(clave,etq,info.rangos)).join('');
    return `<details class="editor-grupo" open><summary>${gr.g}</summary>${filas}</details>`;
  }).join('');

  document.getElementById('visor-panel').innerHTML = `
    <p class="editor-hint">Ajusta cada <b>fase</b> del movimiento y muévete entre ellas. Arrastra el 3D para verlo desde otro ángulo. <b>Guardar</b> lo aplica en toda la app.</p>
    <div class="editor-fotogramas">${kfBtns}</div>
    <div id="editor-sliders">${grupos}</div>
    <div class="editor-acciones">
      <button class="btn-primario" onclick="editorGuardar()">Guardar</button>
      <button class="btn-sec" onclick="editorReproducir()">▶ Ver en bucle</button>
      <button class="btn-sec" onclick="editorRestablecer()">↺ Original</button>
    </div>
    <div id="editor-aviso" style="font-size:.8rem;color:var(--verde);min-height:1.2em;margin-top:.5rem"></div>`;

  editorFotograma(0);
}

function filaSlider(clave, etiqueta, rangos){
  // rango: posiciones root_p* en metros; rotaciones acotadas al rango
  // anatómico de esa articulación (tabla AAOS del motor) si existe
  const esPos = /_(p[xyz])$/.test(clave);
  const r = (rangos && rangos[clave]) || null;
  const min = esPos ? -0.6 : (r ? r[0].toFixed(2) : -3.14);
  const max = esPos ?  0.6 : (r ? r[1].toFixed(2) :  3.14);
  return `<div class="slider-fila">
    <label for="sl_${clave}">${etiqueta}</label>
    <input type="range" id="sl_${clave}" min="${min}" max="${max}" step="0.01"
           oninput="editorSlider('${clave}', this.value)">
    <span class="val" id="val_${clave}">0°</span>
  </div>`;
}

/* Muestra el valor como lo entiende una persona: grados para rotaciones,
   centímetros para desplazamientos del cuerpo */
function valorLegible(clave, v){
  return /_(p[xyz])$/.test(clave) ? Math.round(v*100)+' cm' : Math.round(v*180/Math.PI)+'°';
}

function editorFotograma(i){
  if(!editorEstado) return;
  editorEstado.fotograma = i;
  document.querySelectorAll('.kf-btn').forEach(b=>b.classList.toggle('activo', +b.dataset.kf===i));
  Dojo3D.congelarEnFotograma(i);
  // refresca cada slider con el valor de esta fase
  document.querySelectorAll('#editor-sliders input[type=range]').forEach(inp=>{
    const clave = inp.id.slice(3);
    const v = Dojo3D.valorPose(i, clave);
    inp.value = v;
    document.getElementById('val_'+clave).textContent = valorLegible(clave, +v);
  });
}

function editorSlider(clave, valor){
  if(!editorEstado) return;
  const v = parseFloat(valor);
  Dojo3D.setValorPose(editorEstado.fotograma, clave, v);
  Dojo3D.congelarEnFotograma(editorEstado.fotograma);   // mantén la vista en la fase editada
  document.getElementById('val_'+clave).textContent = valorLegible(clave, v);
}

function editorReproducir(){ Dojo3D.reproducirPreview(); editorAviso('Reproduciendo el movimiento…'); }

function editorAviso(txt){
  const el = document.getElementById('editor-aviso'); if(!el) return;
  el.textContent = txt;
  clearTimeout(el._tm); el._tm = setTimeout(()=>{ el.textContent=''; }, 2400);
}

function editorGuardar(){
  Dojo3D.guardarEdicion();
  editorAviso('Guardado ✓ se usará en tus clases');
}

function editorRestablecer(){
  Dojo3D.restablecerEdicion();
  editorFotograma(editorEstado ? editorEstado.fotograma : 0);
  editorAviso('Restablecido al movimiento original');
}

/* ============================================================
   UTILIDADES
   ============================================================ */
function formatoTiempo(s){
  s = Math.max(0,s|0);
  const m = Math.floor(s/60), seg = s%60;
  return m>0 ? `${m}:${String(seg).padStart(2,'0')}` : String(seg);
}
function fechaISO(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function fechaBonita(iso){
  const [a,m,d]=iso.split('-');
  const meses=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[+m-1]} ${a}`;
}

/* Arranque */
renderInicio();
montarPortada();
