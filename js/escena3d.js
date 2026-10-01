/* ============================================================
   DŌJŌ 3D — escena Three.js con personaje articulado dentro de
   un dojo completo (suelo de madera o tatami, shoji retro-
   iluminados, pilares, kamiza con kakejiku, linternas, polvo
   flotando en la luz y sombras reales).
   Diseñado para INTERCAMBIAR personajes y ambientes fácilmente:
     · Dojo3D.personajes : registro de personajes (paletas / modelos)
     · Dojo3D.fondos      : registro de ambientes (dojo de día, de noche, tatami, jardín…)
     · Dojo3D.setPersonaje(clave) / setFondo(clave)
   El personaje por defecto es procedural (sin descargas, gratis).
   Para añadir un modelo .glb: ver nota al final.
   ============================================================ */
const Dojo3D = (function(){
  const TAU = Math.PI*2;
  let renderer, scene, camera, contenedor, raf=null;
  let rig=null, animador=null, t0=0;       // rig = "motor" procedural (fuente del movimiento)
  let glbActivo=null;                       // modelo .glb cargado (si el personaje es 3D)
  let fondoActual='madera', personajeActual='karateka';
  let listo=false;
  /* Cámara: 'clase' (fija, con respiración sutil) · 'libre' (órbita con el dedo, Biblioteca/editor)
     · 'ambiente' (paseo lento alrededor del personaje, portada) */
  let modoCam='clase', modoLibre=false, az=0.5, el=0.12, arrastrando=false, arrX=0, arrY=0, congelaT=null;
  let reloj=0;                              // segundos desde el arranque (efectos de ambiente)

  /* ---------------- Personajes (paletas) ----------------
     gi: tela · solapa: borde del gi · obi: cinturón · piel · pelo
     capucha: ninja (cabeza cubierta, solo ojos) · calvo: monje · mono: chonmage */
  const personajes = {
    karateka: {nombre:'Karateka', gi:0xf1ece2, solapa:0xe2dbcc, obi:0x17151a, piel:0xd9a87e, pelo:0x1b1512, detalle:0xe2dbcc, hachimaki:0xc8311e},
    ninja:    {nombre:'Ninja',    gi:0x1e2436, solapa:0x2a3149, obi:0xb8321f, piel:0xd4a07a, pelo:0x11131c, detalle:0x2a3149, capucha:true},
    monje:    {nombre:'Monje',    gi:0xb85f2b, solapa:0xd7893f, obi:0xe4b04a, piel:0xc99268, pelo:0x000000, detalle:0x8a4520, calvo:true},
    samurai:  {nombre:'Samurái',  gi:0x2b3a57, solapa:0x3b4d70, obi:0x8e7346, piel:0xd9a87e, pelo:0x14100e, detalle:0x3b4d70, mono:true},
  };
  // Personajes añadidos con la herramienta tools/incrustar-glb.js (Mixamo, Quaternius…)
  if(window.PERSONAJES_EXTRA) Object.assign(personajes, window.PERSONAJES_EXTRA);

  /* ---------------- Ambientes ----------------
     suelo: 'madera' | 'tatami' | 'grava' | 'liso' · paredes: sala de dojo (shoji, pilares, kamiza)
     luz: sol/luna direccional [color, intensidad, posición] · hemi: [cielo, suelo, intensidad]
     shoji: color del papel y cuánto brilla por detrás · linternas: encendidas (luces puntuales)
     haces: rayos de luz entrando por los shoji · cielo: cúpula de cielo (exterior) · oculto: no entra en el ciclo 🎴 */
  const fondos = {
    madera: {nombre:'Dojo de madera', suelo:'madera', paredes:true, bg:0x0e0a07, niebla:[0x0e0a07, 9, 22],
             luz:[0xffe2bd, 1.35, [3.6,4.4,2.6]], hemi:[0x8b7b67, 0x2a1d14, 0.5], amb:0.14,
             shoji:[0xf7eedb, 0.6], linternas:false, haces:true, exp:1.0},
    noche:  {nombre:'Dojo de noche',  suelo:'madera', paredes:true, bg:0x050506, niebla:[0x050506, 7, 18],
             luz:[0xa9bfe6, 0.28, [-3.2,4.2,2.2]], hemi:[0x38425a, 0x0f0c0a, 0.16], amb:0.03,
             shoji:[0xdfe6f1, 0.14], linternas:true, haces:false, exp:0.9, borde:0.45},
    tatami: {nombre:'Sala de tatami', suelo:'tatami', paredes:true, bg:0x120d09, niebla:[0x120d09, 9, 22],
             luz:[0xfff0d6, 1.2, [2.8,4.6,3.2]], hemi:[0xa89a86, 0x3a3020, 0.5], amb:0.16,
             shoji:[0xf9f2e3, 0.75], linternas:false, haces:true, exp:1.0},
    jardin: {nombre:'Jardín zen',     suelo:'grava', paredes:false, cielo:true, bg:0xbfd0e2, niebla:[0xc9d8e8, 14, 60],
             luz:[0xfff3de, 1.15, [4.5,6.5,3]], hemi:[0xbcd3e8, 0x6b6a55, 0.5], amb:0.1,
             shoji:[0xffffff, 0], linternas:false, haces:false, exp:0.92, borde:0.8},
    zen:    {nombre:'Estudio',        suelo:'liso', paredes:false, bg:0xd6d9d4, niebla:[0xd6d9d4, 8, 30],
             luz:[0xffffff, 1.0, [2.5,4,3]], hemi:[0xffffff, 0x9aa0a6, 0.8], amb:0.25,
             shoji:[0xffffff, 0], linternas:false, haces:false, exp:1.0, oculto:true},
  };

  /* ---------------- Materiales y texturas procedurales ----------------
     Todo se dibuja en canvas al arrancar: ni una imagen que descargar. */
  function lienzo(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
  function texturaDe(c, rx, ry){
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(rx||1, ry||1); t.anisotropy=4; t.encoding=THREE.sRGBEncoding; return t;
  }
  const aleatorio = (function(){ let s=1234567; return ()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; })();
  function texMadera(){                                  // tablas de cedro con veta
    const W=512,H=512,c=lienzo(W,H),g=c.getContext('2d');
    const n=6, alto=H/n;
    for(let i=0;i<n;i++){
      const l=0.78+aleatorio()*0.32;
      g.fillStyle=`rgb(${Math.round(112*l)},${Math.round(76*l)},${Math.round(46*l)})`;
      g.fillRect(0,i*alto,W,alto);
      for(let k=0;k<26;k++){                              // veta
        g.strokeStyle=`rgba(40,22,10,${0.05+aleatorio()*0.12})`; g.lineWidth=0.6+aleatorio()*1.6;
        const y=i*alto+aleatorio()*alto; g.beginPath(); g.moveTo(0,y);
        for(let x=0;x<=W;x+=64) g.lineTo(x, y+Math.sin(x*0.02+k)*2.2+(aleatorio()-0.5)*3);
        g.stroke();
      }
      g.fillStyle='rgba(20,10,4,0.75)'; g.fillRect(0,i*alto,W,2);        // junta entre tablas
      g.fillStyle='rgba(255,230,190,0.08)'; g.fillRect(0,i*alto+2,W,2);  // canto iluminado
      const corte=aleatorio()*W; g.fillStyle='rgba(20,10,4,0.55)'; g.fillRect(corte,i*alto,2,alto); // testa
    }
    return c;
  }
  function texTatami(){                                  // dos esteras con borde de tela oscura
    const W=512,H=512,c=lienzo(W,H),g=c.getContext('2d');
    g.fillStyle='#b9ab6e'; g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=3){ g.fillStyle=`rgba(70,60,20,${0.10+((y/3)%2)*0.08})`; g.fillRect(0,y,W,1); }
    for(let i=0;i<120;i++){ g.fillStyle=`rgba(255,240,190,${aleatorio()*0.12})`; g.fillRect(aleatorio()*W, aleatorio()*H, 8+aleatorio()*40, 1); }
    g.fillStyle='#2b2a2e'; g.fillRect(0,0,W,14); g.fillRect(0,H/2-7,W,14); g.fillRect(0,0,10,H); g.fillRect(W-10,0,10,H);
    return c;
  }
  function texGrava(){                                   // grava rastrillada
    const W=512,H=512,c=lienzo(W,H),g=c.getContext('2d');
    g.fillStyle='#bdb6a6'; g.fillRect(0,0,W,H);
    for(let i=0;i<9000;i++){ const v=130+aleatorio()*90; g.fillStyle=`rgb(${v},${v-4},${v-12})`; g.fillRect(aleatorio()*W, aleatorio()*H, 1.5, 1.5); }
    for(let y=0;y<H;y+=16){ g.fillStyle='rgba(90,84,70,0.35)'; g.fillRect(0,y,W,3); g.fillStyle='rgba(255,255,255,0.25)'; g.fillRect(0,y+5,W,2); }
    return c;
  }
  function texShoji(){                                   // papel washi con celosía de madera
    const W=256,H=512,c=lienzo(W,H),g=c.getContext('2d');
    g.fillStyle='#f6eedc'; g.fillRect(0,0,W,H);
    for(let i=0;i<1400;i++){ g.fillStyle=`rgba(120,100,70,${aleatorio()*0.08})`; g.fillRect(aleatorio()*W, aleatorio()*H, 1+aleatorio()*10, 1); } // fibra
    g.fillStyle='#3a2616';
    for(let x=0;x<=W;x+=W/3) g.fillRect(x-4,0,8,H);
    for(let y=0;y<=H;y+=H/6) g.fillRect(0,y-4,W,8);
    g.fillRect(0,0,W,14); g.fillRect(0,H-14,W,14); g.fillRect(0,0,14,H); g.fillRect(W-14,0,14,H);
    return c;
  }
  function texKakejiku(kanji){                           // pergamino colgante con caligrafía y sello
    const W=256,H=640,c=lienzo(W,H),g=c.getContext('2d');
    g.fillStyle='#4a2c1c'; g.fillRect(0,0,W,H);                      // brocado
    g.fillStyle='#efe4cd'; g.fillRect(28,70,W-56,H-140);             // papel
    for(let i=0;i<600;i++){ g.fillStyle=`rgba(120,90,50,${aleatorio()*0.06})`; g.fillRect(28+aleatorio()*(W-56), 70+aleatorio()*(H-140), 1+aleatorio()*8, 1); }
    g.fillStyle='#161210'; g.textAlign='center'; g.textBaseline='middle';
    g.font='bold 170px "Shippori Mincho","Noto Serif CJK JP","Noto Sans CJK JP","Hiragino Mincho ProN","Yu Mincho",serif';
    g.fillText(kanji, W/2, H/2-20);
    g.fillStyle='#b8321f'; g.fillRect(W-78,H-160,34,34);            // sello
    g.fillStyle='#efe4cd'; g.fillRect(W-70,H-152,18,18);
    return c;
  }
  function texCielo(){                                   // degradado cielo de mañana
    const c=lienzo(4,256),g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,256);
    gr.addColorStop(0,'#6f93c4'); gr.addColorStop(0.45,'#b9cfe4'); gr.addColorStop(0.75,'#e8dcc8'); gr.addColorStop(1,'#d6c9b2');
    g.fillStyle=gr; g.fillRect(0,0,4,256); return c;
  }
  function texHaz(){                                     // rayo de luz (degradado suave)
    const c=lienzo(64,256),g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,64,0);
    gr.addColorStop(0,'rgba(255,235,200,0)'); gr.addColorStop(0.5,'rgba(255,235,200,0.9)'); gr.addColorStop(1,'rgba(255,235,200,0)');
    g.fillStyle=gr; g.fillRect(0,0,64,256);
    const gv=g.createLinearGradient(0,0,0,256); gv.addColorStop(0,'rgba(0,0,0,0)'); gv.addColorStop(0.25,'rgba(0,0,0,0.0)'); gv.addColorStop(1,'rgba(0,0,0,1)');
    g.globalCompositeOperation='destination-out'; g.fillStyle=gv; g.fillRect(0,0,64,256);
    return c;
  }
  function texPolvo(){
    const c=lienzo(32,32),g=c.getContext('2d'); const gr=g.createRadialGradient(16,16,0,16,16,16);
    gr.addColorStop(0,'rgba(255,240,215,1)'); gr.addColorStop(0.4,'rgba(255,240,215,0.5)'); gr.addColorStop(1,'rgba(255,240,215,0)');
    g.fillStyle=gr; g.fillRect(0,0,32,32); return c;
  }

  const lin = c => new THREE.Color(c).convertSRGBToLinear();   // los hex se escriben en sRGB; el render trabaja en lineal
  function mat(color, opts){ const o=Object.assign({color:lin(color), roughness:0.9, metalness:0.02}, opts||{}); if(o.emissive!=null) o.emissive=lin(o.emissive); return new THREE.MeshStandardMaterial(o); }
  const matTela = c => mat(c, {roughness:0.95});
  const matPiel = c => mat(c, {roughness:0.65});
  function esfera(parent, r, color, x,y,z, sx,sy,sz, material){
    const m = new THREE.Mesh(new THREE.SphereGeometry(r,36,26), material||matTela(color));
    m.position.set(x||0,y||0,z||0); if(sx!==undefined) m.scale.set(sx,sy,sz);
    m.castShadow=true; parent.add(m); return m;
  }
  function bloque(parent, ancho,largo,profundo, color, x,y,z, material){
    const m = new THREE.Mesh(new THREE.BoxGeometry(ancho,largo,profundo), material||matTela(color));
    m.position.set(x||0,y||0,z||0); m.castShadow=true; parent.add(m); return m;
  }
  // miembro: grupo con pivote arriba (la articulación) + cilindro colgando.
  // rManga>0 añade una manga/pernera ancha de tela que cubre la parte alta.
  function miembro(parent, rTop,rBot, largo, color, px,py,pz, material, rManga, largoManga, colorManga){
    const g = new THREE.Group(); g.position.set(px,py,pz);
    esfera(g, rTop*1.08, color, 0,0,0, 1,1,1, material);
    const cil = new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBot,largo,18), material||matTela(color));
    cil.position.y = -largo/2; cil.castShadow=true; g.add(cil);
    if(rManga){
      const manga = new THREE.Mesh(new THREE.CylinderGeometry(rManga, rManga*1.06, largoManga, 18), matTela(colorManga));
      manga.position.y = -largoManga/2; manga.castShadow=true; g.add(manga);
      esfera(g, rManga*1.02, colorManga, 0,0,0);
    }
    parent.add(g); return g;
  }

  /* ---------------- Acabado del personaje ----------------
     · borde(): brillo de contorno (fresnel) añadido al material estándar. Da volumen
       de figura tallada y despega al personaje del fondo; su fuerza depende del
       ambiente (BORDE.value, lo fija aplicarFondo).
     */
  const BORDE = {value:1};
  function borde(m, color, fuerza){
    const uC = {value:lin(color)}, uF = {value:fuerza};
    m.onBeforeCompile = sh=>{
      sh.uniforms.uBordeC = uC; sh.uniforms.uBordeF = uF; sh.uniforms.uBordeG = BORDE;
      sh.fragmentShader = 'uniform vec3 uBordeC; uniform float uBordeF; uniform float uBordeG;\n' +
        sh.fragmentShader.replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n' +
          '  float fres = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n' +
          '  totalEmissiveRadiance += uBordeC * (fres*fres*fres) * uBordeF * uBordeG;');
    };
    m.customProgramCacheKey = ()=>'dojo-borde';
    return m;
  }
  const telaGi   = c => borde(mat(c, {roughness:0.9, side:THREE.DoubleSide}), 0xfff2dc, 0.12);
  const telaLisa = c => borde(mat(c, {roughness:0.80}), 0xfff2dc, 0.14);
  const pielMat  = c => borde(mat(c, {roughness:0.6}), 0xffb08a, 0.22);   // borde cálido: luz que atraviesa la piel

  /* Pieza torneada: perfil [[radio, y], …] girado alrededor del eje Y (y negativa = hacia abajo) */
  function torneado(parent, perfil, material, sx, sz, segs){
    const orden = perfil[perfil.length-1][1] < perfil[0][1] ? perfil.slice().reverse() : perfil;   // de abajo arriba: caras hacia fuera
    const geo = new THREE.LatheGeometry(orden.map(q=>new THREE.Vector2(q[0],q[1])), segs||24);
    const m = new THREE.Mesh(geo, material); m.scale.set(sx||1,1,sz||1);
    m.castShadow=true; parent.add(m); return m;
  }
  /* Cinta plana con grosor que sigue una curva (solapas del gi, puntas del obi).
     pts: puntos; normalDe(p): hacia fuera de la superficie; ancho: número o función(u). */
  function cinta(parent, pts, normalDe, ancho, grosor, material){
    const curva = new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
    const N=24, pos=[], idx=[];
    for(let i=0;i<=N;i++){
      const u=i/N, p=curva.getPointAt(u), d=curva.getTangentAt(u), n=normalDe(p).normalize();
      const lado=new THREE.Vector3().crossVectors(d,n).normalize();
      const w=(typeof ancho==='function'? ancho(u) : ancho)/2;
      for(const [sl,sn] of [[-1,0],[1,0],[1,-1],[-1,-1]]){          // 4 vértices por sección: cara exterior y dorso
        pos.push(p.x+lado.x*w*sl+n.x*grosor*sn, p.y+lado.y*w*sl+n.y*grosor*sn, p.z+lado.z*w*sl+n.z*grosor*sn);
      }
      if(i<N) for(let k=0;k<4;k++){ const a=i*4+k, b=i*4+(k+1)%4, c2=a+4, d2=b+4; idx.push(a,c2,b, b,c2,d2); }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m=new THREE.Mesh(geo, material); m.castShadow=true; parent.add(m); return m;
  }

  /* ---------------- Construcción del personaje ----------------
     Figura estilizada de gi: tronco en V con pecho y espalda, chaqueta con solapas
     que se CRUZAN sobre el pecho (la izquierda encima), cuello, mangas anchas que
     acaban a media antebrazo con dobladillo, pantalón amplio con bajo, obi de dos
     vueltas con nudo y puntas, manos cerradas con nudillos, pies descalzos, cara
     con ojos que parpadean y peinado según el personaje (hachimaki, chonmage…).
     Las articulaciones y longitudes (j.*) son LAS MISMAS de siempre → todos los
     animadores y el retargeting a .glb siguen valiendo tal cual.                 */
  function construirPersonaje(p){
    const root = new THREE.Group();
    const tela = telaGi(p.gi), telaSolapa = telaGi(p.solapa||p.gi), piel = pielMat(p.piel), telaObi = telaLisa(p.obi);
    const pelo = borde(mat(p.pelo||0x1b1512, {roughness:0.55}), 0x9a8a78, 0.35);
    const oscuro = mat(0x14110e,{roughness:0.35});

    /* --- pelvis, pantalón y obi --- */
    const pelvis = new THREE.Group(); pelvis.position.set(0,0.95,0); root.add(pelvis);
    esfera(pelvis, 0.205, p.gi, 0,-0.03,0, 1.0,0.70,0.74, tela);
    const obi = torneado(pelvis, [[0.206,-0.035],[0.212,-0.02],[0.212,0.08],[0.206,0.095]], telaObi, 1, 0.75, 28); obi.position.y=-0.005;
    const vuelta = new THREE.Mesh(new THREE.TorusGeometry(0.212,0.004,6,40), mat(0x000000,{roughness:1, transparent:true, opacity:0.35}));
    vuelta.rotation.x=Math.PI/2; vuelta.scale.set(1,0.75,1); vuelta.position.y=0.03; pelvis.add(vuelta);   // raya entre las dos vueltas
    const nudo = esfera(pelvis, 0.045, p.obi, 0.03,0.03,0.158, 1.25,0.95,0.55, telaObi);
    const zObi = p=>new THREE.Vector3(0,0,1).add(new THREE.Vector3(p.x*0.4,0,0));
    cinta(pelvis, [[0.02,0.02,0.170],[-0.02,-0.06,0.178],[-0.055,-0.15,0.176],[-0.07,-0.23,0.168]], zObi, u=>0.05+0.008*u, 0.012, telaObi);
    cinta(pelvis, [[0.05,0.02,0.170],[0.08,-0.05,0.174],[0.10,-0.13,0.166],[0.115,-0.20,0.155]], zObi, u=>0.05+0.008*u, 0.012, telaObi);
    nudo.rotation.z=0.2;

    /* --- tronco (chaqueta) --- */
    const torso = new THREE.Group(); torso.position.set(0,0.06,0); pelvis.add(torso);
    const PERFIL_T = [[0.200,-0.15],[0.212,-0.08],[0.200,0.02],[0.198,0.10],[0.215,0.20],[0.240,0.30],[0.255,0.38],[0.250,0.45],[0.225,0.50],[0.160,0.545],[0.075,0.565]];
    const SZ = 0.64;                                     // el tronco es más plano de delante a atrás
    const tronco = torneado(torso, PERFIL_T, tela, 1.0, SZ, 30);
    root.userData.pecho = tronco;                        // respira (escala) en cada cuadro
    esfera(torso, 0.25, p.gi, 0,0.455,-0.03, 1.14,0.46,0.56, tela);                       // trapecios / hombros
    esfera(torso, 0.20, p.gi, 0,0.33,-0.035, 1.05,0.85,0.55, tela);                       // espalda (dorsales)
    // superficie del tronco: z delantera para (x,y), para pegar solapas y la piel del pecho
    const radioT = y=>{ for(let i=1;i<PERFIL_T.length;i++){ const a=PERFIL_T[i-1], b=PERFIL_T[i];
        if(y<=b[1]){ const k=(y-a[1])/((b[1]-a[1])||1); return a[0]+(b[0]-a[0])*Math.max(0,Math.min(1,k)); } } return PERFIL_T[PERFIL_T.length-1][0]; };
    const zFrente = (x,y)=> SZ*Math.sqrt(Math.max(0.0004, radioT(y)*radioT(y)-x*x));
    const normalT = q=>{ const r=radioT(q.y); return new THREE.Vector3(q.x/(r*r), 0.15, q.z/(SZ*SZ*r*r)); };
    const trazo = (x0,y0,x1,y1,dz)=>{ const out=[]; for(let i=0;i<=6;i++){ const k=i/6, x=x0+(x1-x0)*k, y=y0+(y1-y0)*k;
        out.push([x, y, zFrente(x,y)+dz]); } return out; };
    // piel del pecho en la V (bajo las solapas)
    // polygonOffset: estas capas finas ganan al tronco que tienen justo debajo (sin parpadeo ni dientes)
    const encima = (m,f)=>{ const c=m.clone(); c.onBeforeCompile=m.onBeforeCompile; c.customProgramCacheKey=m.customProgramCacheKey;
      c.polygonOffset=true; c.polygonOffsetFactor=-f; c.polygonOffsetUnits=-f*2; return c; };
    cinta(torso, trazo(0,0.30,0,0.53,0.007), normalT, u=>0.02+0.14*u, 0.005, encima(piel,2));
    // solapas: la derecha por debajo, la izquierda (x>0 = izquierda del personaje) encima
    cinta(torso, trazo(-0.085,0.55,0.105,0.0,0.016), normalT, 0.062, 0.013, encima(telaSolapa,4));
    cinta(torso, trazo(0.085,0.55,-0.115,0.0,0.031), normalT, 0.064, 0.013, encima(telaSolapa,6));
    // cuello de la chaqueta por detrás de la nuca
    const cuelloGi = new THREE.Mesh(new THREE.TorusGeometry(0.088,0.02,8,24,Math.PI*1.15), telaSolapa);
    cuelloGi.rotation.x=Math.PI/2; cuelloGi.rotation.z=Math.PI*1.075; cuelloGi.scale.set(1,0.78,1.5); cuelloGi.position.set(0,0.545,-0.012);
    cuelloGi.castShadow=true; torso.add(cuelloGi);

    /* --- cuello y cabeza --- */
    const cuello = new THREE.Group(); cuello.position.set(0,0.52,0); torso.add(cuello);
    torneado(cuello, [[0.058,-0.02],[0.056,0.05],[0.060,0.11],[0.05,0.14]], piel, 1, 1, 16);
    const cabeza = new THREE.Group(); cabeza.position.set(0,0.10,0); cuello.add(cabeza);
    const cubierta = p.capucha ? tela : piel;
    esfera(cabeza, 0.168, p.piel, 0,0.135,-0.005, 0.95,1.04,1.0, cubierta);                 // cráneo
    esfera(cabeza, 0.118, p.piel, 0,0.075,0.018, 0.97,0.9,1.0, cubierta);                  // mandíbula y mejillas
    if(p.capucha){                                                        // capucha ninja: solo se ve la franja de los ojos
      cinta(cabeza, [[-0.13,0.15,0.09],[-0.07,0.155,0.155],[0,0.157,0.170],[0.07,0.155,0.155],[0.13,0.15,0.09]],
            q=>new THREE.Vector3(q.x,0,q.z), 0.075, 0.004, piel);
      cinta(cabeza, [[-0.07,0.25,-0.1],[-0.1,0.18,-0.2],[-0.13,0.06,-0.23],[-0.15,-0.06,-0.22]], q=>new THREE.Vector3(0,0,-1), u=>0.04-0.015*u, 0.008, telaObi); // cola de la cinta
      cinta(cabeza, [[0.07,0.25,-0.1],[0.09,0.17,-0.2],[0.10,0.05,-0.235],[0.11,-0.04,-0.23]], q=>new THREE.Vector3(0,0,-1), u=>0.04-0.015*u, 0.008, telaObi);
      cinta(cabeza, [[-0.165,0.205,0.0],[-0.12,0.215,0.105],[0,0.222,0.158],[0.12,0.215,0.105],[0.165,0.205,0.0]], q=>new THREE.Vector3(q.x,0.4,q.z), 0.034, 0.006, telaObi); // hachimaki
    }
    // ojos: blanco, iris, brillo — agrupados para poder parpadear
    const ojos=[];
    [1,-1].forEach(s=>{
      const ojo = new THREE.Group(); ojo.position.set(s*0.058,0.148,0.150); cabeza.add(ojo);
      esfera(ojo, 0.028, 0xf4efe6, 0,0,0, 1.15,0.78,0.5, mat(0xf4efe6,{roughness:0.3}));
      esfera(ojo, 0.0175, 0x2a1a10, 0,-0.001,0.009, 1,1.08,0.5, oscuro);
      esfera(ojo, 0.0055, 0xffffff, s*0.004+0.004,0.006,0.017, 1,1,0.5, mat(0xffffff,{emissive:0xffffff, emissiveIntensity:0.9, roughness:0.2}));
      ojos.push(ojo);
    });
    root.userData.ojos = ojos;
    const colorCeja = p.capucha ? p.gi : (p.pelo||0x1b1512);
    [1,-1].forEach(s=>{                                                    // cejas decididas (algo inclinadas hacia dentro)
      const ceja = cinta(cabeza, [[s*0.025,0.178,0.164],[s*0.058,0.190,0.163],[s*0.092,0.184,0.148]], q=>new THREE.Vector3(q.x*0.6,0.2,1),
                         u=>0.012-0.005*u, 0.006, p.capucha? tela : pelo);
      ceja.userData.lado=s;
    });
    if(!p.capucha){
      esfera(cabeza, 0.024, p.piel, 0,0.108,0.170, 0.75,1.0,0.85, piel);                          // nariz
      const boca = new THREE.Mesh(new THREE.TorusGeometry(0.026,0.0045,6,14,Math.PI*0.7), mat(0x8e5646,{roughness:0.6}));
      boca.rotation.z=Math.PI*1.15; boca.position.set(0,0.068,0.152); boca.scale.set(1,0.55,1); cabeza.add(boca);  // media sonrisa serena
      [1,-1].forEach(s=>{ esfera(cabeza, 0.032, p.piel, s*0.162,0.12,-0.005, 0.45,1,0.75, piel); });           // orejas
      [1,-1].forEach(s=>{ esfera(cabeza, 0.022, 0xe07a6a, s*0.085,0.085,0.128, 1.3,0.8,0.4,
                                 mat(0xe07a6a,{roughness:0.8, transparent:true, opacity:0.22, depthWrite:false})); });   // rubor
    }
    if(!p.calvo && !p.capucha){                                           // pelo: casquete con volumen + mechones
      const casco = new THREE.Mesh(new THREE.SphereGeometry(0.178, 26, 18, 0, TAU, 0, Math.PI*0.52), pelo);
      casco.position.set(0,0.15,-0.018); casco.rotation.x=-0.38; casco.scale.set(0.99,1.0,1.03); casco.castShadow=true; cabeza.add(casco);
      esfera(cabeza, 0.15, p.pelo, 0,0.13,-0.07, 1.08,1.0,0.95, pelo);                            // nuca
      [[-0.09,0.27,0.08,-0.5,0.35],[-0.02,0.30,0.10,-0.2,0.5],[0.06,0.29,0.09,0.25,0.45],[0.11,0.25,0.06,0.6,0.3]].forEach(m=>{
        const mech = new THREE.Mesh(new THREE.ConeGeometry(0.045,0.11,10), pelo);                // flequillo en punta
        mech.position.set(m[0],m[1],m[2]); mech.rotation.set(m[4]+0.9, 0, -m[3]); mech.castShadow=true; cabeza.add(mech);
      });
      if(p.mono){ const moño=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.03,0.14,12), pelo);    // chonmage doblado al frente
        moño.position.set(0,0.33,-0.02); moño.rotation.x=1.25; cabeza.add(moño); esfera(cabeza, 0.035, p.pelo, 0,0.315,-0.07, 1,1,1, pelo); }
    }
    if(p.hachimaki){                                                      // cinta en la frente con puntas al viento
      const mh = telaLisa(p.hachimaki);
      const banda = new THREE.Mesh(new THREE.TorusGeometry(0.166,0.017,8,48), mh);
      banda.rotation.x=Math.PI/2-0.14; banda.scale.set(1,1.04,0.75); banda.position.set(0,0.222,-0.012); cabeza.add(banda);
      esfera(cabeza, 0.024, p.hachimaki, 0,0.20,-0.172, 1.3,1,0.8, mh);
      cinta(cabeza, [[0,0.20,-0.175],[-0.04,0.15,-0.24],[-0.07,0.11,-0.28],[-0.08,0.03,-0.29]], q=>new THREE.Vector3(1,0,-0.3), u=>0.035-0.01*u, 0.006, mh);
      cinta(cabeza, [[0,0.20,-0.175],[0.05,0.14,-0.235],[0.09,0.09,-0.26],[0.12,0.01,-0.27]], q=>new THREE.Vector3(1,0,0.3), u=>0.035-0.01*u, 0.006, mh);
    }

    /* --- brazos: manga ancha hasta media antebrazo, antebrazo, puño --- */
    function brazo(s){
      const hombro = new THREE.Group(); hombro.position.set(s*0.27,0.46,0); torso.add(hombro);
      esfera(hombro, 0.100, p.gi, 0,-0.005,0, 1,1,1, tela);                                // deltoides con la tela
      torneado(hombro, [[0.100,0.0],[0.103,-0.10],[0.104,-0.22],[0.100,-0.30]], tela, 1, 1, 20);
      const codo = new THREE.Group(); codo.position.set(0,-0.30,0); hombro.add(codo);
      esfera(codo, 0.097, p.gi, 0,0,0, 1,1,1, tela);
      torneado(codo, [[0.100,0.0],[0.104,-0.07],[0.108,-0.12]], tela, 1, 1, 20);             // manga que sigue al antebrazo
      torneado(codo, [[0.108,-0.118],[0.111,-0.13],[0.104,-0.142],[0.056,-0.142]], telaSolapa, 1, 1, 20);  // dobladillo
      torneado(codo, [[0.047,-0.02],[0.052,-0.10],[0.054,-0.15],[0.046,-0.215],[0.040,-0.245],[0.036,-0.255]], piel, 1, 1, 16);
      const puno = new THREE.Group(); puno.position.set(0,-0.295,0.008); codo.add(puno);
      esfera(puno, 0.052, p.piel, 0,0.008,0, 0.95,1.0,1.1, piel);                          // palma / dorso
      esfera(puno, 0.040, p.piel, 0,-0.028,0.02, 1.2,0.62,1.0, piel);                      // dedos cerrados
      esfera(puno, 0.02, p.piel, s*0.045,-0.005,0.03, 0.9,1.4,0.9, piel);                  // pulgar
      return {hombro,codo};
    }
    const bl=brazo(1), br=brazo(-1);

    /* --- piernas: pantalón amplio con bajo, tobillo y pie descalzo --- */
    function pierna(s){
      const cadera = new THREE.Group(); cadera.position.set(s*0.12,-0.04,0); pelvis.add(cadera);
      esfera(cadera, 0.112, p.gi, 0,0,0, 1,1,1, tela);
      torneado(cadera, [[0.118,0.0],[0.121,-0.08],[0.114,-0.26],[0.104,-0.46]], tela, 1, 1, 22);
      const rodilla = new THREE.Group(); rodilla.position.set(0,-0.46,0); cadera.add(rodilla);
      esfera(rodilla, 0.100, p.gi, 0,0,0, 1,1,1, tela);
      torneado(rodilla, [[0.104,0.0],[0.100,-0.14],[0.103,-0.30],[0.109,-0.36]], tela, 1, 1, 22);
      torneado(rodilla, [[0.109,-0.355],[0.112,-0.365],[0.106,-0.378],[0.052,-0.378]], telaSolapa, 1, 1, 22);  // bajo
      torneado(rodilla, [[0.05,-0.33],[0.052,-0.39],[0.047,-0.42],[0.03,-0.44]], piel, 1, 1, 14);             // tobillo
      esfera(rodilla, 0.058, p.piel, 0,-0.445,0.055, 0.92,0.52,1.95, piel);                // pie
      esfera(rodilla, 0.045, p.piel, 0,-0.448,-0.03, 1,0.75,1, piel);                      // talón
      esfera(rodilla, 0.042, p.piel, s*0.008,-0.455,0.155, 1.3,0.62,0.95, piel);           // dedos
      return {cadera,rodilla};
    }
    const pl=pierna(1), pr=pierna(-1);

    // bokken en la mano derecha (solo se muestra en kenjutsu): sale del puño hacia adelante-arriba
    const bokken = new THREE.Group(); bokken.position.set(0,-0.29,0.02); bokken.rotation.x=-1.0; br.codo.add(bokken);
    const hoja = new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.018,1.02,10), mat(0x8a5a2e,{roughness:0.6}));
    hoja.position.y=-0.36; hoja.castShadow=true; bokken.add(hoja);
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.012,14), mat(0x3a2616,{roughness:0.7}));
    tsuba.position.y=-0.10; bokken.add(tsuba);
    bokken.visible=false; root.userData.bokken=bokken;

    const j = {root,pelvis,torso,cuello,cabeza,
               hombroL:bl.hombro,codoL:bl.codo,hombroR:br.hombro,codoR:br.codo,
               caderaL:pl.cadera,rodillaL:pl.rodilla,caderaR:pr.cadera,rodillaR:pr.rodilla};
    root.userData.j = j;
    root.reset = function(){
      root.position.set(0,0,0); root.rotation.set(0,0,0);
      for(const k in j){ j[k].rotation.set(0,0,0); }
      j.hombroL.rotation.z =  0.16; j.hombroR.rotation.z = -0.16;
    };
    return root;
  }

  /* ---------------- Animadores por movimiento ----------------
     Cada función recibe (j, t) con t∈[0,1) en bucle y fija
     rotaciones (radianes) sobre la pose neutra ya aplicada.    */
  const sin = (t,n=1)=>Math.sin(t*TAU*n);
  const pulso = (t)=>0.5-0.5*Math.cos(t*TAU);      // 0→1→0 suave

  const ANIM = {
    breathe(j,t){ const s=pulso(t); j.torso.rotation.x=0.04*s; j.cabeza.rotation.x=0.03*s;
      j.hombroL.rotation.z=0.12+0.03*s; j.hombroR.rotation.z=-0.12-0.03*s; j.root.position.y=0.01*s; },
    soltar(j,t){ const s=sin(t), u=pulso(t);        // "sacude": de pie, brazos colgando que oscilan y rodillas que rebotan (entre técnicas)
      j.hombroL.rotation.x=0.22*s; j.hombroR.rotation.x=-0.22*s; j.hombroL.rotation.z=0.14; j.hombroR.rotation.z=-0.14;
      j.codoL.rotation.x=-0.22-0.12*u; j.codoR.rotation.x=-0.22-0.12*u;
      j.caderaL.rotation.x=-0.08*u; j.caderaR.rotation.x=-0.08*u; j.rodillaL.rotation.x=0.16*u; j.rodillaR.rotation.x=0.16*u;
      j.root.position.y=-0.05*u; j.torso.rotation.y=0.05*s; j.cabeza.rotation.x=0.04; },

    run(j,t){ const a=sin(t); j.caderaL.rotation.x=0.9*a; j.caderaR.rotation.x=-0.9*a;
      j.rodillaL.rotation.x=0.35+Math.max(0,-a)*1.3; j.rodillaR.rotation.x=0.35+Math.max(0,a)*1.3;
      j.hombroL.rotation.x=-0.95*a-0.1; j.hombroR.rotation.x=0.95*a-0.1;   // brazos con codos doblados, en oposición
      j.codoL.rotation.x=-1.55; j.codoR.rotation.x=-1.55;
      j.root.position.y=0.04*Math.abs(a); j.torso.rotation.x=0.1; },

    jump(j,t){ const u=pulso(t);   // jumping jacks
      j.hombroL.rotation.z=0.2+u*2.2; j.hombroR.rotation.z=-(0.2+u*2.2);
      j.caderaL.rotation.z=u*0.5; j.caderaR.rotation.z=-u*0.5;
      j.root.position.y=0.12*Math.abs(sin(t)); },

    armcircle(j,t){ j.hombroL.rotation.x=t*TAU; j.hombroR.rotation.x=t*TAU;
      j.hombroL.rotation.z=0.05; j.hombroR.rotation.z=-0.05; },

    hipcircle(j,t){ const s=sin(t), c=Math.cos(t*TAU);                 // la cadera dibuja el círculo, el tronco compensa
      j.root.position.x=0.10*s; j.root.position.z=0.10*c;
      j.torso.rotation.z=0.22*s; j.torso.rotation.x=-0.22*c;
      j.hombroL.rotation.x=0.35; j.hombroL.rotation.z=0.6; j.hombroL.rotation.y=-1.1; j.codoL.rotation.x=-1.1;   // manos en la cintura
      j.hombroR.rotation.x=0.35; j.hombroR.rotation.z=-0.6; j.hombroR.rotation.y=1.1; j.codoR.rotation.x=-1.1; },

    legswing(j,t){ j.caderaR.rotation.x=0.9*sin(t); j.hombroL.rotation.z=1.3; j.codoL.rotation.x=-0.4;
      j.hombroR.rotation.z=-0.4; },

    squat(j,t){ const b=pulso(t); j.caderaL.rotation.x=-1.3*b; j.caderaR.rotation.x=-1.3*b;   // sentadilla profunda, brazos al frente
      j.rodillaL.rotation.x=2.05*b; j.rodillaR.rotation.x=2.05*b; j.torso.rotation.x=0.5*b;
      j.hombroL.rotation.x=-1.4*b; j.hombroR.rotation.x=-1.4*b; j.root.position.y=-0.46*b; },

    jumpsquat(j,t){ if(t<0.6){ const b=pulso(t/0.6); j.caderaL.rotation.x=-1.0*b; j.caderaR.rotation.x=-1.0*b;
        j.rodillaL.rotation.x=1.7*b; j.rodillaR.rotation.x=1.7*b; j.torso.rotation.x=0.4*b; j.root.position.y=-0.34*b; }
      else { const u=Math.sin((t-0.6)/0.4*Math.PI); j.root.position.y=0.25*u; j.hombroL.rotation.z=0.2+u*2; j.hombroR.rotation.z=-(0.2+u*2); } },

    sidelunge(j,t){ const s=sin(t), b=Math.abs(s), L=s>0;             // zancada LATERAL: abre la pierna al lado y se sienta sobre ella
      j.root.position.x=0.22*s; j.root.position.y=-0.28*b;
      const cf=L?j.caderaL:j.caderaR, rf=L?j.rodillaL:j.rodillaR, ce=L?j.caderaR:j.caderaL;
      cf.rotation.z=(L?1:-1)*0.55*b; cf.rotation.x=-0.9*b; rf.rotation.x=1.6*b;     // pierna que flexiona
      ce.rotation.z=(L?-1:1)*0.75*b;                                                  // pierna estirada, abierta
      j.torso.rotation.x=0.35*b; j.hombroL.rotation.x=-1.1*b; j.hombroR.rotation.x=-1.1*b; },

    skater(j,t){ const s=sin(t); j.root.position.x=0.18*s; j.root.position.y=0.05*Math.abs(Math.cos(t*TAU));
      j.torso.rotation.y=0.3*s; j.caderaR.rotation.x=0.4-0.6*s; j.hombroL.rotation.x=0.6*s; j.hombroR.rotation.x=-0.6*s; },

    calf(j,t){ const u=pulso(t); j.root.position.y=0.06*u; j.hombroL.rotation.z=0.18; j.hombroR.rotation.z=-0.18; },

    arms(j,t){ const u=pulso(t); j.codoL.rotation.x=-1.6*u; j.codoR.rotation.x=-1.6*u;
      j.hombroL.rotation.x=-0.2; j.hombroR.rotation.x=-0.2; },

    press(j,t){ const u=pulso(t); j.hombroL.rotation.z=2.0; j.hombroR.rotation.z=-2.0;
      j.hombroL.rotation.x=0.1; j.hombroR.rotation.x=0.1;
      j.codoL.rotation.x=-(1.5-u*1.4); j.codoR.rotation.x=-(1.5-u*1.4); },

    /* ---- tumbado boca arriba ---- */
    bridge(j,t){ acostado(j,'arriba'); const u=pulso(t), L=0.42*u;   // puente: hombros en el suelo, la cadera sube
      j.root.rotation.x=-Math.PI/2-L; j.root.position.y=0.17+1.47*Math.sin(L);
      j.caderaL.rotation.x=1.0-0.75*u; j.caderaR.rotation.x=1.0-0.75*u;
      j.rodillaL.rotation.x=1.3+0.2*u; j.rodillaR.rotation.x=1.3+0.2*u;
      j.hombroL.rotation.z=0.45; j.hombroR.rotation.z=-0.45; },
    crunch(j,t){ acostado(j,'arriba'); const u=pulso(t);
      j.torso.rotation.x=-0.7*u; j.cuello.rotation.x=-0.2*u;
      j.caderaL.rotation.x=0.9; j.caderaR.rotation.x=0.9; j.rodillaL.rotation.x=1.1; j.rodillaR.rotation.x=1.1;
      j.hombroL.rotation.x=-0.6; j.hombroR.rotation.x=-0.6; },
    legraise(j,t){ acostado(j,'arriba'); const u=pulso(t);
      j.caderaL.rotation.x=1.4*u; j.caderaR.rotation.x=1.4*u; },
    twist(j,t){ acostado(j,'sentado'); const s=sin(t); j.torso.rotation.y=0.55*s;   // giro ruso: sentado, pies en el suelo
      j.caderaL.rotation.x=1.25; j.caderaR.rotation.x=1.25; j.rodillaL.rotation.x=1.85; j.rodillaR.rotation.x=1.85;
      j.hombroL.rotation.x=-1.0; j.hombroR.rotation.x=-1.0; j.codoL.rotation.x=-0.8; j.codoR.rotation.x=-0.8; },

    /* ---- tumbado boca abajo / plancha ---- */
    plank(j,t){ const inc=0.165; prono(j,inc,0.06);                  // plancha sobre los antebrazos
      j.hombroL.rotation.x=brazoVertical(inc); j.hombroR.rotation.x=brazoVertical(inc);
      j.codoL.rotation.x=-1.75; j.codoR.rotation.x=-1.75; j.root.position.y+=0.006*pulso(t); },
    pushup(j,t){ const u=pulso(t), inc=0.37-0.18*u; prono(j,inc,0.06);  // flexión: baja el pecho, los codos se doblan
      j.hombroL.rotation.x=brazoVertical(inc)+0.85*u; j.hombroR.rotation.x=brazoVertical(inc)+0.85*u;
      j.codoL.rotation.x=-1.55*u; j.codoR.rotation.x=-1.55*u; },
    superman(j,t){ prono(j,0,0.16); const u=pulso(t);                  // tumbado: despega brazos, pecho y piernas
      j.hombroL.rotation.x=-2.9; j.hombroR.rotation.x=-2.9; j.hombroL.rotation.z=0.25; j.hombroR.rotation.z=-0.25;
      j.caderaL.rotation.x=0.35*u; j.caderaR.rotation.x=0.35*u;
      j.torso.rotation.x=-0.28*u; j.cabeza.rotation.x=-0.55-0.2*u; j.root.position.y+=0.02*u; },
    mountain(j,t){ const inc=0.37; prono(j,inc,0.06);                   // escaladores: plancha alta, rodilla al pecho alterna
      j.hombroL.rotation.x=brazoVertical(inc); j.hombroR.rotation.x=brazoVertical(inc);
      const a=sin(t), l=Math.max(0,a), r=Math.max(0,-a);
      j.caderaL.rotation.x=-1.5*l; j.rodillaL.rotation.x=1.8*l; j.caderaR.rotation.x=-1.5*r; j.rodillaR.rotation.x=1.8*r; },
    birddog(j,t){ acostado(j,'cuadrupedia'); const u=pulso(t);         // brazo derecho al frente, pierna izquierda atrás, en línea
      j.hombroR.rotation.x=-1.6-1.55*u; j.caderaL.rotation.x=-1.6*(1-u); j.rodillaL.rotation.x=1.5*(1-u); },
    catcamel(j,t){ acostado(j,'cuadrupedia'); const s=sin(t);   // arquea y redondea (gato ↔ camello)
      j.torso.rotation.x=0.3*s; j.cuello.rotation.x=0.3*s; },

    /* ---- tumbado de lado ---- */
    sideleg(j,t){ acostado(j,'lado'); const u=pulso(t); j.caderaR.rotation.z=-0.8*u; },
    sideplank(j,t){ acostado(j,'lado'); j.hombroR.rotation.x=-1.5; j.codoR.rotation.x=-1.4;
      j.root.position.y+=0.01*pulso(t); },

    /* ---- técnica marcial: ver sección "Técnica marcial v2" más abajo ---- */

    burpee: null,   // se define más abajo como secuencia de poses (sentadilla → plancha → flexión → salto)

    stretch(j,t){ const s=pulso(t); j.torso.rotation.z=0.3*s; j.hombroL.rotation.z=2.4; j.hombroR.rotation.z=-0.3; },
  };

  /* Animador a partir de una lista fija de poses {t,p} (misma técnica que las
     técnicas marciales editables, pero sin pasar por el editor) */
  function animadorPasos(pasos, dur){
    const fn=(j,t)=>{ let i=pasos.length-1; while(i>0 && t<pasos[i].t) i--;
      const a=pasos[i], b=pasos[(i+1)%pasos.length], fin=(i===pasos.length-1)?1:b.t;
      mezclarPose(j, a.p, b.p, suave(clamp01((t-a.t)/((fin-a.t)||1)))); };
    fn.dur=dur; return fn;
  }
  /* Burpee completo: baja a sentadilla con las manos al suelo, salta los pies atrás
     a plancha (de cara al frente: root_x gira el cuerpo), flexión, vuelve y salta. */
  const P_SQUAT = {caderaL_x:-1.35, caderaR_x:-1.35, rodillaL_x:2.1, rodillaR_x:2.1, torso_x:1.0, root_py:-0.58,
                   hombroL_x:-1.9, hombroR_x:-1.9, cabeza_x:-0.5};
  const P_PLANK = {root_x:1.2, root_py:0.06, root_pz:-0.55, hombroL_x:-1.2, hombroR_x:-1.2, cabeza_x:-0.5};
  const P_PUSH  = {...P_PLANK, root_x:1.38, hombroL_x:-0.55, hombroR_x:-0.55, codoL_x:-1.6, codoR_x:-1.6};
  const P_JUMP  = {root_py:0.30, hombroL_z:2.6, hombroR_z:-2.6, caderaL_x:-0.15, caderaR_x:-0.15, rodillaL_x:0.35, rodillaR_x:0.35};
  const P_LAND  = {caderaL_x:-0.5, caderaR_x:-0.5, rodillaL_x:0.8, rodillaR_x:0.8, root_py:-0.18, torso_x:0.2};
  ANIM.burpee = animadorPasos([
    {t:0, p:{}}, {t:0.12, p:P_SQUAT}, {t:0.25, p:P_PLANK}, {t:0.35, p:P_PUSH}, {t:0.44, p:P_PLANK},
    {t:0.56, p:P_SQUAT}, {t:0.68, p:P_JUMP}, {t:0.80, p:P_LAND}, {t:0.90, p:{}},
  ], 3.6);

  /* Movimientos adicionales — uno propio para cada ejercicio */
  Object.assign(ANIM, {
    /* ---- estiramientos, cada uno el suyo ---- */
    cuello(j,t){ const s=sin(t), c=Math.cos(t*TAU);                    // semicírculo oreja → pecho → oreja, ida y vuelta
      j.cabeza.rotation.z=0.45*s; j.cabeza.rotation.x=0.30*Math.abs(c)-0.03;
      j.hombroL.rotation.z=0.2; j.hombroR.rotation.z=-0.2; },
    cuadriceps(j,t){ const s=pulso(t);                                // de pie, talón derecho al glúteo sujeto con la mano
      j.rodillaR.rotation.x=2.4+0.06*s; j.caderaR.rotation.x=0.2; j.torso.rotation.x=0.22;
      j.hombroR.rotation.x=0.85; j.hombroR.rotation.z=-0.12; j.codoR.rotation.x=-0.45;   // brazo atrás y abajo, la mano sujeta el pie
      j.hombroL.rotation.z=1.5; j.codoL.rotation.x=-0.2;              // brazo en cruz para el equilibrio
      j.root.rotation.z=0.02*s; },
    isquios(j,t){ const u=0.85+0.15*pulso(t);                         // flexión de tronco al frente, brazos colgando
      j.torso.rotation.x=1.35*u; j.cabeza.rotation.x=-0.3;
      j.hombroL.rotation.x=-1.3*u; j.hombroR.rotation.x=-1.3*u; j.hombroL.rotation.z=0.1; j.hombroR.rotation.z=-0.1;
      j.caderaL.rotation.x=-0.12*u; j.caderaR.rotation.x=-0.12*u; j.root.position.y=-0.03*u; },
    hombros(j,t){ const s=pulso(t);                                   // brazo derecho cruzado al pecho, el izquierdo lo sujeta
      j.hombroR.rotation.x=-1.45; j.hombroR.rotation.z=0.75+0.06*s; j.codoR.rotation.x=-0.15;
      j.hombroL.rotation.x=-1.2; j.hombroL.rotation.z=-0.1; j.codoL.rotation.x=-1.9; j.torso.rotation.y=0.12*s; },
    highknees(j,t){ const a=sin(t); j.caderaL.rotation.x=-1.5*Math.max(0,a); j.caderaR.rotation.x=-1.5*Math.max(0,-a);
      j.rodillaL.rotation.x=1.0*Math.max(0,a); j.rodillaR.rotation.x=1.0*Math.max(0,-a);
      j.hombroL.rotation.x=0.7*a; j.hombroR.rotation.x=-0.7*a; j.codoL.rotation.x=-1.2; j.codoR.rotation.x=-1.2;
      j.root.position.y=0.03*Math.abs(a); },
    buttkicks(j,t){ const a=sin(t); j.rodillaL.rotation.x=2.0*Math.max(0,a); j.rodillaR.rotation.x=2.0*Math.max(0,-a);
      j.caderaL.rotation.x=0.1; j.caderaR.rotation.x=0.1;
      j.hombroL.rotation.x=0.5*a; j.hombroR.rotation.x=-0.5*a; j.codoL.rotation.x=-1.0; j.codoR.rotation.x=-1.0;
      j.root.position.y=0.03*Math.abs(a); },
    sumo(j,t){ const b=pulso(t); j.caderaL.rotation.z=0.45; j.caderaR.rotation.z=-0.45;
      j.caderaL.rotation.y=0.4; j.caderaR.rotation.y=-0.4; j.caderaL.rotation.x=-0.3*b; j.caderaR.rotation.x=-0.3*b;
      j.rodillaL.rotation.x=1.4*b; j.rodillaR.rotation.x=1.4*b; j.torso.rotation.x=0.15*b;
      j.hombroL.rotation.x=-0.6*b; j.hombroR.rotation.x=-0.6*b; j.codoL.rotation.x=-0.8; j.codoR.rotation.x=-0.8;
      j.root.position.y=-0.30*b; },
    lunge(j,t){ const b=pulso(t); j.caderaR.rotation.x=-0.6; j.rodillaR.rotation.x=1.3*b;
      j.caderaL.rotation.x=0.5; j.rodillaL.rotation.x=1.4*b; j.torso.rotation.x=0.1;
      j.hombroL.rotation.z=0.2; j.hombroR.rotation.z=-0.2; j.root.position.y=-0.22*b; j.root.position.z=0.1; },
    horse(j,t){ const s=pulso(t); j.caderaL.rotation.z=0.5; j.caderaR.rotation.z=-0.5;
      j.caderaL.rotation.x=-0.15; j.caderaR.rotation.x=-0.15; j.rodillaL.rotation.x=1.1; j.rodillaR.rotation.x=1.1;
      j.hombroL.rotation.x=-1.3; j.hombroL.rotation.z=0.5; j.codoL.rotation.x=-1.6;
      j.hombroR.rotation.x=-1.3; j.hombroR.rotation.z=-0.5; j.codoR.rotation.x=-1.6; j.root.position.y=-0.30+0.01*s; },
    dips(j,t){ const u=pulso(t); j.caderaL.rotation.x=-1.3; j.caderaR.rotation.x=-1.3; j.rodillaL.rotation.x=1.0; j.rodillaR.rotation.x=1.0;
      j.hombroL.rotation.x=2.2; j.hombroR.rotation.x=2.2; j.codoL.rotation.x=-(0.2+u*1.2); j.codoR.rotation.x=-(0.2+u*1.2);
      j.torso.rotation.x=-0.15; j.root.rotation.x=-0.1; j.root.position.y=-0.35-0.08*u; },
    pikepush(j,t){ const u=pulso(t); j.torso.rotation.x=1.2; j.hombroL.rotation.x=-2.5; j.hombroR.rotation.x=-2.5;
      j.codoL.rotation.x=-(0.2+u*1.2); j.codoR.rotation.x=-(0.2+u*1.2); j.caderaL.rotation.x=0.1; j.caderaR.rotation.x=0.1; j.root.position.y=-0.05; },
    row(j,t){ const u=pulso(t); j.torso.rotation.x=1.0; j.caderaL.rotation.x=-0.3; j.caderaR.rotation.x=-0.3;
      j.rodillaL.rotation.x=0.4; j.rodillaR.rotation.x=0.4; j.hombroL.rotation.x=-0.2+0.5*u; j.hombroR.rotation.x=-0.2+0.5*u;
      j.codoL.rotation.x=-(0.3+u*1.4); j.codoR.rotation.x=-(0.3+u*1.4); j.root.position.y=-0.05; },
    lateralraise(j,t){ const u=pulso(t); j.hombroL.rotation.z=0.2+u*1.35; j.hombroR.rotation.z=-(0.2+u*1.35);
      j.hombroL.rotation.x=0.05; j.hombroR.rotation.x=0.05; },
    bicycle(j,t){ acostado(j,'arriba'); const a=sin(t); j.torso.rotation.x=-0.35; j.torso.rotation.y=0.35*a;
      j.caderaL.rotation.x=0.6+0.7*Math.max(0,a); j.caderaR.rotation.x=0.6+0.7*Math.max(0,-a);
      j.rodillaL.rotation.x=1.2-0.6*Math.max(0,a); j.rodillaR.rotation.x=1.2-0.6*Math.max(0,-a);
      j.hombroL.rotation.z=1.6; j.hombroR.rotation.z=-1.6; j.codoL.rotation.x=-1.4; j.codoR.rotation.x=-1.4; },
    /* meditación sentada (mokusō) — para los descansos */
    meditar(j,t){ const s=sin(t);
      j.root.position.y = -0.70 + 0.012*s;                 // sentado en el suelo, respira
      j.caderaL.rotation.x=-1.5; j.caderaL.rotation.z=0.7; j.rodillaL.rotation.x=1.95;  // piernas cruzadas
      j.caderaR.rotation.x=-1.5; j.caderaR.rotation.z=-0.7; j.rodillaR.rotation.x=1.95;
      j.hombroL.rotation.x=-0.55; j.hombroL.rotation.z=0.4; j.codoL.rotation.x=-0.75;   // manos sobre las rodillas
      j.hombroR.rotation.x=-0.55; j.hombroR.rotation.z=-0.4; j.codoR.rotation.x=-0.75;
      j.cabeza.rotation.x=0.12; j.torso.rotation.x=0.04*s; },
    /* ---- ejercicios que recorren espacio ---- */
    walklunge(j,t){  // zancada caminando: paso adelante con una pierna, regresa con la otra
      const mitad=t<0.5, f=(t%0.5)/0.5, u=Math.sin(f*Math.PI);
      j.root.position.z = 0.30*pulso(t);              // avanza y vuelve al origen
      j.root.position.y = -0.24*u;
      const cf=mitad?j.caderaL:j.caderaR, rf=mitad?j.rodillaL:j.rodillaR;  // pierna que da el paso
      const ct=mitad?j.caderaR:j.caderaL, rt=mitad?j.rodillaR:j.rodillaL;  // pierna trasera
      cf.rotation.x=-0.75*u; rf.rotation.x=1.15*u;
      ct.rotation.x= 0.45*u; rt.rotation.x=1.35*u;
      j.torso.rotation.x=0.08*u;
      j.hombroL.rotation.x=(mitad?1:-1)*0.5*u; j.hombroR.rotation.x=(mitad?-1:1)*0.5*u; },
    sidestep(j,t){   // desplazamiento lateral en guardia (footwork)
      const s=sin(t);
      j.root.position.x = 0.34*s;
      j.root.position.y = -0.06 + 0.035*Math.abs(Math.cos(t*TAU));
      j.caderaL.rotation.x=-0.25; j.rodillaL.rotation.x=0.45;
      j.caderaR.rotation.x=-0.25; j.rodillaR.rotation.x=0.45;
      j.caderaL.rotation.z=0.18*(1+s*0.6); j.caderaR.rotation.z=-0.18*(1-s*0.6); // abre la pierna que guía
      j.hombroL.rotation.x=-1.15; j.hombroL.rotation.z=0.3;  j.codoL.rotation.x=-2.2;  // guardia alta
      j.hombroR.rotation.x=-1.15; j.hombroR.rotation.z=-0.3; j.codoR.rotation.x=-2.2;
      j.torso.rotation.y=0.15*s; },
  });
  ANIM.walklunge.dur=3.4; ANIM.sidestep.dur=2.6;      // ciclos más largos: cada paso se aprecia
  /* Tempo real de cada ciclo (s). Las funciones usan ciclos ENTEROS en t∈[0,1): así el bucle
     empalma sin saltos y la velocidad se regula aquí, no con frecuencias fraccionarias. */
  ANIM.run.dur=0.9; ANIM.highknees.dur=0.9; ANIM.buttkicks.dur=0.9; ANIM.jump.dur=1.3;
  ANIM.breathe.dur=4.5; ANIM.soltar.dur=1.7; ANIM.meditar.dur=5.5; ANIM.cuello.dur=6; ANIM.catcamel.dur=4.5;

  /* ============ Técnica marcial v2 — poses por fotogramas clave ============
     Cada golpe pasa por sus fases reales: guardia → chamber (recoger la
     rodilla) → extensión → recogida → guardia; la pierna de apoyo queda
     flexionada y cada arte tiene su propia guardia. Una pose es un objeto
     plano {articulacion_eje: valor}: ejes x/y/z rotan (radianes) y
     px/py/pz trasladan (root). secuencia(dur,[{t,p},…]) interpola entre
     poses con suavizado y enlaza la última con la primera para el bucle. */
  const clamp01 = x => x<0?0:x>1?1:x;
  const suave = x => x*x*(3-2*x);                    // smoothstep

  /* ============ Anatomía — rangos articulares (ROM) ============
     Fuente: valores normales de amplitud articular de la AAOS
     (American Academy of Orthopaedic Surgeons), ampliados al rango
     ATLÉTICO/marcial (una patada alta o un codazo pasan del rango
     "de calle"). Todo en RADIANES; el signo sigue la convención del
     rig: en el hombro/cadera x<0 lleva el miembro al frente, en el
     codo/rodilla x flexiona (dobla). Se usan en dos sitios:
       · LIMITES_DUROS → se aplican SIEMPRE al reproducir una pose,
         para que ninguna edición doble un codo o una rodilla hacia
         atrás (lo que hacía que "la movilidad saliera mal").
       · RANGOS_EDITOR → acotan los deslizadores del editor y dan la
         lectura en grados, para que ajustar sea intuitivo.
     Las articulaciones de rótula (hombro/cadera) NO se acotan duro:
     su rango atlético es enorme (patada lateral, gancho) y un tope
     fijo recortaría técnicas correctas.                              */
  const GR = Math.PI/180;                            // grados → radianes
  const LIMITES_DUROS = {                            // bisagras: doblar al revés siempre se ve roto
    codoL_x:[-150*GR, 5*GR], codoR_x:[-150*GR, 5*GR],   // codo: flexiona ~150°, casi nada de hiperextensión
    rodillaL_x:[-5*GR, 140*GR], rodillaR_x:[-5*GR, 140*GR], // rodilla: flexiona ~140°, no se dobla al revés
  };
  const RANGOS_EDITOR = Object.assign({}, LIMITES_DUROS, {
    hombroL_x:[-180*GR, 60*GR], hombroR_x:[-180*GR, 60*GR],   // flexión (frente/arriba) / extensión atrás
    hombroL_z:[-45*GR, 180*GR], hombroR_z:[-180*GR, 45*GR],   // abducción (abrir al lado) / aducción
    caderaL_x:[-140*GR, 70*GR], caderaR_x:[-140*GR, 70*GR],   // flexión (subir rodilla) / extensión (atrás)
    caderaL_z:[-45*GR, 80*GR],  caderaR_z:[-80*GR, 45*GR],    // abducción (abrir) / aducción (cruzar)
    torso_x:[-70*GR, 90*GR], torso_y:[-70*GR, 70*GR], torso_z:[-45*GR, 45*GR],
    cabeza_x:[-45*GR, 60*GR], cabeza_y:[-80*GR, 80*GR],
  });
  const acotar = (r,v) => v<r[0] ? r[0] : v>r[1] ? r[1] : v;

  function fijarPose(j,c,v){
    const p=c.lastIndexOf('_'), o=j[c.slice(0,p)]; if(!o) return;
    const eje=c.slice(p+1);
    if(eje.length===2){ o.position[eje[1]]=v; return; }
    const lim = LIMITES_DUROS[c];                    // respeta la anatomía de codos y rodillas
    o.rotation[eje] = lim ? acotar(lim, v) : v;
  }
  function mezclarPose(j,a,b,k){
    for(const c in a){ const vb=(b[c]!==undefined?b[c]:0); fijarPose(j,c,a[c]+(vb-a[c])*k); }
    for(const c in b){ if(a[c]===undefined) fijarPose(j,c,b[c]*k); }
  }
  /* Guardias por estilo (pierna izquierda adelantada; se golpea con la derecha) */
  const G_KARATE = {                                  // zenkutsu-dachi en hanmi + hikite
    root_py:-0.10, torso_y:0.30, cabeza_y:-0.22,
    caderaL_x:-0.50, rodillaL_x:0.60, caderaR_x:0.30, rodillaR_x:0.12,
    hombroL_x:-0.95, hombroL_z:0.18, codoL_x:-0.85,   // brazo adelantado
    hombroR_x:0.40,  hombroR_z:-0.16, codoR_x:-1.75,  // hikite: puño en la cadera
  };
  const G_KIBA = {                                    // kiba-dachi (jinete) con las dos manos en hikite
    root_py:-0.30, caderaL_x:-0.15, caderaL_z:0.50, rodillaL_x:1.10, caderaR_x:-0.15, caderaR_z:-0.50, rodillaR_x:1.10,
    hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75, hombroR_x:0.40, hombroR_z:-0.16, codoR_x:-1.75,
  };
  const G_KOKUTSU = {                                 // kokutsu-dachi: peso atrás, pierna trasera flexionada, delantera casi recta
    root_py:-0.20, torso_y:0.35, cabeza_y:-0.30,
    caderaL_x:-0.55, rodillaL_x:0.25, caderaR_x:-0.35, caderaR_z:-0.40, rodillaR_x:1.00,
    hombroL_x:-0.95, hombroL_z:0.18, codoL_x:-0.85, hombroR_x:0.40, hombroR_z:-0.16, codoR_x:-1.75,
  };
  const G_MUAY = {                                    // guardia alta, mentón abajo
    root_py:-0.05, torso_y:0.10, cabeza_x:0.12,
    caderaL_x:-0.28, rodillaL_x:0.34, caderaR_x:0.14, rodillaR_x:0.22,
    hombroL_x:-1.15, hombroL_z:0.30, codoL_x:-2.25,
    hombroR_x:-1.15, hombroR_z:-0.30, codoR_x:-2.25,
  };
  const G_TKD = {                                     // más de perfil, manos algo más bajas
    root_py:-0.08, torso_y:0.55, cabeza_y:-0.45,
    caderaL_x:-0.35, rodillaL_x:0.45, caderaR_x:0.22, rodillaR_x:0.28,
    hombroL_x:-0.75, hombroL_z:0.25, codoL_x:-1.60,
    hombroR_x:-0.35, hombroR_z:-0.20, codoR_x:-1.40,
  };
  const G_KEN = {                                     // chūdan no kamae: sable al frente, manos juntas en la tsuka
    root_py:-0.08, torso_y:0.10,
    caderaL_x:-0.30, rodillaL_x:0.42, caderaR_x:0.20, rodillaR_x:0.15,
    hombroL_x:-1.00, hombroL_z:-0.22, codoL_x:-0.25,  // mano izquierda al final de la empuñadura (brazo más estirado)
    hombroR_x:-0.85, hombroR_z:0.22,  codoR_x:-0.70,  // mano derecha bajo la tsuba (brazo más doblado)
  };

  /* Patada frontal: chamber → extensión (con la cadera al frente) → recoge → baja */
  function patadaFrontal(G, extra){
    return {dur:2.6, pasos:[
      {t:0,    p:{...G}},
      {t:0.30, p:{...G, caderaR_x:-1.90, rodillaR_x:2.30, torso_y:(G.torso_y||0)*0.3,
                  rodillaL_x:(G.rodillaL_x||0)+0.15, torso_x:0.05, root_py:(G.root_py||0)-0.02}},
      {t:0.44, p:{...G, caderaR_x:-1.55, rodillaR_x:0.10, torso_y:(G.torso_y||0)*0.3,
                  torso_x:-0.16, root_py:(G.root_py||0)-0.04, ...(extra||{})}},
      {t:0.58, p:{...G, caderaR_x:-1.85, rodillaR_x:2.25, torso_y:(G.torso_y||0)*0.3}},
      {t:0.85, p:{...G}},
    ]};
  }
  /* Patada circular: rodilla de lado → giro de cadera y látigo → recoge */
  function patadaCircular(G, alta){
    const cx = alta ? -0.95 : -0.30;                  // altura del impacto (mawashi vs low kick)
    return {dur:2.6, pasos:[
      {t:0,    p:{...G}},
      {t:0.28, p:{...G, caderaR_x:-1.15, caderaR_z:-0.55, rodillaR_x:2.30, torso_y:-0.15, root_y:-0.15}},
      {t:0.44, p:{...G, caderaR_x:cx, caderaR_z:-1.05, rodillaR_x:alta?0.35:0.55, torso_y:-0.55,
                  torso_z:0.22, root_y:-0.45, root_py:(G.root_py||0)-0.03, rodillaL_x:(G.rodillaL_x||0)+0.10}},
      {t:0.60, p:{...G, caderaR_x:-1.10, caderaR_z:-0.50, rodillaR_x:2.20, root_y:-0.10}},
      {t:0.86, p:{...G}},
    ]};
  }

  /* ---- Tabla BASE de movimientos marciales (datos puros = editables) ----
     Cada uno es {dur, pasos:[{t, p}]}. Se convierten en animadores con
     animadorMov(clave), que lee MOV[clave] EN VIVO: por eso el editor
     refleja los cambios al instante y la clase usa lo que guardaste. */
  const MOV_BASE = {
    kick:       patadaFrontal(G_KARATE),                                 // mae geri
    roundhouse: patadaCircular(G_KARATE, true),                          // mawashi geri
    sidekick: {dur:2.6, pasos:[                                          // yoko geri
      {t:0,    p:{...G_KARATE}},
      {t:0.30, p:{...G_KARATE, caderaR_x:-1.35, rodillaR_x:2.35, torso_z:0.12, cabeza_y:-0.35}},
      {t:0.45, p:{...G_KARATE, caderaR_x:-0.45, caderaR_z:-1.30, rodillaR_x:0.10, torso_z:0.42,
                  torso_y:0.25, cabeza_y:-0.50, root_py:-0.15}},
      {t:0.60, p:{...G_KARATE, caderaR_x:-1.30, rodillaR_x:2.30, torso_z:0.15}},
      {t:0.86, p:{...G_KARATE}},
    ]},
    backkick: {dur:2.6, pasos:[                                          // dwit chagi
      {t:0,    p:{...G_TKD}},
      {t:0.20, p:{...G_TKD, cabeza_y:-0.75, torso_y:0.40}},              // mira por encima del hombro
      {t:0.36, p:{...G_TKD, cabeza_y:-0.75, caderaR_x:-1.00, rodillaR_x:2.20, torso_x:0.15}},
      {t:0.50, p:{...G_TKD, cabeza_y:-0.80, caderaR_x:1.05, rodillaR_x:0.15, torso_x:0.55, root_py:-0.14}},
      {t:0.66, p:{...G_TKD, cabeza_y:-0.60, caderaR_x:-0.60, rodillaR_x:1.80, torso_x:0.20}},
      {t:0.88, p:{...G_TKD}},
    ]},
    axekick: {dur:2.6, pasos:[                                           // naeryo chagi
      {t:0,    p:{...G_TKD}},
      {t:0.22, p:{...G_TKD, caderaR_x:-0.75, rodillaR_x:1.50}},          // recoge
      {t:0.45, p:{...G_TKD, caderaR_x:-2.25, rodillaR_x:0.30, torso_x:-0.18, torso_y:0.15, root_py:-0.10}},
      {t:0.58, p:{...G_TKD, caderaR_x:-0.35, rodillaR_x:0.45, torso_x:0.18}},  // el talón cae, rápido
      {t:0.85, p:{...G_TKD}},
    ]},
    kneestrike: {dur:2.0, pasos:[                                        // rodillazo muay thai
      {t:0,    p:{...G_MUAY}},
      {t:0.18, p:{...G_MUAY, caderaR_x:0.35, torso_x:-0.10}},            // carga atrás
      {t:0.40, p:{...G_MUAY, caderaR_x:-1.80, rodillaR_x:2.40, torso_x:-0.22, root_pz:0.10,
                  hombroL_x:-0.55, codoL_x:-1.30, hombroR_x:-0.55, codoR_x:-1.30}},  // tira de la guardia abajo
      {t:0.60, p:{...G_MUAY, caderaR_x:-0.60, rodillaR_x:1.40}},
      {t:0.85, p:{...G_MUAY}},
    ]},
    punch: {dur:2.2, pasos:[                                             // zuki alterno con hikite
      {t:0,    p:{...G_KARATE}},
      {t:0.20, p:{...G_KARATE, hombroR_x:-1.40, hombroR_z:-0.05, codoR_x:-0.10, torso_y:-0.10,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75, cabeza_y:0}},    // gyaku-zuki derecho
      {t:0.48, p:{...G_KARATE}},
      {t:0.68, p:{...G_KARATE, hombroL_x:-1.40, hombroL_z:0.05, codoL_x:-0.10, torso_y:0.55}}, // kizami izquierdo
      {t:0.92, p:{...G_KARATE}},
    ]},
    hook: {dur:2.2, pasos:[                                              // ganchos alternos
      {t:0,    p:{...G_MUAY}},
      {t:0.16, p:{...G_MUAY, torso_y:0.35}},                             // carga
      {t:0.34, p:{...G_MUAY, hombroR_x:-1.35, hombroR_z:-1.05, codoR_x:-1.85, torso_y:-0.55, root_y:-0.20}},
      {t:0.52, p:{...G_MUAY}},
      {t:0.66, p:{...G_MUAY, torso_y:-0.30}},
      {t:0.84, p:{...G_MUAY, hombroL_x:-1.35, hombroL_z:1.05, codoL_x:-1.85, torso_y:0.75, root_y:0.20}},
    ]},
    block: {dur:2.4, pasos:[                                             // age-uke con hikite
      {t:0,    p:{...G_KARATE}},
      {t:0.25, p:{...G_KARATE, hombroR_x:-0.45, hombroR_z:-0.30, codoR_x:-2.20, torso_y:0.45}}, // cruza abajo
      {t:0.48, p:{...G_KARATE, hombroR_x:-1.75, hombroR_z:-0.55, codoR_x:-2.05, torso_y:0.05,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75}},       // antebrazo sobre la frente
      {t:0.70, p:{...G_KARATE, hombroR_x:-1.75, hombroR_z:-0.55, codoR_x:-2.05, torso_y:0.05,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75}},       // mantiene el bloqueo
      {t:0.90, p:{...G_KARATE}},
    ]},
    elbow: {dur:2.0, pasos:[                                             // sok (codazo)
      {t:0,    p:{...G_MUAY}},
      {t:0.20, p:{...G_MUAY, torso_y:0.40, hombroR_x:-1.10}},
      {t:0.42, p:{...G_MUAY, hombroR_x:-1.75, hombroR_z:-0.75, codoR_x:-2.60, torso_y:-0.50,
                  root_y:-0.15, cabeza_x:0.15}},
      {t:0.62, p:{...G_MUAY}},
    ]},
    sword: {dur:2.6, pasos:[                                             // suburi men: jōdan → corte
      {t:0,    p:{...G_KEN}},
      {t:0.32, p:{...G_KEN, hombroL_x:-2.75, hombroR_x:-2.75, codoL_x:-0.70, codoR_x:-0.70,
                  root_py:-0.04, caderaL_x:-0.20, rodillaL_x:0.25, caderaR_x:0.10, torso_x:-0.06}},
      {t:0.48, p:{...G_KEN, hombroL_x:-1.05, hombroR_x:-1.05, codoL_x:-0.15, codoR_x:-0.15,
                  root_py:-0.18, caderaL_x:-0.55, rodillaL_x:0.70, caderaR_x:0.35, rodillaR_x:0.20, torso_x:0.12}},
      {t:0.70, p:{...G_KEN, hombroL_x:-1.05, hombroR_x:-1.05, codoL_x:-0.15, codoR_x:-0.15,
                  root_py:-0.18, caderaL_x:-0.55, rodillaL_x:0.70, caderaR_x:0.35, rodillaR_x:0.20, torso_x:0.12}},
      {t:0.90, p:{...G_KEN}},
    ]},
    'patada@muaythai': patadaFrontal(G_MUAY, {root_pz:0.14, torso_x:-0.24}),   // teep: empuja con la cadera
    'patada@taekwondo': {dur:1.5, pasos:[                                      // patadas encadenadas, sin bajar
      {t:0,    p:{...G_TKD, caderaR_x:-1.50, rodillaR_x:2.30}},
      {t:0.30, p:{...G_TKD, caderaR_x:-1.35, rodillaR_x:0.10, torso_x:-0.15}},
      {t:0.60, p:{...G_TKD, caderaR_x:-1.50, rodillaR_x:2.30}},
      {t:0.82, p:{...G_TKD, caderaR_x:-0.90, rodillaR_x:1.60}},
    ]},
    'roundhouse@muaythai': patadaCircular(G_MUAY, false),                      // low kick
    'roundhouse@taekwondo': patadaCircular(G_TKD, true),                       // dollyo chagi
    'puno@muaythai': {dur:2.0, pasos:[                                         // jab–cross
      {t:0,    p:{...G_MUAY}},
      {t:0.15, p:{...G_MUAY, hombroL_x:-1.45, hombroL_z:0.05, codoL_x:-0.08, torso_y:0.30, cabeza_x:0.15}},
      {t:0.30, p:{...G_MUAY}},
      {t:0.50, p:{...G_MUAY, hombroR_x:-1.45, hombroR_z:-0.05, codoR_x:-0.08, torso_y:-0.45, root_y:-0.15}},
      {t:0.72, p:{...G_MUAY}},
    ]},

    /* ---- Técnicas que RECORREN espacio (avanzan, saltan o barren) ----
       Usan root_pz (avanzar hacia el frente) y root_py (saltar). El ciclo
       siempre vuelve a la guardia, imitando "golpeo y recupero postura". */
    blocklow: {dur:2.4, pasos:[                                          // gedan-barai: carga en la oreja contraria y barre abajo
      {t:0,    p:{...G_KARATE}},
      {t:0.25, p:{...G_KARATE, hombroR_x:-1.55, hombroR_z:0.55, codoR_x:-2.40, torso_y:0.45}},     // puño junto a la oreja izquierda
      {t:0.48, p:{...G_KARATE, hombroR_x:-0.55, hombroR_z:-0.20, codoR_x:-0.35, torso_y:0.05,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75}},       // barrido: brazo casi recto sobre la rodilla adelantada
      {t:0.70, p:{...G_KARATE, hombroR_x:-0.55, hombroR_z:-0.20, codoR_x:-0.35, torso_y:0.05,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75}},       // mantiene
      {t:0.92, p:{...G_KARATE}},
    ]},
    blockin: {dur:2.4, pasos:[                                           // uchi-uke: carga bajo la axila contraria y barre hacia fuera
      {t:0,    p:{...G_KARATE}},
      {t:0.25, p:{...G_KARATE, hombroR_x:-0.85, hombroR_z:0.60, codoR_x:-2.50, torso_y:0.10}},     // puño bajo la axila izquierda
      {t:0.48, p:{...G_KARATE, hombroR_x:-0.75, hombroR_z:-0.55, codoR_x:-1.65, torso_y:0.50,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75}},       // antebrazo vertical frente al hombro, tronco en hanmi
      {t:0.70, p:{...G_KARATE, hombroR_x:-0.75, hombroR_z:-0.55, codoR_x:-1.65, torso_y:0.50,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75}},
      {t:0.92, p:{...G_KARATE}},
    ]},
    shuto: {dur:2.6, pasos:[                                             // shuto-uke en kokutsu-dachi: peso atrás, mano de sable
      {t:0,    p:{...G_KOKUTSU, hombroL_x:-1.30, hombroL_z:0.10, codoL_x:-0.25}},                 // mano izquierda extendida al frente
      {t:0.25, p:{...G_KOKUTSU, hombroR_x:-1.60, hombroR_z:0.50, codoR_x:-2.40,
                  hombroL_x:-1.30, hombroL_z:0.10, codoL_x:-0.25, torso_y:0.20}},                 // carga: mano derecha en la oreja izquierda
      {t:0.50, p:{...G_KOKUTSU, hombroR_x:-0.95, hombroR_z:-0.35, codoR_x:-1.35,
                  hombroL_x:-0.45, hombroL_z:0.35, codoL_x:-2.10, torso_y:0.55}},                 // corte hacia fuera; la izquierda al plexo
      {t:0.74, p:{...G_KOKUTSU, hombroR_x:-0.95, hombroR_z:-0.35, codoR_x:-1.35,
                  hombroL_x:-0.45, hombroL_z:0.35, codoL_x:-2.10, torso_y:0.55}},
      {t:0.94, p:{...G_KOKUTSU, hombroL_x:-1.30, hombroL_z:0.10, codoL_x:-0.25}},
    ]},
    punchhorse: {dur:2.2, pasos:[                                        // choku-zuki alterno en kiba-dachi (piernas quietas)
      {t:0,    p:{...G_KIBA}},
      {t:0.20, p:{...G_KIBA, hombroR_x:-1.45, hombroR_z:-0.05, codoR_x:-0.10}},  // puño derecho
      {t:0.48, p:{...G_KIBA}},
      {t:0.68, p:{...G_KIBA, hombroL_x:-1.45, hombroL_z:0.05, codoL_x:-0.10}},   // puño izquierdo
      {t:0.92, p:{...G_KIBA}},
    ]},
    lungepunch: {dur:2.4, pasos:[                                        // oi-zuki: entra en zenkutsu y golpea
      {t:0,    p:{...G_KARATE}},
      {t:0.34, p:{...G_KARATE, root_pz:0.26, caderaL_x:-0.80, rodillaL_x:1.00, caderaR_x:0.55, rodillaR_x:0.10,
                  torso_y:-0.05, hombroR_x:-1.10, codoR_x:-0.60}},           // paso adelante, carga el puño
      {t:0.52, p:{...G_KARATE, root_pz:0.32, caderaL_x:-0.85, rodillaL_x:1.05, caderaR_x:0.60, rodillaR_x:0.10,
                  hombroR_x:-1.45, hombroR_z:-0.05, codoR_x:-0.08, torso_y:-0.12,
                  hombroL_x:0.40, hombroL_z:0.16, codoL_x:-1.75, cabeza_y:0}},// extensión total sobre la pierna adelantada
      {t:0.74, p:{...G_KARATE, root_pz:0.14}},                              // recoge
      {t:0.92, p:{...G_KARATE}},
    ]},
    jumpkick: {dur:2.6, pasos:[                                          // tobi mae geri: patada frontal saltando
      {t:0,    p:{...G_TKD}},
      {t:0.18, p:{...G_TKD, root_py:(G_TKD.root_py||0)-0.18, caderaL_x:-0.90, rodillaL_x:1.40,
                  caderaR_x:-0.30, rodillaR_x:0.80, torso_x:0.16}},          // se agacha para cargar
      {t:0.40, p:{...G_TKD, root_py:0.34, root_pz:0.22, caderaR_x:-1.95, rodillaR_x:0.20,
                  caderaL_x:-1.15, rodillaL_x:1.70, torso_x:-0.06,
                  hombroL_x:-0.55, hombroR_x:-0.55}},                        // en el aire: rodilla recogida y patada extendida
      {t:0.58, p:{...G_TKD, root_py:0.06, root_pz:0.16, caderaR_x:-1.15, rodillaR_x:1.80,
                  caderaL_x:-0.70, rodillaL_x:1.10}},                        // desciende y recoge
      {t:0.76, p:{...G_TKD, root_py:(G_TKD.root_py||0)-0.10, caderaL_x:-0.65, rodillaL_x:0.90, caderaR_x:0.20}},// aterriza suave
      {t:0.92, p:{...G_TKD}},
    ]},
    flyingknee: {dur:2.4, pasos:[                                        // khao loi: rodillazo saltando
      {t:0,    p:{...G_MUAY}},
      {t:0.20, p:{...G_MUAY, root_py:(G_MUAY.root_py||0)-0.16, caderaL_x:-0.55, rodillaL_x:0.75, caderaR_x:0.25}},
      {t:0.42, p:{...G_MUAY, root_py:0.34, root_pz:0.22, caderaR_x:-1.95, rodillaR_x:2.40, torso_x:-0.18,
                  caderaL_x:-0.30, rodillaL_x:0.60,
                  hombroL_x:-0.55, codoL_x:-1.30, hombroR_x:-0.55, codoR_x:-1.30}},// salta y clava la rodilla arriba
      {t:0.60, p:{...G_MUAY, root_py:0.05, root_pz:0.15, caderaR_x:-0.80, rodillaR_x:1.60}},
      {t:0.78, p:{...G_MUAY, root_py:(G_MUAY.root_py||0)-0.10}},
      {t:0.92, p:{...G_MUAY}},
    ]},
    crescent: {dur:2.6, pasos:[                                          // mikazuki geri: patada creciente (arco)
      {t:0,    p:{...G_KARATE}},
      {t:0.26, p:{...G_KARATE, caderaR_x:-1.20, caderaR_z:0.55, rodillaR_x:0.60, torso_z:-0.12}},// sube al lado exterior
      {t:0.46, p:{...G_KARATE, caderaR_x:-1.75, caderaR_z:-0.35, rodillaR_x:0.15, torso_y:0.30,
                  torso_z:0.10, root_py:(G_KARATE.root_py||0)-0.03}},         // barre en arco hacia dentro
      {t:0.64, p:{...G_KARATE, caderaR_x:-1.10, caderaR_z:-0.10, rodillaR_x:1.50}},// recoge
      {t:0.88, p:{...G_KARATE}},
    ]},
  };

  /* Nombre legible de cada movimiento (para el editor) */
  const ETIQUETAS_MOV = {
    kick:'Patada frontal · mae geri', roundhouse:'Patada circular · mawashi geri',
    sidekick:'Patada lateral · yoko geri', backkick:'Patada atrás · dwit chagi',
    axekick:'Patada de hacha · naeryo chagi', kneestrike:'Rodillazo (muay thai)',
    punch:'Puños · zuki (alternos)', punchhorse:'Puños en kiba-dachi', hook:'Ganchos (hooks)', block:'Bloqueo · age-uke',
    blocklow:'Bloqueo bajo · gedan-barai', blockin:'Bloqueo interior · uchi-uke', shuto:'Shuto-uke en kokutsu-dachi',
    elbow:'Codazo · sok', sword:'Corte de sable · men',
    'patada@muaythai':'Teep (patada de empuje)', 'patada@taekwondo':'Patadas rápidas (TKD)',
    'roundhouse@muaythai':'Low kick', 'roundhouse@taekwondo':'Dollyo chagi',
    'puno@muaythai':'Jab–cross',
    lungepunch:'Puño avanzando · oi-zuki', jumpkick:'Patada con salto · twio ap chagi',
    flyingknee:'Rodillazo saltando · khao loi', crescent:'Patada creciente · mikazuki geri',
  };

  /* ---- Capa de personalización: overrides guardados en el navegador ---- */
  const LS_MOV = 'dojo_mov_v1';
  const clonMov = m => ({dur:m.dur, pasos:m.pasos.map(p=>({t:p.t, p:Object.assign({},p.p)}))});
  function leerOverrides(){ try{ return JSON.parse(localStorage.getItem(LS_MOV))||{}; }catch(e){ return {}; } }
  function escribirOverrides(o){ try{ localStorage.setItem(LS_MOV, JSON.stringify(o)); }catch(e){} }
  const MOV = {};                                    // efectivo = base o tu versión guardada
  function reconstruirMOV(){
    const ov = leerOverrides();
    for(const k in MOV_BASE) MOV[k] = ov[k] ? clonMov(ov[k]) : clonMov(MOV_BASE[k]);
  }
  reconstruirMOV();

  function animadorMov(key){
    const fn = (j,t)=>{
      const pasos = MOV[key].pasos;
      let i=pasos.length-1; while(i>0 && t<pasos[i].t) i--;
      const a=pasos[i], b=pasos[(i+1)%pasos.length];
      const fin=(i===pasos.length-1) ? 1 : b.t;              // el último tramo vuelve al inicio
      mezclarPose(j, a.p, b.p, suave(clamp01((t-a.t)/((fin-a.t)||1))));
    };
    Object.defineProperty(fn,'dur',{get:()=>MOV[key].dur});
    fn.movKey = key;
    return fn;
  }

  Object.assign(ANIM, {
    kick: animadorMov('kick'), roundhouse: animadorMov('roundhouse'),
    sidekick: animadorMov('sidekick'), backkick: animadorMov('backkick'),
    axekick: animadorMov('axekick'), kneestrike: animadorMov('kneestrike'),
    punch: animadorMov('punch'), punchhorse: animadorMov('punchhorse'), hook: animadorMov('hook'),
    block: animadorMov('block'), blocklow: animadorMov('blocklow'), blockin: animadorMov('blockin'), shuto: animadorMov('shuto'),
    elbow: animadorMov('elbow'), sword: animadorMov('sword'),
    lungepunch: animadorMov('lungepunch'), jumpkick: animadorMov('jumpkick'),
    flyingknee: animadorMov('flyingknee'), crescent: animadorMov('crescent'),
    guardia(j,t){ mezclarPose(j, G_KARATE, G_KARATE, 0); const s=pulso(t); // zenkutsu-dachi mantenido: respira, no se mueve
      j.root.position.y += 0.008*s; j.torso.rotation.x += 0.015*s; },
    kamae(j,t){ mezclarPose(j, G_KEN, G_KEN, 0); const s=pulso(t);       // guardia viva: respira y flota
      j.root.position.y += 0.012*s; j.torso.rotation.x += 0.02*s; j.root.position.z = 0.12*sin(t); },
    balance(j,t){ mezclarPose(j, POSE_GRULLA, POSE_GRULLA, 0);            // grulla: rodilla alta, brazos en cruz
      const s=pulso(t); j.root.rotation.z = 0.025*s; j.hombroL.rotation.z += 0.05*s; j.hombroR.rotation.z -= 0.05*s; },
  });
  const POSE_GRULLA = {
    root_py:-0.03, caderaR_x:-1.55, rodillaR_x:2.20, rodillaL_x:0.12,
    hombroL_z:1.35, hombroR_z:-1.35, codoL_x:-0.25, codoR_x:-0.25, cabeza_x:-0.05,
  };
  /* Variantes por arte (resolverAnim busca 'arquetipo@arte' primero) */
  const ANIM_ARTE = {
    'patada@muaythai': animadorMov('patada@muaythai'),
    'patada@taekwondo': animadorMov('patada@taekwondo'),
    'roundhouse@muaythai': animadorMov('roundhouse@muaythai'),
    'roundhouse@taekwondo': animadorMov('roundhouse@taekwondo'),
    'puno@muaythai': animadorMov('puno@muaythai'),
  };

  /* ---- API del editor de movimientos ----
     Grupos de articulaciones que el editor muestra como deslizadores.
     Clave interna = 'articulacion_eje' (x/y/z rotan; py/pz trasladan root). */
  const GRUPOS_EDITOR = [
    {g:'Tronco y cuerpo', items:[['root_py','Altura (subir/bajar)'],['root_pz','Adelante / atrás'],['root_y','Giro del cuerpo'],
       ['torso_x','Torso: inclina al frente'],['torso_y','Torso: gira'],['torso_z','Torso: inclina al lado'],
       ['cabeza_x','Cabeza: baja/sube'],['cabeza_y','Cabeza: gira']]},
    {g:'Pierna que golpea (derecha)', items:[['caderaR_x','Cadera: sube la pierna'],['caderaR_z','Cadera: abre al lado'],['rodillaR_x','Rodilla: dobla']]},
    {g:'Pierna de apoyo (izquierda)', items:[['caderaL_x','Cadera: sube la pierna'],['caderaL_z','Cadera: abre al lado'],['rodillaL_x','Rodilla: dobla']]},
    {g:'Brazo derecho', items:[['hombroR_x','Hombro: sube al frente'],['hombroR_z','Hombro: abre'],['codoR_x','Codo: dobla']]},
    {g:'Brazo izquierdo', items:[['hombroL_x','Hombro: sube al frente'],['hombroL_z','Hombro: abre'],['codoL_x','Codo: dobla']]},
  ];
  let edicionKey = null, respaldoEdicion = null;   // respaldo = estado comprometido (guardado)

  function claveEditable(arq, arte){
    const fn = resolverAnim(arq, arte);     // arquetipo → animador; los editables llevan .movKey
    return (fn && fn.movKey && MOV[fn.movKey]) ? fn.movKey : null;
  }
  function editarInfo(arq, arte){
    const key = claveEditable(arq, arte); if(!key) return null;
    edicionKey = key;
    respaldoEdicion = clonMov(MOV[key]);          // a lo que se vuelve si cierras sin guardar
    return { key, etiqueta: ETIQUETAS_MOV[key]||key,
             fotogramas: MOV[key].pasos.map(p=>p.t),
             grupos: GRUPOS_EDITOR, rangos: RANGOS_EDITOR,   // rangos anatómicos (AAOS) por articulación
             modificado: !!leerOverrides()[key] };
  }
  function valorPose(kf, joint){
    if(edicionKey==null || !MOV[edicionKey].pasos[kf]) return 0;
    const v = MOV[edicionKey].pasos[kf].p[joint];
    return v===undefined ? 0 : v;
  }
  function setValorPose(kf, joint, v){
    if(edicionKey==null || !MOV[edicionKey].pasos[kf]) return;
    const p = MOV[edicionKey].pasos[kf].p;
    if(Math.abs(v)<0.004) delete p[joint]; else p[joint]=v;
  }
  function congelarEnFotograma(kf){
    if(edicionKey==null || !MOV[edicionKey].pasos[kf]) return;
    congelaT = MOV[edicionKey].pasos[kf].t + 0.0001;   // muestra exactamente esa pose
  }
  function reproducirPreview(){ congelaT = null; }
  function guardarEdicion(){
    if(edicionKey==null) return false;
    const ov = leerOverrides(); ov[edicionKey] = clonMov(MOV[edicionKey]); escribirOverrides(ov);
    respaldoEdicion = clonMov(MOV[edicionKey]);    // comprometido: ya no se revierte al cerrar
    return true;
  }
  function restablecerEdicion(){
    if(edicionKey==null) return false;
    const ov = leerOverrides(); delete ov[edicionKey]; escribirOverrides(ov);
    MOV[edicionKey] = clonMov(MOV_BASE[edicionKey]);
    respaldoEdicion = clonMov(MOV[edicionKey]);
    return true;
  }
  function finEdicion(){                            // descarta cambios NO guardados
    if(edicionKey!=null && respaldoEdicion) MOV[edicionKey] = respaldoEdicion;
    edicionKey = null; respaldoEdicion = null; congelaT = null;
  }

  /* Coloca al personaje en una orientación de suelo. Las alturas están medidas
     para que el cuerpo APOYE en el tatami (grosor del cuerpo ≈ 0.16 m), no flote.
       arriba: boca arriba · lado: de costado · sentado: sentado con el tronco atrás
       cuadrupedia: a cuatro apoyos (manos y rodillas en el suelo)
       prono(inc, y): boca abajo con la cabeza hacia el fondo; inc = inclinación del
       cuerpo (0 = tumbado; ~0.37 = plancha con brazos rectos), y = altura del pivote
       de los pies. Los brazos verticales salen con hombro_x = -(π/2 - inc).           */
  function acostado(j, modo){
    if(modo==='arriba'){  j.root.rotation.x=-Math.PI/2; j.root.position.set(0,0.17,0.55); }
    else if(modo==='abajo'){ prono(j, 0, 0.16); }
    else if(modo==='lado'){ j.root.rotation.x=-Math.PI/2; j.root.rotation.y=Math.PI/2; j.root.position.set(0,0.27,0.4); }
    else if(modo==='cuadrupedia'){ j.root.rotation.x=Math.PI/2; j.root.rotation.z=Math.PI; j.root.position.set(0,0.58,0.2);
      j.hombroL.rotation.x=-1.6; j.hombroR.rotation.x=-1.6;              // brazos verticales, manos en el suelo
      j.caderaL.rotation.x=-1.6; j.caderaR.rotation.x=-1.6;              // muslos verticales (flexión de cadera = hacia el suelo)
      j.rodillaL.rotation.x=1.5; j.rodillaR.rotation.x=1.5;              // espinillas apoyadas hacia atrás
      j.cabeza.rotation.x=-0.5; }
    else if(modo==='sentado'){ j.root.position.set(0,-0.64,0.3); j.root.rotation.x=-0.35; }
  }
  function prono(j, inc, y){
    j.root.rotation.x=Math.PI/2+inc; j.root.rotation.z=Math.PI; j.root.position.set(0, y, 0.7);
    j.cabeza.rotation.x=-0.55;                         // mira al frente, no al suelo
  }
  const brazoVertical = inc => -(Math.PI/2 - inc);   // hombro_x para que el brazo caiga vertical en prono

  /* Cada arquetipo de ejercicio → su propia animación */
  const ANIM_ARQ = {
    trote:ANIM.run, rodillas:ANIM.highknees, talones:ANIM.buttkicks, jumping:ANIM.jump, burpee:ANIM.burpee,
    mov_brazos:ANIM.armcircle, circulo_cadera:ANIM.hipcircle, gato:ANIM.catcamel, balanceo:ANIM.legswing, movilidad:ANIM.stretch,
    sentadilla:ANIM.squat, sumo:ANIM.sumo, zancada:ANIM.lunge, postura:ANIM.horse,
    jumpsquat:ANIM.jumpsquat, sidelunge:ANIM.sidelunge, skater:ANIM.skater,
    puente:ANIM.bridge, abduccion:ANIM.sideleg, gemelos:ANIM.calf,
    plancha:ANIM.plank, plancha_lateral:ANIM.sideplank,
    flexion:ANIM.pushup, fondo:ANIM.dips, pike:ANIM.pikepush,
    curl:ANIM.arms, remo:ANIM.row, press:ANIM.press, elevacion:ANIM.lateralraise,
    abdominal:ANIM.crunch, bicicleta:ANIM.bicycle, escalador:ANIM.mountain,
    legraise:ANIM.legraise, twist:ANIM.twist, superman:ANIM.superman, birddog:ANIM.birddog,
    patada:ANIM.kick, patada_lateral:ANIM.sidekick, patada_atras:ANIM.backkick, patada_hacha:ANIM.axekick,
    roundhouse:ANIM.roundhouse, rodillazo:ANIM.kneestrike,
    avance_puno:ANIM.lungepunch, patada_salto:ANIM.jumpkick, rodillazo_salto:ANIM.flyingknee, creciente:ANIM.crescent,
    zancada_andando:ANIM.walklunge, desplazamiento:ANIM.sidestep,
    puno:ANIM.punch, puno_kiba:ANIM.punchhorse, guardia_karate:ANIM.guardia, gancho:ANIM.hook, codo:ANIM.elbow,
    bloqueo:ANIM.block, bloqueo_bajo:ANIM.blocklow, bloqueo_interior:ANIM.blockin, shuto:ANIM.shuto,
    espada:ANIM.sword, kamae:ANIM.kamae, equilibrio:ANIM.balance, grulla:ANIM.balance,
    estiramiento:ANIM.stretch, cuello:ANIM.cuello, cuadriceps:ANIM.cuadriceps, isquios:ANIM.isquios, hombros:ANIM.hombros,
    respiracion:ANIM.breathe, meditacion:ANIM.meditar, soltar:ANIM.soltar,
  };

  function resolverAnim(arquetipo, arte){
    return (arte && ANIM_ARTE[arquetipo+'@'+arte]) || ANIM_ARQ[arquetipo] || ANIM.breathe;
  }

  /* ---------------- Personaje con modelo .glb ----------------
     Carga el modelo y, cada cuadro, orienta sus huesos para que
     "copien" la pose del motor procedural (rig). Reusa las 67
     animaciones sin re-hacerlas para el nuevo esqueleto.            */
  // Articulaciones que el motor necesita orientar, y el hueso "hijo" del que sale su dirección de reposo
  const CANON = ['Back','Head','UpperarmLeft','ForearmLeft','HandLeft','UpperarmRight','ForearmRight','HandRight',
                 'ThighLeft','ShinLeft','FootLeft','ThighRight','ShinRight','FootRight'];
  const ESENCIALES = ['Back','Head','UpperarmLeft','UpperarmRight','ThighLeft','ThighRight'];
  const HIJO = {UpperarmLeft:'ForearmLeft',ForearmLeft:'HandLeft',ThighLeft:'ShinLeft',ShinLeft:'FootLeft',
                UpperarmRight:'ForearmRight',ForearmRight:'HandRight',ThighRight:'ShinRight',ShinRight:'FootRight',Back:'Head'};

  /* Clasifica un hueso a la convención del motor a partir de su nombre.
     Acepta Blender (Upperarm.Right / Upperarm.R), Mixamo (mixamorig:RightArm), Quaternius, etc.
     OJO: three.js SANEA los nombres al cargar y borra puntos/corchetes, así que un
     "Upperarm.R" de Blender llega como "UpperarmR" — por eso también detectamos una
     L/R final pegada a una letra (patrón .L/.R saneado). */
  function clasificar(raw){
    const orig = String(raw||'');
    const s = orig.toLowerCase();
    if(/head/.test(s)) return 'Head';
    if(/spine|chest|thorax|torso|(^|[^a-z])back([^a-z]|$)/.test(s)) return 'Back';
    let izq = /left/.test(s) || /(^|[._\- ])l([._\- ]|$)/.test(s);
    let der = /right/.test(s) || /(^|[._\- ])r([._\- ]|$)/.test(s);
    if(!izq && !der){                                        // ".L/.R" de Blender ya saneado → "…L"/"…R"
      if(/[a-z]L$/.test(orig)) izq = true;
      else if(/[a-z]R$/.test(orig)) der = true;
    }
    const lado = izq ? 'Left' : der ? 'Right' : '';
    if(!lado) return null;                                   // las extremidades necesitan lado
    let role;
    if(/hand|wrist/.test(s))                    role='Hand';
    else if(/foot|ankle/.test(s))               role='Foot';
    else if(/forearm|lowerarm|foarm/.test(s))   role='Forearm';
    else if(/thigh|upleg|upperleg/.test(s))     role='Thigh';
    else if(/shin|calf|lowerleg/.test(s))       role='Shin';
    else if(/arm/.test(s))                      role='Upperarm';   // tras descartar "forearm"
    else if(/leg/.test(s))                      role='Shin';       // Mixamo: "LeftLeg" es la espinilla
    else return null;
    return role + lado;
  }
  // Ante varias columnas (Spine, Spine1, Spine2…) elige la más cercana al pecho
  function puntajeBack(s){
    if(/chest|thorax/.test(s)) return 100;
    const m = s.match(/spine\D*(\d+)/); if(m) return 10 + parseInt(m[1],10);
    if(/spine/.test(s)) return 10;
    return 5;
  }
  function mapearHuesos(crudos){
    const out={}, sc={};
    for(const b of crudos){
      const c = clasificar(b.name); if(!c) continue;
      if(c==='Back'){ const s=puntajeBack(b.name.toLowerCase()); if(!(c in out)||s>sc[c]){ out[c]=b; sc[c]=s; } }
      else if(!(c in out)) out[c]=b;                         // el primero que aparece gana
    }
    return out;
  }
  // Dirección de reposo de una articulación = hacia su hueso hijo real (según el propio esqueleto)
  function dirReposo(bone, hijoCanon, bones){
    let hijo = null;
    if(hijoCanon && bones[hijoCanon] && bones[hijoCanon].parent===bone) hijo = bones[hijoCanon];
    if(!hijo) hijo = bone.children.find(c=>c.isBone) || null;
    if(hijo){ const v=hijo.position.clone(); if(v.lengthSq()>1e-8) return v.normalize(); }
    return new THREE.Vector3(0,1,0);
  }
  function base64ABuffer(b64){
    const bin=atob(b64), n=bin.length, u=new Uint8Array(n);
    for(let i=0;i<n;i++) u[i]=bin.charCodeAt(i);
    return u.buffer;
  }
  function cargarGLB(archivo, color, giroY){
    if(typeof THREE.GLTFLoader==='undefined'){ rig.visible=true; return; }
    const giroQuat = giroY ? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), giroY) : null;
    const loader=new THREE.GLTFLoader();
    const alError=function(e){ console.warn('GLB:',e); rig.visible=true; };
    const alCargar=function(g){
      const cont=new THREE.Group(); const obj=g.scene;
      cont.add(obj); scene.add(cont); obj.updateWorldMatrix(true,true);
      // normalizar tamaño (~1.7 m) y apoyar los pies en el suelo
      let box=new THREE.Box3().setFromObject(obj); const size=box.getSize(new THREE.Vector3());
      const esc=1.7/(size.y||1); obj.scale.setScalar(esc); obj.updateWorldMatrix(true,true);
      box=new THREE.Box3().setFromObject(obj);
      obj.position.y -= box.min.y;
      obj.position.x -= (box.min.x+box.max.x)/2;
      obj.position.z -= (box.min.z+box.max.z)/2;
      const crudos=[]; let malla=null;
      obj.traverse(o=>{
        if(o.isBone) crudos.push(o);
        if(o.isSkinnedMesh) malla=o;
        if(o.isMesh){
          o.frustumCulled=false; o.castShadow=true; o.receiveShadow=false;
          // conservar el material del glTF (mantiene skinning); solo tintamos si se pidió un color
          const mats=Array.isArray(o.material)?o.material:[o.material];
          mats.forEach(m=>{ if(m){ if(color!=null && m.color) m.color.setHex(color); m.skinning=true; m.needsUpdate=true; } });
        }
      });
      // Clasifica los huesos a la convención del motor (acepta Mixamo, Quaternius, Blender…)
      const bones=mapearHuesos(crudos);
      const rest={};
      for(const c of CANON){ if(bones[c]) rest[c]=dirReposo(bones[c], HIJO[c], bones); }
      // ¿Están los huesos imprescindibles? Si no, no arriesgamos un modelo congelado: volvemos al procedural.
      const faltan = ESENCIALES.filter(b=>!bones[b]);
      if(faltan.length){
        console.warn('GLB '+archivo+': esqueleto no compatible, faltan', faltan.join(', '),
                     '— uso el personaje procedural. (Huesos hallados:', Object.keys(bones).join(', ')||'ninguno', ')');
        scene.remove(cont); rig.visible=true; return;
      }
      glbActivo={root:cont,obj,bones,rest,malla,giro:giroQuat};
      rig.visible=false;
    };
    const data = window.MODELOS_GLB && window.MODELOS_GLB[archivo];
    if(data) loader.parse(base64ABuffer(data), '', alCargar, alError);   // incrustado (funciona en file://)
    else loader.load(archivo, alCargar, undefined, alError);             // respaldo: cargar el archivo
  }

  const _v=()=>new THREE.Vector3(); const _q=new THREE.Quaternion();
  function apuntar(bone, restDir, dirWorld){
    if(!bone||!restDir||dirWorld.lengthSq()<1e-8) return;
    bone.parent.getWorldQuaternion(_q); _q.invert();
    const tl=dirWorld.normalize().applyQuaternion(_q).normalize();
    bone.quaternion.setFromUnitVectors(restDir, tl);
  }
  function retarget(){
    const j=rig.userData.j, B=glbActivo.bones, R=glbActivo.rest;
    glbActivo.root.position.copy(rig.position);       // sigue al motor (incluye tumbarse/saltar)
    glbActivo.root.quaternion.copy(rig.quaternion);
    if(glbActivo.giro) glbActivo.root.quaternion.multiply(glbActivo.giro);   // corrige orientación si hace falta
    glbActivo.root.updateMatrixWorld(true);
    const shL=j.hombroL.getWorldPosition(_v()), shR=j.hombroR.getWorldPosition(_v());
    const elL=j.codoL.getWorldPosition(_v()),   elR=j.codoR.getWorldPosition(_v());
    const haL=j.codoL.localToWorld(_v().set(0,-0.29,0)), haR=j.codoR.localToWorld(_v().set(0,-0.29,0));
    const hpL=j.caderaL.getWorldPosition(_v()), hpR=j.caderaR.getWorldPosition(_v());
    const knL=j.rodillaL.getWorldPosition(_v()), knR=j.rodillaR.getWorldPosition(_v());
    const ftL=j.rodillaL.localToWorld(_v().set(0,-0.45,0)), ftR=j.rodillaR.localToWorld(_v().set(0,-0.45,0));
    const pel=j.pelvis.getWorldPosition(_v()), nec=j.cuello.getWorldPosition(_v()), hea=j.cabeza.localToWorld(_v().set(0,0.2,0));
    apuntar(B['Back'], R['Back'], nec.clone().sub(pel));
    apuntar(B['UpperarmLeft'], R['UpperarmLeft'], elL.clone().sub(shL));
    apuntar(B['ForearmLeft'],  R['ForearmLeft'],  haL.clone().sub(elL));
    apuntar(B['UpperarmRight'],R['UpperarmRight'],elR.clone().sub(shR));
    apuntar(B['ForearmRight'], R['ForearmRight'], haR.clone().sub(elR));
    apuntar(B['ThighLeft'],    R['ThighLeft'],    knL.clone().sub(hpL));
    apuntar(B['ShinLeft'],     R['ShinLeft'],     ftL.clone().sub(knL));
    apuntar(B['ThighRight'],   R['ThighRight'],   knR.clone().sub(hpR));
    apuntar(B['ShinRight'],    R['ShinRight'],    ftR.clone().sub(knR));
    apuntar(B['Head'], R['Head'], hea.clone().sub(nec));
    glbActivo.obj.updateMatrixWorld(true);            // refresca matrices de los huesos
    if(glbActivo.malla) glbActivo.malla.skeleton.update();  // y deforma la malla
  }

  /* ---------------- Entorno: el dojo ----------------
     Se construye UNA vez; cada ambiente decide qué partes se ven
     (paredes, cielo, linternas, haces de luz) y con qué luz.     */
  let suelo, luzDir, luzHemi, luzAmb, sombra;
  const E = {};                     // piezas del entorno: E.sala, E.cielo, E.haces, E.polvo, E.linternas, E.jardin
  let matSuelos = {};

  function madera(color){ return mat(color||0x4a2f1c, {roughness:0.7, metalness:0.05}); }
  function construirEntorno(){
    // suelos intercambiables (misma malla, distinto material)
    matSuelos = {
      madera: new THREE.MeshStandardMaterial({map:texturaDe(texMadera(), 7, 7), roughness:0.55, metalness:0.08}),
      tatami: new THREE.MeshStandardMaterial({map:texturaDe(texTatami(), 11, 11), roughness:0.95}),
      grava:  new THREE.MeshStandardMaterial({map:texturaDe(texGrava(), 14, 14), roughness:1}),
      liso:   new THREE.MeshStandardMaterial({color:lin(0xb7bbb5), roughness:1}),
    };
    suelo = new THREE.Mesh(new THREE.PlaneGeometry(60,60), matSuelos.madera);
    suelo.rotation.x = -Math.PI/2; suelo.receiveShadow=true; scene.add(suelo);

    /* --- Sala: paredes bajas de madera, shoji encima, pilares, vigas, techo, kamiza --- */
    const sala = new THREE.Group(); scene.add(sala); E.sala=sala;
    const mOscura = madera(0x2e1c10), mPilar = madera(0x3d2716), mZocalo = madera(0x4b3120);
    const texSh = texturaDe(texShoji(),1,1);
    E.matShoji = new THREE.MeshStandardMaterial({map:texSh, emissiveMap:texSh, emissive:lin(0xf7eedb), emissiveIntensity:0.5, roughness:1});
    const ANCHO=8.4, FONDO=-3.4, LADO=4.2, ALTO=2.75, ZOC=0.72;
    function panelShoji(x,y,z,w,h,rotY){
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), E.matShoji); m.position.set(x,y,z); m.rotation.y=rotY||0; sala.add(m); return m;
    }
    function zocalo(x,y,z,w,h,d){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mZocalo); m.position.set(x,y,z); m.receiveShadow=true; sala.add(m); return m; }
    function pilar(x,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.24,ALTO,0.24), mPilar); m.position.set(x,ALTO/2,z); m.castShadow=true; m.receiveShadow=true; sala.add(m); return m; }
    function viga(x,y,z,w,h,d){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mOscura); m.position.set(x,y,z); m.castShadow=true; sala.add(m); return m; }
    // pared del fondo: 2 shoji · kamiza · 2 shoji
    const cortes=[-ANCHO/2,-2.7,-0.95,0.95,2.7,ANCHO/2];
    for(let i=0;i<cortes.length-1;i++){
      const a=cortes[i], b=cortes[i+1], w=b-a, cx=(a+b)/2;
      zocalo(cx, ZOC/2, FONDO, w, ZOC, 0.12);
      if(i===2){                                                             // kamiza: tablero de madera con el kakejiku
        const tab=new THREE.Mesh(new THREE.BoxGeometry(w,ALTO-ZOC,0.10), madera(0x5a3a22)); tab.position.set(cx,ZOC+(ALTO-ZOC)/2,FONDO); tab.receiveShadow=true; sala.add(tab);
        const kk=new THREE.Mesh(new THREE.PlaneGeometry(0.62,1.55), new THREE.MeshStandardMaterial({map:texturaDe(texKakejiku('道'),1,1), roughness:0.9}));
        kk.position.set(cx,1.62,FONDO+0.07); sala.add(kk);
        const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.74,10), mOscura); rod.rotation.z=Math.PI/2; rod.position.set(cx,2.41,FONDO+0.09); sala.add(rod);
        const rod2=rod.clone(); rod2.position.y=0.83; sala.add(rod2);
        // repisa con un pequeño cuenco y una vela (kamidana sencilla)
        viga(cx, 0.78, FONDO+0.16, 0.9, 0.05, 0.28);
        const cuenco=new THREE.Mesh(new THREE.SphereGeometry(0.07,16,10,0,TAU,Math.PI*0.5,Math.PI*0.5), mat(0x2c2a2e,{roughness:0.4})); cuenco.scale.y=-1; cuenco.position.set(cx-0.22,0.805,FONDO+0.16); sala.add(cuenco);
        const vela=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.12,8), mat(0xf1e6cf)); vela.position.set(cx+0.22,0.865,FONDO+0.16); sala.add(vela);
        E.vela = new THREE.PointLight(0xffb060, 0.0, 2.5, 2); E.vela.position.set(cx+0.22,0.98,FONDO+0.16); sala.add(E.vela);
      } else {
        panelShoji(cx, ZOC+(ALTO-ZOC)/2, FONDO+0.005, w-0.02, ALTO-ZOC);
      }
      pilar(a, FONDO);
    }
    pilar(ANCHO/2, FONDO);
    // paredes laterales (miran hacia dentro)
    for(const s of [-1,1]){
      const zs=[FONDO, -1.2, 1.1, 3.4];
      for(let i=0;i<zs.length-1;i++){
        const a=zs[i], b=zs[i+1], d=b-a, cz=(a+b)/2;
        zocalo(s*LADO, ZOC/2, cz, 0.12, ZOC, d);
        panelShoji(s*LADO-s*0.005, ZOC+(ALTO-ZOC)/2, cz, d-0.02, ALTO-ZOC, -s*Math.PI/2);
        if(i>0) pilar(s*LADO, a);
      }
      pilar(s*LADO, 3.4);
    }
    // vigas (nageshi) y techo
    viga(0, ALTO-0.06, FONDO, ANCHO+0.3, 0.16, 0.30);
    for(const s of [-1,1]) viga(s*LADO, ALTO-0.06, 0, 0.30, 0.16, 6.9);
    for(let z=-2.4; z<=3.0; z+=1.35) viga(0, ALTO+0.06, z, ANCHO, 0.14, 0.14);
    const techo=new THREE.Mesh(new THREE.PlaneGeometry(ANCHO+0.4, 7.2), madera(0x20140c)); techo.rotation.x=Math.PI/2; techo.position.set(0,ALTO+0.14,0); sala.add(techo);
    // estante de bokken junto a la pared izquierda
    const soporte=new THREE.Group(); soporte.position.set(-3.1,0,-2.9); sala.add(soporte);
    [-0.35,0.35].forEach(x=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.55,0.05), mOscura); p.position.set(x,0.275,0); p.castShadow=true; soporte.add(p); });
    [0.32,0.48].forEach(y=>{ const bk=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.017,1.05,8), madera(0x8a5a2e)); bk.rotation.z=Math.PI/2; bk.position.set(0,y,0.03); bk.castShadow=true; soporte.add(bk); });
    // linternas de papel colgando de la viga frontal
    E.linternas=[];
    const matLint = new THREE.MeshStandardMaterial({color:lin(0xf3e4c4), emissive:lin(0xffb070), emissiveIntensity:0.0, roughness:1});
    [[-2.4,2.9],[2.4,2.9]].forEach(([x,z])=>{
      const g=new THREE.Group(); g.position.set(x,ALTO-0.28,z); sala.add(g);
      const hilo=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.30,6), mOscura); hilo.position.y=0.15; g.add(hilo);
      const cuerpo=new THREE.Mesh(new THREE.SphereGeometry(0.19,18,14), matLint); cuerpo.scale.set(1,1.25,1); cuerpo.position.y=-0.12; g.add(cuerpo);
      [0.11,-0.35].forEach(y=>{ const tapa=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.04,14), mOscura); tapa.position.y=y; g.add(tapa); });
      const pl=new THREE.PointLight(lin(0xffb268), 0, 5.5, 2); pl.position.y=-0.12; g.add(pl);
      E.linternas.push({luz:pl, mat:matLint, fase:x});
    });

    /* --- Haces de luz entrando por los shoji de la derecha + polvo en suspensión --- */
    const haces=new THREE.Group(); scene.add(haces); E.haces=haces;
    const matHaz=new THREE.MeshBasicMaterial({map:texturaDe(texHaz(),1,1), transparent:true, opacity:0.10, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
    for(let i=0;i<4;i++){
      const h=new THREE.Mesh(new THREE.PlaneGeometry(0.55+i*0.15, 5.2), matHaz);
      h.position.set(2.3-i*0.55, 1.9, -1.6+i*0.9); h.rotation.set(0,0.35,-0.62); haces.add(h);
    }
    const N=260, pos=new Float32Array(N*3); E.polvoVel=new Float32Array(N);
    for(let i=0;i<N;i++){ pos[i*3]=(aleatorio()-0.5)*7; pos[i*3+1]=aleatorio()*2.6; pos[i*3+2]=(aleatorio()-0.5)*6; E.polvoVel[i]=0.02+aleatorio()*0.05; }
    const geoP=new THREE.BufferGeometry(); geoP.setAttribute('position', new THREE.BufferAttribute(pos,3));
    E.polvo=new THREE.Points(geoP, new THREE.PointsMaterial({size:0.045, map:new THREE.CanvasTexture(texPolvo()), transparent:true, opacity:0.55, depthWrite:false, blending:THREE.AdditiveBlending, color:0xffe6c0}));
    scene.add(E.polvo);

    /* --- Exterior: cúpula de cielo, piedras y bambú (jardín zen) --- */
    E.cielo=new THREE.Mesh(new THREE.SphereGeometry(45,24,16), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(texCielo()), side:THREE.BackSide, fog:false}));
    E.cielo.material.map.encoding=THREE.sRGBEncoding; scene.add(E.cielo);
    const jardin=new THREE.Group(); scene.add(jardin); E.jardin=jardin;
    const mPiedra=mat(0x5d5f60,{roughness:0.85});
    [[-2.2,-2.6,0.55,0.38],[2.6,-3.0,0.42,0.30],[3.1,-1.4,0.28,0.22],[-3.4,-0.8,0.32,0.20]].forEach(([x,z,r,h])=>{
      const pd=new THREE.Mesh(new THREE.SphereGeometry(r,16,12), mPiedra); pd.scale.set(1,h/r,0.8); pd.position.set(x,h*0.55,z); pd.castShadow=true; pd.receiveShadow=true; jardin.add(pd);
    });
    const mBambu=mat(0x7f9a4a,{roughness:0.6});
    for(let i=0;i<22;i++){
      const x=-6+aleatorio()*12, z=-5.5-aleatorio()*2.5, h=3.2+aleatorio()*1.8;
      const b=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.045,h,8), mBambu); b.position.set(x,h/2,z); b.rotation.z=(aleatorio()-0.5)*0.08; b.castShadow=true; jardin.add(b);
      for(let y=0.5;y<h;y+=0.6){ const nudo=new THREE.Mesh(new THREE.TorusGeometry(0.045,0.008,6,10), mat(0x5c7334)); nudo.rotation.x=Math.PI/2; nudo.position.set(x,y,z); jardin.add(nudo); }
    }
    // muro bajo del jardín, al fondo
    const muro=new THREE.Mesh(new THREE.BoxGeometry(14,1.1,0.3), mat(0xd8d2c4,{roughness:1})); muro.position.set(0,0.55,-5.2); muro.receiveShadow=true; muro.castShadow=true; jardin.add(muro);
    const teja=new THREE.Mesh(new THREE.BoxGeometry(14.3,0.12,0.5), mat(0x2f3338,{roughness:0.8})); teja.position.set(0,1.15,-5.2); jardin.add(teja);
    // farol de piedra (tōrō)
    const toro=new THREE.Group(); toro.position.set(2.9,0,-3.9); jardin.add(toro);
    [[0.34,0.18,0.09],[0.14,0.7,0.44],[0.30,0.20,0.98],[0.22,0.32,1.24],[0.42,0.14,1.47],[0.12,0.16,1.62]].forEach(([r,h,y])=>{
      const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.05,h,8), mPiedra); s.position.y=y; s.castShadow=true; toro.add(s);
    });
  }

  function aplicarFondo(f){
    scene.background = lin(f.bg);
    scene.fog = new THREE.Fog(lin(f.niebla[0]), f.niebla[1], f.niebla[2]);
    suelo.material = matSuelos[f.suelo] || matSuelos.liso;
    luzDir.color.copy(lin(f.luz[0])); luzDir.intensity=f.luz[1]; luzDir.position.set(f.luz[2][0],f.luz[2][1],f.luz[2][2]);
    luzHemi.color.copy(lin(f.hemi[0])); luzHemi.groundColor.copy(lin(f.hemi[1])); luzHemi.intensity=f.hemi[2];
    luzAmb.intensity=f.amb;
    BORDE.value = f.borde!=null ? f.borde : 1;             // brillo de contorno del personaje según la luz
    renderer.toneMappingExposure = f.exp||1;
    E.sala.visible = !!f.paredes;
    E.cielo.visible = !!f.cielo;
    E.jardin.visible = !!f.cielo;
    E.haces.visible = !!f.haces;
    E.polvo.visible = !!f.paredes;
    E.matShoji.emissive.copy(lin(f.shoji[0])); E.matShoji.emissiveIntensity=f.shoji[1]; E.matShoji.color.copy(lin(f.shoji[0]));
    E.linternas.forEach(l=>{ l.luz.intensity = f.linternas?0.6:0; l.mat.emissiveIntensity = f.linternas?1.1:0.0; });
    if(E.vela) E.vela.intensity = f.linternas?0.6:0;
    sombra.material.opacity = f.cielo?0.10:0.16;
  }

  function init(cont){
    if(listo){ contenedor=cont; cont.appendChild(renderer.domElement); resize(); return; }
    contenedor = cont;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
    camera.position.set(1.25,1.05,4.7); camera.lookAt(0,0.78,0);

    renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    cont.appendChild(renderer.domElement);
    activarArrastre(renderer.domElement);   // giro con el dedo/ratón cuando el visor es libre

    luzHemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); scene.add(luzHemi);
    luzDir = new THREE.DirectionalLight(0xffffff, 1.0); luzDir.position.set(3.6,4.4,2.6);
    luzDir.castShadow=true; luzDir.shadow.mapSize.set(2048,2048);
    luzDir.shadow.camera.near=0.5; luzDir.shadow.camera.far=16;
    luzDir.shadow.camera.left=-4.5; luzDir.shadow.camera.right=4.5; luzDir.shadow.camera.top=4.5; luzDir.shadow.camera.bottom=-4.5;
    luzDir.shadow.bias=-0.0008; luzDir.shadow.normalBias=0.02; scene.add(luzDir);
    luzAmb = new THREE.AmbientLight(0xffffff,0.15); scene.add(luzAmb);
    const relleno = new THREE.DirectionalLight(0x9fb4d8, 0.22); relleno.position.set(-3,2,4); scene.add(relleno);   // relleno frío frontal

    construirEntorno();
    sombra = new THREE.Mesh(new THREE.CircleGeometry(0.42,28),
      new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.16, depthWrite:false}));
    sombra.rotation.x = -Math.PI/2; sombra.position.y = 0.012; scene.add(sombra);   // sombra de contacto (refuerza la real)

    rig = construirPersonaje(personajes.karateka); scene.add(rig); rig.reset();
    aplicarFondo(fondos[fondoActual]);
    listo = true;
    setPersonaje(personajeActual);     // aplica el personaje elegido (procedural o .glb)
    resize();
    arrancar();
  }

  function arrancar(){ if(raf) return; t0 = performance.now(); loop(); }
  let ultimoCuadro=0;
  function loop(){
    raf = requestAnimationFrame(loop);
    cuadro();
  }
  function cuadro(){                                   // un fotograma: posa, retarget, ambiente, cámara y render
    const ahora=performance.now(); const dt=Math.min(0.1,(ahora-(ultimoCuadro||ahora))/1000); ultimoCuadro=ahora; reloj+=dt;
    const j = rig.userData.j;
    rig.reset();
    const dur = ((animador && animador.dur) || 2.0) * tempo;   // duración de un ciclo (s), según el tempo de la clase
    const t = congelaT!=null ? (congelaT%1) : ((ahora-t0)/1000/dur)%1;
    (animador||ANIM.breathe)(j, t);
    if(fundido) aplicarFundido(j, ahora);             // enlaza suave con la pose del ejercicio anterior
    vida(ahora);
    rig.updateMatrixWorld(true);
    if(glbActivo) retarget();                          // el modelo .glb copia la pose
    if(sombra){ sombra.position.x = rig.position.x; sombra.position.z = rig.position.z; }
    animarAmbiente(dt);
    colocarCamara();
    renderer.render(scene, camera);
  }
  function detener(){ if(raf){ cancelAnimationFrame(raf); raf=null; } ultimoCuadro=0; }

  /* Tempo del personaje: >1 más lento (principiante, 'despacio'), <1 más rápido (avanzado,
     'velocidad'). Se cambia conservando la fase para que el movimiento no salte. */
  let tempo = 1;
  function setTempo(f){
    f = (f>0) ? f : 1;
    if(f===tempo) return;
    const ahora = performance.now(), base = (animador && animador.dur) || 2.0;
    const fase = ((ahora-t0)/1000/(base*tempo))%1;
    tempo = f;
    t0 = ahora - fase*base*tempo*1000;
  }

  /* Fundido entre ejercicios: al cambiar de animación se guarda la pose que se ve
     en ese momento y, durante FUNDIDO_S, se interpola (slerp) hacia la nueva.
     Así el personaje se levanta de la plancha o sale de la guardia en vez de
     "teletransportarse" de una pose a otra.                                     */
  const FUNDIDO_S = 0.65;
  let fundido = null;
  const _qF = new THREE.Quaternion();
  function capturarFundido(){
    if(!rig || !listo) return;
    const j = rig.userData.j, poses = {};
    for(const k in j) poses[k] = j[k].quaternion.clone();
    fundido = {ini:performance.now(), poses, pos:j.root.position.clone()};
  }
  function aplicarFundido(j, ahora){
    if(!fundido.dur)                                  // pasar del suelo a de pie (o al revés) necesita más tiempo
      fundido.dur = fundido.poses.root.angleTo(j.root.quaternion) > 0.8 ? 1.1 : FUNDIDO_S;
    const k = (ahora-fundido.ini)/1000/fundido.dur;
    if(k>=1 || congelaT!=null){ fundido=null; return; }
    const e = k*k*(3-2*k);
    for(const n in j){ if(!fundido.poses[n]) continue;
      _qF.copy(fundido.poses[n]).slerp(j[n].quaternion, e); j[n].quaternion.copy(_qF); }
    j.root.position.lerpVectors(fundido.pos, j.root.position.clone(), e);
  }
  /* Vida: el pecho respira y los ojos parpadean aunque el ejercicio esté quieto */
  let proxParpadeo = 0;
  function vida(ahora){
    const u = rig.userData;
    if(u.pecho){ const r = Math.sin(ahora/1000*TAU/4.2); u.pecho.scale.set(1+0.012*r, 1+0.006*r, 0.64*(1+0.018*r)); }
    if(u.ojos){
      if(!proxParpadeo) proxParpadeo = ahora + 1500;
      const d = ahora - proxParpadeo;                         // un parpadeo dura ~140 ms
      let a = 1;
      if(d>=0 && d<140) a = 0.12 + 0.88*Math.abs(d-70)/70;
      else if(d>=140) proxParpadeo = ahora + 2200 + Math.random()*3200;
      if(congelaT!=null) a = 1;                               // capturas y editor: ojos abiertos
      u.ojos.forEach(o=>{ o.scale.y = a; });
    }
  }

  function animarAmbiente(dt){
    if(E.polvo && E.polvo.visible){                    // el polvo flota despacio en la luz
      const a=E.polvo.geometry.attributes.position, v=E.polvoVel;
      for(let i=0;i<v.length;i++){
        a.array[i*3+1]-=v[i]*dt; a.array[i*3]+=Math.sin(reloj*0.4+i)*0.02*dt;
        if(a.array[i*3+1]<0.05) a.array[i*3+1]=2.6;
      }
      a.needsUpdate=true;
    }
    if(E.linternas) E.linternas.forEach(l=>{           // las linternas titilan
      if(l.luz.intensity>0){ const f=0.6+0.06*Math.sin(reloj*7.3+l.fase)+0.04*Math.sin(reloj*13.1+l.fase*2); l.luz.intensity=f; }
    });
    if(E.vela && E.vela.intensity>0) E.vela.intensity=0.5+0.18*Math.sin(reloj*11+1.7)+0.1*Math.sin(reloj*23);
  }

  /* Cámara según el modo. En pantallas verticales (móvil) se aleja y apunta más
     bajo para que el personaje quede entero y por encima del HUD. */
  function colocarCamara(){
    const vertical = Math.max(0, Math.min(1, (1.15-camera.aspect)*2.2));   // 0 = paisaje · 1 = retrato
    if(modoCam==='libre'){                                // Biblioteca/editor: órbita con el dedo, encuadra el cuerpo entero
      const R=radioLibre+1.5*vertical, ce=Math.cos(el);
      camera.position.set(Math.sin(az)*ce*R, 0.95+Math.sin(el)*R, Math.cos(az)*ce*R);
      camera.lookAt(0,miraLibre,0);
    } else if(modoCam==='ambiente'){                      // portada: paseo lento; en paisaje el personaje queda a la derecha del texto
      const a=0.28+0.42*Math.sin(reloj*0.11), R=4.3+1.7*vertical, y=1.25+0.08*Math.sin(reloj*0.07);
      camera.position.set(Math.sin(a)*R, y, Math.cos(a)*R);
      camera.lookAt(-0.95*(1-vertical)-0.3*vertical, 0.85-0.6*vertical, -0.2);
    } else {                                              // clase: cámara fija con una "respiración" casi imperceptible
      camera.position.set(1.25+0.03*Math.sin(reloj*0.31), 1.12+0.02*Math.sin(reloj*0.23+1), 4.9+1.7*vertical+0.03*Math.sin(reloj*0.17));
      camera.lookAt(0, 0.72-0.22*vertical, 0);
    }
  }
  function activarArrastre(dom){
    dom.style.touchAction='none';
    dom.addEventListener('pointerdown', e=>{ if(!modoLibre) return;
      arrastrando=true; arrX=e.clientX; arrY=e.clientY; try{ dom.setPointerCapture(e.pointerId); }catch(_){} });
    dom.addEventListener('pointermove', e=>{ if(!arrastrando) return;
      az -= (e.clientX-arrX)*0.01; el = Math.max(-0.25, Math.min(0.95, el+(e.clientY-arrY)*0.006));
      arrX=e.clientX; arrY=e.clientY; });
    const soltar=()=>{ arrastrando=false; };
    dom.addEventListener('pointerup', soltar); dom.addEventListener('pointercancel', soltar);
  }

  function resize(){
    if(!contenedor||!renderer) return;
    const w = contenedor.clientWidth||300, h = contenedor.clientHeight||340;
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }

  /* ---------------- API pública ---------------- */
  let arqActual='respiracion';
  let arteActual=null;
  function setEjercicio(arquetipo, arte){
    arte = arte||null;
    if(arquetipo===arqActual && arte===arteActual && animador) return;   // ya se está mostrando (p. ej. tras el cambio previo)
    capturarFundido();
    arqActual=arquetipo; arteActual=arte; animador = resolverAnim(arquetipo, arte); t0 = performance.now(); mostrarBokken();
  }
  function mostrarBokken(){ if(rig && rig.userData.bokken) rig.userData.bokken.visible = /^(espada|kamae)$/.test(arqActual); }
  function setFondo(clave){ if(!fondos[clave]) return; fondoActual=clave; if(listo) aplicarFondo(fondos[clave]); }
  function setPersonaje(clave){
    if(!personajes[clave]){ return; }
    personajeActual=clave;
    if(!listo) return;
    const p=personajes[clave];
    if(glbActivo){ scene.remove(glbActivo.root); glbActivo=null; }   // quita el modelo anterior
    if(p.tipo==='glb'){
      rig.visible=false;            // el motor procedural queda invisible, solo anima
      cargarGLB(p.archivo, p.color, p.giroY);
    } else {
      scene.remove(rig); rig=construirPersonaje(p); scene.add(rig); rig.reset(); rig.visible=true; mostrarBokken(); fundido=null;
    }
  }
  function cicloFondo(){
    const ks=Object.keys(fondos).filter(k=>!fondos[k].oculto);
    setFondo(ks[(ks.indexOf(fondoActual)+1)%ks.length]); return fondos[fondoActual].nombre;
  }
  function cicloPersonaje(){ const ks=Object.keys(personajes); setPersonaje(ks[(ks.indexOf(personajeActual)+1)%ks.length]); return personajes[personajeActual].nombre; }

  /* ---- Visor libre para la Biblioteca / editor ----
     Monta el mismo lienzo 3D en otro contenedor, con giro libre y el
     personaje "karateka" (silueta clara para analizar el movimiento). */
  function montarEn(cont, arquetipo, arte, personaje){
    init(cont);                                   // crea el lienzo o lo re-monta aquí
    modoCam='libre'; modoLibre=true; congelaT=null; az=0.5; el=0.12; tempo=1;
    setFondo('zen');                              // fondo claro y neutro para analizar
    setPersonaje(personaje||'karateka');
    setEjercicio(arquetipo, arte);
    arrancar(); resize(); colocarCamara();
  }
  /* ---- Ambiente de portada: el dojo vivo, con el personaje meditando ---- */
  function montarAmbiente(cont, fondo, personaje){
    init(cont);
    modoCam='ambiente'; modoLibre=false; congelaT=null; tempo=1;
    if(fondo) setFondo(fondo);
    if(personaje) setPersonaje(personaje);
    setEjercicio('meditacion');
    arrancar(); resize(); colocarCamara();
  }
  function desmontar(){
    modoLibre=false; congelaT=null; finEdicion(); detener();
    if(renderer && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  /* Control fino del visor (editor, pruebas): congelar una fase t∈[0,1) (null = reproducir)
     y fijar la órbita de la cámara libre (az, el en radianes; R distancia) */
  function congelar(t){ congelaT = (t==null) ? null : t; }
  let radioLibre = 6.6, miraLibre = 0.95;
  function orbita(a, e, R, y){ if(a!=null) az=a; if(e!=null) el=e; if(R) radioLibre=R; miraLibre = (y!=null) ? y : 0.95; }
  function vistaClase(){                           // restaura la cámara fija de la clase
    modoCam='clase'; modoLibre=false; congelaT=null;
    if(camera) colocarCamara();
  }

  return {init, setEjercicio, setTempo, setFondo, setPersonaje, cicloFondo, cicloPersonaje,
          detener, arrancar, resize, personajes, fondos,
          montarEn, montarAmbiente, desmontar, vistaClase, congelar, orbita, renderAhora:()=>{ if(listo) cuadro(); },
          editable: claveEditable, editarInfo, valorPose, setValorPose,
          congelarEnFotograma, reproducirPreview, guardarEdicion, restablecerEdicion, finEdicion,
          get fondo(){return fondoActual}, get personaje(){return personajeActual},
          disponible(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl')||c.getContext('experimental-webgl'))); }catch(e){ return false; } } };
})();

/* ============================================================
   NOTA — añadir un personaje con modelo .glb (Mixamo, Quaternius…):
   Forma fácil (recomendada), sin tocar este archivo:
     node tools/incrustar-glb.js <ruta.glb> [clave] [Nombre]
   La herramienta incrusta el modelo en assets/modelos.js y lo
   registra en assets/personajes-extra.js. Abre index.html y usa 🥷.

   El motor NO reproduce las animaciones del modelo: solo usa su
   MALLA y reorienta sus huesos para copiar los más de 70 movimientos del
   rig procedural (retargeting). Por eso basta con un modelo en pose
   de reposo/T-pose; sus huesos se mapean solos si siguen alguna
   convención habitual — ver clasificar(): acepta Mixamo
   (mixamorig:RightArm), Blender (Upperarm.Right), sufijos .L/.R, etc.
   Si el esqueleto no encaja, la consola lista los huesos hallados y
   se vuelve al personaje procedural automáticamente.
   ============================================================ */
