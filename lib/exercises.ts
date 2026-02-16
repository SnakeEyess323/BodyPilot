import type { MuscleId } from "@/components/ui/muscle-map/muscle-data";

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Equipment = "bodyweight" | "dumbbell" | "barbell" | "cable" | "machine" | "kettlebell" | "resistance_band" | "bench" | "pull_up_bar";

export interface Exercise {
  id: string;
  name: { tr: string; en: string; de: string; ru: string };
  muscleId: MuscleId;
  imageUrl: string;
  description: { tr: string; en: string; de: string; ru: string };
  difficulty: Difficulty;
  equipment: Equipment[];
}

const IK = "https://ik.imagekit.io/yuhonas";

export const exercises: Exercise[] = [
  // CHEST EXERCISES
  {
    id: "bench-press",
    name: { tr: "Bench Press", en: "Bench Press", de: "Bankdrücken", ru: "Жим лёжа" },
    muscleId: "chest",
    imageUrl: `${IK}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
    description: {
      tr: "Sırt üstü yatarak barbell ile göğüs çalıştırma hareketi",
      en: "Lying on your back, press the barbell up to work your chest",
      de: "Auf dem Rücken liegend, drücken Sie die Langhantel nach oben",
      ru: "Лёжа на спине, выжимайте штангу вверх для проработки груди",
    },
    difficulty: "intermediate",
    equipment: ["barbell", "bench"],
  },
  {
    id: "push-up",
    name: { tr: "Şınav", en: "Push Up", de: "Liegestütz", ru: "Отжимания" },
    muscleId: "chest",
    imageUrl: `${IK}/Pushups/0.jpg`,
    description: {
      tr: "Klasik şınav hareketi - vücut ağırlığı ile göğüs çalışması",
      en: "Classic push-up movement - bodyweight chest exercise",
      de: "Klassische Liegestütze - Brustübung mit Körpergewicht",
      ru: "Классические отжимания - упражнение на грудь с собственным весом",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "dumbbell-fly",
    name: { tr: "Dumbbell Fly", en: "Dumbbell Fly", de: "Kurzhantel Flys", ru: "Разведение гантелей" },
    muscleId: "chest",
    imageUrl: `${IK}/Dumbbell_Flyes/0.jpg`,
    description: {
      tr: "Bench üzerinde dumbell ile göğüs açma hareketi",
      en: "Chest opening movement with dumbbells on a bench",
      de: "Brustöffnungsbewegung mit Kurzhanteln auf der Bank",
      ru: "Разведение рук с гантелями на скамье для груди",
    },
    difficulty: "intermediate",
    equipment: ["dumbbell", "bench"],
  },
  {
    id: "incline-press",
    name: { tr: "İncline Press", en: "Incline Press", de: "Schrägbankdrücken", ru: "Жим на наклонной" },
    muscleId: "chest",
    imageUrl: `${IK}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,
    description: {
      tr: "Eğimli bench üzerinde üst göğüs çalışması",
      en: "Upper chest workout on an inclined bench",
      de: "Oberes Brusttraining auf der Schrägbank",
      ru: "Тренировка верхней части груди на наклонной скамье",
    },
    difficulty: "intermediate",
    equipment: ["barbell", "bench"],
  },
  {
    id: "cable-crossover",
    name: { tr: "Cable Crossover", en: "Cable Crossover", de: "Kabelzug Crossover", ru: "Сведение рук в кроссовере" },
    muscleId: "chest",
    imageUrl: `${IK}/Cable_Crossover/0.jpg`,
    description: {
      tr: "Kablo makinesi ile göğüs sıkıştırma hareketi",
      en: "Chest squeezing movement with cable machine",
      de: "Brustdrückbewegung mit Kabelzug",
      ru: "Сведение рук для груди на блочном тренажёре",
    },
    difficulty: "intermediate",
    equipment: ["cable"],
  },

  // SHOULDER EXERCISES
  {
    id: "overhead-press",
    name: { tr: "Overhead Press", en: "Overhead Press", de: "Schulterdrücken", ru: "Жим над головой" },
    muscleId: "shoulders",
    imageUrl: `${IK}/Standing_Military_Press/0.jpg`,
    description: {
      tr: "Ayakta veya oturarak baş üstü ağırlık kaldırma",
      en: "Standing or seated overhead weight lifting",
      de: "Stehendes oder sitzendes Überkopfdrücken",
      ru: "Жим веса над головой стоя или сидя",
    },
    difficulty: "intermediate",
    equipment: ["barbell"],
  },
  {
    id: "lateral-raise",
    name: { tr: "Lateral Raise", en: "Lateral Raise", de: "Seitheben", ru: "Подъём гантелей в стороны" },
    muscleId: "shoulders",
    imageUrl: `${IK}/Side_Lateral_Raise/0.jpg`,
    description: {
      tr: "Dumbbell ile yan omuz kaldırma hareketi",
      en: "Side shoulder raise with dumbbells",
      de: "Seitliches Schulternheben mit Kurzhanteln",
      ru: "Подъём гантелей через стороны для плеч",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },
  {
    id: "front-raise",
    name: { tr: "Front Raise", en: "Front Raise", de: "Frontheben", ru: "Подъём гантелей перед собой" },
    muscleId: "shoulders",
    imageUrl: `${IK}/Front_Dumbbell_Raise/0.jpg`,
    description: {
      tr: "Dumbbell ile ön omuz kaldırma hareketi",
      en: "Front shoulder raise with dumbbells",
      de: "Vorderes Schulternheben mit Kurzhanteln",
      ru: "Подъём гантелей перед собой для передних дельт",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },
  {
    id: "arnold-press",
    name: { tr: "Arnold Press", en: "Arnold Press", de: "Arnold Press", ru: "Жим Арнольда" },
    muscleId: "shoulders",
    imageUrl: `${IK}/Arnold_Dumbbell_Press/0.jpg`,
    description: {
      tr: "Döndürerek yapılan omuz press hareketi",
      en: "Rotating shoulder press movement",
      de: "Rotierende Schulterdrückbewegung",
      ru: "Жим с вращением для всех пучков дельт",
    },
    difficulty: "intermediate",
    equipment: ["dumbbell"],
  },
  {
    id: "face-pull",
    name: { tr: "Face Pull", en: "Face Pull", de: "Face Pull", ru: "Тяга к лицу" },
    muscleId: "shoulders",
    imageUrl: `${IK}/Face_Pull/0.jpg`,
    description: {
      tr: "Kablo ile yüze doğru çekme - arka omuz",
      en: "Cable pull towards face - rear deltoid",
      de: "Kabelzug zum Gesicht - hintere Schulter",
      ru: "Тяга троса к лицу для задних дельт",
    },
    difficulty: "beginner",
    equipment: ["cable"],
  },

  // BICEPS EXERCISES
  {
    id: "barbell-curl",
    name: { tr: "Barbell Curl", en: "Barbell Curl", de: "Langhantel Curl", ru: "Сгибание рук со штангой" },
    muscleId: "biceps",
    imageUrl: `${IK}/Barbell_Curl/0.jpg`,
    description: {
      tr: "Barbell ile klasik biceps curl hareketi",
      en: "Classic biceps curl with barbell",
      de: "Klassischer Bizeps-Curl mit Langhantel",
      ru: "Классический подъём штанги на бицепс",
    },
    difficulty: "beginner",
    equipment: ["barbell"],
  },
  {
    id: "dumbbell-curl",
    name: { tr: "Dumbbell Curl", en: "Dumbbell Curl", de: "Kurzhantel Curl", ru: "Сгибание рук с гантелями" },
    muscleId: "biceps",
    imageUrl: `${IK}/Dumbbell_Bicep_Curl/0.jpg`,
    description: {
      tr: "Dumbbell ile biceps curl hareketi",
      en: "Biceps curl with dumbbells",
      de: "Bizeps-Curl mit Kurzhanteln",
      ru: "Подъём гантелей на бицепс",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },
  {
    id: "hammer-curl",
    name: { tr: "Hammer Curl", en: "Hammer Curl", de: "Hammer Curl", ru: "Молотковые сгибания" },
    muscleId: "biceps",
    imageUrl: `${IK}/Alternate_Hammer_Curl/0.jpg`,
    description: {
      tr: "Nötr tutuş ile biceps ve ön kol çalışması",
      en: "Neutral grip for biceps and forearm work",
      de: "Neutraler Griff für Bizeps und Unterarm",
      ru: "Нейтральный хват для бицепса и предплечья",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },
  {
    id: "preacher-curl",
    name: { tr: "Preacher Curl", en: "Preacher Curl", de: "Scott Curl", ru: "Сгибания на скамье Скотта" },
    muscleId: "biceps",
    imageUrl: `${IK}/Preacher_Curl/0.jpg`,
    description: {
      tr: "Scott bench üzerinde izole biceps çalışması",
      en: "Isolated biceps work on Scott bench",
      de: "Isolierte Bizepsarbeit auf der Scott-Bank",
      ru: "Изолированная работа на бицепс на скамье Скотта",
    },
    difficulty: "intermediate",
    equipment: ["dumbbell", "bench"],
  },
  {
    id: "concentration-curl",
    name: { tr: "Concentration Curl", en: "Concentration Curl", de: "Konzentrations Curl", ru: "Концентрированные сгибания" },
    muscleId: "biceps",
    imageUrl: `${IK}/Concentration_Curls/0.jpg`,
    description: {
      tr: "Oturarak tek kol izole biceps çalışması",
      en: "Seated single arm isolated biceps work",
      de: "Sitzende einarmige isolierte Bizepsarbeit",
      ru: "Изолированная работа на бицепс одной рукой сидя",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },

  // TRICEPS EXERCISES
  {
    id: "tricep-pushdown",
    name: { tr: "Tricep Pushdown", en: "Tricep Pushdown", de: "Trizeps Pushdown", ru: "Разгибание рук на блоке" },
    muscleId: "triceps",
    imageUrl: `${IK}/Triceps_Pushdown/0.jpg`,
    description: {
      tr: "Kablo makinesi ile triceps çalışması",
      en: "Triceps work with cable machine",
      de: "Trizepsarbeit mit Kabelzug",
      ru: "Работа на трицепс с блочным тренажёром",
    },
    difficulty: "beginner",
    equipment: ["cable"],
  },
  {
    id: "skull-crusher",
    name: { tr: "Skull Crusher", en: "Skull Crusher", de: "Stirndrücken", ru: "Французский жим лёжа" },
    muscleId: "triceps",
    imageUrl: `${IK}/EZ-Bar_Skullcrusher/0.jpg`,
    description: {
      tr: "Yatarak barbell veya dumbbell ile triceps",
      en: "Lying triceps extension with barbell or dumbbell",
      de: "Liegendes Trizepsstrecken mit Langhantel oder Kurzhantel",
      ru: "Французский жим лёжа со штангой или гантелями",
    },
    difficulty: "intermediate",
    equipment: ["barbell", "bench"],
  },
  {
    id: "tricep-dip",
    name: { tr: "Tricep Dip", en: "Tricep Dip", de: "Trizeps Dips", ru: "Отжимания на брусьях" },
    muscleId: "triceps",
    imageUrl: `${IK}/Dips_-_Triceps_Version/0.jpg`,
    description: {
      tr: "Paralel bar veya bench üzerinde dip",
      en: "Dip on parallel bars or bench",
      de: "Dips an Parallelbarren oder Bank",
      ru: "Отжимания на брусьях или от скамьи",
    },
    difficulty: "intermediate",
    equipment: ["bodyweight"],
  },
  {
    id: "overhead-tricep-extension",
    name: { tr: "Overhead Extension", en: "Overhead Tricep Extension", de: "Überkopf Trizeps", ru: "Французский жим стоя" },
    muscleId: "triceps",
    imageUrl: `${IK}/Standing_Dumbbell_Triceps_Extension/0.jpg`,
    description: {
      tr: "Baş üstü dumbbell ile triceps uzatma",
      en: "Overhead triceps extension with dumbbell",
      de: "Überkopf-Trizepsstreckung mit Kurzhantel",
      ru: "Разгибание рук с гантелью над головой",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },
  {
    id: "close-grip-bench",
    name: { tr: "Close Grip Bench", en: "Close Grip Bench Press", de: "Enges Bankdrücken", ru: "Жим узким хватом" },
    muscleId: "triceps",
    imageUrl: `${IK}/Close-Grip_Barbell_Bench_Press/0.jpg`,
    description: {
      tr: "Dar tutuş bench press - triceps odaklı",
      en: "Narrow grip bench press - triceps focused",
      de: "Enges Bankdrücken - Trizeps fokussiert",
      ru: "Жим лёжа узким хватом для трицепса",
    },
    difficulty: "intermediate",
    equipment: ["barbell", "bench"],
  },

  // FOREARM EXERCISES
  {
    id: "wrist-curl",
    name: { tr: "Wrist Curl", en: "Wrist Curl", de: "Handgelenk Curl", ru: "Сгибание запястий" },
    muscleId: "forearms",
    imageUrl: `${IK}/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg`,
    description: {
      tr: "Bilek bükme hareketi - ön kol çalışması",
      en: "Wrist curling movement - forearm work",
      de: "Handgelenkbeugebewegung - Unterarmarbeit",
      ru: "Сгибание запястий для предплечий",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },
  {
    id: "reverse-curl",
    name: { tr: "Reverse Curl", en: "Reverse Curl", de: "Reverse Curl", ru: "Обратные сгибания" },
    muscleId: "forearms",
    imageUrl: `${IK}/Standing_Dumbbell_Reverse_Curl/0.jpg`,
    description: {
      tr: "Ters tutuş ile biceps curl - ön kol odaklı",
      en: "Reverse grip biceps curl - forearm focused",
      de: "Reverse Griff Bizeps-Curl - Unterarm fokussiert",
      ru: "Сгибания обратным хватом для предплечий",
    },
    difficulty: "beginner",
    equipment: ["barbell"],
  },
  {
    id: "farmers-walk",
    name: { tr: "Farmer's Walk", en: "Farmer's Walk", de: "Farmer's Walk", ru: "Прогулка фермера" },
    muscleId: "forearms",
    imageUrl: `${IK}/Barbell_Deadlift/0.jpg`,
    description: {
      tr: "Ağır dumbbell ile yürüme - kavrama gücü",
      en: "Walking with heavy dumbbells - grip strength",
      de: "Gehen mit schweren Kurzhanteln - Griffstärke",
      ru: "Ходьба с тяжёлыми гантелями для силы хвата",
    },
    difficulty: "intermediate",
    equipment: ["dumbbell"],
  },
  {
    id: "dead-hang",
    name: { tr: "Dead Hang", en: "Dead Hang", de: "Toter Hang", ru: "Вис на турнике" },
    muscleId: "forearms",
    imageUrl: `${IK}/Pullups/0.jpg`,
    description: {
      tr: "Barfikste asılı kalma - kavrama dayanıklılığı",
      en: "Hanging from pull-up bar - grip endurance",
      de: "Hängen an der Klimmzugstange - Griffausdauer",
      ru: "Вис на турнике для выносливости хвата",
    },
    difficulty: "beginner",
    equipment: ["pull_up_bar"],
  },

  // ABS EXERCISES
  {
    id: "crunch",
    name: { tr: "Crunch", en: "Crunch", de: "Crunch", ru: "Скручивания" },
    muscleId: "abs",
    imageUrl: `${IK}/Crunches/0.jpg`,
    description: {
      tr: "Klasik karın sıkıştırma hareketi",
      en: "Classic abdominal crunching movement",
      de: "Klassische Bauchpressbewegung",
      ru: "Классические скручивания на пресс",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "plank",
    name: { tr: "Plank", en: "Plank", de: "Plank", ru: "Планка" },
    muscleId: "abs",
    imageUrl: `${IK}/Plank/0.jpg`,
    description: {
      tr: "İzometrik karın çalışması - core stabilizasyonu",
      en: "Isometric ab work - core stabilization",
      de: "Isometrische Baucharbeit - Core-Stabilisierung",
      ru: "Изометрическое упражнение для кора",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "leg-raise",
    name: { tr: "Leg Raise", en: "Leg Raise", de: "Beinheben", ru: "Подъём ног" },
    muscleId: "abs",
    imageUrl: `${IK}/Flat_Bench_Lying_Leg_Raise/0.jpg`,
    description: {
      tr: "Yatarak veya asılı bacak kaldırma",
      en: "Lying or hanging leg raise",
      de: "Liegendes oder hängendes Beinheben",
      ru: "Подъём ног лёжа или в висе",
    },
    difficulty: "intermediate",
    equipment: ["bodyweight"],
  },
  {
    id: "ab-wheel",
    name: { tr: "Ab Wheel", en: "Ab Wheel Rollout", de: "Ab Wheel", ru: "Ролик для пресса" },
    muscleId: "abs",
    imageUrl: `${IK}/Ab_Roller/0.jpg`,
    description: {
      tr: "Ab wheel ile ileri-geri hareket",
      en: "Rolling forward and back with ab wheel",
      de: "Vor- und Zurückrollen mit dem Ab Wheel",
      ru: "Прокатка ролика для пресса",
    },
    difficulty: "advanced",
    equipment: ["bodyweight"],
  },
  {
    id: "cable-crunch",
    name: { tr: "Cable Crunch", en: "Cable Crunch", de: "Kabel Crunch", ru: "Скручивания на блоке" },
    muscleId: "abs",
    imageUrl: `${IK}/Cable_Crunch/0.jpg`,
    description: {
      tr: "Kablo makinesi ile ağırlıklı crunch",
      en: "Weighted crunch with cable machine",
      de: "Gewichteter Crunch mit Kabelzug",
      ru: "Скручивания с отягощением на блоке",
    },
    difficulty: "intermediate",
    equipment: ["cable"],
  },

  // OBLIQUES EXERCISES
  {
    id: "russian-twist",
    name: { tr: "Russian Twist", en: "Russian Twist", de: "Russian Twist", ru: "Русские скручивания" },
    muscleId: "obliques",
    imageUrl: `${IK}/Russian_Twist/0.jpg`,
    description: {
      tr: "Oturarak gövde döndürme hareketi",
      en: "Seated torso rotation movement",
      de: "Sitzende Oberkörperrotation",
      ru: "Скручивания корпуса сидя",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "side-plank",
    name: { tr: "Side Plank", en: "Side Plank", de: "Seitlicher Plank", ru: "Боковая планка" },
    muscleId: "obliques",
    imageUrl: `${IK}/Side_Bridge/0.jpg`,
    description: {
      tr: "Yan plank - oblik kasları güçlendirme",
      en: "Side plank - strengthening oblique muscles",
      de: "Seitlicher Plank - Stärkung der schrägen Muskeln",
      ru: "Боковая планка для косых мышц",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "bicycle-crunch",
    name: { tr: "Bicycle Crunch", en: "Bicycle Crunch", de: "Fahrrad Crunch", ru: "Велосипед" },
    muscleId: "obliques",
    imageUrl: `${IK}/Air_Bike/0.jpg`,
    description: {
      tr: "Bisiklet çevirme hareketi ile crunch",
      en: "Crunch with bicycle pedaling motion",
      de: "Crunch mit Fahrradtretbewegung",
      ru: "Скручивания с движением ног как на велосипеде",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "woodchopper",
    name: { tr: "Woodchopper", en: "Woodchopper", de: "Holzhacker", ru: "Дровосек" },
    muscleId: "obliques",
    imageUrl: `${IK}/Cable_Crossover/0.jpg`,
    description: {
      tr: "Kablo ile odun kesme hareketi",
      en: "Wood chopping motion with cable",
      de: "Holzhackerbewegung mit Kabel",
      ru: "Движение дровосека на блоке",
    },
    difficulty: "intermediate",
    equipment: ["cable"],
  },

  // QUADS EXERCISES
  {
    id: "squat",
    name: { tr: "Squat", en: "Squat", de: "Kniebeuge", ru: "Приседания" },
    muscleId: "quads",
    imageUrl: `${IK}/Barbell_Full_Squat/0.jpg`,
    description: {
      tr: "Temel bacak hareketi - tüm bacak kasları",
      en: "Basic leg movement - all leg muscles",
      de: "Grundlegende Beinbewegung - alle Beinmuskeln",
      ru: "Базовое упражнение для всех мышц ног",
    },
    difficulty: "intermediate",
    equipment: ["barbell"],
  },
  {
    id: "leg-press",
    name: { tr: "Leg Press", en: "Leg Press", de: "Beinpresse", ru: "Жим ногами" },
    muscleId: "quads",
    imageUrl: `${IK}/Leg_Press/0.jpg`,
    description: {
      tr: "Makine ile bacak press hareketi",
      en: "Leg press movement on machine",
      de: "Beinpressbewegung an der Maschine",
      ru: "Жим ногами на тренажёре",
    },
    difficulty: "beginner",
    equipment: ["machine"],
  },
  {
    id: "lunge",
    name: { tr: "Lunge", en: "Lunge", de: "Ausfallschritt", ru: "Выпады" },
    muscleId: "quads",
    imageUrl: `${IK}/Dumbbell_Lunges/0.jpg`,
    description: {
      tr: "İleri adım atarak bacak çalışması",
      en: "Leg work by stepping forward",
      de: "Beinarbeit durch Vorwärtsschritt",
      ru: "Выпады вперёд для ног",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "leg-extension",
    name: { tr: "Leg Extension", en: "Leg Extension", de: "Beinstrecken", ru: "Разгибание ног" },
    muscleId: "quads",
    imageUrl: `${IK}/Leg_Extensions/0.jpg`,
    description: {
      tr: "Makine ile izole quadriceps çalışması",
      en: "Isolated quadriceps work on machine",
      de: "Isolierte Quadrizeps-Arbeit an der Maschine",
      ru: "Изолированная работа на квадрицепс",
    },
    difficulty: "beginner",
    equipment: ["machine"],
  },
  {
    id: "bulgarian-split-squat",
    name: { tr: "Bulgarian Split Squat", en: "Bulgarian Split Squat", de: "Bulgarische Kniebeuge", ru: "Болгарские приседания" },
    muscleId: "quads",
    imageUrl: `${IK}/Dumbbell_Lunges/0.jpg`,
    description: {
      tr: "Tek bacak üzerinde split squat",
      en: "Single leg split squat",
      de: "Einbeinige Kniebeuge",
      ru: "Приседания на одной ноге",
    },
    difficulty: "intermediate",
    equipment: ["dumbbell", "bench"],
  },

  // CALVES EXERCISES
  {
    id: "standing-calf-raise",
    name: { tr: "Standing Calf Raise", en: "Standing Calf Raise", de: "Stehendes Wadenheben", ru: "Подъём на носки стоя" },
    muscleId: "calves",
    imageUrl: `${IK}/Standing_Calf_Raises/0.jpg`,
    description: {
      tr: "Ayakta parmak ucuna yükselme",
      en: "Rising to toes while standing",
      de: "Auf die Zehenspitzen steigen",
      ru: "Подъём на носки в положении стоя",
    },
    difficulty: "beginner",
    equipment: ["machine"],
  },
  {
    id: "seated-calf-raise",
    name: { tr: "Seated Calf Raise", en: "Seated Calf Raise", de: "Sitzendes Wadenheben", ru: "Подъём на носки сидя" },
    muscleId: "calves",
    imageUrl: `${IK}/Seated_Calf_Raise/0.jpg`,
    description: {
      tr: "Oturarak baldır çalışması - soleus odaklı",
      en: "Seated calf work - soleus focused",
      de: "Sitzendes Wadentraining - Soleus fokussiert",
      ru: "Подъём на носки сидя для камбаловидной мышцы",
    },
    difficulty: "beginner",
    equipment: ["machine"],
  },
  {
    id: "donkey-calf-raise",
    name: { tr: "Donkey Calf Raise", en: "Donkey Calf Raise", de: "Esel Wadenheben", ru: "Подъём на носки в наклоне" },
    muscleId: "calves",
    imageUrl: `${IK}/Donkey_Calf_Raises/0.jpg`,
    description: {
      tr: "Eğilerek yapılan baldır kaldırma",
      en: "Bent over calf raise",
      de: "Vorgebeugtes Wadenheben",
      ru: "Подъём на носки в наклоне",
    },
    difficulty: "intermediate",
    equipment: ["bodyweight"],
  },
  {
    id: "jump-rope",
    name: { tr: "İp Atlama", en: "Jump Rope", de: "Seilspringen", ru: "Прыжки на скакалке" },
    muscleId: "calves",
    imageUrl: `${IK}/Rope_Jumping/0.jpg`,
    description: {
      tr: "İp atlama - baldır ve kondisyon",
      en: "Jump rope - calves and conditioning",
      de: "Seilspringen - Waden und Kondition",
      ru: "Прыжки на скакалке для икр и выносливости",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },

  // TRAPS EXERCISES
  {
    id: "barbell-shrug",
    name: { tr: "Barbell Shrug", en: "Barbell Shrug", de: "Langhantel Shrug", ru: "Шраги со штангой" },
    muscleId: "traps",
    imageUrl: `${IK}/Barbell_Shrug/0.jpg`,
    description: {
      tr: "Barbell ile omuz silkme - trapez",
      en: "Shoulder shrug with barbell - traps",
      de: "Schulterzucken mit Langhantel - Trapez",
      ru: "Шраги со штангой для трапеций",
    },
    difficulty: "beginner",
    equipment: ["barbell"],
  },
  {
    id: "dumbbell-shrug",
    name: { tr: "Dumbbell Shrug", en: "Dumbbell Shrug", de: "Kurzhantel Shrug", ru: "Шраги с гантелями" },
    muscleId: "traps",
    imageUrl: `${IK}/Dumbbell_Shrug/0.jpg`,
    description: {
      tr: "Dumbbell ile omuz silkme hareketi",
      en: "Shoulder shrug movement with dumbbells",
      de: "Schulterzucken mit Kurzhanteln",
      ru: "Шраги с гантелями",
    },
    difficulty: "beginner",
    equipment: ["dumbbell"],
  },
  {
    id: "upright-row",
    name: { tr: "Upright Row", en: "Upright Row", de: "Aufrechtes Rudern", ru: "Тяга к подбородку" },
    muscleId: "traps",
    imageUrl: `${IK}/Upright_Barbell_Row/0.jpg`,
    description: {
      tr: "Dik çekiş - trapez ve omuz",
      en: "Upright pull - traps and shoulders",
      de: "Aufrechtes Ziehen - Trapez und Schultern",
      ru: "Тяга к подбородку для трапеций и плеч",
    },
    difficulty: "intermediate",
    equipment: ["barbell"],
  },
  {
    id: "face-pull-traps",
    name: { tr: "Face Pull (Trapez)", en: "Face Pull (Traps)", de: "Face Pull (Trapez)", ru: "Тяга к лицу (трапеции)" },
    muscleId: "traps",
    imageUrl: `${IK}/Face_Pull/0.jpg`,
    description: {
      tr: "Kablo ile yüze çekiş - üst sırt ve trapez",
      en: "Cable face pull - upper back and traps",
      de: "Kabelzug zum Gesicht - oberer Rücken und Trapez",
      ru: "Тяга троса к лицу для верха спины и трапеций",
    },
    difficulty: "beginner",
    equipment: ["cable"],
  },

  // LATS EXERCISES
  {
    id: "pull-up",
    name: { tr: "Pull Up", en: "Pull Up", de: "Klimmzug", ru: "Подтягивания" },
    muscleId: "lats",
    imageUrl: `${IK}/Pullups/0.jpg`,
    description: {
      tr: "Barfiks çekme hareketi - sırt genişliği",
      en: "Pull up movement - back width",
      de: "Klimmzugbewegung - Rückenbreite",
      ru: "Подтягивания для ширины спины",
    },
    difficulty: "intermediate",
    equipment: ["pull_up_bar"],
  },
  {
    id: "lat-pulldown",
    name: { tr: "Lat Pulldown", en: "Lat Pulldown", de: "Latziehen", ru: "Тяга верхнего блока" },
    muscleId: "lats",
    imageUrl: `${IK}/Wide-Grip_Lat_Pulldown/0.jpg`,
    description: {
      tr: "Lat makinesi ile sırt çekme",
      en: "Lat pull with machine",
      de: "Latziehen an der Maschine",
      ru: "Тяга верхнего блока для широчайших",
    },
    difficulty: "beginner",
    equipment: ["cable"],
  },
  {
    id: "barbell-row",
    name: { tr: "Barbell Row", en: "Barbell Row", de: "Langhantel Rudern", ru: "Тяга штанги в наклоне" },
    muscleId: "lats",
    imageUrl: `${IK}/Bent_Over_Barbell_Row/0.jpg`,
    description: {
      tr: "Eğilerek barbell çekme - sırt kalınlığı",
      en: "Bent over barbell row - back thickness",
      de: "Vorgebeugtes Langhantelrudern - Rückendicke",
      ru: "Тяга штанги в наклоне для толщины спины",
    },
    difficulty: "intermediate",
    equipment: ["barbell"],
  },
  {
    id: "dumbbell-row",
    name: { tr: "Dumbbell Row", en: "Dumbbell Row", de: "Kurzhantel Rudern", ru: "Тяга гантели в наклоне" },
    muscleId: "lats",
    imageUrl: `${IK}/One-Arm_Dumbbell_Row/0.jpg`,
    description: {
      tr: "Tek kol dumbbell sırt çekme",
      en: "Single arm dumbbell back row",
      de: "Einarmiges Kurzhantelrudern",
      ru: "Тяга гантели одной рукой",
    },
    difficulty: "beginner",
    equipment: ["dumbbell", "bench"],
  },
  {
    id: "seated-cable-row",
    name: { tr: "Seated Cable Row", en: "Seated Cable Row", de: "Sitzendes Kabelrudern", ru: "Тяга нижнего блока" },
    muscleId: "lats",
    imageUrl: `${IK}/Seated_Cable_Rows/0.jpg`,
    description: {
      tr: "Oturarak kablo ile sırt çekme",
      en: "Seated cable back row",
      de: "Sitzendes Kabelrudern",
      ru: "Тяга нижнего блока сидя",
    },
    difficulty: "beginner",
    equipment: ["cable"],
  },

  // LOWER BACK EXERCISES
  {
    id: "deadlift",
    name: { tr: "Deadlift", en: "Deadlift", de: "Kreuzheben", ru: "Становая тяга" },
    muscleId: "lowerBack",
    imageUrl: `${IK}/Barbell_Deadlift/0.jpg`,
    description: {
      tr: "Yerden kaldırma - tüm vücut compound",
      en: "Lifting from ground - full body compound",
      de: "Vom Boden heben - Ganzkörper-Compound",
      ru: "Становая тяга - базовое упражнение на всё тело",
    },
    difficulty: "advanced",
    equipment: ["barbell"],
  },
  {
    id: "hyperextension",
    name: { tr: "Hyperextension", en: "Hyperextension", de: "Hyperextension", ru: "Гиперэкстензия" },
    muscleId: "lowerBack",
    imageUrl: `${IK}/Superman/0.jpg`,
    description: {
      tr: "Bel uzatma hareketi - alt sırt",
      en: "Back extension movement - lower back",
      de: "Rückenstreckung - unterer Rücken",
      ru: "Разгибание спины для поясницы",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "good-morning",
    name: { tr: "Good Morning", en: "Good Morning", de: "Good Morning", ru: "Гуд морнинг" },
    muscleId: "lowerBack",
    imageUrl: `${IK}/Good_Morning/0.jpg`,
    description: {
      tr: "Barbell ile eğilme hareketi - bel ve arka bacak",
      en: "Bending movement with barbell - lower back and hamstrings",
      de: "Beugebewegung mit Langhantel - unterer Rücken und hintere Oberschenkel",
      ru: "Наклоны со штангой для поясницы и бицепса бедра",
    },
    difficulty: "intermediate",
    equipment: ["barbell"],
  },
  {
    id: "superman",
    name: { tr: "Superman", en: "Superman", de: "Superman", ru: "Супермен" },
    muscleId: "lowerBack",
    imageUrl: `${IK}/Superman/0.jpg`,
    description: {
      tr: "Yüzüstü yatarak kol ve bacak kaldırma",
      en: "Lying face down, raising arms and legs",
      de: "Bauchlage, Arme und Beine heben",
      ru: "Подъём рук и ног лёжа на животе",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },

  // GLUTES EXERCISES
  {
    id: "hip-thrust",
    name: { tr: "Hip Thrust", en: "Hip Thrust", de: "Hip Thrust", ru: "Ягодичный мостик" },
    muscleId: "glutes",
    imageUrl: `${IK}/Barbell_Glute_Bridge/0.jpg`,
    description: {
      tr: "Kalça kaldırma hareketi - gluteus odaklı",
      en: "Hip raising movement - glute focused",
      de: "Hüfthebebewegung - Gesäß fokussiert",
      ru: "Подъём таза для ягодичных мышц",
    },
    difficulty: "intermediate",
    equipment: ["barbell", "bench"],
  },
  {
    id: "glute-bridge",
    name: { tr: "Glute Bridge", en: "Glute Bridge", de: "Glute Bridge", ru: "Мостик" },
    muscleId: "glutes",
    imageUrl: `${IK}/Barbell_Glute_Bridge/0.jpg`,
    description: {
      tr: "Yerde yatarak kalça köprüsü",
      en: "Lying glute bridge on the floor",
      de: "Liegende Gesäßbrücke",
      ru: "Ягодичный мостик лёжа на полу",
    },
    difficulty: "beginner",
    equipment: ["bodyweight"],
  },
  {
    id: "cable-kickback",
    name: { tr: "Cable Kickback", en: "Cable Kickback", de: "Kabel Kickback", ru: "Отведение ноги на блоке" },
    muscleId: "glutes",
    imageUrl: `${IK}/Glute_Kickback/0.jpg`,
    description: {
      tr: "Kablo ile arkaya bacak atma",
      en: "Cable leg kickback movement",
      de: "Kabel-Bein-Kickback",
      ru: "Отведение ноги назад на блоке",
    },
    difficulty: "beginner",
    equipment: ["cable"],
  },
  {
    id: "sumo-squat",
    name: { tr: "Sumo Squat", en: "Sumo Squat", de: "Sumo Kniebeuge", ru: "Сумо приседания" },
    muscleId: "glutes",
    imageUrl: `${IK}/Barbell_Full_Squat/0.jpg`,
    description: {
      tr: "Geniş duruşlu squat - iç bacak ve kalça",
      en: "Wide stance squat - inner thigh and glutes",
      de: "Breite Kniebeuge - Innenschenkel und Gesäß",
      ru: "Приседания с широкой постановкой ног",
    },
    difficulty: "intermediate",
    equipment: ["dumbbell"],
  },
  {
    id: "step-up",
    name: { tr: "Step Up", en: "Step Up", de: "Step Up", ru: "Зашагивания" },
    muscleId: "glutes",
    imageUrl: `${IK}/Barbell_Step_Ups/0.jpg`,
    description: {
      tr: "Yüksek platforma adım atma",
      en: "Stepping onto an elevated platform",
      de: "Aufstieg auf eine erhöhte Plattform",
      ru: "Зашагивания на платформу",
    },
    difficulty: "beginner",
    equipment: ["bodyweight", "bench"],
  },

  // HAMSTRINGS EXERCISES
  {
    id: "romanian-deadlift",
    name: { tr: "Romanian Deadlift", en: "Romanian Deadlift", de: "Rumänisches Kreuzheben", ru: "Румынская тяга" },
    muscleId: "hamstrings",
    imageUrl: `${IK}/Romanian_Deadlift/0.jpg`,
    description: {
      tr: "Diz hafif bükük deadlift - arka bacak odaklı",
      en: "Slightly bent knee deadlift - hamstring focused",
      de: "Leicht gebeugtes Kreuzheben - hintere Oberschenkel fokussiert",
      ru: "Румынская тяга для бицепса бедра",
    },
    difficulty: "intermediate",
    equipment: ["barbell"],
  },
  {
    id: "leg-curl",
    name: { tr: "Leg Curl", en: "Leg Curl", de: "Beincurl", ru: "Сгибание ног" },
    muscleId: "hamstrings",
    imageUrl: `${IK}/Lying_Leg_Curls/0.jpg`,
    description: {
      tr: "Makine ile hamstring curl",
      en: "Hamstring curl on machine",
      de: "Hamstring-Curl an der Maschine",
      ru: "Сгибание ног на тренажёре",
    },
    difficulty: "beginner",
    equipment: ["machine"],
  },
  {
    id: "stiff-leg-deadlift",
    name: { tr: "Stiff Leg Deadlift", en: "Stiff Leg Deadlift", de: "Gestrecktes Kreuzheben", ru: "Тяга на прямых ногах" },
    muscleId: "hamstrings",
    imageUrl: `${IK}/Stiff-Legged_Barbell_Deadlift/0.jpg`,
    description: {
      tr: "Düz bacak deadlift - maksimum hamstring gerimi",
      en: "Straight leg deadlift - maximum hamstring stretch",
      de: "Gerades Bein-Kreuzheben - maximale hintere Oberschenkeldehnung",
      ru: "Тяга на прямых ногах для максимальной растяжки бицепса бедра",
    },
    difficulty: "intermediate",
    equipment: ["barbell"],
  },
  {
    id: "nordic-curl",
    name: { tr: "Nordic Curl", en: "Nordic Curl", de: "Nordic Curl", ru: "Скандинавские сгибания" },
    muscleId: "hamstrings",
    imageUrl: `${IK}/Lying_Leg_Curls/0.jpg`,
    description: {
      tr: "Vücut ağırlığı ile ileri kontrollü düşme",
      en: "Bodyweight controlled forward fall",
      de: "Kontrollierter Vorwärtsfall mit Körpergewicht",
      ru: "Контролируемое падение вперёд с собственным весом",
    },
    difficulty: "advanced",
    equipment: ["bodyweight"],
  },
  {
    id: "swiss-ball-curl",
    name: { tr: "Swiss Ball Curl", en: "Swiss Ball Hamstring Curl", de: "Swiss Ball Curl", ru: "Сгибания на фитболе" },
    muscleId: "hamstrings",
    imageUrl: `${IK}/Ball_Leg_Curl/0.jpg`,
    description: {
      tr: "Pilates topu ile hamstring curl",
      en: "Hamstring curl with swiss ball",
      de: "Hamstring-Curl mit Swiss Ball",
      ru: "Сгибание ног на фитболе",
    },
    difficulty: "intermediate",
    equipment: ["bodyweight"],
  },
];

// Helper functions
export function getExercisesByMuscle(muscleId: MuscleId): Exercise[] {
  return exercises.filter((e) => e.muscleId === muscleId);
}

export function getExercisesByDifficulty(difficulty: Difficulty): Exercise[] {
  return exercises.filter((e) => e.difficulty === difficulty);
}

export function getExercisesByEquipment(equipment: Equipment): Exercise[] {
  return exercises.filter((e) => e.equipment.includes(equipment));
}

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

export function getExercisesForMuscles(muscleIds: MuscleId[]): Exercise[] {
  return exercises.filter((e) => muscleIds.includes(e.muscleId));
}

// Equipment labels for UI
export const equipmentLabels: Record<Equipment, { tr: string; en: string; de: string; ru: string }> = {
  bodyweight: { tr: "Vücut Ağırlığı", en: "Bodyweight", de: "Körpergewicht", ru: "Свой вес" },
  dumbbell: { tr: "Dumbbell", en: "Dumbbell", de: "Kurzhantel", ru: "Гантели" },
  barbell: { tr: "Barbell", en: "Barbell", de: "Langhantel", ru: "Штанга" },
  cable: { tr: "Kablo", en: "Cable", de: "Kabelzug", ru: "Блок" },
  machine: { tr: "Makine", en: "Machine", de: "Maschine", ru: "Тренажёр" },
  kettlebell: { tr: "Kettlebell", en: "Kettlebell", de: "Kettlebell", ru: "Гиря" },
  resistance_band: { tr: "Direnç Bandı", en: "Resistance Band", de: "Widerstandsband", ru: "Резинка" },
  bench: { tr: "Bench", en: "Bench", de: "Bank", ru: "Скамья" },
  pull_up_bar: { tr: "Barfiks", en: "Pull Up Bar", de: "Klimmzugstange", ru: "Турник" },
};

// Difficulty labels for UI
export const difficultyLabels: Record<Difficulty, { tr: string; en: string; de: string; ru: string }> = {
  beginner: { tr: "Başlangıç", en: "Beginner", de: "Anfänger", ru: "Начинающий" },
  intermediate: { tr: "Orta", en: "Intermediate", de: "Fortgeschritten", ru: "Средний" },
  advanced: { tr: "İleri", en: "Advanced", de: "Profi", ru: "Продвинутый" },
};
