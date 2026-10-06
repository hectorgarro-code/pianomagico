// Extracted from the current Plaza; this is a draft, not a visual redesign.
// Empty collections preserve the absence of authored Plaza stations, trees,
// entry markers and sightlines. Existing outer approach tiles are retained.
export const PLAZA_COMPOSITION = {
  "schemaVersion": 1,
  "regionId": "PLAZA_DE_LAS_NOTAS",
  "reviewStatus": "draft",
  "origin": [
    0,
    0,
    0
  ],
  "groupName": "Region_Plaza_de_las_Notas",
  "spawn": {
    "position": [
      0,
      0.1,
      3.5
    ],
    "rotation": [
      0,
      3.141592653589793,
      0
    ]
  },
  "camera": {
    "yaw": 0,
    "pitch": 0.3,
    "distance": 15.5
  },
  "terrain": {
    "baseY": 0,
    "flatRadius": 11
  },
  "paths": [
    {
      "id": "plaza-north-path",
      "points": [
        [
          0,
          0,
          4
        ],
        [
          0,
          0,
          -8
        ]
      ],
      "width": 3.2,
      "freeMarginEachSide": 2.2,
      "color": 14472652,
      "visualImplementation": "provisional-ribbon"
    }
  ],
  "entries": [],
  "exits": [],
  "boundaries": [
    {
      "id": "plaza-design-boundary",
      "shape": "circle",
      "center": [
        0,
        0
      ],
      "radius": 12,
      "purpose": "authoring"
    }
  ],
  "openZones": [
    {
      "id": "plaza-center-clearance",
      "name": "Plaza Center",
      "shape": "circle",
      "center": [
        0,
        0
      ],
      "radius": 9,
      "excludes": [
        "denseVegetation",
        "rocks"
      ]
    }
  ],
  "clearZones": [],
  "stations": [],
  "pointsOfInterest": [],
  "sightlines": [],
  "landmarks": [
    {
      "id": "plaza-pavilion",
      "memberIds": [
        "pillar-nw",
        "pillar-ne",
        "pillar-sw",
        "pillar-se",
        "pillar-rear-left",
        "pillar-rear-right"
      ]
    }
  ],
  "instances": [
    {
      "id": "floor-center",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        0,
        0.045,
        0
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.45,
        1.45,
        1.45
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-west",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        -3,
        0.045,
        0
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.2,
        1.2,
        1.2
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-east",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        3,
        0.045,
        0
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.2,
        1.2,
        1.2
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-north",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        0,
        0.045,
        -3
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.2,
        1.2,
        1.2
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-south",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        0,
        0.045,
        3
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.2,
        1.2,
        1.2
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-nw",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        -2.2,
        0.045,
        -2.2
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.05,
        1.05,
        1.05
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-ne",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        2.2,
        0.045,
        -2.2
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.05,
        1.05,
        1.05
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-sw",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        -2.2,
        0.045,
        2.2
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.05,
        1.05,
        1.05
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-se",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        2.2,
        0.045,
        2.2
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.05,
        1.05,
        1.05
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-outer-nw",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        -4.6,
        0.045,
        -1.8
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.9,
        0.9,
        0.9
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-outer-ne",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        4.6,
        0.045,
        -1.8
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.9,
        0.9,
        0.9
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-outer-sw",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        -4.6,
        0.045,
        1.8
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.9,
        0.9,
        0.9
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "floor-outer-se",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_large.gltf",
      "position": [
        4.6,
        0.045,
        1.8
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.9,
        0.9,
        0.9
      ],
      "grounding": "absolute",
      "castShadow": false,
      "receiveShadow": true
    },
    {
      "id": "approach-1",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_small.gltf",
      "position": [
        0,
        0.04,
        -6
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1.05,
        1.05,
        1.05
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "approach-2",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_small.gltf",
      "position": [
        -1.15,
        0.04,
        -7.8
      ],
      "rotation": [
        0,
        0.18,
        0
      ],
      "scale": [
        0.9,
        0.9,
        0.9
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "approach-3",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_small_weeds_A.gltf",
      "position": [
        1.1,
        0.04,
        -8.1
      ],
      "rotation": [
        0,
        -0.24,
        0
      ],
      "scale": [
        0.9,
        0.9,
        0.9
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "approach-4",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_small_broken_A.gltf",
      "position": [
        0,
        0.04,
        -10
      ],
      "rotation": [
        0,
        0.45,
        0
      ],
      "scale": [
        0.82,
        0.82,
        0.82
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "approach-5",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_small_weeds_A.gltf",
      "position": [
        -0.65,
        0.04,
        -11.6
      ],
      "rotation": [
        0,
        -0.3,
        0
      ],
      "scale": [
        0.72,
        0.72,
        0.72
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "approach-6",
      "role": "floor",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/floor_tile_small_broken_A.gltf",
      "position": [
        0.75,
        0.04,
        -12.7
      ],
      "rotation": [
        0,
        0.7,
        0
      ],
      "scale": [
        0.68,
        0.68,
        0.68
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "pillar-nw",
      "role": "architecture",
      "kind": "props",
      "assetUrl": "/models/props/pillar.glb",
      "position": [
        -7.4,
        0.05,
        -5.6
      ],
      "rotation": [
        0,
        0.24,
        0
      ],
      "scale": [
        1.1,
        1.1,
        1.1
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "pillar-ne",
      "role": "architecture",
      "kind": "props",
      "assetUrl": "/models/props/pillar.glb",
      "position": [
        7.4,
        0.05,
        -5.6
      ],
      "rotation": [
        0,
        -0.24,
        0
      ],
      "scale": [
        1.1,
        1.1,
        1.1
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "pillar-sw",
      "role": "architecture",
      "kind": "props",
      "assetUrl": "/models/props/pillar.glb",
      "position": [
        -7.4,
        0.05,
        5.6
      ],
      "rotation": [
        0,
        2.901592653589793,
        0
      ],
      "scale": [
        1.1,
        1.1,
        1.1
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "pillar-se",
      "role": "architecture",
      "kind": "props",
      "assetUrl": "/models/props/pillar.glb",
      "position": [
        7.4,
        0.05,
        5.6
      ],
      "rotation": [
        0,
        3.3815926535897933,
        0
      ],
      "scale": [
        1.1,
        1.1,
        1.1
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "pillar-rear-left",
      "role": "architecture",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/pillar_decorated.gltf",
      "position": [
        -2.6,
        0.05,
        -3.45
      ],
      "rotation": [
        0,
        0.08,
        0
      ],
      "scale": [
        0.95,
        1.2,
        0.95
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "pillar-rear-right",
      "role": "architecture",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/pillar_decorated.gltf",
      "position": [
        2.6,
        0.05,
        -3.45
      ],
      "rotation": [
        0,
        -0.08,
        0
      ],
      "scale": [
        0.95,
        1.2,
        0.95
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "banner-left",
      "role": "importantProp",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/banner_thin_blue.gltf",
      "position": [
        -8.7,
        0.05,
        -1
      ],
      "rotation": [
        0,
        1.208304866765305,
        0
      ],
      "scale": [
        0.78,
        0.78,
        0.78
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "banner-right",
      "role": "importantProp",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/banner_thin_blue.gltf",
      "position": [
        8.7,
        0.05,
        -1
      ],
      "rotation": [
        0,
        -1.208304866765305,
        0
      ],
      "scale": [
        0.78,
        0.78,
        0.78
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "chair-left",
      "role": "importantProp",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/chair.gltf",
      "position": [
        -6.7,
        0.05,
        1.4
      ],
      "rotation": [
        0,
        1.5707963267948966,
        0
      ],
      "scale": [
        0.95,
        0.95,
        0.95
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "chair-right",
      "role": "importantProp",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/chair.gltf",
      "position": [
        6.7,
        0.05,
        1.4
      ],
      "rotation": [
        0,
        -1.5707963267948966,
        0
      ],
      "scale": [
        0.95,
        0.95,
        0.95
      ],
      "grounding": "absolute",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "bush-left",
      "role": "decoration",
      "kind": "bushes",
      "assetUrl": "/models/props/Assets/gltf/Bush_1_A_Color1.gltf",
      "position": [
        -8.6,
        0.04,
        2.7
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.82,
        0.82,
        0.82
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "bush-right",
      "role": "decoration",
      "kind": "bushes",
      "assetUrl": "/models/props/Assets/gltf/Bush_2_A_Color1.gltf",
      "position": [
        8.6,
        0.04,
        2.6
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.82,
        0.82,
        0.82
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "grass-sw",
      "role": "decoration",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/Grass_1_A_Color1.gltf",
      "position": [
        -6.8,
        0.04,
        7.3
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        1,
        1,
        1
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "grass-se",
      "role": "decoration",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/Grass_2_A_Color1.gltf",
      "position": [
        6.9,
        0.04,
        7.2
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.95,
        0.95,
        0.95
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "grass-nw",
      "role": "decoration",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/Grass_1_A_Color1.gltf",
      "position": [
        -4.9,
        0.04,
        -6.8
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.8,
        0.8,
        0.8
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    },
    {
      "id": "grass-ne",
      "role": "decoration",
      "kind": "props",
      "assetUrl": "/models/props/Assets/gltf/Grass_2_A_Color1.gltf",
      "position": [
        4.9,
        0.04,
        -6.8
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "scale": [
        0.8,
        0.8,
        0.8
      ],
      "grounding": "terrain",
      "castShadow": true,
      "receiveShadow": true
    }
  ]
};
