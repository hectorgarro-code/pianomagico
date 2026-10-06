# PLAN MAESTRO DE DISEÑO DE MUNDO: VALLE DE LAS NOTAS
## Auditoría Narrativa, Visual y de Composición

---

## 1. Principio Fundamental y Filosofía del Mundo

El **Valle de las Notas** es concebido como:
> **Un antiguo santuario musical donde la naturaleza, la arquitectura y el sonido conviven en equilibrio.**

No se trata de una colección de biomas desconectados ni de una maqueta donde se dispersan piezas de librería. Es un valle cohesionado cuyas regiones comparten una historia común, una escala humana creíble y transiciones topográficas fluidas:

$$\text{Plaza de las Notas} \longrightarrow \text{Bosque} \longrightarrow \left[ \frac{\text{Ruta del Río}}{\text{Ruta de la Montaña}} \right] \longrightarrow \text{Ruinas del Gran Pentagrama} \longrightarrow \text{Observatorio Musical}$$

Cada zona anticipa visualmente a la siguiente y conserva vestigios de la anterior, garantizando coherencia de paisaje.

---

## 2. Historia Visual y Evolución del Entorno

### 1. Plaza de las Notas (El Pasado Armónico y Seguro)
- **Historia Visual:** El centro cívico y ceremonial intacto. Muestra el orden original antes del letargo del valle.
- **Atmósfera:** Suelo enlosado limpio, simetría arquitectónica, bancos de descanso, columnas erguidas y estandartes cuidados. Transmite bienvenida, seguridad y comienzo.

### 2. Bosque de las Notas (La Naturaleza Viva)
- **Historia Visual:** La vegetación ha cubierto los antiguos senderos. El santuario fue abrazado por la arboleda sin destruirlo.
- **Atmósfera:** Claros iluminados donde afloran baldosas antiguas entre las raíces, árboles frondosos y coníferas, y rocas musgosas. Transmite descubrimiento, frescura y misterio suave.

### 3. Río del Ritmo (La Fluidez y el Tiempo)
- **Historia Visual:** El curso del agua representa el movimiento y la pulsación regular. Las construcciones de madera junto al agua muestran desgaste natural.
- **Atmósfera:** Meandros sinuosos, puente de tablones de madera sobre pilares de piedra, orillas de guijarros pulidos y muelles rústicos con barriles de compás.

### 4. Montaña de las Melodías (La Altitud y el Ecosonoro)
- **Historia Visual:** La elevación donde la música adquiere vuelo. El terreno asciende en terrazas rocosas escalonadas.
- **Atmósfera:** Abetos piramidales alpinos, cornisas de piedra angular, aire limpio y el Mirador del Maestro que permite contemplar todo el valle recorrido en miniatura.

### 5. Ruinas del Gran Pentagrama (El Bastión Arcano)
- **Historia Visual:** El corazón solemne de la antigua civilización musical. Aquí se reunían los maestros para interpretar obras complejas.
- **Atmósfera:** Murallas góticas de mampostería antigua, portones monumentales, columnas dóricas y antorchas encendidas sobre sillares de piedra. Transmite antigüedad, respeto y desafío mayúsculo.

### 6. Observatorio Musical (La Cúpula Armónica en la Cúspide)
- **Historia Visual:** El punto donde la civilización alcanzó su cenit. Totalmente preservado en la cima más alta.
- **Atmósfera:** Podio ceremonial de losas pulidas, columnata simétrica circular abierta al cielo infinito, haces de luz dorada y horizonte de 360 grados. Transmite trascendencia, triunfo y culminación épica.

---

## 3. Reglas de Composición: Macro, Medio y Micro

Para evitar acumulación caótica de objetos, la generación sigue un orden estricto de tres niveles:

```text
NIVEL 1: MACRO (Topografía y Silueta)
└── Deformación del terreno: cuenca del río (-1.4m), planicie central (0m), terrazas montañosas (+4.8m a +8m), cumbre del observatorio (+8.5m).

NIVEL 2: MEDIO (Estructura y Dirección Visual)
└── Trazado curvo de caminos, colocación de puentes, portones, murallas y árboles dominantes que enmarcan la vista.

NIVEL 3: MICRO (Narrativa y Detalle Humano)
└── Arbustos bajos en hendiduras, rocas secundarias ancladas a las raíces, faroles, antorchas encendidas y contenedores en agrupaciones lógicas.
```

---

## 4. Regla de Espacios Abiertos ("Negative Space")

El vacío forma parte activa del diseño. Se prohíbe saturar el terreno:
- **Radio de Despeje en Estaciones de Piano:** Mínimo 3.5 metros libres de follaje o rocas alrededor de cada cofre.
- **Corredores de Sendero:** Margen libre de 2.2 metros a cada lado del camino principal para evitar colisiones y permitir lectura visual fluida.
- **Conos de Visión en Miradores:** Arco frontal de 180 grados totalmente despejado en el Mirador del Maestro y en la Cúspide del Observatorio.

---

## 5. Regla de Siluetas y Reconocimiento a Distancia

Cada región tiene una impronta visual inconfundible en el horizonte:
- **Bosque:** Gran masa verde redondeada en contraste con los claros centrales.
- **Río:** Franja azul de agua hendida en el terreno con el puente de madera como punto focal.
- **Montaña:** Perfil escalonado de roca angular y abetos que se eleva abruptamente al este.
- **Ruinas:** Bloque rectangular almenado de piedra gris coronado por arcos y luz de antorchas.
- **Observatorio:** Aguja y columnata blanca solitaria en la cima más alta del horizonte norte.

---

## 6. Transiciones Continuas entre Regiones

Se eliminan fronteras invisibles o cortes abruptos:
- **Plaza ➔ Bosque:** El enlosado de piedra se va espaciando; la hierba invade las juntas de las baldosas y surgen coníferas jóvenes.
- **Bosque ➔ Río:** El terreno desciende suavemente hacia el lecho, aparecen guijarros pulidos planos (`Rock_1_D`) y cañas fluviales.
- **Bosque ➔ Montaña:** El suelo terroso se vuelve pedregoso, brotan rocas angulares (`Rock_3_A`) y el camino se transforma en escalones de piedra natural.
- **Río / Montaña ➔ Ruinas:** Las dos rutas desfilan entre paredones de roca que dan paso a muros antiguos de mampostería (`wall_arched.gltf`), reuniéndose en el atrio central.
- **Ruinas ➔ Observatorio:** Una escalinata monumental de piedra pulida asciende directamente hacia la luz de la cumbre.

---

## 7. Escala Humana y Coherencia Visual

- El personaje jugable es la referencia de escala obligatoria:
  - Puertas y arcos: altura de 2.2m a 3.0m (proporcionadas, transitables).
  - Barriles y cofres: altura a la cintura o rodilla del héroe (0.7m a 1.1m).
  - Árboles mayores: 3 a 5 veces la altura del personaje (6m a 9m).
- Prohibido acumular props sin justificación narrativa (ejemplo: no poner cajas apiladas en medio de un claro virgen de bosque).

---

## 8. Auditoría y Reformulación de Conceptos (Cero Assets Inventados)

Todos los elementos del mundo deben provenir exclusivamente de [kaykitCatalog.json](file:///c:/xampp/htdocs/pianomagicoweb/src/game/assets/kaykitCatalog.json). Los conceptos abstractos fueron reformulados en ensambles de assets reales:

| Concepto Teórico Previo | ¿Existe GLB único? | Solución de World Building | Ensamble Real de KayKit |
| :--- | :---: | :--- | :--- |
| **Roble Legendario** | ❌ No | Ensamble Maestro | `Tree_2_A_Color1.gltf` (escala 1.55x) + `trunk_large_A.gltf` + `Rock_1_A_Color1.gltf`. |
| **Cúpula del Observatorio**| ❌ No | Templo de Cielo Abierto | Podio de `floor_tile_large.gltf` con 6 columnas dóricas `column.gltf` en semicírculo y antorchas doradas. La cúpula es el cielo. |
| **Corchea Dorada Flotante** | ❌ No | Eliminación de Procedural | El altar se conforma con 4 pilares `pillar_decorated.gltf`, estandartes azules `banner_blue.gltf` y pedestal de piedra. Cero esferas matemáticas. |
| **Puente Colgante de Cuerda**| ❌ No | Ensamble de Madera y Roca | Vigas de madera maciza `floor_wood_large.gltf` sobre pilares de contención `barrier_column.gltf` y `column.gltf`. |
| **Resonador de la Gruta** | ❌ No | Rincón de Contemplación | Peana de piedra `floor_tile_small_decorated.gltf` sosteniendo una vela litúrgica `candle_lit.gltf` junto al cofre dorado `chest_gold.glb`. |

---

## 9. Matriz de Composición y Especificación de Regiones

### Región 1: `PLAZA_DE_LAS_NOTAS`
- **Identidad:** Hub central protegido.
- **Terreno:** Base `0.0m`, planicie enlosada.
- **Assets Permitidos:** `floor_tile_large.gltf`, `pillar.glb`, `column.gltf`, `chair.gltf`, `banner_blue.gltf`, `Bush_1_A_Color1.gltf`.
- **Assets Prohibidos:** Muros de dungeon, escombros, árboles secos.
- **Densidad:** Baja (amplio espacio abierto, radio despejado de 9m).

### Región 2: `BOSQUE_DE_LAS_NOTAS`
- **Identidad:** Arboledas y claros de descubrimiento.
- **Terreno:** Elevación suave `+0.6m` a `+2.0m`.
- **Assets Permitidos:** `Tree_1_A..C`, `Tree_2_A..B`, `Tree_3_A`, `Bush_1..3`, `Rock_1_A..B`, `trunk_large_A`, `chest_wood.glb`, `torch_lit.gltf`.
- **Assets Prohibidos:** Muros de piedra, muebles de interior, armas.
- **Densidad:** Media en sendero, alta en perímetros.

### Región 3: `GRUTA_DEL_ECO` (Zona Secreta)
- **Identidad:** Cueva rocosa oculta entre peñascos musgosos.
- **Terreno:** Depresión sombría `-0.4m`.
- **Assets Permitidos:** `Rock_3_A`, `Rock_3_R`, `Rock_2_A`, `candle_lit.gltf`, `rubble_half.gltf`, `chest_gold.glb`.
- **Assets Prohibidos:** Carteles, antorchas de gran llama, árboles dentro.
- **Densidad:** Muy alta (apiñada).

### Región 4: `RIO_DEL_RITMO`
- **Identidad:** Valle fluvial bajo y continuo.
- **Terreno:** Depresión del cauce `-1.4m`.
- **Assets Permitidos:** `floor_wood_large.gltf`, `stairs_wood.gltf`, `barrier_column.gltf`, `barrel_large.gltf`, `keg.gltf`, `crates_stacked.gltf`, `Rock_1_A..D`.
- **Assets Prohibidos:** Murallas góticas de piedra, abetos en medio del agua.
- **Densidad:** Media longitudinal.

### Región 5: `MONTANA_DE_LAS_MELODIAS`
- **Identidad:** Terrazas rocosas ascendentes con vista aérea.
- **Terreno:** Elevación `+4.8m` a `+8.0m`.
- **Assets Permitidos:** `Tree_1_A..B`, `Tree_Bare_1_A`, `Rock_3_A..R`, `floor_tile_large.gltf`, `barrier_column.gltf`, `banner_blue.gltf`, `chest_gold.glb`.
- **Assets Prohibidos:** Árboles frondosos de hoja ancha a gran altura, aguas pantanosas.
- **Densidad:** Baja-Media (rocas monolíticas espaciadas).

### Región 6: `RUINAS_DEL_GRAN_PENTAGRAMA`
- **Identidad:** Bastión antiguo gótico donde convergen ambas rutas.
- **Terreno:** Podio ceremonial `+1.8m`.
- **Assets Permitidos:** `wall.gltf`, `wall_arched.gltf`, `wall_doorway.gltf`, `gate.glb`, `column.gltf`, `torch_lit.gltf`, `rubble_large.gltf`, `banner_red.gltf`.
- **Assets Prohibidos:** Vegetación invasiva descontrolada, madera de muelle fluvial.
- **Densidad:** Alta (mampostería estructurada).

### Región 7: `OBSERVATORIO_MUSICAL`
- **Identidad:** Cúspide final triunfal de 360 grados.
- **Terreno:** Cima más alta `+8.5m`.
- **Assets Permitidos:** `floor_tile_large.gltf`, `column.gltf`, `pillar_decorated.gltf`, `torch_lit.gltf`, `chest_gold.glb`, `banner_patternA_white.gltf`.
- **Assets Prohibidos:** Muros ciegos, escombros rotos, cajas de desecho.
- **Densidad:** Media (arquitectura ceremonial simétrica).
