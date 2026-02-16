export type OgunTipi = "kahvalti" | "ogle" | "aksam" | "ara";

export interface YemekItem {
  id: string;
  ogun: OgunTipi;
  baslik: string;
  malzemeler?: string;
  tarif?: string;
  kalori?: string;
  makrolar?: string;
}

/**
 * AI'dan gelen yemek programı çıktısını parse edip öğünlere ayırır.
 * 
 * Beklenen format:
 * **Kahvaltı: Yulaf Ezmesi**
 * - **Malzemeler:** 50g yulaf ezmesi, 200ml süt...
 * - **Tarif:**
 *   1. İlk adım...
 *   2. İkinci adım...
 * - **Kalori:** ~400 kcal
 * - **Makro:** Protein: 12g, Karbonhidrat: 60g, Yağ: 15g
 */
export function parseYemekProgram(content: string): YemekItem[] {
  if (!content.trim()) return [];

  const items: YemekItem[] = [];
  const lines = content.split("\n");
  
  let currentOgun: OgunTipi | null = null;
  let currentItem: Partial<YemekItem> | null = null;
  let itemCounter = 0;
  
  // Hangi alanı topluyoruz? (çok satırlı alanlar için)
  let collectingField: "malzemeler" | "tarif" | null = null;

  // Öğün kategorisi başlıklarını algıla
  const kategoriPatterns: { pattern: RegExp; ogun: OgunTipi }[] = [
    { pattern: /^[\s#]*(?:KAHVALTI|Kahvaltı)\s*[:\-]?\s*$/i, ogun: "kahvalti" },
    { pattern: /^[\s#]*(?:ÖĞLE\s*YEMEĞİ|ÖĞLE|Öğle\s*Yemeği|Öğle)\s*[:\-]?\s*$/i, ogun: "ogle" },
    { pattern: /^[\s#]*(?:AKŞAM\s*YEMEĞİ|AKŞAM|Akşam\s*Yemeği|Akşam)\s*[:\-]?\s*$/i, ogun: "aksam" },
    { pattern: /^[\s#]*(?:ARA\s*ÖĞÜN(?:LER)?|Ara\s*Öğün(?:ler)?)\s*[:\-]?\s*$/i, ogun: "ara" },
  ];

  // Yemek başlığı pattern: **Kahvaltı: Yulaf Ezmesi** veya **Öğle: Tavuk Sote**
  const yemekBaslikPattern = /^\*\*(?:Kahvaltı|Öğle|Akşam|Ara\s*Öğün)\s*:\s*(.+?)\*\*$/i;

  function saveCurrentItem() {
    if (currentItem && currentItem.baslik && currentOgun) {
      // Tarif ve malzemelerdeki gereksiz ** işaretlerini ve baştaki virgülleri temizle
      if (currentItem.tarif) {
        currentItem.tarif = currentItem.tarif
          .replace(/\*\*/g, "")
          .replace(/^\s*,\s*/, "")
          .trim();
      }
      if (currentItem.malzemeler) {
        currentItem.malzemeler = currentItem.malzemeler
          .replace(/\*\*/g, "")
          .replace(/^\s*,\s*/, "")
          .trim();
      }
      if (currentItem.makrolar) {
        currentItem.makrolar = currentItem.makrolar
          .replace(/\*\*/g, "")
          .replace(/^\s*,\s*/, "")
          .trim();
      }
      
      items.push({
        id: `yemek-${currentOgun}-${itemCounter++}`,
        ogun: currentOgun,
        baslik: currentItem.baslik,
        malzemeler: currentItem.malzemeler,
        tarif: currentItem.tarif,
        kalori: currentItem.kalori,
        makrolar: currentItem.makrolar,
      });
    }
    currentItem = null;
    collectingField = null;
  }

  // Bir satırın tarif adımı olup olmadığını kontrol et (1., 2., (1), vb.)
  function isTarifAdimi(line: string): boolean {
    return /^\s*[\d]+[\.\)]\s+/.test(line) || /^\s*\([\d]+\)\s+/.test(line);
  }

  // Bir satırın yeni alan başlangıcı olup olmadığını kontrol et
  function isFieldStart(line: string): boolean {
    return /^\s*[-•*]?\s*\*?\*?(?:Malzemeler?|Tarif|Kalori|Makro(?:lar)?)\*?\*?\s*:/i.test(line);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) continue;

    // "1. Gün", "2. Gün", "Pazartesi:", "Salı:" gibi gün başlıklarını atla
    if (/^\s*\d+\.\s*[Gg]ün\s*[:\-]?\s*$/i.test(trimmed)) continue;
    if (/^\s*#+\s*\d+\.\s*[Gg]ün/i.test(trimmed)) continue;
    if (/^\s*(Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar)\s*[:\-]?\s*$/i.test(trimmed)) continue;
    if (/^\s*#+\s*(Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar)/i.test(trimmed)) continue;
    if (/^\s*\*\*\s*\d+\.\s*[Gg]ün\s*\*\*/i.test(trimmed)) continue;
    if (/^\s*[Gg]ün\s+\d+\s*[:\-]?\s*$/i.test(trimmed)) continue;

    // Öğün kategorisi başlığı mı?
    let foundKategori = false;
    for (const { pattern, ogun } of kategoriPatterns) {
      if (pattern.test(trimmed)) {
        saveCurrentItem();
        currentOgun = ogun;
        foundKategori = true;
        break;
      }
    }
    if (foundKategori) continue;

    // Yemek başlığı mı? **Kahvaltı: Yulaf Ezmesi**
    const yemekMatch = trimmed.match(yemekBaslikPattern);
    if (yemekMatch) {
      saveCurrentItem();
      // Başlıktan öğün tipini de algıla
      if (/kahvaltı/i.test(trimmed)) currentOgun = "kahvalti";
      else if (/öğle/i.test(trimmed)) currentOgun = "ogle";
      else if (/akşam/i.test(trimmed)) currentOgun = "aksam";
      else if (/ara\s*öğün/i.test(trimmed)) currentOgun = "ara";
      
      currentItem = { baslik: yemekMatch[1].trim() };
      collectingField = null;
      continue;
    }

    // Malzemeler satırı başlangıcı
    if (/^\s*[-•*]?\s*\*?\*?Malzemeler?\*?\*?\s*:/i.test(trimmed)) {
      collectingField = "malzemeler";
      if (!currentItem && currentOgun) {
        currentItem = { baslik: "" };
      }
      if (currentItem) {
        const value = trimmed.replace(/^\s*[-•*]?\s*\*?\*?Malzemeler?\*?\*?\s*:\s*/i, "").trim();
        currentItem.malzemeler = value;
      }
      continue;
    }

    // Tarif satırı başlangıcı
    if (/^\s*[-•*]?\s*\*?\*?Tarif\*?\*?\s*:/i.test(trimmed)) {
      collectingField = "tarif";
      if (currentItem) {
        const value = trimmed.replace(/^\s*[-•*]?\s*\*?\*?Tarif\*?\*?\s*:\s*/i, "").trim();
        currentItem.tarif = value;
      }
      continue;
    }

    // Kalori satırı
    if (/^\s*[-•*]?\s*\*?\*?Kalori\*?\*?\s*:/i.test(trimmed)) {
      collectingField = null;
      if (currentItem) {
        const kaloriMatch = trimmed.match(/~?(\d+)\s*(?:kcal|kalori)?/i);
        currentItem.kalori = kaloriMatch ? `${kaloriMatch[1]} kcal` : trimmed.replace(/^\s*[-•*]?\s*\*?\*?Kalori\*?\*?\s*:\s*/i, "").trim();
      }
      continue;
    }

    // Makro satırı
    if (/^\s*[-•*]?\s*\*?\*?Makro(?:lar)?\*?\*?\s*:/i.test(trimmed)) {
      collectingField = null;
      if (currentItem) {
        currentItem.makrolar = trimmed.replace(/^\s*[-•*]?\s*\*?\*?Makro(?:lar)?\*?\*?\s*:\s*/i, "").trim();
      }
      continue;
    }

    // Eğer tarif veya malzeme topluyorsak ve bu satır numara ile başlıyorsa (tarif adımı)
    if (collectingField === "tarif" && currentItem && isTarifAdimi(trimmed)) {
      // Tarif adımını yeni satırda ekle
      currentItem.tarif = currentItem.tarif 
        ? `${currentItem.tarif}\n${trimmed}` 
        : trimmed;
      continue;
    }

    // Eğer bir alan topluyorsak ve bu yeni bir alan başlangıcı değilse, devam et
    if (collectingField && currentItem && !isFieldStart(trimmed)) {
      // Indent ile başlayan satırları veya - ile başlayan satırları mevcut alana ekle
      if (/^\s{2,}/.test(line) || trimmed.startsWith("-") || trimmed.startsWith("•")) {
        if (collectingField === "tarif") {
          currentItem.tarif = currentItem.tarif 
            ? `${currentItem.tarif}\n${trimmed.replace(/^[-•]\s*/, "")}` 
            : trimmed.replace(/^[-•]\s*/, "");
        } else if (collectingField === "malzemeler") {
          currentItem.malzemeler = currentItem.malzemeler 
            ? `${currentItem.malzemeler}, ${trimmed.replace(/^[-•]\s*/, "")}` 
            : trimmed.replace(/^[-•]\s*/, "");
        }
        continue;
      }
    }

    // Sadece **bold** başlık (yeni yemek olabilir) - ama tarif/malzeme toplarken değil
    if (!collectingField && trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.includes(":")) {
      saveCurrentItem();
      currentItem = { baslik: trimmed.replace(/\*\*/g, "").trim() };
      continue;
    }

    // ### Başlık formatı - ama tarif/malzeme toplarken değil
    if (!collectingField && trimmed.startsWith("###") && currentOgun) {
      saveCurrentItem();
      currentItem = { baslik: trimmed.replace(/^#+\s*/, "").trim() };
      continue;
    }

    // Eğer currentItem varsa ve bu satır bir detay gibi görünüyorsa
    if (currentItem && trimmed.startsWith("-") && !currentItem.baslik) {
      // Önceki satırı başlık olarak kullanmaya çalış
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        if (prevLine && !prevLine.startsWith("-") && !prevLine.startsWith("*")) {
          currentItem.baslik = prevLine.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim();
        }
      }
    }
  }

  // Son öğeyi kaydet
  saveCurrentItem();

  return items;
}

/**
 * Yemekleri öğün tipine göre gruplar
 */
export function gruplaYemekler(items: YemekItem[]): Record<OgunTipi, YemekItem[]> {
  return {
    kahvalti: items.filter(i => i.ogun === "kahvalti"),
    ogle: items.filter(i => i.ogun === "ogle"),
    aksam: items.filter(i => i.ogun === "aksam"),
    ara: items.filter(i => i.ogun === "ara"),
  };
}
