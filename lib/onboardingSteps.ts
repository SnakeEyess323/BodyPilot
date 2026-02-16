import type { Profil } from "./types";

export type OnboardingInputType =
  | "number"
  | "text"
  | "textarea"
  | "select"
  | "chips"
  | "chips-multi"
  | "yesno";

export interface ChipOption {
  value: string;
  label: string;
}

export interface OnboardingStep {
  sectionTitle?: string;
  questionLabel: string;
  field: keyof Profil;
  inputType: OnboardingInputType;
  options?: ChipOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  /** Koşullu açıklama kutusu için (örn: takviye evet ise) */
  hasFollowUp?: boolean;
  followUpField?: keyof Profil;
  followUpPlaceholder?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // BÖLÜM 1: Temel Fiziksel Bilgiler
  { sectionTitle: "Temel Fiziksel Bilgiler", questionLabel: "Yaş", field: "yas", inputType: "number", min: 10, max: 100 },
  { questionLabel: "Cinsiyet", field: "cinsiyet", inputType: "chips", options: [{ value: "erkek", label: "Erkek" }, { value: "kadin", label: "Kadın" }] },
  { questionLabel: "Boy (cm)", field: "boy", inputType: "number", min: 100, max: 250 },
  { questionLabel: "Kilo (kg)", field: "kilo", inputType: "number", min: 30, max: 300 },
  { questionLabel: "Hedef kilo (kg)", field: "hedefKilo", inputType: "number", min: 30, max: 300 },
  { questionLabel: "Vücut yağ oranı — bilmiyorsan tahmini görünüm seç", field: "vucutYagOrani", inputType: "chips", options: [{ value: "bilmiyorum", label: "Bilmiyorum" }, { value: "dusuk", label: "Düşük" }, { value: "orta", label: "Orta" }, { value: "yuksek", label: "Yüksek" }] },
  { questionLabel: "Günlük ortalama adım sayısı / hareketlilik", field: "gunlukAdim", inputType: "chips", options: [{ value: "0-2000", label: "0-2000" }, { value: "2000-5000", label: "2000-5000" }, { value: "5000-10000", label: "5000-10000" }, { value: "10000-20000", label: "10000-20000" }, { value: "20000+", label: "20000+" }] },

  // BÖLÜM 2: Hedefin nedir?
  { sectionTitle: "Hedefin nedir?", questionLabel: "Hedefin nedir?", field: "hedef", inputType: "chips-multi", options: [{ value: "yag_yakmak", label: "Yağ yakmak" }, { value: "kas_yapmak", label: "Kas yapmak" }, { value: "sikilasmak", label: "Sıkılaşmak" }, { value: "kilo_almak", label: "Kilo almak" }, { value: "postur_duzeltmek", label: "Postür düzeltmek" }, { value: "kondisyon_artirmak", label: "Kondisyon artırmak" }, { value: "genel_saglikli_yasam", label: "Genel sağlıklı yaşam" }] },

  // BÖLÜM 3: Spor Geçmişi ve Seviyesi
  { sectionTitle: "Spor Geçmişi ve Seviyesi", questionLabel: "Daha önce spor yaptın mı?", field: "sporYaptiMi", inputType: "yesno" },
  { questionLabel: "Ne kadar süredir spor yapıyorsun?", field: "sporYilSayisi", inputType: "chips", options: [{ value: "hic", label: "Hiç" }, { value: "1-2_ay", label: "1-2 ay" }, { value: "2-6_ay", label: "2-6 ay" }, { value: "6-12_ay", label: "6-12 ay" }, { value: "1-2_yil", label: "1-2 yıl" }, { value: "uzun_suredir", label: "Uzun süredir" }] },
  { questionLabel: "Seviyen", field: "seviye", inputType: "chips", options: [{ value: "baslangic", label: "Başlangıç" }, { value: "orta", label: "Orta" }, { value: "ileri", label: "İleri" }] },

  // BÖLÜM 4: Sağlık ve Kısıtlar
  { sectionTitle: "Sağlık ve Kısıtlar", questionLabel: "Sakatlık var mı? (diz, bel, omuz vb.)", field: "sakatlik", inputType: "text", placeholder: "Yoksa boş bırak" },
  { questionLabel: "Kronik rahatsızlık var mı?", field: "kronikRahatsizlik", inputType: "text", placeholder: "Yoksa boş bırak" },
  { questionLabel: "Doktorun yasakladığı hareket var mı?", field: "yasakHareket", inputType: "text", placeholder: "Yoksa boş bırak" },
  { questionLabel: "Duruş bozukluğu / bel-boyun ağrısı var mı?", field: "durusBozuklugu", inputType: "text", placeholder: "Yoksa boş bırak" },

  // BÖLÜM 5: Zaman ve Rutin
  { sectionTitle: "Zaman ve Rutin", questionLabel: "Haftada kaç gün spor yapabilirsin?", field: "gunSayisi", inputType: "chips", options: [{ value: "1", label: "1 gün" }, { value: "2", label: "2 gün" }, { value: "3", label: "3 gün" }, { value: "4", label: "4 gün" }, { value: "5", label: "5 gün" }, { value: "6", label: "6 gün" }, { value: "7", label: "Hergün" }] },
  { questionLabel: "Ortalama antrenman süresi", field: "antrenmanSuresi", inputType: "chips", options: [{ value: "30", label: "30 dk" }, { value: "45", label: "45 dk" }, { value: "60", label: "60 dk" }, { value: "90", label: "90 dk" }, { value: "120", label: "120 dk" }] },
  { questionLabel: "Ortam: Ev mi, salon mu?", field: "ortam", inputType: "chips", options: [{ value: "ev", label: "Ev" }, { value: "salon", label: "Salon" }] },

  // BÖLÜM 6: Beslenme Bilgileri
  { sectionTitle: "Beslenme Bilgileri", questionLabel: "Vejetaryen / vegan mısın?", field: "vejetaryenVegan", inputType: "chips", options: [{ value: "hayir", label: "Hayır" }, { value: "vejetaryen", label: "Vejetaryen" }, { value: "vegan", label: "Vegan" }] },
  { questionLabel: "Alerji var mı?", field: "alerji", inputType: "text", placeholder: "Yoksa boş bırak" },
  { questionLabel: "Sevmediğin yemekler var mı?", field: "sevmedigiYemekler", inputType: "text", placeholder: "Yoksa boş bırak" },
  { questionLabel: "Günlük kaç öğün yiyorsun?", field: "ogunSayisi", inputType: "chips", options: [{ value: "1", label: "1 öğün" }, { value: "2", label: "2 öğün" }, { value: "3", label: "3 öğün" }, { value: "4", label: "4 öğün" }, { value: "5", label: "5 öğün" }] },
  { questionLabel: "Su tüketimi ne kadar? (günlük)", field: "suTuketimi", inputType: "chips", options: [{ value: "hic", label: "Hiç su içmem" }, { value: "1", label: "1 litre" }, { value: "1.5", label: "1,5 litre" }, { value: "2", label: "2 litre" }, { value: "3", label: "3 litre" }, { value: "4", label: "4 litre" }] },
  { questionLabel: "Sigara kullanıyor musun?", field: "sigara", inputType: "chips", options: [{ value: "evet", label: "Evet" }, { value: "hayir", label: "Hayır" }] },
  { questionLabel: "Alkol kullanıyor musun?", field: "alkol", inputType: "chips", options: [{ value: "evet", label: "Evet" }, { value: "hayir", label: "Hayır" }] },
  { questionLabel: "Takviye kullanıyor musun? (protein tozu vb.)", field: "takviye", inputType: "chips", options: [{ value: "evet", label: "Evet" }, { value: "hayir", label: "Hayır" }], hasFollowUp: true, followUpField: "takviyeAciklama", followUpPlaceholder: "Hangi takviyeleri kullanıyorsun?" },

  // BÖLÜM 7: Yaşam Tarzı
  { sectionTitle: "Yaşam Tarzı", questionLabel: "Ortalama uyku saati (kaç saat?)", field: "uykuSaati", inputType: "chips", options: [{ value: "3-4", label: "3-4 saat" }, { value: "4-6", label: "4-6 saat" }, { value: "6-8", label: "6-8 saat" }, { value: "8-10", label: "8-10 saat" }, { value: "10+", label: "Daha fazla" }] },

  // BÖLÜM 8: Psikolojik Taraf
  { sectionTitle: "Psikolojik Taraf", questionLabel: "Motivasyon seviyesi", field: "motivasyonSeviyesi", inputType: "chips", options: [{ value: "dusuk", label: "Düşük" }, { value: "orta", label: "Orta" }, { value: "yuksek", label: "Yüksek" }] },
  { questionLabel: "En büyük zorlanman ne?", field: "zorlanma", inputType: "chips-multi", options: [{ value: "usenmek", label: "Üşenmek" }, { value: "vakitsizlik", label: "Vakitsizlik" }, { value: "agri", label: "Ağrı" }, { value: "disiplin", label: "Disiplin" }] },
];

export const TOPLAM_ONBOARDING_ADIM = ONBOARDING_STEPS.length;
