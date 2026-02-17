import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { antrenmanSistemPromptu } from "@/lib/prompts";
import type { AntrenmanRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { checkWeeklyWorkoutLimit, logUsage } from "@/lib/subscription/check-usage";

const MAX_BODY = 10 * 1024;

export async function POST(request: NextRequest) {
  const openai = getOpenAI();
  if (!openai) {
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
    const { hedef, seviye, gunSayisi, ortam, profil, hedefKaslar, lang } = body;
    const userLang = lang || "tr";
    
    // Build user prompt with optional muscle targeting
    let userPrompt = `Goal: ${hedef || "general fitness"}. Level: ${seviye || "intermediate"}. ${gunSayisi ?? 3} days/week. Environment: ${ortam || "gym"}.`;
    
    if (hedefKaslar && hedefKaslar.length > 0) {
      userPrompt += ` PRIORITY MUSCLE GROUPS: ${hedefKaslar.join(", ")}. Create a program targeting these muscle groups with specific exercises.`;
    }
    
    userPrompt += " Create a suitable weekly workout program.";
    const systemPrompt = antrenmanSistemPromptu(profil, userLang);
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
