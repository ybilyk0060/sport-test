// Спеки счёта упражнений. Из публичного каталога Студії вправ (exercise-catalog, status=published):
// squats@3, high_knees@2, jumping_jack@4, plank@1 (сверены 25.11.2026), good_morning@1 (добавлена 25.11.2026, в Студії помечена PROPOSED).
// shoulder_taps_front — своя спека сайта (в Студії есть только shoulder_taps боком): см. notes внутри.
// Не править руками без повторной проверки tests/engine.test.mjs.
export const SPEC_MD5 = {
 "squats": "094396b23e4dbc84449d4a135b11a998",
 "plank": "b254da6d588d8b8c55f684ac04b01e7d",
 "high_knees": "3a43b203f11d4f774927b504d6167665",
 "jumping_jack": "7ca6467f269ba5df1d176dd2eeeff3ec",
 "good_morning": "7fae1c13856ed12bab93c97fe490713c",
 "shoulder_taps_front": "0e284fd8eee20b7dc24267c9dec19982"
};
export const SPECS = {
 "squats": {
  "specVersion": 1,
  "key": "squats",
  "version": 3,
  "goal": "reps",
  "facing": "side",
  "facingHint": "turn_sideways",
  "measurements": [
   {
    "id": "knee",
    "kind": "angle",
    "points": [
     "near_hip",
     "near_knee",
     "near_ankle"
    ]
   },
   {
    "id": "torso_tilt",
    "kind": "tilt",
    "points": [
     "near_shoulder",
     "near_hip"
    ]
   },
   {
    "id": "hip_drop",
    "kind": "v_travel",
    "point": "hip_mid",
    "unit": "leg"
   },
   {
    "id": "ankle_lift",
    "kind": "v_travel",
    "point": "near_ankle",
    "unit": "leg",
    "compensate": "hip_drop"
   }
  ],
  "motion": {
   "type": "reps",
   "drive": {
    "m": "knee",
    "velocity": 0.09,
    "trendFrames": 3
   },
   "start": {
    "all": [
     {
      "m": "knee",
      "min": {
       "standard": 145,
       "young": 138
      }
     },
     {
      "m": "torso_tilt",
      "min": 63,
      "hint": "stand_straight_arms_down"
     }
    ]
   },
   "top": {
    "all": [
     {
      "m": "knee",
      "max": {
       "standard": 115,
       "young": 122
      }
     }
    ]
   },
   "startConfirmMaxAgeMs": 1500,
   "finishGraceMs": 500,
   "topGraceMs": 400,
   "settle": {
    "ms": 300,
    "maxAgeMs": 1500,
    "maxShift": 0.12,
    "maxScale": 0.08
   },
   "baseline": {
    "gate": [
     {
      "m": "knee",
      "min": 155
     }
    ],
    "emaAlpha": 0.2,
    "minSamples": 5,
    "minSamplesSlow": 3,
    "minSpanMs": 133
   },
   "blockedStartHint": "stand_straight_arms_down",
   "finishHint": "stand_straight_arms_down"
  },
  "rules": [
   {
    "id": "feet_planted",
    "m": "ankle_lift",
    "scope": "rep",
    "check": "between",
    "min": -0.25,
    "sustainMs": 150,
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    },
    "hint": "keep_feet_planted",
    "optional": true
   },
   {
    "id": "depth",
    "m": "hip_drop",
    "scope": "rep",
    "check": "peak",
    "min": {
     "standard": 0.2,
     "young": 0.15
    },
    "consequence": "reject",
    "hint": "sit_lower"
   },
   {
    "id": "hips_return",
    "m": "hip_drop",
    "scope": "rep",
    "check": "return",
    "max": 0.7,
    "consequence": "reject"
   }
  ],
  "gates": {
   "minVisibility": 0.5,
   "maxInvalidFrames": 45,
   "sideBy": "ankle"
  },
  "lenient": {
   "scale": 0.6,
   "driveRef": 180,
   "startMargin": 10,
   "rules": [
    "depth"
   ]
  },
  "phrases": {
   "turn_sideways": {
    "text": {
     "en": "Turn sideways to the camera",
     "uk": "Повернись боком до камери",
     "de": "Dreh dich seitlich zur Kamera"
    },
    "voice": "exercise.hint.turn_sideways"
   },
   "stand_straight_arms_down": {
    "text": {
     "en": "Stand up straight",
     "uk": "Стань рівно",
     "de": "Steh gerade"
    },
    "voice": "exercise.hint.stand_straight_arms_down"
   },
   "sit_lower": {
    "text": {
     "en": "Sit down lower, like sitting on a chair",
     "uk": "Присідай нижче, ніби сідаєш на стілець",
     "de": "Geh tiefer runter, wie auf einen Stuhl"
    },
    "voice": "exercise.hint.sit_lower"
   },
   "keep_feet_planted": {
    "text": {
     "en": "Keep both feet on the floor",
     "uk": "Тримай обидві ноги на підлозі",
     "de": "Beide Füße bleiben am Boden"
    },
    "voice": "exercise.hint.keep_feet_planted"
   }
  },
  "notes": "Ported 1:1 from squatAlgorithm.ts (05.11). v2 (05.11): lenient first reps (r8) in the spec engine. v3 (10.11): young — feet_planted is a hint (depth stays reject)."
 },
 "plank": {
  "specVersion": 1,
  "key": "plank",
  "version": 1,
  "goal": "seconds",
  "facing": "side",
  "facingHint": "turn_sideways",
  "measurements": [
   {
    "id": "elbow",
    "kind": "angle",
    "points": [
     "near_shoulder",
     "near_elbow",
     "near_wrist"
    ],
    "filterMs": 500
   },
   {
    "id": "hip_line",
    "kind": "angle",
    "points": [
     "near_shoulder",
     "near_hip",
     "near_knee"
    ],
    "filterMs": 500
   },
   {
    "id": "torso_tilt",
    "kind": "tilt",
    "points": [
     "near_shoulder",
     "near_hip"
    ],
    "filterMs": 500
   },
   {
    "id": "shoulder_lift",
    "kind": "height",
    "point": "near_shoulder",
    "ref": "near_elbow",
    "filterMs": 500
   },
   {
    "id": "knee_near",
    "kind": "angle",
    "points": [
     "near_hip",
     "near_knee",
     "near_ankle"
    ],
    "filterMs": 500
   },
   {
    "id": "knee_far",
    "kind": "angle",
    "points": [
     "far_hip",
     "far_knee",
     "far_ankle"
    ],
    "filterMs": 500
   },
   {
    "id": "knee_lift_near",
    "kind": "height",
    "point": "near_knee",
    "ref": "near_wrist",
    "filterMs": 500
   },
   {
    "id": "knee_lift_far",
    "kind": "height",
    "point": "far_knee",
    "ref": "near_wrist",
    "filterMs": 500
   }
  ],
  "motion": {
   "type": "hold",
   "enter": {
    "all": [
     {
      "m": "hip_line",
      "min": {
       "standard": 165,
       "young": 158
      }
     },
     {
      "m": "shoulder_lift",
      "min": 0.2
     },
     {
      "m": "knee_near",
      "min": {
       "standard": 140,
       "young": 133
      },
      "optional": true
     },
     {
      "m": "knee_far",
      "min": {
       "standard": 140,
       "young": 133
      },
      "optional": true
     },
     {
      "m": "knee_lift_near",
      "min": 0.12,
      "optional": true
     },
     {
      "m": "knee_lift_far",
      "min": 0.12,
      "optional": true
     },
     {
      "m": "elbow",
      "min": 0
     }
    ],
    "anyOf": [
     [
      {
       "m": "elbow",
       "min": {
        "standard": 62,
        "young": 55
       },
       "max": {
        "standard": 85,
        "young": 92
       }
      },
      {
       "m": "torso_tilt",
       "max": {
        "standard": 10,
        "young": 20
       }
      }
     ],
     [
      {
       "m": "elbow",
       "min": 145
      },
      {
       "m": "torso_tilt",
       "max": {
        "standard": 25,
        "young": 35
       }
      }
     ]
    ]
   },
   "keep": {
    "all": [
     {
      "m": "hip_line",
      "min": {
       "standard": 165,
       "young": 158
      }
     },
     {
      "m": "shoulder_lift",
      "min": 0.2
     },
     {
      "m": "knee_near",
      "min": {
       "standard": 140,
       "young": 133
      },
      "optional": true
     },
     {
      "m": "knee_far",
      "min": {
       "standard": 140,
       "young": 133
      },
      "optional": true
     },
     {
      "m": "knee_lift_near",
      "min": 0.12,
      "optional": true
     },
     {
      "m": "knee_lift_far",
      "min": 0.12,
      "optional": true
     },
     {
      "m": "elbow",
      "min": 0
     }
    ],
    "anyOf": [
     [
      {
       "m": "elbow",
       "min": 50,
       "max": 120
      },
      {
       "m": "torso_tilt",
       "max": {
        "standard": 10,
        "young": 20
       }
      }
     ],
     [
      {
       "m": "elbow",
       "min": 135
      },
      {
       "m": "torso_tilt",
       "max": {
        "standard": 25,
        "young": 35
       }
      }
     ]
    ]
   },
   "settleMs": 1000,
   "settleGlitchMs": 200,
   "warnMs": 250,
   "graceMs": 1000,
   "recoverMs": 300,
   "lostHoldMs": 1000,
   "stillness": {
    "afterMs": 3000,
    "windowMs": 1000,
    "maxDrift": [
     {
      "m": "hip_line",
      "max": 10
     },
     {
      "m": "torso_tilt",
      "max": 10
     }
    ]
   },
   "enterHint": "get_into_plank_position",
   "keepHint": "hold_your_plank"
  },
  "gates": {
   "minVisibility": 0.5,
   "maxInvalidFrames": 45
  },
  "phrases": {
   "turn_sideways": {
    "text": {
     "en": "Turn sideways to the camera",
     "uk": "Повернись боком до камери",
     "de": "Dreh dich seitlich zur Kamera"
    },
    "voice": "exercise.hint.turn_sideways"
   },
   "get_into_plank_position": {
    "text": {
     "en": "Get into a forearm plank: elbows under your shoulders, body straight",
     "uk": "Стань у планку на передпліччях: лікті під плечима, тіло рівне",
     "de": "Geh in den Unterarmstütz: Ellbogen unter den Schultern, Körper gerade"
    },
    "voice": "exercise.hint.get_into_plank_position"
   },
   "hold_your_plank": {
    "text": {
     "en": "Hold your plank — keep still and keep your body straight",
     "uk": "Тримай планку — не рухайся і тримай тіло рівно",
     "de": "Halte die Planke — bleib ruhig und halte den Körper gerade"
    },
    "voice": "exercise.hint.hold_your_plank"
   }
  },
  "notes": "Ported 1:1 from plankAlgorithm.ts (05.11), incl. straight-arm plank (29.10) and young tilt slack."
 },
 "high_knees": {
  "specVersion": 1,
  "key": "high_knees",
  "version": 2,
  "goal": "seconds",
  "facing": "side",
  "facingHint": "turn_sideways",
  "measurements": [
   {
    "id": "knee_h",
    "kind": "height",
    "point": "side_knee",
    "ref": "hip_mid"
   },
   {
    "id": "other_h",
    "kind": "height",
    "point": "other_knee",
    "ref": "hip_mid"
   }
  ],
  "motion": {
   "type": "alternating",
   "lift": {
    "all": [
     {
      "m": "knee_h",
      "min": {
       "young": -0.5,
       "standard": -0.4
      }
     }
    ]
   },
   "rearm": {
    "all": [
     {
      "m": "knee_h",
      "max": {
       "standard": -0.65,
       "young": -0.6
      }
     }
    ]
   },
   "otherDown": {
    "all": [
     {
      "m": "other_h",
      "max": {
       "standard": -0.6,
       "young": -0.55
      }
     }
    ]
   },
   "otherStaleMs": 700,
   "nearOnlyWindowMs": 1400,
   "timing": {
    "mode": "active_seconds",
    "activeWindowMs": 1000,
    "youngWindowScale": 1.2,
    "startLifts": 4,
    "resumeLifts": 2,
    "warnMs": 300,
    "maxPauseMs": 3000
   },
   "hints": {
    "start": "start_high_knees",
    "low": "lift_knees_higher",
    "sameSide": "switch_legs",
    "bothUp": "start_high_knees",
    "stopped": "keep_moving"
   }
  },
  "gates": {
   "minVisibility": 0.5,
   "maxInvalidFrames": 45
  },
  "phrases": {
   "turn_sideways": {
    "text": {
     "en": "Turn sideways to the camera",
     "uk": "Повернись боком до камери",
     "de": "Dreh dich seitlich zur Kamera"
    },
    "voice": "exercise.hint.turn_sideways"
   },
   "start_high_knees": {
    "text": {
     "en": "Run in place and bring your knees up to hip level — the timer starts when you get going",
     "uk": "Біжи на місці й піднімай коліна до рівня стегон — таймер запуститься, щойно ти почнеш",
     "de": "Lauf auf der Stelle und zieh die Knie bis auf Hüfthöhe — der Timer startet, sobald du loslegst"
    },
    "voice": "exercise.hint.start_high_knees"
   },
   "lift_knees_higher": {
    "text": {
     "en": "Bring your knees up higher, to hip level",
     "uk": "Піднімай коліна вище, до рівня стегон",
     "de": "Zieh die Knie höher, bis auf Hüfthöhe"
    },
    "voice": "exercise.hint.lift_knees_higher"
   },
   "switch_legs": {
    "text": {
     "en": "Switch legs on every step",
     "uk": "Міняй ноги на кожному кроці",
     "de": "Wechsle bei jedem Schritt das Bein"
    },
    "voice": "exercise.hint.switch_legs"
   },
   "keep_moving": {
    "text": {
     "en": "Don't stop — the timer only runs while you keep moving",
     "uk": "Не зупиняйся — таймер іде, лише поки ти рухаєшся",
     "de": "Nicht stehen bleiben — der Timer läuft nur, solange du dich bewegst"
    },
    "voice": "exercise.hint.keep_moving"
   }
  },
  "notes": "Ported 1:1 from highKneesAlgorithm.ts (05.11). v2 (18.11, owner rule: a child's rep counts from ~70 % of the adult amplitude): young lift line −0.50 (was −0.45) so a 6-year-old's knee at 0.43 below the hip still counts after the PoseSmoother lag (RB-4); low marching (knee 0.5 below the hip, plant 0.9) is still rejected. Standard band unchanged."
 },
 "jumping_jack": {
  "key": "jumping_jack",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/jumping_jack-v2-d26a07ed.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/jumping_jack-v2-d26a07ed.mp4"
  },
  "notes": "Exercise of the day 2026-11-07 (scripts/pipeline). v3 (15.11): young ranges for feet/start/right wrist. v4 (18.11, owner rule: a child's rep counts from ~70 % of the adult amplitude): wrists only need to reach the shoulder line (−0.05 torso), feet ≥ 0.75 torso apart at the top (start ≤ 0.95), same lines for standard and young (age 8 is the standard band); cheats stay rejected: still, one arm, arms with feet together (feet must open), feet without arms, wide static stance + arm waving (feet must close to ≤ 0.7 once per rep). Bench: kidAmplitude.test.ts.",
  "facing": "front",
  "motion": {
   "top": {
    "all": [
     {
      "m": "wrist_h",
      "min": -0.05
     },
     {
      "m": "wrist_h_r",
      "min": -0.05
     },
     {
      "m": "feet",
      "min": 0.75
     }
    ]
   },
   "type": "jump",
   "drive": {
    "m": "wrist_h",
    "velocity": 0.02,
    "trendFrames": 2
   },
   "start": {
    "all": [
     {
      "m": "wrist_h",
      "max": -0.25
     },
     {
      "m": "feet",
      "max": 0.95
     }
    ]
   },
   "abandon": {
    "hint": "jumping_jack_not_reached",
    "onlyIfReached": {
     "m": "wrist_h",
     "min": -0.15
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "jumping_jack_coach_1": {
    "text": {
     "de": "Du strahlst wie ein Stern!",
     "en": "You are shining bright!",
     "uk": "Ти сяєш як зірочка!"
    }
   },
   "jumping_jack_coach_2": {
    "text": {
     "de": "Toller Sprung, weiter so!",
     "en": "Great jump, super energy!",
     "uk": "Чудовий стрибок, супер!"
    }
   },
   "jumping_jack_coach_3": {
    "text": {
     "de": "Arme hoch, super gemacht!",
     "en": "High hands, awesome star!",
     "uk": "Руки високо, чудово!"
    }
   },
   "jumping_jack_coach_4": {
    "text": {
     "de": "Was für eine Energie!",
     "en": "Look at that power!",
     "uk": "Яка суперська енергія!"
    }
   },
   "jumping_jack_face_wrong": {
    "text": {
     "de": "Dreh dich zur Kamera!",
     "en": "Face front towards the camera!",
     "uk": "Повернися обличчям до камери!"
    }
   },
   "jumping_jack_not_reached": {
    "text": {
     "de": "Hände noch höher strecken!",
     "en": "Raise your hands up higher!",
     "uk": "Піднімай ручки ще вище!"
    }
   }
  },
  "version": 4,
  "facingHint": "jumping_jack_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "wrist_h",
    "ref": "shoulder_mid",
    "kind": "height",
    "point": "left_wrist"
   },
   {
    "id": "wrist_h_r",
    "ref": "shoulder_mid",
    "kind": "height",
    "point": "right_wrist"
   },
   {
    "id": "feet",
    "kind": "distance",
    "points": [
     "left_ankle",
     "right_ankle"
    ]
   }
  ],
  "rules": [
   {
    "m": "feet",
    "id": "feet_together",
    "max": 0.7,
    "check": "min",
    "scope": "rep",
    "consequence": "reject"
   }
  ]
 },
 "good_morning": {
  "key": "good_morning",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/good_morning-v1-91b13db9.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/good_morning-v1-91b13db9.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
  "facing": "side",
  "motion": {
   "top": {
    "all": [
     {
      "m": "left_hip",
      "max": {
       "young": 91.9,
       "standard": 65.95
      }
     },
     {
      "m": "left_wrist_h",
      "min": -0.52
     },
     {
      "m": "left_torso_tilt",
      "max": 41.5
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "left_hip"
   },
   "start": {
    "all": [
     {
      "m": "left_hip",
      "min": 117.85
     }
    ]
   },
   "abandon": {
    "hint": "good_morning_not_reached",
    "onlyIfReached": {
     "m": "left_hip",
     "max": 104.88
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "good_morning_coach_1": {
    "text": {
     "de": "Tolle Verneigung!",
     "en": "Great bow!",
     "uk": "Чудовий нахил!"
    }
   },
   "good_morning_coach_2": {
    "text": {
     "de": "Du bist ein Superstar!",
     "en": "You are a superstar!",
     "uk": "Ти суперзірка!"
    }
   },
   "good_morning_coach_3": {
    "text": {
     "de": "Wunderbar gemacht!",
     "en": "Wonderful job!",
     "uk": "Прекрасна робота!"
    }
   },
   "good_morning_coach_4": {
    "text": {
     "de": "Weiter so!",
     "en": "Keep it up!",
     "uk": "Так тримати!"
    }
   },
   "good_morning_face_wrong": {
    "text": {
     "de": "Drehe dich seitlich zur Kamera!",
     "en": "Turn your side to camera!",
     "uk": "Повернися до камери боком!"
    }
   },
   "good_morning_not_reached": {
    "text": {
     "de": "Beuge dich noch etwas weiter!",
     "en": "Bow just a little deeper!",
     "uk": "Нахилися ще трошки нижче!"
    }
   }
  },
  "version": 1,
  "facingHint": "good_morning_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "left_hip",
    "kind": "angle",
    "points": [
     "near_shoulder",
     "near_hip",
     "near_knee"
    ]
   },
   {
    "id": "left_wrist_h",
    "ref": "shoulder_mid",
    "kind": "height",
    "point": "near_wrist"
   },
   {
    "id": "left_torso_tilt",
    "kind": "tilt",
    "points": [
     "near_shoulder",
     "near_hip"
    ]
   }
  ]
 },
 "shoulder_taps_front": {
  "specVersion": 1,
  "key": "shoulder_taps_front",
  "version": 1,
  "goal": "reps",
  "facing": "front",
  "facingHint": "jumping_jack_face_wrong",
  "measurements": [
   {
    "id": "elbow",
    "kind": "angle",
    "points": [
     "side_shoulder",
     "side_elbow",
     "side_wrist"
    ]
   },
   {
    "id": "other_elbow",
    "kind": "angle",
    "points": [
     "other_shoulder",
     "other_elbow",
     "other_wrist"
    ]
   }
  ],
  "motion": {
   "type": "alternating",
   "lift": {
    "all": [
     {
      "m": "elbow",
      "max": {
       "young": 115,
       "standard": 105
      }
     }
    ]
   },
   "rearm": {
    "all": [
     {
      "m": "elbow",
      "min": {
       "young": 140,
       "standard": 145
      }
     }
    ]
   },
   "otherDown": {
    "all": [
     {
      "m": "other_elbow",
      "min": {
       "young": 135,
       "standard": 140
      }
     }
    ]
   },
   "otherStaleMs": 700,
   "nearOnlyWindowMs": 2500,
   "timing": {
    "mode": "count",
    "activeWindowMs": 2500,
    "youngWindowScale": 1.3
   },
   "minRepIntervalMs": 300,
   "hints": {
    "start": "get_into_plank",
    "low": "shoulder_taps_not_reached",
    "sameSide": "switch_hands",
    "bothUp": "get_into_plank"
   }
  },
  "gates": {
   "minVisibility": 0.5,
   "maxInvalidFrames": 45
  },
  "phrases": {
   "get_into_plank": {
    "text": {
     "uk": "Стань в упор лежачи обличчям до камери"
    }
   },
   "shoulder_taps_not_reached": {
    "text": {
     "uk": "Торкнися плеча долонею"
    }
   },
   "switch_hands": {
    "text": {
     "uk": "Чергуй руки"
    }
   }
  },
  "notes": "Сайт sport-test, 25.11.2026: варіант shoulder_taps обличчям до камери (власник). Кут ліктя активної руки: торкання < 105° (молодші < 115°), повернення > 145° (140°); друга рука пряма > 140° (135°). Один дотик = один повтор. Пороги робочі, на відео дітей не перевірені."
 }
};
