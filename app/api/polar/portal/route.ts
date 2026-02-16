import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar/server";
import { POLAR_CONFIG } from "@/lib/polar/config";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Kullanıcı doğrulama
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    // Kullanıcının Polar Customer ID'sini al
    const { data: profile } = await supabase
      .from("profiles")
      .select("polar_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.polar_customer_id) {
      return NextResponse.json(
        { error: "Aktif abonelik bulunamadı" },
        { status: 404 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Polar Customer Portal session oluştur
    const session = await polar.customerSessions.create({
      customerId: profile.polar_customer_id,
    });

    // Polar Customer Portal URL'ine yönlendir
    return NextResponse.json({ url: session.customerPortalUrl });
  } catch (error: unknown) {
    console.error("Polar portal error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Portal oturumu oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
