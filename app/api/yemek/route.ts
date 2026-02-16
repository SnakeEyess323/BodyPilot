import { NextRequest, NextResponse } from "next/server";
import { openai, hasOpenAIKey } from "@/lib/openai";
import { yemekSistemPromptu } from "@/lib/prompts";
import type { YemekRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { checkWeeklyMealLimit, logUsage } from "@/lib/subscription/check-usage";

const MAX_BODY = 10 * 1024;

export async function POST(request: NextRequest) {
  if (!hasOpenAIKey() || !openai) {
    return NextResponse.json(
      { error: "OpenAI API anahtarı yapılandırılmamış." },
      { status: 500 }
    );
  }
  try {
    // Check auth & rate limit
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { allowed, remaining, plan } = await checkWeeklyMealLimit(user.id);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "Bu hafta yemek programı oluşturma limitinize ulaştınız. Pro plana yükselterek sınırsız program oluşturabilirsiniz.",
            limitReached: true,
            plan,
          },
          { status: 429 }
        );
      }
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return NextResponse.json(
        { error: "İstek boyutu çok büyük." },
        { status: 400 }
      );
    }
    const body: YemekRequest = JSON.parse(raw);
    const { kaloriHedefi, kisitlar, gunSayisi, profil } = body;
    const userPrompt = `Günlük kalori hedefi: ${kaloriHedefi || "günlük ihtiyaca göre"}. Kısıtlar: ${kisitlar || "yok"}. Her öğünde ${gunSayisi ?? 3} farklı yemek seçeneği olan günlük yemek programı oluştur. SADECE öğün bölümleriyle (KAHVALTI, ÖĞLE YEMEĞİ, AKŞAM YEMEĞİ, ARA ÖĞÜN) yaz, gün başlıkları kullanma.`;
    const systemPrompt = yemekSistemPromptu(profil);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
    });
    const content =
      completion.choices[0]?.message?.content?.trim() ||
      "Program oluşturulamadı.";

    // Log usage for rate limiting
    if (user) {
      logUsage(user.id, "create_meal").catch(() => {});
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Yemek API error:", err);
    return NextResponse.json(
      { error: "Yemek programı oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
