# ============================================================
# Da esqueleto (rig) a una malla .glb SIN huesos y la deja lista para
# que el motor de la app la anime por retargeting. Necesita Blender.
#
# Uso:
#   blender --background --python tools/riguear-glb.py -- entrada.glb salida.glb
#
# Qué hace:
#   1) Importa el .glb y junta todas las mallas en un objeto.
#   2) Detecta pose (T o A) y proporciones desde la geometría.
#   3) Crea un esqueleto humanoide (nombres compatibles con el motor:
#      spine/chest/neck/head, upper_arm/forearm/hand.L/.R, thigh/shin/foot.L/.R).
#   4) Empareja la malla con PESOS AUTOMÁTICOS (bone heat) de Blender.
#   5) Exporta el .glb rigueado.
# Después: node tools/incrustar-glb.js salida.glb <clave> "<Nombre>"
#
# Requisito: la malla debe ser humanoide y estar en T-pose o A-pose,
# de pie y mirando al frente. Blender portable: descarga de blender.org,
# descomprime y usa ./blender/blender ... (no requiere instalación).
# ============================================================
import bpy, sys, numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--')+1:]
ENTRADA, SALIDA = argv[0], argv[1]

# --- escena limpia ---
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=ENTRADA)

# --- junta todas las mallas en un solo objeto y aplica transformaciones ---
mallas = [o for o in bpy.data.objects if o.type=='MESH']
for o in bpy.data.objects: o.select_set(False)
for o in mallas: o.select_set(True)
bpy.context.view_layer.objects.active = mallas[0]
if len(mallas) > 1: bpy.ops.object.join()
cuerpo = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# --- nube de vértices en espacio mundo ---
V = np.array([ (cuerpo.matrix_world @ v.co)[:] for v in cuerpo.data.vertices ], dtype=float)
mn, mx = V.min(0), V.max(0); size = mx-mn
U = int(np.argmax(size))                      # eje vertical = mayor extensión
horiz = [i for i in range(3) if i!=U]
W = horiz[0] if size[horiz[0]]>=size[horiz[1]] else horiz[1]   # eje de anchura (brazos)
D = [i for i in horiz if i!=W][0]             # eje de profundidad
H = size[U]
cW = (mn[W]+mx[W])/2; cD = (mn[D]+mx[D])/2; fy = mn[U]
def P(w,u,d):
    v=[0,0,0]; v[W]=w; v[U]=fy+u*H; v[D]=d; return Vector(v)
Yb = lambda u: fy+u*H

# mano = vértice más externo del tren superior (vale para T-pose y A-pose)
up = V[:,U] > Yb(0.45)
def mano(signo):
    m = up & ((V[:,W]>cW) if signo>0 else (V[:,W]<cW))
    Vs = V[m]; d = np.abs(Vs[:,W]-cW); sel = Vs[d>=np.percentile(d,99)]
    return sel.mean(0)
hpos = {1: mano(1), -1: mano(-1)}
# centro de cada pierna en la banda de tobillos
lowm = V[:,U] <= Yb(0.06); xs = V[lowm, W]
legpos = {1: (np.median(xs[xs>cW]) if (xs>cW).any() else cW+0.09*H),
         -1: (np.median(xs[xs<cW]) if (xs<cW).any() else cW-0.09*H)}
sh = 0.11*H

# --- crea el esqueleto ---
arm_data = bpy.data.armatures.new('rig'); arm_obj = bpy.data.objects.new('rig', arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones

def punto_mundo(arr):
    v=[0,0,0]; v[W]=arr[W]; v[U]=arr[U]; v[D]=arr[D]; return Vector(v)
def hueso(nombre, cabeza, cola, padre=None):
    b = eb.new(nombre); b.head = cabeza; b.tail = cola
    if padre: b.parent = padre;
    return b

# lado: +W → sufijo _left (coincide con la convención del rig procedural del motor,
# cuyo lado L está en +x). Palabra completa "_left/_right" en vez de ".L/.R" porque
# three.js SANEA los nombres al cargar y borra el punto (".L" → "L"), lo que rompe la
# detección de lado del motor. Con _left/_right sobrevive y se clasifica siempre.
def lado(signo): return '_left' if signo>0 else '_right'

pelvis = P(cW,0.52,cD); chest = P(cW,0.70,cD); neck = P(cW,0.82,cD)
head = P(cW,0.87,cD); headtop = P(cW,1.00,cD)
b_spine = hueso('spine', pelvis, chest)
b_chest = hueso('chest', chest, neck, b_spine)
b_neck  = hueso('neck',  neck, head, b_chest)
b_head  = hueso('head',  head, headtop, b_neck)

brazos = {}                     # guarda (hombro, codo) por lado para bajar los brazos luego
for s in (1,-1):
    L = lado(s)
    shoulder = P(cW + s*sh, 0.82, cD)
    hand = punto_mundo(hpos[s])
    elbow = shoulder.lerp(hand, 0.50)
    wrist = shoulder.lerp(hand, 0.86)
    brazos[s] = (shoulder.copy(), elbow.copy())
    # brazo colgando de la COLUMNA (no del pecho): el motor reorienta 'chest' cada cuadro,
    # y colgar de un padre reorientado descoyunta el brazo; 'spine' queda en reposo (como las piernas).
    b_ua  = hueso('upper_arm'+L, shoulder, elbow, b_spine)
    b_fa  = hueso('forearm'+L, elbow, wrist, b_ua)
    hueso('hand'+L, wrist, hand, b_fa)
    hip   = P(legpos[s], 0.50, cD); knee = P(legpos[s], 0.27, cD)
    ankle = P(legpos[s], 0.05, cD); toe  = P(legpos[s], 0.02, cD)
    toe[D] = cD + 0.06*H
    b_th  = hueso('thigh'+L, hip, knee, b_spine)
    b_sh  = hueso('shin'+L, knee, ankle, b_th)
    hueso('foot'+L, ankle, toe, b_sh)

bpy.ops.object.mode_set(mode='OBJECT')

# --- emparenta la malla con pesos automáticos (bone heat), aún en T/A-pose ---
for o in bpy.data.objects: o.select_set(False)
cuerpo.select_set(True); arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# --- baja los brazos y hornea esa pose como REPOSO ---
# El motor anima partiendo de la pose de reposo del modelo; su rig de referencia tiene
# los brazos casi verticales. Si dejáramos el reposo en T-pose (brazos horizontales),
# el motor rotaría el brazo 90° y la torsión acumulada descoyunta la malla (planchas).
# Truco: pesos en T-pose (buenos), luego rotamos los brazos hacia abajo y aplicamos esa
# pose como nueva de reposo (la malla se queda con los brazos abajo y los pesos intactos).
from mathutils import Vector as Vec
bpy.ops.object.mode_set(mode='POSE')
for s in (1,-1):
    pb = arm_obj.pose.bones['upper_arm'+lado(s)]
    sho, elb = brazos[s]
    cur = (elb - sho).normalized()                     # dirección actual del brazo (T/A-pose)
    want = Vec((0,0,0)); want[U] = -1.0; want[W] = 0.22*s   # abajo, ligeramente hacia afuera
    want = want.normalized()
    q = cur.rotation_difference(want)                  # giro que lleva el brazo de 'cur' a 'want'
    pb.matrix = q.to_matrix().to_4x4() @ pb.matrix
    bpy.context.view_layer.update()
bpy.ops.pose.armature_apply()                          # esta pose (brazos abajo) pasa a ser el reposo
bpy.ops.object.mode_set(mode='OBJECT')

# --- exporta GLB ---
for o in bpy.data.objects: o.select_set(False)
cuerpo.select_set(True); arm_obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=SALIDA, export_format='GLB',
    use_selection=True, export_yup=True, export_skins=True, export_apply=False)
print('RIG-OK huesos=%d verts=%d U=%d W=%d'%(len(arm_data.bones), len(V), U, W))
