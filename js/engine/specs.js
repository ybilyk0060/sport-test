// Спеки счёта упражнений. Из публичного каталога Студії вправ (exercise-catalog, status=published):
// squats@3, high_knees@2, jumping_jack@4, plank@1 (сверены 25.11.2026), good_morning@1 (добавлена 25.11.2026, в Студії помечена PROPOSED).
// arm_circles@4, quadruped_arm_circles@1, wall_french_press@1, pushups@4 — из каталога (25.11, второй заход).
// pushups_front — своя спека (віджимання лицом к камере). shoulder_taps_front — своя спека сайта (в Студії есть только shoulder_taps боком): см. notes внутри.
// cross_crawl, glute_bridge, side_bend, side_leg_raise, superman_lifts, tuck_jump @1 — из каталога (25.11, третий заход: помечены в Студії для sport_test). toe_touch и windmill ещё в статусе testing — не берём.
// crunches — из каталога Студії (25.11, заготовка нормативов).
// Не править руками без повторной проверки tests/engine.test.mjs.
// 26.11 (Юрий: «смягчить, но не сильно»): jumping_jack — ноги внизу ≤ 0,9 корпуса (было 0,7), старт ≤ 1,1 (было 0,95). Проверено на записях прогонов 5 и 7.
export const SPEC_MD5 = {
 "squats": "094396b23e4dbc84449d4a135b11a998",
 "plank": "b254da6d588d8b8c55f684ac04b01e7d",
 "high_knees": "ec346a793d63a5fe7e05ec2ed5783a58",
 "jumping_jack": "7ca6467f269ba5df1d176dd2eeeff3ec",
 "good_morning": "7fae1c13856ed12bab93c97fe490713c",
 "shoulder_taps_front": "0e284fd8eee20b7dc24267c9dec19982",
 "arm_circles": "aac95b56e3de6f84159f5046c8b6bae6",
 "quadruped_arm_circles": "d658aa51bab70cff1e701b7ed632d15a",
 "wall_french_press": "978c0f618b515d8ac5ef16d295010599",
 "pushups": "0a893012aa87304fad261b848161cca4",
 "pushups_front": "4af76bad6463655efc45b9517384bd44",
 "cross_crawl": "a492581a4073f54f7c5c8461b8f2b434",
 "glute_bridge": "b4b878bba29307dce6fa2bf87083063b",
 "side_bend": "cdbfb123da514be375525ccf29cc1ff6",
 "side_leg_raise": "cfd2ced02b1d596a4971f72ca893144b",
 "superman_lifts": "f9551a13c673fc6ff19d31e84753484f",
 "tuck_jump": "9ed75c526ef2abf2b9cdf8588994bf88"
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
       "young": -0.62,
       "standard": -0.5
      }
     }
    ]
   },
   "rearm": {
    "all": [
     {
      "m": "knee_h",
      "max": {
       "young": -0.74,
       "standard": -0.68
      }
     }
    ]
   },
   "otherDown": {
    "all": [
     {
      "m": "other_h",
      "max": {
       "young": -0.64,
       "standard": -0.6
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
  "notes": "Ported 1:1 from highKneesAlgorithm.ts (05.11). v2 (18.11, owner rule: a child's rep counts from ~70 % of the adult amplitude): young lift line −0.50 (was −0.45) so a 6-year-old's knee at 0.43 below the hip still counts after the PoseSmoother lag (RB-4); low marching (knee 0.5 below the hip, plant 0.9) is still rejected. Standard band unchanged. | sport-test 25.11 (владелец): мягче для детей — подъём засчитывается с колена на 0.62 длины туловища ниже бедра (young), 0.5 (standard); подсказку «міняй ногу» (sameSide) убрали."
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
      "max": 1.1
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
    "max": 0.9,
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
 },
 "arm_circles": {
  "key": "arm_circles",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/arm_circles-v2-197d83dd.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/arm_circles-v2-197d83dd.mp4"
  },
  "notes": "Exercise of the day 2026-11-07 (scripts/pipeline). v3 (15.11): young ranges for the right wrist and start. v4 (18.11, owner rule: a child's rep counts from ~70 % of the adult amplitude): both wrists only need to reach the shoulder line (−0.05 torso), start ≤ −0.3, same lines for standard and young (age 8 is the standard band); one arm / still / arms down stay at zero. Bench: kidAmplitude.test.ts.",
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
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "wrist_h",
    "velocity": 0.02,
    "trendFrames": 2
   },
   "start": {
    "all": [
     {
      "m": "wrist_h",
      "max": -0.3
     }
    ]
   },
   "abandon": {
    "hint": "arm_circles_not_reached",
    "onlyIfReached": {
     "m": "wrist_h",
     "min": -0.2
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "arm_circles_coach_1": {
    "text": {
     "de": "Du drehst dich super!",
     "en": "You are spinning so great!",
     "uk": "Ти крутишся дуже гарно!"
    }
   },
   "arm_circles_coach_2": {
    "text": {
     "de": "Wundervolle große Kreise!",
     "en": "Amazing big circles!",
     "uk": "Чудові великі кола!"
    }
   },
   "arm_circles_coach_3": {
    "text": {
     "de": "Fliege hoch wie eine Rakete!",
     "en": "Fly high like a rocket!",
     "uk": "Лети високо наче ракета!"
    }
   },
   "arm_circles_coach_4": {
    "text": {
     "de": "Mach weiter so super!",
     "en": "Keep up the awesome work!",
     "uk": "Продовжуй у тому ж дусі!"
    }
   },
   "arm_circles_face_wrong": {
    "text": {
     "de": "Drehe dich zu mir!",
     "en": "Turn around to face me!",
     "uk": "Повернися обличчям до мене!"
    }
   },
   "arm_circles_not_reached": {
    "text": {
     "de": "Greife noch etwas höher!",
     "en": "Reach a little higher!",
     "uk": "Тягнися трохи вище догори!"
    }
   }
  },
  "version": 4,
  "facingHint": "arm_circles_face_wrong",
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
   }
  ]
 },
 "quadruped_arm_circles": {
  "key": "quadruped_arm_circles",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/quadruped_arm_circles-v1-46cfeb76.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/quadruped_arm_circles-v1-46cfeb76.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–18, trainer bounds in the run report.",
  "facing": "side",
  "motion": {
   "top": {
    "all": [
     {
      "m": "left_wrist_h",
      "min": {
       "young": -0.2,
       "standard": 0.39
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "left_wrist_h",
    "velocity": 0.02,
    "trendFrames": 2
   },
   "start": {
    "all": [
     {
      "m": "left_wrist_h",
      "max": -0.79
     }
    ]
   },
   "abandon": {
    "hint": "quadruped_arm_circles_not_reached",
    "onlyIfReached": {
     "m": "left_wrist_h",
     "min": -0.49
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "quadruped_arm_circles_coach_1": {
    "text": {
     "de": "Tolle Drehung!",
     "en": "Awesome rotation!",
     "uk": "Чудове обертання!"
    }
   },
   "quadruped_arm_circles_coach_2": {
    "text": {
     "de": "Weiter so!",
     "en": "Keep up the great work!",
     "uk": "Так тримати!"
    }
   },
   "quadruped_arm_circles_coach_3": {
    "text": {
     "de": "Was für ein schöner Kreis!",
     "en": "What a beautiful circle!",
     "uk": "Яке гарне коло!"
    }
   },
   "quadruped_arm_circles_coach_4": {
    "text": {
     "de": "Das machst du super!",
     "en": "You are doing amazing!",
     "uk": "У тебе чудово виходить!"
    }
   },
   "quadruped_arm_circles_face_wrong": {
    "text": {
     "de": "Drehe dich seitlich zur Kamera!",
     "en": "Turn sideways to the camera!",
     "uk": "Повернися боком до камери!"
    }
   },
   "quadruped_arm_circles_not_reached": {
    "text": {
     "de": "Mach den Kreis ganz fertig!",
     "en": "Make a full big circle!",
     "uk": "Зроби повне велике коло!"
    }
   }
  },
  "version": 1,
  "facingHint": "quadruped_arm_circles_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "left_wrist_h",
    "ref": "shoulder_mid",
    "kind": "height",
    "point": "near_wrist"
   }
  ]
 },
 "wall_french_press": {
  "key": "wall_french_press",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/wall_french_press-v1-31517c7c.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/wall_french_press-v1-31517c7c.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–18, trainer bounds in the run report.",
  "facing": "side",
  "motion": {
   "top": {
    "all": [
     {
      "m": "left_elbow",
      "min": {
       "young": 152.16,
       "standard": 160.15
      }
     },
     {
      "m": "left_wrist_h",
      "max": 0.06
     },
     {
      "m": "hip_h",
      "max": -0.47
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "left_elbow"
   },
   "start": {
    "all": [
     {
      "m": "left_elbow",
      "max": 144.16
     }
    ]
   },
   "abandon": {
    "hint": "wall_french_press_not_reached",
    "onlyIfReached": {
     "m": "left_elbow",
     "min": 148.16
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "wall_french_press_coach_1": {
    "text": {
     "de": "Starke Kraft!",
     "en": "Super power push!",
     "uk": "Сильний поштовх!"
    }
   },
   "wall_french_press_coach_2": {
    "text": {
     "de": "Das machst du super!",
     "en": "You are doing amazing!",
     "uk": "Ти справжній герой!"
    }
   },
   "wall_french_press_coach_3": {
    "text": {
     "de": "Toller Druck!",
     "en": "Great push away!",
     "uk": "Чудовий поштовх!"
    }
   },
   "wall_french_press_coach_4": {
    "text": {
     "de": "Super weiter so!",
     "en": "Keep going strong!",
     "uk": "Так тримати!"
    }
   },
   "wall_french_press_face_wrong": {
    "text": {
     "de": "Drehe dich seitlich zum Bild!",
     "en": "Turn sideways to the screen!",
     "uk": "Повернися боком до екрана!"
    }
   },
   "wall_french_press_not_reached": {
    "text": {
     "de": "Drücke dich ganz zurück!",
     "en": "Push all the way back!",
     "uk": "Штовхайся до самого кінця!"
    }
   }
  },
  "version": 1,
  "facingHint": "wall_french_press_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "left_elbow",
    "kind": "angle",
    "points": [
     "near_shoulder",
     "near_elbow",
     "near_wrist"
    ]
   },
   {
    "id": "left_wrist_h",
    "ref": "shoulder_mid",
    "kind": "height",
    "point": "near_wrist"
   },
   {
    "id": "hip_h",
    "ref": "shoulder_mid",
    "kind": "height",
    "point": "hip_mid"
   }
  ]
 },
 "pushups": {
  "key": "pushups",
  "goal": "reps",
  "gates": {
   "sideBy": "wrist",
   "notSeenHint": "show_full_body",
   "minVisibility": 0.5,
   "maxInvalidFrames": 45
  },
  "notes": "Ported from pushUpAlgorithm.ts (05.11). v2: depth 74/81 from real video 4804817 (adult bottoms 71.8–73.3°; Studio line 80° rejected: arm flail in plank reaches 75–76°); sideBy wrist. v3 (10.11): young — knees / body line / hips are hints (upright and depth stay reject: anti-cheat). v4 (15.11): young depth 100° (honest 90–100° counted; flail risk unchanged vs 81°).",
  "rules": [
   {
    "m": "torso_tilt",
    "id": "upright",
    "max": 40,
    "hint": "body_too_upright",
    "check": "between",
    "scope": "keyframes",
    "consequence": "reject"
   },
   {
    "m": "knee_near",
    "id": "knee_near",
    "min": {
     "young": 133,
     "standard": 140
    },
    "hint": "no_knees_on_floor",
    "check": "between",
    "scope": "keyframes",
    "optional": true,
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "knee_far",
    "id": "knee_far",
    "min": {
     "young": 133,
     "standard": 140
    },
    "hint": "no_knees_on_floor",
    "check": "between",
    "scope": "keyframes",
    "optional": true,
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "knee_lift_near",
    "id": "knee_lift_near",
    "min": 0.12,
    "hint": "no_knees_on_floor",
    "check": "between",
    "scope": "ends",
    "optional": true,
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "knee_lift_far",
    "id": "knee_lift_far",
    "min": 0.12,
    "hint": "no_knees_on_floor",
    "check": "between",
    "scope": "ends",
    "optional": true,
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "hip_line",
    "id": "body_straight",
    "min": {
     "young": 138,
     "standard": 145
    },
    "hint": "keep_body_straight",
    "check": "between",
    "scope": "keyframes",
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "hip_line",
    "id": "hips_steady",
    "max": 18,
    "hint": "keep_hips_steady",
    "check": "drift",
    "scope": "keyframes",
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "elbow",
    "id": "depth",
    "max": {
     "young": 100,
     "standard": 74
    },
    "hint": "go_lower",
    "check": "min",
    "scope": "rep",
    "consequence": "reject"
   }
  ],
  "facing": "side",
  "motion": {
   "top": {
    "all": [
     {
      "m": "elbow",
      "max": {
       "young": 107,
       "standard": 100
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "elbow",
    "velocity": 0.09,
    "trendFrames": 3
   },
   "start": {
    "all": [
     {
      "m": "elbow",
      "min": {
       "young": 133,
       "standard": 140
      }
     },
     {
      "m": "hip_line",
      "min": {
       "young": 138,
       "standard": 145
      }
     },
     {
      "m": "torso_tilt",
      "max": 40
     }
    ]
   },
   "abandon": {
    "hint": "go_lower"
   },
   "blockedStartHint": "get_into_plank",
   "startConfirmMaxAgeMs": 1500
  },
  "phrases": {
   "go_lower": {
    "text": {
     "de": "Geh ganz nach unten — beuge die Ellbogen mehr",
     "en": "Go all the way down — bend your elbows more",
     "uk": "Опускайся нижче — більше згинай лікті"
    },
    "voice": "exercise.hint.go_lower"
   },
   "turn_sideways": {
    "text": {
     "de": "Dreh dich seitlich zur Kamera",
     "en": "Turn sideways to the camera",
     "uk": "Повернись боком до камери"
    },
    "voice": "exercise.hint.turn_sideways"
   },
   "get_into_plank": {
    "text": {
     "de": "Geh in die Liegestützposition, Arme gestreckt",
     "en": "Get into the push-up position with straight arms",
     "uk": "Стань в упор лежачи, руки прямі"
    },
    "voice": "exercise.hint.get_into_plank"
   },
   "show_full_body": {
    "text": {
     "de": "Geh weiter weg, damit dein ganzer Körper im Bild ist",
     "en": "Move back so your whole body is in the picture",
     "uk": "Відійди далі, щоб було видно все тіло"
    },
    "voice": "exercise.hint.show_full_body"
   },
   "body_too_upright": {
    "text": {
     "de": "Leg dich hin und drück dich vom Boden hoch",
     "en": "Lie down and push up from the floor",
     "uk": "Ляж і віджимайся від підлоги"
    },
    "voice": "exercise.hint.body_too_upright"
   },
   "keep_hips_steady": {
    "text": {
     "de": "Hebe oder senke die Hüfte nicht beim Runtergehen",
     "en": "Don't lift or drop your hips while you go down",
     "uk": "Не піднімай і не опускай таз, коли віджимаєшся"
    },
    "voice": "exercise.hint.keep_hips_steady"
   },
   "no_knees_on_floor": {
    "text": {
     "de": "Halte beide Beine gerade — Knie nicht auf dem Boden",
     "en": "Keep both legs straight — knees off the floor",
     "uk": "Тримай обидві ноги прямими — коліна не на підлозі"
    },
    "voice": "exercise.hint.no_knees_on_floor"
   },
   "keep_body_straight": {
    "text": {
     "de": "Halte den Körper gerade wie ein Brett",
     "en": "Keep your body straight, like a plank",
     "uk": "Тримай тіло рівно, як планка"
    },
    "voice": "exercise.hint.keep_body_straight"
   }
  },
  "version": 4,
  "facingHint": "turn_sideways",
  "specVersion": 1,
  "measurements": [
   {
    "id": "elbow",
    "kind": "angle",
    "points": [
     "near_shoulder",
     "near_elbow",
     "near_wrist"
    ]
   },
   {
    "id": "hip_line",
    "kind": "angle",
    "points": [
     "near_shoulder",
     "near_hip",
     "near_knee"
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
    "id": "knee_near",
    "kind": "angle",
    "points": [
     "near_hip",
     "near_knee",
     "near_ankle"
    ]
   },
   {
    "id": "knee_far",
    "kind": "angle",
    "points": [
     "far_hip",
     "far_knee",
     "far_ankle"
    ]
   },
   {
    "id": "knee_lift_near",
    "ref": "near_wrist",
    "kind": "height",
    "point": "near_knee"
   },
   {
    "id": "knee_lift_far",
    "ref": "near_wrist",
    "kind": "height",
    "point": "far_knee"
   }
  ]
 },
 "pushups_front": {
  "specVersion": 1,
  "key": "pushups_front",
  "version": 1,
  "goal": "reps",
  "facing": "front",
  "facingHint": "jumping_jack_face_wrong",
  "measurements": [
   {
    "id": "l_elbow",
    "kind": "angle",
    "points": [
     "left_shoulder",
     "left_elbow",
     "left_wrist"
    ]
   },
   {
    "id": "r_elbow",
    "kind": "angle",
    "points": [
     "right_shoulder",
     "right_elbow",
     "right_wrist"
    ]
   }
  ],
  "motion": {
   "type": "reps",
   "drive": {
    "m": "l_elbow"
   },
   "start": {
    "all": [
     {
      "m": "l_elbow",
      "min": {
       "young": 140,
       "standard": 150
      }
     },
     {
      "m": "r_elbow",
      "min": {
       "young": 140,
       "standard": 150
      }
     }
    ]
   },
   "top": {
    "all": [
     {
      "m": "l_elbow",
      "max": {
       "young": 125,
       "standard": 115
      }
     },
     {
      "m": "r_elbow",
      "max": {
       "young": 125,
       "standard": 115
      }
     }
    ]
   },
   "abandon": {
    "hint": "go_lower",
    "onlyIfReached": {
     "m": "l_elbow",
     "max": 135
    }
   },
   "finishGraceMs": 300
  },
  "gates": {
   "minVisibility": 0.5,
   "maxInvalidFrames": 45
  },
  "phrases": {
   "go_lower": {
    "text": {
     "uk": "Опускайся нижче"
    }
   }
  },
  "notes": "sport-test 25.11 (владелец): віджимання лицом к камере. Оба локтя: старт > 150° (молодші > 140°), низ < 115° (< 125°). Считается параллельно со спекой студии pushups@4 (боком), берётся больший счёт. Пороги рабочие, на детях не проверены."
 },
 "cross_crawl": {
  "key": "cross_crawl",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/cross_crawl-v1-fd54560f.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/cross_crawl-v1-fd54560f.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–18, trainer bounds in the run report. Two-sided exercise: one rep = a full left + right cycle.",
  "facing": "front",
  "motion": {
   "top": {
    "all": [
     {
      "m": "left_hip",
      "max": {
       "young": 104.22,
       "standard": 90.46
      }
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
      "min": 117.98
     }
    ]
   },
   "abandon": {
    "hint": "cross_crawl_not_reached",
    "onlyIfReached": {
     "m": "left_hip",
     "max": 111.1
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "cross_crawl_coach_1": {
    "text": {
     "de": "Tolle Drehung",
     "en": "Awesome twist",
     "uk": "Чудовий розворот"
    }
   },
   "cross_crawl_coach_2": {
    "text": {
     "de": "Du machst das super",
     "en": "You are doing great",
     "uk": "Ти рухаєшся чудово"
    }
   },
   "cross_crawl_coach_3": {
    "text": {
     "de": "Toller Rhythmus",
     "en": "Great rhythm",
     "uk": "Яскравий рух"
    }
   },
   "cross_crawl_coach_4": {
    "text": {
     "de": "Weiter so stark",
     "en": "Keep moving like that",
     "uk": "Так тримати далі"
    }
   },
   "cross_crawl_face_wrong": {
    "text": {
     "de": "Dreh dich zur Kamera",
     "en": "Turn to face the screen",
     "uk": "Повернися обличчям до екрана"
    }
   },
   "cross_crawl_not_reached": {
    "text": {
     "de": "Hebe das Knie noch höher",
     "en": "Lift your knee higher",
     "uk": "Підтягни коліно ще вище"
    }
   }
  },
  "version": 1,
  "facingHint": "cross_crawl_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "left_hip",
    "kind": "angle",
    "points": [
     "left_shoulder",
     "left_hip",
     "left_knee"
    ]
   }
  ]
 },
 "glute_bridge": {
  "key": "glute_bridge",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/glute_bridge-v1-e141df68.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/glute_bridge-v1-e141df68.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–18, trainer bounds in the run report.",
  "facing": "side",
  "motion": {
   "top": {
    "all": [
     {
      "m": "left_torso_tilt",
      "min": {
       "young": 17.4,
       "standard": 20.23
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "left_torso_tilt"
   },
   "start": {
    "all": [
     {
      "m": "left_torso_tilt",
      "max": 14.56
     }
    ]
   },
   "abandon": {
    "hint": "glute_bridge_not_reached",
    "onlyIfReached": {
     "m": "left_torso_tilt",
     "min": 15.98
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "glute_bridge_coach_1": {
    "text": {
     "de": "Tolle Brücke!",
     "en": "Awesome bridge!",
     "uk": "Чудовий місток!"
    }
   },
   "glute_bridge_coach_2": {
    "text": {
     "de": "Du bist super stark!",
     "en": "You are so strong!",
     "uk": "Ти справжній силач!"
    }
   },
   "glute_bridge_coach_3": {
    "text": {
     "de": "Hoch bis zum Himmel!",
     "en": "High into the sky!",
     "uk": "Високо до сонечка!"
    }
   },
   "glute_bridge_coach_4": {
    "text": {
     "de": "Weiter so, klasse gemacht!",
     "en": "Keep up the great work!",
     "uk": "Так тримати, молодець!"
    }
   },
   "glute_bridge_face_wrong": {
    "text": {
     "de": "Dreh dich seitlich zum Handy!",
     "en": "Turn sideways to the phone!",
     "uk": "Повернися боком до телефону!"
    }
   },
   "glute_bridge_not_reached": {
    "text": {
     "de": "Drücke dich noch etwas höher!",
     "en": "Push a little bit higher!",
     "uk": "Піднімися ще трішки вище!"
    }
   }
  },
  "version": 1,
  "facingHint": "glute_bridge_face_wrong",
  "specVersion": 1,
  "measurements": [
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
 "side_bend": {
  "key": "side_bend",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_bend-v1-1b715774.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_bend-v1-1b715774.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–18, trainer bounds in the run report.",
  "facing": "front",
  "motion": {
   "top": {
    "all": [
     {
      "m": "right_hip",
      "max": {
       "young": 101.78,
       "standard": 81.37
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "right_hip"
   },
   "start": {
    "all": [
     {
      "m": "right_hip",
      "min": 122.19
     }
    ]
   },
   "abandon": {
    "hint": "side_bend_not_reached",
    "onlyIfReached": {
     "m": "right_hip",
     "max": 111.99
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "side_bend_coach_1": {
    "text": {
     "de": "Tolle Beugung!",
     "en": "Great side bend!",
     "uk": "Чудовий нахил!"
    }
   },
   "side_bend_coach_2": {
    "text": {
     "de": "Strecke dich zum Himmel!",
     "en": "Reach up to the sky!",
     "uk": "Тягнися вище до сонечка!"
    }
   },
   "side_bend_coach_3": {
    "text": {
     "de": "Super beweglich!",
     "en": "Super flexibility!",
     "uk": "Неймовірна гнучкість!"
    }
   },
   "side_bend_coach_4": {
    "text": {
     "de": "Super gemacht, weiter so!",
     "en": "Awesome job, keep going!",
     "uk": "Молодець, так тримати!"
    }
   },
   "side_bend_face_wrong": {
    "text": {
     "de": "Dreh dich zur Kamera!",
     "en": "Turn to face the camera!",
     "uk": "Повернися обличчям до екрана!"
    }
   },
   "side_bend_not_reached": {
    "text": {
     "de": "Beuge dich noch ein Stück!",
     "en": "Bend further and stretch up!",
     "uk": "Нахилися глибше та випрямляйся!"
    }
   }
  },
  "version": 1,
  "facingHint": "side_bend_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "right_hip",
    "kind": "angle",
    "points": [
     "right_shoulder",
     "right_hip",
     "right_knee"
    ]
   }
  ]
 },
 "side_leg_raise": {
  "key": "side_leg_raise",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_leg_raise-v1-430f7a58.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_leg_raise-v1-430f7a58.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–18, trainer bounds in the run report.",
  "facing": "front",
  "motion": {
   "top": {
    "all": [
     {
      "m": "feet",
      "min": {
       "young": 0.69,
       "standard": 0.81
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "feet",
    "velocity": 0.02,
    "trendFrames": 2
   },
   "start": {
    "all": [
     {
      "m": "feet",
      "max": 0.56
     }
    ]
   },
   "abandon": {
    "hint": "side_leg_raise_not_reached",
    "onlyIfReached": {
     "m": "feet",
     "min": 0.62
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "side_leg_raise_coach_1": {
    "text": {
     "de": "Toll das Bein gehoben!",
     "en": "Great leg raise!",
     "uk": "Чудовий підйом ноги!"
    }
   },
   "side_leg_raise_coach_2": {
    "text": {
     "de": "Du machst das super!",
     "en": "You move so gracefully!",
     "uk": "Ти рухаєшся так граційно!"
    }
   },
   "side_leg_raise_coach_3": {
    "text": {
     "de": "Strahle wie ein Stern!",
     "en": "Keep shining like a star!",
     "uk": "Сяй як справжня зірочка!"
    }
   },
   "side_leg_raise_coach_4": {
    "text": {
     "de": "Klasse Gleichgewicht!",
     "en": "Awesome balance!",
     "uk": "Чудова рівновага!"
    }
   },
   "side_leg_raise_face_wrong": {
    "text": {
     "de": "Schau wieder zum Bildschirm!",
     "en": "Turn to face the screen!",
     "uk": "Повернися обличчям до екрана!"
    }
   },
   "side_leg_raise_not_reached": {
    "text": {
     "de": "Hebe dein Bein noch höher!",
     "en": "Lift your leg higher!",
     "uk": "Підніми ніжку трішки вище!"
    }
   }
  },
  "version": 1,
  "facingHint": "side_leg_raise_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "feet",
    "kind": "distance",
    "points": [
     "left_ankle",
     "right_ankle"
    ]
   }
  ]
 },
 "superman_lifts": {
  "key": "superman_lifts",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/superman_lifts-v1-b262f6cf.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/superman_lifts-v1-b262f6cf.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
  "facing": "side",
  "motion": {
   "top": {
    "all": [
     {
      "m": "feet",
      "min": {
       "young": 0.32,
       "standard": 0.39
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "feet",
    "velocity": 0.02,
    "trendFrames": 2
   },
   "start": {
    "all": [
     {
      "m": "feet",
      "max": 0.25
     }
    ]
   },
   "abandon": {
    "hint": "superman_lifts_not_reached",
    "onlyIfReached": {
     "m": "feet",
     "min": 0.29
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "superman_lifts_coach_1": {
    "text": {
     "de": "Toller Flug!",
     "en": "Awesome flying!",
     "uk": "Чудовий політ!"
    }
   },
   "superman_lifts_coach_2": {
    "text": {
     "de": "Du bist ein echter Superheld!",
     "en": "You are a real superhero!",
     "uk": "Ти справжній супергерой!"
    }
   },
   "superman_lifts_coach_3": {
    "text": {
     "de": "Fliege immer weiter!",
     "en": "Keep soaring higher!",
     "uk": "Так тримати, лети вище!"
    }
   },
   "superman_lifts_coach_4": {
    "text": {
     "de": "Starke Arme und Beine!",
     "en": "Strong arms and legs!",
     "uk": "Сильні руки та ноги!"
    }
   },
   "superman_lifts_face_wrong": {
    "text": {
     "de": "Drehe dich seitlich zur Kamera!",
     "en": "Turn sideways to the camera!",
     "uk": "Повернися до екрана боком!"
    }
   },
   "superman_lifts_not_reached": {
    "text": {
     "de": "Fliege noch ein Stück höher!",
     "en": "Fly a little higher!",
     "uk": "Потягнися вище вгору!"
    }
   }
  },
  "version": 1,
  "facingHint": "superman_lifts_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "feet",
    "kind": "distance",
    "points": [
     "near_ankle",
     "far_ankle"
    ]
   }
  ]
 },
 "tuck_jump": {
  "key": "tuck_jump",
  "goal": "reps",
  "media": {
   "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/tuck_jump-v1-f8b42018.jpg",
   "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/tuck_jump-v1-f8b42018.mp4"
  },
  "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 3, ages 7–18, trainer bounds in the run report.",
  "facing": "front",
  "motion": {
   "top": {
    "all": [
     {
      "m": "right_hip",
      "max": {
       "young": 83.17,
       "standard": 52.31
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "right_hip"
   },
   "start": {
    "all": [
     {
      "m": "right_hip",
      "min": 114.03
     }
    ]
   },
   "abandon": {
    "hint": "tuck_jump_not_reached",
    "onlyIfReached": {
     "m": "right_hip",
     "max": 98.6
    }
   },
   "finishGraceMs": 300
  },
  "phrases": {
   "tuck_jump_coach_1": {
    "text": {
     "de": "Super Sprung in die Luft!",
     "en": "Super jump into the air!",
     "uk": "Суперський стрибок у повітря!"
    }
   },
   "tuck_jump_coach_2": {
    "text": {
     "de": "Du fliegst so hoch!",
     "en": "You fly so high today!",
     "uk": "Ти літаєш дуже високо!"
    }
   },
   "tuck_jump_coach_3": {
    "text": {
     "de": "Tolle hohe Sprünge!",
     "en": "Awesome tuck jumps!",
     "uk": "Дивовижні високі стрибки!"
    }
   },
   "tuck_jump_coach_4": {
    "text": {
     "de": "Weich gelandet, Klasse!",
     "en": "Soft landing, great job!",
     "uk": "М'яке приземлення, супер!"
    }
   },
   "tuck_jump_face_wrong": {
    "text": {
     "de": "Schau wieder zur Kamera!",
     "en": "Turn your face to camera!",
     "uk": "Повернися обличчям до екрана!"
    }
   },
   "tuck_jump_not_reached": {
    "text": {
     "de": "Spring noch ein bisschen höher!",
     "en": "Jump a little bit higher!",
     "uk": "Підстрибни ще трохи вище!"
    }
   }
  },
  "version": 1,
  "facingHint": "tuck_jump_face_wrong",
  "specVersion": 1,
  "measurements": [
   {
    "id": "right_hip",
    "kind": "angle",
    "points": [
     "right_shoulder",
     "right_hip",
     "right_knee"
    ]
   }
  ]
 },
 "crunches": {
  "key": "crunches",
  "goal": "reps",
  "gates": {
   "sideBy": "knee",
   "notSeenHint": "show_full_body",
   "minVisibility": 0.5,
   "maxInvalidFrames": 45
  },
  "notes": "Ported 1:1 from sitUpAlgorithm.ts (05.11). v3 (10.11): young — feet_planted / knees_bent are hints (lying_flat stays reject).",
  "rules": [
   {
    "m": "thigh_tilt",
    "id": "feet_planted",
    "max": 80,
    "hint": "keep_feet_planted",
    "check": "between",
    "scope": "keyframes",
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "knee",
    "id": "knees_bent",
    "max": 130,
    "hint": "bend_your_knees",
    "check": "between",
    "scope": "keyframes",
    "optional": true,
    "consequence": "reject",
    "consequenceByAge": {
     "young": "hint"
    }
   },
   {
    "m": "torso_tilt",
    "id": "lying_flat",
    "max": 40,
    "hint": "lie_down_flat",
    "check": "between",
    "scope": "ends",
    "consequence": "reject"
   }
  ],
  "facing": "side",
  "motion": {
   "top": {
    "all": [
     {
      "m": "hip_angle",
      "max": {
       "young": 97,
       "standard": 90
      }
     }
    ]
   },
   "type": "reps",
   "drive": {
    "m": "hip_angle",
    "velocity": 0.09,
    "trendFrames": 3
   },
   "start": {
    "all": [
     {
      "m": "torso_tilt",
      "max": 40,
      "hint": "lie_down_flat"
     },
     {
      "m": "knee",
      "max": 130,
      "hint": "bend_your_knees",
      "optional": true
     },
     {
      "m": "thigh_tilt",
      "max": 80,
      "hint": "keep_feet_planted"
     },
     {
      "m": "hip_angle",
      "min": {
       "young": 128,
       "standard": 135
      },
      "hint": "lie_down_flat"
     }
    ]
   },
   "abandon": {
    "hint": "sit_up_higher",
    "onlyIfReached": {
     "m": "hip_angle",
     "max": 112
    }
   },
   "bounceHint": "lie_all_the_way_back",
   "blockedStartHint": "lie_down_flat",
   "startConfirmMaxAgeMs": 1500
  },
  "phrases": {
   "lie_down_flat": {
    "text": {
     "de": "Leg dich auf den Rücken, Knie angewinkelt",
     "en": "Lie down on your back with your knees bent",
     "uk": "Ляж на спину, коліна зігнуті"
    },
    "voice": "exercise.hint.lie_down_flat"
   },
   "sit_up_higher": {
    "text": {
     "de": "Komm höher hoch — Brust Richtung Knie",
     "en": "Sit up higher — bring your chest to your knees",
     "uk": "Піднімайся вище — груди до колін"
    },
    "voice": "exercise.hint.sit_up_higher"
   },
   "turn_sideways": {
    "text": {
     "de": "Dreh dich seitlich zur Kamera",
     "en": "Turn sideways to the camera",
     "uk": "Повернись боком до камери"
    },
    "voice": "exercise.hint.turn_sideways"
   },
   "show_full_body": {
    "text": {
     "de": "Geh weiter weg, damit dein ganzer Körper im Bild ist",
     "en": "Move back so your whole body is in the picture",
     "uk": "Відійди далі, щоб було видно все тіло"
    },
    "voice": "exercise.hint.show_full_body"
   },
   "bend_your_knees": {
    "text": {
     "de": "Winkle die Knie an und lass die Füße am Boden",
     "en": "Bend your knees and keep your feet on the floor",
     "uk": "Зігни коліна і тримай стопи на підлозі"
    },
    "voice": "exercise.hint.bend_your_knees"
   },
   "keep_feet_planted": {
    "text": {
     "de": "Beide Füße bleiben am Boden",
     "en": "Keep both feet on the floor",
     "uk": "Тримай обидві ноги на підлозі"
    },
    "voice": "exercise.hint.keep_feet_planted"
   },
   "lie_all_the_way_back": {
    "text": {
     "de": "Leg dich ganz zurück, bevor du wieder hochkommst",
     "en": "Lie all the way back down before the next one",
     "uk": "Лягай повністю назад перед наступним разом"
    },
    "voice": "exercise.hint.lie_all_the_way_back"
   }
  },
  "version": 3,
  "facingHint": "turn_sideways",
  "specVersion": 1,
  "measurements": [
   {
    "id": "hip_angle",
    "kind": "angle",
    "points": [
     "near_knee",
     "near_hip",
     "near_shoulder"
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
    "id": "thigh_tilt",
    "kind": "tilt",
    "points": [
     "near_hip",
     "near_knee"
    ]
   },
   {
    "id": "knee",
    "kind": "angle",
    "points": [
     "near_ankle",
     "near_knee",
     "near_hip"
    ]
   }
  ]
 }
};
