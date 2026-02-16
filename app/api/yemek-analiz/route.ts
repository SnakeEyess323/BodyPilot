import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const MAX_BODY = 10 * 1024;

const SYSTEM_PROMPT = `Sen bir beslenme uzmanısın. Kullanıcı sana yediği bir yemeği yazacak. Sen de o yemeğin yaklaşık besin değerlerini hesapla.

KURALLAR:
- Sadece JSON formatında cevap ver, başka hiçbir şey yazma.
- Porsiyon belirtilmemişse ortalama 1 porsiyon kabul et.
- Değerler yaklaşık olsun ama gerçekçi olsun.
- Türkçe yemek isimlerini tanı.

JSON formatı (başka hiçbir şey yazma):
{
  "baslik": "Yemeğin düzgün adı",
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
    const { yemek } = body as { yemek: string };

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: yemek.trim() },
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
