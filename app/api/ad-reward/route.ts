import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/subscription/check-usage";

const VALID_AD_TYPES = ["ai_chat", "workout", "meal"] as const;
type AdType = (typeof VALID_AD_TYPES)[number];

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }

    // Only free users can use ad rewards
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "pro") {
      return NextResponse.json(
        { error: "Pro kullanıcılar zaten sınırsız erişime sahiptir." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const adType = body.adType as AdType;

    if (!adType || !VALID_AD_TYPES.includes(adType)) {
      return NextResponse.json(
        { error: "Geçersiz reklam türü." },
        { status: 400 }
      );
    }

    // Log the ad bonus in usage_logs
    const action = `ad_bonus_${adType}`;
    await logUsage(user.id, action);

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Ad reward error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
