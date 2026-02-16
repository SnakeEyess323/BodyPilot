import { NextRequest, NextResponse } from "next/server";
import { openai, hasOpenAIKey } from "@/lib/openai";
import { antrenmanSistemPromptu } from "@/lib/prompts";
import type { AntrenmanRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { checkWeeklyWorkoutLimit, logUsage } from "@/lib/subscription/check-usage";

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
      const { allowed, remaining, plan } = await checkWeeklyWorkoutLimit(user.id);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "Bu hafta antrenman programı oluşturma limitinize ulaştınız. Pro plana yükselterek sınırsız program oluşturabilirsiniz.",
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
    const body: AntrenmanRequest = JSON.parse(raw);
    const { hedef, seviye, gunSayisi, ortam, profil, hedefKaslar } = body;
    
    // Build user prompt with optional muscle targeting
    let userPrompt = `Hedef: ${hedef || "genel fitness"}. Seviye: ${seviye || "orta"}. Haftalık ${gunSayisi ?? 3} gün. Ortam: ${ortam || "salon"}.`;
    
    if (hedefKaslar && hedefKaslar.length > 0) {
      userPrompt += ` ÖNCELİKLİ KAS GRUPLARI: ${hedefKaslar.join(", ")}. Bu kas gruplarına özel egzersizler içeren, bu kasları hedefleyen bir program oluştur.`;
    }
    
    userPrompt += " Buna uygun haftalık antrenman programını oluştur.";
    const systemPrompt = antrenmanSistemPromptu(profil);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
    });
    const content =
      completion.choices[0]?.message?.content?.trim() ||
      "Program oluşturulamadı.";

    // Log usage for rate limiting
    if (user) {
      logUsage(user.id, "create_workout").catch(() => {});
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Antrenman API error:", err);
    return NextResponse.json(
      { error: "Program oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
