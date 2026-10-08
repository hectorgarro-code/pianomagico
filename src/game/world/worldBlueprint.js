/**
 * worldBlueprint.js
 * Plano técnico maestro y fuente central de verdad del diseño del mundo "Valle de las Notas".
 * Arquitectura Data-Driven: Desacopla el DISEÑO conceptual de la GENERACIÓN y el RENDERIZADO.
 * AUDITORÍA NARRATIVA, VISUAL Y DE COMPOSICIÓN (100% KayKit Real, Cero Assets Inventados).
 */

export const WORLD_BLUEPRINT = {
  world: {
    id: 'valle_de_las_notas',
    name: 'Valle de las Notas',
    narrativeCore: 'Antiguo valle musical y santuario armónico donde naturaleza, arquitectura y sonido forman una sola unidad orgánica.',
    coordinateSystem: {
      origin: 'PLAZA_DE_LAS_NOTAS (Punto de Spawn = [0, 0, 0])',
      axis: {
        north: '-Z (Hacia el Observatorio Musical en la Cúspide)',
        south: '+Z (Hacia los límites seguros del Spawn y mirador sur)',
        west: '-X (Hacia el Río del Ritmo y el Valle Bajo)',
        east: '+X (Hacia la Montaña de las Melodías y Terrazas Altas)',
        up: '+Y (Elevación topográfica sobre el nivel del mar)'
      },
      boundingExtents: {
        minX: -65,
        maxX: 65,
        minZ: -110,
        maxZ: 25,
        approximateDiameter: 140
      }
    }
  },

  /**
   * MATRIZ DE COMPOSICIÓN Y ESPECIFICACIÓN POR REGIÓN
   * Define la identidad, composición espacial (Macro/Medio/Micro), transiciones y assets exactos permitidos.
   */
  regions: [
    {
      id: 'PLAZA_DE_LAS_NOTAS',
      name: 'Plaza de las Notas',
      type: 'HUB_SPAWN',
      pedagogicalFunction: 'Familiarización de controles (WASD, salto, cámara orbital) y afinación sonora.',
      approxCenter: { x: 0, z: 0 },
      boundsRadius: 12,
      relativeScale: {
        width: 'Media',
        depth: 'Media',
        density: 'Baja-Media (Amplio despeje)',
        navigationDifficulty: 'Muy Fácil (Plano y simétrico)',
        openness: 'Muy Amplia'
      },
      elevationProfile: {
        baseY: 0.0,
        variance: 0.05,
        style: 'Planicie enlosada con losas de piedra pulida al nivel del césped'
      },
      narrativeTone: 'El pasado armónico, seguro y protegido. El punto de partida de la civilización musical.',
      compositionTiers: {
        macro: 'Plataforma circular aplanada en el centro del valle, con desniveles suaves en su perímetro.',
        medio: 'Pabellón abierto enmarcado por 4 columnas dóricas de piedra, camino empedrado norte y bancos laterales.',
        micro: 'Faroles apagados, estandartes heráldicos azules oscilando y pequeñas matas florales en las junturas de las losas.'
      },
      negativeSpace: {
        openRadius: 9.0,
        restriction: 'Prohibido colocar vegetación densa o rocas dentro de la rotonda central para garantizar orientación inicial inmediata.'
      },
      permittedAssets: {
        flooring: ['/models/props/Assets/gltf/floor_tile_large.gltf', '/models/props/floor_tile.glb'],
        columns: ['/models/props/Assets/gltf/column.gltf', '/models/props/pillar.glb', '/models/props/Assets/gltf/pillar_decorated.gltf'],
        furniture: ['/models/props/Assets/gltf/chair.gltf', '/models/props/Assets/gltf/bench.gltf'],
        banners: ['/models/props/Assets/gltf/banner_blue.gltf'],
        foliage: ['/models/props/Assets/gltf/Bush_1_A_Color1.gltf', '/models/props/Assets/gltf/Tree_2_A_Color1.gltf']
      },
      forbiddenAssets: [
        'Escombros de ruinas (rubble)',
        'Muros de calabozo cerrados',
        'Árboles secos (Tree_Bare)',
        'Armas o elementos de combate'
      ],
      transitions: {
        north: 'Transición hacia el Bosque: El pavimento de losas se dispersa en piedras sueltas; la hierba invade los bordes y aparecen coníferas medianas.',
        south: 'Límite seguro: Borde de arbustos bajos que frenan visualmente la salida del valle.'
      }
    },

    {
      id: 'BOSQUE_DE_LAS_NOTAS',
      name: 'Bosque de las Notas',
      type: 'FOREST_ADVENTURE',
      pedagogicalFunction: 'Notas Individuales (Identificación tonal de Do, Re, Mi, Fa, Sol).',
      // Plaza approved composition supersedes preliminary forest coordinates.
      approxCenter: { x: 4, z: -35 },
      boundsRadius: 30,
      macroConnections: {
        plazaEntry: [10,-19.5], clearingOne: [12,-28], clearingTwo: [-2,-39],
        echoGrottoExit: [-12,-39], riverFutureExit: [-8,-46], mountainFutureExit: [5,-46],
        status: 'BOSQUE-B macro human approved; BOSQUE-C medium draft; exits reserve space only'
      },
      relativeScale: {
        width: 'Amplia',
        depth: 'Profunda',
        density: 'Media en senderos, Alta en bordes',
        navigationDifficulty: 'Fácil con senderos orgánicos curvados',
        openness: 'Claros de luz alternados con arboledas densas'
      },
      elevationProfile: {
        baseY: 0.6,
        variance: 1.4,
        style: 'Ondulaciones suaves con claros abombados que reciben rayos solares'
      },
      narrativeTone: 'La naturaleza ha reconquistado el valle. Pequeñas losas de piedra cubiertas de musgo revelan la presencia del antiguo santuario.',
      compositionTiers: {
        macro: 'Masa forestal continua que canaliza la mirada a través de claros sucesivos.',
        medio: 'Agrupaciones de coníferas estilizadas (Tree_1) y árboles frondosos (Tree_2), claros enlosados para estaciones y troncos caídos.',
        micro: 'Arbustos en flor (Bush_1/Bush_2), rocas medianas redondeadas (Rock_1) en la base de los troncos y parches de hierba silvestre.'
      },
      negativeSpace: {
        openRadius: 5.5,
        restriction: 'El Claro del Árbol Maestro y la Bifurcación deben mantenerse libres de troncos atravesados para permitir maniobra de cámara.'
      },
      permittedAssets: {
        trees: [
          '/models/props/Assets/gltf/Tree_1_A_Color1.gltf',
          '/models/props/Assets/gltf/Tree_1_B_Color1.gltf',
          '/models/props/Assets/gltf/Tree_2_A_Color1.gltf',
          '/models/props/Assets/gltf/Tree_2_B_Color1.gltf',
          '/models/props/Assets/gltf/Tree_3_A_Color1.gltf'
        ],
        bushes: ['/models/props/Assets/gltf/Bush_1_A_Color1.gltf', '/models/props/Assets/gltf/Bush_2_A_Color1.gltf', '/models/props/Assets/gltf/Bush_3_A_Color1.gltf'],
        rocks: ['/models/props/Assets/gltf/Rock_1_A_Color1.gltf', '/models/props/Assets/gltf/Rock_1_B_Color1.gltf'],
        trunks: ['/models/props/Assets/gltf/trunk_large_A.gltf', '/models/props/Assets/gltf/trunk_medium_B.gltf'],
        heritage: ['/models/props/Assets/gltf/floor_tile_small_weeds_A.gltf', '/models/props/Assets/gltf/floor_tile_small_weeds_B.gltf'],
        stations: ['/models/props/chest_wood.glb', '/models/props/Assets/gltf/torch_lit.gltf', '/models/props/Assets/gltf/floor_tile_small_decorated.gltf']
      },
      forbiddenAssets: [
        'Muros de mampostería militar',
        'Mobiliario pesado de interior (camas, mesas largas)',
        'Estandartes de batalla'
      ],
      transitions: {
        west: 'Hacia el Río del Ritmo: El terreno desciende 1.5 metros, la tierra se humedece, aparecen guijarros lisos y cañas fluviales.',
        east: 'Hacia la Montaña: El terreno se endurece, afloran peñascos angulares, el camino se convierte en escalones de piedra y disminuyen los árboles frondosos.',
        northwest: 'Hacia la Gruta del Eco: Sendero disimulado tras un abeto ladeado y dos peñascos gemelos.'
      }
    },

    {
      id: 'GRUTA_DEL_ECO',
      name: 'Gruta del Eco',
      type: 'SECRET_CAVE',
      pedagogicalFunction: 'Recompensa de exploración, curiosidad auditiva y resonancia acústica.',
      approxCenter: { x: -16, z: -28 },
      boundsRadius: 6,
      relativeScale: {
        width: 'Estrecha',
        depth: 'Corta',
        density: 'Muy Alta (Rocas apiñadas)',
        navigationDifficulty: 'Oculta / Entrada disimulada',
        openness: 'Íntima y recogida'
      },
      elevationProfile: {
        baseY: -0.4,
        variance: 0.3,
        style: 'Depresión abrigada flanqueada por peñascos monolíticos'
      },
      narrativeTone: 'Un rincón olvidado de meditación donde los antiguos estudiantes escuchaban el eco de las piedras resonantes.',
      compositionTiers: {
        macro: 'Cavidad rocosa semicerrada formada por peñascos superpuestos de forma natural.',
        medio: 'Bloques de roca angular alta (Rock_3_R) cerrando las paredes y una peana pequeña de piedra rota.',
        micro: 'Vela encendida sobre piedra (candle_lit), cofre secreto de madera dorada y escombros pequeños (rubble_half).'
      },
      negativeSpace: {
        openRadius: 2.2,
        restriction: 'Solo el centro de interacción del cofre permanece libre de colisiones.'
      },
      permittedAssets: {
        rocks: ['/models/props/Assets/gltf/Rock_3_A_Color1.gltf', '/models/props/Assets/gltf/Rock_3_R_Color1.gltf', '/models/props/Assets/gltf/Rock_2_A_Color1.gltf'],
        details: ['/models/props/Assets/gltf/candle_lit.gltf', '/models/props/Assets/gltf/rubble_half.gltf', '/models/props/chest_gold.glb'],
        foliage: ['/models/props/Assets/gltf/Grass_1_A_Color1.gltf', '/models/props/Assets/gltf/Bush_4_A_Color1.gltf']
      },
      forbiddenAssets: [
        'Carteles indicadores o señales visibles desde el camino principal',
        'Árboles altos dentro de la cavidad',
        'Antorchas de fuego grande'
      ],
      transitions: {
        entrance: 'Hacia el Bosque: Salida estrecha entre arbustos espesos.',
        exit: 'Hacia el Río: Grieta en declive que da a una saliente de roca sobre el agua.'
      }
    },

    {
      id: 'RIO_DEL_RITMO',
      name: 'Río del Ritmo',
      type: 'WATERWAY_VALLEY',
      pedagogicalFunction: 'Ritmo, Compás y Coordinación (Pulsación constante y patrones de tempo).',
      approxCenter: { x: -26, z: -44 },
      boundsRadius: 16,
      relativeScale: {
        width: 'Estrecha longitudinal',
        depth: 'Muy Larga (Siguiendo el meandro fluvial)',
        density: 'Media (Rocas pulidas, juncos y muelles)',
        navigationDifficulty: 'Media (Cruces de agua, saltos y puentes)',
        openness: 'Abierta sobre el eje del cauce'
      },
      elevationProfile: {
        baseY: -1.4,
        variance: 0.6,
        style: 'Depresión fluvial natural excavada con orillas escalonadas'
      },
      narrativeTone: 'La música convertida en corriente incesante. La arquitectura de madera desgastada muestra el paso del tiempo y el ritmo constante del río.',
      compositionTiers: {
        macro: 'Cinta sinuosa de agua turquesa que divide el valle bajo en dos orillas navegables.',
        medio: 'Puente de madera robusto (floor_wood_large sobre columnas de piedra), muelle fluvial y cabaña del luthier.',
        micro: 'Barriles en grupos de compás (barrel_large, keg), cajas apiladas en el muelle y piedras de paso planas en el vado.'
      },
      negativeSpace: {
        openRadius: 4.5,
        restriction: 'El acceso al puente y la superficie del agua en el cruce de piedras deben mantenerse libres de follaje.'
      },
      permittedAssets: {
        woodStructures: ['/models/props/Assets/gltf/floor_wood_large.gltf', '/models/props/Assets/gltf/stairs_wood.gltf', '/models/props/Assets/gltf/barrier_column.gltf'],
        containers: ['/models/props/Assets/gltf/barrel_large.gltf', '/models/props/Assets/gltf/barrel_small_stack.gltf', '/models/props/Assets/gltf/crates_stacked.gltf', '/models/props/Assets/gltf/keg.gltf'],
        rocks: ['/models/props/Assets/gltf/Rock_1_A_Color1.gltf', '/models/props/Assets/gltf/Rock_1_D_Color1.gltf', '/models/props/Assets/gltf/Rock_2_C_Color1.gltf'],
        cabinWalls: ['/models/props/Assets/gltf/wall_doorway.gltf', '/models/props/Assets/gltf/wall_window_open.gltf', '/models/props/Assets/gltf/table_long.gltf', '/models/props/Assets/gltf/chair.gltf']
      },
      forbiddenAssets: [
        'Grandes murallas de castillo',
        'Pinos alpinos gigantescos en medio del agua',
        'Columnas de templo dóricas sobre el lecho del río'
      ],
      transitions: {
        north: 'Hacia las Ruinas: El cauce se estrecha en un cañón de piedra gris; escalones labrados ascienden hacia el atrio occidental de las Ruinas.',
        east: 'Hacia la Bifurcación: Sendero ribereño suave con faroles bajos que reconecta con el bosque.'
      }
    },

    {
      id: 'MONTANA_DE_LAS_MELODIAS',
      name: 'Montaña de las Melodías',
      type: 'ELEVATED_TERRACES',
      pedagogicalFunction: 'Melodías y Fraseo (Intervalos ascendentes/descendentes y secuencias tonales).',
      approxCenter: { x: 26, z: -44 },
      boundsRadius: 16,
      relativeScale: {
        width: 'Amplia escalonada',
        depth: 'Media-Larga',
        density: 'Baja-Media (Peñascos y abetos alpinos espaciados)',
        navigationDifficulty: 'Media (Rampas, escalinatas y cornisas)',
        openness: 'Muy Abierta (Vistas panorámicas hacia el valle)'
      },
      elevationProfile: {
        baseY: 4.8,
        variance: 3.2,
        style: 'Terrazas rocosas ascendentes con miradores en voladizo'
      },
      narrativeTone: 'La elevación donde la música adquiere altitud y vuelo. El eco entre las piedras enseña los saltos melódicos entre notas.',
      compositionTiers: {
        macro: 'Formación rocosa escalonada con tres niveles de terraza visibles desde todo el valle este.',
        medio: 'Rampas empedradas, abetos alpinos piramidales (Tree_1_A), grandes riscos de piedra angular y el Mirador del Maestro.',
        micro: 'Barandillas de protección rústica (barrier), estandarte heráldico azul ondeando al viento y peanas de roca pura.'
      },
      negativeSpace: {
        openRadius: 6.0,
        restriction: 'El Mirador del Maestro debe mantener 180 grados de arco frontal completamente libre de árboles para permitir la vista panorámica del valle.'
      },
      permittedAssets: {
        alpineTrees: ['/models/props/Assets/gltf/Tree_1_A_Color1.gltf', '/models/props/Assets/gltf/Tree_1_B_Color1.gltf', '/models/props/Assets/gltf/Tree_Bare_1_A_Color1.gltf'],
        mountainRocks: ['/models/props/Assets/gltf/Rock_3_A_Color1.gltf', '/models/props/Assets/gltf/Rock_3_R_Color1.gltf', '/models/props/Assets/gltf/Rock_2_A_Color1.gltf'],
        lookoutProps: ['/models/props/Assets/gltf/floor_tile_large.gltf', '/models/props/Assets/gltf/barrier_column.gltf', '/models/props/Assets/gltf/banner_blue.gltf', '/models/props/chest_gold.glb']
      },
      forbiddenAssets: [
        'Árboles frondosos de hoja ancha (Tree_2) a gran altura',
        'Muros de agua o elementos pantanosos',
        'Mobiliario doméstico cerrado'
      ],
      transitions: {
        northwest: 'Hacia las Ruinas: La cornisa desciende suavemente a través de un arco de piedra natural hacia el patio oriental de las Ruinas.',
        southwest: 'Hacia el Bosque: Rampa tendida entre dos laderas de roca que baja al claro de la bifurcación.'
      }
    },

    {
      id: 'RUINAS_DEL_GRAN_PENTAGRAMA',
      name: 'Ruinas del Gran Pentagrama',
      type: 'DUNGEON_CONVERGENCE',
      pedagogicalFunction: 'Canciones Completas (Fusión integral de notas, ritmo y melodía prolongada).',
      approxCenter: { x: 0, z: -68 },
      boundsRadius: 16,
      relativeScale: {
        width: 'Grande y estructurada',
        depth: 'Profunda',
        density: 'Alta (Mampostería, columnas, arcos y escombros)',
        navigationDifficulty: 'Fácil-Media (Patios ceremoniales y portones)',
        openness: 'Contenida entre muros antiguos de piedra'
      },
      elevationProfile: {
        baseY: 1.8,
        variance: 0.5,
        style: 'Podio ceremonial plano delimitado por murallas de piedra antigua'
      },
      narrativeTone: 'El corazón sagrado de la música antigua. El lugar donde los grandes maestros reunían todas las disciplinas en una sola sinfonía.',
      compositionTiers: {
        macro: 'Fortaleza abovedada en ruinas donde convergen las dos grandes rutas del valle.',
        medio: 'Portal monumental gótico (gate.glb), muros con vanos arqueados (wall_arched), columnata procesional y patio interior.',
        micro: 'Antorchas gemelas encendidas (torch_lit / torch_mounted), montículos de escombros de cantería (rubble_large) y estandartes carmesíes.'
      },
      negativeSpace: {
        openRadius: 6.5,
        restriction: 'El patio interior ceremonial frente al cofre maestro debe estar libre de vegetación alta para concentrar la atención en la canción.'
      },
      permittedAssets: {
        walls: [
          '/models/props/Assets/gltf/wall.gltf',
          '/models/props/Assets/gltf/wall_arched.gltf',
          '/models/props/Assets/gltf/wall_doorway.gltf',
          '/models/props/Assets/gltf/wall_window_open.gltf',
          '/models/props/Assets/gltf/wall_corner.gltf'
        ],
        pillars: ['/models/props/Assets/gltf/column.gltf', '/models/props/pillar.glb', '/models/props/gate.glb'],
        lighting: ['/models/props/Assets/gltf/torch_lit.gltf', '/models/props/Assets/gltf/torch_mounted.gltf'],
        rubble: ['/models/props/Assets/gltf/rubble_large.gltf', '/models/props/Assets/gltf/rubble_half.gltf'],
        banners: ['/models/props/Assets/gltf/banner_red.gltf', '/models/props/Assets/gltf/banner_shield_red.gltf']
      },
      forbiddenAssets: [
        'Árboles floridos dentro de los muros',
        'Mobiliario doméstico cotidiano (camas, mesas desordenadas)',
        'Estructuras de madera rústica de río'
      ],
      transitions: {
        south: 'Hacia las Rutas de Retorno: Dos accesos simétricos; al oeste el cañón que baja al río, al este el paso que baja de la montaña.',
        north: 'Hacia el Observatorio: Una escalinata monumental de piedra pulida que asciende directo hacia la cúspide final.'
      }
    },

    {
      id: 'OBSERVATORIO_MUSICAL',
      name: 'Observatorio Musical',
      type: 'SUMMIT_CLIMAX',
      pedagogicalFunction: 'Gran Desafío Final y Recital Maestro del Valle.',
      approxCenter: { x: 0, z: -92 },
      boundsRadius: 12,
      relativeScale: {
        width: 'Media',
        depth: 'Media',
        density: 'Media (Columnatas simétricas y pedestal monumental)',
        navigationDifficulty: 'Fácil (Destino final tras la cumbre)',
        openness: 'Máxima (Panorama circular de 360 grados)'
      },
      elevationProfile: {
        baseY: 8.5,
        variance: 0.1,
        style: 'Cúspide aplanada más alta del relieve del valle'
      },
      narrativeTone: 'La cúspide de la armonía. El lugar desde el que se contempla todo el camino recorrido mientras se ejecuta la obra magna.',
      compositionTiers: {
        macro: 'Pabellón ceremonial elevado que corona la silueta del horizonte norte.',
        medio: 'Columnata simétrica de piedra blanca pulida (column.gltf) sobre un zócalo ceremonial de losas (floor_tile_large).',
        micro: 'Antorchas doradas en postes, pedestal de mármol ceremonial y el cofre dorado de la maestría musical.'
      },
      negativeSpace: {
        openRadius: 8.0,
        restriction: 'El perímetro entero de la cumbre debe carecer de muros opacos o árboles que bloqueen la vista 360 grados del mundo.'
      },
      permittedAssets: {
        flooring: ['/models/props/Assets/gltf/floor_tile_large.gltf', '/models/props/floor_tile.glb'],
        columns: ['/models/props/Assets/gltf/column.gltf', '/models/props/Assets/gltf/pillar_decorated.gltf'],
        torches: ['/models/props/Assets/gltf/torch_lit.gltf'],
        chest: ['/models/props/chest_gold.glb'],
        banners: ['/models/props/Assets/gltf/banner_patternA_white.gltf']
      },
      forbiddenAssets: [
        'Muros rotos o escombros derruidos (representa preservación perfecta)',
        'Vegetación desordenada o árboles secos',
        'Cajas y barriles de desecho'
      ],
      transitions: {
        south: 'Hacia las Ruinas: La gran escalinata ceremonial desciende en pendiente controlada hacia el patio norte del Pentagrama.'
      }
    }
  ],

  /**
   * MATRIZ DE REFORMULACIÓN DE CONCEPTOS (Cero Assets Inventados)
   * Garantiza que ningún elemento dependa de modelos inexistentes.
   */
  conceptReformulations: [
    {
      concept: 'Gran Roble Legendario del Bosque',
      existsAsUniqueGLB: false,
      reason: 'KayKit no posee un modelo específico de roble gigante.',
      solution: 'COMBINACIÓN_REAL',
      implementation: 'Un ejemplar de Tree_2_A_Color1.gltf instanciado a escala 1.55x, con base ensanchada mediante un tronco caído real (trunk_large_A.gltf) y dos peñascos redondeados (Rock_1_A_Color1).'
    },
    {
      concept: 'Cúpula Circular del Observatorio',
      existsAsUniqueGLB: false,
      reason: 'KayKit Dungeon no incluye cúpulas ni domos esféricos.',
      solution: 'REFORMULACIÓN_ARQUITECTÓNICA',
      implementation: 'Pabellón ceremonial de cielo abierto con 6 columnas dóricas reales (column.gltf) erigidas en círculo sobre losas de piedra (floor_tile_large.gltf). La cúpula es la bóveda celeste y los haces de luz.'
    },
    {
      concept: 'Doble Corchea Dorada Flotante en la Plaza',
      existsAsUniqueGLB: false,
      reason: 'No existe GLB de figuras musicales en los packs.',
      solution: 'ELIMINAR_GEOMETRÍA_PROCEDURAL',
      implementation: 'El altar se compone de 4 pilares simétricos reales (pillar_decorated.gltf) con estandartes azules heráldicos (banner_blue.gltf) rodeando un pedestal con un cofre antiguo. Cero esferas y cilindros matemáticos.'
    },
    {
      concept: 'Puente Colgante de Cuerdas',
      existsAsUniqueGLB: false,
      reason: 'No hay assets de cuerdas ni cables en KayKit.',
      solution: 'COMBINACIÓN_REAL',
      implementation: 'Puente de vigas macizas con losas de madera (floor_wood_large.gltf) montado sobre pilares de contención de piedra (barrier_column.gltf).'
    },
    {
      concept: 'Artefacto Acústico de la Gruta del Eco',
      existsAsUniqueGLB: false,
      reason: 'No existe modelo de diapasón o resonador.',
      solution: 'COMBINACIÓN_REAL',
      implementation: 'Una peana de losa decorada (floor_tile_small_decorated.gltf) sosteniendo una vela litúrgica (candle_lit.gltf) junto al cofre dorado (chest_gold.glb) entre peñascos musgosos.'
    }
  ],

  /**
   * REGLAS DE COMPOSICIÓN MACRO / MEDIO / MICRO Y NEGATIVE SPACE
   */
  compositionRules: {
    workflow: [
      '1. MACRO: Esculpir la topografía y desniveles del terreno con depresiones de río y mesetas de montaña.',
      '2. MEDIO: Trazar los caminos principales y secundarios, colocar los edificios, los puentes y los árboles mayores.',
      '3. MICRO: Sembrar vegetación baja, rocas de detalle, antorchas y contenedores narrativos.'
    ],
    negativeSpacePolicy: {
      minimumClearanceAroundStations: 3.5, // Metros de radio libre en cada estación
      pathCorridorSafeRadius: 2.2, // Margen de seguridad donde no pueden brotar árboles
      landmarkSightlineBuffer: 5.0 // Embudo visual despejado frente a miradores y portales
    },
    rockClusteringRules: {
      mode: 'ORGANIC_CLUSTERS_ONLY',
      prohibitedPattern: 'Distribución en cuadrícula o aislada equidistante',
      composition: '1 roca grande de silueta principal + 1 a 3 rocas menores ancladas a su base + vegetación baja en hendiduras'
    },
    treeGroupingRules: {
      mode: 'GROVE_CLUSTERS',
      prohibitedPattern: 'Filas artificiales alineadas paralelamente al camino',
      composition: '1 árbol dominante + 2 árboles secundarios a escala 0.75x-0.85x con rotación variable en Y'
    }
  }
};
