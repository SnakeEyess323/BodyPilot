import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const MAX_BODY = 10 * 1024;

const SYSTEM_PROMPT = `Sen bir beslenme uzmanısın. Kullanıcı sana yediği bir yemeği, miktarını ve birimini yazacak. Sen de o yemeğin yaklaşık besin değerlerini hesapla.

KURALLAR:
- Sadece JSON formatında cevap ver, başka hiçbir şey yazma.
- Kullanıcı miktar ve birim belirtecek, buna göre hesapla.
- Porsiyon belirtilmemişse ortalama 1 porsiyon kabul et.
- Değerler yaklaşık olsun ama gerçekçi olsun.
- Türkçe yemek isimlerini tanı.
- Birimler: gram, porsiyon, tabak, kase, bardak, su bardağı, çay bardağı, fincan, dilim, adet, yemek kaşığı, tatlı kaşığı, çay kaşığı, ml, litre, avuç, paket
- Örneğin: "2 tabak pilav" = yaklaşık 400-500 kalori, "1 kase mercimek çorbası" = yaklaşık 150-200 kalori
- Başlıkta miktarı ve birimi de belirt (örn: "2 Tabak Pilav", "1 Kase Mercimek Çorbası")

JSON formatı (başka hiçbir şey yazma):
{
  "baslik": "Miktarlı yemek adı",
  "kalori": 350,
  "protein": 25,
  "karbonhidrat": 40,
  "yag": 12
}

Sadece yukarıdaki JSON formatında cevap ver. Markdown veya açıklama ekleme.`;

export async function POST(request: NextRequest) {
  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "OpenAI API anahtarı yapılandırılmamış." },
      { status: 500 }
    );
  }
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return NextResponse.json(
        { error: "İstek boyutu çok büyük." },
        { status: 400 }
      );
    }
    const body = JSON.parse(raw);
    const { yemek, miktar, birim } = body as { yemek: string; miktar?: number; birim?: string };

    if (!yemek || yemek.trim().length === 0) {
      return NextResponse.json(
        { error: "Yemek adı boş olamaz." },
        { status: 400 }
      );
    }

    if (yemek.trim().length > 200) {
      return NextResponse.json(
        { error: "Yemek açıklaması çok uzun." },
        { status: 400 }
      );
    }

    // Birim eşleme tablosu (kod key -> Türkçe isim)
    const birimLabels: Record<string, string> = {
      gram: "gram",
      porsiyon: "porsiyon",
      tabak: "tabak",
      kase: "kase",
      bardak: "bardak",
      su_bardagi: "su bardağı",
      cay_bardagi: "çay bardağı",
      fincan: "fincan",
      dilim: "dilim",
      adet: "adet",
      kasik: "yemek kaşığı",
      tatli_kasigi: "tatlı kaşığı",
      cay_kasigi: "çay kaşığı",
      ml: "ml",
      litre: "litre",
      avuc: "avuç",
      paket: "paket",
    };

    // Kullanıcı mesajını oluştur
    let userMessage = yemek.trim();
    if (miktar && birim) {
      const birimLabel = birimLabels[birim] || birim;
      userMessage = `${miktar} ${birimLabel} ${yemek.trim()}`;
    } else if (miktar) {
      userMessage = `${miktar} porsiyon ${yemek.trim()}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const content =
      completion.choices[0]?.message?.content?.trim() || "";

    // JSON parse et
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({
        baslik: parsed.baslik || yemek.trim(),
        kalori: Number(parsed.kalori) || 0,
        protein: Number(parsed.protein) || 0,
        karbonhidrat: Number(parsed.karbonhidrat) || 0,
        yag: Number(parsed.yag) || 0,
      });
    } catch {
      // JSON parse edilemezse ham cevabı döndür
      return NextResponse.json(
        { error: "Besin değerleri analiz edilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Yemek analiz API error:", err);
    return NextResponse.json(
      { error: "Besin değeri hesaplanırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
