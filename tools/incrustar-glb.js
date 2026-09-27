#!/usr/bin/env node
/* ============================================================
   Incrusta un modelo .glb en la app para que funcione sin servidor
   (abriendo index.html con doble clic) y lo registra como personaje.

   Uso:
     node tools/incrustar-glb.js <ruta.glb> [clave] [Nombre visible]

   Ejemplos:
     node tools/incrustar-glb.js ~/Descargas/dancer.glb
     node tools/incrustar-glb.js assets/bailarina.glb bailarina "Bailarina"

   Qué hace:
     1) Copia el .glb a assets/ (si no está ya ahí).
     2) Guarda su contenido en base64 dentro de assets/modelos.js.
     3) Añade la entrada del personaje en assets/personajes-extra.js.
   Después: abre index.html y usa el botón 🥷 para ciclar al nuevo personaje.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ    = path.resolve(__dirname, '..');
const ASSETS  = path.join(RAIZ, 'assets');
const MODELOS = path.join(ASSETS, 'modelos.js');
const EXTRA   = path.join(ASSETS, 'personajes-extra.js');

function morir(msg){ console.error('✗ ' + msg); process.exit(1); }

const [,, entrada, claveArg, ...nombreArg] = process.argv;
if(!entrada) morir('Falta la ruta del .glb.\n  Uso: node tools/incrustar-glb.js <ruta.glb> [clave] [Nombre]');
if(!fs.existsSync(entrada)) morir('No existe el archivo: ' + entrada);
if(path.extname(entrada).toLowerCase() !== '.glb') morir('El archivo debe ser .glb (exporta GLB binario, no .gltf).');

// clave interna (sin espacios ni acentos) y nombre visible
const baseNombre = path.basename(entrada, '.glb');
const clave = (claveArg || baseNombre)
  .normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || 'personaje';
const nombre = nombreArg.length ? nombreArg.join(' ')
  : (clave.charAt(0).toUpperCase() + clave.slice(1));

// 1) Asegura que el .glb vive en assets/
const destino = path.join(ASSETS, clave + '.glb');
const rutaRel = 'assets/' + clave + '.glb';
if(path.resolve(entrada) !== destino){
  fs.copyFileSync(entrada, destino);
  console.log('· Copiado a ' + rutaRel);
}

// 2) Incrustar base64 en modelos.js (leemos el objeto existente y lo reescribimos)
function cargarObjeto(archivo, variable){
  if(!fs.existsSync(archivo)) return {};
  const sandbox = { window: {} };
  new Function('window', fs.readFileSync(archivo,'utf8'))(sandbox.window);
  return sandbox.window[variable] || {};
}
const b64 = fs.readFileSync(destino).toString('base64');
const modelos = cargarObjeto(MODELOS, 'MODELOS_GLB');
const nuevo = !(rutaRel in modelos);
modelos[rutaRel] = b64;

let salida = '/* Modelos 3D incrustados (base64) para funcionar sin servidor, abriendo el index con doble clic. */\n';
salida += 'window.MODELOS_GLB = {\n';
salida += Object.keys(modelos).map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(modelos[k])).join(',\n');
salida += '\n};\n';
fs.writeFileSync(MODELOS, salida);
console.log('· ' + (nuevo?'Incrustado':'Actualizado') + ' en assets/modelos.js (' + Math.round(b64.length/1024) + ' KB base64)');

// 3) Registrar el personaje en personajes-extra.js
const personajes = cargarObjeto(EXTRA, 'PERSONAJES_EXTRA');
const yaEstaba = clave in personajes;
personajes[clave] = { nombre, tipo:'glb', archivo: rutaRel };

const cabecera = fs.existsSync(EXTRA)
  ? fs.readFileSync(EXTRA,'utf8').split('window.PERSONAJES_EXTRA')[0].trimEnd() + '\n'
  : '/* Personajes 3D añadidos (Mixamo, Quaternius, etc.). */\n';
let extraOut = cabecera + 'window.PERSONAJES_EXTRA = {\n';
extraOut += Object.keys(personajes).map(k => {
  const p = personajes[k];
  const campos = ['nombre:'+JSON.stringify(p.nombre), "tipo:'glb'", 'archivo:'+JSON.stringify(p.archivo)];
  if(p.color!=null) campos.push('color:'+p.color);
  if(p.giroY!=null) campos.push('giroY:'+p.giroY);
  return '  ' + k + ': { ' + campos.join(', ') + ' }';
}).join(',\n');
extraOut += '\n};\n';
fs.writeFileSync(EXTRA, extraOut);
console.log('· ' + (yaEstaba?'Actualizado':'Registrado') + ' el personaje "'+nombre+'" (clave: '+clave+')');

console.log('\n✓ Listo. Abre index.html y toca 🥷 para ciclar hasta "'+nombre+'".');
console.log('  Si mira hacia otro lado, añade  giroY: Math.PI  a su entrada en assets/personajes-extra.js.');
console.log('  Si en la consola ves "esqueleto no compatible", el modelo usa nombres de huesos raros:');
console.log('  reexpórtalo desde Blender con un rig humanoide estándar (o Mixamo).');
