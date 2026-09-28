/* ============================================================
   BIBLIOTECA DE EJERCICIOS Y RUTINAS
   tipo: 'tiempo' (segundos) | 'reps' (repeticiones, también con duración guía)
   lado: true  -> se ejecuta por lado (la clase lo divide en dos turnos)
   pesas: true -> requiere mancuernas / peso
   ============================================================ */

const CATEGORIAS = {
  calentamiento:{nombre:'Calentamiento', kanji:'暖', color:'#e07b39'},
  movilidad:    {nombre:'Movilidad',     kanji:'柔', color:'#5b8c9a'},
  piernas:      {nombre:'Piernas y suelo',kanji:'脚', color:'#c0392b'},
  core:         {nombre:'Core',          kanji:'体', color:'#9a5bc0'},
  superior:     {nombre:'Tren superior', kanji:'腕', color:'#3a7d44'},
  marcial:      {nombre:'Técnica marcial',kanji:'武', color:'#c9a227'},
  calma:        {nombre:'Vuelta a la calma',kanji:'静', color:'#5b6b8c'},
};

const BIBLIOTECA = [
  /* ---------------- CALENTAMIENTO ---------------- */
  {id:'trote', nombre:'Trote en el lugar', arquetipo:'trote', categoria:'calentamiento', tipo:'tiempo', duracion:90,
   instrucciones:['Corre suave sin moverte del sitio','Apoya la planta, rodillas sueltas','Brazos relajados acompañando'],
   respiracion:'Respira por la nariz, ritmo constante.'},
  {id:'rodillas', nombre:'Rodillas arriba', arquetipo:'rodillas', categoria:'calentamiento', tipo:'tiempo', duracion:40,
   instrucciones:['Sube las rodillas a la altura de la cadera','Mantén el tronco erguido','Aterriza suave en la planta'],
   respiracion:'Exhala en cada rodilla que sube.'},
  {id:'talones', nombre:'Talones al glúteo', arquetipo:'talones', categoria:'calentamiento', tipo:'tiempo', duracion:40,
   instrucciones:['Lleva el talón hacia el glúteo','Ritmo ágil pero controlado','Postura alta'],
   respiracion:'Respiración fluida y continua.'},
  {id:'jumping', nombre:'Jumping jacks', arquetipo:'jumping', categoria:'calentamiento', tipo:'tiempo', duracion:45,
   instrucciones:['Abre brazos y piernas a la vez','Cierra con control','Cae suave sobre las plantas'],
   respiracion:'Inhala al abrir, exhala al cerrar.'},
  {id:'mov_articular', nombre:'Movilidad articular', arquetipo:'mov_brazos', categoria:'calentamiento', tipo:'tiempo', duracion:50,
   instrucciones:['Círculos de cuello, hombros, caderas y tobillos','Movimientos lentos y amplios','Despierta cada articulación'],
   respiracion:'Respira hondo mientras movilizas.'},
  {id:'trote_largo', nombre:'Carrera suave (trote continuo)', arquetipo:'trote', categoria:'calentamiento', tipo:'tiempo', duracion:180,
   instrucciones:['Trota en el sitio a ritmo cómodo y constante','Hombros sueltos, mirada al frente','Es la carrera de inicio de la clase: entra en calor sin agotarte'],
   respiracion:'Respira por la nariz, ritmo que puedas sostener.'},
  {id:'cuerda', nombre:'Salto de cuerda (imaginaria)', arquetipo:'jumping', categoria:'calentamiento', tipo:'tiempo', duracion:120,
   instrucciones:['Salta bajo sobre las puntas, como con una cuerda','Muñecas girando la cuerda invisible','Rodillas sueltas, saltos pequeños y rítmicos'],
   respiracion:'Respiración rítmica y constante.'},

  /* ---------------- MOVILIDAD / ELONGACIÓN DINÁMICA ---------------- */
  /* Junbi undō: movilidad articular una a una, como al inicio de la clase de karate */
  {id:'rot_tobillos', nombre:'Rotación de tobillos', arquetipo:'equilibrio', categoria:'movilidad', tipo:'tiempo', duracion:25, lado:true,
   instrucciones:['Apoya la punta del pie y gira el talón en círculos','Cambia de sentido a la mitad','Sujétate de algo si lo necesitas'],
   respiracion:'Respiración tranquila.'},
  {id:'rot_rodillas', nombre:'Círculos de rodillas', arquetipo:'sentadilla', categoria:'movilidad', tipo:'tiempo', duracion:30,
   instrucciones:['Pies juntos, semiflexiona y apoya las manos en las rodillas','Dibuja círculos con las rodillas','Cambia de sentido a la mitad'],
   respiracion:'Respiración relajada.'},
  {id:'rot_cuello', nombre:'Rotación de cuello', arquetipo:'cuello', categoria:'movilidad', tipo:'tiempo', duracion:30,
   instrucciones:['Semicírculos suaves: oreja–pecho–oreja','Luego gira mirando a cada hombro','Lento, sin echar la cabeza atrás con fuerza'],
   respiracion:'Exhala al soltar el cuello.'},
  {id:'circulo_brazos', nombre:'Círculos de brazos', arquetipo:'mov_brazos', categoria:'movilidad', tipo:'tiempo', duracion:35,
   instrucciones:['Brazos extendidos, círculos amplios','Hacia adelante y luego hacia atrás','Suelta hombros, codos y muñecas'],
   respiracion:'Inhala arriba, exhala abajo.'},
  {id:'balanceo_pierna', nombre:'Balanceo de pierna', arquetipo:'balanceo', categoria:'movilidad', tipo:'tiempo', duracion:30, lado:true,
   instrucciones:['Sujétate de una pared si hace falta','Balancea la pierna adelante y atrás','Rango cómodo, sin forzar'],
   respiracion:'Exhala en cada balanceo.'},
  {id:'circulo_cadera', nombre:'Círculos de cadera', arquetipo:'circulo_cadera', categoria:'movilidad', tipo:'tiempo', duracion:30,
   instrucciones:['Manos en la cintura','Dibuja círculos amplios con la cadera','Cambia de sentido a la mitad'],
   respiracion:'Respiración relajada.'},
  {id:'gato_camello', nombre:'Gato–camello', arquetipo:'gato', categoria:'movilidad', tipo:'tiempo', duracion:40,
   instrucciones:['En cuadrupedia, redondea la espalda','Luego arquéala mirando al frente','Movimiento lento, vértebra a vértebra'],
   respiracion:'Inhala al arquear, exhala al redondear.'},

  /* ---------------- PIERNAS Y SUELO ---------------- */
  {id:'sentadilla', nombre:'Sentadillas', arquetipo:'sentadilla', categoria:'piernas', tipo:'reps', reps:15, duracion:45,
   instrucciones:['Pies al ancho de hombros','Baja llevando la cadera atrás','Rodillas en línea con los pies','Pecho arriba'],
   respiracion:'Inhala bajando, exhala subiendo.'},
  {id:'sentadilla_sumo', nombre:'Sentadilla sumo', arquetipo:'sumo', categoria:'piernas', tipo:'reps', reps:15, duracion:45, pesas:true,
   instrucciones:['Pies más abiertos, puntas hacia afuera','Sujeta una mancuerna con ambas manos','Baja recto, rodillas hacia afuera'],
   respiracion:'Exhala al subir con fuerza.'},
  {id:'zancada', nombre:'Zancadas', arquetipo:'zancada', categoria:'piernas', tipo:'reps', reps:12, duracion:45, lado:true,
   instrucciones:['Da un paso al frente','Baja la rodilla trasera hacia el suelo','El tronco recto, núcleo firme'],
   respiracion:'Inhala bajando, exhala al volver.'},
  {id:'sentadilla_iso', nombre:'Sentadilla isométrica (pared)', arquetipo:'postura', categoria:'piernas', tipo:'tiempo', duracion:40,
   instrucciones:['Espalda apoyada en la pared','Muslos paralelos al suelo','Aguanta la posición, no resbales'],
   respiracion:'Respiración lenta y profunda mientras aguantas.'},
  {id:'kiba_dachi', nombre:'Kiba dachi (postura del jinete)', arquetipo:'postura', categoria:'piernas', tipo:'tiempo', duracion:40,
   instrucciones:['Pies anchos, paralelos','Baja la cadera, muslos firmes','Espalda recta, mirada al frente','Postura clásica de karate'],
   respiracion:'Respira al hara (vientre), firme y estable.'},
  {id:'puente_gluteo', nombre:'Puente de glúteo', arquetipo:'puente', categoria:'piernas', tipo:'reps', reps:15, duracion:40,
   instrucciones:['Boca arriba, rodillas flexionadas','Eleva la cadera apretando glúteos','Pausa arriba un segundo'],
   respiracion:'Exhala al subir la cadera.'},
  {id:'elevacion_lateral_pierna', nombre:'Elevación lateral de pierna', arquetipo:'abduccion', categoria:'piernas', tipo:'reps', reps:15, duracion:35, lado:true,
   instrucciones:['Tumbado de lado','Eleva la pierna superior recta','Baja con control, sin golpear'],
   respiracion:'Exhala al elevar.'},
  {id:'gemelos', nombre:'Elevación de gemelos', arquetipo:'gemelos', categoria:'piernas', tipo:'reps', reps:20, duracion:35,
   instrucciones:['De pie, sube sobre las puntas','Pausa arriba','Baja lento controlando el talón'],
   respiracion:'Exhala arriba, inhala abajo.'},

  /* ---------------- TREN SUPERIOR ---------------- */
  {id:'flexiones', nombre:'Flexiones', arquetipo:'flexion', categoria:'superior', tipo:'reps', reps:12, duracion:45,
   instrucciones:['Manos algo más anchas que los hombros','Cuerpo recto como tabla','Baja el pecho, codos a ~45°','Si cuesta, apoya rodillas'],
   respiracion:'Inhala bajando, exhala empujando.'},
  {id:'press_hombro', nombre:'Press de hombros', arquetipo:'press', categoria:'superior', tipo:'reps', reps:12, duracion:45, pesas:true,
   instrucciones:['Mancuernas a la altura de los hombros','Empuja arriba sin bloquear de golpe','Núcleo firme, no arquees la espalda'],
   respiracion:'Exhala al empujar arriba.'},
  {id:'curl_biceps', nombre:'Curl de bíceps', arquetipo:'curl', categoria:'superior', tipo:'reps', reps:12, duracion:40, pesas:true,
   instrucciones:['Codos pegados al cuerpo','Sube la mancuerna sin balancear','Baja lento, controla la fase negativa'],
   respiracion:'Exhala al subir, inhala al bajar.'},
  {id:'remo', nombre:'Remo a un brazo', arquetipo:'remo', categoria:'superior', tipo:'reps', reps:12, duracion:45, lado:true, pesas:true,
   instrucciones:['Inclina el tronco con espalda recta','Lleva el codo hacia atrás','Aprieta la escápula arriba'],
   respiracion:'Exhala al traer el peso al costado.'},
  {id:'fondos_silla', nombre:'Fondos de tríceps (en silla)', arquetipo:'fondo', categoria:'superior', tipo:'reps', reps:12, duracion:40,
   instrucciones:['Manos en el borde de una silla','Baja flexionando los codos atrás','Sube empujando con el tríceps'],
   respiracion:'Inhala bajando, exhala subiendo.'},
  {id:'elev_lateral', nombre:'Elevaciones laterales', arquetipo:'elevacion', categoria:'superior', tipo:'reps', reps:12, duracion:40, pesas:true,
   instrucciones:['Mancuernas a los costados','Eleva los brazos hasta la horizontal','Sin impulso, hombros lejos de las orejas'],
   respiracion:'Exhala al elevar.'},

  /* ---------------- CORE ---------------- */
  {id:'plancha', nombre:'Plancha', arquetipo:'plancha', categoria:'core', tipo:'tiempo', duracion:40,
   instrucciones:['Antebrazos bajo los hombros','Cuerpo recto: no hundas la cadera','Aprieta abdomen y glúteos'],
   respiracion:'Respira de forma continua, no aguantes el aire.'},
  {id:'plancha_lateral', nombre:'Plancha lateral', arquetipo:'plancha_lateral', categoria:'core', tipo:'tiempo', duracion:30, lado:true,
   instrucciones:['Apoya un antebrazo, cuerpo de lado','Eleva la cadera, cuerpo en línea','Mira al frente'],
   respiracion:'Respiración lenta y estable.'},
  {id:'abdominales', nombre:'Abdominales (crunch)', arquetipo:'abdominal', categoria:'core', tipo:'reps', reps:18, duracion:40,
   instrucciones:['Boca arriba, rodillas flexionadas','Eleva los hombros sin tirar del cuello','Baja con control'],
   respiracion:'Exhala al subir.'},
  {id:'bicicleta', nombre:'Abdominal bicicleta', arquetipo:'bicicleta', categoria:'core', tipo:'tiempo', duracion:40,
   instrucciones:['Codo hacia la rodilla contraria','Alterna con control','No tires del cuello'],
   respiracion:'Exhala en cada giro.'},
  {id:'escaladores', nombre:'Escaladores (mountain climbers)', arquetipo:'escalador', categoria:'core', tipo:'tiempo', duracion:35,
   instrucciones:['En posición de plancha alta','Lleva las rodillas al pecho alternando','Cadera baja y estable'],
   respiracion:'Ritmo ágil, respiración constante.'},

  /* ---------------- TÉCNICA MARCIAL / EQUILIBRIO ---------------- */
  {id:'patada_frontal', nombre:'Patada frontal (mae geri)', arquetipo:'patada', categoria:'marcial', tipo:'reps', reps:10, duracion:40, lado:true,
   instrucciones:['Sube la rodilla y extiende al frente','Golpea con la planta/metatarso','Recoge la pierna y baja con control'],
   respiracion:'Exhala con kiai corto en el golpe.'},
  {id:'patada_lateral', nombre:'Patada lateral (yoko geri)', arquetipo:'patada_lateral', categoria:'marcial', tipo:'reps', reps:10, duracion:40, lado:true,
   instrucciones:['Sube la rodilla y extiende al costado','Filo del pie hacia el objetivo','Mantén el equilibrio y recoge'],
   respiracion:'Exhala en la extensión.'},
  {id:'rodillazo', nombre:'Rodillazo (muay thai)', arquetipo:'rodillazo', categoria:'marcial', tipo:'reps', reps:12, duracion:40, lado:true,
   instrucciones:['Tira las caderas al frente','Sube la rodilla con fuerza','Manos cubriendo la guardia'],
   respiracion:'Exhala fuerte en cada rodillazo.'},
  {id:'equilibrio_grulla', nombre:'Equilibrio de la grulla', arquetipo:'grulla', categoria:'marcial', tipo:'tiempo', duracion:30, lado:true,
   instrucciones:['Sobre una pierna, rodilla arriba','Fija la mirada en un punto','Brazos en guardia, respira'],
   respiracion:'Respiración lenta para estabilizar.'},

  /* ---------------- VUELTA A LA CALMA ---------------- */
  {id:'estira_cuadriceps', nombre:'Estiramiento de cuádriceps', arquetipo:'cuadriceps', categoria:'calma', tipo:'tiempo', duracion:30, lado:true,
   instrucciones:['De pie, lleva el talón al glúteo','Sujeta el pie, rodillas juntas','Sin forzar la rodilla'],
   respiracion:'Exhala y relaja en el estiramiento.'},
  {id:'estira_isquios', nombre:'Estiramiento de isquiotibiales', arquetipo:'isquios', categoria:'calma', tipo:'tiempo', duracion:30,
   instrucciones:['Inclínate hacia los pies con espalda larga','Llega hasta donde sientas tensión, no dolor','Suelta el cuello'],
   respiracion:'Respira hondo y gana rango al exhalar.'},
  {id:'estira_lateral', nombre:'Estiramiento lateral', arquetipo:'estiramiento', categoria:'calma', tipo:'tiempo', duracion:30, lado:true,
   instrucciones:['Brazo arriba, inclínate al lado opuesto','Alarga el costado','Cadera estable'],
   respiracion:'Inhala al alargar, exhala al ceder.'},
  {id:'estira_hombros', nombre:'Estiramiento de hombros', arquetipo:'hombros', categoria:'calma', tipo:'tiempo', duracion:25, lado:true,
   instrucciones:['Cruza el brazo frente al pecho','Tira suave con el otro brazo','Hombros relajados'],
   respiracion:'Respiración tranquila.'},
  {id:'mokuso', nombre:'Mokusō (respiración final)', arquetipo:'respiracion', categoria:'calma', tipo:'tiempo', duracion:60,
   instrucciones:['Sentado o de pie, ojos cerrados','Inhala 4 tiempos, exhala 6','Vacía la mente, cierra la práctica'],
   respiracion:'Sigue el anillo: crece al inhalar, se reduce al exhalar.'},
  {id:'mokuso_inicial', nombre:'Rei y mokusō (apertura)', arquetipo:'respiracion', categoria:'calma', tipo:'tiempo', duracion:30,
   instrucciones:['Saluda (rei) e inclina el tronco','De pie o en seiza, ojos cerrados','Deja fuera el día: empieza la clase'],
   respiracion:'Respira hondo y lento, prepara la mente.'},

  /* ================= NUEVOS · SUELO Y ACONDICIONAMIENTO ================= */
  {id:'burpees', nombre:'Burpees', arquetipo:'burpee', categoria:'piernas', tipo:'reps', reps:10, duracion:45,
   instrucciones:['Baja a cuclillas y apoya las manos','Lleva los pies atrás a plancha','Vuelve y salta arriba con palmada'],
   respiracion:'Exhala en el salto, ritmo que puedas sostener.'},
  {id:'sentadilla_salto', nombre:'Sentadilla con salto', arquetipo:'jumpsquat', categoria:'piernas', tipo:'reps', reps:12, duracion:40,
   instrucciones:['Baja en sentadilla','Sube explotando en salto','Cae suave y vuelve a bajar'],
   respiracion:'Exhala en el salto.'},
  {id:'zancada_lateral', nombre:'Zancada lateral', arquetipo:'sidelunge', categoria:'piernas', tipo:'reps', reps:12, duracion:40, lado:true,
   instrucciones:['Da un paso amplio al lado','Flexiona esa rodilla, la otra recta','Empuja para volver al centro'],
   respiracion:'Inhala al bajar, exhala al volver.'},
  {id:'patinador', nombre:'Saltos de patinador', arquetipo:'skater', categoria:'piernas', tipo:'tiempo', duracion:40,
   instrucciones:['Salta lateral de un pie al otro','Cruza la pierna libre por detrás','Aterriza suave y estable'],
   respiracion:'Respiración constante y ágil.'},
  {id:'patada_gluteo', nombre:'Patada de glúteo (cuadrupedia)', arquetipo:'birddog', categoria:'piernas', tipo:'reps', reps:15, duracion:35, lado:true,
   instrucciones:['En cuadrupedia, espalda neutra','Lleva el talón hacia el techo','Aprieta el glúteo arriba'],
   respiracion:'Exhala al subir la pierna.'},
  {id:'elevacion_piernas', nombre:'Elevación de piernas', arquetipo:'legraise', categoria:'core', tipo:'reps', reps:14, duracion:40,
   instrucciones:['Boca arriba, piernas rectas','Súbelas hasta la vertical','Baja lento sin tocar el suelo','Lumbar pegada al piso'],
   respiracion:'Exhala al subir las piernas.'},
  {id:'giro_ruso', nombre:'Giro ruso', arquetipo:'twist', categoria:'core', tipo:'tiempo', duracion:40,
   instrucciones:['Sentado, tronco atrás, pies elevados','Gira llevando las manos a cada lado','Controla, no te dejes caer'],
   respiracion:'Exhala en cada giro.'},
  {id:'superman', nombre:'Superman (lumbar)', arquetipo:'superman', categoria:'core', tipo:'reps', reps:14, duracion:35,
   instrucciones:['Boca abajo, brazos al frente','Eleva brazos y piernas a la vez','Pausa arriba y baja con control'],
   respiracion:'Exhala al elevar.'},
  {id:'bird_dog', nombre:'Bird-dog', arquetipo:'birddog', categoria:'core', tipo:'reps', reps:12, duracion:40, lado:true,
   instrucciones:['En cuadrupedia, espalda firme','Extiende brazo y pierna contrarios','Mantén un segundo y alterna'],
   respiracion:'Exhala al extender.'},
  {id:'toques_hombro', nombre:'Toques de hombro en plancha', arquetipo:'plancha', categoria:'core', tipo:'tiempo', duracion:40,
   instrucciones:['Plancha alta, pies algo abiertos','Toca el hombro contrario con la mano','La cadera quieta, sin balanceo'],
   respiracion:'Respiración continua.'},
  {id:'flexion_diamante', nombre:'Flexiones diamante (tríceps)', arquetipo:'flexion', categoria:'superior', tipo:'reps', reps:10, duracion:40,
   instrucciones:['Manos juntas formando un rombo','Baja el pecho hacia las manos','Codos cerca del cuerpo'],
   respiracion:'Inhala bajando, exhala subiendo.'},
  {id:'flexion_pike', nombre:'Flexiones pica (hombros)', arquetipo:'pike', categoria:'superior', tipo:'reps', reps:10, duracion:40,
   instrucciones:['Cadera alta en forma de V invertida','Baja la coronilla hacia el suelo','Empuja con los hombros'],
   respiracion:'Inhala bajando, exhala empujando.'},

  /* --- Acondicionamiento de clase (series largas, como en el dojo) --- */
  {id:'elevacion_piernas_30', nombre:'Elevación de piernas ×30', arquetipo:'legraise', categoria:'core', tipo:'reps', reps:30, duracion:80,
   instrucciones:['Boca arriba, espalda pegada al suelo','Sube las piernas rectas hasta la vertical','Bájalas lento SIN que toquen el suelo','Si la lumbar se arquea, manos bajo la cadera'],
   respiracion:'Exhala al subir, inhala al bajar.'},
  {id:'flexiones_30', nombre:'Flexiones ×30', arquetipo:'flexion', categoria:'superior', tipo:'reps', reps:30, duracion:80,
   instrucciones:['Cuerpo recto como tabla, núcleo firme','Ritmo constante, sin pausas largas arriba','Si no llegas, termina las que falten con rodillas apoyadas'],
   respiracion:'Inhala bajando, exhala empujando.'},

  /* ================= KARATE (空手) ================= */
  {id:'kizami_zuki', nombre:'Kizami-zuki (puño directo)', arquetipo:'puno', categoria:'marcial', tipo:'reps', reps:15, duracion:35, lado:true, arte:'karate',
   instrucciones:['Desde zenkutsu-dachi, guardia firme','Golpe recto del brazo adelantado','Retrae rápido a la cadera/guardia','Hombros relajados'],
   respiracion:'Exhala corto (kiai) en el impacto.'},
  {id:'gyaku_zuki', nombre:'Gyaku-zuki (puño inverso)', arquetipo:'puno', categoria:'marcial', tipo:'reps', reps:15, duracion:35, lado:true, arte:'karate',
   instrucciones:['Golpe del brazo atrasado','Gira la cadera para dar potencia','La otra mano vuelve a la cadera (hikite)'],
   respiracion:'Exhala con fuerza al golpear.'},
  {id:'age_uke', nombre:'Age-uke (bloqueo ascendente)', arquetipo:'bloqueo', categoria:'marcial', tipo:'reps', reps:12, duracion:35, lado:true, arte:'karate',
   instrucciones:['Antebrazo sube frente a la frente','Protege la cabeza, codo no muy alto','Coordina con hikite'],
   respiracion:'Exhala en el bloqueo.'},
  {id:'soto_uke', nombre:'Soto-uke (bloqueo exterior)', arquetipo:'bloqueo', categoria:'marcial', tipo:'reps', reps:12, duracion:35, lado:true, arte:'karate',
   instrucciones:['Antebrazo barre de fuera hacia dentro','Codo a 90°, puño a la altura del hombro','Cadera acompaña el bloqueo'],
   respiracion:'Exhala al bloquear.'},
  {id:'mawashi_geri', nombre:'Mawashi-geri (patada circular)', arquetipo:'roundhouse', categoria:'marcial', tipo:'reps', reps:10, duracion:40, lado:true, arte:'karate',
   instrucciones:['Sube la rodilla de lado','Gira la cadera y látigo con el empeine','Recoge la pierna y baja en guardia'],
   respiracion:'Exhala en el latigazo.'},
  {id:'kata_basico', nombre:'Kata (Taikyoku / el que practiques)', arquetipo:'avance_puno', categoria:'marcial', tipo:'tiempo', duracion:90, arte:'karate', espacio:true,
   instrucciones:['Ejecuta tu kata de principio a fin','Cada técnica con intención: bloqueo, golpe, giro','Posturas bajas y estables, mirada donde golpeas','Si el espacio es corto, acorta los desplazamientos'],
   respiracion:'Kiai en los puntos marcados del kata.'},
  {id:'kumite_sombra', nombre:'Kumite de sombra (sparring)', arquetipo:'puno', categoria:'marcial', tipo:'tiempo', duracion:90, arte:'karate',
   instrucciones:['Imagina un oponente frente a ti','Combina desplazamiento, bloqueo y contraataque','Entra y sal de la distancia, no te quedes plantado','Guardia siempre arriba'],
   respiracion:'Exhala en cada técnica, kiai al rematar.'},

  /* ================= MUAY THAI (มวยไทย) ================= */
  {id:'jab_cross', nombre:'Jab–cross (sombra)', arquetipo:'puno', categoria:'marcial', tipo:'tiempo', duracion:45, arte:'muaythai',
   instrucciones:['Guardia alta, mentón abajo','Jab de la mano adelantada, luego cross girando cadera','Vuelve siempre a la guardia'],
   respiracion:'Exhala en cada golpe, suelto.'},
  {id:'gancho', nombre:'Ganchos (hooks)', arquetipo:'gancho', categoria:'marcial', tipo:'tiempo', duracion:40, arte:'muaythai',
   instrucciones:['Codo a 90°, gira el torso','Pivota el pie del mismo lado','Alterna gancho izquierdo y derecho'],
   respiracion:'Exhala en cada gancho.'},
  {id:'codo_mt', nombre:'Codazos (sok)', arquetipo:'codo', categoria:'marcial', tipo:'reps', reps:12, duracion:35, lado:true, arte:'muaythai',
   instrucciones:['Levanta el codo y corta en diagonal','Gira la cadera y el hombro','Mano protegiendo el mentón'],
   respiracion:'Exhala fuerte en el corte.'},
  {id:'teep', nombre:'Teep (patada frontal de empuje)', arquetipo:'patada', categoria:'marcial', tipo:'reps', reps:10, duracion:40, lado:true, arte:'muaythai',
   instrucciones:['Sube la rodilla y empuja con la planta','Empuja la cadera al frente','Recoge y baja en guardia'],
   respiracion:'Exhala en el empuje.'},
  {id:'low_kick', nombre:'Low kick (patada baja)', arquetipo:'roundhouse', categoria:'marcial', tipo:'reps', reps:10, duracion:40, lado:true, arte:'muaythai',
   instrucciones:['Gira sobre el pie de apoyo','Golpea con la espinilla a la altura del muslo','Todo el cuerpo acompaña el giro'],
   respiracion:'Exhala con el impacto.'},
  {id:'sombra_mt', nombre:'Sombra libre (round)', arquetipo:'puno', categoria:'marcial', tipo:'tiempo', duracion:120, arte:'muaythai',
   instrucciones:['Un round de sombra: mezcla las ocho armas','Puños, codos, rodillas y patadas encadenados','Muévete todo el round, imagina el rival','Vuelve a la guardia tras cada combinación'],
   respiracion:'Exhala sonoro en cada golpe.'},

  /* ================= TAEKWONDO (태권도) ================= */
  {id:'dollyo_chagi', nombre:'Dollyo chagi (patada circular)', arquetipo:'roundhouse', categoria:'marcial', tipo:'reps', reps:10, duracion:40, lado:true, arte:'taekwondo',
   instrucciones:['Sube la rodilla','Gira la cadera y golpea con el empeine','Recoge rápido, mantén la guardia'],
   respiracion:'Exhala en el golpe.'},
  {id:'dwit_chagi', nombre:'Dwit chagi (patada hacia atrás)', arquetipo:'patada_atras', categoria:'marcial', tipo:'reps', reps:8, duracion:40, lado:true, arte:'taekwondo',
   instrucciones:['Mira por encima del hombro','Empuja el talón recto hacia atrás','Mantén el equilibrio del torso'],
   respiracion:'Exhala en la extensión.'},
  {id:'naeryo_chagi', nombre:'Naeryo chagi (patada de hacha)', arquetipo:'patada_hacha', categoria:'marcial', tipo:'reps', reps:8, duracion:40, lado:true, arte:'taekwondo',
   instrucciones:['Sube la pierna lo más alto posible','Deja caer el talón hacia abajo','Control en la bajada'],
   respiracion:'Exhala al dejar caer.'},
  {id:'velocidad_patadas', nombre:'Patadas rápidas (velocidad)', arquetipo:'patada', categoria:'marcial', tipo:'tiempo', duracion:35, lado:true, arte:'taekwondo',
   instrucciones:['Misma pierna, patadas frontales encadenadas','Prioriza velocidad y recogida','Rodilla siempre alta'],
   respiracion:'Respiración corta y rítmica.'},
  {id:'sparring_tkd', nombre:'Sparring de sombra (kyorugi)', arquetipo:'patada', categoria:'marcial', tipo:'tiempo', duracion:90, arte:'taekwondo',
   instrucciones:['Imagina el combate: entra, patea y sal','Encadena patadas dobles y cambios de guardia','Rebota ligero sobre las puntas','Manos protegiendo el torso y la cara'],
   respiracion:'Exhala corto en cada patada.'},

  /* ================= KENJUTSU (剣術) ================= */
  {id:'suburi_men', nombre:'Suburi men (corte vertical)', arquetipo:'espada', categoria:'marcial', tipo:'reps', reps:15, duracion:45, arte:'kenjutsu',
   instrucciones:['Sube el sable (bokken) sobre la cabeza','Corta recto hasta la altura de la frente','Detén el filo con control, no bajes de más','Pies en seiza/postura estable'],
   respiracion:'Exhala en cada corte.'},
  {id:'kesa_giri', nombre:'Kesa giri (corte diagonal)', arquetipo:'espada', categoria:'marcial', tipo:'reps', reps:12, duracion:45, lado:true, arte:'kenjutsu',
   instrucciones:['Corte diagonal de hombro a cadera opuesta','Acompaña con la cadera','Filo recto en la trayectoria'],
   respiracion:'Exhala en el corte.'},
  {id:'do_giri', nombre:'Dō giri (corte horizontal)', arquetipo:'espada', categoria:'marcial', tipo:'reps', reps:12, duracion:40, lado:true, arte:'kenjutsu',
   instrucciones:['Corte horizontal a la altura del costado','Gira la cadera, brazos extendidos','Mantén la línea del filo'],
   respiracion:'Exhala al cortar.'},
  {id:'chudan_kamae', nombre:'Chūdan no kamae (guardia media)', arquetipo:'kamae', categoria:'marcial', tipo:'tiempo', duracion:40, arte:'kenjutsu',
   instrucciones:['Punta del sable hacia la garganta del rival','Codos suaves, peso centrado','Mirada lejana (enzan no metsuke)'],
   respiracion:'Respira al hara, quietud atenta (zanshin).'},
  {id:'ashi_sabaki', nombre:'Ashi sabaki (desplazamientos)', arquetipo:'kamae', categoria:'marcial', tipo:'tiempo', duracion:40, arte:'kenjutsu',
   instrucciones:['Desde kamae, avanza y retrocede (okuri-ashi)','Desliza los pies, no los cruces','Mantén la guardia y la postura'],
   respiracion:'Respiración fluida con el paso.'},

  /* ============ TÉCNICAS CON ESPACIO (≈2 m libres) ============ */
  {id:'oi_zuki', nombre:'Oi-zuki (puño avanzando)', arquetipo:'avance_puno', categoria:'marcial', tipo:'reps', reps:10, duracion:45, lado:true, arte:'karate', espacio:true,
   instrucciones:['Da un paso largo entrando en zenkutsu-dachi','El puño sale con el pie que avanza','Cadera y puño llegan a la vez','Vuelve atrás a la guardia'],
   respiracion:'Exhala (kiai) al asentar el paso y el puño.'},
  {id:'mikazuki_geri', nombre:'Mikazuki geri (patada creciente)', arquetipo:'creciente', categoria:'marcial', tipo:'reps', reps:8, duracion:40, lado:true, arte:'karate', espacio:true,
   instrucciones:['La pierna sube por fuera y barre en arco hacia dentro','Golpea con la planta del pie','La cadera dibuja la media luna','Baja controlado a la guardia'],
   respiracion:'Exhala en el barrido.'},
  {id:'twio_ap_chagi', nombre:'Twio ap chagi (patada con salto)', arquetipo:'patada_salto', categoria:'marcial', tipo:'reps', reps:8, duracion:45, lado:true, arte:'taekwondo', espacio:true,
   instrucciones:['Flexiona y salta impulsando la rodilla contraria','Patea al frente en el aire','Aterriza suave con las rodillas flexionadas','Necesitas techo y espacio libres'],
   respiracion:'Exhala fuerte en la patada.'},
  {id:'khao_loi', nombre:'Khao loi (rodillazo saltando)', arquetipo:'rodillazo_salto', categoria:'marcial', tipo:'reps', reps:8, duracion:45, lado:true, arte:'muaythai', espacio:true,
   instrucciones:['Da un paso y salta hacia el objetivo','Clava la rodilla arriba con la cadera al frente','Los brazos tiran hacia abajo (agarre)','Cae estable en guardia'],
   respiracion:'Exhala explosivo al saltar.'},
  {id:'zancada_caminando', nombre:'Zancada caminando', arquetipo:'zancada_andando', categoria:'piernas', tipo:'reps', reps:12, duracion:50, espacio:true,
   instrucciones:['Paso largo al frente y baja la rodilla trasera','Empuja y enlaza el paso con la otra pierna','Tronco erguido todo el recorrido','Ida y vuelta por tu pasillo'],
   respiracion:'Inhala al bajar, exhala al empujar.'},
  {id:'footwork', nombre:'Desplazamientos en guardia (footwork)', arquetipo:'desplazamiento', categoria:'marcial', tipo:'tiempo', duracion:40, espacio:true,
   instrucciones:['Guardia alta, rodillas flexionadas','Desplázate de lado a lado sin cruzar los pies','El pie que guía sale primero, el otro lo sigue','Mantén la distancia del suelo constante'],
   respiracion:'Respiración rítmica, ligera.'},
];

/* índice rápido por id */
const POR_ID = Object.fromEntries(BIBLIOTECA.map(e=>[e.id,e]));

/* ---------------- RUTINAS PREDEFINIDAS ----------------
   Cada rutina se define en BLOQUES con nº de series (rep),
   igual que una clase real: el calentamiento en circuito,
   la fuerza en 2 series, técnica y calma a 1 vuelta.            */
const RUTINAS = {
  completa:{
    nombre:'Clase completa', kanji:'道', dur:'≈ 50 min',
    desc:'La sesión de dojo entera: calentar, fortalecer, técnica y calma.',
    bloques:[
      {titulo:'Calentamiento', rep:2, ids:['trote','rodillas','talones','jumping']},
      {titulo:'Movilidad',     rep:1, ids:['mov_articular','circulo_cadera','gato_camello','balanceo_pierna']},
      {titulo:'Piernas (2 series)', rep:2, ids:['sentadilla','zancada','puente_gluteo','kiba_dachi']},
      {titulo:'Piernas extra',  rep:1, ids:['zancada_caminando','elevacion_lateral_pierna','gemelos']},
      {titulo:'Tren superior (2 series)', rep:2, ids:['flexiones','press_hombro','curl_biceps','remo','fondos_silla']},
      {titulo:'Core (2 series)', rep:2, ids:['plancha','escaladores','abdominales','bicicleta']},
      {titulo:'Técnica marcial', rep:1, ids:['patada_frontal','patada_lateral','rodillazo','equilibrio_grulla']},
      {titulo:'Vuelta a la calma', rep:1, ids:['estira_cuadriceps','estira_isquios','estira_lateral','estira_hombros','mokuso']},
    ],
  },
  express:{
    nombre:'Express', kanji:'速', dur:'≈ 22 min',
    desc:'Poco tiempo: calentamiento, fuerza esencial y estiramiento.',
    bloques:[
      {titulo:'Calentamiento', rep:1, ids:['trote','rodillas','jumping','mov_articular']},
      {titulo:'Fuerza (2 series)', rep:2, ids:['sentadilla','zancada','flexiones','press_hombro']},
      {titulo:'Core (2 series)', rep:2, ids:['plancha','escaladores','abdominales']},
      {titulo:'Técnica y calma', rep:1, ids:['patada_frontal','equilibrio_grulla','estira_isquios','estira_cuadriceps','mokuso']},
    ],
  },
  sorprende:{
    nombre:'Sorpréndeme', kanji:'乱', dur:'≈ 35–45 min',
    desc:'Una clase variada generada al azar. Distinta cada vez.',
    generar:true,
  },

  /* ============ ENTRENAMIENTO POR DISCIPLINA ============ */
  karate:{
    arte:true, nombre:'Karate', kanji:'空手', dur:'≈ 60 min',
    desc:'Clase de dojo completa: carrera, junbi undō, acondicionamiento, kihon, kata y kumite.',
    bloques:[
      /* 0. Apertura: rei y mokusō, como en el dojo */
      {titulo:'Saludo y mokusō', rep:1, ids:['mokuso_inicial']},
      /* 1. Carrera inicial (~10 min): entrar en calor como al empezar la clase */
      {titulo:'Carrera inicial (≈10 min)', rep:2, ids:['trote_largo','rodillas','talones','jumping']},
      /* 2. Junbi undō: soltar cada articulación — tobillos, rodillas, cadera, cuello, brazos */
      {titulo:'Junbi undō · Movilidad articular', rep:1, ids:['rot_tobillos','rot_rodillas','circulo_cadera','rot_cuello','circulo_brazos','balanceo_pierna']},
      /* 3. Acondicionamiento: exigir el cuerpo antes de la técnica */
      {titulo:'Acondicionamiento', rep:1, ids:['elevacion_piernas_30','flexiones_30','plancha']},
      /* 4. Kihon: técnica básica */
      {titulo:'Kihon · Puños (zuki)', rep:2, ids:['kizami_zuki','gyaku_zuki']},
      {titulo:'Kihon · Bloqueos (uke)', rep:2, ids:['age_uke','soto_uke']},
      {titulo:'Kihon · Patadas (geri)', rep:2, ids:['patada_frontal','patada_lateral','mawashi_geri']},
      {titulo:'Kihon idō (con espacio)', rep:1, ids:['oi_zuki','mikazuki_geri']},
      /* 5. Kata y kumite: aplicar la técnica */
      {titulo:'Kata', rep:2, ids:['kata_basico']},
      {titulo:'Kumite (sparring de sombra)', rep:2, ids:['kumite_sombra']},
      {titulo:'Postura (dachi)', rep:1, ids:['kiba_dachi','equilibrio_grulla']},
      {titulo:'Vuelta a la calma', rep:1, ids:['estira_cuadriceps','estira_isquios','estira_hombros','mokuso']},
    ],
  },
  muaythai:{
    arte:true, nombre:'Muay Thai', kanji:'ムエタイ', dur:'≈ 45 min',
    desc:'Sesión de gimnasio tailandés: carrera, cuerda, sombra, las ocho armas y acondicionamiento.',
    bloques:[
      {titulo:'Carrera y cuerda', rep:1, ids:['trote_largo','cuerda','rodillas','jumping']},
      {titulo:'Movilidad articular', rep:1, ids:['rot_cuello','circulo_brazos','circulo_cadera','rot_tobillos']},
      {titulo:'Footwork', rep:1, ids:['footwork']},
      {titulo:'Manos', rep:3, ids:['jab_cross','gancho']},
      {titulo:'Codos y rodillas', rep:2, ids:['codo_mt','rodillazo','khao_loi']},
      {titulo:'Patadas', rep:3, ids:['teep','low_kick']},
      {titulo:'Sparring de sombra', rep:2, ids:['sombra_mt']},
      {titulo:'Acondicionamiento / clinch', rep:1, ids:['flexiones_30','elevacion_piernas_30','giro_ruso','escaladores']},
      {titulo:'Vuelta a la calma', rep:1, ids:['estira_isquios','estira_lateral','mokuso']},
    ],
  },
  taekwondo:{
    arte:true, nombre:'Taekwondo', kanji:'跆拳道', dur:'≈ 37 min',
    desc:'Carrera, movilidad, patadas de precisión, altura y velocidad, y kyorugi.',
    bloques:[
      {titulo:'Carrera inicial', rep:1, ids:['trote_largo','rodillas','jumping']},
      {titulo:'Movilidad articular', rep:1, ids:['rot_tobillos','rot_rodillas','circulo_cadera','rot_cuello','balanceo_pierna']},
      {titulo:'Acondicionamiento', rep:1, ids:['elevacion_piernas_30','sentadilla_salto']},
      {titulo:'Patadas base', rep:2, ids:['patada_frontal','patada_lateral']},
      {titulo:'Patadas avanzadas', rep:2, ids:['dollyo_chagi','dwit_chagi','naeryo_chagi']},
      {titulo:'Salto y velocidad', rep:1, ids:['twio_ap_chagi','velocidad_patadas']},
      {titulo:'Kyorugi (sparring de sombra)', rep:2, ids:['sparring_tkd']},
      {titulo:'Equilibrio', rep:1, ids:['equilibrio_grulla']},
      {titulo:'Vuelta a la calma', rep:1, ids:['estira_cuadriceps','estira_isquios','mokuso']},
    ],
  },
  kenjutsu:{
    arte:true, nombre:'Kenjutsu', kanji:'剣術', dur:'≈ 25 min',
    desc:'Sable: cortes (suburi), guardia y desplazamientos. Usa un bokken o un palo.',
    bloques:[
      {titulo:'Calentamiento', rep:1, ids:['trote_largo','mov_articular','circulo_cadera']},
      {titulo:'Movilidad de brazos y muñecas', rep:1, ids:['circulo_brazos','rot_cuello']},
      {titulo:'Postura y pasos', rep:1, ids:['chudan_kamae','ashi_sabaki']},
      {titulo:'Suburi (cortes)', rep:4, ids:['suburi_men']},
      {titulo:'Cortes', rep:3, ids:['kesa_giri','do_giri']},
      {titulo:'Postura y fuerza', rep:1, ids:['kiba_dachi','plancha']},
      {titulo:'Vuelta a la calma', rep:1, ids:['estira_hombros','estira_lateral','mokuso']},
    ],
  },
};

/* Aplana bloques (con sus series) a una lista plana de ids */
function aplanarBloques(bloques){
  const out=[];
  bloques.forEach(b=>{ for(let r=0;r<b.rep;r++) out.push(...b.ids); });
  return out;
}

/* Resuelve la lista de ids de una rutina (predefinida o generada) */
function idsDeRutina(r){
  if(r.generar) return generarRutinaSorpresa();
  if(r.bloques) return aplanarBloques(r.bloques);
  return r.ejercicios || [];
}

/* Genera una clase variada (~60 min) eligiendo al azar por bloque */
function generarRutinaSorpresa(){
  const elige = (cat,n)=>{
    const pool = BIBLIOTECA.filter(e=>e.categoria===cat).map(e=>e.id);
    const out=[];
    while(out.length<n && pool.length){
      const i = Math.floor(rngDojo()*pool.length);
      out.push(pool.splice(i,1)[0]);
    }
    return out;
  };
  return aplanarBloques([
    {rep:2, ids:elige('calentamiento',3)},
    {rep:1, ids:elige('movilidad',3)},
    {rep:2, ids:elige('piernas',3)},
    {rep:2, ids:elige('superior',3)},
    {rep:2, ids:elige('core',3)},
    {rep:1, ids:elige('marcial',3)},
    {rep:1, ids:[...elige('calma',3),'mokuso']},
  ]);
}

/* PRNG simple sembrado con la hora actual (evita Date.now en otros módulos) */
let _semilla = (new Date().getTime() % 100000) + 1;
function rngDojo(){ _semilla = (_semilla*1103515245 + 12345) & 0x7fffffff; return _semilla/0x7fffffff; }
