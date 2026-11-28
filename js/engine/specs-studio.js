// Сгенерировано tools/import-studio.mjs из каталога Студії вправ (2026-11-26). Не править руками.
// Опубликованные упражнения, которых нет среди своих спек сайта: программа подписчика (js/program.js).
export const STUDIO = {
 "bear_plank_leg_lift": {
  "spec": {
   "key": "bear_plank_leg_lift",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/bear_plank_leg_lift-v1-cb684e71.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/bear_plank_leg_lift-v1-cb684e71.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_knee",
       "min": {
        "young": 138.84,
        "standard": 160.51
       }
      },
      {
       "m": "feet",
       "min": 0.95
      },
      {
       "m": "left_hip",
       "min": 150.37
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "left_knee"
    },
    "start": {
     "all": [
      {
       "m": "left_knee",
       "max": 117.17
      }
     ]
    },
    "abandon": {
     "hint": "bear_plank_leg_lift_not_reached",
     "onlyIfReached": {
      "m": "left_knee",
      "min": 128.01
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "bear_plank_leg_lift_coach_1": {
     "text": {
      "de": "Starker Bär!",
      "en": "Strong bear!",
      "uk": "Сильний ведмедик!"
     }
    },
    "bear_plank_leg_lift_coach_2": {
     "text": {
      "de": "Toller Beinhub!",
      "en": "Great leg lift!",
      "uk": "Чудовий підйом!"
     }
    },
    "bear_plank_leg_lift_coach_3": {
     "text": {
      "de": "Super gemacht!",
      "en": "Awesome job!",
      "uk": "Чудова робота!"
     }
    },
    "bear_plank_leg_lift_coach_4": {
     "text": {
      "de": "Perfekte Balance!",
      "en": "Perfect balance!",
      "uk": "Чудова рівновага!"
     }
    },
    "bear_plank_leg_lift_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich zum Bildschirm!",
      "en": "Turn sideways to the screen!",
      "uk": "Повернися боком до екрана!"
     }
    },
    "bear_plank_leg_lift_not_reached": {
     "text": {
      "de": "Hebe das Bein noch höher!",
      "en": "Lift your leg higher!",
      "uk": "Підніми ніжку ще трішки вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "bear_plank_leg_lift_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
      "near_ankle"
     ]
    },
    {
     "id": "feet",
     "kind": "distance",
     "points": [
      "near_ankle",
      "far_ankle"
     ]
    },
    {
     "id": "left_hip",
     "kind": "angle",
     "points": [
      "near_shoulder",
      "near_hip",
      "near_knee"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/bear_plank_leg_lift-v1-cb684e71.mp4",
  "poster": "eotd/bear_plank_leg_lift-v1-cb684e71.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Bear Plank Leg Lift",
    "description": "Turn into a playful bear! Balance on your hands and knees while lifting your leg up high.",
    "instructions": [
     "Stand sideways to the screen in a bear plank and lift your leg high up to count reps.",
     "Keep your back nice and straight",
     "Keep your knees near the floor",
     "Lift your leg high into the air"
    ]
   },
   "de": {
    "name": "Bären-Plank Beinheben",
    "description": "Werde zum schlauem Bären! Stütze dich auf Händen und Knien ab und hebe dein Bein hoch.",
    "instructions": [
     "Stütze dich seitlich zum Bildschirm auf und hebe dein Bein hoch zum Zählen.",
     "Halte deinen Rücken gerade",
     "Halte die Knie nah am Boden",
     "Hebe das Bein weit nach oben"
    ]
   },
   "uk": {
    "name": "Ведмедик піднімає ніжку",
    "description": "Перетворися на спритного ведмедика! Тримайся на долоньках і колінах та махай ніжкою височенько.",
    "instructions": [
     "Стань боком до екрана у ведмежу планку та високо піднімай ніжку вгору для відліку.",
     "Тримай спинку рівно та міцно",
     "Тримай коліна близько до підлоги",
     "Піднімай ніжку високо вгору"
    ]
   }
  },
  "phrases": [
   "bear_plank_leg_lift_coach_1",
   "bear_plank_leg_lift_coach_2",
   "bear_plank_leg_lift_coach_3",
   "bear_plank_leg_lift_coach_4",
   "bear_plank_leg_lift_face_wrong",
   "bear_plank_leg_lift_not_reached"
  ]
 },
 "bird_dog_crunch": {
  "spec": {
   "key": "bird_dog_crunch",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/bird_dog_crunch-v1-5990df44.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/bird_dog_crunch-v1-5990df44.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_elbow",
       "max": {
        "young": 131.5,
        "standard": 120.05
       }
      },
      {
       "m": "wrists",
       "max": 0.39
      },
      {
       "m": "left_wrist_h",
       "max": -0.59
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
       "min": 142.94
      }
     ]
    },
    "abandon": {
     "hint": "bird_dog_crunch_not_reached",
     "onlyIfReached": {
      "m": "left_elbow",
      "max": 137.22
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "bird_dog_crunch_coach_1": {
     "text": {
      "de": "Tolles Gleichgewicht!",
      "en": "Great balance!",
      "uk": "Чудова рівновага!"
     }
    },
    "bird_dog_crunch_coach_2": {
     "text": {
      "de": "Du bist ein Star!",
      "en": "You are a star!",
      "uk": "Ти справжня зірка!"
     }
    },
    "bird_dog_crunch_coach_3": {
     "text": {
      "de": "Mach weiter so!",
      "en": "Keep moving forward!",
      "uk": "Рухайся сміливо далі!"
     }
    },
    "bird_dog_crunch_coach_4": {
     "text": {
      "de": "Unglaubliche Bewegung!",
      "en": "Incredible movement!",
      "uk": "Неймовірний рух!"
     }
    },
    "bird_dog_crunch_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich zur Kamera!",
      "en": "Turn sideways to the camera!",
      "uk": "Повернися боком до екрана!"
     }
    },
    "bird_dog_crunch_not_reached": {
     "text": {
      "de": "Strecke dich noch ein Stück!",
      "en": "Stretch a little bit further!",
      "uk": "Дотягнися ще трішки вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "bird_dog_crunch_face_wrong",
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
     "id": "wrists",
     "kind": "distance",
     "points": [
      "near_wrist",
      "far_wrist"
     ]
    },
    {
     "id": "left_wrist_h",
     "ref": "shoulder_mid",
     "kind": "height",
     "point": "near_wrist"
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/bird_dog_crunch-v1-5990df44.mp4",
  "poster": "eotd/bird_dog_crunch-v1-5990df44.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Bird Dog Crunch",
    "description": "Become a superhero: stretch out your arm and leg, then bring them together!",
    "instructions": [
     "Stand sideways to the camera and touch your elbow to the opposite knee.",
     "Get on all fours steadily",
     "Extend opposite arm and leg",
     "Touch your elbow to your knee",
     "Keep your balance and smile"
    ]
   },
   "de": {
    "name": "Vogel-Hund-Crunch",
    "description": "Werde zum Superhelden: Strecke Arm und Bein aus und ziehe sie zusammen!",
    "instructions": [
     "Stehe seitlich zur Kamera und berühre deinen Ellenbogen mit dem Knie.",
     "Gehe auf alle Viere",
     "Strecke Arm und Bein aus",
     "Berühre das Knie mit dem Ellenbogen",
     "Halte dein Gleichgewicht"
    ]
   },
   "uk": {
    "name": "Пес-птах",
    "description": "Перетворися на супергероя: витягуй руку й ногу, а потім з'єднуй їх під собою!",
    "instructions": [
     "Стань боком до екрана й торкайся ліктем протилежного коліна під животом.",
     "Стань на четвереньки рівно",
     "Витягуй протилежні руку й ногу",
     "Торкнися ліктем коліна під собою",
     "Тримай рівновагу та посміхайся"
    ]
   }
  },
  "phrases": [
   "bird_dog_crunch_coach_1",
   "bird_dog_crunch_coach_2",
   "bird_dog_crunch_coach_3",
   "bird_dog_crunch_coach_4",
   "bird_dog_crunch_face_wrong",
   "bird_dog_crunch_not_reached"
  ]
 },
 "burpee_push_up": {
  "spec": {
   "key": "burpee_push_up",
   "goal": "reps",
   "gates": {
    "sideBy": "knee",
    "notSeenHint": "show_full_body",
    "minVisibility": 0.5,
    "maxInvalidFrames": 45
   },
   "notes": "Ported from burpyPushUpAlgorithm.ts (05.11): spine as multi_position, push-up as a gated min rule. v2 (10.11): young — the push-up rule is a hint.",
   "rules": [
    {
     "m": "elbow",
     "id": "push_up",
     "max": {
      "young": 107,
      "standard": 100
     },
     "hint": "do_a_push_up",
     "when": [
      {
       "m": "torso_tilt",
       "max": 40
      }
     ],
     "check": "min",
     "scope": "rep",
     "during": "plank",
     "optional": true,
     "consequence": "reject",
     "consequenceByAge": {
      "young": "hint"
     }
    }
   ],
   "facing": "side",
   "motion": {
    "type": "multi_position",
    "start": {
     "all": [
      {
       "m": "knee",
       "max": {
        "young": 32,
        "standard": 25
       },
       "hint": "stand_up_tall"
      },
      {
       "m": "torso_tilt",
       "min": 60,
       "hint": "stand_up_tall"
      }
     ]
    },
    "abandon": {
     "hint": "crouch_down_lower",
     "onlyIfReached": {
      "m": "knee",
      "min": 42.5
     }
    },
    "sequence": [
     {
      "id": "crouch_1",
      "hint": "crouch_down_lower",
      "position": {
       "all": [
        {
         "m": "knee",
         "min": {
          "young": 53,
          "standard": 60
         }
        }
       ]
      }
     },
     {
      "id": "plank",
      "hint": "legs_back_to_plank",
      "position": {
       "all": [
        {
         "m": "knee",
         "max": {
          "young": 32,
          "standard": 25
         }
        },
        {
         "m": "torso_tilt",
         "max": 40
        }
       ]
      }
     },
     {
      "id": "crouch_2",
      "hint": "feet_back_under_you",
      "position": {
       "all": [
        {
         "m": "knee",
         "min": {
          "young": 53,
          "standard": 60
         }
        }
       ]
      }
     }
    ],
    "confirmFrames": 1,
    "blockedStartHint": "stand_up_tall"
   },
   "phrases": {
    "do_a_push_up": {
     "text": {
      "de": "Mach einen Liegestütz, während du in der Planke bist",
      "en": "Do one push-up while you are in the plank",
      "uk": "Зроби одне віджимання, поки ти в планці"
     },
     "voice": "exercise.hint.do_a_push_up"
    },
    "stand_up_tall": {
     "text": {
      "de": "Steh am Anfang und am Ende gerade hin",
      "en": "Stand up tall at the start and at the end",
      "uk": "Стань прямо на початку і в кінці"
     },
     "voice": "exercise.hint.stand_up_tall"
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
    "crouch_down_lower": {
     "text": {
      "de": "Geh tiefer in die Hocke — Hände auf den Boden",
      "en": "Crouch down lower — put your hands on the floor",
      "uk": "Присядь нижче — постав руки на підлогу"
     },
     "voice": "exercise.hint.crouch_down_lower"
    },
    "legs_back_to_plank": {
     "text": {
      "de": "Streck die Beine nach hinten in eine gerade Planke",
      "en": "Take your legs back into a straight plank",
      "uk": "Відведи ноги назад у пряму планку"
     },
     "voice": "exercise.hint.legs_back_to_plank"
    },
    "feet_back_under_you": {
     "text": {
      "de": "Zieh die Füße wieder unter dich, bevor du aufstehst",
      "en": "Bring your feet back under you before you stand up",
      "uk": "Підтягни стопи під себе, перш ніж вставати"
     },
     "voice": "exercise.hint.feet_back_under_you"
    }
   },
   "version": 2,
   "facingHint": "turn_sideways",
   "specVersion": 1,
   "measurements": [
    {
     "id": "knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
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
     "id": "elbow",
     "kind": "angle",
     "points": [
      "near_shoulder",
      "near_elbow",
      "near_wrist"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "studio/burpee_push_up-v2-dab3f052.mp4",
  "poster": "studio/burpee_push_up-v2-169042fd.jpg",
  "ageMin": 4,
  "ageMax": 12,
  "difficulty": 1,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Burpee with push-up",
    "description": "Crouch, plank, one push-up, then stand tall: a strong full-body move for strength and stamina, just like the Panda in the video.",
    "instructions": [
     "Turn sideways to the camera and stand up tall",
     "Crouch down and put your hands on the floor",
     "Take your legs back into a straight plank",
     "Do one push-up",
     "Bring your feet back under you, then stand up tall"
    ]
   },
   "de": {
    "name": "Burpee mit Liegestütz",
    "description": "Hocken, Plank, ein Liegestütz, dann aufrichten: eine starke Ganzkörperübung für Kraft und Ausdauer – genau wie der Panda im Video.",
    "instructions": [
     "Dreh dich seitlich zur Kamera und steh aufrecht",
     "Geh in die Hocke und setz die Hände auf den Boden",
     "Streck die Beine nach hinten in eine gerade Planke",
     "Mach einen Liegestütz",
     "Zieh die Füße wieder unter dich und steh aufrecht"
    ]
   },
   "uk": {
    "name": "Бурпі з віджиманням",
    "description": "Присід, планка, одне віджимання й підйом на повний зріст — сильна вправа на все тіло для сили та витривалості — так, як робить Панда на відео.",
    "instructions": [
     "Стань боком до камери і випрямись",
     "Присядь і постав руки на підлогу",
     "Відведи ноги назад у пряму планку",
     "Зроби одне віджимання",
     "Підтягни стопи під себе і знову випрямись"
    ]
   }
  },
  "phrases": [
   "do_a_push_up",
   "stand_up_tall",
   "turn_sideways",
   "show_full_body",
   "crouch_down_lower",
   "legs_back_to_plank",
   "feet_back_under_you"
  ]
 },
 "burpees": {
  "spec": {
   "key": "burpees",
   "goal": "reps",
   "gates": {
    "sideBy": "knee",
    "notSeenHint": "show_full_body",
    "minVisibility": 0.5,
    "maxInvalidFrames": 45
   },
   "notes": "Ported from beginnerBurpyAlgorithm.ts (05.11): spine poses as multi_position, aborts as abandon / sequence hints.",
   "facing": "side",
   "motion": {
    "type": "multi_position",
    "start": {
     "all": [
      {
       "m": "hip",
       "min": {
        "young": 143,
        "standard": 150
       },
       "hint": "stand_up_tall"
      },
      {
       "m": "torso_tilt",
       "min": 60,
       "hint": "stand_up_tall"
      }
     ]
    },
    "abandon": {
     "hint": "crouch_down_lower",
     "onlyIfReached": {
      "m": "hip",
      "max": 105
     }
    },
    "sequence": [
     {
      "id": "crouch_1",
      "hint": "crouch_down_lower",
      "position": {
       "all": [
        {
         "m": "hip",
         "max": {
          "young": 67,
          "standard": 60
         }
        }
       ]
      }
     },
     {
      "id": "plank",
      "hint": "legs_back_to_plank",
      "position": {
       "all": [
        {
         "m": "hip",
         "min": {
          "young": 143,
          "standard": 150
         }
        },
        {
         "m": "torso_tilt",
         "max": 40
        }
       ]
      }
     },
     {
      "id": "crouch_2",
      "hint": "feet_back_under_you",
      "position": {
       "all": [
        {
         "m": "hip",
         "max": {
          "young": 67,
          "standard": 60
         }
        }
       ]
      }
     }
    ],
    "confirmFrames": 1,
    "blockedStartHint": "stand_up_tall"
   },
   "phrases": {
    "stand_up_tall": {
     "text": {
      "de": "Steh am Anfang und am Ende gerade hin",
      "en": "Stand up tall at the start and at the end",
      "uk": "Стань прямо на початку і в кінці"
     },
     "voice": "exercise.hint.stand_up_tall"
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
    "crouch_down_lower": {
     "text": {
      "de": "Geh tiefer in die Hocke — Hände auf den Boden",
      "en": "Crouch down lower — put your hands on the floor",
      "uk": "Присядь нижче — постав руки на підлогу"
     },
     "voice": "exercise.hint.crouch_down_lower"
    },
    "legs_back_to_plank": {
     "text": {
      "de": "Streck die Beine nach hinten in eine gerade Planke",
      "en": "Take your legs back into a straight plank",
      "uk": "Відведи ноги назад у пряму планку"
     },
     "voice": "exercise.hint.legs_back_to_plank"
    },
    "feet_back_under_you": {
     "text": {
      "de": "Zieh die Füße wieder unter dich, bevor du aufstehst",
      "en": "Bring your feet back under you before you stand up",
      "uk": "Підтягни стопи під себе, перш ніж вставати"
     },
     "voice": "exercise.hint.feet_back_under_you"
    }
   },
   "version": 1,
   "facingHint": "turn_sideways",
   "specVersion": 1,
   "measurements": [
    {
     "id": "hip",
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
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "studio/burpees-v1-ddf30feb.mp4",
  "poster": "studio/burpees-v1-2c18f215.jpg",
  "ageMin": 4,
  "ageMax": 12,
  "difficulty": 1,
  "stat": "stamina",
  "texts": {
   "en": {
    "name": "Burpees",
    "description": "A full-body move: crouch, kick back to a plank, jump feet in and stand tall. Builds stamina and strength, just like the Panda in the video.",
    "instructions": [
     "Turn sideways to the camera and stand up tall",
     "Crouch down and put your hands on the floor",
     "Take your legs back into a straight plank",
     "Bring your feet back under you, then stand up tall"
    ]
   },
   "de": {
    "name": "Burpees",
    "description": "Eine Ganzkörperübung: hocken, Beine nach hinten in die Plank, Füße heranziehen und aufrichten. Das trainiert Ausdauer und Kraft – genau wie der Panda im Video.",
    "instructions": [
     "Dreh dich seitlich zur Kamera und steh aufrecht",
     "Geh in die Hocke und setz die Hände auf den Boden",
     "Streck die Beine nach hinten in eine gerade Planke",
     "Zieh die Füße wieder unter dich und steh aufrecht"
    ]
   },
   "uk": {
    "name": "Бурпі",
    "description": "Динамічна вправа на все тіло: присід, ноги назад у планку, ноги під себе й випрямитися. Розвиває витривалість і силу — так, як робить Панда на відео.",
    "instructions": [
     "Стань боком до камери і випрямись",
     "Присядь і постав руки на підлогу",
     "Відведи ноги назад у пряму планку",
     "Підтягни стопи під себе і знову випрямись"
    ]
   }
  },
  "phrases": [
   "stand_up_tall",
   "turn_sideways",
   "show_full_body",
   "crouch_down_lower",
   "legs_back_to_plank",
   "feet_back_under_you"
  ]
 },
 "hip_switch_90_90": {
  "spec": {
   "key": "hip_switch_90_90",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/hip_switch_90_90-v1-2f9efd6d.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/hip_switch_90_90-v1-2f9efd6d.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "right_hip",
       "min": {
        "young": 140.03,
        "standard": 162.47
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
       "max": 117.59
      }
     ]
    },
    "abandon": {
     "hint": "hip_switch_90_90_not_reached",
     "onlyIfReached": {
      "m": "right_hip",
      "min": 128.81
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "hip_switch_90_90_coach_1": {
     "text": {
      "de": "Tolle Bewegung!",
      "en": "Great motion!",
      "uk": "Чудовий рух!"
     }
    },
    "hip_switch_90_90_coach_2": {
     "text": {
      "de": "Super bewegliche Hüften!",
      "en": "Super flexy hips!",
      "uk": "Супер гнучкі стегна!"
     }
    },
    "hip_switch_90_90_coach_3": {
     "text": {
      "de": "Du machst das prima!",
      "en": "You are doing amazing!",
      "uk": "Ти справжній молодець!"
     }
    },
    "hip_switch_90_90_coach_4": {
     "text": {
      "de": "Weiter so!",
      "en": "Keep going strong!",
      "uk": "Так тримати!"
     }
    },
    "hip_switch_90_90_face_wrong": {
     "text": {
      "de": "Dreh dich zu mir!",
      "en": "Turn your face to me!",
      "uk": "Повернися обличчям до мене!"
     }
    },
    "hip_switch_90_90_not_reached": {
     "text": {
      "de": "Beuge dich noch ein Stück!",
      "en": "Bend a little more!",
      "uk": "Нахилися ще трошки!"
     }
    }
   },
   "version": 1,
   "facingHint": "hip_switch_90_90_face_wrong",
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
  "facing": "front",
  "goal": "reps",
  "video": "eotd/hip_switch_90_90-v1-2f9efd6d.mp4",
  "poster": "eotd/hip_switch_90_90-v1-2f9efd6d.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "90-90 Hip Switch",
    "description": "Sit like a nimble ninja, bow down to your knees, and stretch those super hips!",
    "instructions": [
     "Sit facing the phone and bend your chest down to your leg to count reps.",
     "Keep your back long and strong",
     "Lower your chest toward your leg",
     "Switch sides like a graceful butterfly",
     "Breathe smoothly with every tilt"
    ]
   },
   "de": {
    "name": "Hüft-Wechsel 90-90",
    "description": "Sitze wie ein geschickter Ninja, verbeuge dich und mache deine Hüften beweglich!",
    "instructions": [
     "Sitze mit dem Gesicht zum Handy und beuge die Brust zum Bein.",
     "Halte deinen Rücken schön gerade",
     "Senke die Brust zum Knie ab",
     "Wechsele sanft die Beine",
     "Atme ruhig bei jeder Bewegung"
    ]
   },
   "uk": {
    "name": "Перемикання стегон",
    "description": "Сядь як спритний ніндзя, нахиляйся до колін та тренуй свої гнучкі стегна!",
    "instructions": [
     "Сядь обличчям до екрана та нахиляй груди до ніжки для зарахування.",
     "Тримай спинку рівною та стрункою",
     "Опускай груди ближче до коліна",
     "М'яко перемикай ніжки вбік",
     "Дихай спокійно та посміхайся"
    ]
   }
  },
  "phrases": [
   "hip_switch_90_90_coach_1",
   "hip_switch_90_90_coach_2",
   "hip_switch_90_90_coach_3",
   "hip_switch_90_90_coach_4",
   "hip_switch_90_90_face_wrong",
   "hip_switch_90_90_not_reached"
  ]
 },
 "inchworm": {
  "spec": {
   "key": "inchworm",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/inchworm-v1-520d12e2.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/inchworm-v1-520d12e2.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–12, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_shoulder",
       "max": {
        "young": 105.29,
        "standard": 86
       }
      },
      {
       "m": "left_knee",
       "min": 143.92
      },
      {
       "m": "left_hip",
       "min": 124.17
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "left_shoulder"
    },
    "start": {
     "all": [
      {
       "m": "left_shoulder",
       "min": 124.57
      }
     ]
    },
    "abandon": {
     "hint": "inchworm_not_reached",
     "onlyIfReached": {
      "m": "left_shoulder",
      "max": 114.93
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "inchworm_coach_1": {
     "text": {
      "de": "Toll gekrabbelt!",
      "en": "Awesome crawling!",
      "uk": "Чудове рачкування!"
     }
    },
    "inchworm_coach_2": {
     "text": {
      "de": "Starker Liegestütz!",
      "en": "Strong push-up!",
      "uk": "Сильне відтискання!"
     }
    },
    "inchworm_coach_3": {
     "text": {
      "de": "Du bist sehr geschickt!",
      "en": "You move so smoothly!",
      "uk": "Рухаєшся дуже спритно!"
     }
    },
    "inchworm_coach_4": {
     "text": {
      "de": "Weiter so, Superheld!",
      "en": "Keep going, super athlete!",
      "uk": "Так тримати, супергерою!"
     }
    },
    "inchworm_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich zum Bildschirm!",
      "en": "Turn sideways to the screen!",
      "uk": "Повернися боком до екрана!"
     }
    },
    "inchworm_not_reached": {
     "text": {
      "de": "Krabbel noch ein Stück weiter!",
      "en": "Stretch out a little further!",
      "uk": "Протягнися ще трішки вперед!"
     }
    }
   },
   "version": 1,
   "facingHint": "inchworm_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_shoulder",
     "kind": "angle",
     "points": [
      "near_elbow",
      "near_shoulder",
      "near_hip"
     ]
    },
    {
     "id": "left_knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
      "near_ankle"
     ]
    },
    {
     "id": "left_hip",
     "kind": "angle",
     "points": [
      "near_shoulder",
      "near_hip",
      "near_knee"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/inchworm-v1-520d12e2.mp4",
  "poster": "eotd/inchworm-v1-520d12e2.jpg",
  "ageMin": 4,
  "ageMax": 12,
  "difficulty": 1,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Inchworm Push",
    "description": "Crawl forward on your hands like a tiny sea crab, do a fun push-up, and walk all the way back!",
    "instructions": [
     "Stand sideways to the phone, crawl hands forward into a push-up, and return back.",
     "Walk your hands step by step!",
     "Bend your arms for a great push-up!",
     "Crawl all the way back up!"
    ]
   },
   "de": {
    "name": "Krabben-Liegestütz",
    "description": "Krabble wie eine kleine Krabbe nach vorne, mache einen Liegestütz und wandere wieder zurück!",
    "instructions": [
     "Stelle dich seitlich zum Handy, krabble nach vorne in den Liegestütz und wandere zurück.",
     "Wandere Schritt für Schritt vor!",
     "Beuge die Arme beim Liegestütz!",
     "Krabble ganz zurück zu den Füßen!"
    ]
   },
   "uk": {
    "name": "Каракатиця",
    "description": "Крокуй руками вперед, наче кумедна каракатиця, зроби гарне відтискання та вертайся назад!",
    "instructions": [
     "Стань боком до телефону, крокуй руками вперед у планку, відтиснися та повертайся назад.",
     "Крокуй руками крок за кроком!",
     "Згинай лікті під час відтискання!",
     "Повертайся руками аж до ніжок!"
    ]
   }
  },
  "phrases": [
   "inchworm_coach_1",
   "inchworm_coach_2",
   "inchworm_coach_3",
   "inchworm_coach_4",
   "inchworm_face_wrong",
   "inchworm_not_reached"
  ]
 },
 "kneel_to_stand": {
  "spec": {
   "key": "kneel_to_stand",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/kneel_to_stand-v1-486bc0c4.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/kneel_to_stand-v1-486bc0c4.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_knee",
       "max": {
        "young": 90.69,
        "standard": 60.68
       }
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "left_knee"
    },
    "start": {
     "all": [
      {
       "m": "left_knee",
       "min": 120.7
      }
     ]
    },
    "abandon": {
     "hint": "kneel_to_stand_not_reached",
     "onlyIfReached": {
      "m": "left_knee",
      "max": 105.7
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "kneel_to_stand_coach_1": {
     "text": {
      "de": "Du wächst wie ein Riese!",
      "en": "You grow like a giant!",
      "uk": "Ти ростеш як справжній велетень!"
     }
    },
    "kneel_to_stand_coach_2": {
     "text": {
      "de": "Tolles und starkes Aufstehen!",
      "en": "Great and strong stand up!",
      "uk": "Чудовий та впевнений підйом!"
     }
    },
    "kneel_to_stand_coach_3": {
     "text": {
      "de": "Deine Beine werden so stark!",
      "en": "Your legs get so strong!",
      "uk": "Ніжки стають ще міцнішими!"
     }
    },
    "kneel_to_stand_coach_4": {
     "text": {
      "de": "Leicht und wunderbar gemacht!",
      "en": "Easy and super smooth move!",
      "uk": "Легко та дуже красиво!"
     }
    },
    "kneel_to_stand_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich zum Bildschirm!",
      "en": "Turn sideways to the screen!",
      "uk": "Повернися боком до екрана!"
     }
    },
    "kneel_to_stand_not_reached": {
     "text": {
      "de": "Richte dich ganz nach oben!",
      "en": "Stand up all the way!",
      "uk": "Випрямляйся аж до самого верху!"
     }
    }
   },
   "version": 1,
   "facingHint": "kneel_to_stand_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
      "near_ankle"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/kneel_to_stand-v1-486bc0c4.mp4",
  "poster": "eotd/kneel_to_stand-v1-486bc0c4.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Kneel to Stand",
    "description": "Turn into a mighty giant growing up from your knees straight to the clouds!",
    "instructions": [
     "Stand sideways to the screen and rise from your knees to full height.",
     "Lower to your knees softly and smoothly.",
     "Stand all the way up tall and straight.",
     "Keep your back straight while moving.",
     "Look straight ahead with a smile."
    ]
   },
   "de": {
    "name": "Aufstehen vom Knien",
    "description": "Verwandle dich in einen Riesen, der von den Knien bis zu den Wolken wächst!",
    "instructions": [
     "Stelle dich seitlich zum Bildschirm und stehe von den Knien auf.",
     "Knie dich sanft und ruhig nieder.",
     "Stehe stolz und aufrecht ganz auf.",
     "Halte deinen Rücken beim Bewegen gerade.",
     "Schaue geradeaus und lächle dabei."
    ]
   },
   "uk": {
    "name": "Підйом з колін",
    "description": "Перетворися на могутнього велетня, який виростає з колін прямо до хмаринок!",
    "instructions": [
     "Стань боком до екрана та підводься з колін у повний зріст.",
     "Ставай на коліна м'яко та плавно.",
     "Підводься вгору впевнено та струнко.",
     "Тримай спинку рівно під час руху.",
     "Дивися вперед та посміхайся."
    ]
   }
  },
  "phrases": [
   "kneel_to_stand_coach_1",
   "kneel_to_stand_coach_2",
   "kneel_to_stand_coach_3",
   "kneel_to_stand_coach_4",
   "kneel_to_stand_face_wrong",
   "kneel_to_stand_not_reached"
  ]
 },
 "leg_crossovers": {
  "spec": {
   "key": "leg_crossovers",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/leg_crossovers-v1-15091f72.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/leg_crossovers-v1-15091f72.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_knee",
       "min": {
        "young": 139.43,
        "standard": 158.91
       }
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "left_knee"
    },
    "start": {
     "all": [
      {
       "m": "left_knee",
       "max": 119.94
      }
     ]
    },
    "abandon": {
     "hint": "leg_crossovers_not_reached",
     "onlyIfReached": {
      "m": "left_knee",
      "min": 129.68
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "leg_crossovers_coach_1": {
     "text": {
      "de": "Tolle Beinbewegung!",
      "en": "Great leg swing!",
      "uk": "Чудовий мах ніжкою!"
     }
    },
    "leg_crossovers_coach_2": {
     "text": {
      "de": "Du bist wunderbar beweglich!",
      "en": "You are so super flexible!",
      "uk": "Ти дуже гнучкий і чудовий!"
     }
    },
    "leg_crossovers_coach_3": {
     "text": {
      "de": "Schwinge einfach weiter so!",
      "en": "Keep swinging so smoothly!",
      "uk": "Продовжуй так само плавно!"
     }
    },
    "leg_crossovers_coach_4": {
     "text": {
      "de": "Klasse Drehung machst du!",
      "en": "Wonderful twisting movement!",
      "uk": "Прекрасний поворот тулуба!"
     }
    },
    "leg_crossovers_face_wrong": {
     "text": {
      "de": "Dreh dich seitlich zur Kamera!",
      "en": "Turn sideways to the camera!",
      "uk": "Повернися боком до камери!"
     }
    },
    "leg_crossovers_not_reached": {
     "text": {
      "de": "Schwinge noch ein Stück höher!",
      "en": "Swing a little bit higher!",
      "uk": "Підніми ніжку ще трошки вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "leg_crossovers_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
      "near_ankle"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/leg_crossovers-v1-15091f72.mp4",
  "poster": "eotd/leg_crossovers-v1-15091f72.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Lying Leg Crossovers",
    "description": "Pretend your leg is a tail swinging from side to side! Have fun twisting like a happy dragon.",
    "instructions": [
     "Lie sideways to the camera and swing your top leg across to tap the floor.",
     "Twist your top leg all the way across!",
     "Keep your shoulders on the floor.",
     "Move smoothly like a soft wave."
    ]
   },
   "de": {
    "name": "Liegendes Beinheben",
    "description": "Stell dir vor, dein Bein ist ein drachenstarker Schwanz, der hin und her schwingt!",
    "instructions": [
     "Lege dich seitlich zur Kamera und schwinge dein Bein weit zur Seite.",
     "Schwinge das Bein ganz weit rüber!",
     "Lass beide Schultern am Boden.",
     "Bewege dich sanft und gleichmäßig."
    ]
   },
   "uk": {
    "name": "Перехресні махи ногою",
    "description": "Уяви, що твоя ніжка — це веселий хвостик дракончика, який гойдається вбік!",
    "instructions": [
     "Ляж боком до камери та перенось ніжку вбік, торкаючись підлоги.",
     "Перенось ніжку якнайдалі вбік!",
     "Тримай плечі рівно на підлозі.",
     "Рухайся м'яко та плавно."
    ]
   }
  },
  "phrases": [
   "leg_crossovers_coach_1",
   "leg_crossovers_coach_2",
   "leg_crossovers_coach_3",
   "leg_crossovers_coach_4",
   "leg_crossovers_face_wrong",
   "leg_crossovers_not_reached"
  ]
 },
 "plank_kick_through": {
  "spec": {
   "key": "plank_kick_through",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/plank_kick_through-v1-6331ea26.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/plank_kick_through-v1-6331ea26.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 3, ages 7–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "right_shoulder",
       "min": {
        "young": 104.93,
        "standard": 123.78
       }
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "right_shoulder"
    },
    "start": {
     "all": [
      {
       "m": "right_shoulder",
       "max": 86.07
      }
     ]
    },
    "abandon": {
     "hint": "plank_kick_through_not_reached",
     "onlyIfReached": {
      "m": "right_shoulder",
      "min": 95.5
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "plank_kick_through_coach_1": {
     "text": {
      "de": "Starke Leistung!",
      "en": "Wow, super strength!",
      "uk": "Вау, яка сила!"
     }
    },
    "plank_kick_through_coach_2": {
     "text": {
      "de": "Wie ein echter Ninja!",
      "en": "Like a true ninja!",
      "uk": "Справжній ніндзя!"
     }
    },
    "plank_kick_through_coach_3": {
     "text": {
      "de": "Mach weiter so!",
      "en": "Keep up the momentum!",
      "uk": "Рухайся активно!"
     }
    },
    "plank_kick_through_coach_4": {
     "text": {
      "de": "Du bist ein Superhero!",
      "en": "You are a superhero!",
      "uk": "Ти супергерой!"
     }
    },
    "plank_kick_through_face_wrong": {
     "text": {
      "de": "Dreh dich zur Kamera!",
      "en": "Turn your face to camera!",
      "uk": "Повернися обличчям до екрана!"
     }
    },
    "plank_kick_through_not_reached": {
     "text": {
      "de": "Kicke dein Bein weiter!",
      "en": "Kick your leg out further!",
      "uk": "Тягни ніжку ще далі!"
     }
    }
   },
   "version": 1,
   "facingHint": "plank_kick_through_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "right_shoulder",
     "kind": "angle",
     "points": [
      "right_elbow",
      "right_shoulder",
      "right_hip"
     ]
    }
   ]
  },
  "facing": "front",
  "goal": "reps",
  "video": "eotd/plank_kick_through-v1-6331ea26.mp4",
  "poster": "eotd/plank_kick_through-v1-6331ea26.jpg",
  "ageMin": 7,
  "ageMax": 18,
  "difficulty": 3,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Kick Through Plank",
    "description": "Get into a plank and turn into a superhero! Twist and kick your leg out like a real ninja.",
    "instructions": [
     "Face the screen in a plank and turn your body to kick your leg sideways.",
     "Keep your back straight.",
     "Lift one hand and stretch your leg.",
     "Look right at the camera.",
     "Move smoothly and with strength."
    ]
   },
   "de": {
    "name": "Kick-Plank",
    "description": "Geh in die Plank und werde zum Ninja! Drehe dich und kicke dein Bein weit zur Seite.",
    "instructions": [
     "Stütze dich zur Kamera und drehe dich, um das Bein zur Seite zu kicken.",
     "Halte deinen Rücken gerade.",
     "Hebe eine Hand und strecke ein Bein.",
     "Schau direkt in die Kamera.",
     "Bewege dich gleichmäßig."
    ]
   },
   "uk": {
    "name": "Планка з викидом",
    "description": "Ставай у планку та перетворюйся на супергероя! Крутись і витягуй ніжку, мов справжній ніндзя.",
    "instructions": [
     "Стань обличчям до екрана в планку та повертай тулуб, витягуючи ногу вбік.",
     "Тримай спинку рівно.",
     "Піднімай руку та тягни протилежну ногу.",
     "Дивися вперед на екран.",
     "Виконуй рухи плавно."
    ]
   }
  },
  "phrases": [
   "plank_kick_through_coach_1",
   "plank_kick_through_coach_2",
   "plank_kick_through_coach_3",
   "plank_kick_through_coach_4",
   "plank_kick_through_face_wrong",
   "plank_kick_through_not_reached"
  ]
 },
 "prone_arm_sweep": {
  "spec": {
   "key": "prone_arm_sweep",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/prone_arm_sweep-v1-8df2030f.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/prone_arm_sweep-v1-8df2030f.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 1, ages 4–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_wrist_h",
       "min": {
        "young": -0.36,
        "standard": -0.17
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
       "max": -0.56
      }
     ]
    },
    "abandon": {
     "hint": "prone_arm_sweep_not_reached",
     "onlyIfReached": {
      "m": "left_wrist_h",
      "min": -0.46
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "prone_arm_sweep_coach_1": {
     "text": {
      "de": "Wunderschöne Flügel!",
      "en": "Amazing wings!",
      "uk": "Дивовижні крила!"
     }
    },
    "prone_arm_sweep_coach_2": {
     "text": {
      "de": "Wundervoller Engel!",
      "en": "Wonderful angel!",
      "uk": "Чудовий янгол!"
     }
    },
    "prone_arm_sweep_coach_3": {
     "text": {
      "de": "Weiter so, super!",
      "en": "Keep it up, super!",
      "uk": "Так тримати, супер!"
     }
    },
    "prone_arm_sweep_coach_4": {
     "text": {
      "de": "Du fliegst so hoch!",
      "en": "Flying so high!",
      "uk": "Летиш дуже високо!"
     }
    },
    "prone_arm_sweep_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich zur Kamera!",
      "en": "Turn sideways to the camera!",
      "uk": "Повернися до камери бочком!"
     }
    },
    "prone_arm_sweep_not_reached": {
     "text": {
      "de": "Strecke die Arme noch höher!",
      "en": "Reach your arms even higher!",
      "uk": "Тягнися руками ще вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "prone_arm_sweep_face_wrong",
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
  "facing": "side",
  "goal": "reps",
  "video": "eotd/prone_arm_sweep-v1-8df2030f.mp4",
  "poster": "eotd/prone_arm_sweep-v1-8df2030f.jpg",
  "ageMin": 4,
  "ageMax": 18,
  "difficulty": 1,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Prone Angel",
    "description": "Turn into a snow angel right on the floor! Move your arms like magical wings.",
    "instructions": [
     "Lie on your tummy sideways to the camera and sweep your arms overhead and back!",
     "Keep your arms straight.",
     "Reach all the way overhead.",
     "Move your arms smoothly."
    ]
   },
   "de": {
    "name": "Bauch-Engel",
    "description": "Werde zum Schnee-Engel auf dem Boden! Bewege deine Arme wie Zauberflügel.",
    "instructions": [
     "Lege dich seitlich zur Kamera auf den Bauch und bewege die Arme auf und ab!",
     "Halte die Arme gerade.",
     "Strecke die Arme weit hoch.",
     "Bewege dich ganz sanft."
    ]
   },
   "uk": {
    "name": "Лежачий янгол",
    "description": "Перетворися на снігового янгола на підлозі! Рухай руками красиво, мов крилами.",
    "instructions": [
     "Ляж боком до камери на живіт та махай руками від стегон до голови й назад!",
     "Тримай руки прямими.",
     "Тягнися руками аж до голови.",
     "Рухайся плавно та весело."
    ]
   }
  },
  "phrases": [
   "prone_arm_sweep_coach_1",
   "prone_arm_sweep_coach_2",
   "prone_arm_sweep_coach_3",
   "prone_arm_sweep_coach_4",
   "prone_arm_sweep_face_wrong",
   "prone_arm_sweep_not_reached"
  ]
 },
 "reverse_plank_lift": {
  "spec": {
   "key": "reverse_plank_lift",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/reverse_plank_lift-v1-54ea227a.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/reverse_plank_lift-v1-54ea227a.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_knee",
       "max": {
        "young": 161.82,
        "standard": 159.8
       }
      },
      {
       "m": "left_thigh_tilt",
       "min": 13.22
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "left_knee"
    },
    "start": {
     "all": [
      {
       "m": "left_knee",
       "min": 163.85
      }
     ]
    },
    "abandon": {
     "hint": "reverse_plank_lift_not_reached",
     "onlyIfReached": {
      "m": "left_knee",
      "max": 162.84
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "reverse_plank_lift_coach_1": {
     "text": {
      "de": "Tolle Krebs-Kraft!",
      "en": "Awesome crab power!",
      "uk": "Чудова сила крабика!"
     }
    },
    "reverse_plank_lift_coach_2": {
     "text": {
      "de": "Du hebst dich super hoch!",
      "en": "You are lifting so high!",
      "uk": "Ти піднімаєшся дуже високо!"
     }
    },
    "reverse_plank_lift_coach_3": {
     "text": {
      "de": "Drücke dich weiter hoch!",
      "en": "Keep pushing up high!",
      "uk": "Тягнися вище до сонечка!"
     }
    },
    "reverse_plank_lift_coach_4": {
     "text": {
      "de": "Starke und schöne Brücke!",
      "en": "Super strong bridge!",
      "uk": "Міцний та гарний місток!"
     }
    },
    "reverse_plank_lift_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich zur Kamera!",
      "en": "Turn your side to camera!",
      "uk": "Повернися боком до камери!"
     }
    },
    "reverse_plank_lift_not_reached": {
     "text": {
      "de": "Hebe dein Becken noch höher!",
      "en": "Reach a little bit higher!",
      "uk": "Піднімай животик ще трохи вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "reverse_plank_lift_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
      "near_ankle"
     ]
    },
    {
     "id": "left_thigh_tilt",
     "kind": "tilt",
     "points": [
      "near_hip",
      "near_knee"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/reverse_plank_lift-v1-54ea227a.mp4",
  "poster": "eotd/reverse_plank_lift-v1-54ea227a.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Reverse Plank Lift",
    "description": "Become a strong crab pushing its belly to the sky! Lift your hips up and build amazing super strength.",
    "instructions": [
     "Sit sideways to the camera, press through your hands and feet, and lift your hips high to count reps.",
     "Keep your hands right under your shoulders.",
     "Push your hips up as high as you can.",
     "Press your feet firmly into the floor.",
     "Look up at the sky while you lift."
    ]
   },
   "de": {
    "name": "Umgekehrte Planke",
    "description": "Werde zum starken Krebs und drücke deinen Bauch zum Himmel! Hebe dein Becken hoch für Superkräfte.",
    "instructions": [
     "Setze dich seitlich zur Kamera, stütze dich auf Hände und Füße und hebe dein Becken hoch.",
     "Stütze die Hände unter deine Schultern.",
     "Drücke dein Becken so hoch du kannst.",
     "Stehe fest mit den Füßen auf dem Boden.",
     "Schau beim Heben nach oben."
    ]
   },
   "uk": {
    "name": "Зворотна планка",
    "description": "Перетворися на дужого крабика! Піднімай животик височенько до неба та ставай ще сильнішим.",
    "instructions": [
     "Сядь боком до камери, спирайся на руки й ноги та піднімай таз угору для відліку повторів.",
     "Став долоні просто під плечима.",
     "Штовхай таз якомога вище вгору.",
     "Міцно спирайся стопами об підлогу.",
     "Дивись угору під час підйому."
    ]
   }
  },
  "phrases": [
   "reverse_plank_lift_coach_1",
   "reverse_plank_lift_coach_2",
   "reverse_plank_lift_coach_3",
   "reverse_plank_lift_coach_4",
   "reverse_plank_lift_face_wrong",
   "reverse_plank_lift_not_reached"
  ]
 },
 "seal_jacks": {
  "spec": {
   "key": "seal_jacks",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/seal_jacks-v1-3bb9acef.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/seal_jacks-v1-3bb9acef.mp4"
   },
   "notes": "Exercise of the day 2026-11-21 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from an Omni adult reference (young top line +25 %), difficulty 1, ages 5–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "wrists",
       "min": {
        "young": 1.67,
        "standard": 1.99
       }
      },
      {
       "m": "feet",
       "min": 0.6
      }
     ]
    },
    "type": "jump",
    "drive": {
     "m": "wrists",
     "velocity": 0.02,
     "trendFrames": 2
    },
    "start": {
     "all": [
      {
       "m": "wrists",
       "max": 1.34
      },
      {
       "m": "feet",
       "max": 0.62
      }
     ]
    },
    "abandon": {
     "hint": "seal_jacks_not_reached",
     "onlyIfReached": {
      "m": "wrists",
      "min": 1.5
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "seal_jacks_coach_1": {
     "text": {
      "de": "Klasse geklatscht!",
      "en": "Awesome clapping!",
      "uk": "Чудове плескання!"
     }
    },
    "seal_jacks_coach_2": {
     "text": {
      "de": "Du springst so toll!",
      "en": "You jump so well!",
      "uk": "Ти стрибаєш чудово!"
     }
    },
    "seal_jacks_coach_3": {
     "text": {
      "de": "Halte den tollen Rhythmus!",
      "en": "Keep up the great rhythm!",
      "uk": "Тримай чудовий ритм!"
     }
    },
    "seal_jacks_face_wrong": {
     "text": {
      "de": "Drehe dich zur Kamera!",
      "en": "Turn to face the camera!",
      "uk": "Повернися обличчям до камери!"
     }
    },
    "seal_jacks_not_reached": {
     "text": {
      "de": "Klatsche ganz weit zusammen!",
      "en": "Clap hands all the way!",
      "uk": "Плескай у долоні до кінця!"
     }
    }
   },
   "version": 1,
   "facingHint": "seal_jacks_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "wrists",
     "kind": "distance",
     "points": [
      "left_wrist",
      "right_wrist"
     ]
    },
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
  "facing": "front",
  "goal": "reps",
  "video": "eotd/seal_jacks-v1-3bb9acef.mp4",
  "poster": "eotd/seal_jacks-v1-3bb9acef.jpg",
  "ageMin": 5,
  "ageMax": 18,
  "difficulty": 1,
  "stat": "speed",
  "texts": {
   "en": {
    "name": "Seal Jacks",
    "description": "Clap like a playful seal while jumping! Open your arms wide and bring them together.",
    "instructions": [
     "Stand facing the camera, jump your feet apart and clap your hands in front to count.",
     "Open your arms wide to the sides",
     "Clap your hands right in front",
     "Jump your feet out and together"
    ]
   },
   "de": {
    "name": "Seehund-Jumps",
    "description": "Klatsche wie ein fröhlicher Seehund beim Springen! Öffne deine Arme weit.",
    "instructions": [
     "Stelle dich vor die Kamera, springe und klatsche vorne für jede Wiederholung.",
     "Öffne die Arme weit zu den Seiten",
     "Klatsche direkt vor dir zusammen",
     "Springe mit den Füßen auf und zu"
    ]
   },
   "uk": {
    "name": "Морські котики",
    "description": "Плескай як грайливий морський котик! Розводь руки широко та зводь їх разом.",
    "instructions": [
     "Стань обличчям до камери, стрибай та плескай у долоні перед собою для зарахування.",
     "Розводь руки широко в боки",
     "Плескай у долоні прямо перед собою",
     "Стрибай ногами в боки та разом"
    ]
   }
  },
  "phrases": [
   "seal_jacks_coach_1",
   "seal_jacks_coach_2",
   "seal_jacks_coach_3",
   "seal_jacks_face_wrong",
   "seal_jacks_not_reached"
  ]
 },
 "seated_knee_tucks": {
  "spec": {
   "key": "seated_knee_tucks",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/seated_knee_tucks-v1-3b619355.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/seated_knee_tucks-v1-3b619355.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_knee",
       "max": {
        "young": 114.29,
        "standard": 100.78
       }
      },
      {
       "m": "left_knee_h",
       "min": 0.55
      },
      {
       "m": "left_hip",
       "max": 112.05
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "left_knee"
    },
    "start": {
     "all": [
      {
       "m": "left_knee",
       "min": 127.79
      }
     ]
    },
    "abandon": {
     "hint": "seated_knee_tucks_not_reached",
     "onlyIfReached": {
      "m": "left_knee",
      "max": 121.04
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "seated_knee_tucks_coach_1": {
     "text": {
      "de": "Tolle Bewegung!",
      "en": "Awesome folding movement!",
      "uk": "Чудова робота ніжок!"
     }
    },
    "seated_knee_tucks_coach_2": {
     "text": {
      "de": "Das machst du super!",
      "en": "You are doing great!",
      "uk": "У тебе чудово виходить!"
     }
    },
    "seated_knee_tucks_coach_3": {
     "text": {
      "de": "Weiter so!",
      "en": "Keep pulling those knees!",
      "uk": "Продовжуй у тому ж дусі!"
     }
    },
    "seated_knee_tucks_coach_4": {
     "text": {
      "de": "Starke Beine!",
      "en": "Super strong legs!",
      "uk": "Неймовірна сила!"
     }
    },
    "seated_knee_tucks_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich zum Bildschirm!",
      "en": "Turn sideways to the screen!",
      "uk": "Повернися боком до екрана!"
     }
    },
    "seated_knee_tucks_not_reached": {
     "text": {
      "de": "Ziehe die Knie noch höher!",
      "en": "Pull your knees higher!",
      "uk": "Підтягни коліна ще вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "seated_knee_tucks_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
      "near_ankle"
     ]
    },
    {
     "id": "left_knee_h",
     "ref": "hip_mid",
     "kind": "height",
     "point": "near_knee"
    },
    {
     "id": "left_hip",
     "kind": "angle",
     "points": [
      "near_shoulder",
      "near_hip",
      "near_knee"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/seated_knee_tucks-v1-3b619355.mp4",
  "poster": "eotd/seated_knee_tucks-v1-3b619355.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Seated Knee Tucks",
    "description": "Sit down, lean back slightly, and pull your knees close to your chest like a folding accordion!",
    "instructions": [
     "Sit sideways to the camera and pull your knees up to your chest!",
     "Sit sideways so the screen can see you!",
     "Pull your knees as high as you can!",
     "Stretch your legs out and pull them back in!",
     "Keep a smooth and steady rhythm!"
    ]
   },
   "de": {
    "name": "Knie zum Brustkorb",
    "description": "Setze dich hin, lehne dich leicht zurück und ziehe die Knie ganz nah heran!",
    "instructions": [
     "Setze dich seitlich zum Bildschirm und ziehe die Knie an!",
     "Setze dich seitlich zur Kamera!",
     "Ziehe die Knie ganz nah heran!",
     "Strecke die Beine aus und ziehe sie an!",
     "Halte ein gleichmäßiges Tempo!"
    ]
   },
   "uk": {
    "name": "Коліна до грудей",
    "description": "Сядь зручно, відхились назад і підтягуй коліна до грудей, мов гармошка!",
    "instructions": [
     "Сядь боком до екрана та підтягуй коліна до грудей!",
     "Повернися боком до екрана!",
     "Підтягуй коліна якомога вище!",
     "Випрямляй і знову згинай ніжки!",
     "Тримай рівний та веселий темп!"
    ]
   }
  },
  "phrases": [
   "seated_knee_tucks_coach_1",
   "seated_knee_tucks_coach_2",
   "seated_knee_tucks_coach_3",
   "seated_knee_tucks_coach_4",
   "seated_knee_tucks_face_wrong",
   "seated_knee_tucks_not_reached"
  ]
 },
 "side_lunge": {
  "spec": {
   "key": "side_lunge",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_lunge-v1-37ee44c3.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_lunge-v1-37ee44c3.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "feet",
       "max": {
        "young": 0.94,
        "standard": 0.42
       }
      },
      {
       "m": "right_hip",
       "min": 136.12
      },
      {
       "m": "right_knee",
       "min": 146.78
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
       "min": 1.46
      }
     ]
    },
    "abandon": {
     "hint": "side_lunge_not_reached",
     "onlyIfReached": {
      "m": "feet",
      "max": 1.2
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "side_lunge_coach_1": {
     "text": {
      "de": "Toller Ausfallschritt!",
      "en": "Great lunge!",
      "uk": "Чудовий випад!"
     }
    },
    "side_lunge_coach_2": {
     "text": {
      "de": "Das machst du super!",
      "en": "You are moving great!",
      "uk": "Ти рухаєшся чудово!"
     }
    },
    "side_lunge_coach_3": {
     "text": {
      "de": "Noch ein starker Schritt!",
      "en": "Another strong step!",
      "uk": "Ще один сильний крок!"
     }
    },
    "side_lunge_coach_4": {
     "text": {
      "de": "Super Stärke!",
      "en": "Super power!",
      "uk": "Супер сила!"
     }
    },
    "side_lunge_face_wrong": {
     "text": {
      "de": "Schau wieder nach vorne!",
      "en": "Turn to face the camera!",
      "uk": "Повернися обличчям до мене!"
     }
    },
    "side_lunge_not_reached": {
     "text": {
      "de": "Geh noch etwas tiefer!",
      "en": "Go a little lower!",
      "uk": "Сядь трішки глибше!"
     }
    }
   },
   "version": 1,
   "facingHint": "side_lunge_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "feet",
     "kind": "distance",
     "points": [
      "left_ankle",
      "right_ankle"
     ]
    },
    {
     "id": "right_hip",
     "kind": "angle",
     "points": [
      "right_shoulder",
      "right_hip",
      "right_knee"
     ]
    },
    {
     "id": "right_knee",
     "kind": "angle",
     "points": [
      "right_hip",
      "right_knee",
      "right_ankle"
     ]
    }
   ]
  },
  "facing": "front",
  "goal": "reps",
  "video": "eotd/side_lunge-v1-37ee44c3.mp4",
  "poster": "eotd/side_lunge-v1-37ee44c3.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Side Lunges",
    "description": "Step wide like a side-stepping crab and bend one knee to make big moves!",
    "instructions": [
     "Face the screen and step wide to the side so the camera counts your moves.",
     "Take a big step to the side.",
     "Bend one knee and keep your back straight.",
     "Keep your chest up as you step.",
     "Push back to the center every time."
    ]
   },
   "de": {
    "name": "Seitfallschritte",
    "description": "Mache große Schritte zur Seite wie eine Krabbe und beuge dein Knie!",
    "instructions": [
     "Schau in die Kamera und mache breite Schritte zur Seite, damit sie zählt.",
     "Mach einen großen Schritt zur Seite.",
     "Beuge ein Knie und bleib aufrecht.",
     "Halte deinen Rücken schön gerade.",
     "Drücke dich zurück in die Mitte."
    ]
   },
   "uk": {
    "name": "Бічні випади",
    "description": "Зроби крок убік та присідай, ніби супергерой або кумедний крабик!",
    "instructions": [
     "Стань обличчям до екрана та роби широкі випади вбік, щоб телефон рахував повторення.",
     "Ставай широко та роби крок убік.",
     "Тримай спинку рівно під час випаду.",
     "Згинай одне коліно, а іншу ногу випрямляй.",
     "Повертайся у центр після кожного випаду."
    ]
   }
  },
  "phrases": [
   "side_lunge_coach_1",
   "side_lunge_coach_2",
   "side_lunge_coach_3",
   "side_lunge_coach_4",
   "side_lunge_face_wrong",
   "side_lunge_not_reached"
  ]
 },
 "side_plank_rotation": {
  "spec": {
   "key": "side_plank_rotation",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_plank_rotation-v1-ce59fff2.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/side_plank_rotation-v1-ce59fff2.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 3, ages 7–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "wrists",
       "max": {
        "young": 0.68,
        "standard": 0.27
       }
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "wrists",
     "velocity": 0.02,
     "trendFrames": 2
    },
    "start": {
     "all": [
      {
       "m": "wrists",
       "min": 1.08
      }
     ]
    },
    "abandon": {
     "hint": "side_plank_rotation_not_reached",
     "onlyIfReached": {
      "m": "wrists",
      "max": 0.88
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "side_plank_rotation_coach_1": {
     "text": {
      "de": "Tolle Drehung!",
      "en": "Great rotation!",
      "uk": "Чудовий поворот!"
     }
    },
    "side_plank_rotation_coach_2": {
     "text": {
      "de": "Du strahlst wie ein Stern!",
      "en": "You shine like a star!",
      "uk": "Сяєш як справжня зірка!"
     }
    },
    "side_plank_rotation_coach_3": {
     "text": {
      "de": "Einwandfrei und stark!",
      "en": "Smooth and steady!",
      "uk": "Рівно та красиво!"
     }
    },
    "side_plank_rotation_coach_4": {
     "text": {
      "de": "Weiter so, super gemacht!",
      "en": "Way to go, keep moving!",
      "uk": "Молодчина, так тримати!"
     }
    },
    "side_plank_rotation_face_wrong": {
     "text": {
      "de": "Drehe dich zum Bildschirm!",
      "en": "Turn your tummy to screen!",
      "uk": "Повернися животиком до екрана!"
     }
    },
    "side_plank_rotation_not_reached": {
     "text": {
      "de": "Strecke dich noch höher!",
      "en": "Reach your arm even higher!",
      "uk": "Дотягнися ручкою ще вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "side_plank_rotation_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "wrists",
     "kind": "distance",
     "points": [
      "left_wrist",
      "right_wrist"
     ]
    }
   ]
  },
  "facing": "front",
  "goal": "reps",
  "video": "eotd/side_plank_rotation-v1-ce59fff2.mp4",
  "poster": "eotd/side_plank_rotation-v1-ce59fff2.jpg",
  "ageMin": 7,
  "ageMax": 18,
  "difficulty": 3,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Side Plank Rotation",
    "description": "Turn into a shiny star! Rest on your arm, twist your body, and reach high up to the sun.",
    "instructions": [
     "Lie on your side facing the screen and rotate your body up!",
     "Keep your body straight and strong.",
     "Rotate smoothly and slowly.",
     "Reach your hand up to the sky.",
     "Face the screen directly."
    ]
   },
   "de": {
    "name": "Seitliche Stützdrehung",
    "description": "Werde zu einem hellen Stern! Stütze dich ab, drehe deinen Körper und reiche hoch zur Sonne.",
    "instructions": [
     "Liege seitlich zum Bildschirm und drehe deinen Körper hoch!",
     "Halte deinen Körper stark und gerade.",
     "Drehe dich langsam und gleichmäßig.",
     "Strecke deine Hand hoch zum Himmel.",
     "Schaue direkt in den Bildschirm."
    ]
   },
   "uk": {
    "name": "Планка з поворотом",
    "description": "Перетворися на сяючу зірочку! Спирайся на руку, крутись та тягнися ручкою високо до сонечка.",
    "instructions": [
     "Лягай на бік обличчям до екрана та повертай тулуб угору!",
     "Тримай тулуб рівно та міцно.",
     "Повертайся повільно й плавно.",
     "Тягнися рукою високо догори.",
     "Дивись прямо в камеру."
    ]
   }
  },
  "phrases": [
   "side_plank_rotation_coach_1",
   "side_plank_rotation_coach_2",
   "side_plank_rotation_coach_3",
   "side_plank_rotation_coach_4",
   "side_plank_rotation_face_wrong",
   "side_plank_rotation_not_reached"
  ]
 },
 "simple_swing": {
  "spec": {
   "key": "simple_swing",
   "goal": "reps",
   "gates": {
    "sideBy": "elbow",
    "notSeenHint": "show_your_arm",
    "minVisibility": 0.5,
    "maxInvalidFrames": 45,
    "notSeenAfterFrames": 10
   },
   "notes": "Ported from simpleSwingAlgorithm.ts (05.11).",
   "facing": "any",
   "motion": {
    "top": {
     "all": [
      {
       "m": "shoulder",
       "max": {
        "young": 62,
        "standard": 55
       }
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "shoulder",
     "velocity": 0.09,
     "trendFrames": 3
    },
    "start": {
     "all": [
      {
       "m": "shoulder",
       "min": {
        "young": 83,
        "standard": 90
       }
      }
     ]
    },
    "abandon": {
     "hint": "swing_all_the_way_down",
     "onlyIfReached": {
      "m": "shoulder",
      "max": 72.5
     }
    },
    "countAt": "top",
    "approach": {
     "hint": "raise_your_arm",
     "onlyIfReached": {
      "m": "shoulder",
      "min": 72.5
     }
    },
    "minRepIntervalMs": 1200,
    "startConfirmMaxAgeMs": 60000
   },
   "phrases": {
    "show_your_arm": {
     "text": {
      "de": "Dreh dich so, dass die Kamera Arm und Schulter sieht",
      "en": "Turn so the camera can see your arm and shoulder",
      "uk": "Повернись так, щоб камера бачила твою руку і плече"
     },
     "voice": "exercise.hint.show_your_arm"
    },
    "raise_your_arm": {
     "text": {
      "de": "Heb den Arm höher, bevor du ihn nach unten schwingst",
      "en": "Raise your arm higher before you swing it down",
      "uk": "Піднімай руку вище, перш ніж опускати її вниз"
     },
     "voice": "exercise.hint.raise_your_arm"
    },
    "swing_all_the_way_down": {
     "text": {
      "de": "Schwing den Arm ganz nach unten an den Körper",
      "en": "Swing your arm all the way down to your side",
      "uk": "Опускай руку повністю вниз, до тіла"
     },
     "voice": "exercise.hint.swing_all_the_way_down"
    }
   },
   "version": 1,
   "specVersion": 1,
   "measurements": [
    {
     "id": "shoulder",
     "kind": "angle",
     "points": [
      "near_elbow",
      "near_shoulder",
      "near_hip"
     ]
    }
   ]
  },
  "facing": "any",
  "goal": "reps",
  "video": "studio/simple_swing-v1-4e9adaa5.mp4",
  "poster": "studio/simple_swing-v1-4bf8bf91.jpg",
  "ageMin": 4,
  "ageMax": 12,
  "difficulty": 1,
  "stat": "speed",
  "texts": {
   "en": {
    "name": "Simple swing",
    "description": "Smooth arm swings up and down loosen your shoulders and build flexibility, just like the Panda in the video.",
    "instructions": [
     "Stand still",
     "Lift one arm up to your shoulder or higher",
     "Swing it back down to your side",
     "You can hold a soft prop in that hand"
    ]
   },
   "de": {
    "name": "Einfacher Schwung",
    "description": "Sanfte Armschwünge nach oben und unten lockern die Schultern und machen beweglich – genau wie der Panda im Video.",
    "instructions": [
     "Steh still",
     "Heb einen Arm bis auf Schulterhöhe oder höher",
     "Schwing ihn wieder nach unten an die Seite",
     "Du kannst etwas Weiches in der Hand halten"
    ]
   },
   "uk": {
    "name": "Простий мах",
    "description": "Плавні помахи рукою вгору й униз розминають плечі та розвивають рухливість — так, як робить Панда на відео.",
    "instructions": [
     "Стань рівно",
     "Підніми одну руку щонайменше до рівня плеча",
     "Опусти її вниз уздовж тіла",
     "У цій руці можна тримати м'який предмет"
    ]
   }
  },
  "phrases": [
   "show_your_arm",
   "raise_your_arm",
   "swing_all_the_way_down"
  ]
 },
 "single_leg_deadlift": {
  "spec": {
   "key": "single_leg_deadlift",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/single_leg_deadlift-v1-17545ce0.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/single_leg_deadlift-v1-17545ce0.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "feet",
       "min": {
        "young": 1.61,
        "standard": 2.05
       }
      },
      {
       "m": "left_elbow",
       "max": 59.46
      },
      {
       "m": "left_torso_tilt",
       "max": 39.02
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
       "max": 1.18
      }
     ]
    },
    "abandon": {
     "hint": "single_leg_deadlift_not_reached",
     "onlyIfReached": {
      "m": "feet",
      "min": 1.4
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "single_leg_deadlift_coach_1": {
     "text": {
      "de": "Tolle Balance!",
      "en": "Awesome balance!",
      "uk": "Чудова рівновага!"
     }
    },
    "single_leg_deadlift_coach_2": {
     "text": {
      "de": "Wie ein echter Flamingo!",
      "en": "Just like a flamingo!",
      "uk": "Мов справжній фламінго!"
     }
    },
    "single_leg_deadlift_coach_3": {
     "text": {
      "de": "Super starkes Bein!",
      "en": "Super strong leg!",
      "uk": "Дуже міцна ніжка!"
     }
    },
    "single_leg_deadlift_coach_4": {
     "text": {
      "de": "Das machst du super!",
      "en": "You are doing great!",
      "uk": "У тебе виходить чудово!"
     }
    },
    "single_leg_deadlift_face_wrong": {
     "text": {
      "de": "Drehe dich seitlich!",
      "en": "Turn sideways to camera!",
      "uk": "Повернися боком до камери!"
     }
    },
    "single_leg_deadlift_not_reached": {
     "text": {
      "de": "Noch ein Stückchen höher!",
      "en": "Reach a little higher!",
      "uk": "Тягнися ще трошки вгору!"
     }
    }
   },
   "version": 1,
   "facingHint": "single_leg_deadlift_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "feet",
     "kind": "distance",
     "points": [
      "near_ankle",
      "far_ankle"
     ]
    },
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
     "id": "left_torso_tilt",
     "kind": "tilt",
     "points": [
      "near_shoulder",
      "near_hip"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/single_leg_deadlift-v1-17545ce0.mp4",
  "poster": "eotd/single_leg_deadlift-v1-17545ce0.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Flamingo Reach",
    "description": "Pretend to be a flamingo! Balance gracefully on one leg and reach forward.",
    "instructions": [
     "Stand sideways to the camera and bend forward on one leg.",
     "Keep your back straight.",
     "Reach down smoothly.",
     "Extend your back leg.",
     "Rise up with steady balance."
    ]
   },
   "de": {
    "name": "Flamingo-Neigung",
    "description": "Werde zum Flamingo! Halte das Gleichgewicht und neige dich auf einem Bein.",
    "instructions": [
     "Stelle dich seitlich zur Kamera und neige dich auf einem Bein nach vorne.",
     "Halte deinen Rücken gerade.",
     "Neige dich langsam nach vorne.",
     "Strecke ein Bein nach hinten.",
     "Kehre ruhig wieder nach oben."
    ]
   },
   "uk": {
    "name": "Нахил фламінго",
    "description": "Уяви себе струнким фламінго! Тримай рівновагу та нахиляйся вперед на одній ніжці.",
    "instructions": [
     "Встань боком до камери та нахиляйся вперед на одній нозі.",
     "Тримай спинку рівною.",
     "Повільно опускайся вниз.",
     "Другу ніжку витягуй назад.",
     "М'яко повертайся вгору."
    ]
   }
  },
  "phrases": [
   "single_leg_deadlift_coach_1",
   "single_leg_deadlift_coach_2",
   "single_leg_deadlift_coach_3",
   "single_leg_deadlift_coach_4",
   "single_leg_deadlift_face_wrong",
   "single_leg_deadlift_not_reached"
  ]
 },
 "single_leg_squat": {
  "spec": {
   "key": "single_leg_squat",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/single_leg_squat-v1-4f3458b5.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/single_leg_squat-v1-4f3458b5.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 3, ages 7–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "right_wrist_h",
       "max": {
        "young": -1.94,
        "standard": -2.22
       }
      },
      {
       "m": "left_wrist_h",
       "max": -1.7
      },
      {
       "m": "wrists",
       "min": 1.04
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "right_wrist_h",
     "velocity": 0.02,
     "trendFrames": 2
    },
    "start": {
     "all": [
      {
       "m": "right_wrist_h",
       "min": -1.67
      }
     ]
    },
    "abandon": {
     "hint": "single_leg_squat_not_reached",
     "onlyIfReached": {
      "m": "right_wrist_h",
      "max": -1.81
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "single_leg_squat_coach_1": {
     "text": {
      "de": "Super das Gleichgewicht gehalten!",
      "en": "Great job balancing!",
      "uk": "Чудове тримання рівноваги!"
     }
    },
    "single_leg_squat_coach_2": {
     "text": {
      "de": "Du bist so stark!",
      "en": "You are so strong!",
      "uk": "Ти справжній герой!"
     }
    },
    "single_leg_squat_coach_3": {
     "text": {
      "de": "Starke Beine!",
      "en": "Awesome leg power!",
      "uk": "Яка сильна ніжка!"
     }
    },
    "single_leg_squat_coach_4": {
     "text": {
      "de": "Weiter so, super!",
      "en": "Keep going up!",
      "uk": "Молодець, продовжуй далі!"
     }
    },
    "single_leg_squat_face_wrong": {
     "text": {
      "de": "Schau wieder nach vorne!",
      "en": "Turn your face to me!",
      "uk": "Повернись обличчям до екрана!"
     }
    },
    "single_leg_squat_not_reached": {
     "text": {
      "de": "Richte dich ganz auf!",
      "en": "Rise all the way up!",
      "uk": "Випрямляйся повністю вгору!"
     }
    }
   },
   "version": 1,
   "facingHint": "single_leg_squat_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "right_wrist_h",
     "ref": "shoulder_mid",
     "kind": "height",
     "point": "right_wrist"
    },
    {
     "id": "left_wrist_h",
     "ref": "shoulder_mid",
     "kind": "height",
     "point": "left_wrist"
    },
    {
     "id": "wrists",
     "kind": "distance",
     "points": [
      "left_wrist",
      "right_wrist"
     ]
    }
   ]
  },
  "facing": "front",
  "goal": "reps",
  "video": "eotd/single_leg_squat-v1-4f3458b5.mp4",
  "poster": "eotd/single_leg_squat-v1-4f3458b5.jpg",
  "ageMin": 7,
  "ageMax": 18,
  "difficulty": 3,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "One Leg Squat",
    "description": "Pretend to be a flamingo balancing on one leg while you squat up and down!",
    "instructions": [
     "Face the screen and squat on one leg so the camera counts your reps.",
     "Lift one foot off the floor",
     "Bend your standing knee gently",
     "Keep your back nice and straight",
     "Push back up to stand tall"
    ]
   },
   "de": {
    "name": "Einbein Kniebeuge",
    "description": "Sei ein Flamingo auf einem Bein und beuge sanft dein Knie auf und ab!",
    "instructions": [
     "Stehe mit dem Gesicht zum Bildschirm und hocke auf einem Bein, damit die Kamera zählt.",
     "Hebe ein Bein leicht an",
     "Beuge das andere Bein langsam",
     "Halte deinen Rücken schön gerade",
     "Drücke dich wieder nach oben"
    ]
   },
   "uk": {
    "name": "Присідання на одній ніжці",
    "description": "Уяви себе чаплею або фламінго, тримай рівновагу та присідай на одній ніжці!",
    "instructions": [
     "Стань обличчям до екрана та присідай на одній ніжці, щоб камера рахувала.",
     "Підніми одну ніжку над підлогою",
     "Повільно присідай на опорній ніжці",
     "Тримай спинку рівно та посміхайся",
     "Випрямляй ніжку та ставай вгору"
    ]
   }
  },
  "phrases": [
   "single_leg_squat_coach_1",
   "single_leg_squat_coach_2",
   "single_leg_squat_coach_3",
   "single_leg_squat_coach_4",
   "single_leg_squat_face_wrong",
   "single_leg_squat_not_reached"
  ]
 },
 "skater_hops": {
  "spec": {
   "key": "skater_hops",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/skater_hops-v1-377d6161.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/skater_hops-v1-377d6161.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-25 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "feet",
       "min": {
        "young": 1.55,
        "standard": 1.87
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
       "max": 1.22
      }
     ]
    },
    "abandon": {
     "hint": "skater_hops_not_reached",
     "onlyIfReached": {
      "m": "feet",
      "min": 1.38
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "skater_hops_coach_1": {
     "text": {
      "de": "Super schnelle Sprünge!",
      "en": "Super fast skater!",
      "uk": "Супершвидкий ковзаняр!"
     }
    },
    "skater_hops_coach_2": {
     "text": {
      "de": "Tolle Balance!",
      "en": "Great balance!",
      "uk": "Чудовий баланс!"
     }
    },
    "skater_hops_coach_3": {
     "text": {
      "de": "Gleite munter weiter!",
      "en": "Keep gliding!",
      "uk": "Продовжуй ковзати!"
     }
    },
    "skater_hops_coach_4": {
     "text": {
      "de": "Du fliegst ja!",
      "en": "You are flying!",
      "uk": "Ти просто літаєш!"
     }
    },
    "skater_hops_face_wrong": {
     "text": {
      "de": "Dreh dich zu mir!",
      "en": "Turn your face to me!",
      "uk": "Повернися обличчям до мене!"
     }
    },
    "skater_hops_not_reached": {
     "text": {
      "de": "Springe noch ein Stück!",
      "en": "Jump a little wider!",
      "uk": "Стрибай трохи ширше!"
     }
    }
   },
   "version": 1,
   "facingHint": "skater_hops_face_wrong",
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
  "facing": "front",
  "goal": "reps",
  "video": "eotd/skater_hops-v1-377d6161.mp4",
  "poster": "eotd/skater_hops-v1-377d6161.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Skater Hops",
    "description": "Glide like a champion on ice! Hop from side to side and soft-land on one leg.",
    "instructions": [
     "Stand facing the screen and jump side to side to make each hop count!",
     "Hop wide from side to side!",
     "Bend your knee gently when landing!",
     "Keep your chest facing forward!",
     "Swing your arms for extra speed!"
    ]
   },
   "de": {
    "name": "Schlittschuh-Sprünge",
    "description": "Gleite wie ein Eiskunstläufer! Springe von Seite zu Seite und lande weich.",
    "instructions": [
     "Stehe vor dem Bildschirm und springe hin und her für den Zähler!",
     "Springe weit von Seite zu Seite!",
     "Biege das Knie beim Landen sanft!",
     "Schaue immer nach vorne!",
     "Schwinge die Arme schwungvoll mit!"
    ]
   },
   "uk": {
    "name": "Стрибки ковзаняра",
    "description": "Мчися як справжній фігурист! Стрибай з ноги на ногу та м'яко приземлюйся.",
    "instructions": [
     "Стань обличчям до екрана та стрибай з боку в бік для зарахування!",
     "Стрибай ширше з боку в бік!",
     "М'яко згинай коліно при посадці!",
     "Тримай тулуб обличчям до екрана!",
     "Допомагай собі руками в русі!"
    ]
   }
  },
  "phrases": [
   "skater_hops_coach_1",
   "skater_hops_coach_2",
   "skater_hops_coach_3",
   "skater_hops_coach_4",
   "skater_hops_face_wrong",
   "skater_hops_not_reached"
  ]
 },
 "squat_jump": {
  "spec": {
   "key": "squat_jump",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/squat_jump-v1-558319e9.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/squat_jump-v1-558319e9.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 3, ages 7–18, trainer bounds in the run report.",
   "facing": "side",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_knee",
       "min": {
        "young": 125.78,
        "standard": 155.06
       }
      },
      {
       "m": "left_hip",
       "min": 129.26
      },
      {
       "m": "left_thigh_tilt",
       "min": 69.33
      }
     ]
    },
    "type": "reps",
    "drive": {
     "m": "left_knee"
    },
    "start": {
     "all": [
      {
       "m": "left_knee",
       "max": 96.49
      }
     ]
    },
    "abandon": {
     "hint": "squat_jump_not_reached",
     "onlyIfReached": {
      "m": "left_knee",
      "min": 111.13
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "squat_jump_coach_1": {
     "text": {
      "de": "Toller Raketensprung!",
      "en": "Super rocket jump!",
      "uk": "Супер ракетний стрибок!"
     }
    },
    "squat_jump_coach_2": {
     "text": {
      "de": "Du fliegst wie ein Vogel!",
      "en": "Flying like a bird!",
      "uk": "Летиш наче птах!"
     }
    },
    "squat_jump_coach_3": {
     "text": {
      "de": "Du springst so hoch!",
      "en": "You jump so high!",
      "uk": "Ти стрибаєш дуже високо!"
     }
    },
    "squat_jump_coach_4": {
     "text": {
      "de": "Tolle Energie!",
      "en": "Awesome energy!",
      "uk": "Чудова енергія!"
     }
    },
    "squat_jump_face_wrong": {
     "text": {
      "de": "Dreh dich seitlich zur Kamera!",
      "en": "Turn sideways to the camera!",
      "uk": "Повернися боком до камери!"
     }
    },
    "squat_jump_not_reached": {
     "text": {
      "de": "Spring etwas höher!",
      "en": "Jump a bit higher!",
      "uk": "Стрибай трохи вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "squat_jump_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_knee",
     "kind": "angle",
     "points": [
      "near_hip",
      "near_knee",
      "near_ankle"
     ]
    },
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
     "id": "left_thigh_tilt",
     "kind": "tilt",
     "points": [
      "near_hip",
      "near_knee"
     ]
    }
   ]
  },
  "facing": "side",
  "goal": "reps",
  "video": "eotd/squat_jump-v1-558319e9.mp4",
  "poster": "eotd/squat_jump-v1-558319e9.jpg",
  "ageMin": 7,
  "ageMax": 18,
  "difficulty": 3,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Rocket Jumps",
    "description": "Pretend to be a space rocket launching into the stars with every jump!",
    "instructions": [
     "Stand sideways to the camera and jump up high from a deep squat.",
     "Squat down deep before jumping.",
     "Reach your hands up high.",
     "Land softly on your feet."
    ]
   },
   "de": {
    "name": "Raketensprünge",
    "description": "Stell dir vor, du bist eine Rakete und fliegst zu den Sternen!",
    "instructions": [
     "Stelle dich seitlich zur Kamera und springe aus der Hocke hoch.",
     "Gehe tief in die Hocke.",
     "Strecke die Arme hoch.",
     "Lande sanft auf deinen Füßen."
    ]
   },
   "uk": {
    "name": "Стрибки ракеткою",
    "description": "Уяви себе космічною ракетою і злітай до самих зірок із кожним стрибком!",
    "instructions": [
     "Стань боком до камери та високо вистрибуй угору з глибокого присіду.",
     "Присідай глибоко перед стрибком.",
     "Тягнися руками високо вгору.",
     "М'яко приземлюйся на ніжки."
    ]
   }
  },
  "phrases": [
   "squat_jump_coach_1",
   "squat_jump_coach_2",
   "squat_jump_coach_3",
   "squat_jump_coach_4",
   "squat_jump_face_wrong",
   "squat_jump_not_reached"
  ]
 },
 "star_jump": {
  "spec": {
   "key": "star_jump",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/star_jump-v1-5eae1f80.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/star_jump-v1-5eae1f80.mp4"
   },
   "notes": "Exercise of the day 2026-11-10 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from an Omni adult reference (young top line +25 %), difficulty 2, ages 6–12, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "wrist_h",
       "min": {
        "young": 0.16,
        "standard": 0.31
       }
      },
      {
       "m": "wrist_h_r",
       "min": 0.09
      },
      {
       "m": "feet",
       "min": 0.86
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
       "max": -0.3
      },
      {
       "m": "feet",
       "max": 0.84
      }
     ]
    },
    "abandon": {
     "hint": "star_jump_not_reached",
     "onlyIfReached": {
      "m": "wrist_h",
      "min": -0.15
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "star_jump_coach_1": {
     "text": {
      "de": "Toller Sternensprung!",
      "en": "Super star jump!",
      "uk": "Чудовий зоряний стрибок!"
     }
    },
    "star_jump_coach_2": {
     "text": {
      "de": "Du fliegst so hoch!",
      "en": "You fly so high!",
      "uk": "Ти злітаєш дуже високо!"
     }
    },
    "star_jump_coach_3": {
     "text": {
      "de": "Leuchte wie ein Stern!",
      "en": "Shine bright like a star!",
      "uk": "Сяй як справжня зірка!"
     }
    },
    "star_jump_coach_4": {
     "text": {
      "de": "Wunderbare Energie!",
      "en": "Amazing energy!",
      "uk": "Прекрасна енергія!"
     }
    },
    "star_jump_face_wrong": {
     "text": {
      "de": "Drehe dich zur Kamera!",
      "en": "Turn to face the camera!",
      "uk": "Повернися до екрана!"
     }
    },
    "star_jump_not_reached": {
     "text": {
      "de": "Spring noch etwas höher!",
      "en": "Jump a little higher!",
      "uk": "Стрибай ще вище!"
     }
    }
   },
   "version": 1,
   "facingHint": "star_jump_face_wrong",
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
   ]
  },
  "facing": "front",
  "goal": "reps",
  "video": "eotd/star_jump-v1-5eae1f80.mp4",
  "poster": "eotd/star_jump-v1-5eae1f80.jpg",
  "ageMin": 6,
  "ageMax": 12,
  "difficulty": 2,
  "stat": "speed",
  "texts": {
   "en": {
    "name": "Star Jumps",
    "description": "Jump high like a shooting star in the sky! Spread your arms and legs wide, then land softly with feet together.",
    "instructions": [
     "Stand facing the camera and jump up spreading your arms and legs wide to count each jump.",
     "Jump up high into a bright star!",
     "Reach your hands up above your shoulders!",
     "Spread your feet wide in the air!",
     "Land softly with your feet together!"
    ]
   },
   "de": {
    "name": "Sternensprünge",
    "description": "Springe hoch wie ein heller Stern am Himmel! Mache dich ganz weit in der Luft und lande sanft.",
    "instructions": [
     "Stelle dich vor die Kamera und springe hoch mit weiten Armen und Beinen, damit deine Sprünge gezählt werden.",
     "Springe ganz hoch in den Himmel!",
     "Hebe deine Hände weit nach oben!",
     "Öffne Arme und Beine in der Luft!",
     "Lande ganz sanft auf beiden Füßen!"
    ]
   },
   "uk": {
    "name": "Зоряні стрибки",
    "description": "Злітай угору як яскрава зірочка! Розправляй руки та ноги в повітрі й м'яко приземлюйся.",
    "instructions": [
     "Стань обличчям до екрана та стрибай вгору, широко розправляючи руки й ноги, щоб камера рахувала стрибки.",
     "Стрибай високо до самого неба!",
     "Піднімай руки вище за плечі!",
     "Розправляй ніжки широко в польоті!",
     "Приземлюйся м'яко, зводячи ніжки!"
    ]
   }
  },
  "phrases": [
   "star_jump_coach_1",
   "star_jump_coach_2",
   "star_jump_coach_3",
   "star_jump_coach_4",
   "star_jump_face_wrong",
   "star_jump_not_reached"
  ]
 },
 "wall_slides": {
  "spec": {
   "key": "wall_slides",
   "goal": "reps",
   "media": {
    "poster": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/wall_slides-v1-53c05e83.jpg",
    "pandaVideo": "https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/eotd/wall_slides-v1-53c05e83.mp4"
   },
   "notes": "Turnkey from the owner's video 2026-11-23 (scripts/pipeline). PROPOSED — needs owner approval: thresholds from the owner's reference video (young top line +25 %), difficulty 2, ages 6–18, trainer bounds in the run report.",
   "facing": "front",
   "motion": {
    "top": {
     "all": [
      {
       "m": "left_elbow",
       "min": {
        "young": 106.72,
        "standard": 121.35
       }
      },
      {
       "m": "right_elbow",
       "min": 96.75
      },
      {
       "m": "right_shoulder",
       "min": 133.37
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
       "max": 92.09
      }
     ]
    },
    "abandon": {
     "hint": "wall_slides_not_reached",
     "onlyIfReached": {
      "m": "left_elbow",
      "min": 99.41
     }
    },
    "finishGraceMs": 300
   },
   "phrases": {
    "wall_slides_coach_1": {
     "text": {
      "de": "Tolle Arbeit!",
      "en": "Great job!",
      "uk": "Чудова робота!"
     }
    },
    "wall_slides_coach_2": {
     "text": {
      "de": "Breite deine Flügel aus!",
      "en": "Spread your wings!",
      "uk": "Твої крила розправляються!"
     }
    },
    "wall_slides_coach_3": {
     "text": {
      "de": "Du reichst zu den Sternen!",
      "en": "Reaching for the stars!",
      "uk": "Ростеш аж до небес!"
     }
    },
    "wall_slides_coach_4": {
     "text": {
      "de": "Weiter so, Superheld!",
      "en": "Keep it up, superhero!",
      "uk": "Так тримати, супергерою!"
     }
    },
    "wall_slides_face_wrong": {
     "text": {
      "de": "Drehe dich zur Kamera!",
      "en": "Turn your face to me!",
      "uk": "Повернися обличчям до екранчика!"
     }
    },
    "wall_slides_not_reached": {
     "text": {
      "de": "Strecke dich noch höher!",
      "en": "Reach higher to the sun!",
      "uk": "Тягнися ще вище до сонечка!"
     }
    }
   },
   "version": 1,
   "facingHint": "wall_slides_face_wrong",
   "specVersion": 1,
   "measurements": [
    {
     "id": "left_elbow",
     "kind": "angle",
     "points": [
      "left_shoulder",
      "left_elbow",
      "left_wrist"
     ]
    },
    {
     "id": "right_elbow",
     "kind": "angle",
     "points": [
      "right_shoulder",
      "right_elbow",
      "right_wrist"
     ]
    },
    {
     "id": "right_shoulder",
     "kind": "angle",
     "points": [
      "right_elbow",
      "right_shoulder",
      "right_hip"
     ]
    }
   ]
  },
  "facing": "front",
  "goal": "reps",
  "video": "eotd/wall_slides-v1-53c05e83.mp4",
  "poster": "eotd/wall_slides-v1-53c05e83.jpg",
  "ageMin": 6,
  "ageMax": 18,
  "difficulty": 2,
  "stat": "strength",
  "texts": {
   "en": {
    "name": "Wall Slides",
    "description": "Turn your arms into magic rockets spreading their wings and flying high up the wall!",
    "instructions": [
     "Face the camera near the wall and slide your arms up and down.",
     "Press your back and elbows to the wall.",
     "Stretch up as high as the sun.",
     "Move smoothly and reach high."
    ]
   },
   "de": {
    "name": "Wandgleiter",
    "description": "Verwandle deine Arme in Zauberraketen, die ihre Flügel öffnen und hochgleiten!",
    "instructions": [
     "Stehe mit dem Gesicht zur Kamera und schiebe die Arme hoch und runter.",
     "Drücke Rücken und Ellenbogen an die Wand.",
     "Strecke dich hoch wie zur Sonne.",
     "Bewege dich sanft und greife hoch."
    ]
   },
   "uk": {
    "name": "Ручки по стіні",
    "description": "Перетвори свої ручки на чарівні ракети, що розправляють крила та злітають високо по стіні!",
    "instructions": [
     "Стань обличчям до камери біля стіни та ковзай ручками вгору і вниз.",
     "Притисни спинку та лікті до стіни.",
     "Потягнися догори, мов тягнешся до сонечка.",
     "Рухайся плавно та високо."
    ]
   }
  },
  "phrases": [
   "wall_slides_coach_1",
   "wall_slides_coach_2",
   "wall_slides_coach_3",
   "wall_slides_coach_4",
   "wall_slides_face_wrong",
   "wall_slides_not_reached"
  ]
 }
};
