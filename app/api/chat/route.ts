import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { chatSistemPromptu } from "@/lib/prompts";
import type { ChatRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { checkDailyAiLimit, logUsage } from "@/lib/subscription/check-usage";

const MAX_BODY = 30 * 1024; // Artırıldı: kullanıcı bağlamı daha fazla veri taşıyor

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
      const { allowed, remaining, plan } = await checkDailyAiLimit(user.id);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "Günlük AI mesaj limitinize ulaştınız. Pro plana yükselterek sınırsız mesaj gönderebilirsiniz.",
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
    const body: ChatRequest = JSON.parse(raw);
    const { messages, profil, userContext } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "En az bir mesaj gerekli." },
        { status: 400 }
      );
    }

    // Zengin sistem promptu oluştur
    let systemContent = chatSistemPromptu;

    // Profil bilgileri
    if (profil) {
      const profilParts: string[] = [];
      if (profil.yas) profilParts.push(`Yaş: ${profil.yas}`);
      if (profil.cinsiyet) profilParts.push(`Cinsiyet: ${profil.cinsiyet === "erkek" ? "Erkek" : "Kadın"}`);
      if (profil.kilo) profilParts.push(`Kilo: ${profil.kilo} kg`);
      if (profil.boy) profilParts.push(`Boy: ${profil.boy} cm`);
      if (profil.hedefKilo) profilParts.push(`Hedef kilo: ${profil.hedefKilo} kg`);
      if (profil.hedef && profil.hedef.length > 0) profilParts.push(`Hedefler: ${profil.hedef.join(", ")}`);
      if (profil.seviye) profilParts.push(`Seviye: ${profil.seviye}`);
      if (profil.ortam) profilParts.push(`Antrenman ortamı: ${profil.ortam === "ev" ? "Ev" : "Spor salonu"}`);
      if (profil.gunSayisi) profilParts.push(`Haftalık antrenman: ${profil.gunSayisi} gün`);
      if (profil.kisitlar) profilParts.push(`Kısıtlar: ${profil.kisitlar}`);
      if (profil.sakatlik) profilParts.push(`Sakatlık: ${profil.sakatlik}`);
      if (profil.kronikRahatsizlik) profilParts.push(`Kronik rahatsızlık: ${profil.kronikRahatsizlik}`);
      if (profil.vejetaryenVegan) profilParts.push(`Beslenme tercihi: ${profil.vejetaryenVegan}`);
      if (profil.alerji) profilParts.push(`Alerji: ${profil.alerji}`);
      if (profil.sevmedigiYemekler) profilParts.push(`Sevmediği yemekler: ${profil.sevmedigiYemekler}`);

      if (profilParts.length > 0) {
        systemContent += `\n\n👤 KULLANICI PROFİLİ:\n${profilParts.join("\n")}`;
      }
    }

    // Kullanıcı bağlam bilgisi (antrenman programı, yemek programı, bugün ne yedi, istatistikler)
    if (userContext && userContext.trim()) {
      systemContent += `\n\n${userContext.slice(0, 3000)}`;
    }

    const apiMessages = [
      { role: "system" as const, content: systemContent },
      ...messages
        .filter((m) => m.role && m.content)
        .map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: String(m.content).slice(0, 4000),
        })),
    ];
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      max_tokens: 1500,
    });
    const content =
      completion.choices[0]?.message?.content?.trim() || "Yanıt oluşturulamadı.";

    // Log usage for rate limiting
    if (user) {
      logUsage(user.id, "ai_chat").catch(() => {});
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Sohbet yanıtı oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
