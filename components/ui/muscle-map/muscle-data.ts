export type MuscleId =
  | "chest"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "calves"
  | "traps"
  | "lats"
  | "lowerBack"
  | "glutes"
  | "hamstrings";

export type BodyView = "front" | "back";
export type Gender = "male" | "female";

export interface MuscleGroup {
  id: MuscleId;
  name: {
    tr: string;
    en: string;
    de: string;
    ru: string;
  };
  description: {
    tr: string;
    en: string;
    de: string;
    ru: string;
  };
  view: BodyView;
  category: "upper" | "core" | "lower";
}

export const muscleGroups: MuscleGroup[] = [
  // Front View - Upper Body
  {
    id: "chest",
    name: { tr: "Göğüs", en: "Chest", de: "Brust", ru: "Грудь" },
    description: {
      tr: "Pectoralis major ve minor kasları",
      en: "Pectoralis major and minor muscles",
      de: "Pectoralis major und minor Muskeln",
      ru: "Большая и малая грудные мышцы",
    },
    view: "front",
    category: "upper",
  },
  {
    id: "shoulders",
    name: { tr: "Omuzlar", en: "Shoulders", de: "Schultern", ru: "Плечи" },
    description: {
      tr: "Deltoid kasları (ön, yan, arka)",
      en: "Deltoid muscles (front, lateral, rear)",
      de: "Deltamuskeln (vorne, seitlich, hinten)",
      ru: "Дельтовидные мышцы (передние, боковые, задние)",
    },
    view: "front",
    category: "upper",
  },
  {
    id: "biceps",
    name: { tr: "Biceps", en: "Biceps", de: "Bizeps", ru: "Бицепс" },
    description: {
      tr: "Kol ön kısmı - biceps brachii",
      en: "Front of arm - biceps brachii",
      de: "Vorderseite des Arms - Bizeps brachii",
      ru: "Передняя часть руки - бицепс",
    },
    view: "front",
    category: "upper",
  },
  {
    id: "forearms",
    name: { tr: "Ön Kol", en: "Forearms", de: "Unterarme", ru: "Предплечья" },
    description: {
      tr: "Ön kol kasları - kavrama gücü",
      en: "Forearm muscles - grip strength",
      de: "Unterarmmuskeln - Griffstärke",
      ru: "Мышцы предплечья - сила хвата",
    },
    view: "front",
    category: "upper",
  },

  // Front View - Core
  {
    id: "abs",
    name: { tr: "Karın", en: "Abs", de: "Bauchmuskeln", ru: "Пресс" },
    description: {
      tr: "Rectus abdominis - altı pack",
      en: "Rectus abdominis - six pack",
      de: "Rectus abdominis - Sixpack",
      ru: "Прямая мышца живота - кубики",
    },
    view: "front",
    category: "core",
  },
  {
    id: "obliques",
    name: { tr: "Yan Karın", en: "Obliques", de: "Schräge Bauchmuskeln", ru: "Косые мышцы" },
    description: {
      tr: "İç ve dış oblik kaslar",
      en: "Internal and external oblique muscles",
      de: "Innere und äußere schräge Muskeln",
      ru: "Внутренние и внешние косые мышцы",
    },
    view: "front",
    category: "core",
  },

  // Front View - Lower Body
  {
    id: "quads",
    name: { tr: "Ön Bacak", en: "Quadriceps", de: "Quadrizeps", ru: "Квадрицепс" },
    description: {
      tr: "Quadriceps femoris - dört başlı kas",
      en: "Quadriceps femoris - four-headed muscle",
      de: "Quadriceps femoris - vierköpfiger Muskel",
      ru: "Четырёхглавая мышца бедра",
    },
    view: "front",
    category: "lower",
  },
  {
    id: "calves",
    name: { tr: "Baldır", en: "Calves", de: "Waden", ru: "Икры" },
    description: {
      tr: "Gastrocnemius ve soleus kasları",
      en: "Gastrocnemius and soleus muscles",
      de: "Gastrocnemius und Soleus Muskeln",
      ru: "Икроножная и камбаловидная мышцы",
    },
    view: "front",
    category: "lower",
  },

  // Back View - Upper Body
  {
    id: "traps",
    name: { tr: "Trapez", en: "Trapezius", de: "Trapezius", ru: "Трапеция" },
    description: {
      tr: "Trapezius kası - üst sırt",
      en: "Trapezius muscle - upper back",
      de: "Trapezmuskel - oberer Rücken",
      ru: "Трапециевидная мышца - верхняя часть спины",
    },
    view: "back",
    category: "upper",
  },
  {
    id: "lats",
    name: { tr: "Sırt", en: "Lats", de: "Latissimus", ru: "Широчайшие" },
    description: {
      tr: "Latissimus dorsi - V şekli",
      en: "Latissimus dorsi - V-taper",
      de: "Latissimus dorsi - V-Form",
      ru: "Широчайшая мышца спины - V-образная форма",
    },
    view: "back",
    category: "upper",
  },
  {
    id: "triceps",
    name: { tr: "Triceps", en: "Triceps", de: "Trizeps", ru: "Трицепс" },
    description: {
      tr: "Kol arka kısmı - triceps brachii",
      en: "Back of arm - triceps brachii",
      de: "Rückseite des Arms - Trizeps brachii",
      ru: "Задняя часть руки - трицепс",
    },
    view: "back",
    category: "upper",
  },

  // Back View - Core
  {
    id: "lowerBack",
    name: { tr: "Alt Sırt", en: "Lower Back", de: "Unterer Rücken", ru: "Поясница" },
    description: {
      tr: "Erector spinae kasları",
      en: "Erector spinae muscles",
      de: "Erector spinae Muskeln",
      ru: "Мышцы-разгибатели позвоночника",
    },
    view: "back",
    category: "core",
  },

  // Back View - Lower Body
  {
    id: "glutes",
    name: { tr: "Kalça", en: "Glutes", de: "Gesäß", ru: "Ягодицы" },
    description: {
      tr: "Gluteus maximus, medius, minimus",
      en: "Gluteus maximus, medius, minimus",
      de: "Gluteus maximus, medius, minimus",
      ru: "Большая, средняя и малая ягодичные мышцы",
    },
    view: "back",
    category: "lower",
  },
  {
    id: "hamstrings",
    name: { tr: "Arka Bacak", en: "Hamstrings", de: "Beinbeuger", ru: "Бицепс бедра" },
    description: {
      tr: "Biceps femoris, semitendinosus, semimembranosus",
      en: "Biceps femoris, semitendinosus, semimembranosus",
      de: "Biceps femoris, Semitendinosus, Semimembranosus",
      ru: "Двуглавая, полусухожильная, полуперепончатая мышцы",
    },
    view: "back",
    category: "lower",
  },
];

// Get muscles by view
export function getMusclesByView(view: BodyView): MuscleGroup[] {
  return muscleGroups.filter((m) => m.view === view);
}

// Get muscle by id
export function getMuscleById(id: MuscleId): MuscleGroup | undefined {
  return muscleGroups.find((m) => m.id === id);
}

// Get muscles by category
export function getMusclesByCategory(category: "upper" | "core" | "lower"): MuscleGroup[] {
  return muscleGroups.filter((m) => m.category === category);
}
